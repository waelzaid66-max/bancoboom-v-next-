# W1-AUD-11 — readyz missing upload_claims (Chair-elevated)

## Finding AUD-11
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO**
- Evidence:
  - `/readyz` checks DB + money tables only (`routes/health.ts`).
  - `ensureSchemaPatches` creates `upload_claims` but boot treats patch failure as non-fatal (`bootstrap.ts`).
  - Upload ownership depends on `upload_claims`; API can report ready while promote/claim path breaks.
- User impact: Deploy looks healthy; media upload/IDOR ownership fails under incomplete migrate.
- Regressions if wrong fix: Stricter readyz blocks rollouts before migrate — **desired** for production.
- Recommended owner: **Reliability**
- Recommended fix shape: When `database===ok`, also `SELECT 1 FROM upload_claims LIMIT 0`; surface `checks.upload_claims`.
