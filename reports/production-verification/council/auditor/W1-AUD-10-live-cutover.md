# W1-AUD-10 — Live cutover residual (OPS only)

## Finding AUD-10
- Severity: **CRITICAL** (for public GO) · **not a code defect**
- Status: **REQUIRES_OPS**
- Evidence (command, 2026-07-31):
  ```text
  $ pnpm ops:live-cutover
  base=https://banco.today www=https://www.banco.today
  [FAIL] apex /nginx-health — Replit placeholder HTML (HTTP 404)
  [FAIL] apex /api/readyz — Replit placeholder HTML (HTTP 404)
  [FAIL] assetlinks — Replit placeholder HTML (HTTP 404)
  [FAIL] AASA — Replit placeholder HTML (HTTP 404)
  [FAIL] www home — Hostinger Horizons
  [FAIL] apex home — Replit “isn't live yet”
  Summary: 0/6 passed · verdict=NOT_CUTOVER
  exit code 1
  ```
- User impact: Mobile/web clients aimed at production domains cannot reach Coolify API; Universal Links broken.
- Regressions if wrong fix: Treating DNS as application bug; fake “certified” stamps.
- Recommended owner: **OPS** / Chair blocks public GO
- Recommended fix shape: Execute `OPS_GO_LIVE_CHECKLIST.md` A→G; re-run until exit 0. No Auditor code change.
