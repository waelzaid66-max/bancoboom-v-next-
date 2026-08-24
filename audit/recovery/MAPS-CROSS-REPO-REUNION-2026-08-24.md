# BANCO vNEXT — MAPS CROSS-REPO REUNION / FORENSIC RECONCILIATION

Date: 2026-08-24
Authority: GitHub source only. Replit excluded from source authority.
Historical canonical content baseline examined: `4f2c81cc553938e808a98adb84d00ecfc76732c5`.
Current integration examined: PR #72 `3b2f8e95efb2102a158aae181caadb104fb232d3`.

## Executive finding

The owner-visible Maps experience is materially behind the source history, but the first cross-repo pass changes the diagnosis: a large part of the allegedly missing Maps work is not absent from canonical source. It is present in current source but has not been certified as mounted/runtime-visible on one exact integrated SHA. The recovery problem is therefore a combination of source-present/runtime-unproven capability, historical side-branch lineage later evolved into canonical equivalents, a smaller set of real completeness gaps, and integration/runtime provenance failure.

No whole repo, branch or commit is a recovery unit. Recover capability only after exact current-source comparison.

## Six-repository archaeology corpus

1. `waelzaid66-max/bancoboom-v-next-`
2. `waelzaid66-max/bancoboomstor`
3. `waelzaid66-max/banco-with-wael`
4. `waelzaid66-max/-BANCO-CA-OOM-`
5. `waelzaid66-max/bancostormainvirgen`
6. `waelzaid66-max/bancoboom`

`bancoboom` did not surface a stronger recent Maps lineage in the first commit search than the other five. It remains in the census; it is not promoted to recovery authority by name alone.

## Proven historical Maps lineage

### `-BANCO-CA-OOM-`

- `cf9546eb...` — `/v1/search/map` viewport clustering endpoint + typed client; map/list share filter semantics.
- `fcd7d1c8...` — locate-me GPS control.
- `5a2d6c3f...` — emerald bookable pins.
- `dfd90195...` — per-section map identity/tints + bookable override.
- `d919ca58...` — strict section isolation and criteria-aware map behavior.
- `79dc2de3...` — Discover map FAB + latch.
- `25d655e4...` — Stay map latch.
- `1dfe6131...` / `5c6e8139...` — market-country map centers and wider-country coverage.
- `55e9ffed...` — owner-visible black-void/header/map-chrome repair class.
- `e2256953...` — forensic correction: evolved Maps, Car Import and mini-app bottom nav were not legitimately cancelled.

Side branch of interest: `claude/discover-map-card` / PR #47.

### `banco-with-wael`

Branches discovered:

- `cursor/maps-clerk-wiring-53de`
- `cursor/production-wiring-messenger-maps-1e3d`
- `cursor/wave9-inventory-maps-identity-e37c`

Relevant PRs:

- #26 — production Messenger/Notifications/Maps wiring waves 1–2.
- #27 — waves 3–4.
- #28 — Maps wiring: web Near Me, Discover producers, edit MapPinPicker, Stay overlay.
- #30 — merged waves 3–7, including MAP-01..MAP-10 lineage; merge SHA `ff0bbf2879766ad803d73d00e6dca7f22fc8b367`.

Capabilities proven in this family include map route/latch independent of page-pin availability, browser geolocation, locate-error honesty, Near Me radius circle, server cluster price/bookable/category payload, multi-section Discover producers, Materials/Factories/Stays entry wiring, edit MapPinPicker + lat/lng persistence, shared `mapLatch`, vendored Leaflet + MarkerCluster, real `sort=nearest` Haversine + Near-Me gate, bridge guards, and StayCard map preview.

### `bancostormainvirgen`

- `7cb136a8...` — recovered market-country framing.
- `d60bb307...` — user radius 5/10/25/50/100 km + visible circle.
- `78def858...` — two-layer map: immediate page pins + server viewport clusters.
- `28c4267e...` — later map/section coverage verification.
- `507e84fc...` — independent cross-repo archaeology finding lost map-center capability.

### `bancoboomstor`

- `a4c1eb04...` — honest draw-area: server bbox narrowing + polygon filtering + exact/non-exact count.
- `127e3d7b...` — lift Leaflet bottom controls and OSM attribution above `MiniAppBottomNav` using one clearance authority.
- `34709b45...` — deterministic SVG bookable glyph.
- `8d7105a9...` — stale viewport response guard.
- `12ce4f4f...` — Maps closeout ledger; OSM raster network intentionally remains external.

### `bancoboom-v-next-`

Later hardening:

- `02149836...` — draw-area parity/honesty hardening.
- `0341b65b...` — MapsHub world atomicity during hydration.
- `290039db...` — reject stale criteria responses.
- `5f44c865...` — surface OSM tile failures.

Older commit identity must never overwrite these later protections.

## Current canonical source truth

Direct source inspection proves these capabilities are already PRESENT in the examined canonical content:

- `marketCountryMapCenter` and map consumers;
- configurable Near Me radius options and rendered circle;
- `/search/map` viewport-wide clusters;
- inlined Leaflet + MarkerCluster via `mapVendorInline.ts`;
- locate-me + locate-error bridge;
- OSM tile-error bridge;
- per-section pin tint + deterministic bookable glyph;
- MiniAppBottomNav-derived Leaflet bottom clearance;
- draw-area polygon, bbox narrowing, point-in-area filtering and honest count;
- stale viewport/criteria sequence guard;
- create/edit `MapPinPicker` source;
- dedicated `MapsHubApp` with All/Cars/Properties/Materials/Factories/Stays worlds;
- shared section map routes/latches;
- backend `SearchSort` includes `nearest` and Near-Me distance SQL exists.

Therefore the statement "the map libraries are absent" is false at source level. If those behaviors are not visible to the owner, the main discrepancy is mounting/runtime/integration rather than package recovery.

## PR #72 preservation truth

The integrated `SearchResultsMap` at `3b2f8e95...` retains the richer map stack and adds fail-closed bootstrap state. Draw-area, map centers, near radius, nav clearance, tile/locate errors and stale-response protections remain present. Do not replace it with an older repo blob.

## Real gaps / decisions after reunion pass

1. OSM raster tiles still require network (`MAP-07b`) by design unless a licensed/offline tile strategy is explicitly adopted.
2. Global `MapsHubApp` exposes world switching and map/list mode but not the entire per-section FilterSheet/near-radius/sort control plane directly. Decide whether the global Maps mini-app needs a bounded global control layer; do not misclassify this as a lost library.
3. Isochrone/travel-time search is not proven shipped and needs a routing provider; treat as new completeness scope unless exact historical Product evidence proves otherwise.
4. POI/reference-place overlays are not proven mounted inside MapsHub even though reference-place data exists elsewhere; classify as completeness scope until provenance proves loss.
5. Native Android/iOS mounted acceptance remains unproven on one exact integrated GitHub SHA.

## P0 contradiction to resolve

Owner screenshots show a basic-looking map while GitHub source contains substantially richer behavior. Before adding speculative features, prove on ONE exact integrated SHA:

- All/Car/Property/Factories/Materials/Stays worlds;
- map/list return and section latches;
- page pins → viewport clusters;
- market-country reframing;
- Near Me permission, radius chips, circle and nearest ordering;
- locate-me success/denied/timeout;
- draw-area start/undo/done/clear and honest count;
- create/edit MapPinPicker persistence;
- per-section pin identity + bookable SVG;
- stale pan + stale criteria rejection;
- OSM tile failure visible state;
- bottom-nav/control/OSM attribution clearance;
- AR/EN, RTL/LTR, 320/360/390/430, Android/iOS/Web;
- loading/results/empty/error.

## Reunion law

- no whole-branch legacy merges;
- no old full-file replacement;
- trace `historical source → current canonical → current integration → mounted runtime`;
- classify only `PRESENT / PRESENT_LATER_EVOLVED / UNIQUE_MISSING / PARTIAL / SUPERSEDED / RUNTIME_UNPROVEN / NEW_COMPLETENESS_SCOPE`;
- only `UNIQUE_MISSING` or proven `PARTIAL` may create Product repair;
- preserve fail-closed bootstrap, draw-area honesty, stale-response guards, section isolation, map/nav clearance and world atomicity;
- no cleanup/deletion until the capability ledger is accepted.

Production remains NO-GO.

Run npm run build
