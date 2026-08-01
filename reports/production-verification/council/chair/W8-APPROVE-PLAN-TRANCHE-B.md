# W8-CHAIR-APPROVE-PLAN — Tranche B (Discover dead melt props)

**Chair:** Chief Production Architect  
**Date:** 2026-07-31  
**SoT:** `main` (post Tranche A)  
**Studies:** W8-STUDY-01 (Discover dormant melt)  
**Owner:** «التالي» after Tranche A CLOSED  
**Plan parent:** `81-WAVE8-SECTION-BY-SECTION-DELIVERY-MACHINE.md`

---

## Elevate

Former HOLD “Discover dormant `onBrowseBrand`” → **narrow dead-prop cleanup** (not taxonomy epic). Props already unused in Discover body (`_on*` prefixes).

## Approve

| ID | World | Change | Forbidden |
|----|-------|--------|-----------|
| D-W8-03 | §1 Discover | Remove unused melt props from `SearchDiscover` + host pass-through in `search.tsx`: `onBrowseBrand`, `onApplySaved`, `onOpenListing`, `onSearchQuery`. Keep **only** `onExploreMap` → `/section/maps`. | No FilterSheet / CarPicker `browseBrand` delete · no Maps→RE · no Stay/RE rewrite · no section card route change |

## Success

- `SearchDiscover` Props = `{ onExploreMap }` only  
- Host Discover overlay does not pass brand/saved/listing/query melt callbacks  
- `browseBrand` / `browseBrandChip` remain for FilterSheet + CarPicker  
- section-miniapp-guard PASS · no new Discover→shared-Search bridge  

## EXECUTE

Chair lands on fix branch → merge `main`. Seats VERIFY (AUD-82 Discover melt severed) then **STANDBY**.
