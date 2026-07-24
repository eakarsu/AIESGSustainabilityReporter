'use strict';

const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const email = String(process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const tenant = process.env.GOVERNANCE_TENANT_ID || process.env.TENANT_ID || 'runtime';
  if (!email || !password || password.length < 12) {
    throw new Error('PROVISION_ADMIN_EMAIL and a password of at least 12 characters are required');
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'reporter',
      tenant_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255)');
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email, password, name, role, tenant_id)
     VALUES ($1, $2, $3, 'admin', $4)
     ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password, name = EXCLUDED.name,
           role = 'admin', tenant_id = EXCLUDED.tenant_id`,
    [email, hash, 'Runtime Administrator', tenant]
  );
  await pool.end();
}

main().catch((error) => {
  console.error(`Runtime database initialization failed: ${error.message}`);
  process.exitCode = 1;
});
