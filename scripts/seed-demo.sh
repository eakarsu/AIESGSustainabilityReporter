#!/usr/bin/env bash
set -euo pipefail
[ "${CONFIRM_DEMO_SEED:-}" = yes ] || { echo "Set CONFIRM_DEMO_SEED=yes; never run this against production." >&2; exit 1; }
[ "${NODE_ENV:-development}" != production ] || { echo "Demo seeding is disabled in production." >&2; exit 1; }
root="$(cd "$(dirname "$0")/.." && pwd)"
(cd "$root/backend" && node seeds/seed.js)
