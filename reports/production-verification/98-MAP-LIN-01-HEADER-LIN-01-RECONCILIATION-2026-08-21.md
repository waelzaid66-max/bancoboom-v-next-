# 98 — MAP-LIN-01 + HEADER-LIN-01 RECONCILIATION — 2026-08-21

**Status:** CURRENT FORENSIC RECONCILIATION / PRODUCT WRITE STILL HOLD  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical audited:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Purpose:** close the first owner-law lineage pass for Mobile Maps and the five primary home headers before any further Product edit.

## 1. Governance recovered from the old manager plan

The old master plan is stricter than several later manager backlogs and must be treated as a safety contract, not noise.

`audit/master-plan/00-GATE-OWNER-REVIEW-FIRST-AR.md` states:
- understand all existing work before code;
- no random expansion;
- no visual changes to SearchDiscover / browseSection / FilterSheet without a gate;
- no bulk PR merge;
- move one wave at a time with an acceptance test.

`audit/master-plan/02-FIX-SHEET-WHY-HOW-AFTER-AR.md` says every proposed repair row required owner approval before execution.

`audit/master-plan/06-PHASED-WAVES-WITH-TESTS-AR.md` says Wave N+1 must not start until Wave N acceptance is closed and owner approval is written.

Therefore a recent manager task is NOT by itself sufficient authorization to modify a protected Product surface. It must be reconciled against owner law, current code and later explicit owner decisions.

## 2. MAP-LIN-01 — old/native map family vs accepted mobile map family

### 2.1 Pre-cleanup state

The Jul-29 Phase-X audit records `react-native-maps`, `@vis.gl/react-google-maps` and markerclusterer as declared-but-unused package contamination in Banco Mobile. It identifies the actual mobile implementation as `SearchResultsMap` + `mapHtml` using Leaflet WebView.

### 2.2 Accepted cleanup / architecture by Jul-30/31

`57-PRODUCTION-INVENTORY-HARMONY.md` records that unused `react-native-maps` and `@types/google.maps` were removed from Mobile and that Mobile Maps = Leaflet WebView.

`reports/verification-authority/2026-07-31/04-EXPO-BUILD-DEPENDENCY-AUDIT.md` records an explicit **Maps native module ban** and says the confidence gate forbids `react-native-maps` in Mobile.

`docs/superpowers/specs/2026-07-31-production-messenger-maps-inventory.md` records the accepted Mobile browse-map stack:
- Leaflet 1.9.4;
- MarkerCluster 1.5.3;
- vendored/inlined JS/CSS libraries;
- OpenStreetMap raster tiles over network;
- native host = `react-native-webview`;
- web host = iframe;
- server map contract = `GET /v1/search/map`;
- explicitly not `react-native-maps`.

CURRENT `artifacts/banco-mobile/package.json` contains `react-native-webview` and does not contain `react-native-maps`.

CURRENT code search did not find `MapView` / `PROVIDER_GOOGLE` Mobile use.

### 2.3 Accepted Mobile map capabilities / placement lineage

The accepted lineage includes:
- local map overlay in each marketplace section;
- `/section/maps` as a separate all-world Maps hub;
- Discover primary map route to `/section/maps`;
- per-section `?map=1` producers;
- Booking/Stays local map locked to rent semantics;
- Car Import reaches Cars through import engine rather than introducing a second shipment map;
- same criteria as list into map cluster requests;
- near-me radius/circle;
- viewport server clustering;
- stale-response rejection;
- draw-area filtering with server bbox + one client polygon implementation;
- bottom-nav clearance;
- inline SVG map chrome rather than platform emoji/font icons.

### 2.4 Current classification

**Mobile Leaflet/WebView family:** `ACCEPTED LINEAGE / PRESERVE`.

**Any Mobile `react-native-maps` / Google-native reintroduction:** `REGRESSION-CANDIDATE / DO NOT RESTORE` unless a later explicit owner decision overriding Jul-30/31 is proven.

**Google map code in banco-web / banco-website:** separate web surface. Do not confuse it with the banned Mobile native-map path.

### 2.5 Bootstrap-error defect

The CURRENT Leaflet host is inside the accepted lineage, so the previously identified `msg.type === "ready" || msg.type === "error" -> setReady(true)` concern is attached to the correct map family, not a legacy/native map.

However it remains **HOLD FOR A BOUNDED DEFECT BATCH** until this report is reviewed by the manager/owner coordination ledger. It does NOT authorize any provider rewrite, native maps dependency, Maps hub rewrite, or route change.

## 3. HEADER-LIN-01 — five-header authorization and execution lineage

### Cars

- Owner supplied design references existed.
- Original Fable contract requires presentational-only component, pinned browse controls, scroll identity-only, no invented counts, no direct hex, no testID deletion, RTL and 320dp evidence.
- Later Cars integration/collapse defects were independently found and corrected.
- CURRENT header component remained unchanged after its later freeze/render evidence.
- **Disposition:** `PRESERVE / CURRENT RUNTIME REVERIFY`, no rebuild.

### Property

- Owner supplied design references existed.
- Split/collapse work later moved identity prose while keeping browse controls reachable; an early compression clipped PROPERTIES and was corrected after visual evidence.
- CURRENT Property header remained unchanged after its later freeze/render evidence.
- **Disposition:** `PRESERVE / CURRENT RUNTIME REVERIFY`, no rebuild.

### Materials / B-CORE

- Owner supplied design reference existed.
- Later split/collapse and materials origin ownership had conflict history; final current host keeps materials browse axes outside the scroll identity slice.
- CURRENT Materials header remained unchanged after its later freeze/render evidence.
- **Disposition:** `PRESERVE / CURRENT RUNTIME REVERIFY`, no rebuild.

### Facilities / B-INDUSTRY

Fable order initially marked B-INDUSTRY HOLD because no design reference was supplied.

Commit `7d5ac72d9fd6454aa18bb39b23cd24ba00627f5b` explicitly states: **the owner lifted the standing hold and asked for this section identity to be designed**.

Later `ca190187...` corrected a real owner-law violation: the facilities type strip had been put in the scrolling slice and disappeared under empty/error overlay. The type strip was moved to pinned and the brand lockup was made collapsible.

- **Owner authorization:** `PROVEN`.
- **Current placement law:** browse type strip pinned; identity may scroll/collapse.
- **Disposition:** `PRESERVE / CURRENT RUNTIME REVERIFY`.

### Booking / B-OOM STAY

Fable order initially marked B-OOM STAY HOLD because no design reference was supplied; it required either owner-supplied design or explicit permission to derive from the visual language.

The lineage shows:
1. `80b1a175...` split Stay and moved type tabs into listHeader.
2. `24fdbf88...` attempted clipping corrections.
3. `fdbb4fff...` reverted both because the owner asked for polish, not restructuring, and the type tabs disappeared in empty/error state under the opaque overlay.
4. `f9a546ad...` documented the defects and restated that browse controls must remain pinned.
5. `e66a5619...` later rebuilt B-OOM STAY **on the Cars shape**, explicitly saying no design render existed and treating the owner-approved Cars shape as the reference.

The search performed in this pass found the rebuild commit itself but did NOT find a separate explicit owner statement authorizing the Fable option “derive B-OOM STAY from the same visual language.”

Therefore:
- CURRENT Stay implementation is real and later host/render evidence exists.
- The old broken split remains reverted and must never be restored.
- Browse controls must remain pinned.
- **Owner derivation authorization:** `UNPROVEN IN THIS PASS`.
- **Disposition:** `PRESERVE IMPLEMENTATION / NO VISUAL REWRITE / OWNER-AUTHORIZATION GAP TO CLOSE`.

This is not a claim that current Stay is wrong. It is a refusal to label it owner-approved until the authorization evidence is located.

## 4. HDR-LIN-02 — current browse-control placement safety

Owner/Fable law: `pinned = top bar + brand + search + all browse controls`; `scroll = hero/tagline/stats only`.

Current host reading:
- Cars: header pinned; filter/market/sort/engine/brand/origin bands remain outside listHeader and are visible; `continuesBelow` is visual continuity, not duplicated ownership.
- Property: pinned home header; no Property scroll header currently handed to SearchResultsSurface.
- Materials: pinned home header + scroll identity/tagline slice; material/origin/commodity controls live outside the listHeader.
- Facilities: pinned home header owns type browse control; scroll slice is identity-only.
- Stay: StaysHomeHeader remains outside SearchResultsSurface; host passes scrollY but no browse-control listHeader.

**Current overlay-trap result:** no proven current browse control is intentionally owned only by a scrolling listHeader in these five worlds.

## 5. Manager task intake — accepted / held / rejected

### ACCEPTED NOW — audit only
- complete old/new map lineage and route placement ledger;
- reconcile owner approvals for five headers;
- report cleanup/disposition without deleting unique evidence;
- CI runner/root-cause audit;
- Android release-compliance audit;
- release/deploy SoT audit on isolated release branch.

### HOLD UNTIL OWNER-LAW RECONCILIATION REVIEW
- Maps bootstrap-error Product patch;
- any Stay visual/header rewrite;
- any movement of controls between pinned and scroll/listHeader;
- any Search/Discover layout restoration from historical rails.

### REJECT WITHOUT EXPLICIT NEW OWNER OVERRIDE
- reintroducing `react-native-maps`/Google-native maps into Banco Mobile;
- replacing the accepted Leaflet/WebView map family wholesale;
- reconnecting Discover section cards to shared Search state (`onBrowseSection` melt);
- rebuilding the five headers from old Fable prompts;
- deleting features/reports to obtain green status.

## 6. Required next forensic work

1. MAP-LIN-02: route/placement chronology for `/section/maps`, each `?map=1`, each header/local map trigger, and Discover producers.
2. Search Git/report evidence for explicit owner authorization of the B-OOM STAY derivation/rebuild after the Fable HOLD.
3. Reconcile each current manager directive in Issue #7 against this ledger and mark ACCEPT/HOLD/REJECT.
4. Do not execute the empty `fix/maps-bootstrap-error-20260821` branch until steps 1–3 are closed.

## Verdict

`MAP-LIN-01 = CLOSED FOR ARCHITECTURE FAMILY`  
`HDR-LIN-01 = CLOSED EXCEPT STAY OWNER-AUTHORIZATION EVIDENCE`  
`HDR-LIN-02 = SOURCE-SAFE / DEVICE-RUNTIME UNPROVEN`  
`PRODUCT WRITE = HOLD`  
`PRODUCTION = NO-GO`

Run npm run build.
