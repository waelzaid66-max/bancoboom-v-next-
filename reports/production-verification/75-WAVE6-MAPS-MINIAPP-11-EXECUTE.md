# Wave 6 EXECUTE — Maps mini-app #11 + B-oom Car (2026-07-31)

**Chair:** Chief Production Architect  
**Branch:** `cursor/section-wiring-audit-e37c`  
**Owner correction:** Maps is a **dedicated mini-app** inside Search (count = **11**). Feeding maps into other sections is **intentional duplication**. Never delete Leaflet stack.

## Locked law

| # | Mini-app | Route |
|---|----------|-------|
| … | catalogues | car / RE / stay / materials / factories |
| **11** | **Maps** | `/section/maps` |
| … | Import / Banks / Accounts | unchanged |

Discover Maps CTA → **`/section/maps`** (never RE hardcode).  
Secondary Discover chips + section `?map=1` **kept** (intentional feeds).

## Landed

| ID | Change |
|----|--------|
| REL-16 | `MapsHubApp` + `app/section/maps.tsx` + Stack screen; Discover/FAB → Maps hub; world tabs All/Car/Properties/Materials/Factories/Stays; reuses `SearchResultsMap` |
| REL-17 | Car `engines: "chips"` (visible strip) |
| REL-20 | `CarsHomeHeader` Stay-parity (BOOM + CAR) mounted in `SectionSearchApp` |
| Guards | MOB-07 retargeted; section/maps registered; 76/76 section-miniapp-guard PASS |

## Forbidden (honored)

- No delete of map-vendor / clusters / FilterSheet / Import / Stay  
- Car ≠ Import  
- No Banks directory / RE header freestyle  

## Still HOLD

- REL-21 vehicle-type taxonomy tabs (planes/boats) until API facets Approve  
- Live Certified / Coolify cutover (Owner ops)
