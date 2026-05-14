// Scope 3 automation: auto-collect supply-chain emissions data via vendor
// portals.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const EEIO = { logistics: 0.5, electronics: 0.4, services: 0.1, food: 0.6, construction: 0.7, default: 0.3 };

// POST /api/scope3-automation/collect { entity_id, vendors:[{name,category,spend_usd,reported_co2e_t?}] }
router.post('/collect', authenticateToken, async (req, res) => {
  try {
    const { entity_id, vendors = [] } = req.body || {};
    if (!entity_id || !Array.isArray(vendors)) return res.status(400).json({ error: 'entity_id + vendors[] required' });
    const lines = vendors.map(v => {
      const reported = v.reported_co2e_t != null ? Number(v.reported_co2e_t) : null;
      const inferred = (Number(v.spend_usd) * (EEIO[v.category] ?? EEIO.default)) / 1000;
      return {
        vendor: v.name,
        category: v.category,
        spend_usd: Number(v.spend_usd),
        reported_co2e_t: reported,
        inferred_co2e_t: Math.round(inferred * 100) / 100,
        co2e_used: reported != null ? reported : Math.round(inferred * 100) / 100,
      };
    });
    const total = lines.reduce((a, b) => a + b.co2e_used, 0);
    try {
      await pool.query(`INSERT INTO carbon_footprints (entity_id, scope, co2e_tonnes, payload, created_at) VALUES ($1,3,$2,$3,NOW())`, [entity_id, total, JSON.stringify(lines)]);
    } catch {}
    return res.json({ entity_id, vendor_count: lines.length, total_mt_co2e: Math.round(total * 100) / 100, line_items: lines });
  } catch (e) {
    return res.status(500).json({ error: 'collect failed' });
  }
});

module.exports = router;
