# W1-REL-01/02/03 — Verify

## REL-01 Currency write enforce
- `enforceListingCurrencySpec` in `supportedCurrencies.ts`
- Called on `createListing` always; on `updateListing` when `updates.specs` provided
- Guard: production-wiring `REL-01: create/update enforce listing currency allowlist`

## REL-02 readyz upload_claims
- `routes/health.ts` checks `SELECT 1 FROM upload_claims LIMIT 0`
- Guard: `REL-02: readyz checks upload_claims`

## REL-03 staging smoke incomplete
- `scripts/staging-p0-smoke.mjs` exits **2** when `skippedAuth`
- Header documents exit codes
- Guard: `REL-03: staging smoke exits incomplete when auth skipped`

## Regression
- Typecheck api-server PASS
- Wiring 44/44 · chain 167 · confidence 18/18 · lint PASS
