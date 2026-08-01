# W1-AUD-12 — Staging smoke green without auth

## Finding AUD-12
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO**
- Evidence:
  - `scripts/staging-p0-smoke.mjs`: if no `CLERK_BEARER_TOKEN`, skips upload steps 3–8, sets `skippedAuth`, still `process.exit(0)` when remaining steps pass (`summarize`).
- User impact: Operators misread “smoke green” as media/auth proven.
- Regressions if wrong fix: Local/dev smokes without tokens become noisy — use exit **2** (incomplete) vs **1** (failed assertions).
- Recommended owner: **Reliability**
- Recommended fix shape: If `skippedAuth`, exit 2 after summary (document in script header).
