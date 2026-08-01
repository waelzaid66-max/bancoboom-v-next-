# W2-CHAIR-APPROVE-PLAN — Reliability Wave 2

**Chair:** Chief Production Architect  
**Date:** 2026-07-31  
**Tip:** `cursor/final-production-acceptance-e37c` / PR #32  

## Approved for immediate implementation

| ID | Source | Scope | Constraints |
|----|--------|-------|-------------|
| **REL-04** | AUD-03 | `artifacts/banco-mobile/app/(tabs)/profile.tsx` Skip label → `t("profile.skipRole")` + EN/AR keys | Do not reopen search-contract / nearest strings |
| **REL-05** | AUD-09 + **D-07** | Dealer investment-form-sheet, rfqs, global-supply currency writes: allowlist UI + matching API validation using taxonomy-derived set (`listingCurrencyAllowlist` / shared helper) | Same set as listings; USD/EUR remain via EXTRA_CURRENCIES; no exotic free-text |
| **REL-00** | Process | Tip gate re-verify after REL-04/05 | Record in `W2-REL-00-tip-reverify.md` |

## Optional

| ID | Scope |
|----|-------|
| **REL-06** | AUD-06 residual — enum→route matrix doc + guard rows only |

## Already done by Architect (do not redo)

| ID | Landing |
|----|---------|
| **AUD-02 / D-08** | `@workspace/taxonomy/markets` + mobile/web/API re-exports |

## Rejected this wave

- Boot-fatal ensureSchemaPatches expansion
- Live Certified stamps
- Competing tips / #30 revival
