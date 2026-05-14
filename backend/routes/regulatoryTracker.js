// Regulatory tracking: monitor emerging ESG regs by jurisdiction, flag gaps.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const KNOWN = [
  { jurisdiction: 'EU', name: 'CSRD', effective_year: 2024, scope: ['large_companies'] },
  { jurisdiction: 'EU', name: 'EU Taxonomy', effective_year: 2022, scope: ['financial_products'] },
  { jurisdiction: 'US', name: 'SEC climate disclosure rule', effective_year: 2026, scope: ['public_filers'] },
  { jurisdiction: 'CA', name: 'CSA Staff Notice 51-358', effective_year: 2023, scope: ['public_filers'] },
  { jurisdiction: 'UK', name: 'UK SDS', effective_year: 2024, scope: ['large_companies'] },
  { jurisdiction: 'JP', name: 'TCFD-aligned', effective_year: 2022, scope: ['prime_market'] },
];

// GET /api/regulatory-tracker/applicable?jurisdiction=EU&company_size=large
router.get('/applicable', authenticateToken, (req, res) => {
  const { jurisdiction, company_size } = req.query;
  const list = KNOWN.filter(r => (!jurisdiction || r.jurisdiction === jurisdiction) && (!company_size || r.scope.some(s => s.includes(company_size))));
  return res.json({ count: list.length, regulations: list });
});

// GET /api/regulatory-tracker/gaps/:entity_id — flag compliance gaps
router.get('/gaps/:entity_id', authenticateToken, async (req, res) => {
  try {
    const compliance = await pool.query(`SELECT * FROM regulatory_compliance WHERE entity_id = $1`, [req.params.entity_id]).catch(() => ({ rows: [] }));
    const covered = new Set(compliance.rows.map(r => r.regulation_name));
    const gaps = KNOWN.filter(r => !covered.has(r.name));
    return res.json({ entity_id: req.params.entity_id, covered: Array.from(covered), gap_count: gaps.length, gaps });
  } catch (e) {
    return res.status(500).json({ error: 'gaps failed' });
  }
});

module.exports = router;
