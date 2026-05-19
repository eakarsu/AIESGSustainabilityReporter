import React, { useState } from 'react';

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

export default function AINewPage() {
  const [activeId, setActiveId] = useState(TOOLS[0].id);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const tool = TOOLS.find((t) => t.id === activeId);

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

  const analysisText =
    result?.analysis ||
    result?.result ||
    result?.data?.analysis ||
    result?.data?.result ||
    '';

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
            <p className="ai-description" style={{ marginTop: 0 }}>
              {tool.description}
            </p>
            {tool.fields.map((f) => (
              <div className="ai-select-group" key={f.key} style={{ marginBottom: 12 }}>
                <label htmlFor={`f-${f.key}`}>
                  {f.label}
                  {f.required ? ' *' : ''}
                </label>
                <input
                  id={`f-${f.key}`}
                  className="form-select"
                  type={f.type || 'text'}
                  value={form[f.key] || ''}
                  required={!!f.required}
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={loading}
                />
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
            {analysisText ? (
              <pre style={{ whiteSpace: 'pre-wrap' }}>{analysisText}</pre>
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
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
