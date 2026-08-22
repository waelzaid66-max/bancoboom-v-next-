# CAR / HEADER MONOREPO DEPENDENCY GRAPH — 2026-08-23

Authority baseline: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`

Purpose: determine where the CAR mounted UI lost owner-visible controls without treating the screen as an isolated component and without copying old branches wholesale.

## Executive finding

The current canonical CAR control logic is NOT deleted. The primary, engine/condition, brand and origin controls remain in `SectionSearchApp.tsx` with their original state authority, callbacks and testIDs. The currently mounted owner-visible defect is a layout/mounting problem: those controls remain sibling rows below `CarsHomeHeader`, consuming vertical space and falling outside the useful first viewport instead of being reused inside the header dock.

The clean implementation direction already exists in forensic history: keep `SectionSearchApp` as the state authority, hoist the EXISTING control nodes, and pass the same nodes exactly once into `CarsHomeHeader.controlsSlot` for CAR. Do not create a second control system and do not move state into the header.

## Proven lineage

### Phase A — first concealment mistake
`beef91b346ed86cd9b445547d365d45fd6d7af56`
- introduced the premium CAR hero;
- deliberately collapsed the browse axes behind a filter control to reduce first-screen crowding;
- preserved the underlying axes but made them not owner-visible on first paint.

### Phase B — owner correction: all axes visible again
`42fb0930e1e67a0bd3600b13616be18d035cba41`
- explicitly removed the collapse;
- restored listing mode, engine/condition, brand and origin to first render;
- documented that hiding or sideways burying controls was the wrong direction.

### Phase C — unified visual continuation
`e4cb8f273c21ed6e70ddf343239857867b60eae4`
- made the filter rows visually continue the dark CAR header surface;
- no control semantics changed.

### Phase D — assembled five-header checkpoint
`c1bb10c5fac0e88bb91b696aada4e67fc79d6cc3`
- assembled Cars/Stays/Facilities with Property/Materials integration;
- retained CAR as fully pinned because list-header overlays had previously hidden controls.

### Phase E — clean three-strip organization
`96e73639f45f3feffb93084d6d5cb3b661b41be7`
- organized the CAR controls into three strips:
  1. market + sort + listing mode;
  2. engine/condition;
  3. brand + origin;
- explicitly preserved every axis and testID.

### Phase F — current canonical
`4f2c81cc553938e808a98adb84d00ecfc76732c5`
- `SectionSearchApp.tsx` still carries the same three CAR strips and the same source blob as the historical organized checkpoint;
- therefore there is no source deletion between the organized checkpoint and current canonical for these controls;
- current owner-visible loss is the mounting/layout location of those rows relative to the hero and viewport, not a missing search contract.

## Dependency graph

### 1. Mobile state + mounted host authority

`artifacts/banco-mobile/components/search/SectionSearchApp.tsx`

Owns:
- committed `SearchCriteria`;
- market country selection;
- sort cycle;
- listing mode;
- engine/condition selection;
- brand/model;
- origin;
- category free-text quick search;
- saved-search integration;
- map/list latch;
- FilterSheet state;
- all critical CAR callbacks/testIDs.

CAR mounted nodes that must be reused, not copied:
- `section-primary-strip`;
- `section-engine-strip`;
- `car-brand-origin-strip`.

### 2. Header shell / layout receiver

`artifacts/banco-mobile/components/search/car/CarsHomeHeader.tsx`

Owns visual hierarchy only:
- top bar;
- identity/hero;
- search;
- map/save/filter entry points;
- vehicle category strip;
- live stats;
- scroll-collapse geometry.

It must NOT become criteria authority.

Correct target: one layout-only `controlsSlot` that receives the existing parent-owned nodes.

### 3. Section taxonomy / identity

- `artifacts/banco-mobile/components/CategoryTabs.tsx`
- `artifacts/banco-mobile/constants/engines.ts`
- `artifacts/banco-mobile/lib/sectionTheme.ts`

These define:
- CAR section identity;
- category-to-API mapping;
- engine filter definitions;
- section visual tokens.

Any CAR host reconstruction must preserve section isolation and must not leak Real Estate / Materials / Facilities criteria.

### 4. Search contract

`lib/search-contract/src/types.ts`

Authoritative shared criteria fields include:
- category;
- sort;
- brand/model;
- fuel/transmission/year;
- origin;
- marketCountry;
- near-me;
- listingMode.

`CLEAR_SECTION_ATTRS` exists specifically to prevent section-filter leakage.

### 5. Mobile query translation

`artifacts/banco-mobile/lib/searchParams.ts`

Maps the committed criteria to generated API query parameters and keeps list/map semantics aligned.

Critical CAR edges:
- category -> API category;
- listingMode -> `is_request`;
- engine -> condition/payment plan params;
- brand/model;
- fuel/transmission/year;
- origin_type;
- market_country;
- near-me coordinates/radius;
- sort.

### 6. Generated API contract

- `lib/api-spec/openapi.yaml`
- `lib/api-client-react/src/generated/api.ts`
- `lib/api-client-react/src/generated/api.schemas.ts`
- `lib/api-zod/src/generated/api.ts`

Rule: generated clients are never hand-edited during CAR recovery. If API contract changes are ever required, regenerate via repository codegen.

Current CAR layout repair does not require an API contract change.

### 7. API search semantics

`artifacts/api-server/src/services/SearchService.ts`

Backend already supports the visible CAR axes through real query semantics, including:
- `is_request`;
- `condition`;
- `payment_plan`;
- `fuel_type`;
- `transmission`;
- `brand`;
- `model`;
- `min_year` / `max_year`;
- `origin_type`;
- `market_country`;
- near-me;
- sort.

Therefore the disappearing controls are not blocked by missing backend support.

Vehicle-type quick categories are different: the current header deliberately uses free-text labels because no dedicated `vehicle_type` facet/query parameter exists. Do not invent one during the layout repair.

### 8. List / map consumers

- `artifacts/banco-mobile/components/search/SearchResultsSurface.tsx`
- `artifacts/banco-mobile/components/search/SearchResultsMap.tsx`
- `artifacts/banco-mobile/components/search/mapHtml.ts`

The same criteria must reach both list and map. CAR dock work must preserve:
- map/list latch;
- result count;
- saved state;
- map entry;
- bottom navigation clearance;
- map criteria refresh.

### 9. Saved Search

Saved Search is already a protected authority and must remain frozen during CAR layout work. The reconstruction must preserve persisted parameters and section isolation; no search-schema rewrite belongs in this lane.

### 10. i18n / accessibility

- `artifacts/banco-mobile/constants/i18n.ts`
- `artifacts/banco-mobile/context/LanguageContext.tsx`

CAR acceptance requires AR/EN, RTL/LTR and original accessibility/testID semantics. No hardcoded replacement labels.

## Exact defect classification

- Search state: `PRESENT`.
- Backend query support for market/sort/listing/engine/brand/origin: `PRESENT`.
- Generated API wiring: `PRESENT`.
- CAR control JSX: `PRESENT`.
- Controls mounted as a coherent header dock: `REGRESSED / PARTIAL`.
- Current owner-visible first viewport: `REGRESSED`.
- Current Replit tree identity relative to canonical: `UNPROVEN` until Replit finishes its busy operation and reports branch/HEAD/dirty state.

## First actual loss point

There are two distinct answers and they must not be conflated:

1. First historical source decision that hid owner-visible axes: `beef91b346ed86cd9b445547d365d45fd6d7af56` (controls collapsed behind a filter entry). This was later explicitly corrected by `42fb0930...`.

2. Current production-candidate defect: NOT a later deletion from canonical. The three control strips remain present in current canonical. The unresolved defect is the final host splice: the rows are still mounted as siblings below `CarsHomeHeader` rather than reused inside its dock/collapse geometry. That is why the current first viewport does not represent the intended zero-loss header design.

## Authorized repair shape

On clean branch `fix/car-header-clean-splice-20260822` from exact pre-splice `1d88550684e48d8a48cb247a2847882028701c69`:

1. Hoist the existing primary, engine and brand/origin JSX into local render variables without changing handlers/testIDs.
2. For CAR, pass those same variables exactly once through `CarsHomeHeader.controlsSlot`.
3. For non-CAR consumers, continue rendering the same generic variables in their current sibling positions.
4. Remove only the old CAR sibling seats.
5. Preserve result count in list and map, Saved Search, FilterSheet, map/list entry, category lock, MiniAppBottomNav, haptics and accessibility.
6. No API, DB, generated-client, Messenger, Maps-provider, Auth, Release or deployment changes.

## Acceptance

Before any merge:
- final diff against `1d885506...` must contain only true semantic CAR host hunks plus bounded tests;
- each critical CAR control testID has exactly one runtime seat;
- non-CAR behavior is unchanged;
- CAR loading/results/empty/error/map states preserve controls and count;
- widths 320/360/390/430;
- AR/EN + RTL/LTR;
- Android/iOS safe area, keyboard, z/elevation;
- mobile typecheck/export;
- root `npm run build`;
- visual runtime evidence bound to the exact final SHA.

No canonical move, merge, staging or deployment is authorized by this audit.