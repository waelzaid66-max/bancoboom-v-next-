# W1 — Chair Approve Plan

**Date:** 2026-07-31  
**Based on:** AUD-01, AUD-11, AUD-12  

| ID | Plan | Scope | Out of scope |
|----|------|-------|--------------|
| **REL-01** | Validate listing `specs.currency` on create/update | `ListingService` + shared `supportedCurrencies` helper; guard test | Taxonomy markets package move (AUD-02 Wave 2) |
| **REL-02** | `/readyz` fail-closed on missing `upload_claims` | `routes/health.ts` | Making `ensureSchemaPatches` fatal on boot (separate decision) |
| **REL-03** | Staging smoke incomplete ≠ green | `scripts/staging-p0-smoke.mjs` exit 2 when auth skipped | Requiring second JWT for IDOR (still optional warn) |

**Approve:** Chief Production Architect — execute on governing tip in this PR.  
**Reject for Wave 1:** Shared MARKET_COUNTRIES package migration; visual AUD-08 (needs screenshots — remains UNVERIFIED).
