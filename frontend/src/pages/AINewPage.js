
import AIFieldPresets, { completeExample } from './AIFieldPresets';
import AIResultView from './AIResultView';
import * as api from '../services/api';
import React, { useEffect, useState } from 'react';

// Page that surfaces the three "new" AI endpoints exposed by
// backend/routes/aiNew.js:
//   POST /api/ai/esg-score                { esg_report_id }
//   POST /api/ai/regulatory-deadline-check{ framework, jurisdiction }
//   POST /api/ai/peer-benchmark           { industry_sector }
//
// Auth: JWT bearer token from localStorage('token').

const TOOLS = [
  {
    id: 'esg-score',
    title: 'ESG Composite Score',
    description:
      'Compute an overall ESG composite score for a given ESG report ID.',
    endpoint: '/api/ai/esg-score',
    fields: [
      {
        key: 'esg_report_id',
        label: 'ESG Report ID',
        type: 'number',
        required: true,
      },
    ],
  },
  {
    id: 'regulatory-deadline-check',
    title: 'Regulatory Deadline Check',
    description:
      'Check upcoming regulatory deadlines for a given framework and jurisdiction.',
    endpoint: '/api/ai/regulatory-deadline-check',
    fields: [
      {
        key: 'framework',
        label: 'Framework (e.g. CSRD, GRI, SASB, TCFD)',
        type: 'text',
        required: true,
      },
      {
        key: 'jurisdiction',
        label: 'Jurisdiction (e.g. EU, US, UK)',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'peer-benchmark',
    title: 'Peer Benchmarking',
    description:
      'Benchmark your ESG metrics against peers in a given industry sector.',
    endpoint: '/api/ai/peer-benchmark',
    fields: [
      {
        key: 'industry_sector',
        label: 'Industry Sector (e.g. Manufacturing, Tech, Finance)',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'materiality-analysis',
    title: 'Materiality Analysis',
    description:
      'Generate a double-materiality matrix for a list of stakeholders and topics.',
    endpoint: '/api/ai/materiality-analysis',
    fields: [
      {
        key: 'stakeholders',
        label: 'Stakeholders (comma-separated, e.g. Investors, Employees, Regulators)',
        type: 'text',
        required: true,
      },
      {
        key: 'topics',
        label: 'Candidate Topics (optional, comma-separated)',
        type: 'text',
        required: false,
      },
      {
        key: 'industry_sector',
        label: 'Industry Sector (optional)',
        type: 'text',
        required: false,
      },
    ],
  },
  {
    id: 'certification-roadmap',
    title: 'Certification Roadmap',
    description:
      'Build a step-wise plan to a target sustainability certification (B-Corp, ISO 14001, SBTi, etc).',
    endpoint: '/api/ai/certification-roadmap',
    fields: [
      {
        key: 'target_certification',
        label: 'Target Certification (e.g. B-Corp, ISO 14001, SBTi)',
        type: 'text',
        required: true,
      },
      {
        key: 'target_date',
        label: 'Target Date (optional, YYYY-MM-DD)',
        type: 'text',
        required: false,
      },
    ],
  },
  // Apply pass 5 — backlog extensions
  {
    id: 'scope3-automation',
    title: 'Scope 3 Automation',
    description: 'Estimate Scope 3 emissions across the 15 GHG-Protocol categories from spend + supplier data.',
    endpoint: '/api/ai/scope3-automation',
    fields: [
      { key: 'categories', label: 'Categories (comma-separated)', type: 'text' },
      { key: 'supplier_count', label: 'Supplier count', type: 'number' },
    ],
  },
  {
    id: 'investor-update',
    title: 'Investor Relations Update',
    description: 'Draft a quarterly investor update grounded in ESG metrics.',
    endpoint: '/api/ai/investor-update',
    fields: [
      { key: 'quarter', label: 'Quarter (e.g. Q1 2026)', type: 'text', required: true },
      { key: 'audience', label: 'Audience (institutional/retail/board/regulator)', type: 'text' },
    ],
  },
  {
    id: 'regulatory-tracker',
    title: 'Regulatory Tracker',
    description: 'Cross-jurisdiction tracker for CSRD, SEC Climate, TCFD, ISSB and more.',
    endpoint: '/api/ai/regulatory-tracker',
    fields: [
      { key: 'jurisdictions', label: 'Jurisdictions (comma-separated)', type: 'text' },
      { key: 'frameworks', label: 'Frameworks (comma-separated)', type: 'text' },
    ],
  },
  {
    id: 'circular-economy',
    title: 'Circular Economy Optimization',
    description: 'Identify reuse / remanufacture / recycle opportunities across products and waste streams.',
    endpoint: '/api/ai/circular-economy',
    fields: [
      { key: 'products', label: 'Products (comma-separated)', type: 'text' },
      { key: 'materials', label: 'Materials (comma-separated)', type: 'text' },
      { key: 'waste_streams', label: 'Waste streams (comma-separated)', type: 'text' },
    ],
  },
  {
    id: 'net-zero-roadmap',
    title: 'Net-Zero Roadmap (Agentic Sustainability Officer)',
    description: 'Generate a science-based, multi-decade trajectory to net-zero.',
    endpoint: '/api/ai/net-zero-roadmap',
    fields: [
      { key: 'baseline_year', label: 'Baseline year', type: 'number' },
      { key: 'target_year', label: 'Target year (default 2050)', type: 'number' },
      { key: 'current_emissions', label: 'Current emissions (tCO2e)', type: 'number' },
      { key: 'sectors', label: 'Sectors (comma-separated)', type: 'text' },
    ],
  },
];

const EXAMPLES = {
  'esg-score': [{ label: 'First available report' }, { label: 'Second available report' }, { label: 'Third available report' }],
  'regulatory-deadline-check': [
    { label: 'EU CSRD', values: { framework: 'CSRD', jurisdiction: 'European Union' } },
    { label: 'US climate', values: { framework: 'SEC climate disclosure', jurisdiction: 'United States' } },
    { label: 'UK TCFD', values: { framework: 'TCFD', jurisdiction: 'United Kingdom' } },
  ],
  'peer-benchmark': [
    { label: 'Manufacturing', values: { industry_sector: 'Manufacturing' } },
    { label: 'Technology', values: { industry_sector: 'Technology' } },
    { label: 'Financial services', values: { industry_sector: 'Financial services' } },
  ],
  'materiality-analysis': [
    { label: 'Industrial operations', values: { stakeholders: 'Employees, local communities, investors, regulators', topics: 'Scope 1 emissions, worker safety, water use', industry_sector: 'Manufacturing' } },
    { label: 'Software services', values: { stakeholders: 'Employees, customers, investors, suppliers', topics: 'Data privacy, energy use, accessibility', industry_sector: 'Technology' } },
    { label: 'Retail supply chain', values: { stakeholders: 'Suppliers, customers, workers, investors', topics: 'Labor practices, packaging waste, transport emissions', industry_sector: 'Retail' } },
  ],
  'certification-roadmap': [
    { label: 'ISO 14001', values: { target_certification: 'ISO 14001', target_date: '2027-12-31' } },
    { label: 'B Corp', values: { target_certification: 'B Corp', target_date: '2028-06-30' } },
    { label: 'SBTi', values: { target_certification: 'SBTi', target_date: '2028-12-31' } },
  ],
  'scope3-automation': [
    { label: 'Purchased goods', values: { categories: 'Purchased goods and services, upstream transportation', supplier_count: 42 } },
    { label: 'Business travel', values: { categories: 'Business travel, employee commuting', supplier_count: 18 } },
    { label: 'Downstream logistics', values: { categories: 'Downstream transportation, end-of-life treatment', supplier_count: 65 } },
  ],
  'investor-update': [
    { label: 'Institutional Q1', values: { quarter: 'Q1 2026', audience: 'Institutional investors' } },
    { label: 'Board Q2', values: { quarter: 'Q2 2026', audience: 'Board of directors' } },
    { label: 'Retail Q3', values: { quarter: 'Q3 2026', audience: 'Retail investors' } },
  ],
  'regulatory-tracker': [
    { label: 'EU reporting', values: { jurisdictions: 'European Union', frameworks: 'CSRD, ESRS' } },
    { label: 'US reporting', values: { jurisdictions: 'United States', frameworks: 'SEC climate disclosure, California SB 253' } },
    { label: 'Global reporting', values: { jurisdictions: 'European Union, United Kingdom, United States', frameworks: 'ISSB, TCFD, CSRD' } },
  ],
  'circular-economy': [
    { label: 'Electronics', values: { products: 'Office laptops, monitors', materials: 'Aluminum, plastics, circuit boards', waste_streams: 'E-waste, packaging' } },
    { label: 'Textiles', values: { products: 'Workwear, uniforms', materials: 'Cotton, polyester', waste_streams: 'Fabric offcuts, returned garments' } },
    { label: 'Packaging', values: { products: 'Shipping cartons, protective inserts', materials: 'Cardboard, molded pulp', waste_streams: 'Used cartons, damaged inserts' } },
  ],
  'net-zero-roadmap': [
    { label: 'Manufacturing', values: { baseline_year: 2024, target_year: 2050, current_emissions: 125000, sectors: 'Manufacturing, logistics' } },
    { label: 'Technology', values: { baseline_year: 2025, target_year: 2045, current_emissions: 18500, sectors: 'Data centers, offices' } },
    { label: 'Retail', values: { baseline_year: 2023, target_year: 2050, current_emissions: 78000, sectors: 'Retail stores, distribution' } },
  ],
};

export default function AINewPage() {
  const [activeId, setActiveId] = useState(TOOLS[0].id);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const tool = TOOLS.find((t) => t.id === activeId);
  useEffect(() => {
    if (activeId !== 'esg-score') return;
    let active = true;
    api.getAll('esg-reports').then((data) => {
      if (active) setReports(Array.isArray(data) ? data : data?.data || data?.items || []);
    }).catch(() => { if (active) setReports([]); });
    return () => { active = false; };
  }, [activeId]);
  const fields = tool.fields.map((field) => field.key === 'esg_report_id'
    ? { ...field, requiresExistingRecord: true, options: reports.filter((report) => report.id != null).map((report) => ({ value: report.id, label: report.report_title || `Report ${report.id}` })) }
    : field);
  const fillExample = (sample, index) => {
    setForm((current) => ({ ...current, ...completeExample(fields, sample, index, tool.title, current) }));
    setError('');
  };

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const switchTool = (id) => {
    setActiveId(id);
    setForm({});
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tool) return;
    setLoading(true);
    setError('');
    setResult(null);

    // Coerce numeric fields where appropriate.
    const payload = {};
    tool.fields.forEach((f) => {
      let v = form[f.key];
      if (v == null || v === '') return;
      if (f.type === 'number') v = Number(v);
      payload[f.key] = v;
    });

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(tool.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 503) {
        setError(
          'AI not configured: OPENROUTER_API_KEY is missing on the server.'
        );
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || data.message || `Request failed (${res.status}).`);
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div className="ai-header-badge">AI Analysis (Advanced)</div>
        <h1>Advanced ESG Analytics</h1>
        <p className="ai-description">
          Materiality, scoring, regulatory tracking, and peer benchmarking — the
          newer set of AI endpoints layered on top of your ESG database.
        </p>
      </div>

      <div className="ai-controls" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}
        >
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTool(t.id)}
              className="ai-run-btn"
              style={{
                opacity: activeId === t.id ? 1 : 0.65,
                background: activeId === t.id ? undefined : '#3a3f55',
              }}
            >
              {t.title}
            </button>
          ))}
        </div>

        {tool && (
          <form onSubmit={handleSubmit}>
            <AIFieldPresets fields={fields} samples={EXAMPLES[activeId]} onFill={fillExample} disabled={loading} context={tool.title} />
            <p className="ai-description" style={{ marginTop: 0 }}>
              {tool.description}
            </p>
            {tool.fields.map((f) => (
              <div className="ai-select-group" key={f.key} style={{ marginBottom: 12 }}>
                <label htmlFor={`f-${f.key}`}>
                  {f.label}
                  {f.required ? ' *' : ''}
                </label>
                {f.key === 'esg_report_id' ? <select
                  id={`f-${f.key}`}
                  className="form-select"
                  value={form[f.key] ?? ''}
                  required
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select an existing ESG report</option>
                  {reports.filter((report) => report.id != null).map((report) => <option key={report.id} value={report.id}>{report.report_title || `Report ${report.id}`}</option>)}
                </select> : <input
                  id={`f-${f.key}`}
                  className="form-select"
                  type={f.type || 'text'}
                  value={form[f.key] ?? ''}
                  required={!!f.required}
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={loading}
                />}
              </div>
            ))}
            <button type="submit" className="ai-run-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="ai-run-spinner" /> Analyzing...
                </>
              ) : (
                <>
                  <span className="ai-sparkle">&#x2728;</span> Run {tool.title}
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="ai-error">
          <span className="ai-error-icon">&#x26D4;</span>
          {error}
        </div>
      )}

      {loading && (
        <div className="ai-loading">
          <div className="ai-loading-orb">
            <div className="ai-loading-ring" />
            <div className="ai-loading-ring ai-loading-ring-2" />
            <div className="ai-loading-core" />
          </div>
          <p className="ai-loading-text">AI is analyzing your data...</p>
        </div>
      )}

      {result && !loading && (
        <div className="ai-result fade-in">
          <div className="ai-content">
            <AIResultView response={result} title={tool.title} />
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="ai-empty">
          <div className="ai-empty-icon">&#x1F52C;</div>
          <h2>Ready to Analyze</h2>
          <p>
            Choose a tool above, fill in the inputs, and click run. Requires a
            backend with <code>OPENROUTER_API_KEY</code> configured.
          </p>
        </div>
      )}
    </div>
  );
}
