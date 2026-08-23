# PR #13 — CAR B-OOM Deep Monorepo Reconciliation — 2026-08-21

**Status:** CURRENT CORRECTION CANDIDATE / DRAFT / DO NOT MERGE YET  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical authority:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**PR:** `#13` / `fix/car-header-unified-dock-v2-20260821`

## Executed correction

Current CAR correction candidate: `9c0ddb14dbef453efabf4fb01862bb3a5b70ade0`.

This commit was built on the current PR head tree and changes only the `SectionSearchApp.tsx` blob relative to that head. It restores the host-owned CAR axis implementation that had already been inspected functionally, while keeping every other PR file at the current tree state.

The candidate now:
- removes runtime use/import of the parallel `CarBrowseAxes` presentation implementation;
- defines/reuses `primaryAxisStrip`, `engineAxisStrip`, and `carBrandOriginStrip` inside `SectionSearchApp`;
- seats those controls once inside `carControlsSlot` and passes them through `controlsSlot={carControlsSlot}`;
- keeps `SectionSearchApp` as the sole criteria/state/callback authority;
- restores the dormant Real Estate non-pill property-type chips fallback;
- preserves `section-results-count` in CAR list and map result modes;
- keeps the header Map/List path and `SearchResultsMap` capability while suppressing only duplicate CAR floating map chrome;
- preserves `FilterSheet`, `LocationPicker`, `CarPicker`, `MarketCountryPicker`, Saved Search calls, `MiniAppBottomNav`, section hard-lock and existing route/map-latch behavior.

## Monorepo protection

This is a CAR presentation/layout correction only. The following remain out of scope and must not be changed by this PR:
- API contracts and services;
- DB/schema/migrations/baseline adoption;
- listing moderation authority;
- Messenger;
- Clerk/accounts/KYC;
- Maps provider/engine/routes;
- Saved Search identity/reconciliation;
- Docker/Coolify/EAS/release authority;
- Property, Materials, Facilities and Stay behavior except restoring the unrelated RE renderer that CAR work had accidentally removed.

`SearchResultsSurface.listHeader` remains forbidden for actionable CAR controls because loading/error/empty overlays can cover that region.

The shared mobile `package.json` is a monorepo integration surface. Later assembly must union test additions from CAR, Maps and Discover lanes instead of overwriting one branch wholesale.

## Current diff truth

Compared with canonical, PR #13 remains broad because earlier CAR work already changed `CarsHomeHeader`, guards, render tests and audit files. The new correction itself is narrower in file scope, but the `SectionSearchApp.tsx` blob still contains comment/format churn inherited from the previously inspected staging implementation. That churn is not a runtime feature deletion, but it prevents declaring this a clean production splice without executable and final-diff proof.

`CarBrowseAxes.tsx` remains present as an added file for now but is no longer imported/rendered by the host. Do not delete it as cleanup until exact consumer verification and merge preparation; no folder deletion/move is authorized.

## Exact-head verification status

GitHub Actions run `32524440329` on `9c0ddb14...` completed red, but every inspected job reports `steps=null` and `logs_url=null`. Therefore the commands are not proven to have executed and the root cause remains `UNPROVEN`; the red color is neither Product PASS nor Product FAIL.

Required before merge:
- CAR zero-loss guard;
- CAR hero honesty guard;
- `CarsHomeHeader` render tests;
- `SectionSearchApp` render tests;
- section mini-app guard;
- mobile TypeScript check;
- Expo web export/bundle;
- authoritative root monorepo `npm run build`;
- final diff adjudication against canonical for non-CAR behavior preservation;
- mounted 320/360/390/430 width pressure;
- Arabic/English, RTL/LTR;
- loading/empty/error/results/map states;
- keyboard/search open-close;
- safe-area/font-scale;
- Android elevation/z-order and iOS safe-area;
- real scroll collapse proving the dock gives height back to results and creates no overlap.

## Parallel lane authority

- PR #9 — Release/Deploy integration authority.
- PR #12 — DB baseline-adoption gate; production-like execution remains frozen.
- PR #14 — Listings moderation gate.
- PR #15 — Maps bootstrap fail-closed lane.
- PR #16 — Discover polish lane.

No cross-lane source transplant or wholesale branch merge is authorized from CAR.

## Verdict

`9c0ddb14...` is the current CAR correction candidate. PR #13 remains **DRAFT / NO MERGE** until exact-head executable evidence and final monorepo diff review close.

Run npm run build
