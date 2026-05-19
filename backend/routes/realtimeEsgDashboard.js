// Real-time ESG dashboards: live data feeds from IoT sensors.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// POST /api/realtime-esg/ingest { sensor_id, type, value, ts? }
router.post('/ingest', authenticateToken, async (req, res) => {
  try {
    const { sensor_id, type, value, ts } = req.body || {};
    if (!sensor_id || !type || value == null) return res.status(400).json({ error: 'sensor_id, type, value required' });
    try {
      await pool.query(
        `INSERT INTO esg_sensor_readings (sensor_id, type, value, ts, created_at) VALUES ($1,$2,$3,$4,NOW())`,
        [sensor_id, type, Number(value), ts || new Date()]
      );
    } catch {}
    return res.json({ recorded: true, sensor_id, type, value });
  } catch (e) {
    return res.status(500).json({ error: 'ingest failed' });
  }
});

// GET /api/realtime-esg/live
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT type, AVG(value) AS avg_value, COUNT(*) AS n
       FROM esg_sensor_readings WHERE ts > NOW() - INTERVAL '1 hour'
       GROUP BY type`
    ).catch(() => ({ rows: [] }));
    return res.json({ window: '1h', metrics: r.rows, generated_at: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: 'live failed' });
  }
});

module.exports = router;
