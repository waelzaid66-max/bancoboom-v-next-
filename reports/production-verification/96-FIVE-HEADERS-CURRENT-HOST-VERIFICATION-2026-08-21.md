# 96 — FIVE HEADERS CURRENT-HOST VERIFICATION — 2026-08-21

**Status:** SOURCE/RENDER FORENSIC PASS / EXACT-CURRENT EXECUTION BLOCKED / DEVICE UNPROVEN  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical audited:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`

## Verdict

No CURRENT source defect was reproduced in the five header components or their host placement during this pass. Do not rebuild or redesign them. The remaining certification gap is exact-current executable CI/native-device evidence plus broader state coverage, not a reason to replace accepted header architecture.

## Freeze-to-current continuity

Each header component was compared from its own accepted freeze/render checkpoint to CURRENT canonical:

| Header | Reference checkpoint | Current file delta after checkpoint | Classification |
| --- | --- | --- | --- |
| Cars | `e3f92c2422a51a3092d2c7bf61f14d1f6284c9ee` | `CarsHomeHeader.tsx` absent from later diff | PRESERVED |
| Property | `7e2b4ed4b17bca2d01f4c1ded8edd1d2965263eb` | `PropertyHomeHeader.tsx` absent from later diff | PRESERVED |
| Materials | `43372e40892eaf3539e3798cc55bd69fbae7693f` | `MaterialsHomeHeader.tsx` absent from later diff | PRESERVED |
| Facilities | `91eed368cf141396aa3f7d30b9a67691314c51b8` | `FacilitiesHomeHeader.tsx` absent from later diff | PRESERVED |
| Stay | `a8036e67853ca00f097cbf2fc122d74e203fd4fc` | `StaysHomeHeader.tsx` absent from later diff | PRESERVED |

A broader comparison from earlier checkpoints can show later changes to another header (for example Facilities appears changed after the Stay checkpoint); that is not evidence that the header changed after its own freeze. Per-header chronology is the authority.

## Current host ownership

### Cars
- pinned `CarsHomeHeader`, `scrollY=carScrollY`, `continuesBelow`;
- market/sort single authority remains the host `section-primary-strip` under W8 D-W8-01;
- header does not receive market/sort handlers;
- no results `listHeader`; actionable controls stay outside opaque result-state overlays;
- brand/origin and engine/listing axes retain separate seats.

### Property
- pinned `PropertyHomeHeader`, `scrollY=propertyScrollY`;
- no results `listHeader`;
- current actionable axes stay outside opaque loading/error/empty overlay.

### Materials
- pinned `MaterialsHomeHeader` plus `materialsScrollHeader` identity slice;
- one current `materials-origin-strip` integrated with the materials type axis;
- scrolling slice carries identity presentation, not a second actionable origin/control authority.

### Facilities
- pinned `FacilitiesHomeHeader` plus `facilitiesScrollHeader`;
- controls remain wired to the real host handlers;
- scrolling slice is the deliberate list header and uses its own `facilitiesScrollY`.

### Stay
- separate `BookingStaysApp` host;
- pinned `StaysHomeHeader`, `scrollY=staysScrollY`;
- no Stay `listHeader`; compact country/sort/Wanted/rental controls remain outside the list;
- local map and `MiniAppBottomNav` remain mounted.

## Current host render evidence

`SectionSearchApp.render.test.tsx` mounts the real parent host with frozen child probes and verifies:

- per-section pinned/scrolling composition matrix;
- Materials identity through loading;
- Property identity through error + retry;
- Facilities empty recovery, buyer-request and RFQ routing;
- category/locked-engine preservation through FilterSheet updates;
- `?map=1` latch and local map toggle while results remain mounted.

`BookingStaysApp.render.test.tsx` verifies:

- pinned Stay identity + shared scroll contract through loading;
- error + retry;
- empty recovery to the locked `real_estate/rent` baseline;
- FilterSheet hard lock to Real Estate + rent;
- StayCard result route into booking-focused detail;
- `?map=1` latch, exclusion of unmappable items and list return;
- dirty-filter reset before leaving.

These suites complement individual header render suites. They are not a substitute for real Android/iOS rendering.

## Coverage gaps — do not overclaim

- Current host suite does not independently enumerate every state for every SectionSearchApp world (for example Car empty/error and all permutations of loading/error/empty for Property/Materials/Facilities).
- Host suite uses probes for the already-frozen child header components by design; component render suites and host orchestration evidence must be read together.
- Exact CURRENT SHA GitHub execution is blocked by Actions pre-Step-1 infrastructure behavior.
- Physical Android/iOS safe-area, font metrics, 320/360/390/430 pressure, keyboard, real-results scroll collapse, RTL/LTR and map overlay collision remain UNPROVEN.

## Hard regression rules

- Never move actionable header/filter controls into `SearchResultsSurface.listHeader` merely to simplify component structure.
- Never restore a second Cars market/sort seat.
- Never restore a second Materials origin seat.
- Never share one scroll SharedValue across section worlds.
- Never remove current map handlers, testIDs, mini-app category lock or MiniAppBottomNav to make render/tests simpler.
- Never call historical web screenshots native proof.

## Decision

The five headers are **PRESERVED at source/component/host architecture layers**. No Product header fix is authorized from this audit because no current header defect was reproduced. Continue with the independently reproduced Maps bootstrap failure semantic defect, while keeping exact-current header/device verification in the production gate matrix.

Run npm run build.
