# PR #13 — CAR B-OOM Claude/Team Revalidation — 2026-08-21

**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Base:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**PR:** #13 `fix(mobile): unify CAR B-OOM hero dock`  
**Current reviewed head:** `e57c08da304652e49e47feda054e6dbade2bf955`  
**Decision:** `DO NOT MERGE / PRODUCT CONTRACT VIOLATION PRESENT / DEVICE PROOF ABSENT`

## 1. Authority hierarchy used

This revalidation does not trust any historical report by itself. Claims were checked in this order:

1. current owner direction and PR #13 acceptance comments;
2. current PR #13 source diff against canonical;
3. current recovery authority on PR #11 / Issue #7;
4. historical Claude commits only where CURRENT source reproduces the same contract or failure mode.

`SectionSearchApp.tsx` remains historically conflict-damaged. No wholesale file replacement is authorized.

## 2. Claude findings independently rechecked

### `857ae26c` — unified surface
Claude recorded that CAR filter bands must read as one continuous header surface without deleting market/offer/condition/brand/origin controls. The historical patch achieved that by keeping parent-owned controls and using `continuesBelow`; it did not create a second state authority.

**Current interpretation:** the visual principle remains valid, but the old implementation is not a blob to restore. Current `CarsHomeHeader.controlsSlot` is the newer receiving architecture.

### `96e73639` — clean three-strip layout
Claude recorded three existing strips:

1. market + sort + offer;
2. engine/condition;
3. brand + origin.

The important invariant was explicit: nothing removed or hidden; existing axes remained reachable.

**Current interpretation:** this supports moving the three existing nodes into the dock. It does not authorize reimplementing them as a new control system.

### `310028d5` — real height collapse
Claude found that visual-only collapse was insufficient and repaired actual height reclamation.

**Current interpretation:** PR #13's `cars-dock-extras` real-height collapse is directionally correct; runtime/device behavior is still unproven on the current head.

### `8b696073` forensic evidence pack
The pack identifies the then-current CAR strip ownership in `SectionSearchApp` and explicitly warns not to delete testIDs/bands and to validate on narrow widths.

**Current interpretation:** use it as historical evidence only. Line numbers are stale; ownership principle remains current because the current PR acceptance contract independently repeats it.

## 3. New current-source blocker found

PR #13 comment `5371903124` authorized exactly one host migration:

- physically move the **existing** `section-primary-strip`;
- physically move the **existing** `section-engine-strip`;
- physically move the **existing** `car-brand-origin-strip`;
- keep `SectionSearchApp` as state/criteria/handler authority;
- do **not** invent a second control system.

CURRENT PR #13 instead adds `CarBrowseAxes.tsx`, a 400-line second presentation implementation that recreates:

- market/currency;
- sort;
- listing-mode controls;
- engine chips;
- brand button;
- origin controls;
- new icon/shape/style mapping.

Callbacks still delegate to `SectionSearchApp`, so state authority was not duplicated. However the runtime control implementation itself was recreated rather than moving the existing nodes. That violates the authorized migration contract and increases semantic/accessibility/UI-drift risk.

**Classification:** `CURRENT PRODUCT CONTRACT VIOLATION / P0 FOR THIS PR`.

## 4. Other current blockers retained

1. Dormant Real-Estate `propertyType` chips fallback was deleted by the CAR host splice. It exists in canonical and must be restored exactly; CAR work may not delete non-CAR capability.
2. `section-results-count` is suppressed under `isCarSection && mapMode`; owner law requires the counter to remain.
3. Exact-head device/runtime verification is absent for 320/360/390/430, AR/EN, RTL/LTR, loading/empty/error, keyboard, safe areas, font scale and Android elevation.
4. Hosted CI status is not a Product verdict. Historical exact-canonical command execution is valid only for its exact SHA and does not certify PR #13.

## 5. RED contract strengthened

`tests/car-dock-zero-loss-guard.test.mjs` now intentionally requires:

- no `CarBrowseAxes` import/usage;
- one parent-owned `carControlsSlot`;
- the three existing runtime strips physically inside that slot;
- exactly one static seat for each critical CAR testID;
- existing `axisShape(chrome, ...)` semantics retained;
- non-CAR Property pill + chips renderer retained;
- results-count retained in map mode;
- Map/List capability retained while duplicate floating CAR map chrome is removed;
- Search/Save/Filter/categories/stats/profile/notifications preserved;
- `SectionSearchApp` remains state authority.

This guard is expected to remain RED until the implementation is corrected. Do not weaken it to match current source.

## 6. Authorized next implementation only

The next Product commit on PR #13 may do only the following:

1. remove the `CarBrowseAxes` reimplementation and its import after migrating the existing JSX nodes into `carControlsSlot`;
2. restore the canonical Real-Estate property chips fallback byte-for-byte;
3. remove the CAR-map suppression from `section-results-count`;
4. keep old CAR sibling seats unreachable after migration;
5. preserve every handler, testID, haptic, accessibility prop, FilterSheet path and picker authority;
6. no API/DB/Maps-engine/Messenger/Deploy/shared-contract changes.

After the source patch: focused RED/GREEN tests, full mobile chain, root `npm run build`, exact final-tree diff, then device/visual proof. No merge before all of those are bound to one exact SHA.

Run npm run build
