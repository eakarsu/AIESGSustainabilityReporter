const crypto = require('crypto');

const TRANSITIONS = Object.freeze({
  draft: ['submitted'],
  submitted: ['in_review', 'rejected'],
  in_review: ['approved', 'rejected'],
  rejected: ['draft'],
  approved: ['published', 'superseded'],
  published: ['superseded'],
  superseded: [],
});

class WorkflowError extends Error {
  constructor(message, code = 'INVALID_WORKFLOW') {
    super(message);
    this.code = code;
    this.status = 422;
  }
}

function text(value, field, max = 500) {
  const result = String(value || '').trim();
  if (!result) throw new WorkflowError(`${field} is required`);
  if (result.length > max) throw new WorkflowError(`${field} exceeds ${max} characters`);
  return result;
}

function validateMetric(input) {
  const periodStart = new Date(input.period_start);
  const periodEnd = new Date(input.period_end);
  const value = Number(input.value);
  if (!Number.isFinite(periodStart.getTime()) || !Number.isFinite(periodEnd.getTime()) || periodStart > periodEnd) {
    throw new WorkflowError('period_start and period_end must define a valid ordered period');
  }
  if (!Number.isFinite(value)) throw new WorkflowError('value must be a finite number');
  if (!Array.isArray(input.evidence) || input.evidence.length === 0) {
    throw new WorkflowError('at least one evidence record is required');
  }
  const evidence = input.evidence.map((item, index) => ({
    source_id: text(item.source_id, `evidence[${index}].source_id`, 200),
    uri: text(item.uri, `evidence[${index}].uri`, 2000),
    checksum: text(item.checksum, `evidence[${index}].checksum`, 128),
    captured_at: text(item.captured_at, `evidence[${index}].captured_at`, 40),
  }));
  return {
    organization_boundary: text(input.organization_boundary, 'organization_boundary'),
    entity_code: text(input.entity_code, 'entity_code', 100),
    metric_code: text(input.metric_code, 'metric_code', 100),
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    unit: text(input.unit, 'unit', 50),
    value,
    factor_version: text(input.factor_version, 'factor_version', 100),
    framework_version: text(input.framework_version, 'framework_version', 100),
    jurisdiction: text(input.jurisdiction, 'jurisdiction', 100),
    methodology: text(input.methodology, 'methodology', 2000),
    is_estimate: Boolean(input.is_estimate),
    evidence,
  };
}

function assertTransition(from, to) {
  if (!(TRANSITIONS[from] || []).includes(to)) {
    throw new WorkflowError(`transition ${from} -> ${to} is not allowed`, 'INVALID_TRANSITION');
  }
}

function assertActor(action, role, actorId, preparedBy) {
  const permissions = {
    submitted: ['reporter', 'admin'],
    in_review: ['auditor', 'admin'],
    rejected: ['auditor', 'admin'],
    approved: ['auditor', 'admin'],
    published: ['admin'],
    superseded: ['admin'],
    draft: ['reporter', 'admin'],
  };
  if (!(permissions[action] || []).includes(role)) throw new WorkflowError('role is not permitted for this action', 'FORBIDDEN');
  if (['approved', 'published'].includes(action) && String(actorId) === String(preparedBy)) {
    throw new WorkflowError('preparer cannot approve or publish their own disclosure', 'SEPARATION_OF_DUTIES');
  }
}

function fingerprint(input) {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

module.exports = { WorkflowError, validateMetric, assertTransition, assertActor, fingerprint, TRANSITIONS };
