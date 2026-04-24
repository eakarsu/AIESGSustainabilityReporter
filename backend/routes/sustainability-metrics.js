const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const TABLE = 'sustainability_metrics';
const COLUMNS = [
  'metric_name', 'category', 'current_value', 'target_value', 'unit',
  'trend', 'measurement_period', 'data_source', 'confidence_level', 'status'
];

// GET all records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ${TABLE} WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
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
