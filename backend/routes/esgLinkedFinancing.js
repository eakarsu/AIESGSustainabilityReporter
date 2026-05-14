// ESG-linked financing: track ESG metrics for sustainability-linked
// loans / bonds.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// POST /api/esg-linked-financing/instruments { entity_id, name, principal, kpi:{type, threshold, current}, rate_adjustment_bps }
router.post('/instruments', authenticateToken, async (req, res) => {
  try {
    const { entity_id, name, principal, kpi, rate_adjustment_bps } = req.body || {};
    if (!entity_id || !name || !principal || !kpi) return res.status(400).json({ error: 'entity_id, name, principal, kpi required' });
    try {
      const r = await pool.query(
        `INSERT INTO sustainable_finance_instruments (entity_id, name, principal_usd, kpi, rate_adjustment_bps, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id`,
        [entity_id, name, Number(principal), JSON.stringify(kpi), Number(rate_adjustment_bps || 0)]
      );
      return res.json({ id: r.rows[0].id, name, principal: Number(principal), kpi });
    } catch (e) {
      return res.status(500).json({ error: 'sustainable_finance_instruments table missing' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'create failed' });
  }
});

// GET /api/esg-linked-financing/status/:id
router.get('/status/:id', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM sustainable_finance_instruments WHERE id = $1`, [req.params.id]).catch(() => ({ rows: [] }));
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    const i = r.rows[0];
    const kpi = typeof i.kpi === 'string' ? JSON.parse(i.kpi) : i.kpi;
    const meeting = Number(kpi.current) >= Number(kpi.threshold);
    return res.json({
      id: i.id,
      name: i.name,
      principal_usd: Number(i.principal_usd),
      kpi,
      meeting_threshold: meeting,
      effective_rate_adjustment_bps: meeting ? -Math.abs(Number(i.rate_adjustment_bps || 0)) : Math.abs(Number(i.rate_adjustment_bps || 0)),
    });
  } catch (e) {
    return res.status(500).json({ error: 'status failed' });
  }
});

module.exports = router;
