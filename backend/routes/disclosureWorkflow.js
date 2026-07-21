const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { WorkflowError, validateMetric, assertTransition, assertActor, fingerprint } = require('../services/esgWorkflow');

const router = express.Router();
router.use(auth);

const tenantId = (req) => String(req.user.tenant_id || req.user.organization_id || '').trim();
const actorId = (req) => String(req.user.id);

function requireTenant(req, res, next) {
  if (!tenantId(req)) return res.status(403).json({ error: 'tenant-bound identity required' });
  next();
}
router.use(requireTenant);

router.get('/cases', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, external_key, status, version, metric, prepared_by, reviewed_by, published_at, created_at, updated_at
       FROM esg_disclosure_cases WHERE tenant_id = $1 ORDER BY updated_at DESC LIMIT 200`,
      [tenantId(req)]
    );
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

router.post('/cases', async (req, res, next) => {
  const idempotencyKey = String(req.get('Idempotency-Key') || '').trim();
  if (!idempotencyKey) return res.status(400).json({ error: 'Idempotency-Key header required' });
  let metric;
  try { metric = validateMetric(req.body); } catch (error) { return next(error); }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO esg_disclosure_cases
       (tenant_id, external_key, status, metric, metric_fingerprint, prepared_by)
       VALUES ($1, $2, 'draft', $3::jsonb, $4, $5)
       ON CONFLICT (tenant_id, external_key) DO NOTHING RETURNING *`,
      [tenantId(req), idempotencyKey, JSON.stringify(metric), fingerprint(metric), actorId(req)]
    );
    const row = inserted.rows[0] || (await client.query(
      'SELECT * FROM esg_disclosure_cases WHERE tenant_id = $1 AND external_key = $2',
      [tenantId(req), idempotencyKey]
    )).rows[0];
    await client.query(
      `INSERT INTO esg_workflow_events (tenant_id, case_id, actor_id, event_type, details)
       VALUES ($1, $2, $3, $4, $5::jsonb) ON CONFLICT DO NOTHING`,
      [tenantId(req), row.id, actorId(req), inserted.rows[0] ? 'created' : 'idempotent_replay', JSON.stringify({ fingerprint: fingerprint(metric) })]
    );
    await client.query('COMMIT');
    res.status(inserted.rows[0] ? 201 : 200).json(row);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally { client.release(); }
});

router.post('/cases/:id/transition', async (req, res, next) => {
  const nextStatus = String(req.body.status || '');
  const expectedVersion = Number(req.body.version);
  const reason = String(req.body.reason || '').trim();
  if (!Number.isInteger(expectedVersion) || !reason) return res.status(400).json({ error: 'version and reason are required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      'SELECT * FROM esg_disclosure_cases WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [req.params.id, tenantId(req)]
    );
    if (!found.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'case not found' }); }
    const current = found.rows[0];
    assertTransition(current.status, nextStatus);
    assertActor(nextStatus, req.user.role, actorId(req), current.prepared_by);
    if (current.version !== expectedVersion) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'version conflict' }); }
    const result = await client.query(
      `UPDATE esg_disclosure_cases SET status = $1, version = version + 1,
       reviewed_by = CASE WHEN $1 IN ('in_review','approved','rejected') THEN $2 ELSE reviewed_by END,
       published_at = CASE WHEN $1 = 'published' THEN NOW() ELSE published_at END, updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4 AND version = $5 RETURNING *`,
      [nextStatus, actorId(req), current.id, tenantId(req), expectedVersion]
    );
    await client.query(
      `INSERT INTO esg_workflow_events (tenant_id, case_id, actor_id, event_type, details)
       VALUES ($1, $2, $3, 'status_changed', $4::jsonb)`,
      [tenantId(req), current.id, actorId(req), JSON.stringify({ from: current.status, to: nextStatus, reason })]
    );
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally { client.release(); }
});

router.post('/imports', async (req, res, next) => {
  const source = String(req.body.source || '').trim();
  const externalId = String(req.body.external_id || '').trim();
  if (!source || !externalId || !req.body.payload) return res.status(400).json({ error: 'source, external_id and payload required' });
  try {
    const result = await pool.query(
      `INSERT INTO esg_integration_inbox (tenant_id, source, external_id, payload)
       VALUES ($1,$2,$3,$4::jsonb) ON CONFLICT (tenant_id, source, external_id)
       DO UPDATE SET last_seen_at=NOW() RETURNING id, source, external_id, status, attempts`,
      [tenantId(req), source, externalId, JSON.stringify(req.body.payload)]
    );
    res.status(202).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.use((error, req, res, next) => {
  if (error instanceof WorkflowError) {
    return res.status(error.code === 'FORBIDDEN' ? 403 : 422).json({ error: error.message, code: error.code });
  }
  next(error);
});

module.exports = router;
