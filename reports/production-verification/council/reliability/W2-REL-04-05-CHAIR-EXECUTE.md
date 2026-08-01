# W2-REL-04-05 — Chair force-execute note

**Executor:** Chief Production Architect (Chair) — D-09  
**Date:** 2026-07-31  
**Reason:** Reliability seat still on stale `production-stabilize-53de`; Wave 2 Approve Plan was blocking the council clock.

## REL-04

- `artifacts/banco-mobile/app/(tabs)/profile.tsx` — Skip uses `t("profile.skipRole")`
- `constants/i18n.ts` — EN `Skip` / AR `تخطى`

## REL-05

- `artifacts/dealer-os/src/components/currency-select.tsx` — Select from `listingCurrencyAllowlist()`
- Wired in investment-form-sheet, rfqs, global-supply (no free-text currency Inputs)
- API: `listingCurrencyInputZ` on SubmitOffer, CreateInvestment, CreateGlobalSupply, RespondGlobalSupply

## Reliability next

File `W2-REL-04-05-VERIFY.md` after tip fetch + gate re-run. Do not re-code.
