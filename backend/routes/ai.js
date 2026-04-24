const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// ---------------------------------------------------------------------------
// OpenRouter helper
// ---------------------------------------------------------------------------

async function callOpenRouter(prompt, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 0.3,
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://esg-sustainability-reporter.app',
      'X-Title': 'AI ESG Sustainability Reporter',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const content =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;

  if (!content) {
    throw new Error('No content returned from OpenRouter');
  }

  return {
    analysis: content,
    model: data.model || model,
    usage: data.usage || null,
  };
}

// ---------------------------------------------------------------------------
// Table configuration – maps each domain to its table, key metric queries,
// and the expert prompt template.
// ---------------------------------------------------------------------------

const TABLE_CONFIG = {
  esg_reports: {
    table: 'esg_reports',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(environmental_score)::numeric, 2) AS avg_environmental_score,
      ROUND(AVG(social_score)::numeric, 2) AS avg_social_score,
      ROUND(AVG(governance_score)::numeric, 2) AS avg_governance_score
    `,
  },
  carbon_footprints: {
    table: 'carbon_footprints',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(total_emissions)::numeric, 2) AS avg_total_emissions,
      ROUND(AVG(reduction_target_pct)::numeric, 2) AS avg_reduction_target
    `,
  },
  sustainability_metrics: {
    table: 'sustainability_metrics',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(current_value)::numeric, 2) AS avg_current_value,
      ROUND(AVG(target_value)::numeric, 2) AS avg_target_value
    `,
  },
  regulatory_compliance: {
    table: 'regulatory_compliance',
    metricQuery: `
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'compliant') AS compliant_count,
      COUNT(*) FILTER (WHERE status = 'non_compliant' OR status = 'non-compliant') AS non_compliant_count
    `,
  },
  supply_chain_esg: {
    table: 'supply_chain_esg',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(esg_score)::numeric, 2) AS avg_esg_score
    `,
  },
  risk_assessments: {
    table: 'risk_assessments',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(risk_score)::numeric, 2) AS avg_risk_score,
      COUNT(DISTINCT impact_level) AS distinct_impact_levels
    `,
  },
  greenwashing_checks: {
    table: 'greenwashing_checks',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(confidence_score)::numeric, 2) AS avg_confidence_score,
      COUNT(DISTINCT verification_status) AS distinct_verification_statuses
    `,
  },
  stakeholder_reports: {
    table: 'stakeholder_reports',
    metricQuery: `
      COUNT(*) AS total,
      COUNT(DISTINCT stakeholder_group) AS unique_stakeholder_groups
    `,
  },
  data_validations: {
    table: 'data_validations',
    metricQuery: `
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'validated') AS validated_count,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
    `,
  },
  climate_scenarios: {
    table: 'climate_scenarios',
    metricQuery: `
      COUNT(*) AS total,
      COUNT(DISTINCT temperature_pathway) AS distinct_temperature_pathways
    `,
  },
  biodiversity_impacts: {
    table: 'biodiversity_impacts',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(biodiversity_score)::numeric, 2) AS avg_biodiversity_score
    `,
  },
  water_usage: {
    table: 'water_usage',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(consumption_cubic_meters)::numeric, 2) AS avg_consumption,
      ROUND(AVG(recycled_pct)::numeric, 2) AS avg_recycled_pct
    `,
  },
  energy_audits: {
    table: 'energy_audits',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(total_consumption_kwh)::numeric, 2) AS avg_consumption_kwh,
      ROUND(AVG(renewable_pct)::numeric, 2) AS avg_renewable_pct
    `,
  },
  social_impacts: {
    table: 'social_impacts',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(impact_score)::numeric, 2) AS avg_impact_score
    `,
  },
  governance_compliance: {
    table: 'governance_compliance',
    metricQuery: `
      COUNT(*) AS total,
      ROUND(AVG(compliance_level)::numeric, 2) AS avg_compliance_level
    `,
  },
};

// ---------------------------------------------------------------------------
// GET /dashboard-stats  –  aggregated stats from all 15 tables
// ---------------------------------------------------------------------------

router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const stats = {};

    const queries = Object.entries(TABLE_CONFIG).map(async ([key, cfg]) => {
      try {
        const result = await pool.query(
          `SELECT ${cfg.metricQuery} FROM ${cfg.table} WHERE user_id = $1`,
          [req.user.id]
        );
        stats[key] = result.rows[0] || {};
      } catch (err) {
        // Table may not exist yet – degrade gracefully
        stats[key] = { total: 0, error: err.message };
      }
    });

    await Promise.all(queries);

    res.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Helper: fetch a single record owned by the requesting user
// ---------------------------------------------------------------------------

async function fetchRecord(table, id, userId) {
  const result = await pool.query(
    `SELECT * FROM ${table} WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

// ---------------------------------------------------------------------------
// POST /analyze-esg-report
// ---------------------------------------------------------------------------

router.post('/analyze-esg-report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('esg_reports', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'ESG report not found' });

    const prompt = `You are a senior ESG analyst and sustainability reporting expert with deep knowledge of GRI, SASB, TCFD, and CSRD frameworks. Analyze this ESG report data and provide professional insights:

${JSON.stringify(record, null, 2)}

Provide:
1) Overall assessment of the report quality and completeness
2) Framework compliance gaps (GRI, SASB, TCFD, CSRD, ISSB)
3) Score analysis – environmental (${record.environmental_score}), social (${record.social_score}), governance (${record.governance_score})
4) Specific, actionable recommendations for improvement
5) Key risk areas and materiality concerns

Format as a professional advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'esg_report',
    });
  } catch (err) {
    console.error('Error analyzing ESG report:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /analyze-carbon
// ---------------------------------------------------------------------------

router.post('/analyze-carbon', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('carbon_footprints', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Carbon footprint record not found' });

    const prompt = `You are a carbon accounting specialist and climate science expert certified in the GHG Protocol. Analyze this carbon footprint data and identify reduction opportunities:

${JSON.stringify(record, null, 2)}

Provide:
1) Emissions breakdown analysis (Scope 1: ${record.scope1_emissions}, Scope 2: ${record.scope2_emissions}, Scope 3: ${record.scope3_emissions})
2) Benchmarking against industry standards for ${record.industry_sector || 'the sector'}
3) Reduction pathway to meet the ${record.reduction_target_pct || 'stated'}% target from baseline year ${record.baseline_year || 'N/A'}
4) Specific decarbonization strategies prioritized by impact and feasibility
5) Science-Based Targets initiative (SBTi) alignment assessment
6) Carbon offset and inset recommendations

Format as a professional carbon management advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'carbon_footprint',
    });
  } catch (err) {
    console.error('Error analyzing carbon footprint:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /analyze-sustainability
// ---------------------------------------------------------------------------

router.post('/analyze-sustainability', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('sustainability_metrics', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Sustainability metric not found' });

    const prompt = `You are a sustainability measurement and performance expert with deep knowledge of SDG alignment and ESG KPIs. Analyze this sustainability metric data:

${JSON.stringify(record, null, 2)}

Provide:
1) Metric performance assessment – current value (${record.current_value}) vs target (${record.target_value} ${record.unit || ''})
2) Trend analysis and trajectory projection based on "${record.trend || 'unknown'}" trend
3) Data quality and confidence evaluation (confidence level: ${record.confidence_level || 'N/A'})
4) UN Sustainable Development Goals (SDG) alignment mapping
5) Peer benchmarking recommendations for "${record.category || 'this category'}"
6) Improvement strategies with timeline estimates

Format as a professional sustainability performance report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'sustainability_metrics',
    });
  } catch (err) {
    console.error('Error analyzing sustainability metrics:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /check-compliance
// ---------------------------------------------------------------------------

router.post('/check-compliance', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('regulatory_compliance', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Compliance record not found' });

    const prompt = `You are a regulatory compliance expert specializing in ESG regulations including EU CSRD, SEC Climate Disclosure, EU Taxonomy, SFDR, and global sustainability reporting mandates. Analyze this compliance record:

${JSON.stringify(record, null, 2)}

Provide:
1) Current compliance status assessment and gap analysis
2) Regulatory risk exposure evaluation with severity ratings
3) Upcoming regulatory deadlines and requirements that may apply
4) Detailed remediation roadmap with prioritized actions
5) Cross-jurisdictional compliance considerations
6) Documentation and evidence requirements for audit readiness

Format as a professional regulatory compliance advisory report with clear sections, risk ratings, and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'regulatory_compliance',
    });
  } catch (err) {
    console.error('Error checking compliance:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /analyze-supply-chain
// ---------------------------------------------------------------------------

router.post('/analyze-supply-chain', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('supply_chain_esg', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Supply chain record not found' });

    const prompt = `You are a supply chain sustainability expert with expertise in responsible sourcing, Scope 3 emissions, human rights due diligence, and circular economy principles. Analyze this supply chain ESG data:

${JSON.stringify(record, null, 2)}

Provide:
1) Supply chain ESG risk assessment with heat map categorization
2) Tier-level vulnerability analysis and critical supplier identification
3) Human rights and labor practice risk evaluation
4) Environmental impact through the supply chain (deforestation, water stress, emissions)
5) Recommendations for supplier engagement and capacity building programs
6) Supply chain resilience and diversification strategies
7) Traceability and transparency improvement roadmap

Format as a professional supply chain sustainability advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'supply_chain',
    });
  } catch (err) {
    console.error('Error analyzing supply chain:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /assess-risk
// ---------------------------------------------------------------------------

router.post('/assess-risk', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('risk_assessments', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Risk assessment not found' });

    const prompt = `You are an ESG risk management specialist with expertise in enterprise risk frameworks (COSO ERM, ISO 31000), climate-related financial risks (TCFD), and double materiality assessments. Analyze this ESG risk assessment data:

${JSON.stringify(record, null, 2)}

Provide:
1) Risk profile summary with likelihood and impact matrix placement
2) Financial materiality assessment – potential monetary exposure
3) Physical and transition climate risk evaluation
4) Stakeholder impact analysis across affected parties
5) Risk mitigation strategies prioritized by effectiveness and cost
6) Residual risk assessment after proposed mitigations
7) Monitoring KPIs and early warning indicators

Format as a professional ESG risk advisory report with clear sections, risk ratings, and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'risk_assessment',
    });
  } catch (err) {
    console.error('Error assessing risk:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /detect-greenwashing
// ---------------------------------------------------------------------------

router.post('/detect-greenwashing', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('greenwashing_checks', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Greenwashing record not found' });

    const prompt = `You are a greenwashing detection expert and ESG communications analyst with deep knowledge of the EU Green Claims Directive, FTC Green Guides, and ASA environmental advertising regulations. Analyze this data for potential greenwashing:

${JSON.stringify(record, null, 2)}

Provide:
1) Greenwashing risk assessment with severity classification (low/medium/high/critical)
2) Specific claim-by-claim analysis identifying vague, misleading, or unsubstantiated statements
3) Evidence gap analysis – what data/certifications are missing to support claims
4) Comparison against recognized standards (EU Taxonomy, Science-Based Targets, verified certifications)
5) Regulatory exposure assessment under current and upcoming anti-greenwashing rules
6) Remediation recommendations to make claims accurate and defensible
7) Best practices for authentic sustainability communication

Format as a professional greenwashing risk advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'greenwashing_detection',
    });
  } catch (err) {
    console.error('Error detecting greenwashing:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /build-stakeholder-report
// ---------------------------------------------------------------------------

router.post('/build-stakeholder-report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('stakeholder_reports', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Stakeholder report not found' });

    const prompt = `You are a stakeholder engagement and ESG communication strategist with expertise in integrated reporting (IIRC), stakeholder capitalism metrics (WEF), and materiality assessment. Analyze this stakeholder report data:

${JSON.stringify(record, null, 2)}

Provide:
1) Stakeholder mapping and salience analysis
2) Material topic identification and prioritization for this stakeholder group
3) Communication effectiveness assessment – clarity, completeness, balance
4) Key performance narrative recommendations tailored to stakeholder expectations
5) Data visualization and presentation improvement suggestions
6) Engagement strategy enhancements for deeper stakeholder dialogue
7) Alignment with integrated reporting frameworks (GRI, IIRC, SASB)

Format as a professional stakeholder reporting advisory with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'stakeholder_report',
    });
  } catch (err) {
    console.error('Error building stakeholder report:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /validate-data
// ---------------------------------------------------------------------------

router.post('/validate-data', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('data_validations', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Data validation record not found' });

    const prompt = `You are an ESG data quality and assurance specialist with expertise in ISAE 3000 (limited/reasonable assurance), data governance frameworks, and sustainability data verification. Analyze this data validation record:

${JSON.stringify(record, null, 2)}

Provide:
1) Data quality assessment across completeness, accuracy, consistency, and timeliness dimensions
2) Anomaly detection – flag outliers, inconsistencies, or implausible values
3) Source reliability evaluation and chain-of-custody analysis
4) Methodology review – is the calculation approach aligned with recognized standards
5) Assurance readiness assessment – gaps for external audit preparation
6) Data governance improvement recommendations
7) Automated validation rules that should be implemented

Format as a professional data quality advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'data_validation',
    });
  } catch (err) {
    console.error('Error validating data:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /analyze-climate
// ---------------------------------------------------------------------------

router.post('/analyze-climate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('climate_scenarios', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Climate scenario not found' });

    const prompt = `You are a climate scenario analysis expert with deep knowledge of TCFD recommendations, NGFS scenarios, IEA pathways, and IPCC assessment reports. Analyze this climate scenario data:

${JSON.stringify(record, null, 2)}

Provide:
1) Scenario plausibility assessment aligned with IPCC AR6 pathways
2) Physical risk exposure analysis (acute: extreme weather; chronic: sea-level rise, temperature)
3) Transition risk evaluation (policy, technology, market, reputation)
4) Financial impact quantification under the modeled scenario
5) Strategic resilience assessment – how prepared is the organization
6) Adaptation and mitigation strategy recommendations
7) Alignment with Paris Agreement temperature goals and net-zero pathways

Format as a professional climate scenario advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'climate_scenario',
    });
  } catch (err) {
    console.error('Error analyzing climate scenario:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /track-biodiversity
// ---------------------------------------------------------------------------

router.post('/track-biodiversity', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('biodiversity_impacts', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Biodiversity record not found' });

    const prompt = `You are a biodiversity and natural capital expert with expertise in TNFD (Taskforce on Nature-related Financial Disclosures), SBTN (Science Based Targets for Nature), and the Kunming-Montreal Global Biodiversity Framework. Analyze this biodiversity impact data:

${JSON.stringify(record, null, 2)}

Provide:
1) Biodiversity impact assessment using the LEAP approach (Locate, Evaluate, Assess, Prepare)
2) Ecosystem dependency and impact mapping
3) Species and habitat risk evaluation at operational and supply chain levels
4) Nature-positive strategy recommendations aligned with TNFD
5) Biodiversity offset and restoration opportunity identification
6) Metrics and KPIs for ongoing biodiversity performance monitoring
7) Alignment with GBF targets and national biodiversity strategies

Format as a professional biodiversity impact advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'biodiversity',
    });
  } catch (err) {
    console.error('Error tracking biodiversity:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /optimize-water
// ---------------------------------------------------------------------------

router.post('/optimize-water', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('water_usage', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Water usage record not found' });

    const prompt = `You are a water stewardship and resource management expert with expertise in the CEO Water Mandate, AWS (Alliance for Water Stewardship) standard, and WRI Aqueduct water risk framework. Analyze this water usage data:

${JSON.stringify(record, null, 2)}

Provide:
1) Water consumption efficiency analysis and benchmarking
2) Water stress and scarcity risk assessment for operational locations
3) Water recycling and reuse performance evaluation (recycled: ${record.recycled_pct || 'N/A'}%)
4) Wastewater quality and discharge compliance assessment
5) Water-related financial risk quantification
6) Optimization strategies prioritized by water savings potential and ROI
7) Targets and KPIs aligned with context-based water stewardship

Format as a professional water management advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'water_usage',
    });
  } catch (err) {
    console.error('Error optimizing water usage:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /audit-energy
// ---------------------------------------------------------------------------

router.post('/audit-energy', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('energy_audits', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Energy audit record not found' });

    const prompt = `You are an energy management and efficiency expert certified in ISO 50001 with expertise in renewable energy procurement, energy auditing (ASHRAE standards), and corporate PPA strategies. Analyze this energy audit data:

${JSON.stringify(record, null, 2)}

Provide:
1) Energy consumption profile analysis and intensity benchmarking
2) Renewable vs non-renewable energy mix assessment (renewable: ${record.renewable_pct || 'N/A'}%)
3) Energy efficiency opportunity identification with estimated savings
4) RE100 and corporate renewable procurement pathway recommendations
5) Peak demand management and load optimization strategies
6) Cost-benefit analysis of proposed energy improvements
7) Roadmap to net-zero energy operations with milestones

Format as a professional energy audit advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'energy_audit',
    });
  } catch (err) {
    console.error('Error auditing energy:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /measure-social
// ---------------------------------------------------------------------------

router.post('/measure-social', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('social_impacts', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Social impact record not found' });

    const prompt = `You are a social impact measurement and human capital expert with expertise in the UN Guiding Principles on Business and Human Rights, SROI methodology, DEI metrics, and the Social & Human Capital Protocol. Analyze this social impact data:

${JSON.stringify(record, null, 2)}

Provide:
1) Social impact magnitude and reach assessment
2) Stakeholder benefit analysis across employees, communities, and value chain workers
3) Diversity, equity, and inclusion performance evaluation
4) Human rights due diligence gap identification
5) Social return on investment (SROI) estimation framework
6) Community engagement and social license to operate assessment
7) Recommendations for enhancing measurable social outcomes

Format as a professional social impact advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'social_impact',
    });
  } catch (err) {
    console.error('Error measuring social impact:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /monitor-governance
// ---------------------------------------------------------------------------

router.post('/monitor-governance', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const record = await fetchRecord('governance_compliance', id, req.user.id);
    if (!record) return res.status(404).json({ error: 'Governance record not found' });

    const prompt = `You are a corporate governance and business ethics expert with deep knowledge of OECD Principles of Corporate Governance, proxy advisory standards (ISS, Glass Lewis), board effectiveness frameworks, and anti-corruption (FCPA, UK Bribery Act). Analyze this governance data:

${JSON.stringify(record, null, 2)}

Provide:
1) Governance structure effectiveness assessment
2) Board composition and independence analysis
3) Executive compensation alignment with ESG performance
4) Ethics and anti-corruption program maturity evaluation
5) Shareholder rights and transparency assessment
6) Risk oversight and internal controls adequacy
7) Governance improvement roadmap with prioritized recommendations

Format as a professional governance advisory report with clear sections and bullet points.`;

    const result = await callOpenRouter(prompt);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      category: 'governance',
    });
  } catch (err) {
    console.error('Error monitoring governance:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
