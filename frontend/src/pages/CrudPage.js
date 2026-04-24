import React, { useState, useEffect, useCallback } from 'react';
import { getAll, createItem, updateItem, deleteItem } from '../services/api';

// ---------------------------------------------------------------------------
// Field configurations for all 15 resources
// ---------------------------------------------------------------------------

const fieldConfigs = {
  'esg-reports': {
    displayName: 'ESG Report',
    columns: ['company_name', 'report_title', 'framework', 'overall_rating', 'status'],
    formFields: [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true },
      { name: 'report_title', label: 'Report Title', type: 'text', required: true },
      { name: 'reporting_period', label: 'Reporting Period', type: 'text' },
      { name: 'framework', label: 'Framework', type: 'select', options: ['GRI', 'SASB', 'TCFD', 'CDP', 'ISSB'] },
      { name: 'environmental_score', label: 'Environmental Score', type: 'number' },
      { name: 'social_score', label: 'Social Score', type: 'number' },
      { name: 'governance_score', label: 'Governance Score', type: 'number' },
      { name: 'overall_rating', label: 'Overall Rating', type: 'select', options: ['A+', 'A', 'B+', 'B', 'C', 'D'] },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'review', 'published', 'archived'] },
      { name: 'summary', label: 'Summary', type: 'textarea' },
    ],
  },
  'carbon-footprints': {
    displayName: 'Carbon Footprint',
    columns: ['company_name', 'reporting_year', 'total_emissions', 'industry_sector', 'status'],
    formFields: [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true },
      { name: 'reporting_year', label: 'Reporting Year', type: 'number', required: true },
      { name: 'scope1_emissions', label: 'Scope 1 Emissions (tCO2e)', type: 'number' },
      { name: 'scope2_emissions', label: 'Scope 2 Emissions (tCO2e)', type: 'number' },
      { name: 'scope3_emissions', label: 'Scope 3 Emissions (tCO2e)', type: 'number' },
      { name: 'total_emissions', label: 'Total Emissions (tCO2e)', type: 'number' },
      { name: 'reduction_target_pct', label: 'Reduction Target %', type: 'number' },
      { name: 'baseline_year', label: 'Baseline Year', type: 'number' },
      { name: 'industry_sector', label: 'Industry Sector', type: 'text' },
      { name: 'methodology', label: 'Methodology', type: 'select', options: ['GHG Protocol', 'ISO 14064', 'CDP'] },
      { name: 'status', label: 'Status', type: 'select', options: ['calculated', 'verified', 'reported'] },
    ],
  },
  'sustainability-metrics': {
    displayName: 'Sustainability Metric',
    columns: ['metric_name', 'category', 'current_value', 'trend', 'status'],
    formFields: [
      { name: 'metric_name', label: 'Metric Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['environmental', 'social', 'governance'] },
      { name: 'current_value', label: 'Current Value', type: 'number' },
      { name: 'target_value', label: 'Target Value', type: 'number' },
      { name: 'unit', label: 'Unit', type: 'text' },
      { name: 'trend', label: 'Trend', type: 'select', options: ['improving', 'declining', 'stable'] },
      { name: 'measurement_period', label: 'Measurement Period', type: 'text' },
      { name: 'data_source', label: 'Data Source', type: 'text' },
      { name: 'confidence_level', label: 'Confidence Level', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'archived'] },
    ],
  },
  'regulatory-compliance': {
    displayName: 'Regulation',
    columns: ['regulation_name', 'jurisdiction', 'compliance_status', 'risk_level', 'status'],
    formFields: [
      { name: 'regulation_name', label: 'Regulation Name', type: 'text', required: true },
      { name: 'jurisdiction', label: 'Jurisdiction', type: 'text' },
      { name: 'compliance_status', label: 'Compliance Status', type: 'select', options: ['compliant', 'non_compliant', 'partial', 'pending'] },
      { name: 'due_date', label: 'Due Date', type: 'date' },
      { name: 'last_audit_date', label: 'Last Audit Date', type: 'date' },
      { name: 'risk_level', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'responsible_party', label: 'Responsible Party', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'penalty_amount', label: 'Penalty Amount ($)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'resolved', 'monitoring'] },
    ],
  },
  'supply-chain': {
    displayName: 'Supplier',
    columns: ['supplier_name', 'country', 'esg_score', 'risk_level', 'status'],
    formFields: [
      { name: 'supplier_name', label: 'Supplier Name', type: 'text', required: true },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'industry', label: 'Industry', type: 'text' },
      { name: 'esg_score', label: 'ESG Score', type: 'number' },
      { name: 'environmental_rating', label: 'Environmental Rating', type: 'select', options: ['A', 'B', 'C', 'D', 'F'] },
      { name: 'social_rating', label: 'Social Rating', type: 'select', options: ['A', 'B', 'C', 'D', 'F'] },
      { name: 'governance_rating', label: 'Governance Rating', type: 'select', options: ['A', 'B', 'C', 'D', 'F'] },
      { name: 'risk_level', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'audit_date', label: 'Audit Date', type: 'date' },
      { name: 'certification', label: 'Certification', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['approved', 'under_review', 'flagged', 'blacklisted'] },
    ],
  },
  'risk-assessments': {
    displayName: 'Risk Assessment',
    columns: ['risk_name', 'category', 'likelihood', 'impact_level', 'status'],
    formFields: [
      { name: 'risk_name', label: 'Risk Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['climate', 'regulatory', 'reputational', 'operational', 'financial'] },
      { name: 'likelihood', label: 'Likelihood', type: 'select', options: ['low', 'medium', 'high', 'very_high'] },
      { name: 'impact_level', label: 'Impact Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'risk_score', label: 'Risk Score', type: 'number' },
      { name: 'mitigation_strategy', label: 'Mitigation Strategy', type: 'textarea' },
      { name: 'owner', label: 'Owner', type: 'text' },
      { name: 'review_date', label: 'Review Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['identified', 'mitigated', 'monitoring', 'closed'] },
    ],
  },
  'greenwashing': {
    displayName: 'Greenwashing Check',
    columns: ['company_name', 'verification_status', 'confidence_score', 'severity', 'status'],
    formFields: [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true },
      { name: 'claim_text', label: 'Claim Text', type: 'textarea', required: true },
      { name: 'claim_source', label: 'Claim Source', type: 'text' },
      { name: 'verification_status', label: 'Verification Status', type: 'select', options: ['verified', 'unverified', 'misleading', 'greenwashing'] },
      { name: 'confidence_score', label: 'Confidence Score', type: 'number' },
      { name: 'evidence_found', label: 'Evidence Found', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'select', options: ['emissions', 'energy', 'waste', 'water', 'social'] },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'reviewed', 'flagged', 'cleared'] },
    ],
  },
  'stakeholder-reports': {
    displayName: 'Stakeholder Report',
    columns: ['report_title', 'stakeholder_group', 'report_type', 'fiscal_year', 'status'],
    formFields: [
      { name: 'report_title', label: 'Report Title', type: 'text', required: true },
      { name: 'stakeholder_group', label: 'Stakeholder Group', type: 'select', options: ['investors', 'employees', 'community', 'regulators', 'customers'] },
      { name: 'report_type', label: 'Report Type', type: 'select', options: ['annual', 'quarterly', 'ad_hoc', 'crisis'] },
      { name: 'fiscal_year', label: 'Fiscal Year', type: 'number' },
      { name: 'key_highlights', label: 'Key Highlights', type: 'textarea' },
      { name: 'material_topics', label: 'Material Topics', type: 'textarea' },
      { name: 'engagement_score', label: 'Engagement Score', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'review', 'approved', 'published'] },
    ],
  },
  'data-validations': {
    displayName: 'Data Validation',
    columns: ['dataset_name', 'validation_type', 'error_rate', 'severity', 'status'],
    formFields: [
      { name: 'dataset_name', label: 'Dataset Name', type: 'text', required: true },
      { name: 'data_source', label: 'Data Source', type: 'text' },
      { name: 'validation_type', label: 'Validation Type', type: 'select', options: ['completeness', 'accuracy', 'consistency', 'timeliness'] },
      { name: 'records_checked', label: 'Records Checked', type: 'number' },
      { name: 'errors_found', label: 'Errors Found', type: 'number' },
      { name: 'error_rate', label: 'Error Rate (%)', type: 'number' },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'issues_description', label: 'Issues Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'validated', 'failed', 'needs_review'] },
    ],
  },
  'climate-scenarios': {
    displayName: 'Climate Scenario',
    columns: ['scenario_name', 'temperature_pathway', 'time_horizon', 'financial_impact_millions', 'status'],
    formFields: [
      { name: 'scenario_name', label: 'Scenario Name', type: 'text', required: true },
      { name: 'temperature_pathway', label: 'Temperature Pathway', type: 'select', options: ['1.5C', '2C', '3C', '4C'] },
      { name: 'time_horizon', label: 'Time Horizon', type: 'select', options: ['2030', '2040', '2050'] },
      { name: 'physical_risk_level', label: 'Physical Risk', type: 'select', options: ['low', 'medium', 'high', 'extreme'] },
      { name: 'transition_risk_level', label: 'Transition Risk', type: 'select', options: ['low', 'medium', 'high', 'extreme'] },
      { name: 'financial_impact_millions', label: 'Financial Impact ($M)', type: 'number' },
      { name: 'sector', label: 'Sector', type: 'text' },
      { name: 'assumptions', label: 'Assumptions', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'modeled', 'reviewed', 'approved'] },
    ],
  },
  'biodiversity': {
    displayName: 'Biodiversity Impact',
    columns: ['project_name', 'ecosystem_type', 'impact_type', 'biodiversity_score', 'status'],
    formFields: [
      { name: 'project_name', label: 'Project Name', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'ecosystem_type', label: 'Ecosystem Type', type: 'select', options: ['forest', 'marine', 'wetland', 'grassland', 'urban'] },
      { name: 'species_affected', label: 'Species Affected', type: 'number' },
      { name: 'habitat_area_hectares', label: 'Habitat Area (ha)', type: 'number' },
      { name: 'impact_type', label: 'Impact Type', type: 'select', options: ['positive', 'negative', 'neutral'] },
      { name: 'mitigation_measures', label: 'Mitigation Measures', type: 'textarea' },
      { name: 'biodiversity_score', label: 'Biodiversity Score', type: 'number' },
      { name: 'monitoring_frequency', label: 'Monitoring Frequency', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['monitoring', 'restored', 'degraded', 'stable'] },
    ],
  },
  'water-usage': {
    displayName: 'Water Usage',
    columns: ['facility_name', 'water_source', 'consumption_cubic_meters', 'recycled_pct', 'status'],
    formFields: [
      { name: 'facility_name', label: 'Facility Name', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'water_source', label: 'Water Source', type: 'select', options: ['municipal', 'groundwater', 'surface', 'recycled'] },
      { name: 'consumption_cubic_meters', label: 'Consumption (m\u00B3)', type: 'number' },
      { name: 'discharge_cubic_meters', label: 'Discharge (m\u00B3)', type: 'number' },
      { name: 'recycled_pct', label: 'Recycled %', type: 'number' },
      { name: 'water_stress_level', label: 'Water Stress', type: 'select', options: ['low', 'medium', 'high', 'extreme'] },
      { name: 'quality_index', label: 'Quality Index', type: 'number' },
      { name: 'reduction_target_pct', label: 'Reduction Target %', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['within_target', 'exceeding', 'critical'] },
    ],
  },
  'energy-audits': {
    displayName: 'Energy Audit',
    columns: ['facility_name', 'efficiency_rating', 'renewable_pct', 'annual_cost', 'status'],
    formFields: [
      { name: 'facility_name', label: 'Facility Name', type: 'text', required: true },
      { name: 'audit_date', label: 'Audit Date', type: 'date' },
      { name: 'total_consumption_kwh', label: 'Total Consumption (kWh)', type: 'number' },
      { name: 'renewable_pct', label: 'Renewable %', type: 'number' },
      { name: 'efficiency_rating', label: 'Efficiency Rating', type: 'select', options: ['A', 'B', 'C', 'D', 'F'] },
      { name: 'carbon_intensity', label: 'Carbon Intensity', type: 'number' },
      { name: 'cost_per_kwh', label: 'Cost per kWh ($)', type: 'number' },
      { name: 'annual_cost', label: 'Annual Cost ($)', type: 'number' },
      { name: 'savings_potential_pct', label: 'Savings Potential %', type: 'number' },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in_progress', 'completed', 'action_required'] },
    ],
  },
  'social-impact': {
    displayName: 'Social Impact Program',
    columns: ['program_name', 'category', 'beneficiaries_count', 'impact_score', 'status'],
    formFields: [
      { name: 'program_name', label: 'Program Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['diversity', 'health_safety', 'community', 'labor_rights', 'education'] },
      { name: 'beneficiaries_count', label: 'Beneficiaries Count', type: 'number' },
      { name: 'investment_amount', label: 'Investment Amount ($)', type: 'number' },
      { name: 'impact_score', label: 'Impact Score', type: 'number' },
      { name: 'measurement_method', label: 'Measurement Method', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'start_date', label: 'Start Date', type: 'date' },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['planned', 'active', 'completed', 'suspended'] },
    ],
  },
  'governance': {
    displayName: 'Governance Policy',
    columns: ['policy_name', 'category', 'compliance_level', 'risk_rating', 'status'],
    formFields: [
      { name: 'policy_name', label: 'Policy Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['board', 'ethics', 'transparency', 'anti_corruption', 'data_privacy'] },
      { name: 'compliance_level', label: 'Compliance Level (%)', type: 'number' },
      { name: 'last_review_date', label: 'Last Review Date', type: 'date' },
      { name: 'next_review_date', label: 'Next Review Date', type: 'date' },
      { name: 'responsible_officer', label: 'Responsible Officer', type: 'text' },
      { name: 'violations_count', label: 'Violations Count', type: 'number' },
      { name: 'training_completion_pct', label: 'Training Completion %', type: 'number' },
      { name: 'risk_rating', label: 'Risk Rating', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'status', label: 'Status', type: 'select', options: ['compliant', 'non_compliant', 'under_review', 'remediation'] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Status color helpers
// ---------------------------------------------------------------------------

const GOOD_STATUSES = new Set([
  'published', 'compliant', 'approved', 'verified', 'active', 'completed',
  'mitigated', 'closed', 'cleared', 'validated', 'reviewed', 'modeled',
  'restored', 'within_target', 'stable', 'improving', 'positive',
]);

const BAD_STATUSES = new Set([
  'non_compliant', 'critical', 'high', 'blacklisted', 'flagged', 'failed',
  'greenwashing', 'misleading', 'degraded', 'exceeding', 'extreme',
  'declining', 'negative', 'very_high', 'action_required', 'suspended',
]);

const WARNING_STATUSES = new Set([
  'draft', 'review', 'pending', 'under_review', 'partial', 'monitoring',
  'identified', 'unverified', 'needs_review', 'medium', 'in_progress',
  'scheduled', 'planned', 'remediation', 'calculated', 'reported',
  'ad_hoc', 'crisis', 'neutral',
]);

function getStatusColor(value) {
  if (value == null) return null;
  const v = String(value).toLowerCase().replace(/\s+/g, '_');
  if (GOOD_STATUSES.has(v)) return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
  if (BAD_STATUSES.has(v)) return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
  if (WARNING_STATUSES.has(v)) return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
  return null;
}

// ---------------------------------------------------------------------------
// Value formatting helpers
// ---------------------------------------------------------------------------

function formatColumnHeader(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Pct\b/i, '%');
}

function formatValue(value, fieldName) {
  if (value == null || value === '') return '\u2014';

  // Dates
  if (fieldName && (fieldName.includes('date') || fieldName.includes('_date'))) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }

  // Percentage fields
  if (fieldName && (fieldName.includes('_pct') || fieldName.includes('percentage'))) {
    const num = Number(value);
    if (!isNaN(num)) return `${num.toLocaleString()}%`;
  }

  // Currency / cost / amount / penalty fields
  if (fieldName && (fieldName.includes('cost') || fieldName.includes('amount') || fieldName.includes('penalty'))) {
    const num = Number(value);
    if (!isNaN(num)) return `$${num.toLocaleString()}`;
  }

  // Financial impact in millions
  if (fieldName && fieldName.includes('millions')) {
    const num = Number(value);
    if (!isNaN(num)) return `$${num.toLocaleString()}M`;
  }

  // Generic numbers
  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  // Underscored enum values
  if (typeof value === 'string' && value.includes('_')) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return String(value);
}

// ---------------------------------------------------------------------------
// AI Analysis renderer
// ---------------------------------------------------------------------------

function renderAiAnalysis(analysis) {
  if (!analysis) return null;

  // If it's a string, parse simple markdown
  if (typeof analysis === 'string') {
    return <AiTextBlock text={analysis} />;
  }

  // If it's an object, render key-value sections
  if (typeof analysis === 'object' && !Array.isArray(analysis)) {
    return (
      <div>
        {Object.entries(analysis).map(([key, val]) => (
          <div key={key} style={styles.aiSection}>
            <h4 style={styles.aiSectionTitle}>{formatColumnHeader(key)}</h4>
            {typeof val === 'string' ? (
              <AiTextBlock text={val} />
            ) : Array.isArray(val) ? (
              <ul style={styles.aiBulletList}>
                {val.map((item, i) => (
                  <li key={i} style={styles.aiBulletItem}>
                    {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                  </li>
                ))}
              </ul>
            ) : typeof val === 'number' ? (
              <span style={styles.aiNumber}>{val.toLocaleString()}</span>
            ) : typeof val === 'object' && val !== null ? (
              <pre style={styles.aiPre}>{JSON.stringify(val, null, 2)}</pre>
            ) : (
              <span>{String(val)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Fallback
  return <pre style={styles.aiPre}>{JSON.stringify(analysis, null, 2)}</pre>;
}

function AiTextBlock({ text }) {
  // Parse simple markdown-like content: headers (##), bullets (- or *), bold (**), newlines
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={styles.aiBulletList}>
          {currentList.map((item, i) => (
            <li key={i} style={styles.aiBulletItem}>
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h5 key={idx} style={styles.aiH3}>{renderInlineFormatting(trimmed.slice(4))}</h5>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h4 key={idx} style={styles.aiH2}>{renderInlineFormatting(trimmed.slice(3))}</h4>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h3 key={idx} style={styles.aiH1}>{renderInlineFormatting(trimmed.slice(2))}</h3>
      );
    }
    // Bullets
    else if (/^[-*]\s/.test(trimmed)) {
      currentList.push(trimmed.slice(2));
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+\.\s/, ''));
    }
    // Empty line
    else if (trimmed === '') {
      flushList();
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(
        <p key={idx} style={styles.aiParagraph}>{renderInlineFormatting(trimmed)}</p>
      );
    }
  });

  flushList();
  return <div>{elements}</div>;
}

function renderInlineFormatting(text) {
  // Replace **bold** with <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ---------------------------------------------------------------------------
// StatusBadge component
// ---------------------------------------------------------------------------

function StatusBadge({ value }) {
  const color = getStatusColor(value);
  if (!color) return <span>{formatValue(value)}</span>;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {formatValue(value)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Determine if a column value should render as a badge
// ---------------------------------------------------------------------------

const BADGE_COLUMNS = new Set([
  'status', 'compliance_status', 'verification_status', 'risk_level',
  'impact_level', 'likelihood', 'severity', 'trend', 'impact_type',
  'overall_rating', 'efficiency_rating', 'environmental_rating',
  'social_rating', 'governance_rating', 'water_stress_level',
  'physical_risk_level', 'transition_risk_level', 'risk_rating',
]);

function renderCellValue(value, fieldName) {
  if (BADGE_COLUMNS.has(fieldName)) {
    return <StatusBadge value={value} />;
  }
  return formatValue(value, fieldName);
}

// ---------------------------------------------------------------------------
// Form Modal component
// ---------------------------------------------------------------------------

function FormModal({ title, fields, initialData, onSave, onClose, saving }) {
  const [formData, setFormData] = useState(() => {
    const data = {};
    fields.forEach((f) => {
      data[f.name] = initialData && initialData[f.name] != null ? initialData[f.name] : '';
    });
    return data;
  });

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert number fields
    const cleaned = { ...formData };
    fields.forEach((f) => {
      if (f.type === 'number' && cleaned[f.name] !== '' && cleaned[f.name] != null) {
        cleaned[f.name] = Number(cleaned[f.name]);
      }
      if (cleaned[f.name] === '') {
        cleaned[f.name] = null;
      }
    });
    onSave(cleaned);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{title}</h2>
          <button style={styles.modalCloseBtn} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.formGrid}>
            {fields.map((field) => (
              <div
                key={field.name}
                style={{
                  ...styles.formGroup,
                  ...(field.type === 'textarea' ? { gridColumn: '1 / -1' } : {}),
                }}
              >
                <label style={styles.formLabel}>
                  {field.label}
                  {field.required && <span style={styles.requiredStar}> *</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    style={styles.formInput}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">-- Select --</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    style={{ ...styles.formInput, minHeight: 80, resize: 'vertical' }}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type}
                    style={styles.formInput}
                    value={formData[field.name] ?? ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    step={field.type === 'number' ? 'any' : undefined}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={styles.modalActions}>
            <button type="button" style={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Dialog
// ---------------------------------------------------------------------------

function ConfirmDialog({ message, onConfirm, onCancel, deleting }) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.confirmContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.confirmIcon}>!</div>
        <h3 style={styles.confirmTitle}>Confirm Delete</h3>
        <p style={styles.confirmMessage}>{message}</p>
        <div style={styles.confirmActions}>
          <button style={styles.btnSecondary} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.btnDanger, opacity: deleting ? 0.7 : 1 }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel component
// ---------------------------------------------------------------------------

function DetailPanel({ item, config, onEdit, onDelete, onClose }) {
  if (!item) return null;

  const allFields = config.formFields;
  const hasAiAnalysis = item.ai_analysis != null;

  return (
    <div style={styles.detailPanel}>
      <div style={styles.detailHeader}>
        <h3 style={styles.detailTitle}>
          {item[allFields[0]?.name] || `${config.displayName} Details`}
        </h3>
        <button style={styles.detailCloseBtn} onClick={onClose}>&times;</button>
      </div>

      <div style={styles.detailBody}>
        {/* ID and timestamps */}
        <div style={styles.detailMeta}>
          {item.id && <span style={styles.detailId}>ID: {item.id}</span>}
          {item.created_at && (
            <span style={styles.detailTimestamp}>
              Created: {new Date(item.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </span>
          )}
          {item.updated_at && (
            <span style={styles.detailTimestamp}>
              Updated: {new Date(item.updated_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* All fields */}
        <div style={styles.detailFields}>
          {allFields.map((field) => {
            const val = item[field.name];
            return (
              <div key={field.name} style={styles.detailFieldRow}>
                <span style={styles.detailFieldLabel}>{field.label}</span>
                <span style={styles.detailFieldValue}>
                  {BADGE_COLUMNS.has(field.name) ? (
                    <StatusBadge value={val} />
                  ) : field.type === 'textarea' ? (
                    <span style={styles.detailTextarea}>{val || '\u2014'}</span>
                  ) : (
                    formatValue(val, field.name)
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* AI Analysis section */}
        {hasAiAnalysis && (
          <div style={styles.aiAnalysisContainer}>
            <div style={styles.aiAnalysisHeader}>
              <span style={styles.aiIcon}>AI</span>
              <h4 style={styles.aiAnalysisTitle}>AI Analysis</h4>
            </div>
            <div style={styles.aiAnalysisBody}>
              {renderAiAnalysis(item.ai_analysis)}
            </div>
          </div>
        )}
      </div>

      <div style={styles.detailActions}>
        <button style={styles.btnEdit} onClick={() => onEdit(item)}>
          Edit
        </button>
        <button style={styles.btnDanger} onClick={() => onDelete(item)}>
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CrudPage component
// ---------------------------------------------------------------------------

export default function CrudPage({ resource, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const config = fieldConfigs[resource];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAll(resource);
      setItems(Array.isArray(data) ? data : data.data || data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    fetchItems();
    setSelectedItem(null);
    setShowForm(false);
    setEditingItem(null);
    setShowDeleteConfirm(null);
  }, [fetchItems]);

  if (!config) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.errorBox}>Unknown resource: {resource}</div>
      </div>
    );
  }

  // Handlers

  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setShowDeleteConfirm(item);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    setDeleting(true);
    try {
      await deleteItem(resource, showDeleteConfirm.id);
      setItems((prev) => prev.filter((i) => i.id !== showDeleteConfirm.id));
      if (selectedItem && selectedItem.id === showDeleteConfirm.id) {
        setSelectedItem(null);
      }
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err.message || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      if (editingItem) {
        const updated = await updateItem(resource, editingItem.id, formData);
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
        if (selectedItem && selectedItem.id === editingItem.id) {
          setSelectedItem(updated);
        }
      } else {
        const created = await createItem(resource, formData);
        setItems((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  };

  // Render

  return (
    <div style={styles.pageContainer}>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>{title}</h1>
          <p style={styles.pageSubtitle}>
            {items.length} {items.length === 1 ? config.displayName : `${config.displayName}s`}
          </p>
        </div>
        <button style={styles.btnPrimary} onClick={handleNewItem}>
          + New {config.displayName}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button style={styles.errorDismiss} onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading {title.toLowerCase()}...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>0</div>
          <h3 style={styles.emptyTitle}>No {title} Found</h3>
          <p style={styles.emptyText}>
            Get started by creating your first {config.displayName.toLowerCase()}.
          </p>
          <button style={styles.btnPrimary} onClick={handleNewItem}>
            + Create {config.displayName}
          </button>
        </div>
      ) : (
        /* Content area: table + optional detail panel */
        <div style={styles.contentArea}>
          {/* Table */}
          <div style={{ ...styles.tableContainer, flex: selectedItem ? '1 1 55%' : '1 1 100%' }}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {config.columns.map((col) => (
                      <th key={col} style={styles.th}>
                        {formatColumnHeader(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      style={{
                        ...styles.tr,
                        backgroundColor:
                          selectedItem && selectedItem.id === item.id
                            ? '#f0fdf4'
                            : idx % 2 === 0
                            ? '#ffffff'
                            : '#f9fafb',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleRowClick(item)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          selectedItem && selectedItem.id === item.id ? '#dcfce7' : '#f0fdf4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          selectedItem && selectedItem.id === item.id
                            ? '#f0fdf4'
                            : idx % 2 === 0
                            ? '#ffffff'
                            : '#f9fafb';
                      }}
                    >
                      {config.columns.map((col) => (
                        <td key={col} style={styles.td}>
                          {renderCellValue(item[col], col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selectedItem && (
            <DetailPanel
              item={selectedItem}
              config={config}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <FormModal
          title={editingItem ? `Edit ${config.displayName}` : `New ${config.displayName}`}
          fields={config.formFields}
          initialData={editingItem}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          saving={saving}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          message={`Are you sure you want to delete this ${config.displayName.toLowerCase()}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  // Page
  pageContainer: {
    padding: '24px 32px',
    maxWidth: 1400,
    margin: '0 auto',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1a2e1a',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7c6b',
    margin: '4px 0 0 0',
  },

  // Content area
  contentArea: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  },

  // Table
  tableContainer: {
    minWidth: 0,
    transition: 'flex 0.3s ease',
  },
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '12px 16px',
    color: '#374151',
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Detail panel
  detailPanel: {
    flex: '0 0 400px',
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 160px)',
    position: 'sticky',
    top: 24,
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: '12px 12px 0 0',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a2e1a',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    marginRight: 12,
  },
  detailCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  detailBody: {
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
  },
  detailMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #f3f4f6',
  },
  detailId: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: 4,
  },
  detailTimestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
  detailFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  detailFieldRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  detailFieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailFieldValue: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  detailTextarea: {
    display: 'block',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
  },
  detailActions: {
    display: 'flex',
    gap: 10,
    padding: '12px 20px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: '0 0 12px 12px',
  },

  // AI Analysis
  aiAnalysisContainer: {
    marginTop: 20,
    border: '1px solid #c7d2fe',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eef2ff',
  },
  aiAnalysisHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    backgroundColor: '#e0e7ff',
    borderBottom: '1px solid #c7d2fe',
  },
  aiIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },
  aiAnalysisTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#3730a3',
    margin: 0,
  },
  aiAnalysisBody: {
    padding: '14px 16px',
    fontSize: 13,
    color: '#312e81',
    lineHeight: 1.6,
  },
  aiSection: {
    marginBottom: 14,
  },
  aiSectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#4338ca',
    margin: '0 0 6px 0',
    borderBottom: '1px solid #c7d2fe',
    paddingBottom: 4,
  },
  aiBulletList: {
    margin: '6px 0',
    paddingLeft: 20,
  },
  aiBulletItem: {
    marginBottom: 4,
    lineHeight: 1.5,
  },
  aiNumber: {
    fontWeight: 700,
    fontSize: 18,
    color: '#4338ca',
  },
  aiPre: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    borderRadius: 8,
    fontSize: 12,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: '6px 0',
    border: '1px solid #c7d2fe',
  },
  aiH1: {
    fontSize: 16,
    fontWeight: 700,
    color: '#3730a3',
    margin: '14px 0 6px 0',
  },
  aiH2: {
    fontSize: 14,
    fontWeight: 700,
    color: '#4338ca',
    margin: '12px 0 4px 0',
  },
  aiH3: {
    fontSize: 13,
    fontWeight: 600,
    color: '#4f46e5',
    margin: '10px 0 4px 0',
  },
  aiParagraph: {
    margin: '4px 0 8px 0',
    lineHeight: 1.6,
  },

  // Buttons
  btnPrimary: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #1a7a4a, #22945a)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 122, 74, 0.25)',
    whiteSpace: 'nowrap',
  },
  btnSecondary: {
    padding: '10px 20px',
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnEdit: {
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #1a7a4a, #22945a)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '10px 16px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a2e1a',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  modalForm: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374937',
  },
  requiredStar: {
    color: '#ef4444',
  },
  formInput: {
    padding: '10px 12px',
    border: '1.5px solid #d1ddd1',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    backgroundColor: '#f8faf8',
    color: '#1a2e1a',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid #e5e7eb',
  },

  // Confirm dialog
  confirmContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: '32px 28px 24px',
    textAlign: 'center',
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  confirmIcon: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#fef2f2',
    color: '#ef4444',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 16,
    border: '2px solid #fecaca',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6b7280',
    margin: '0 0 20px 0',
    lineHeight: 1.5,
  },
  confirmActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#1a7a4a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 14,
  },

  // Empty state
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '2px dashed #d1d5db',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 700,
    color: '#9ca3af',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    margin: '0 0 20px 0',
  },

  // Error
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '16px 20px',
    color: '#b91c1c',
    fontSize: 14,
  },
  errorBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 16px',
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 16,
  },
  errorDismiss: {
    background: 'none',
    border: 'none',
    color: '#b91c1c',
    fontSize: 18,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
};

// Inject keyframe animation for spinner
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(styleSheet);
}
