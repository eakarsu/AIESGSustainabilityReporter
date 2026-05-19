/**
 * GRI / SASB / TCFD Disclosure Mapper
 * - POST /api/disclosure-mappings/map  — run AI mapping for an esg_report
 * - GET  /api/disclosure-mappings      — list mappings (paginated, user-scoped)
 * - GET  /api/disclosure-mappings/:id  — fetch one
 *
 * Persists per-disclosure rows in `disclosure_mappings` so a heatmap UI can
 * render a gap matrix (gap=true means user data is missing for that code).
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const fetch = require('node-fetch');

let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS disclosure_mappings (
      id SERIAL PRIMARY KEY,
      esg_report_id INTEGER,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      framework VARCHAR(50),
      code VARCHAR(100),
      title VARCHAR(255),
      mapped_field TEXT,
      gap BOOLEAN DEFAULT false,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  schemaReady = true;
}
ensureSchema().catch(() => {});

async function callAI(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 2048 }),
  });
  if (!r.ok) throw new Error(`AI error ${r.status}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

function parseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

router.get('/', auth, async (req, res) => {
  try {
    await ensureSchema();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const cnt = await pool.query('SELECT COUNT(*)::int AS c FROM disclosure_mappings WHERE user_id = $1', [req.user.id]);
    const r = await pool.query(
      `SELECT * FROM disclosure_mappings WHERE user_id = $1 ORDER BY framework, code LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ data: r.rows, pagination: { page, limit, total: cnt.rows[0].c, totalPages: Math.max(1, Math.ceil(cnt.rows[0].c / limit)) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM disclosure_mappings WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/map', auth, aiRateLimiter, async (req, res) => {
  try {
    await ensureSchema();
    const { esg_report_id, framework } = req.body;
    if (!esg_report_id) return res.status(400).json({ error: 'esg_report_id required' });
    const fw = ['GRI', 'SASB', 'TCFD', 'CSRD', 'ISSB'].includes(String(framework || '').toUpperCase()) ? String(framework).toUpperCase() : 'GRI';

    const rep = await pool.query(`SELECT * FROM esg_reports WHERE id = $1 AND user_id = $2`, [esg_report_id, req.user.id]);
    if (rep.rows.length === 0) return res.status(404).json({ error: 'ESG report not found' });

    const prompt = `You are a sustainability disclosures expert. Map the user's ESG report to ${fw} disclosure codes.
Report: ${JSON.stringify(rep.rows[0]).slice(0, 6000)}

Return STRICT JSON:
{ "mappings": [
  { "code": "<framework code, e.g. GRI 305-1>", "title": "<topic>", "mapped_field": "<JSON path or 'none'>", "gap": <true|false>, "notes": "<short reason>" }
] }
Provide at least 8 mappings, prioritising material topics.`;

    const text = await callAI(prompt);
    const parsed = parseJSON(text) || {};
    const mappings = Array.isArray(parsed.mappings) ? parsed.mappings : [];

    // Replace previous mapping for this report+framework.
    await pool.query('DELETE FROM disclosure_mappings WHERE user_id = $1 AND esg_report_id = $2 AND framework = $3', [req.user.id, esg_report_id, fw]);
    for (const m of mappings) {
      await pool.query(
        `INSERT INTO disclosure_mappings (esg_report_id, user_id, framework, code, title, mapped_field, gap, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [esg_report_id, req.user.id, fw, String(m.code || '').slice(0, 100), String(m.title || '').slice(0, 255), String(m.mapped_field || ''), !!m.gap, String(m.notes || '')]
      ).catch(err => console.error('disclosure_mappings insert:', err.message));
    }
    res.json({ esg_report_id, framework: fw, mappings_created: mappings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
