/**
 * materialityAlerts.js — Apply pass 5 stub
 *
 * server.js requires this module but it was never created. Stub returns
 * empty arrays so the UI can render without errors.
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ alerts: [] }));
router.use((req, res) => res.status(501).json({ error: 'Not yet implemented' }));

module.exports = router;
