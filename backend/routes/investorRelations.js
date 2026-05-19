// Investor relations AI: auto-generate investor updates on ESG progress.
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// POST /api/investor-relations/quarterly { entity_id, quarter }
router.post('/quarterly', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { entity_id, quarter } = req.body || {};
    if (!entity_id || !quarter) return res.status(400).json({ error: 'entity_id + quarter required' });
    const carbon = await pool.query(`SELECT scope, SUM(co2e_tonnes) AS total FROM carbon_footprints WHERE entity_id = $1 GROUP BY scope`, [entity_id]).catch(() => ({ rows: [] }));
    const reports = await pool.query(`SELECT id, title, payload FROM esg_reports WHERE entity_id = $1 ORDER BY created_at DESC LIMIT 5`, [entity_id]).catch(() => ({ rows: [] }));

    const key = process.env.OPENROUTER_API_KEY; // TODO: configure credentials
    if (!key) return res.status(503).json({ error: 'OPENROUTER_API_KEY missing' });
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: 'Compose a quarterly investor ESG update (≤500 words) with progress, risks, and forward look.' },
          { role: 'user', content: `Quarter ${quarter}\nCarbon: ${JSON.stringify(carbon.rows)}\nReports: ${JSON.stringify(reports.rows).slice(0, 3000)}` },
        ],
        max_tokens: 1500,
      }),
    });
    if (!r.ok) return res.status(502).json({ error: 'LLM call failed' });
    const j = await r.json();
    const update = j.choices?.[0]?.message?.content || '';
    return res.json({ entity_id, quarter, update });
  } catch (e) {
    return res.status(500).json({ error: 'quarterly failed' });
  }
});

module.exports = router;
