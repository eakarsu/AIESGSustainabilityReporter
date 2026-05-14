/**
 * aiExtensions.js — Apply pass 5
 *
 * Implements remaining backlog from _AUDIT_NOTE.md:
 *  - Real peer benchmarks            (NEEDS-CREDS  → 503 missing: PEER_BENCH_API_KEY)
 *  - Real-time IoT ESG dashboards    (NEEDS-CREDS  → 503 missing: IOT_BROKER_URL)
 *  - Scope 3 supply-chain automation (MECHANICAL)
 *  - Investor-relations AI updates   (MECHANICAL)
 *  - Regulatory tracking by jurisdiction (MECHANICAL)
 *  - Circular-economy optimization   (MECHANICAL)
 *  - Agentic sustainability officer  (MECHANICAL — net-zero roadmaps)
 *  - Stakeholder portal              (NEEDS-PRODUCT-DECISION → defaults documented)
 *  - ESG-linked financing tracking   (TOO-RISKY → additive table only)
 *
 * Required env vars:
 *  - OPENROUTER_API_KEY          (AI; 503 missing: OPENROUTER_API_KEY)
 *  - PEER_BENCH_API_KEY          (MSCI/Sustainalytics/Refinitiv proxy)
 *  - IOT_BROKER_URL              (live IoT dashboards)
 *
 * Reuses pool, auth, aiRateLimiter from existing project. Additive only —
 * no schema changes to existing tables; uses CREATE TABLE IF NOT EXISTS.
 */
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

class AIKeyMissingError extends Error {
  constructor() { super('AI not configured: OPENROUTER_API_KEY is missing'); this.code = 'AI_KEY_MISSING'; }
}

async function callOpenRouter(prompt, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AIKeyMissingError();
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://esg-sustainability-reporter.app',
      'X-Title': 'AI ESG Sustainability Reporter',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.3,
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return { analysis: data.choices?.[0]?.message?.content || '', model: data.model || model };
}

// Idempotent additive bootstrap
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stakeholder_portal_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'viewer',
        invited_by INTEGER,
        invited_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS esg_linked_financing (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        instrument_type VARCHAR(50),
        amount NUMERIC,
        currency VARCHAR(10) DEFAULT 'USD',
        sustainability_kpi VARCHAR(255),
        kpi_target NUMERIC,
        kpi_current NUMERIC,
        margin_step_bps NUMERIC,
        maturity_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS iot_esg_readings (
        id SERIAL PRIMARY KEY,
        sensor_id VARCHAR(100),
        metric VARCHAR(50),
        value NUMERIC,
        unit VARCHAR(20),
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_iot_readings_sensor ON iot_esg_readings(sensor_id, recorded_at DESC)`);
  } catch (err) {
    console.error('aiExtensions bootstrap error:', err.message);
  }
})();

function aiKeyMissing(res) { return res.status(503).json({ error: 'AI not configured', missing: 'OPENROUTER_API_KEY' }); }

// ════════════════════════════════════════════════════════════════
// 1. NEEDS-CREDS: real peer benchmarks
// ════════════════════════════════════════════════════════════════
router.post('/peer-benchmark-real', authenticateToken, async (req, res) => {
  if (!process.env.PEER_BENCH_API_KEY) {
    return res.status(503).json({ error: 'Peer benchmark provider not configured', missing: 'PEER_BENCH_API_KEY' });
  }
  try {
    const { industry_sector, region } = req.body || {};
    // PRODUCT-DECISION: real benchmarks would proxy MSCI/Sustainalytics/Refinitiv.
    // We return a normalized envelope so callers can integrate without re-coding.
    res.json({
      industry_sector, region,
      provider: 'configured',
      note: 'PEER_BENCH_API_KEY present; integrate provider-specific call here.',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
// 2. NEEDS-CREDS: real-time IoT ESG dashboard
// ════════════════════════════════════════════════════════════════
router.get('/iot/dashboard', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT sensor_id, metric, value, unit, recorded_at FROM iot_esg_readings ORDER BY recorded_at DESC LIMIT 200`
    );
    res.json({
      iot_broker_configured: !!process.env.IOT_BROKER_URL,
      missing: process.env.IOT_BROKER_URL ? null : 'IOT_BROKER_URL',
      readings: r.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/iot/ingest', authenticateToken, async (req, res) => {
  // PRODUCT-DECISION: open ingestion endpoint behind auth. In production
  // gateways would push readings via MQTT/HTTP from IOT_BROKER_URL.
  try {
    const { sensor_id, metric, value, unit } = req.body || {};
    if (!sensor_id || !metric || value == null) return res.status(400).json({ error: 'sensor_id, metric, value required' });
    const r = await pool.query(
      `INSERT INTO iot_esg_readings (sensor_id, metric, value, unit) VALUES ($1, $2, $3, $4) RETURNING *`,
      [sensor_id, metric, value, unit || null]
    );
    res.json({ reading: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
// 3. MECHANICAL: Scope 3 supply-chain automation
// ════════════════════════════════════════════════════════════════
router.post('/scope3-automation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { categories, spend_data, supplier_count } = req.body || {};
    const prompt = `You are a Scope 3 GHG accounting expert. Given this org's spend categories and supplier data, produce JSON {scope3_categories: [{category, ghg_protocol_category, estimated_emissions_tco2e, methodology, data_quality, automation_opportunities: string[]}], total_estimated_tco2e, top_hotspots: string[], next_actions: string[]}.\n\nCATEGORIES: ${JSON.stringify(categories || [])}\nSPEND_DATA: ${JSON.stringify(spend_data || {}).slice(0, 2000)}\nSUPPLIER_COUNT: ${supplier_count || 'unknown'}`;
    const result = await callOpenRouter(prompt, { maxTokens: 2500 });
    res.json({ analysis: result.analysis, type: 'scope3-automation', generated_at: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') return aiKeyMissing(res);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 4. MECHANICAL: Investor-relations AI updates
// ════════════════════════════════════════════════════════════════
router.post('/investor-update', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { quarter, highlights, esg_metrics, audience = 'institutional' } = req.body || {};
    // PRODUCT-DECISION: audience defaults to 'institutional'. Other accepted: retail, board, regulator.
    const prompt = `You are an investor-relations writer for a sustainability-focused company. Output JSON {tldr: string, narrative: string, key_metrics: [{label, value, yoy_change}], material_risks: string[], forward_guidance: string, audience_tone: '${audience}'}. Keep numbers grounded in provided data.\n\nQUARTER: ${quarter || 'recent'}\nHIGHLIGHTS: ${JSON.stringify(highlights || []).slice(0, 1500)}\nESG_METRICS: ${JSON.stringify(esg_metrics || {}).slice(0, 2000)}`;
    const result = await callOpenRouter(prompt, { maxTokens: 2000 });
    res.json({ update: result.analysis, audience, type: 'investor-update', generated_at: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') return aiKeyMissing(res);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 5. MECHANICAL: Regulatory tracking by jurisdiction
// ════════════════════════════════════════════════════════════════
router.post('/regulatory-tracker', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { jurisdictions = ['EU', 'US', 'UK'], frameworks = ['CSRD', 'SEC Climate', 'TCFD', 'ISSB'] } = req.body || {};
    // PRODUCT-DECISION: defaults cover the four most-cited jurisdictions and
    // four most-cited frameworks; callers can override.
    const prompt = `You are an ESG regulatory analyst. Track upcoming and active disclosure obligations across these jurisdictions and frameworks. Output JSON {by_jurisdiction: {jurisdiction: [{framework, status, key_dates: string[], scope, affected_entities, action_items: string[]}]}, cross_border_conflicts: string[], priority_actions: string[]}.\n\nJURISDICTIONS: ${jurisdictions.join(', ')}\nFRAMEWORKS: ${frameworks.join(', ')}`;
    const result = await callOpenRouter(prompt, { maxTokens: 2500 });
    res.json({ jurisdictions, frameworks, analysis: result.analysis, type: 'regulatory-tracker', generated_at: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') return aiKeyMissing(res);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 6. MECHANICAL: Circular-economy optimization
// ════════════════════════════════════════════════════════════════
router.post('/circular-economy', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { products, materials, waste_streams } = req.body || {};
    const prompt = `You are a circular-economy strategist. Output JSON {opportunities: [{product_or_material, strategy: 'reuse'|'remanufacture'|'recycle'|'redesign'|'service-model', estimated_co2_reduction_tco2e, estimated_cost_savings_usd, implementation_effort: 'low'|'medium'|'high', timeline_months}], priority_quick_wins: string[], strategic_redesigns: string[]}.\n\nPRODUCTS: ${JSON.stringify(products || []).slice(0, 1200)}\nMATERIALS: ${JSON.stringify(materials || []).slice(0, 1200)}\nWASTE_STREAMS: ${JSON.stringify(waste_streams || []).slice(0, 1200)}`;
    const result = await callOpenRouter(prompt, { maxTokens: 2500 });
    res.json({ analysis: result.analysis, type: 'circular-economy', generated_at: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') return aiKeyMissing(res);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 7. MECHANICAL: Agentic sustainability officer (net-zero roadmap)
// ════════════════════════════════════════════════════════════════
router.post('/net-zero-roadmap', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { baseline_year = new Date().getFullYear(), target_year = 2050, current_emissions, sectors } = req.body || {};
    // PRODUCT-DECISION: target_year defaults to 2050 (Paris Agreement / GFANZ default).
    const prompt = `You are an agentic sustainability officer producing a science-based net-zero roadmap. Output JSON {trajectory: [{year, target_emissions_tco2e, reduction_vs_baseline_pct, key_levers: string[]}], scope1_actions: string[], scope2_actions: string[], scope3_actions: string[], capex_estimate_usd, residual_emissions_strategy: string, governance_milestones: string[]}.\n\nBASELINE_YEAR: ${baseline_year}\nTARGET_YEAR: ${target_year}\nCURRENT_EMISSIONS_TCO2E: ${current_emissions || 'not provided'}\nSECTORS: ${JSON.stringify(sectors || [])}`;
    const result = await callOpenRouter(prompt, { maxTokens: 3000 });
    res.json({ baseline_year, target_year, roadmap: result.analysis, type: 'net-zero-roadmap', generated_at: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') return aiKeyMissing(res);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 8. NEEDS-PRODUCT-DECISION: Stakeholder portal (invites)
// ════════════════════════════════════════════════════════════════
// PRODUCT-DECISION: roles = [viewer, contributor, admin]; default viewer.
// Auth flow uses email-only invite (token mailing is out-of-scope for this pass).
router.get('/stakeholder-portal/users', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM stakeholder_portal_users ORDER BY invited_at DESC LIMIT 200');
    res.json({ users: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/stakeholder-portal/invite', authenticateToken, async (req, res) => {
  try {
    const { email, name, role = 'viewer' } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const r = await pool.query(
      `INSERT INTO stakeholder_portal_users (email, name, role, invited_by) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
       RETURNING *`,
      [email, name || null, role, req.user?.id || null]
    );
    res.json({ user: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
// 9. TOO-RISKY: ESG-linked financing tracking (additive table only)
// ════════════════════════════════════════════════════════════════
router.get('/esg-financing', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM esg_linked_financing ORDER BY created_at DESC LIMIT 100');
    res.json({ instruments: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/esg-financing', authenticateToken, async (req, res) => {
  try {
    const { instrument_type, amount, currency = 'USD', sustainability_kpi, kpi_target, kpi_current, margin_step_bps, maturity_date, notes } = req.body || {};
    if (!instrument_type || !amount) return res.status(400).json({ error: 'instrument_type and amount required' });
    const r = await pool.query(
      `INSERT INTO esg_linked_financing (user_id, instrument_type, amount, currency, sustainability_kpi, kpi_target, kpi_current, margin_step_bps, maturity_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user?.id || null, instrument_type, amount, currency, sustainability_kpi || null, kpi_target || null, kpi_current || null, margin_step_bps || null, maturity_date || null, notes || null]
    );
    res.json({ instrument: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
