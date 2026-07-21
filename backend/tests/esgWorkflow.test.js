const test = require('node:test');
const assert = require('node:assert/strict');
const { validateMetric, assertTransition, assertActor, fingerprint } = require('../services/esgWorkflow');

const valid = {
  organization_boundary: 'Controlled operations', entity_code: 'US-01', metric_code: 'scope_2',
  period_start: '2026-01-01', period_end: '2026-03-31', unit: 'tCO2e', value: 12.5,
  factor_version: 'EPA-eGRID-2025', framework_version: 'GRI-2025', jurisdiction: 'US',
  methodology: 'Location-based calculation', evidence: [{ source_id: 'utility-88', uri: 's3://evidence/88', checksum: 'a'.repeat(64), captured_at: '2026-04-01T00:00:00Z' }]
};

test('normalizes a sourced metric and creates a stable fingerprint', () => {
  const metric = validateMetric(valid);
  assert.equal(metric.value, 12.5);
  assert.equal(fingerprint(metric), fingerprint(metric));
});
test('rejects missing evidence and invalid periods', () => {
  assert.throws(() => validateMetric({ ...valid, evidence: [] }), /evidence/);
  assert.throws(() => validateMetric({ ...valid, period_start: '2027-01-01' }), /ordered period/);
});
test('enforces workflow and preparer-reviewer separation', () => {
  assert.doesNotThrow(() => assertTransition('draft', 'submitted'));
  assert.throws(() => assertTransition('draft', 'published'), /not allowed/);
  assert.throws(() => assertActor('approved', 'auditor', '7', '7'), /preparer/);
  assert.doesNotThrow(() => assertActor('approved', 'auditor', '8', '7'));
});
