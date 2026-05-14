const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// ---------------------------------------------------------------------------
// Helper: fetch latest AI analysis for an entity
// ---------------------------------------------------------------------------

async function getLatestAnalysis(entityType, entityId, userId) {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_analyses
       WHERE entity_type = $1 AND entity_id = $2 AND user_id = $3
       ORDER BY created_at DESC LIMIT 1`,
      [entityType, entityId, userId]
    );
    return result.rows[0] || null;
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: add section header to PDF
// ---------------------------------------------------------------------------

function addSection(doc, title) {
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor('#1a4a2e').font('Helvetica-Bold').text(title);
  doc.moveTo(doc.page.margins.left, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor('#4CAF50').stroke();
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#333333').font('Helvetica');
}

// ---------------------------------------------------------------------------
// GET /api/export/esg-report/:id
// Generates PDF with ESG report + latest AI analysis
// ---------------------------------------------------------------------------

router.get('/esg-report/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch ESG report
    const reportResult = await pool.query(
      'SELECT * FROM esg_reports WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'ESG report not found' });
    }
    const report = reportResult.rows[0];

    // Fetch latest AI analysis
    const analysis = await getLatestAnalysis('esg_reports', id, req.user.id);

    // Fetch related compliance records
    const compliance = await pool.query(
      `SELECT regulation_name, status, compliance_score FROM regulatory_compliance
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    ).catch(() => ({ rows: [] }));

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="esg-report-${id}.pdf"`);

    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 110).fill('#1a4a2e');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text('ESG Sustainability Report', 60, 35);
    doc.fontSize(11).font('Helvetica')
      .text(`${report.company_name || 'Company'}  |  ${report.framework || 'N/A'}  |  ${report.reporting_period || 'N/A'}`, 60, 65);
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 60, 85);
    doc.moveDown(3);

    // Report metadata
    addSection(doc, 'Report Overview');
    const fields = [
      ['Report Title', report.report_title],
      ['Company', report.company_name],
      ['Reporting Period', report.reporting_period],
      ['Framework', report.framework],
      ['Status', report.status],
      ['Overall Rating', report.overall_rating],
    ];
    fields.forEach(([label, value]) => {
      if (value) {
        doc.fillColor('#555555').font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.fillColor('#333333').font('Helvetica').text(String(value));
      }
    });

    // ESG Scores
    addSection(doc, 'ESG Scores');
    const scores = [
      ['Environmental Score', report.environmental_score, '#4CAF50'],
      ['Social Score', report.social_score, '#2196F3'],
      ['Governance Score', report.governance_score, '#9C27B0'],
    ];
    scores.forEach(([label, score, color]) => {
      if (score !== undefined && score !== null) {
        doc.fillColor('#555555').font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.fillColor(color).font('Helvetica-Bold').text(String(score));
      }
    });

    // Summary
    if (report.summary) {
      addSection(doc, 'Executive Summary');
      doc.fillColor('#333333').font('Helvetica').text(report.summary, { align: 'justify' });
    }

    // Regulatory Compliance Summary
    if (compliance.rows.length > 0) {
      addSection(doc, 'Regulatory Compliance Summary');
      compliance.rows.forEach(c => {
        const statusColor = c.status === 'compliant' ? '#4CAF50' : '#F44336';
        doc.fillColor('#555555').font('Helvetica-Bold').text(`${c.regulation_name}: `, { continued: true });
        doc.fillColor(statusColor).font('Helvetica').text(c.status || 'N/A');
      });
    }

    // AI Analysis
    if (analysis) {
      addSection(doc, 'AI Analysis Findings');
      doc.fontSize(8).fillColor('#888888').font('Helvetica')
        .text(`Analysis type: ${analysis.analysis_type}  |  Framework: ${analysis.framework || 'General'}  |  Date: ${new Date(analysis.created_at).toLocaleDateString()}`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333333').text(analysis.result_text, { align: 'justify' });
    } else {
      addSection(doc, 'AI Analysis');
      doc.fillColor('#888888').text('No AI analysis available for this report. Run an analysis from the dashboard.');
    }

    // Footer
    doc.on('pageAdded', () => {
      doc.page.margins.bottom = 40;
    });

    doc.end();
  } catch (err) {
    console.error('Error generating ESG report PDF:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// GET /api/export/carbon-report/:id
// Carbon footprint PDF with Scope 1/2/3 breakdown + AI recommendations
// ---------------------------------------------------------------------------

router.get('/carbon-report/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch carbon footprint record
    const carbonResult = await pool.query(
      'SELECT * FROM carbon_footprints WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (carbonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Carbon footprint record not found' });
    }
    const carbon = carbonResult.rows[0];

    // Fetch latest AI analysis
    const analysis = await getLatestAnalysis('carbon_footprints', id, req.user.id);

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="carbon-report-${id}.pdf"`);

    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 110).fill('#1a3a5c');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text('Carbon Footprint Report', 60, 35);
    doc.fontSize(11).font('Helvetica')
      .text(`${carbon.company_name || 'Company'}  |  Year: ${carbon.reporting_year || 'N/A'}  |  Sector: ${carbon.industry_sector || 'N/A'}`, 60, 65);
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 60, 85);
    doc.moveDown(3);

    // Overview
    addSection(doc, 'Report Overview');
    const metaFields = [
      ['Company', carbon.company_name],
      ['Reporting Year', carbon.reporting_year],
      ['Industry Sector', carbon.industry_sector],
      ['Methodology', carbon.methodology],
      ['Baseline Year', carbon.baseline_year],
      ['Reduction Target', carbon.reduction_target_pct ? `${carbon.reduction_target_pct}%` : null],
      ['Status', carbon.status],
    ];
    metaFields.forEach(([label, value]) => {
      if (value) {
        doc.fillColor('#555555').font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.fillColor('#333333').font('Helvetica').text(String(value));
      }
    });

    // Emissions Breakdown (Scope 1/2/3)
    addSection(doc, 'GHG Emissions Breakdown');
    const totalEmissions = parseFloat(carbon.total_emissions) || 0;
    const scope1 = parseFloat(carbon.scope1_emissions) || 0;
    const scope2 = parseFloat(carbon.scope2_emissions) || 0;
    const scope3 = parseFloat(carbon.scope3_emissions) || 0;

    const scopeData = [
      ['Scope 1 (Direct)', scope1, '#E53935'],
      ['Scope 2 (Energy Indirect)', scope2, '#FB8C00'],
      ['Scope 3 (Value Chain)', scope3, '#FDD835'],
      ['Total Emissions', totalEmissions, '#1a3a5c'],
    ];
    scopeData.forEach(([label, value, color]) => {
      const pct = totalEmissions > 0 && label !== 'Total Emissions'
        ? ` (${((value / totalEmissions) * 100).toFixed(1)}%)`
        : '';
      doc.fillColor('#555555').font('Helvetica-Bold').text(`${label}: `, { continued: true });
      doc.fillColor(color).font('Helvetica-Bold').text(`${value.toFixed(2)} tCO₂e${pct}`);
    });

    // Visual bar representation
    doc.moveDown(0.5);
    const maxScope = Math.max(scope1, scope2, scope3, 1);
    const barWidth = 300;
    const barHeight = 14;
    const barX = 100;
    const scopes = [
      { label: 'Scope 1', value: scope1, color: '#E53935' },
      { label: 'Scope 2', value: scope2, color: '#FB8C00' },
      { label: 'Scope 3', value: scope3, color: '#FDD835' },
    ];
    scopes.forEach(s => {
      const w = Math.max((s.value / maxScope) * barWidth, 4);
      doc.fontSize(9).fillColor('#555555').font('Helvetica').text(s.label, barX - 70, doc.y, { width: 65, align: 'right', continued: false });
      const barY = doc.y - 11;
      doc.rect(barX, barY, w, barHeight).fill(s.color);
      doc.fillColor('#333333').font('Helvetica').text(` ${s.value.toFixed(1)} tCO₂e`, barX + w + 4, barY + 2);
      doc.moveDown(0.6);
    });

    // AI Recommendations
    if (analysis) {
      addSection(doc, 'AI Decarbonization Recommendations');
      doc.fontSize(8).fillColor('#888888').font('Helvetica')
        .text(`Analysis date: ${new Date(analysis.created_at).toLocaleDateString()}  |  Framework: ${analysis.framework || 'GHG Protocol'}`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333333').text(analysis.result_text, { align: 'justify' });
    } else {
      addSection(doc, 'AI Recommendations');
      doc.fillColor('#888888').text('No AI analysis available. Run carbon analysis from the dashboard to generate recommendations.');
    }

    doc.end();
  } catch (err) {
    console.error('Error generating carbon report PDF:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
    }
  }
});

module.exports = router;
