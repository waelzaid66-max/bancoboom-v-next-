# W8-CHAIR-APPROVE-PLAN — Tranche C (pollution stabilize)

**Chair:** Chief Production Architect  
**Date:** 2026-07-31  
**SoT:** `main` @ `0893b8b`  
**Peers:** REL inventory (REL-W8-D01/D02/D03) · AUD-82 Tranche B PASS  
**Owner:** «كمل بدقة… شيل اي تلوث… اعداد كامل… تيستات»

---

## Approve (narrow only)

| ID | World | Change | Forbidden |
|----|-------|--------|-----------|
| D-W8-04 | §1 Discover host | Delete dead `applySaved` + unused `SavedSearch` import in `search.tsx`. Saved-tab still applies via nav params (`saved.tsx` → `searchCriteriaToNavParams`). | No FilterSheet/browseBrand · no Discover portal rewrite |
| D-W8-05 | §7 Maps prose | Align product/guard comments `#11` → **§7 of 10** (`maps.tsx`, `MapsHubApp`, Discover/search comments, section-miniapp-guard titles). Fix stale “enters RE map” test title. | No MapsHubApp behavior change · no Leaflet delete |
| D-W8-06 | Guards | Update `lib-hardening` assert: `applySaved` must be **gone**; keep nav-param + Saved-tab criteria asserts | No invent new product paths |

## Out of scope (HOLD)

Factories premium header · Banks directory · REL-21 · Live/Coolify Owner cutover · mockup-sandbox vite typecheck drift (pre-existing, not mobile SoT)

## Success

- mobile `pnpm test` + `typecheck` PASS  
- section/materials/production guards PASS  
- AUD-82 remains green · no sacred Stay/RE/Import/Banks rewrite  
