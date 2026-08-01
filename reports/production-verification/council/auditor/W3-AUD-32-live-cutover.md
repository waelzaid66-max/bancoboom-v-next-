# W3-AUD-32 — Live cutover re-probe

**Tip SHA context:** `31fbbc0` (code tip irrelevant to DNS)

## Finding AUD-32
- Severity: **CRITICAL** for public apex · not a code defect
- Status: **REQUIRES_OPS**
- Evidence (command, 2026-07-31):
  ```text
  $ pnpm ops:live-cutover
  Summary: 0/6 passed · verdict=NOT_CUTOVER · exit 1
  Replit apex · Horizons www · well-known unreachable
  ```
- Recommended owner: **OPS**
- Recommended fix shape: `OPS_GO_LIVE_CHECKLIST.md` only

Aligns Chair Accept criteria §E.4 — merge enables staging, not public apex.
