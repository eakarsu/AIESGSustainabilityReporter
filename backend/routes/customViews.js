/**
 * Custom Views routes (ESG sustainability reporting)
 * Mounted at /api/custom-views
 *
 * Endpoints:
 *   GET  /esg-score-trend       - VIZ:    E/S/G composite trend over reporting periods
 *   GET  /metric-heatmap        - VIZ:    metric x reporting_period heatmap matrix
 *   GET  /annual-report.pdf     - NONVIZ: streamed PDF (annual ESG report)
 *   /framework-rules            - NONVIZ: CRUD GRI/SASB/TCFD disclosure rules
 *                                  GET (list), POST (create), PUT/:id, DELETE/:id
 *
 * All routes require auth (JWT). The CRUD routes for framework rules use
 * a self-managed table `framework_rules` that is created on demand.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const PDFDocument = require('pdfkit');

const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// ---------------------------------------------------------------------------
// Rate limiter (scoped to this router) — use ipKeyGenerator helper if present
// ---------------------------------------------------------------------------
let keyGen;
try {
  const erl = require('express-rate-limit');
  if (typeof erl.ipKeyGenerator === 'function') {
    keyGen = (req) => (req.user ? `user:${req.user.id}` : erl.ipKeyGenerator(req));
  }
} catch (_e) { /* ignore */ }
if (!keyGen) {
  keyGen = (req) => (req.user ? `user:${req.user.id}` : (req.ip || 'unknown'));
}

const customViewsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  message: { error: 'Too many custom-view requests, slow down.' },
});

router.use(customViewsLimiter);

// ---------------------------------------------------------------------------
// Bootstrap: framework_rules table (idempotent)
// ---------------------------------------------------------------------------
async function ensureFrameworkRulesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS framework_rules (
      id SERIAL PRIMARY KEY,
      framework VARCHAR(20) NOT NULL,
      code VARCHAR(80) NOT NULL,
      pillar VARCHAR(20) NOT NULL,
      metric_name VARCHAR(255),
      description TEXT,
      mapping TEXT,
      mandatory BOOLEAN DEFAULT false,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Seed a handful of GRI / SASB / TCFD mappings per user the first time.
  // We keep this idempotent: only seed if the row count for the user is 0.
}

async function seedRulesForUserIfEmpty(userId) {
  const c = await pool.query(
    'SELECT COUNT(*)::int AS n FROM framework_rules WHERE user_id = $1',
    [userId]
  );
  if (c.rows[0].n > 0) return;

  const seeds = [
    ['GRI',  'GRI 305-1', 'environmental', 'Direct GHG Emissions (Scope 1)',           'Direct emissions from owned/controlled sources',                  'carbon_footprints.scope1_emissions',     true],
    ['GRI',  'GRI 305-2', 'environmental', 'Energy Indirect GHG Emissions (Scope 2)',  'Indirect emissions from purchased energy',                        'carbon_footprints.scope2_emissions',     true],
    ['GRI',  'GRI 305-3', 'environmental', 'Other Indirect GHG Emissions (Scope 3)',   'Value-chain emissions outside Scope 1/2',                         'carbon_footprints.scope3_emissions',     true],
    ['GRI',  'GRI 303-3', 'environmental', 'Water Withdrawal',                          'Total water withdrawn by source',                                 'water_usage.withdrawal_volume',          true],
    ['GRI',  'GRI 405-1', 'social',        'Board Gender Diversity',                    'Diversity of governance bodies and employees',                    'sustainability_metrics.board_diversity', true],
    ['SASB', 'SASB EM-MM-110a.1', 'environmental', 'Gross global Scope 1 emissions',  'Metals & mining sector emissions disclosure',                     'carbon_footprints.scope1_emissions',     true],
    ['SASB', 'SASB FN-CB-410a.2', 'governance',    'Climate finance risk',            'Banking climate-related financial risk exposure',                 'risk_assessments.climate_risk',          false],
    ['TCFD', 'TCFD Gov-a',  'governance',    'Board oversight of climate risk',         'Board oversight of climate-related risks and opportunities',     'governance_compliance.climate_oversight', true],
    ['TCFD', 'TCFD Strat-c', 'governance',   'Resilience of strategy under 2C',         'Strategy resilience under different climate scenarios',          'climate_scenarios.scenario_2c',          true],
    ['TCFD', 'TCFD Met-b',   'environmental', 'Scope 1, 2, 3 GHG metrics',              'Disclosure of cross-industry climate metrics',                   'carbon_footprints.total_emissions',      true],
  ];

  for (const s of seeds) {
    await pool.query(
      `INSERT INTO framework_rules
        (framework, code, pillar, metric_name, description, mapping, mandatory, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [...s, userId]
    );
  }
}

// ---------------------------------------------------------------------------
// VIZ #1 - GET /esg-score-trend
// Returns time-ordered E/S/G/composite scores grouped by reporting_period.
// ---------------------------------------------------------------------------
router.get('/esg-score-trend', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT reporting_period,
              ROUND(AVG(environmental_score)::numeric, 2) AS environmental,
              ROUND(AVG(social_score)::numeric, 2)        AS social,
              ROUND(AVG(governance_score)::numeric, 2)    AS governance,
              ROUND(((AVG(environmental_score) + AVG(social_score) + AVG(governance_score)) / 3.0)::numeric, 2) AS composite,
              COUNT(*)::int AS report_count
       FROM esg_reports
       WHERE user_id = $1 AND reporting_period IS NOT NULL
       GROUP BY reporting_period
       ORDER BY reporting_period ASC`,
      [req.user.id]
    );

    res.json({
      ok: true,
      type: 'esg-score-trend',
      generated_at: new Date().toISOString(),
      points: result.rows,
    });
  } catch (err) {
    console.error('esg-score-trend error:', err);
    res.status(500).json({ error: 'Failed to build ESG score trend' });
  }
});

// ---------------------------------------------------------------------------
// VIZ #2 - GET /metric-heatmap
// Returns a metric x reporting_period (measurement_period) matrix.
// Cell values are normalized (current_value / target_value) bounded to [0..1.5].
// ---------------------------------------------------------------------------
router.get('/metric-heatmap', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT metric_name,
              measurement_period,
              category,
              MAX(current_value) AS current_value,
              MAX(target_value)  AS target_value
       FROM sustainability_metrics
       WHERE user_id = $1
         AND metric_name IS NOT NULL
         AND measurement_period IS NOT NULL
       GROUP BY metric_name, measurement_period, category
       ORDER BY metric_name ASC, measurement_period ASC`,
      [req.user.id]
    );

    const metricSet = new Set();
    const periodSet = new Set();
    const cells = [];

    for (const row of result.rows) {
      metricSet.add(row.metric_name);
      periodSet.add(row.measurement_period);

      const cur = Number(row.current_value) || 0;
      const tgt = Number(row.target_value) || 0;
      let intensity;
      if (tgt > 0) {
        intensity = Math.min(1.5, cur / tgt);
      } else {
        intensity = cur > 0 ? 1 : 0;
      }
      cells.push({
        metric: row.metric_name,
        period: row.measurement_period,
        category: row.category,
        current_value: cur,
        target_value: tgt,
        intensity: Number(intensity.toFixed(3)),
      });
    }

    res.json({
      ok: true,
      type: 'metric-heatmap',
      generated_at: new Date().toISOString(),
      metrics: [...metricSet],
      periods: [...periodSet],
      cells,
    });
  } catch (err) {
    console.error('metric-heatmap error:', err);
    res.status(500).json({ error: 'Failed to build metric heatmap' });
  }
});

// ---------------------------------------------------------------------------
// NON-VIZ #1 - GET /annual-report.pdf
// Streams a multi-section annual ESG PDF report for the authenticated user.
// ---------------------------------------------------------------------------
router.get('/annual-report.pdf', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [reports, footprints, metrics] = await Promise.all([
      pool.query(
        `SELECT company_name, report_title, reporting_period, framework,
                environmental_score, social_score, governance_score,
                overall_rating, status
         FROM esg_reports WHERE user_id = $1
         ORDER BY reporting_period DESC LIMIT 20`,
        [userId]
      ),
      pool.query(
        `SELECT company_name, reporting_year, scope1_emissions,
                scope2_emissions, scope3_emissions, total_emissions
         FROM carbon_footprints WHERE user_id = $1
         ORDER BY reporting_year DESC LIMIT 20`,
        [userId]
      ),
      pool.query(
        `SELECT metric_name, category, current_value, target_value, unit, trend
         FROM sustainability_metrics WHERE user_id = $1
         ORDER BY category ASC, metric_name ASC LIMIT 40`,
        [userId]
      ),
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      'attachment; filename="annual-esg-report.pdf"');

    const doc = new PDFDocument({ margin: 48, size: 'LETTER' });
    doc.pipe(res);

    // Cover
    doc.fontSize(24).fillColor('#1a7a4a').text('Annual ESG Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#444').text(
      `Generated ${new Date().toISOString().slice(0, 10)} for ${req.user.email || ('user ' + userId)}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    // Composite KPI
    let envSum = 0, socSum = 0, govSum = 0, n = 0;
    for (const r of reports.rows) {
      envSum += Number(r.environmental_score) || 0;
      socSum += Number(r.social_score) || 0;
      govSum += Number(r.governance_score) || 0;
      n++;
    }
    const envAvg = n ? envSum / n : 0;
    const socAvg = n ? socSum / n : 0;
    const govAvg = n ? govSum / n : 0;
    const composite = (envAvg + socAvg + govAvg) / 3;

    doc.fontSize(14).fillColor('#000').text('Composite ESG Scorecard');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#222');
    doc.text(`  Environmental average : ${envAvg.toFixed(1)}`);
    doc.text(`  Social average        : ${socAvg.toFixed(1)}`);
    doc.text(`  Governance average    : ${govAvg.toFixed(1)}`);
    doc.text(`  Composite             : ${composite.toFixed(1)}`);
    doc.text(`  Reports included      : ${n}`);
    doc.moveDown(1);

    // Reports section
    doc.fontSize(14).fillColor('#000').text('ESG Reports');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#222');
    if (reports.rows.length === 0) {
      doc.text('  (no ESG reports for this account)');
    } else {
      reports.rows.forEach((r, i) => {
        doc.text(
          `  ${i + 1}. ${r.company_name || 'n/a'} — ${r.report_title || ''} ` +
          `[${r.framework || '?'} / ${r.reporting_period || '?'}] ` +
          `E=${r.environmental_score ?? '-'} S=${r.social_score ?? '-'} G=${r.governance_score ?? '-'} ` +
          `rating=${r.overall_rating || '-'} status=${r.status || '-'}`
        );
      });
    }
    doc.moveDown(1);

    // Carbon footprint
    doc.fontSize(14).fillColor('#000').text('Carbon Footprint Snapshot');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#222');
    if (footprints.rows.length === 0) {
      doc.text('  (no carbon footprint records)');
    } else {
      footprints.rows.forEach((r, i) => {
        doc.text(
          `  ${i + 1}. ${r.company_name || 'n/a'} (${r.reporting_year || '?'}): ` +
          `S1=${r.scope1_emissions ?? '-'} S2=${r.scope2_emissions ?? '-'} ` +
          `S3=${r.scope3_emissions ?? '-'} total=${r.total_emissions ?? '-'}`
        );
      });
    }
    doc.moveDown(1);

    // Metrics
    doc.fontSize(14).fillColor('#000').text('Sustainability Metrics');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#222');
    if (metrics.rows.length === 0) {
      doc.text('  (no metrics)');
    } else {
      metrics.rows.forEach((r) => {
        doc.text(
          `  [${r.category || '?'}] ${r.metric_name}: ` +
          `${r.current_value ?? '-'} ${r.unit || ''} ` +
          `(target ${r.target_value ?? '-'}, trend ${r.trend || '-'})`
        );
      });
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#888').text(
      'This report was generated automatically by the ESG Sustainability Reporter.',
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    console.error('annual-report.pdf error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF report' });
    } else {
      try { res.end(); } catch (_) { /* ignore */ }
    }
  }
});

// ---------------------------------------------------------------------------
// NON-VIZ #2 - /framework-rules  (CRUD)
// ---------------------------------------------------------------------------
router.get('/framework-rules', authenticateToken, async (req, res) => {
  try {
    await ensureFrameworkRulesTable();
    await seedRulesForUserIfEmpty(req.user.id);

    const { framework, pillar } = req.query;
    const params = [req.user.id];
    let where = 'user_id = $1';
    if (framework) { params.push(framework); where += ` AND framework = $${params.length}`; }
    if (pillar)    { params.push(pillar);    where += ` AND pillar = $${params.length}`;    }

    const result = await pool.query(
      `SELECT * FROM framework_rules WHERE ${where}
       ORDER BY framework ASC, code ASC`,
      params
    );
    res.json({ ok: true, data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('framework-rules GET error:', err);
    res.status(500).json({ error: 'Failed to list framework rules' });
  }
});

router.post('/framework-rules', authenticateToken, async (req, res) => {
  try {
    await ensureFrameworkRulesTable();
    const { framework, code, pillar, metric_name, description, mapping, mandatory } = req.body || {};
    if (!framework || !code || !pillar) {
      return res.status(400).json({ error: 'framework, code, and pillar are required' });
    }

    const allowedFw = ['GRI', 'SASB', 'TCFD'];
    if (!allowedFw.includes(framework)) {
      return res.status(400).json({ error: `framework must be one of ${allowedFw.join(', ')}` });
    }
    const allowedPillar = ['environmental', 'social', 'governance'];
    if (!allowedPillar.includes(pillar)) {
      return res.status(400).json({ error: `pillar must be one of ${allowedPillar.join(', ')}` });
    }

    const result = await pool.query(
      `INSERT INTO framework_rules
        (framework, code, pillar, metric_name, description, mapping, mandatory, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [framework, code, pillar, metric_name || null, description || null,
       mapping || null, !!mandatory, req.user.id]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error('framework-rules POST error:', err);
    res.status(500).json({ error: 'Failed to create framework rule' });
  }
});

router.put('/framework-rules/:id', authenticateToken, async (req, res) => {
  try {
    await ensureFrameworkRulesTable();
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });

    const { framework, code, pillar, metric_name, description, mapping, mandatory } = req.body || {};
    const result = await pool.query(
      `UPDATE framework_rules SET
        framework   = COALESCE($1, framework),
        code        = COALESCE($2, code),
        pillar      = COALESCE($3, pillar),
        metric_name = COALESCE($4, metric_name),
        description = COALESCE($5, description),
        mapping     = COALESCE($6, mapping),
        mandatory   = COALESCE($7, mandatory),
        updated_at  = NOW()
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [framework || null, code || null, pillar || null,
       metric_name || null, description || null, mapping || null,
       (typeof mandatory === 'boolean') ? mandatory : null,
       id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error('framework-rules PUT error:', err);
    res.status(500).json({ error: 'Failed to update framework rule' });
  }
});

router.delete('/framework-rules/:id', authenticateToken, async (req, res) => {
  try {
    await ensureFrameworkRulesTable();
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });

    const result = await pool.query(
      'DELETE FROM framework_rules WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, deleted: result.rows[0].id });
  } catch (err) {
    console.error('framework-rules DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete framework rule' });
  }
});

module.exports = router;
