# W2-AUD-25 — Live cutover residual

## Finding AUD-25
- Severity: **CRITICAL** for public GO · not a code bug
- Status: **REQUIRES_OPS**
- Evidence (2026-07-31, tip context):
  ```text
  $ pnpm ops:live-cutover
  [FAIL] apex /nginx-health — Replit placeholder HTML (404)
  [FAIL] apex /api/readyz — Replit placeholder HTML (404)
  [FAIL] assetlinks — Replit placeholder HTML (404)
  [FAIL] AASA — Replit placeholder HTML (404)
  [FAIL] www home — Hostinger Horizons
  [FAIL] apex home — Replit “isn't live yet”
  Summary: 0/6 · verdict=NOT_CUTOVER · exit 1
  ```
- User impact: Production domains do not serve Coolify API/nginx
- Recommended owner: **OPS**
- Recommended fix shape: `OPS_GO_LIVE_CHECKLIST.md` only — no Auditor code change
