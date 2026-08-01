# W6-AUD-63 — Peer VERIFY REL-16/17/20 @ tip `59f3fba` (Wave 6b)

- Seat: Production Auditor · Protocol `68`  
- Tip: `cursor/section-wiring-audit-e37c` @ **`4afdf839ad998cc4e9be251b2e40b576ab24dab9`**  
- Product land: `85cfe7f` (no `artifacts/` delta since · docs-only tip moves) · Orders: **`76` §B** · EXECUTE `75` · Chair VERIFY · D-25  
- Sister: Reliability REL-16/17/20 VERIFY **PASS** — **ALIGN** · REL inventory ASSIGN ask = **not Auditor** (Maps world done)  
- Stamp: `2026-07-31T15:12:00Z` · guard tip archive **76/76 PASS** · cutover **NOT_CUTOVER 0/6**  
- Mode: VERIFY only · **zero product code**

## REL-16 — Maps #11

| Check | Tip evidence | Pass |
|-------|--------------|------|
| Discover primary | `search.tsx:491` `router.push("/section/maps")` | **YES** |
| ≠ RE hardcode | no exploreOnMap → `real-estate?map=1` | **YES** |
| FAB | `discover-map-toggle` → `exploreOnMap()` | **YES** |
| Route | `app/section/maps.tsx` → `MapsHubApp` | **YES** |
| Hub + Leaflet | `SearchResultsMap` · world tabs · `maps-hub` | **YES** |
| Intentional `?map=1` feeds | Discover portals + hub sectionHref | **YES** |
| Vendor present | `assets/map-vendor/*` (5 files) | **YES** |
| Guard | MOB-07 retargeted (Chair/REL 76/76) | **YES** |

**PASS**

## REL-17 — Cars chips

| Check | Evidence | Pass |
|-------|----------|------|
| `engines: "chips"` | `car.tsx:20` | **YES** |
| Chip testIDs path | SectionSearchApp `engine-${e.key}` | **YES** |

**PASS**

## REL-20 — CarsHomeHeader

| Check | Evidence | Pass |
|-------|----------|------|
| Mount | SectionSearchApp `<CarsHomeHeader` | **YES** |
| Header file | `car/CarsHomeHeader.tsx` | **YES** |

**PASS**

## Auditor JUDGMENT

**ALREADY_FIXED_ON_TIP** · peer **PASS** · do not re-implement.  
Align Chair `W6-CHAIR-VERIFY-MAPS11-BOOM-CAR` + Reliability VERIFY.  
Visuals UNVERIFIED · Live Certified **forbidden** · REL-21 HOLD.
