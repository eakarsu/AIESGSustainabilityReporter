const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route registrations
app.use('/api/auth', require('./routes/auth'));
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ESG Sustainability Reporter API running on port ${PORT}`);
});

module.exports = app;
