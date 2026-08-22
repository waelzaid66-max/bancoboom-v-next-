# 97 — OWNER-LAW MAPS + HEADERS LINEAGE HOLD — 2026-08-21

**Status:** FORENSIC HOLD / PRODUCT WRITE PAUSED  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical audited:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`

## Why this hold exists

A recent-manager instruction is not automatically authoritative when older owner/manager records contain explicit safety and architecture laws. Product changes in Maps/headers are paused until chronology is reconciled from original owner law through CURRENT source.

The prior immediate Maps bootstrap-error patch remains a valid defect candidate, but it is NOT authorized for Product write until the current `SearchResultsMap` lineage is proven to be part of the accepted new-map path rather than a later override or mixed legacy path.

## A. Maps — recovered owner-era accepted lineage

### 2026-07-30 accepted inventory

`reports/production-verification/57-PRODUCTION-INVENTORY-HARMONY.md` records:

- Mobile Maps = **Leaflet WebView** (`mapHtml.ts`), not Google native maps.
- Unused `react-native-maps` and `@types/google.maps` were removed.

This is implementation evidence, not a later summary-only claim.

### 2026-07-31 production Maps inventory

`docs/superpowers/specs/2026-07-31-production-messenger-maps-inventory.md` records the accepted browse-map stack:

- Leaflet 1.9.4;
- MarkerCluster 1.5.3;
- libraries vendored/inlined;
- OpenStreetMap raster tiles over network;
- native host = WebView, web host = iframe;
- server contract = `GET /v1/search/map`;
- explicitly **not react-native-maps**.

It also records the accepted per-section behavior:

- Cars shared/local map;
- Real Estate local map + Discover entry;
- Booking/Stays local map with rent/bookable behavior;
- Facilities local map;
- Materials local map/header entry;
- Car Import only indirectly through Cars + import engine, not a separate shipment geo map.

Accepted/recorded fixes include MAP-01 latch, MAP-03 near circle, MAP-04 cluster data, MAP-05 web geolocation, MAP-06 locate error, MAP-07 local map libraries, MAP-08 nearest, MAP-09 edit pin picker, MAP-10 bridge guards, later MAP-08b draw area, MAP-11 bottom-nav clearance and MAP-12 drawn bookable icon.

### Agent memory contract

`.agents/memory/banco-mobile-map-view.md` states the design contract:

- not a native map module;
- no Google Maps API key dependency;
- WebView/iframe bridge;
- server viewport clustering with same filters as list;
- stale response rejection;
- loaded-page pins as degradation path;
- source validation for web postMessage;
- no duplicate geometry/math implementation.

### Forensic rule

Any later reintroduction of `react-native-maps`, Google-native map SDKs, a second native map implementation, or a competing map state authority is classified **REGRESSION-CANDIDATE** unless there is an explicit later OWNER decision overriding the Jul-30/31 architecture.

Do not infer approval from a newer timestamp, green build, or manager note.

## B. Headers — recovered owner law

`audit/handoff/FABLE5-ORDER-FIVE-HEADERS-AR.md` is an explicit Owner-issued construction order dated 2026-08-03.

The mandatory laws were:

1. Fable task was PRESENTATIONAL ONLY.
2. Fable could touch only the five header component files.
3. Fable could not touch `SectionSearchApp`, `BookingStaysApp`, `SearchDiscover`, `useSearchMiniApp`, or `lib/**`.
4. `slot="pinned"` = top bar + brand + search + **all browse controls**.
5. `slot="scroll"` = hero/tagline/stats only.
6. **No browse control may live in scroll** because the opaque empty-state overlay can cover `ListHeaderComponent`; this had already broken Booking and was reverted.
7. No invented counters; empty data means no stats/category strip.
8. No direct hex identity values in header files; tokens only.
9. No testID deletion.
10. RTL, 320dp no clipping, touch target >=44, visual screenshots required.

The same order explicitly said B-INDUSTRY and B-OOM STAY were HOLD at that moment pending owner decision because no supplied design existed. Any later implementation of those two must therefore be traced to the owner authorization/derivation decision before being called owner-approved.

## C. Prior manager errors already evidenced

`audit/handoff/MASTER-HEADERS-EXECUTION-PLAN-AR.md` records that earlier agents:

- described intent as delivered reality in documentation;
- had disconnected hero assets described as ready;
- incorrectly described Facilities constraints;
- broke Booking and reverted it;
- hit the same overlay trap in Property;
- duplicated work across agents;
- needed owner decisions on unresolved design/data questions.

Therefore current header existence + tests alone is insufficient to prove owner-plan compliance. Wiring lineage and owner authorization must be reconciled.

## D. Current immediate task ledger

### MAP-LIN-01 — legacy/new map family tree
- identify every historical `react-native-maps` / Google/native map file/dependency/route;
- identify removal/disable commit(s);
- identify Leaflet/WebView introduction and hardening commits;
- identify every later attempt to restore or mix old map paths;
- classify CURRENT map files by lineage.

### MAP-LIN-02 — route/placement authority
- trace `/section/maps`, per-section `?map=1`, local overlay, Discover producers, header map controls;
- determine which placement came from owner law versus later agent invention;
- preserve intentional duplicate entry points only when lineage proves them accepted.

### HDR-LIN-01 — five-header owner authorization
For each Cars / Property / Materials / Facilities / Stay:
- construction order;
- owner-supplied design or derivation permission;
- first implementation;
- first wiring;
- pinned/scroll ownership changes;
- empty-state failures/reverts;
- final accepted visual/runtime evidence.

### HDR-LIN-02 — browse-control placement audit
- enumerate every actionable browse control currently outside/inside each header;
- compare to the explicit pinned-only owner law;
- distinguish visual continuation from true component ownership;
- flag any current browse control that can be hidden by list overlay or moved contrary to owner law.

### MGR-AUD-01 — current manager decision audit
- compare every recent manager directive affecting Maps/headers against original owner-law ledger;
- reject directives that rely on recency instead of provenance;
- keep valid security/runtime findings only after confirming they target accepted architecture.

## E. Product write policy during hold

Until MAP-LIN-01/02 and HDR-LIN-01/02 are reconciled:

- no Maps Product edits;
- no header Product edits;
- no stale PR merge;
- no old code restoration;
- no new architecture;
- no dependency change for Maps;
- no moving browse controls between pinned/listHeader surfaces;
- documentation/audit-only commits are allowed.

## F. Current facts that remain useful but not final authority

The current five header component files appear preserved from their individual later freeze points and current host render suites contain meaningful orchestration coverage. Those facts are evidence of continuity, not proof that every later design/wiring decision complied with the original owner plan.

The current Maps bootstrap handling `ready || error -> setReady(true)` remains a reproduced semantic concern. It stays **HOLD-FOR-LINEAGE**, not dismissed and not yet patched.

## Decision

Return to owner-law-first forensics. Audit before repair. Repair only accepted architecture. Every Product action must cite the owner-law row, current defect evidence, touched files, rollback point and verification gates.

Run npm run build.
