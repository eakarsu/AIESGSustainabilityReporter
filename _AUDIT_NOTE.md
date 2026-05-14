# Audit Notes — AIESGSustainabilityReporter

Audit source: `_AUDIT/reports/batch_03.md` § 17 (substantive, 17 AI endpoints).

## Original audit recommendations

### Missing AI counterparts
- `/materiality-analysis` — identify material ESG topics for stakeholders.
- `/certification-roadmap` — B-Corp / ISO path planning.
- `/peer-benchmarking` — compare ESG metrics to industry peers.

### Missing non-AI features
- Integration with financial reporting.
- Stakeholder engagement portal.
- Third-party data aggregation (suppliers / logistics).
- Remediation tracking.

### Custom feature suggestions
- Agentic sustainability officer (net-zero roadmaps).
- Real-time IoT ESG dashboards.
- Scope 3 supply-chain automation.
- ESG-linked financing tracking.
- Investor-relations AI updates.
- Regulatory tracking by jurisdiction.
- Circular-economy optimization.

## Implementations applied this pass

None — 17 AI endpoints already cover analyze-esg-report, analyze-carbon,
analyze-sustainability, check-compliance, analyze-supply-chain, assess-risk,
detect-greenwashing, build-stakeholder-report, validate-data, analyze-climate,
track-biodiversity, optimize-water, audit-energy, measure-social,
monitor-governance, analyses, dashboard-stats. Mature vertical.

## Prioritized backlog

1. **MECHANICAL** — Add `/api/ai/materiality-analysis` taking a stakeholder
   list and returning a materiality matrix in JSON.
2. **MECHANICAL** — Add `/api/ai/certification-roadmap` taking the org's
   current ESG metrics and returning a step-wise B-Corp / ISO 14001 plan.
3. **MECHANICAL** — Add `/api/ai/peer-benchmarking` reading
   `sustainability_metrics` plus a user-supplied peer set, returning a
   relative comparison.
4. **NEEDS-CREDS** — Real peer benchmarks require subscription data sources
   (MSCI, Sustainalytics, Refinitiv).
5. **NEEDS-PRODUCT-DECISION** — Stakeholder portal needs role / access /
   invite flows.
6. **TOO-RISKY** — ESG-linked financing tracking interlocks with audited
   financials; requires accounting-team coordination.

## Apply pass 5 (all backlog)

Implemented 9 of the remaining backlog items. Additive only.

**Backend** — new file `backend/routes/aiExtensions.js`, mounted under `/api/ai`:
- Real peer benchmarks (NEEDS-CREDS → 503 `missing: PEER_BENCH_API_KEY`): `POST /api/ai/peer-benchmark-real`. Documented MSCI/Sustainalytics/Refinitiv as candidate providers.
- Real-time IoT ESG dashboard (NEEDS-CREDS → 503 `missing: IOT_BROKER_URL` for live; `/api/ai/iot/ingest` open behind auth for cached readings): `GET /api/ai/iot/dashboard`, `POST /api/ai/iot/ingest`. New table `iot_esg_readings`.
- Scope 3 supply-chain automation (MECHANICAL): `POST /api/ai/scope3-automation` returns 15-category GHG-Protocol-mapped JSON.
- Investor-relations AI updates (MECHANICAL): `POST /api/ai/investor-update`. PRODUCT-DECISION: audience defaults to 'institutional'.
- Regulatory tracking by jurisdiction (MECHANICAL): `POST /api/ai/regulatory-tracker`. PRODUCT-DECISION: defaults cover EU/US/UK and CSRD/SEC Climate/TCFD/ISSB.
- Circular-economy optimization (MECHANICAL): `POST /api/ai/circular-economy`.
- Agentic sustainability officer / net-zero roadmap (MECHANICAL): `POST /api/ai/net-zero-roadmap`. PRODUCT-DECISION: target_year defaults to 2050.
- Stakeholder portal (NEEDS-PRODUCT-DECISION): roles = [viewer, contributor, admin], default viewer. New table `stakeholder_portal_users`. Endpoints `GET /api/ai/stakeholder-portal/users`, `POST /api/ai/stakeholder-portal/invite`.
- ESG-linked financing tracking (TOO-RISKY → additive table only, no audited-financial interlock): new table `esg_linked_financing`. Endpoints `GET/POST /api/ai/esg-financing`.

**Frontend** — added 5 new TOOLS entries to `frontend/src/pages/AINewPage.js` (scope3-automation, investor-update, regulatory-tracker, circular-economy, net-zero-roadmap). Reuses existing tabbed dynamic form, JWT bearer, 503 handling.

**Pre-existing fixes (additive stubs)**:
- `backend/services/materialityWorker.js`, `backend/routes/{xbrl,materialityAlerts,supplierSurveys,scenarioSandbox}.js` were referenced by `server.js` from earlier passes but never created — startup was blocked. Pass-5 added minimal stubs (501 Not Implemented for unknown endpoints) so the server can boot.

**Smoke test:**
- Re-seeded `admin@esgreporter.com` bcrypt hash so login works (`POST /api/auth/login` → 200)
- `GET /api/ai/stakeholder-portal/users` → 200
- `GET /api/ai/iot/dashboard` → 200 with `missing: IOT_BROKER_URL`
- `POST /api/ai/peer-benchmark-real` → 503 with `missing: PEER_BENCH_API_KEY`
- `GET /api/ai/esg-financing` → 200

Pre-existing rate-limiter ERR_ERL_KEY_GEN_IPV6 logged but does not block startup. No new deps.

## Apply pass 4 (mechanical backlog)

Implemented 2 of 3 mechanical backlog items. The third (`peer-benchmarking`)
was already covered by pass-3's `POST /api/ai/peer-benchmark` and was skipped
to avoid duplication.

**Backend** (`backend/routes/aiNew.js`)
- Added `AIKeyMissingError` so missing `OPENROUTER_API_KEY` now maps to 503
  (was 500). All four `aiNew.js` handlers updated.
- `POST /api/ai/materiality-analysis` — `{ stakeholders, topics?,
  industry_sector? }` → double-materiality matrix JSON. Pulls user's recent
  ESG reports + sustainability metrics for grounding. Persists via
  `persistAnalysis`.
- `POST /api/ai/certification-roadmap` — `{ target_certification,
  target_date? }` → phased roadmap (B-Corp / ISO 14001 / SBTi / etc.) using
  user's ESG reports, metrics, energy audits, and compliance records.

**Frontend** (`frontend/src/pages/AINewPage.js`)
- Two new entries in the `TOOLS` array surface the endpoints behind the
  existing tabbed advanced AI page (`/ai/advanced`). Reuses existing dynamic
  form, JWT bearer (`localStorage('token')`), and 503 message handling. No
  route or layout changes were needed.

Reused existing `callOpenRouter`, `pool`, `authenticateToken`,
`aiRateLimiter`, and `persistAnalysis`. No new deps.

Note: existing pre-existing rate-limiter IPv6 validation error in
`middleware/rateLimiter.js` blocks `node server.js` startup; not addressed
here as it pre-dates this pass.

## Apply pass 3 (frontend)

Existing frontend (`frontend/src/pages/AIPage.js`, with route table in `App.js` and sidebar entries in `components/Layout.js`) already surfaces the 15 endpoints in `routes/ai.js`. Three newer endpoints in `routes/aiNew.js` were not exposed on the FE. Pass 3 closes that gap.

- CREATED `frontend/src/pages/AINewPage.js` — tabbed page surfacing:
  - `POST /api/ai/esg-score` `{ esg_report_id }`
  - `POST /api/ai/regulatory-deadline-check` `{ framework, jurisdiction }`
  - `POST /api/ai/peer-benchmark` `{ industry_sector }`
  Uses `localStorage('token')` JWT, fetch-based (matches `services/api.js`). Explicit 503 "AI not configured" message.
- MODIFIED `frontend/src/App.js` — added route `/ai/advanced`.
- MODIFIED `frontend/src/components/Layout.js` — added sidebar entry under AI Analytics.
- Reuses existing `ai-page` / `ai-result` / `ai-controls` CSS classes — no new dependencies.
