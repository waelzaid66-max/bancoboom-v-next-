# CAR B-OOM — CANONICAL-CLEAN REBUILD CONTRACT

Date: 2026-08-23
Repository: `waelzaid66-max/bancoboom-v-next-`
Receiving branch: `fix/car-header-canonical-clean-20260823`
Base authority: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`

## Status

This branch was created exactly from canonical and is the ONLY authorized receiving branch for the next CAR reconstruction candidate.

The current PR #13 head and `1d88550684e48d8a48cb247a2847882028701c69` are behavioral/evidence references only. Neither may be merged/cherry-picked/used as a full-file source.

`release/reconciled-rc-20260823` is rejected as RC/Product authority. Its CAR `carDockLane` layout (`flexBasis: 0`, `flexShrink: 1`, `minWidth: 0`) can collapse three horizontal ScrollViews to effectively zero-width lanes and is explicitly forbidden as a repair source.

## Exact first Product candidate

Use true local Git hunks only. No full-file replacement, formatter sweep, comment cleanup, import reordering, or non-CAR semantic change.

### 1. Preserve SectionSearchApp as the sole CAR state/criteria authority

Reuse the EXISTING runtime nodes and handlers. Do not recreate them in a second component:
- `section-primary-strip`: market/currency, sort, listing mode;
- `section-engine-strip`: engine/condition axis;
- `car-brand-origin-strip`: brand picker + origin;
- existing `selectListingMode`, `selectEngine`, `selectOrigin`, `setCarPickerOpen`, MarketCountry picker, FilterSheet and Search state.

Extract/reseat those same nodes as React nodes only as required to pass them into the header. Do not introduce `CarBrowseAxes` or another criteria owner.

Non-CAR generic paths must keep using the existing primary/engine controls. Dormant Real-Estate chips fallback must remain intact.

### 2. CarsHomeHeader may become a layout-only host

Allowed bounded additions:
- optional `controlsSlot: React.ReactNode`;
- optional `compact`/`mapActive` presentation flags if required for map/list behavior;
- a measured native dock under/overlapping the hero that renders the supplied controls slot;
- real-height collapse tied to existing `scrollY`;
- map button may toggle list when already in CAR map results.

Forbidden:
- owning SearchCriteria or duplicating callbacks/state;
- new API/facet/taxonomy behavior;
- fake vehicle counts/types;
- new navigation authority;
- second filter system.

### 3. Layout law — fixes the reproduced runtime defect

Do NOT place the three control strips as sibling flex lanes with `flexBasis: 0`/`minWidth: 0`.

At 320/360/390/430 widths each runtime control axis must have a positive measurable viewport and its content must be reachable. Preferred first candidate: stack the existing strips vertically inside one unified dark dock, each horizontal ScrollView full-width, while the dock itself is one measured header block. If vertical density is excessive, collapse/hide only through an explicit user control with tests; never by zero-width flex compression.

The header/dock must not overlap or cover the first result card. Results start after the measured mounted header block. Loading/empty/error overlays must not cover the pinned CAR controls.

### 4. Zero-loss invariants

Preserve exactly one runtime seat for:
- market/currency;
- sort;
- listing mode;
- engine/condition;
- brand;
- origin;
- search;
- save search;
- filter sheet;
- map/list;
- results count in list AND map modes;
- notifications/profile;
- CarPicker/LocationPicker/MarketCountryPicker;
- MiniAppBottomNav.

Suppress only duplicate CAR floating map chrome after the header map/list control is proven mounted. `SearchResultsMap` itself must remain.

### 5. First-candidate file budget

Product files should be limited to:
1. `artifacts/banco-mobile/components/search/SectionSearchApp.tsx` — surgical CAR-only host splice;
2. `artifacts/banco-mobile/components/search/car/CarsHomeHeader.tsx` — layout-only dock host.

Tests may add/update only focused CAR/SectionSearchApp render/static guards. Do not edit root/API/DB/Maps provider/Messenger/Auth/Discover/Release files. Do not edit package.json until the candidate tests exist and the union requirement is independently reviewed.

## Required RED/GREEN proof before any second Product commit

Static/render assertions must prove:
- each CAR control testID has one source definition and one runtime seat;
- no `CarBrowseAxes` runtime;
- controls slot is mounted in CarsHomeHeader;
- no `flexBasis: 0` zero-width CAR lane pattern;
- mounted CAR controls remain present in loading/results/empty/error and map/list paths;
- results count remains in CAR list + map;
- duplicate floating map chrome only is suppressed;
- non-CAR SectionSearchApp render contracts unchanged.

Then execute focused CAR guard/render + SectionSearchApp render + section-miniapp guard + mobile typecheck + Expo export + root `npm run build` on the exact candidate SHA.

Physical 320/360/390/430 AR/EN RTL/LTR Android/iOS evidence remains mandatory before acceptance; static tests cannot certify layout.

## Stop law

After the FIRST Product candidate commit: STOP. Post exact SHA, final diff/file list, commands actually executed, and failures. No second Product write until independent forensic review confirms the candidate is bounded and the runtime-width defect is structurally closed.

Run npm run build
