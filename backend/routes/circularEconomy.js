// Circular economy optimization: design-for-disassembly analysis, material
// recovery recommendations.
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const RECOVERY_RATES = { aluminium: 0.95, steel: 0.85, copper: 0.9, plastic: 0.3, glass: 0.7, rare_earth: 0.05, lithium: 0.1 };

// POST /api/circular-economy/analyse { product_id, materials:[{type,kg}] }
router.post('/analyse', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { product_id, materials = [] } = req.body || {};
    if (!Array.isArray(materials) || !materials.length) return res.status(400).json({ error: 'materials[] required' });
    const lines = materials.map(m => ({
      type: m.type,
      kg: Number(m.kg),
      recovery_rate: RECOVERY_RATES[m.type] || 0.5,
      recoverable_kg: Math.round(Number(m.kg) * (RECOVERY_RATES[m.type] || 0.5) * 100) / 100,
    }));
    const totalRecoverable = lines.reduce((a, b) => a + b.recoverable_kg, 0);

    // Optional LLM design suggestions
    let suggestions = null;
    const key = process.env.OPENROUTER_API_KEY;
    if (key) {
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', messages: [
            { role: 'system', content: 'Suggest design-for-disassembly improvements. List 5 changes.' },
            { role: 'user', content: JSON.stringify(materials) },
          ]}),
        });
        const j = await r.json();
        suggestions = j.choices?.[0]?.message?.content;
      } catch {}
    }
    return res.json({ product_id: product_id || null, lines, total_recoverable_kg: Math.round(totalRecoverable * 100) / 100, suggestions });
  } catch (e) {
    return res.status(500).json({ error: 'analyse failed' });
  }
});

module.exports = router;
