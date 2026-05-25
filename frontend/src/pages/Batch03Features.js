// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated frontend page (lean v0). Wires Custom Feature Suggestions
// and Gap endpoints (AI counterparts + non-AI features) to backend routes.
import React, { useState } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 'http://localhost:4000/api';

const FEATURES = [
  { kind: 'cfs', slug: 'cf-agentic-sustainability-officer', label: 'Agentic sustainability officer', desc: '"We want net-zero by 2030" → agent creates roadmap with timelines, cost estimates, SCI targets', endpoint: '/cf-agentic-sustainability-officer' },
  { kind: 'cfs', slug: 'cf-real-time-esg-dashboards', label: 'Real-time ESG dashboards', desc: 'Live data feeds from IoT sensors (carbon, water, waste), executive dashboard', endpoint: '/cf-real-time-esg-dashboards' },
  { kind: 'cfs', slug: 'cf-scope-3-automation', label: 'Scope 3 automation', desc: 'Auto-collect supply chain emissions data via vendor portals', endpoint: '/cf-scope-3-automation' },
  { kind: 'cfs', slug: 'cf-esg-linked-financing', label: 'ESG-linked financing', desc: 'Track ESG metrics for sustainability-linked loans/bonds', endpoint: '/cf-esg-linked-financing' },
  { kind: 'cfs', slug: 'cf-investor-relations-ai', label: 'Investor relations AI', desc: 'Auto-generate investor updates on ESG progress', endpoint: '/cf-investor-relations-ai' },
  { kind: 'cfs', slug: 'cf-regulatory-tracking', label: 'Regulatory tracking', desc: 'Monitor emerging ESG regulations by jurisdiction, flag compliance gaps', endpoint: '/cf-regulatory-tracking' },
  { kind: 'cfs', slug: 'cf-circular-economy-optimization', label: 'Circular economy optimization', desc: 'Design for disassembly analysis, material recovery recommendations', endpoint: '/cf-circular-economy-optimization' },
  { kind: 'gap-ai', slug: 'gap-ai-no-automated-certification-roadmap-b-corp-iso-agent', label: 'No automated certification-roadmap (B-Corp / ISO) agent', desc: 'No automated certification-roadmap (B-Corp / ISO) agent', endpoint: '/gap-no-automated-certification-roadmap-b-corp-iso-agent' },
  { kind: 'gap-ai', slug: 'gap-ai-no-live-peer-benchmarking-via-external-data-sources', label: 'No live peer-benchmarking via external data sources', desc: 'No live peer-benchmarking via external data sources', endpoint: '/gap-no-live-peer-benchmarking-via-external-data-sources' },
  { kind: 'gap-ai', slug: 'gap-ai-no-esg-linked-financing-instrument-tracker', label: 'No ESG-linked-financing instrument tracker', desc: 'No ESG-linked-financing instrument tracker', endpoint: '/gap-no-esg-linked-financing-instrument-tracker' },
  { kind: 'gap-non', slug: 'gap-non-no-financial-system-integration-no-gl-erp-link-to-tie-esg-t', label: 'No financial-system integration (no GL/ERP link to tie ESG t', desc: 'No financial-system integration (no GL/ERP link to tie ESG to outcomes)', endpoint: '/gap-no-financial-system-integration-no-gl-erp-link-to-tie-esg-t' },
  { kind: 'gap-non', slug: 'gap-non-no-external-supplier-portal-only-internal-suppliersurveys', label: 'No external supplier portal (only internal supplierSurveys)', desc: 'No external supplier portal (only internal supplierSurveys)', endpoint: '/gap-no-external-supplier-portal-only-internal-suppliersurveys' },
  { kind: 'gap-non', slug: 'gap-non-no-remediation-tracking-workflow-action-items-progress', label: 'No remediation-tracking workflow (action items / progress)', desc: 'No remediation-tracking workflow (action items / progress)', endpoint: '/gap-no-remediation-tracking-workflow-action-items-progress' },
  { kind: 'gap-non', slug: 'gap-non-no-file-upload-module-observed-for-esg-document-ingest', label: 'No file upload module observed for ESG document ingest', desc: 'No file upload module observed for ESG document ingest', endpoint: '/gap-no-file-upload-module-observed-for-esg-document-ingest' },
  { kind: 'gap-non', slug: 'gap-non-no-webhooks', label: 'No webhooks', desc: 'No webhooks', endpoint: '/gap-no-webhooks' },
];

function authHeaders() {
  const t = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export default function Batch03Features() {
  const [active, setActive] = useState(FEATURES[0]?.slug);
  const [input, setInput] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleRequests = [
      {
          "label": "Scenario",
          "value": "Run Batch03 Features for a realistic customer case.\nContext: a team needs a practical recommendation based on incomplete operating data.\nGoal: identify the best action, key risks, missing information, and expected business impact.\nReturn: summary, prioritized action plan, assumptions, and follow-up questions."
      },
      {
          "label": "Data sample",
          "value": "Analyze this Batch03 Features data sample.\nInput records:\n- Record 1: urgent, customer impact high, owner unassigned\n- Record 2: medium priority, blocked by missing data\n- Record 3: recurring issue, automation opportunity\nReturn structured findings, anomalies, recommendations, and confidence."
      },
      {
          "label": "Executive review",
          "value": "Prepare an executive review for Batch03 Features.\nAudience: business owner, operations lead, and implementation team.\nInclude impact, risk, estimated effort, decision points, and a concise next-step plan."
      }
  ];

  const applySampleRequest = (value) => {
    setInput(value);
    setError(null);
  };
  const current = FEATURES.find(f => f.slug === active) || FEATURES[0];

  async function run() {
    if (!current) return;
    setLoading(true); setError(null);
    try {
      let parsed;
      try { parsed = input ? JSON.parse(input) : {}; } catch { parsed = { input }; }
      const r = await fetch(`${API_BASE}${current.endpoint}`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(parsed)
      });
      let body; try { body = await r.json(); } catch { body = { raw: await r.text() }; }
      if (!r.ok) setError(body.error || `HTTP ${r.status}`);
      setResults(prev => ({ ...prev, [current.slug]: body }));
    } catch (e) {
      setError(String(e.message || e));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginTop: 0 }}>Batch 03 Features <small style={{ color: '#64748b', fontWeight: 400 }}>(AIESGSustainabilityReporter)</small></h2>
      <p style={{ color: '#475569', maxWidth: 720 }}>
        Audit-driven AI counterparts, non-AI feature gaps, and custom feature suggestions.
        Backend endpoints prefixed <code>/api/cf-*</code> (custom features) and <code>/api/gap-*</code> (gap fills).
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
        {FEATURES.map(f => (
          <button key={f.slug} onClick={() => setActive(f.slug)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1',
                     background: active === f.slug ? '#1e40af' : '#f8fafc',
                     color: active === f.slug ? 'white' : '#0f172a', cursor: 'pointer', fontSize: 12 }}>
            <span style={{ opacity: 0.7, marginRight: 4 }}>[{f.kind}]</span>{f.label}
          </button>
        ))}
      </div>
      {current && (
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{current.label}</strong>
            <div style={{ color: '#475569', fontSize: 13 }}>{current.desc}</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>POST <code>{current.endpoint}</code></div>
          </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {sampleRequests.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => applySampleRequest(sample.value)}
              style={{ padding: '6px 10px', background: '#eef2ff', color: '#1e3a8a', border: '1px solid #c7d2fe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              {sample.label}
            </button>
          ))}
        </div>

          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder='Optional JSON input (e.g. {"query":"..."})'
            style={{ width: '100%', minHeight: 80, padding: 8, fontFamily: 'monospace', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4 }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={run} disabled={loading}
              style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Running…' : 'Run'}
            </button>
          </div>
          {error && (<div style={{ marginTop: 12, padding: 10, background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 13 }}>{error}</div>)}
          {results[current.slug] && (
            <pre style={{ marginTop: 12, padding: 10, background: '#0b1020', color: '#cbd5e1', borderRadius: 4, overflow: 'auto', maxHeight: 360, fontSize: 12 }}>
              {typeof results[current.slug] === 'string' ? results[current.slug] : JSON.stringify(results[current.slug], null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
