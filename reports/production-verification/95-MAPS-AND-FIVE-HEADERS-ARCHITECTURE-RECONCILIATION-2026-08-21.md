# 95 — MAPS + FIVE HEADERS ARCHITECTURE RECONCILIATION — 2026-08-21

**Status:** CURRENT FORENSIC RECONCILIATION / NO PRODUCT WRITE  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical audited:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Purpose:** reconcile old manager plans, later owner-approved evolution, current source, and known failure traps before any Product modification.

## 1. Chronology rule

Old manager plans are evidence, not automatically current authority. The accepted rule is:

`owner decision at time T -> implementation -> later owner review/evolution -> CURRENT source/guards`

A later accepted Product evolution can supersede an earlier UI-placement decision without invalidating the older defect evidence. Never apply a historical plan literally before checking whether later commits changed ownership while preserving the underlying invariant.

## 2. Discover and Maps — current architecture

The current product intentionally has THREE distinct map entry classes. They must not be collapsed into one:

1. **Primary Maps world**: Discover primary map CTA/FAB enters `/section/maps` -> `MapsHubApp`. This is the all-world Maps mini-app and must not be hardcoded to Real Estate or Cars.
2. **Per-section deep-link map**: Discover secondary map portal chips enter `/section/car?map=1`, `/section/real-estate?map=1`, `/section/materials?map=1`, `/section/factories?map=1`, `/section/booking?map=1`. This intentionally latches the LOCAL map in that section mini-app.
3. **Local section map overlay**: inside SectionSearchApp/BookingStaysApp, header/FAB toggles `SearchResultsMap` for the already locked section criteria. This is not `/section/maps` and must not mutate category ownership.

This duplication is intentional and was explicitly documented by the previous manager. Do not "simplify" it into one global map handler.

### Maps capabilities already present/preserved

- section map latch via `?map=1`;
- Maps hub independent world (`all` default, not RE hardcode);
- cluster/viewport query path;
- drawn search area with honest exact/floor count semantics;
- atomic MapsHub world hydration;
- stale criteria response rejection;
- locate error bridge;
- MiniAppBottomNav clearance for Leaflet controls/attribution;
- inline SVG map chrome (no icon-font/emoji dependency for the bookable pin);
- OSM tile-error bridge/user-visible alert;
- local map listing-open behavior including booking focus only for appropriate RE/bookable pins.

### Current known Maps defect — OPEN

`5f44c865` improved OSM tile-failure visibility, but CURRENT native `SearchResultsMap` still treats bridge `type:"error"` together with `type:"ready"` as `setReady(true)`. `error` is the bootstrap/page failure signal and must not be classified as ready. This remains a bounded semantic defect; do not rewrite Maps to fix it.

### Maps DO-NOT-TOUCH

- `/section/maps` remains the primary Discover map world.
- per-section `?map=1` producers remain; they are intentional duplication, not dead routes.
- each section remains category-locked when entering its local map.
- Car must not link itself into Import; Import may seed Car with `engine=import`.
- MiniAppBottomNav clearance remains a single derived contract; do not restore magic bottom offsets.
- draw-area/filtering remains one geometry implementation; do not add a second point-in-polygon implementation in generated HTML.
- do not add fake routing/isochrone/POI providers without an approved provider/ADR.

## 3. Five headers — current ownership, not Fable-era construction

The Fable-5 instructions were component-construction work orders. They explicitly prohibited wiring. Later commits assembled the five headers into the real mini-app hosts, fixed collapse/identity defects, and added render contracts. Therefore current work is **integration/runtime verification**, not rebuilding five headers.

### Cars

CURRENT ownership:

- `CarsHomeHeader(slot="pinned", scrollY=carScrollY, continuesBelow)` owns identity/top/search/map/save/category/stat presentation.
- `SectionSearchApp` owns the continuing filter surface below it.
- market country + sort SoT is the `section-primary-strip`, not CarsHomeHeader. This matches W8 D-W8-01 CURRENT code.
- listing mode/engine, brand/origin retain independent axes; visual continuity is created by `continuesBelow`, not by duplicating handlers in the header component.
- Cars results list receives NO `listHeader`; all control strips remain outside the opaque empty/error overlay.
- `carScrollY` still drives pinned-header collapse from the results list.

**Finding:** the historical W8 study detected a market/sort dual-seat before Tranche A. CURRENT source shows that dual-seat is resolved: CarsHomeHeader no longer receives market/sort handlers; primary strip is the single seat. Do NOT "fix" this again in the opposite direction.

### Property

- PropertyHomeHeader is pinned and reads `propertyScrollY`.
- market/sort/search/type/offer/wanted controls are on the pinned Product chrome according to current props.
- Property results list receives NO `listHeader` because earlier scrolling browse controls were swallowed by empty-state absolute overlay.
- `propertyScrollY` drives collapse while preserving mounted control ownership.

### Materials

- MaterialsHomeHeader has pinned + scroll split.
- pinned owns actionable chrome; scrolling slice is identity/tagline only.
- results list receives `materialsScrollHeader`.
- current Materials axis owns ONE `materials-origin-strip` inside `materials-type-strip`; the historical duplicate origin block was removed. Do not restore a second origin row.

### Facilities / B-INDUSTRY

- FacilitiesHomeHeader has pinned + scroll split.
- pinned owns controls; scroll slice carries identity/hero/type/proven count presentation as currently implemented.
- results list receives `facilitiesScrollHeader` and `facilitiesScrollY`.
- generic-header comments that once forbade FacilitiesHomeHeader are historical and were corrected after the real header shipped.

### Stay / Booking

- Booking uses its separate `BookingStaysApp`, not SectionSearchApp.
- `StaysHomeHeader(slot="pinned", scrollY=staysScrollY)` remains outside SearchResultsSurface.
- results list receives `scrollY` only; it does NOT receive a Stays `listHeader`, so the opaque empty/error overlay cannot swallow header controls.
- country/sort/Wanted/rental-term compact strip remains outside the results list.
- local map overlay and `MiniAppBottomNav` remain present.

## 4. The empty-state/scroll trap — still a hard invariant

`SearchResultsSurface` can render loading/error/empty as opaque absolute overlays over its list region. The old failure class was putting browse controls inside `ListHeaderComponent`; they then disappear precisely when results are empty/error/loading.

CURRENT correct split:

- Cars: no listHeader; controls pinned/outside.
- Property: no listHeader; controls pinned/outside.
- Materials: listHeader = scrolling identity slice only.
- Facilities: listHeader = scrolling identity slice only.
- Stay: no listHeader; header/compact controls outside.

Any future header change must preserve this. A "cleaner" component structure that moves actionable controls into listHeader is a regression even if static tests pass.

## 5. SearchDiscover chronology correction

Historical anti-melt memory remains valid for the invariant: do not restore recent/saved/popular/trending rails into Discover and do not route section cards into shared Search criteria.

However CURRENT Discover has later accepted portals beyond the early four-card memory: Booking/Stays, primary Maps hub, per-section map chips, Car Import, and business/supply/banks hubs. These later portals must not be deleted merely because an older memory file predates them.

## 6. Current verification classification

| Surface | Source architecture | Render/static evidence | Real native/device runtime |
| --- | --- | --- | --- |
| Cars header + integration | PRESERVED | historical render/contracts present; CURRENT source inspected | UNPROVEN on exact current SHA |
| Property header + integration | PRESERVED | render contract present | UNPROVEN on exact current SHA |
| Materials header + integration | PRESERVED | render contract present | UNPROVEN on exact current SHA |
| Facilities header + integration | PRESERVED | render contract present | UNPROVEN on exact current SHA |
| Stay header + integration | PRESERVED | historical render/contracts present | UNPROVEN on exact current SHA |
| Maps hub / local maps / per-section entries | PRESERVED by capability | bounded guards/render evidence exist | provider/GPS/device UNPROVEN |
| Maps bootstrap error state | DEFECT | source reproduced | needs bounded fix + tests/device |

GitHub Actions is currently failing before Step 1 on inspected current PR runs, so exact-current executable revalidation is blocked by Actions execution infrastructure. Historical green evidence is useful provenance but does not certify `4f2c81cc`.

## 7. Manager/agent execution direction

1. Do NOT rebuild headers or Maps worlds.
2. Do NOT delete later Product portals to satisfy older memory.
3. Verify CURRENT producer -> state -> API/persistence -> consumer -> render for each capability.
4. First bounded Product fix in this area should be the reproduced Maps bootstrap `error != ready` defect, unless a newer current-head defect is independently reproduced first.
5. Header work stays verification-only until a CURRENT defect is reproduced in mounted integration.
6. Physical Android/iOS verification must include 320/360/390/430-equivalent layout pressure, safe areas, empty/loading/error states, scroll collapse, map/bottom-nav collision, RTL/LTR, and real results.

**Certification:** architecture reconciled; Product/runtime certification remains NO-GO.

Run npm run build.
