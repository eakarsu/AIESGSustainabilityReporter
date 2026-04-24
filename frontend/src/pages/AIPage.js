import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

// ---------------------------------------------------------------------------
// Type configuration
// ---------------------------------------------------------------------------

const TYPE_CONFIG = {
  'analyze-esg-report': {
    resource: 'esg-reports',
    nameField: 'report_title',
    apiFn: api.analyzeEsgReport,
    description:
      'Analyze ESG reports using AI to identify strengths, weaknesses, and areas for improvement across Environmental, Social, and Governance dimensions.',
  },
  'analyze-carbon': {
    resource: 'carbon-footprints',
    nameField: 'company_name',
    apiFn: api.analyzeCarbon,
    description:
      'Evaluate carbon footprint data with AI to uncover emission reduction opportunities, benchmark against industry standards, and recommend decarbonization strategies.',
  },
  'analyze-sustainability': {
    resource: 'sustainability-metrics',
    nameField: 'metric_name',
    apiFn: api.analyzeSustainability,
    description:
      'Leverage AI to assess sustainability metrics, identify trends, and generate actionable insights for improving your organization\'s sustainability performance.',
  },
  'check-compliance': {
    resource: 'regulatory-compliance',
    nameField: 'regulation_name',
    apiFn: api.checkCompliance,
    description:
      'Automatically check regulatory compliance status using AI, identify gaps, and receive guidance on meeting ESG disclosure requirements.',
  },
  'analyze-supply-chain': {
    resource: 'supply-chain',
    nameField: 'supplier_name',
    apiFn: api.analyzeSupplyChain,
    description:
      'Analyze supply chain sustainability with AI to assess supplier ESG risk, identify vulnerabilities, and recommend improvements.',
  },
  'assess-risk': {
    resource: 'risk-assessments',
    nameField: 'risk_name',
    apiFn: api.assessRisk,
    description:
      'Use AI to evaluate ESG-related risks, assess their potential impact, and develop mitigation strategies aligned with your risk appetite.',
  },
  'detect-greenwashing': {
    resource: 'greenwashing',
    nameField: 'company_name',
    apiFn: api.detectGreenwashing,
    description:
      'Deploy AI to detect potential greenwashing in sustainability claims, verify data accuracy, and ensure authentic ESG reporting.',
  },
  'build-stakeholder-report': {
    resource: 'stakeholder-reports',
    nameField: 'report_title',
    apiFn: api.buildStakeholderReport,
    description:
      'Generate comprehensive stakeholder reports with AI, tailored to different audiences with appropriate detail levels and visualizations.',
  },
  'validate-data': {
    resource: 'data-validations',
    nameField: 'dataset_name',
    apiFn: api.validateData,
    description:
      'Validate ESG data quality with AI to detect anomalies, inconsistencies, and missing information across your sustainability datasets.',
  },
  'analyze-climate': {
    resource: 'climate-scenarios',
    nameField: 'scenario_name',
    apiFn: api.analyzeClimate,
    description:
      'Run AI-powered climate scenario analyses to understand potential impacts, assess transition risks, and plan adaptation strategies.',
  },
  'track-biodiversity': {
    resource: 'biodiversity',
    nameField: 'project_name',
    apiFn: api.trackBiodiversity,
    description:
      'Track and analyze biodiversity impacts with AI, measuring ecosystem health and recommending conservation strategies.',
  },
  'optimize-water': {
    resource: 'water-usage',
    nameField: 'facility_name',
    apiFn: api.optimizeWater,
    description:
      'Optimize water usage with AI analysis to reduce consumption, identify waste, and improve water stewardship across facilities.',
  },
  'audit-energy': {
    resource: 'energy-audits',
    nameField: 'facility_name',
    apiFn: api.auditEnergy,
    description:
      'Conduct AI-powered energy audits to identify efficiency improvements, renewable energy opportunities, and cost savings.',
  },
  'measure-social': {
    resource: 'social-impact',
    nameField: 'program_name',
    apiFn: api.measureSocial,
    description:
      'Measure social impact with AI to quantify community benefits, assess DEI metrics, and evaluate stakeholder well-being.',
  },
  'monitor-governance': {
    resource: 'governance',
    nameField: 'policy_name',
    apiFn: api.monitorGovernance,
    description:
      'Monitor corporate governance with AI to evaluate board effectiveness, policy compliance, and ethical practices.',
  },
};

// ---------------------------------------------------------------------------
// Markdown-lite parser
// ---------------------------------------------------------------------------

function parseAnalysisText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null; // 'ul' or 'ol'
  let key = 0;

  function flushList() {
    if (listItems.length > 0) {
      const Tag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <Tag key={key++}>
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  }

  function renderInline(str) {
    // Handle bold, italic, and bold-italic inline formatting
    const parts = [];
    let remaining = str;
    let idx = 0;

    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={idx}><em>{match[2]}</em></strong>);
      } else if (match[3]) {
        parts.push(<strong key={idx}>{match[3]}</strong>);
      } else if (match[4]) {
        parts.push(<em key={idx}>{match[4]}</em>);
      } else if (match[5]) {
        parts.push(<strong key={idx}>{match[5]}</strong>);
      } else if (match[6]) {
        parts.push(<em key={idx}>{match[6]}</em>);
      }
      idx++;
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < remaining.length) {
      parts.push(remaining.slice(lastIndex));
    }
    return parts.length > 0 ? parts : str;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(<h5 key={key++}>{renderInline(line.slice(5))}</h5>);
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={key++}>{renderInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={key++}>{renderInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={key++}>{renderInline(line.slice(2))}</h2>);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={key++} />);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
    if (ulMatch) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.*)/);
    if (olMatch) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(<p key={key++}>{renderInline(line)}</p>);
  }

  flushList();
  return elements;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIPage({ type, title }) {
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const config = TYPE_CONFIG[type];

  // Fetch available records for the dropdown
  const fetchRecords = useCallback(async () => {
    if (!config) return;
    setLoadingRecords(true);
    try {
      const data = await api.getAll(config.resource);
      const list = Array.isArray(data) ? data : data.data || data.items || [];
      setRecords(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(String(list[0].id));
      }
    } catch {
      // silently fail -- user can still enter an ID
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [config, selectedId]);

  useEffect(() => {
    fetchRecords();
    // Reset state when type changes
    setResult(null);
    setError('');
    setSelectedId('');
  }, [type, fetchRecords]);

  const handleRunAnalysis = async () => {
    if (!config) return;
    if (!selectedId) {
      setError('Please select a record to analyze.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await config.apiFn(selectedId);
      setResult(data);
    } catch (err) {
      setError(err.message || 'AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return (
      <div className="ai-page">
        <div className="ai-empty">
          <div className="ai-empty-icon">&#x26A0;</div>
          <h2>Unknown Analysis Type</h2>
          <p>The requested AI analysis type is not recognized.</p>
        </div>
      </div>
    );
  }

  const analysisText =
    result?.analysis || result?.result || result?.data?.analysis || result?.data?.result || '';
  const modelName = result?.model || result?.data?.model || '';
  const tokenUsage = result?.token_usage || result?.data?.token_usage || result?.tokens_used || null;
  const category = result?.category || result?.data?.category || '';
  const timestamp =
    result?.created_at || result?.timestamp || result?.data?.created_at || '';

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-badge">AI Analysis</div>
        <h1>{title}</h1>
        <p className="ai-description">{config.description}</p>
      </div>

      {/* Controls */}
      <div className="ai-controls">
        <div className="ai-select-group">
          <label htmlFor="record-select">Select a record to analyze</label>
          <select
            id="record-select"
            className="form-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loading || loadingRecords}
          >
            {loadingRecords ? (
              <option value="">Loading records...</option>
            ) : records.length === 0 ? (
              <option value="">No records available</option>
            ) : (
              <>
                <option value="">-- Choose a record --</option>
                {records.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r[config.nameField] || `Record #${r.id}`}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <button
          className="ai-run-btn"
          onClick={handleRunAnalysis}
          disabled={loading || !selectedId}
        >
          {loading ? (
            <>
              <span className="ai-run-spinner" />
              Analyzing...
            </>
          ) : (
            <>
              <span className="ai-sparkle">&#x2728;</span>
              Run AI Analysis
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="ai-error">
          <span className="ai-error-icon">&#x26D4;</span>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="ai-loading">
          <div className="ai-loading-orb">
            <div className="ai-loading-ring" />
            <div className="ai-loading-ring ai-loading-ring-2" />
            <div className="ai-loading-core" />
          </div>
          <p className="ai-loading-text">AI is analyzing your data...</p>
          <p className="ai-loading-subtext">
            This may take a moment depending on the complexity of the analysis.
          </p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="ai-result fade-in">
          <div className="ai-result-header">
            <div className="ai-result-badges">
              {modelName && (
                <span className="ai-badge ai-badge-model" title="AI Model">
                  <span className="ai-badge-icon">&#x1F916;</span> {modelName}
                </span>
              )}
              {tokenUsage && (
                <span className="ai-badge ai-badge-tokens" title="Tokens Used">
                  <span className="ai-badge-icon">&#x26A1;</span>{' '}
                  {typeof tokenUsage === 'object'
                    ? `${tokenUsage.total || tokenUsage.total_tokens || '?'} tokens`
                    : `${tokenUsage} tokens`}
                </span>
              )}
              {category && (
                <span className="ai-badge ai-badge-category">
                  {category}
                </span>
              )}
            </div>
            {timestamp && (
              <span className="ai-result-time">
                {new Date(timestamp).toLocaleString()}
              </span>
            )}
          </div>

          <div className="ai-content">
            {analysisText ? (
              parseAnalysisText(analysisText)
            ) : (
              <p className="ai-content-raw">
                {JSON.stringify(result, null, 2)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="ai-empty">
          <div className="ai-empty-icon">&#x1F52C;</div>
          <h2>Ready to Analyze</h2>
          <p>
            Select a record from the dropdown above and click{' '}
            <strong>Run AI Analysis</strong> to get started. The AI will review
            your data and provide detailed insights, recommendations, and
            actionable next steps.
          </p>
        </div>
      )}
    </div>
  );
}
