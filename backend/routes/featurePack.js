'use strict';
// Feature pack FP34B: authenticated tasks, search/filter + CSV/JSON export on the main list, domain AI over own records.
const express = require('express');
const pool = require('../db');
const authenticate = require('../middleware/auth');
const d = require('../domain/featurePack');
const router = express.Router();
const tasks = d.createTaskStore();
async function fetchRecords(req) { const { rows } = await pool.query(`SELECT * FROM esg_reports WHERE user_id = $1 ORDER BY id DESC LIMIT 1000`, [req.user.id]); return rows; }
async function tryProvider(prompt) {
  if (!d.hasProvider() || typeof fetch !== 'function') return null;
  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const url = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const key = isOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 500 }) });
  if (!res.ok) throw new Error('provider error');
  const j = await res.json(); const text = j.choices?.[0]?.message?.content || '';
  return { aiGenerated: true, generatedBy: isOpenRouter ? 'openrouter' : 'openai', provider: isOpenRouter ? 'openrouter' : 'openai', sections: [{ label: 'AI narrative', value: text }] };
}
async function aiHandler(fn, req, res) {
  try {
    const rows = await fetchRecords(req); const fallback = fn(rows);
    if (d.hasProvider()) { try { const p = await tryProvider(`${fallback.label}: ${JSON.stringify(fallback.sections)}`); if (p) return res.json({ ...fallback, ...p, summary: fallback.summary }); } catch { /* fall through to deterministic fallback */ } }
    return res.json(fallback);
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
router.get('/tasks', authenticate, (req, res) => res.json({ data: tasks.list(req.user.id), count: tasks.list(req.user.id).length }));
router.post('/tasks', authenticate, (req, res) => { try { return res.status(201).json(tasks.create(req.user.id, req.body || {})); } catch (e) { return res.status(e.status || 400).json({ error: e.message }); } });
router.put('/tasks/:id', authenticate, (req, res) => { const t = tasks.update(req.user.id, req.params.id, req.body || {}); return t ? res.json(t) : res.status(404).json({ error: 'Task not found' }); });
router.get('/records/search', authenticate, async (req, res) => { try { const data = d.filterRecords(await fetchRecords(req), req.query); return res.json({ data, count: data.length }); } catch (e) { return res.status(500).json({ error: e.message }); } });
router.get('/records/export', authenticate, async (req, res) => { try { const data = d.filterRecords(await fetchRecords(req), req.query); if (String(req.query.format || 'csv').toLowerCase() === 'json') return res.json(d.toJsonExport(data)); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename="records_export.csv"'); return res.send(d.toCsv(data)); } catch (e) { return res.status(500).json({ error: e.message }); } });
router.get('/ai/esg-score-summary', authenticate, (req,res)=>aiHandler(d.esgScoreSummary,req,res));
router.get('/ai/framework-coverage', authenticate, (req,res)=>aiHandler(d.frameworkCoverage,req,res));
router.get('/ai/disclosure-status-pipeline', authenticate, (req,res)=>aiHandler(d.disclosureStatusPipeline,req,res));
module.exports = router;
