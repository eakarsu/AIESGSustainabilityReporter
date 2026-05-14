// ============================================================
// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated Gap-feature endpoints (lean v0).
// TODO: configure credentials (set OPENROUTER_API_KEY).
// ============================================================
const express = require('express');
const router = express.Router();

let _gfReady = false;
async function ensureGapTable(pool) {
  if (_gfReady || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      user_id INT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gfReady = true;
  } catch (_) { /* tolerant of missing DB */ }
}

async function callAI(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, status: 503, error: 'AI service unavailable. Set OPENROUTER_API_KEY (TODO: configure credentials).' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { ok: r.ok, status: r.status, text, raw: data };
  } catch (e) {
    return { ok: false, status: 500, error: String(e.message || e) };
  }
}

function buildHandler(slug, label, hint) {
  return async (req, res) => {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const prompt = `Feature: ${label}\nContext hint: ${hint}\nUser input:\n${JSON.stringify(body, null, 2)}\n\nProduce a concise, actionable response.`;
    const ai = await callAI(prompt);
    try {
      const pool = req.app.locals.pool || req.app.get('pool') || null;
      if (pool) {
        await ensureGapTable(pool);
        await pool.query('INSERT INTO gap_features(slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
          [slug, userId, body, { text: ai.text || ai.error || null }]);
      }
    } catch (_) { /* tolerant */ }
    if (!ai.ok) return res.status(ai.status || 500).json({ error: ai.error || ai.text || `Upstream error (${ai.status})`, slug });
    res.json({ slug, label, result: ai.text });
  };
}

router.post('/gap-no-automated-certification-roadmap-b-corp-iso-agent', buildHandler('gap-ai-no-automated-certification-roadmap-b-corp-iso-agent', 'No automated certification-roadmap (B-Corp / ISO) agent', 'No automated certification-roadmap (B-Corp / ISO) agent'));
router.post('/gap-no-live-peer-benchmarking-via-external-data-sources', buildHandler('gap-ai-no-live-peer-benchmarking-via-external-data-sources', 'No live peer-benchmarking via external data sources', 'No live peer-benchmarking via external data sources'));
router.post('/gap-no-esg-linked-financing-instrument-tracker', buildHandler('gap-ai-no-esg-linked-financing-instrument-tracker', 'No ESG-linked-financing instrument tracker', 'No ESG-linked-financing instrument tracker'));
router.post('/gap-no-financial-system-integration-no-gl-erp-link-to-tie-esg-t', buildHandler('gap-non-no-financial-system-integration-no-gl-erp-link-to-tie-esg-t', 'No financial-system integration (no GL/ERP link to tie ESG t', 'No financial-system integration (no GL/ERP link to tie ESG to outcomes)'));
router.post('/gap-no-external-supplier-portal-only-internal-suppliersurveys', buildHandler('gap-non-no-external-supplier-portal-only-internal-suppliersurveys', 'No external supplier portal (only internal supplierSurveys)', 'No external supplier portal (only internal supplierSurveys)'));
router.post('/gap-no-remediation-tracking-workflow-action-items-progress', buildHandler('gap-non-no-remediation-tracking-workflow-action-items-progress', 'No remediation-tracking workflow (action items / progress)', 'No remediation-tracking workflow (action items / progress)'));
router.post('/gap-no-file-upload-module-observed-for-esg-document-ingest', buildHandler('gap-non-no-file-upload-module-observed-for-esg-document-ingest', 'No file upload module observed for ESG document ingest', 'No file upload module observed for ESG document ingest'));
router.post('/gap-no-webhooks', buildHandler('gap-non-no-webhooks', 'No webhooks', 'No webhooks'));

module.exports = router;
