const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const TABLE = 'regulatory_compliance';
const COLUMNS = [
  'regulation_name', 'jurisdiction', 'compliance_status', 'due_date',
  'last_audit_date', 'risk_level', 'responsible_party', 'description',
  'penalty_amount', 'status'
];

// GET all records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const cnt = await pool.query(
      `SELECT COUNT(*)::int AS c FROM ${TABLE} WHERE user_id = $1`,
      [req.user.id]
    );
    const total = cnt.rows[0]?.c || 0;
    const result = await pool.query(
      `SELECT * FROM ${TABLE} WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error(`Error fetching ${TABLE}:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ${TABLE} WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching ${TABLE} by ID:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create new record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const values = COLUMNS.map(col => req.body[col]);
    const placeholders = COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = COLUMNS.join(', ');

    const result = await pool.query(
      `INSERT INTO ${TABLE} (${colNames}, user_id) VALUES (${placeholders}, $${COLUMNS.length + 1}) RETURNING *`,
      [...values, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`Error creating ${TABLE}:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update record by ID
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const col of COLUMNS) {
      if (req.body[col] !== undefined) {
        setClauses.push(`${col} = $${paramIndex}`);
        values.push(req.body[col]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    values.push(req.params.id, req.user.id);
    const result = await pool.query(
      `UPDATE ${TABLE} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating ${TABLE}:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE record by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM ${TABLE} WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error(`Error deleting ${TABLE}:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
