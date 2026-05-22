import React, { useState } from 'react';
import { assuranceReadinessScore } from '../services/api';

export default function AssuranceReadinessPage() {
  const [payload, setPayload] = useState('{"report":"FY2026 ESG Draft","metrics_count":18,"evidence_count":15,"open_gaps":2,"external_assurance":true}');
  const [result, setResult] = useState(null);
  const run = async () => setResult(await assuranceReadinessScore(JSON.parse(payload || '{}')));
  return <div><h1>Assurance Readiness</h1><textarea rows={8} value={payload} onChange={(e) => setPayload(e.target.value)} /><button onClick={run}>Score</button>{result && <pre>{JSON.stringify(result, null, 2)}</pre>}</div>;
}
