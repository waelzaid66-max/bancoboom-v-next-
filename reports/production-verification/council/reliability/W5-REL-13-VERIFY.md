# W5-REL-13-VERIFY — cutover requires `upload_claims=ok`

**Seat:** Production Reliability Engineer · `bc-019fb4d1…53de`  
**Tip:** `a9f5c35` (Wave 5 / D-21)  
**Mode:** VERIFY only

## Evidence

| Check | Path | Pass |
|-------|------|------|
| Live cutover fails unless `upload_claims===ok` | `scripts/ops-live-cutover-check.mjs:183-191` | YES |
| API readyz sets `upload_claims` | `artifacts/api-server/src/routes/health.ts:103-119` | YES |
| Live run @ tip | `pnpm ops:live-cutover` → **NOT_CUTOVER 0/6** (Replit/Horizons — never reaches readyz JSON on public apex) | YES (OPS) |

**Note:** DNS still wrong-origin, so upload_claims branch is not exercised live on apex yet — code path is present and will bind once Coolify owns DNS.

**ACK:** REL-13 / D-21 landed. No re-code.
