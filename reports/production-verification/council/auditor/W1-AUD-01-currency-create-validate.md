# W1-AUD-01 — RE-VERIFY create-time currency (post REL-01)

**Tip:** `e0cd776` · **Auditor:** independent re-check after Chair/Reliability landed REL-01

## Finding AUD-01
- Severity: **LOW** (was HIGH before REL-01)
- Status: **ALREADY_FIXED_ON_TIP**
- Evidence:
  - `artifacts/api-server/src/lib/supportedCurrencies.ts`: `enforceListingCurrencySpec` — blank→EGP; unknown→`INVALID_DATA`; known→uppercase.
  - `ListingService.ts` create: `specs: enforceListingCurrencySpec(input.specs ?? {})` (~243).
  - `ListingService.ts` update: enforce when `updates.specs` merged (~1240).
  - Reliability verify claims wiring guard `REL-01` + tip gates green (`W1-REL-01-02-03-verify.md`).
  - Residual: `CreateListingSchema.specs` still `z.record(z.unknown())` — defense is service-layer, not Zod enum (acceptable if enforce always called).
  - Residual: allowlist values aligned with mobile `CURRENCY_BY_MARKET`+`EXTRA_CURRENCIES` by comment/contract, **not** shared import (see AUD-02).
- User impact: Unknown currency codes rejected on write on tip; display normalize remains for legacy rows.
- Regressions if wrong fix: N/A — do not rewrite REL-01.
- Recommended owner: none for Wave 1; Architect optional Wave 2 Zod enum
- Recommended fix shape: none now. Optional later: zod refine on `specs.currency` duplicating the set (keep single SoT helper).

## Auditor note to Chair
Original OPEN finding was correct at packet time. Tip advanced. Please record status flip in `COUNCIL-DECISIONS.md` if you agree.
