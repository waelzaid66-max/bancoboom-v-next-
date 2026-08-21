# PR #13 — CAR B-OOM Deep Monorepo Reconciliation — 2026-08-21

**Status:** CURRENT PATCH AUTHORITY / PRODUCT WRITE STILL BOUNDED / DO NOT MERGE YET  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical authority:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**PR:** `#13` / `fix/car-header-unified-dock-v2-20260821`  
**Purpose:** reconcile the owner's current CAR screenshot/layout directive with the full VNX/Claude/manager lineage and CURRENT monorepo contracts before the next Product patch.

## 1. Authority rule

The owner's current CAR directive is the newest explicit Product requirement for this surface: the broken vertically stacked CAR browse chrome must become one coherent native hero/header/dock, reclaim real viewport space, remove overlap/overflow/duplication, and preserve every control, counter, label, filter, callback and data flow.

That newer visual/structural instruction does **not** cancel the older safety invariants. It changes where the CAR chrome is presented, not who owns search state, filter semantics, category isolation, Maps architecture, API criteria or persistence.

The controlling authority is therefore the union of:

1. current owner directive + screenshot;
2. CURRENT canonical code;
3. reconciled manager reports 94–102 and PR #11 recovery ledgers;
4. accepted VNX/Claude implementation history where CURRENT source still preserves the same invariant;
5. exact executable/runtime evidence.

No single old prompt, report, branch, screenshot or test count is sufficient by itself.

## 2. Monorepo invariants that the CAR patch must preserve

### Section/search authority

`SectionSearchApp` remains the sole owner of:
- `SearchCriteria` and section hard-lock;
- `useSearchMiniApp` update/commit/applyPatch behavior;
- market persistence;
- sort/listing/engine/origin/brand selection semantics;
- Saved Search snapshot/identity call sites;
- FilterSheet state and callbacks;
- route intents (`?map=1`, engine/property-type deep links);
- results/map/list orchestration.

The CAR header/dock may receive layout nodes and callbacks, but must not become a second criteria/state authority.

### Empty/loading/error safety

The accepted failure trap is proven: `SearchResultsSurface` may cover `ListHeaderComponent` with opaque loading/error/empty overlays. Therefore actionable CAR controls must remain outside the result list/listHeader region.

The new dock may collapse with the pinned hero, but it must remain in the pinned host flow. Do not move CAR browse controls into `SearchResultsSurface.listHeader`.

### Maps authority

Preserve the accepted Mobile Leaflet/OSM/WebView family and the three intentional entry classes:
- `/section/maps` all-world hub;
- per-section `?map=1` producer;
- local category-locked `SearchResultsMap` overlay.

PR #13 changes layout only. It must not alter map provider, cluster/draw/near criteria, route authority, or MapsHub state. The surviving CAR map affordance may toggle Map/List locally; removing only a duplicate floating CAR map button is allowed if the map capability remains reachable exactly once.

### Saved Search / domain isolation

CAR layout work must not touch Saved Search identity/reconciliation defects or Discover placement. Preserve the existing save callback and full CAR criteria snapshot. SS-LIN-01..04 belong to separate bounded work.

### API / listings / Messenger / Accounts / Release

No API, DB, migration, listing moderation, media lifecycle, Messenger, Clerk/account, EAS, Docker/Coolify or release behavior belongs in this CAR patch. Those lanes have independent confirmed blockers and owners.

## 3. Historical CAR lineage — what is still useful

Claude/VNX history is evidence, not copy authority.

Useful preserved facts:
- the real hero plate collapse defect was fixed by reclaiming actual height, not opacity-only hiding;
- CAR filters were intentionally organized as three single-line horizontal strips rather than a wrapping block;
- market/sort, listing/engine, brand/origin remained reachable and were not deleted;
- visual continuity used one dark surface rather than detached cards;
- no invented counters; categories/stats are data-driven;
- category glyphs are SVG-based;
- current host must keep exactly one seat for each interactive axis.

Historical line numbers, component split and old `continuesBelow` placement are not mandatory implementation shapes after the owner's newer dock instruction.

## 4. Current PR #13 architecture — accepted parts

Keep these parts unless executable evidence disproves them:
- `CarsHomeHeader` remains pinned and receives `carScrollY`;
- hero and extra browse context reclaim real height during collapse;
- Search / Map-List / Save / Filters remain reachable when extras collapse;
- `controlsSlot` is a layout seam inside the pinned CAR dock, not a data/state seam;
- CAR has no results `listHeader`;
- `SectionSearchApp` still owns callbacks/state;
- old external CAR seats are excluded to prevent live duplication;
- `SearchResultsMap`, FilterSheet, pickers and MiniAppBottomNav remain mounted;
- CAR section contract remains `listingMode: "pill"`, `engines: "chips"`;
- SVG category strip and honest live stats remain.

## 5. Current PR #13 defects / overreach — must be corrected before merge

### CAR-P13-01 — unnecessary control-system reimplementation

`CarBrowseAxes.tsx` recreates the existing market/sort/listing/engine/brand/origin runtime controls in a new ~400-line presentation system. State authority remains in `SectionSearchApp`, so this is not a second data store, but it still creates unnecessary semantic/accessibility/test/style drift.

The current splice contract from coordination is narrower: move/reuse the existing CAR control nodes/semantics into `controlsSlot`, with exactly one runtime seat for each critical testID. Do not invent a second CAR control language merely to dock the same functions.

**Required correction:** use `controlsSlot` as a layout relocation boundary for the existing CAR axes; retain `SectionSearchApp` callbacks and established axis-shape contract. No new business semantics.

### CAR-P13-02 — unrelated Real Estate capability deletion

The dormant `showReTypeStrip` renderer lost its non-pill/chips fallback during the CAR splice. Even though the current gate is false, this is a non-CAR source capability deletion and violates isolation.

**Required correction:** restore the canonical fallback behavior/testIDs without changing its current gate or RE product behavior.

### CAR-P13-03 — CAR results counter suppression in Map mode

`section-results-count` is currently suppressed under `isCarSection && mapMode`.

The owner directive explicitly forbids removal of counters/text. Map mode may compact or reposition it, not delete it.

**Required correction:** preserve the counter in CAR list and map result modes unless a later explicit owner decision changes the contract.

## 6. Exact next Product patch contract

One surgical patch only:

1. `SectionSearchApp.tsx`
   - remove runtime dependency on the replacement `CarBrowseAxes` implementation;
   - construct `carControlsSlot` from the existing CAR axis nodes/semantics and callbacks;
   - keep the three established horizontal compartments: primary market/sort/listing, engines/condition, brand/origin;
   - keep exactly one runtime seat for each existing CAR control/testID;
   - restore Real Estate chips fallback from canonical;
   - preserve `section-results-count` in CAR map mode;
   - do not change any non-CAR handler/state/API path.

2. `CarsHomeHeader.tsx`
   - retain the existing layout-only `controlsSlot`/collapse architecture unless the splice exposes a measured geometry defect;
   - no new state authority and no listHeader migration.

3. Tests
   - RED/GREEN zero-loss guard must prove one-seat ownership, RE fallback preservation, results-counter preservation, map/list capability, FilterSheet/pickers/nav presence, and no replacement control system;
   - mounted render coverage must prove dock contents remain outside result overlays and Search/Map/Save/Filter remain reachable at full collapse.

Do not delete the old helper file merely to make the diff look smaller until final diff/consumer verification proves it is unused. No folder move/deletion.

## 7. Verification matrix before merge

Source/static/render evidence is necessary but not sufficient.

Required exact-head evidence:
- focused CAR zero-loss + hero honesty + CarsHomeHeader render + SectionSearchApp render + section mini-app guard;
- mobile TypeScript check and Expo bundle/export;
- root monorepo `npm run build` / equivalent authoritative workspace gate without skipping unrelated workspace failures;
- diff against canonical proving no non-CAR behavior deletion;
- 320/360/390/430 width pressure;
- Arabic/English, RTL/LTR;
- loading/empty/error/results/map states;
- keyboard/search open/close;
- safe-area and font-scale pressure;
- Android elevation/z-order and iOS safe-area behavior;
- real scroll collapse proving vertical workspace is reclaimed and results begin immediately after the dock;
- no duplicate category row, market/sort seat, map affordance or filter axis.

Hosted GitHub red with absent execution steps remains `ROOT CAUSE UNPROVEN`; do not label code PASS/FAIL from color alone. Replit remains preview-only and must not be a source authority.

## 8. Parallel-lane coordination

- PR #9 remains Release/Deploy integration authority; PR #13 must not touch it.
- PR #12 remains DB baseline-adoption Gate 1; no production-like baseline execution.
- PR #14 remains Listings moderation RED lane; no CAR overlap.
- PR #15 Maps bootstrap fail-closed is a separate bounded accepted-map-family correctness lane; PR #13 must not duplicate it.
- PR #16 Discover visual polish is unrelated to the CAR defect and should remain isolated/draft until its own owner-law/current-runtime acceptance is established.

## 9. Manager self-correction

Earlier PR #13 work drifted into repeated implementation/report churn before the full monorepo lineage was reconciled. The correct correction is not a restart and not a rollback to old screenshots. It is a smaller patch surface built from current authority:

`new owner CAR layout requirement + old safety invariants + current state ownership + exact one-seat relocation + executable proof`.

No further CAR Product expansion is authorized beyond CAR-P13-01..03 until those are green and the mounted native layout is verified.

## Verdict

**PR #13 stays DRAFT / NO MERGE.**  
The owner's unified CAR dock target is valid and newer than the older visual placement, but it must be implemented as a bounded layout relocation over the existing monorepo contracts, not as a parallel control system or a collateral rewrite.

Run npm run build
