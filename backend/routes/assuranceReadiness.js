const express = require('express');
const router = express.Router();

router.post('/score', (req, res) => {
  const body = req.body || {};
  const metrics = Number(body.metrics_count || 0);
  const evidence = Number(body.evidence_count || 0);
  const gaps = Number(body.open_gaps || 0);
  const external = Boolean(body.external_assurance);
  const score = Math.max(0, Math.min(100, Math.round(45 + evidence * 4 + metrics * 1.5 + (external ? 10 : 0) - gaps * 9)));
  res.json({
    report: body.report || 'ESG report',
    readiness_score: score,
    readiness_band: score >= 80 ? 'assurance-ready' : score >= 55 ? 'limited assurance prep' : 'not ready',
    actions: [
      gaps > 0 ? 'Close open evidence gaps before assurance review.' : 'Evidence gap register is clean.',
      evidence < metrics ? 'Attach source evidence for every metric.' : 'Metric evidence coverage is complete.',
      external ? 'Prepare external assurance package.' : 'Decide internal vs external assurance boundary.',
    ],
    generated_at: new Date().toISOString(),
  });
});

module.exports = router;
