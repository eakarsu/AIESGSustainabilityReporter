// Agentic sustainability officer: "We want net-zero by 2030" → roadmap.
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

async function callLLM(prompt, system) {
  const key = process.env.OPENROUTER_API_KEY; // TODO: configure credentials
  if (!key) return null;
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 1500 }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.choices?.[0]?.message?.content;
}

// POST /api/agentic-sustainability-officer/roadmap { target, deadline_year, entity_id? }
router.post('/roadmap', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { target, deadline_year, entity_id } = req.body || {};
    if (!target || !deadline_year) return res.status(400).json({ error: 'target + deadline_year required' });
    let baseline = null;
    if (entity_id) {
      try {
        const r = await pool.query(`SELECT SUM(co2e_tonnes) as total FROM carbon_footprints WHERE entity_id = $1`, [entity_id]);
        baseline = r.rows[0]?.total;
      } catch {}
    }
    const system = 'You are a chief sustainability officer. Produce a roadmap with year-by-year milestones, cost estimates, and SCI (Science Based Targets-aligned) milestones. Output JSON {"milestones":[{"year":int,"action":"...","cost_usd":num,"sci_target_pct":num}]}.';
    const raw = await callLLM(`Target: ${target}\nDeadline year: ${deadline_year}\nBaseline tonnes co2e: ${baseline || 'unknown'}`, system);
    if (!raw) return res.status(503).json({ error: 'OPENROUTER_API_KEY missing' });
    let parsed;
    try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    return res.json({ target, deadline_year, baseline, roadmap: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'roadmap failed' });
  }
});

module.exports = router;
