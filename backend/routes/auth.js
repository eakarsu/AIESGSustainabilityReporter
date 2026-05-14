const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { getJwtSecret } = require('../middleware/auth');

const router = express.Router();

// Idempotent password reset table
pool.query(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(() => {});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, industry_sector } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'email, password, name required' });
    if (String(password).length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
    const safeRole = ['admin', 'reporter', 'auditor'].includes(role) ? role : 'reporter';
    const hashed = await bcrypt.hash(password, 10);

    // Some seed schemas may include an industry_sector column; tolerate either.
    let result;
    try {
      result = await pool.query(
        'INSERT INTO users (email, password, name, role, industry_sector) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
        [email, hashed, name, safeRole, industry_sector || null]
      );
    } catch {
      result = await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        [email, hashed, name, safeRole]
      );
    }
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '24h' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (email) {
      const u = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (u.rows.length > 0) {
        const token = crypto.randomBytes(32).toString('hex');
        await pool.query(
          `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
          [u.rows[0].id, token]
        );
        if (process.env.NODE_ENV !== 'production') {
          return res.json({ message: 'Reset token created', token });
        }
      }
    }
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process password reset' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'token and newPassword (min 8 chars) required' });
    }
    const r = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );
    if (r.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, r.rows[0].user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [r.rows[0].id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', authMiddleware, async (req, res) => {
  const { id, email, role } = req.user;
  const token = jwt.sign({ id, email, role }, getJwtSecret(), { expiresIn: '24h' });
  res.json({ token });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
