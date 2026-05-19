const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// ---------------------------------------------------------------------------
// OpenRouter helper (same pattern as ai.js)
// ---------------------------------------------------------------------------

class AIKeyMissingError extends Error {
  constructor() {
    super('AI not configured: OPENROUTER_API_KEY is missing');
    this.code = 'AI_KEY_MISSING';
  }
}

async function callOpenRouter(prompt, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AIKeyMissingError();

  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

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
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content returned from OpenRouter');

  return { analysis: content, model: data.model || model, usage: data.usage || null };
}

// ---------------------------------------------------------------------------
// Helper: persist analysis
// ---------------------------------------------------------------------------

async function persistAnalysis(entityType, entityId, analysisType, resultText, framework, userId) {
  try {
    await pool.query(
      `INSERT INTO ai_analyses (entity_type, entity_id, analysis_type, result_text, framework, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entityType, entityId || null, analysisType, resultText, framework || null, userId || null]
    );
  } catch (err) {
    console.error('Failed to persist AI analysis:', err.message);
  }
}

// ---------------------------------------------------------------------------
// POST /api/ai/esg-score
// Accepts { esg_report_id }, generates E/S/G sub-scores (0-100 each),
// persists scores back to the esg_report record
// ---------------------------------------------------------------------------

router.post('/esg-score', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { esg_report_id } = req.body;
    if (!esg_report_id) return res.status(400).json({ error: 'esg_report_id is required' });

    // Fetch ESG report
    const reportResult = await pool.query(
      'SELECT * FROM esg_reports WHERE id = $1 AND user_id = $2',
      [esg_report_id, req.user.id]
    );
    if (reportResult.rows.length === 0) return res.status(404).json({ error: 'ESG report not found' });
    const report = reportResult.rows[0];

    // Fetch related data for richer scoring
    const [carbonData, sustainMetrics, complianceData] = await Promise.all([
      pool.query('SELECT * FROM carbon_footprints WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3', [req.user.id]).catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM sustainability_metrics WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [req.user.id]).catch(() => ({ rows: [] })),
      pool.query('SELECT regulation_name, status FROM regulatory_compliance WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [req.user.id]).catch(() => ({ rows: [] })),
    ]);

    const prompt = `You are a senior ESG scoring expert. Generate precise E, S, G sub-scores based on this comprehensive data:

ESG REPORT DATA:
${JSON.stringify(report, null, 2)}

CARBON FOOTPRINT DATA (last 3 records):
${JSON.stringify(carbonData.rows, null, 2)}

SUSTAINABILITY METRICS (last 5):
${JSON.stringify(sustainMetrics.rows, null, 2)}

REGULATORY COMPLIANCE (last 5):
${JSON.stringify(complianceData.rows, null, 2)}

Generate granular ESG scores with this exact JSON structure:
{
  "environmental_score": <number 0-100>,
  "social_score": <number 0-100>,
  "governance_score": <number 0-100>,
  "overall_esg_score": <number 0-100, weighted average>,
  "score_methodology": "<brief explanation of scoring approach>",
  "environmental_breakdown": {
    "climate_change": <0-100>,
    "resource_management": <0-100>,
    "pollution_waste": <0-100>,
    "biodiversity": <0-100>
  },
  "social_breakdown": {
    "labor_practices": <0-100>,
    "human_rights": <0-100>,
    "community_impact": <0-100>,
    "product_responsibility": <0-100>
  },
  "governance_breakdown": {
    "board_structure": <0-100>,
    "transparency": <0-100>,
    "ethics_compliance": <0-100>,
    "shareholder_rights": <0-100>
  },
  "score_confidence": "<low|medium|high>",
  "key_strengths": ["<string>", "<string>", "<string>"],
  "key_weaknesses": ["<string>", "<string>", "<string>"],
  "improvement_priority": "<which E, S, or G dimension needs most attention and why>"
}

Return ONLY valid JSON, no markdown or explanation outside the JSON.`;

    const result = await callOpenRouter(prompt);

    // Try to parse scores from JSON response
    let scores = null;
    try {
      const jsonMatch = result.analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) scores = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.warn('Could not parse score JSON:', parseErr.message);
    }

    // Persist scores back to the esg_report if parseable
    if (scores) {
      await pool.query(
        `UPDATE esg_reports SET
           environmental_score = $1,
           social_score = $2,
           governance_score = $3,
           overall_rating = $4,
           updated_at = NOW()
         WHERE id = $5 AND user_id = $6`,
        [
          scores.environmental_score,
          scores.social_score,
          scores.governance_score,
          scores.overall_esg_score,
          esg_report_id,
          req.user.id
        ]
      ).catch(err => console.error('Failed to update ESG scores:', err.message));
    }

    await persistAnalysis('esg_reports', esg_report_id, 'esg-score', result.analysis, report.framework, req.user.id);

    res.json({
      esg_report_id,
      scores_parsed: scores,
      raw_analysis: result.analysis,
      scores_persisted: !!scores,
      type: 'esg-score',
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') {
      return res.status(503).json({ error: err.message });
    }
    console.error('Error generating ESG score:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/regulatory-deadline-check
// Accepts { framework, jurisdiction }, fetches compliance records,
// returns upcoming deadlines with current readiness assessment
// ---------------------------------------------------------------------------

router.post('/regulatory-deadline-check', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { framework, jurisdiction } = req.body;
    if (!framework) return res.status(400).json({ error: 'framework is required' });

    // Fetch compliance records for this user filtered by framework if possible
    const complianceResult = await pool.query(
      `SELECT * FROM regulatory_compliance WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );

    // Fetch ESG reports for context
    const reportsResult = await pool.query(
      `SELECT company_name, framework, reporting_period, status, environmental_score, social_score, governance_score
       FROM esg_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    );

    const prompt = `You are an expert ESG regulatory compliance advisor with deep knowledge of global sustainability reporting deadlines and requirements. Analyze readiness and provide upcoming deadline intelligence.

TARGET FRAMEWORK: ${framework}
JURISDICTION: ${jurisdiction || 'Global/Not specified'}
TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

CURRENT COMPLIANCE RECORDS:
${JSON.stringify(complianceResult.rows, null, 2)}

ESG REPORT CONTEXT:
${JSON.stringify(reportsResult.rows, null, 2)}

Provide a comprehensive regulatory deadline analysis:
1. UPCOMING DEADLINES (next 12 months) for ${framework} in ${jurisdiction || 'global context'}:
   - List each deadline with: date, requirement name, description, applicability criteria

2. READINESS ASSESSMENT for each deadline:
   - Current readiness score (0-100%) based on compliance records
   - Gap analysis: what's missing
   - Risk level: low/medium/high/critical

3. PRIORITY ACTION PLAN:
   - Top 3 most urgent actions to take immediately
   - Timeline recommendations

4. FRAMEWORK-SPECIFIC REQUIREMENTS:
   - Key data points required by ${framework}
   - Which of these the user currently has vs. missing

5. PENALTIES AND CONSEQUENCES:
   - Potential fines or regulatory actions for non-compliance
   - Reputational risks

Format as a structured report with clear sections. Include specific dates where known.`;

    const result = await callOpenRouter(prompt);

    await persistAnalysis('regulatory_compliance', null, 'regulatory-deadline-check', result.analysis, framework, req.user.id);

    res.json({
      framework,
      jurisdiction: jurisdiction || 'Global',
      compliance_records_checked: complianceResult.rows.length,
      deadline_analysis: result.analysis,
      type: 'regulatory-deadline-check',
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') {
      return res.status(503).json({ error: err.message });
    }
    console.error('Error checking regulatory deadlines:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/peer-benchmark
// Accepts { industry_sector }, fetches anonymized averages from all users'
// ESG scores for same framework, returns "your metrics vs sector average"
// ---------------------------------------------------------------------------

router.post('/peer-benchmark', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { industry_sector } = req.body;
    if (!industry_sector) return res.status(400).json({ error: 'industry_sector is required' });

    // Fetch user's own ESG reports
    const userReports = await pool.query(
      `SELECT environmental_score, social_score, governance_score, overall_rating,
              framework, reporting_period, company_name
       FROM esg_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    );

    // Fetch user's carbon data
    const userCarbon = await pool.query(
      `SELECT total_emissions, reduction_target_pct, industry_sector
       FROM carbon_footprints WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3`,
      [req.user.id]
    );

    // Fetch anonymized sector averages (all other users' data for same sector).
    // FIX: Using a JOIN against carbon_footprints multiplies rows when a user has
    // multiple carbon records, inflating the averages. Filter via a DISTINCT
    // user_id subquery so each peer contributes equally.
    const sectorAvg = await pool.query(
      `SELECT
         ROUND(AVG(r.environmental_score)::numeric, 2) AS avg_environmental,
         ROUND(AVG(r.social_score)::numeric, 2) AS avg_social,
         ROUND(AVG(r.governance_score)::numeric, 2) AS avg_governance,
         ROUND(AVG(r.overall_rating)::numeric, 2) AS avg_overall,
         COUNT(DISTINCT r.user_id) AS peer_count
       FROM esg_reports r
       WHERE r.user_id IN (
         SELECT DISTINCT user_id FROM carbon_footprints WHERE industry_sector ILIKE $1
       )
         AND r.user_id != $2
         AND r.environmental_score IS NOT NULL`,
      [`%${industry_sector}%`, req.user.id]
    ).catch(() => ({ rows: [{ avg_environmental: null, avg_social: null, avg_governance: null, avg_overall: null, peer_count: 0 }] }));

    const sectorCarbonAvg = await pool.query(
      `SELECT
         ROUND(AVG(total_emissions)::numeric, 2) AS avg_total_emissions,
         ROUND(AVG(reduction_target_pct)::numeric, 2) AS avg_reduction_target,
         COUNT(*) AS record_count
       FROM carbon_footprints
       WHERE industry_sector ILIKE $1 AND user_id != $2`,
      [`%${industry_sector}%`, req.user.id]
    ).catch(() => ({ rows: [{}] }));

    const peerData = sectorAvg.rows[0];
    const carbonPeerData = sectorCarbonAvg.rows[0];

    // Calculate user averages
    const userEnv = userReports.rows.reduce((s, r) => s + (parseFloat(r.environmental_score) || 0), 0) / (userReports.rows.length || 1);
    const userSoc = userReports.rows.reduce((s, r) => s + (parseFloat(r.social_score) || 0), 0) / (userReports.rows.length || 1);
    const userGov = userReports.rows.reduce((s, r) => s + (parseFloat(r.governance_score) || 0), 0) / (userReports.rows.length || 1);

    const prompt = `You are a leading ESG benchmarking analyst. Provide a detailed peer comparison for the ${industry_sector} sector.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

USER'S ESG PERFORMANCE (Your Metrics):
- Environmental Score: ${userEnv.toFixed(1)}/100
- Social Score: ${userSoc.toFixed(1)}/100
- Governance Score: ${userGov.toFixed(1)}/100
- Recent ESG Reports: ${JSON.stringify(userReports.rows.slice(0, 3), null, 2)}
- Carbon Data: ${JSON.stringify(userCarbon.rows, null, 2)}

SECTOR PEER AVERAGES (${industry_sector}, anonymized, ${peerData?.peer_count || 0} peer companies):
- Avg Environmental Score: ${peerData?.avg_environmental || 'Insufficient peer data'}
- Avg Social Score: ${peerData?.avg_social || 'Insufficient peer data'}
- Avg Governance Score: ${peerData?.avg_governance || 'Insufficient peer data'}
- Avg Overall ESG Rating: ${peerData?.avg_overall || 'Insufficient peer data'}
- Avg Total Emissions (tCO₂e): ${carbonPeerData?.avg_total_emissions || 'Insufficient data'}
- Avg Reduction Target: ${carbonPeerData?.avg_reduction_target || 'N/A'}%

Provide:
1. OVERALL POSITIONING: Where does this company stand vs. sector peers?
   - Above/At/Below average for E, S, G individually
   - Overall ESG ranking tier (Leader/Above Average/Average/Below Average/Laggard)

2. DIMENSION-BY-DIMENSION COMPARISON:
   - Environmental: user vs sector average, key gaps or advantages
   - Social: user vs sector average, key gaps or advantages
   - Governance: user vs sector average, key gaps or advantages

3. COMPETITIVE ADVANTAGES: Where does the user outperform peers?

4. IMPROVEMENT PRIORITIES: Top 3 areas to close the gap with sector leaders

5. SECTOR TRENDS: What are leading companies in ${industry_sector} doing on ESG that this company should adopt?

6. INVESTMENT & STAKEHOLDER IMPLICATIONS: How does this positioning affect investor attractiveness and stakeholder trust?

7. 12-MONTH ROADMAP: Specific steps to move from current position to above-average in the sector

Note: If peer data is limited, use industry knowledge to provide sector benchmarks for ${industry_sector}.

Format as a professional benchmarking report with clear comparisons and actionable insights.`;

    const result = await callOpenRouter(prompt);

    await persistAnalysis('esg_reports', null, 'peer-benchmark', result.analysis, industry_sector, req.user.id);

    res.json({
      industry_sector,
      user_metrics: {
        environmental_score: parseFloat(userEnv.toFixed(1)),
        social_score: parseFloat(userSoc.toFixed(1)),
        governance_score: parseFloat(userGov.toFixed(1)),
      },
      sector_averages: peerData,
      peer_count: parseInt(peerData?.peer_count) || 0,
      benchmark_analysis: result.analysis,
      type: 'peer-benchmark',
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') {
      return res.status(503).json({ error: err.message });
    }
    console.error('Error running peer benchmark:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/materiality-analysis
// Apply pass 4: identify material ESG topics for stakeholders.
// Accepts { stakeholders: string[] | string, topics?: string[] | string,
//          industry_sector?: string }
// ---------------------------------------------------------------------------

router.post('/materiality-analysis', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    let { stakeholders, topics, industry_sector } = req.body || {};

    if (!stakeholders) {
      return res.status(400).json({ error: 'stakeholders is required (array or comma-separated string)' });
    }
    if (typeof stakeholders === 'string') {
      stakeholders = stakeholders.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(stakeholders) || stakeholders.length === 0) {
      return res.status(400).json({ error: 'stakeholders must be a non-empty list' });
    }
    if (typeof topics === 'string') {
      topics = topics.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (topics && !Array.isArray(topics)) topics = null;

    // Pull recent context for grounding the matrix.
    const [reports, metrics] = await Promise.all([
      pool.query(
        `SELECT company_name, framework, environmental_score, social_score, governance_score
         FROM esg_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3`,
        [req.user.id]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT * FROM sustainability_metrics WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [req.user.id]
      ).catch(() => ({ rows: [] })),
    ]);

    const prompt = `You are an ESG materiality assessment expert. Construct a double-materiality matrix for the following organisation context.

ORGANISATION CONTEXT:
${JSON.stringify(reports.rows, null, 2)}

SUSTAINABILITY METRICS (recent):
${JSON.stringify(metrics.rows, null, 2)}

INDUSTRY SECTOR: ${industry_sector || 'not specified'}
STAKEHOLDERS: ${stakeholders.join(', ')}
CANDIDATE TOPICS: ${(topics && topics.length) ? topics.join(', ') : 'derive a reasonable default list of ESG topics for the sector'}

Return ONLY valid JSON with this shape:
{
  "matrix": [
    {
      "topic": "<string>",
      "stakeholder_relevance": <0-100>,
      "business_impact": <0-100>,
      "quadrant": "<critical|important|monitor|low>",
      "key_stakeholders": ["<string>"],
      "rationale": "<short paragraph>"
    }
  ],
  "top_material_topics": ["<topic>", "<topic>", "<topic>"],
  "stakeholder_summary": [
    { "stakeholder": "<string>", "primary_concerns": ["<string>"] }
  ],
  "framework_alignment": {
    "GRI": ["<topic>"],
    "SASB": ["<topic>"],
    "CSRD_ESRS": ["<topic>"]
  },
  "next_actions": ["<string>"]
}
No markdown.`;

    const result = await callOpenRouter(prompt);

    let matrix = null;
    try {
      const jsonMatch = result.analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) matrix = JSON.parse(jsonMatch[0]);
    } catch (e) {
      // leave matrix null
    }

    await persistAnalysis('esg_reports', null, 'materiality-analysis', result.analysis, null, req.user.id);

    res.json({
      stakeholders,
      industry_sector: industry_sector || null,
      matrix_parsed: matrix,
      raw_analysis: result.analysis,
      type: 'materiality-analysis',
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') {
      return res.status(503).json({ error: err.message });
    }
    console.error('Error running materiality analysis:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/certification-roadmap
// Apply pass 4: B-Corp / ISO 14001 step-wise plan based on current metrics.
// Accepts { target_certification, target_date? }
// ---------------------------------------------------------------------------

router.post('/certification-roadmap', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { target_certification, target_date } = req.body || {};
    if (!target_certification) {
      return res.status(400).json({ error: 'target_certification is required (e.g. "B-Corp", "ISO 14001", "ISO 50001", "SBTi")' });
    }

    const [reports, metrics, energyAudits, compliance] = await Promise.all([
      pool.query(
        `SELECT company_name, framework, environmental_score, social_score, governance_score, overall_rating
         FROM esg_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3`,
        [req.user.id]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT * FROM sustainability_metrics WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [req.user.id]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT * FROM energy_audits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3`,
        [req.user.id]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT regulation_name, status FROM regulatory_compliance WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [req.user.id]
      ).catch(() => ({ rows: [] })),
    ]);

    const prompt = `You are a sustainability certification consultant. Build a step-wise roadmap to ${target_certification} based on the current state.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}
TARGET CERTIFICATION: ${target_certification}
TARGET DATE: ${target_date || 'not specified — propose a realistic timeline'}

CURRENT ESG REPORTS:
${JSON.stringify(reports.rows, null, 2)}

SUSTAINABILITY METRICS:
${JSON.stringify(metrics.rows, null, 2)}

ENERGY AUDITS:
${JSON.stringify(energyAudits.rows, null, 2)}

REGULATORY COMPLIANCE:
${JSON.stringify(compliance.rows, null, 2)}

Provide a structured roadmap with:
1. CERTIFICATION OVERVIEW: scope, governing body, validity period
2. CURRENT READINESS: percentage estimate vs. requirements + gap analysis
3. PHASED PLAN: 3-5 phases, each with phase name, duration, owner, key deliverables, evidence required
4. REQUIRED DOCUMENTATION: list (policies, metrics, audits, third-party reviews)
5. ESTIMATED COSTS & RESOURCES: ballpark only
6. RISKS & DEPENDENCIES: top 3 risks and how to mitigate
7. SUCCESS METRICS: how progress will be measured

Format as a structured report; include indicative dates where possible.`;

    const result = await callOpenRouter(prompt);

    await persistAnalysis('esg_reports', null, 'certification-roadmap', result.analysis, target_certification, req.user.id);

    res.json({
      target_certification,
      target_date: target_date || null,
      roadmap: result.analysis,
      type: 'certification-roadmap',
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') {
      return res.status(503).json({ error: err.message });
    }
    console.error('Error generating certification roadmap:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
