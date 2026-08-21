# 99 — MAP-LIN-02 ROUTE + PLACEMENT AUTHORITY — 2026-08-21

**Status:** SOURCE-SIDE PLACEMENT RECONCILED / RUNTIME DEVICE UNPROVEN  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical audited:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`

## 1. Owner correction that defines the map placement

`reports/production-verification/73-SECTION-WIRING-TRUTH-AUDIT.md` captured the original defect on 2026-07-31: Discover's primary map CTA hardcoded `/section/real-estate?map=1`, making Maps look like a Real Estate feature. The audit presented owner choices and explicitly forbade melting the map into shared Search state.

`reports/production-verification/75-WAVE6-MAPS-MINIAPP-11-EXECUTE.md` records the subsequent **Owner correction**:

> Maps is a dedicated mini-app inside Search. Feeding maps into other sections is intentional duplication. Never delete Leaflet stack.

Locked placement from that correction:
- dedicated hub route = `/section/maps`;
- Discover primary Maps CTA = `/section/maps`, never forced Real Estate;
- secondary Discover map chips = per-section `?map=1`, intentionally retained;
- section-local map entry points remain local section overlays;
- all use the same Leaflet/SearchResultsMap family.

This owner correction outranks the earlier defective forced-RE state and any later cleanup proposal that treats duplicated entry points as accidental redundancy.

## 2. Current producer → consumer verification

### A. Discover primary Maps entry

CURRENT `SearchDiscover.tsx` explicitly documents:
- `onExploreMap` enters `/section/maps`;
- it must never hardcode Real Estate;
- primary map CTA is always present;
- secondary map feeds are intentional duplication.

CURRENT Search host contains `router.push("/section/maps")` for the Explore Maps action.

**Verdict:** `PASS SOURCE-SIDE`.

### B. Dedicated Maps hub consumer

CURRENT `app/section/maps.tsx` mounts only `MapsHubApp` and states:
- dedicated Maps section entered from Discover Search;
- Leaflet/clusters/SearchResultsMap lives here;
- same stack also feeds catalogues through intentional `?map=1`;
- never melt into Real Estate.

CURRENT `MapsHubApp.tsx`:
- imports and renders the shared `SearchResultsMap`;
- owns worlds `all | car | real_estate | materials | facilities | stays`;
- default world = `all`, not Car or Real Estate;
- `criteriaForWorld` locks the correct category per world;
- Stays world = `real_estate + engineKey=rent` as catalogue semantics, not hub identity;
- exposes section links back to each corresponding `?map=1` route;
- keeps `MiniAppBottomNav`.

**Verdict:** `PASS SOURCE-SIDE`; no second map implementation was introduced.

### C. Discover secondary section feeds

CURRENT `SearchDiscover.tsx` contains all five deliberate feeds:
- `/section/car?map=1`;
- `/section/real-estate?map=1`;
- `/section/materials?map=1`;
- `/section/factories?map=1`;
- `/section/booking?map=1`.

These are not duplicate bugs. The Owner correction explicitly preserves them so a buyer can enter the same map engine already scoped to a catalogue.

**Verdict:** `PASS SOURCE-SIDE / DO NOT DEDUPLICATE`.

### D. Section-local map overlays

CURRENT `SectionSearchApp` reads the `map` route parameter and uses the shared `mapLatch` helpers. Header map controls and the floating section map toggle use `openOrLatchMap`; they switch the local section between list and the shared `SearchResultsMap` while keeping the section's locked category/filter state.

Current host contracts enforce:
- category cannot drift through commit/update/applyPatch;
- FilterSheet is category-locked;
- `?map=1` latches until results can display;
- map pin open returns to listing detail;
- local section map does not route to `/section/maps` and does not change catalogue identity.

Booking/Stays has its independent `BookingStaysApp` implementation but follows the same local map latch and shared `SearchResultsMap`; its criteria remain `real_estate + rent`.

**Verdict:** `PASS SOURCE-SIDE / PRESERVE`.

### E. Header map controls

Custom Cars / Property / Materials / Facilities / Stay headers expose map actions through props owned by their host. The header component is not a routing authority. The host calls `openOrLatchMap`, preserving section state and the Owner presentational-only header principle.

Generic section fallback also carries a `section-header-map` affordance for worlds without a custom premium header.

**Verdict:** `PASS ARCHITECTURAL OWNERSHIP`.

### F. Seller/create/edit pin placement

`MapPinPicker` is a separate seller/listing location-entry capability. It is not the buyer browse map hub and must not be merged into MapsHub or used as a replacement for `SearchResultsMap`.

The accepted Maps inventory records create + edit pin support separately from browse Maps.

**Verdict:** `SEPARATE CAPABILITY / PRESERVE BOUNDARY`.

## 3. Three map surfaces that must never be conflated

| Surface | Purpose | Authority |
|---|---|---|
| `/section/maps` + `MapsHubApp` | all-world buyer Maps mini-app | dedicated hub; default world `all` |
| section `?map=1` / header/FAB local map | catalogue-scoped buyer results map | section state + `SearchResultsMap` |
| `MapPinPicker` create/edit | seller chooses listing coordinates | listing create/edit workflow |

All three may share coordinate concepts. They do NOT share navigation/state authority.

## 4. Explicit anti-regression rules

Reject unless a later explicit Owner override is found:
- primary Discover Maps CTA → Real Estate, Cars, or any single catalogue;
- deleting `/section/maps` because per-section maps already exist;
- deleting per-section `?map=1` because the hub already exists;
- introducing a second map implementation for the hub;
- bringing `react-native-maps` or Google-native map SDK into Banco Mobile;
- routing a local section header map button into the all-world hub and thereby losing section filters;
- using MapsHub world state as shared Search tab criteria;
- treating seller `MapPinPicker` as browse-map infrastructure.

## 5. Remaining Maps defect candidates after placement reconciliation

Placement is not the same as runtime correctness. The following remain separate:
- CURRENT native host still handles bridge bootstrap `error` together with `ready`; semantic correction candidate remains open;
- OSM network/tile availability needs real provider/device evidence;
- real GPS permission/deny/timeout needs physical-device evidence;
- draw-area touch feel and rotation/safe-area behavior need device evidence;
- map/list parity across all five catalogue worlds must be exercised against real backend data;
- accessibility and RTL physical rendering remain release gates.

None of these authorize a map-family rewrite.

## 6. MAP-LIN-02 verdict

`OWNER ROUTE AUTHORITY = PROVEN`  
`PRIMARY /section/maps = CURRENT PASS`  
`SECONDARY ?map=1 FEEDS = CURRENT PASS / INTENTIONAL DUPLICATION`  
`LOCAL SECTION MAP OWNERSHIP = CURRENT PASS`  
`MAP HUB REUSES ACCEPTED LEAFLET FAMILY = CURRENT PASS`  
`DEVICE/PROVIDER RUNTIME = UNPROVEN`  
`PRODUCT MAP REWRITE = FORBIDDEN`

The previously empty `fix/maps-bootstrap-error-20260821` branch remains on HOLD until manager review of reports 97–99. If released, its scope must be strictly bootstrap failure semantics and tests on the accepted map family—no route/provider/dependency/architecture change.

Run npm run build.
