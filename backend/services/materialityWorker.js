/**
 * materialityWorker.js — Apply pass 5 stub
 *
 * Pass-2/3/4 added a require('./services/materialityWorker') in server.js
 * but never created the file, blocking server startup. This pass-5 stub
 * provides a no-op implementation so the server can boot. Replace with a
 * real worker (cron + AI scoring) once requirements are finalized.
 */
function startMaterialityWorker() {
  // Intentionally a no-op. A real worker would poll esg_reports + materiality
  // matrices on an interval and emit alerts via the materialityAlerts route.
}

module.exports = { startMaterialityWorker };
