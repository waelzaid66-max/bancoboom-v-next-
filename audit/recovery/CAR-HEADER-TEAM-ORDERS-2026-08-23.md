# CAR / HEADER TEAM ORDERS — 2026-08-23

This document is coordination only. It does not authorize Product merge/deploy.

## Lane 1 — CAR host reconstruction writer

Authority branch: `fix/car-header-clean-splice-20260822`
Base: `1d88550684e48d8a48cb247a2847882028701c69`

Mission:
- reuse the existing `section-primary-strip`, `section-engine-strip`, `car-brand-origin-strip` exactly once through `CarsHomeHeader.controlsSlot` for CAR;
- remove only their old CAR sibling seats;
- preserve every callback/testID/accessibility/haptic/state authority;
- preserve non-CAR paths;
- no formatting/comment churn outside semantic hunks.

STOP after first Product commit and report exact SHA + compare before tests/package edits.

## Lane 2 — CAR historical lineage auditor

No Product write.

Verify and report:
- `beef91b...` first concealment decision;
- `42fb0930...` all-axes-visible correction;
- `e4cb8f27...` header-surface continuation;
- `c1bb10c5...` five-header assembly;
- `96e73639...` three-strip organization;
- current canonical relationship.

Classify each capability PRESENT / REGRESSED / SUPERSEDED / RUNTIME-UNPROVEN. Do not recommend wholesale restore.

## Lane 3 — Search/API contract auditor

No CAR UI write.

Trace each visible CAR axis end-to-end:
- market/currency;
- sort;
- listing mode;
- condition/payment-plan engine;
- brand/model;
- fuel/transmission/year;
- origin;
- map/list parity;
- Saved Search serialization.

For each axis bind:
`SectionSearchApp -> SearchCriteria -> buildSearchParams -> generated client/OpenAPI -> SearchService -> list/map consumer`.

Report only a proven backend/contract gap. Do not invent `vehicle_type` in this lane.

## Lane 4 — Runtime acceptance auditor

No Product write until Lane 1 produces a candidate.

On exact candidate SHA verify:
- 320/360/390/430 widths;
- AR/EN, RTL/LTR;
- loading/results/empty/error/map states;
- controls visible once, no overlap/clipping;
- hero/dock collapse returns real vertical space;
- Android elevation/safe area/keyboard;
- iOS safe area/keyboard;
- map/list and filter interactions remain reachable.

A screenshot without exact SHA is diagnostic only, not PASS evidence.

## Shared prohibitions

- no whole-file replacement of `SectionSearchApp.tsx`;
- no old repo/branch wholesale cherry-pick;
- no deletion of controls/features to make layout fit;
- no API/DB/Maps-provider/Messenger/Auth/Release change in CAR splice;
- no shared package manifest resolution by taking one branch wholesale;
- no canonical move/merge/deploy until final integrated evidence.