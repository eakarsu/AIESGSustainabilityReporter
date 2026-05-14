/**
 * xbrl.js — Apply pass 5 stub
 *
 * server.js requires this module (pass-2/3/4 reference) but it was never
 * created. This stub provides a minimal router so the server can boot.
 * Endpoints respond with 501 Not Implemented until a real XBRL exporter
 * is plugged in.
 */
const express = require('express');
const router = express.Router();

router.use((req, res) => res.status(501).json({ error: 'XBRL export not yet implemented' }));

module.exports = router;
