const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./db');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { startMaterialityWorker } = require('./services/materialityWorker');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS — allowlist via env (ALLOWED_ORIGINS comma separated, fallback FRONTEND_URL, then localhost)
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.FRONTEND_URL ||
  'http://localhost:3000,http://localhost:5173'
).split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use('/api/', generalLimiter);

// Create ai_analyses table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_analyses (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    analysis_type VARCHAR(100) NOT NULL,
    result_text TEXT NOT NULL,
    framework VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    model_used VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
  )
`).then(async () => {
  // Backfill model_used column on existing installs.
  try { await pool.query('ALTER TABLE ai_analyses ADD COLUMN IF NOT EXISTS model_used VARCHAR(200)'); } catch {}
}).catch(err => console.error('Failed to create ai_analyses table:', err.message));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route registrations
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/esg-reports', require('./routes/esg-reports'));
app.use('/api/carbon-footprints', require('./routes/carbon-footprints'));
app.use('/api/sustainability-metrics', require('./routes/sustainability-metrics'));
app.use('/api/regulatory-compliance', require('./routes/regulatory-compliance'));
app.use('/api/supply-chain', require('./routes/supply-chain'));
app.use('/api/risk-assessments', require('./routes/risk-assessments'));
app.use('/api/greenwashing', require('./routes/greenwashing'));
app.use('/api/stakeholder-reports', require('./routes/stakeholder-reports'));
app.use('/api/data-validations', require('./routes/data-validations'));
app.use('/api/climate-scenarios', require('./routes/climate-scenarios'));
app.use('/api/biodiversity', require('./routes/biodiversity'));
app.use('/api/water-usage', require('./routes/water-usage'));
app.use('/api/energy-audits', require('./routes/energy-audits'));
app.use('/api/social-impact', require('./routes/social-impact'));
app.use('/api/governance', require('./routes/governance'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/aiNew'));
app.use('/api/ai', require('./routes/aiExtensions')); // Apply pass 5 — backlog
app.use('/api/disclosure-mappings', require('./routes/disclosureMappings'));
app.use('/api/xbrl', require('./routes/xbrl'));
app.use('/api/materiality-alerts', require('./routes/materialityAlerts'));
app.use('/api/supplier-surveys', require('./routes/supplierSurveys'));
app.use('/api/scenario-sandbox', require('./routes/scenarioSandbox'));
app.use('/api/export', require('./routes/export'));
app.use('/api/agentic-sustainability-officer', require('./routes/agenticSustainabilityOfficer'));
app.use('/api/realtime-esg', require('./routes/realtimeEsgDashboard'));
app.use('/api/scope3-automation', require('./routes/scope3Automation'));
app.use('/api/esg-linked-financing', require('./routes/esgLinkedFinancing'));
app.use('/api/investor-relations', require('./routes/investorRelations'));
app.use('/api/regulatory-tracker', require('./routes/regulatoryTracker'));
app.use('/api/circular-economy', require('./routes/circularEconomy'));

// Custom views (mount BEFORE 404 / error handlers)
app.use('/api/custom-views', require('./routes/customViews'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('./routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

app.listen(PORT, () => {
  console.log(`ESG Sustainability Reporter API running on port ${PORT}`);
  startMaterialityWorker();
});

module.exports = app;
