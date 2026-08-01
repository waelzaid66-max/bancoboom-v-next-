# W8-STUDY-01 — Discover · B-oom Car · Maps (dual-end, evidence only)

**Seat:** Production Auditor  
**SoT tip:** `main` @ `8cf070b` (`8cf070bd026365f5acbfe09a4cb43b9dc55ac1de`)  
**Workspace:** `/workspace`  
**Scope:** World 1 Discover · World 2 B-oom Car · World 7 Maps only  
**Method:** Read-only dual-end STUDY. Zero product code changes. Skeptical of prior HEALTHY stamps (incl. `W6-CHAIR-VERIFY-MAPS11-BOOM-CAR.md`).  
**Owner law anchors:** 10 sections · no deletes · no inventions · finished chrome sacred · Car≠Import · Maps=`/section/maps`

---

## Cross-world melt risks (flag first)

| Risk | Evidence | Verdict |
|------|----------|---------|
| Discover melting into shared Search criteria | Section cards `router.push(SECTION_ROUTE[cat])` — `SearchDiscover.tsx:104-108`, `40-45`. Host explicitly forbids in-place category bridge — `search.tsx:481-483`. | **PASS** (anti-melt seated) |
| Discover melt *if* dead brand callback reconnected | Host still wires `onBrowseBrand` → `browseBrand` which `update({ category: "car", … })` — `search.tsx:388-408`, `612`. Discover renames prop `_onBrowseBrand` and never calls — `SearchDiscover.tsx:93-94`. | **HOLD** (dormant melt path; not live) |
| Car linking Import hub | `CarsHomeHeader.tsx` has **zero** `/import` matches. Comment forbids — `CarsHomeHeader.tsx:7`. Discover Import CTA → `/import` only — `SearchDiscover.tsx:390-391`. Import hub seeds Car via `?engine=import` — `app/import/index.tsx:51` (Import→Car, not Car→Import). | **PASS** Car≠Import |
| Maps hardcoding RE | Primary Discover map → `router.push("/section/maps")` — `search.tsx:488-491`, FAB `1079-1087`. **Not** `real-estate?map=1`. Hub default world `"all"` — `MapsHubApp.tsx:130`, `criteriaForWorld` `117-119`. Stays tab uses `category:"real_estate"+engineKey:"rent"` — `115-116` (stays catalogue seat, not hub identity = RE). | **PASS** primary path; stays note below |

Prior W6 Chair stamp marked all dual-ends **PASS**. This study **retracts** blind trust: Car market/sort dual-seat is a live chrome DEFECT W6 did not list.

---

# World 1 — Discover

**Files:** `artifacts/banco-mobile/app/(tabs)/search.tsx` · `artifacts/banco-mobile/components/SearchDiscover.tsx`

## 1. Entry routes (Stack + Discover producers)

| Entry | Evidence |
|-------|----------|
| Tab host | `(tabs)/search` registered — `app/(tabs)/_layout.tsx` (`Tabs.Screen name="search"`). |
| Discover surface | `useSearchMiniApp` → `viewState === "discover"` when `!hasActiveCriteria` — hook + `searchParams.ts:118-142`. Overlay mounts `<SearchDiscover …>` — `search.tsx:609-620`. |
| Stack producers Discover pushes | `SECTION_ROUTE`: car→`/section/car`, real_estate→`/section/real-estate`, facilities→`/section/factories`, materials→`/section/materials` — `SearchDiscover.tsx:40-45`. Stack.Screen names match — `app/_layout.tsx:178-200` (`section/car` … `section/maps`). |
| Extra portals | Booking `/section/booking` — `SearchDiscover.tsx:210`. Maps hub `/section/maps` via host `exploreOnMap` — `search.tsx:491`. Import `/import` — `SearchDiscover.tsx:391` (`Stack.Screen name="import/index"` @ `_layout.tsx:330`). Business hubs `/business/global-supply`, `/business/supply-hub`, `/business/banks` — `440`, `482`, `524`. |

## 2. Filter / chrome axes + FilterSheet lock

| Axis | Discover state evidence |
|------|-------------------------|
| Header | Short chrome: reduced padding when `viewState === "discover"` — `search.tsx:679-681`, `696`. Search input only. |
| Filter toggle | **Hidden** on Discover — `search.tsx:747-787` (`viewState !== "discover"`). |
| CategoryTabs / engines / origin / rental | **Hidden** on Discover — `search.tsx:790-923` (comment: melt guard). |
| FilterSheet | Still mounted — `search.tsx:941-959`. No `lockCategory` (shared Search sheet). `visible={showFilters}` starts false; toggle absent on Discover → sheet not user-openable while Discover. |
| MorphSearchIcon | Still bound to `criteria.category` on Discover chrome — `search.tsx:700-703`. Cosmetic only while criteria stay default. |

## 3. Navigation outs (every `router.push` / Href)

**From `SearchDiscover.tsx`:**

| Line | Href / action |
|------|----------------|
| 107 | `SECTION_ROUTE[cat]` → `/section/car` \| `/section/real-estate` \| `/section/factories` \| `/section/materials` |
| 210 | `/section/booking` |
| 279 → prop | `onExploreMap()` (host → `/section/maps`) |
| 332-356, 364 | `/section/car?map=1`, `/section/real-estate?map=1`, `/section/materials?map=1`, `/section/factories?map=1`, `/section/booking?map=1` |
| 391 | `/import` |
| 440 | `/business/global-supply` |
| 482 | `/business/supply-hub` |
| 524 | `/business/banks` |

**From host `search.tsx` while Discover-adjacent:**

| Line | Href / action |
|------|----------------|
| 440 | `/listing/${item.id}` (wired as `onOpenListing`; Discover does not call) |
| 491 | `/section/maps` (`exploreOnMap`) |
| 1029-1034 | listing (+ optional `?focus=booking` if RE) — results map only |
| 1087 | `exploreOnMap()` — Discover FAB `discover-map-toggle` |

## 4. Map contract (`?map=1` / Maps hub)

| Producer | Target | Evidence |
|----------|--------|----------|
| Primary CTA + FAB | **Maps hub** `/section/maps` | `search.tsx:485-491`, `1075-1087`; CTA `SearchDiscover.tsx:275-279` |
| Secondary portal chips | Per-section `?map=1` (intentional duplication) | `SearchDiscover.tsx:275-277`, `328-364` |
| Host results map toggle | Local `SearchResultsMap` overlay; requires page pins (`canMap`) | `search.tsx:249`, `1023-1072` — **not** Discover |

## 5. Dual-end table

| Producer | Consumer | Verdict |
|----------|----------|---------|
| Discover section card `car` | `app/section/car.tsx` → `SectionSearchApp category="car"` | **PASS** |
| Discover section card `real_estate` | `app/section/real-estate.tsx` (Stack registered) | **PASS** |
| Discover `facilities` → `/section/factories` | `app/section/factories.tsx` `category="facilities"` | **PASS** |
| Discover `materials` | `app/section/materials.tsx` (Stack registered) | **PASS** |
| Discover booking card | `app/section/booking` | **PASS** (route registered) |
| `exploreOnMap` / FAB / CTA | `app/section/maps.tsx` → `MapsHubApp` | **PASS** |
| Discover `?map=1` chips | `SectionSearchApp` / Booking `mapLatch` (`wantsMapFromParam`) | **PASS** (duplication law) |
| Discover → `/import` | `app/import/index` Stack | **PASS** |
| Host `onBrowseBrand` / `onApplySaved` / `onOpenListing` / `onSearchQuery` | SearchDiscover (`_on*` unused) | **HOLD** — producer wired, consumer dead |
| Discover map ≠ force `category:"car"` | Comment + path `/section/maps` only — `search.tsx:1075-1078` | **PASS** |

## 6. Suspected miswires (file:line only)

1. **Dead Discover callbacks** — Host produces four handlers `search.tsx:612-619`; Discover binds them as `_onBrowseBrand`, `_onApplySaved`, `_onOpenListing`, `_onSearchQuery` and never invokes — `SearchDiscover.tsx:93-97`. Styles for brand/saved/cards remain (`SearchDiscover.tsx:766-833`) with no UI. Seat: nowhere (not wrong route).
2. **Dormant melt** — If `onBrowseBrand` were reconnected, `browseBrand` commits shared Search `category:"car"` — `search.tsx:402-408` — violating Discover→mini-app law. Not live today.

## 7. DO-NOT-TOUCH (World 1)

- `SECTION_ROUTE` map and “no `all` portal” rule — `SearchDiscover.tsx:28-45`
- Discover anti-melt: no CategoryTabs / Filter toggle on Discover — `search.tsx:747-792`
- Primary map entry = `/section/maps` (not RE `?map=1`) — `search.tsx:485-491`
- Intentional `?map=1` portal chips (Owner duplication) — `SearchDiscover.tsx:275-277`
- Stack registrations for section + maps screens — `app/_layout.tsx:176-200`
- Finished Discover portal chrome (section photos, booking card, map CTA, hubs) — do not invent replacement portals

---

# World 2 — B-oom Car

**Files:** `artifacts/banco-mobile/app/section/car.tsx` · `components/search/car/CarsHomeHeader.tsx` · car paths in `components/search/SectionSearchApp.tsx`

## 1. Entry routes (Stack + Discover producers)

| Entry | Evidence |
|-------|----------|
| Stack | `Stack.Screen name="section/car"` — `_layout.tsx:178-180` |
| Screen | `car.tsx:14-22` → `<SectionSearchApp category="car" chrome={{ listingMode: "pill", engines: "chips" }} />` |
| Discover producers | Card `/section/car` — `SearchDiscover.tsx:41`, `107`. Map portal `/section/car?map=1` — `332`. |
| Import producer (not Car chrome) | `/section/car?engine=import` — `app/import/index.tsx:51`; also `import-tracking.tsx:366` |
| Deep-link seed | `SectionSearchApp` reads `engine` + `map` params before seed — `309-355`, `390` |

## 2. Filter / chrome axes + FilterSheet lock

| Axis | Evidence |
|------|----------|
| Declared chrome | `listingMode: "pill"`, `engines: "chips"` — `car.tsx:20` via `sectionChrome.ts` |
| Header | `CarsHomeHeader` when `isCarSection` — `SectionSearchApp.tsx:1375-1411`. Back · map · sort · save · BOOM+CAR wordmark · market weld · search+filter. |
| Category lock | `commit`/`update`/`applyPatch` force `category` prop — `256-285`. FilterSheet `lockCategory` + `shownCategories={[category]}` — `2238-2253`. Sheet hides category row when locked — `FilterSheet.tsx:377-380`. |
| Engines chips | `showEngineChips` for car (not RE/materials) — `852-856`; REL-17 comment `1655-1656`. |
| listingMode pill | `showListingMode` + `axisShape(chrome,"listingMode")==="pill"` — `859`, `1657-1658`. |
| Origin + brand strips | `showCarOriginChrome` / `showCarBrandStrip` when `!lockedEngine` — `839-840`. Origin↔`engineKey:"import"` sync — `715-724`. |
| FilterSheet | Refinements; car fuel/transmission/year via sheet; engines passed as `filterSheetEngines` (= full list for non-RE) — `2243`. |

## 3. Navigation outs (Car path)

| Source | Line(s) | Href / action |
|--------|---------|----------------|
| CarsHomeHeader | props only | `onBack` → `goBack` → `router.back()` — `1127-1130`; **no** `router.push` inside header file |
| Card press | `667` | `/listing/${item.id}` |
| Empty post-request | `1220-1221` | `/listings/create?request=1&category=…` (car create category) |
| Empty RFQ | `1245` | `/rfq/create` only if `activeGroup` (industrial) — **not** car |
| Map pin | `2305-2309` | `/listing/${id}` (booking focus only if RE) |
| Map open | `1386-1389` | `openOrLatchMap` — **local** mapMode, not `/section/maps` |
| RE-only outs in same file | `1291`, `1295` | `/section/booking`, create RE — **not** taken on car header branch |

## 4. Map contract

| Mechanism | Evidence |
|-----------|----------|
| `?map=1` latch | `wantMap = wantsMapFromParam(mapParam)` — `390`; `resolveMapLatch` effect — `409-417`; helpers `lib/mapLatch.ts:8-49` |
| Header map | `openOrLatchMap` — `1386-1389` |
| Overlay | `mapMode && inResultsView` → `SearchResultsMap` — `2293-2314` (pin-count not required; clusters fill — latch comment `mapLatch.ts:2-4`) |
| FAB | `showMapChrome = inResultsView` — `404`, `2316+` |
| ≠ Maps hub | Car map never `router.push("/section/maps")` |

## 5. Dual-end table

| Producer | Consumer | Verdict |
|----------|----------|---------|
| Discover `/section/car` | `car.tsx` → SectionSearchApp car | **PASS** |
| Discover `/section/car?map=1` | `mapLatch` → `SearchResultsMap` | **PASS** |
| Import `?engine=import` | seed `engineKey` if allowed — `332-349`; engines include `import` — `constants/engines.ts:75-77` | **PASS** |
| `car.tsx` chrome pills/chips | SectionSearchApp `axisShape` | **PASS** |
| CarsHomeHeader mount | Stay-parity BOOM+CAR shell | **PASS** identity |
| CarsHomeHeader market/sort | Exclusive ownership claimed in comment `1600-1601` | **DEFECT** — strip still dual-seats (below) |
| Car chrome → `/import` | No link in header or car.tsx | **PASS** Car≠Import |
| FilterSheet category switch | `lockCategory` + forced category in update | **PASS** |

## 6. Suspected miswires (file:line)

1. **Market/sort dual-seat on Car (DEFECT)** — Comment says market/sort live in `CarsHomeHeader`; strip should keep listingMode+engines — `SectionSearchApp.tsx:1598-1601`. Code still renders `MarketCountryButton` + strip sort for car (`!isRealEstate && !isMaterials` **without** `!isCarSection`) — `1602-1650`. Header already owns market (`CarsHomeHeader.tsx:203-219`) and sort (`134-146`, `testID="section-sort-cycle"`). Strip repeats sort with **same** `testID="section-sort-cycle"` — `1635`. Contrast: search-open row correctly excludes car — `1511` (`!isCarSection`). Incomplete chrome migration.
2. **Origin strip + import engine chip** — Both UI axes can set imported; synced in `selectOrigin` — `715-724`. Seats correctly if treated as one axis; flag only if Owner forbids duplicate import controls (no evidence of Owner ban → not DEFECT).

## 7. DO-NOT-TOUCH (World 2)

- `CarsHomeHeader` finished Stay-parity chrome (wordmark, market weld, search pill) — sacred; no Import hub link — `CarsHomeHeader.tsx:1-7`
- `car.tsx` chrome declaration `{ listingMode: "pill", engines: "chips" }` — `car.tsx:20`
- Category hard-lock in SectionSearchApp update/commit — `256-285`
- FilterSheet `lockCategory` on sections — `2247`
- `?map=1` / `?engine=import` latch+seed contract — `309-417`
- Engine chips visibility for car (REL-17) — do not bury into sheet only
- Car≠Import boundary (Import is `/import` world)

---

# World 7 — Maps

**Files:** `artifacts/banco-mobile/app/section/maps.tsx` · `components/search/maps/MapsHubApp.tsx` · `lib/mapLatch.ts` · `SearchResultsMap` consumers

## 1. Entry routes (Stack + Discover producers)

| Entry | Evidence |
|-------|----------|
| Stack | `Stack.Screen name="section/maps"` — `_layout.tsx:198-200` |
| Screen | `maps.tsx:10-11` → `<MapsHubApp />` |
| Discover producers | `exploreOnMap` + FAB + CTA → `/section/maps` — `search.tsx:491`, `SearchDiscover.tsx:279` |
| Hub → catalogues | World tab `sectionHref` pushes `?map=1` sections — `MapsHubApp.tsx:67-93`, `205-215` |
| Latch consumers (not hub itself) | `SectionSearchApp` + `BookingStaysApp` import `mapLatch` — grep; **MapsHubApp does not import mapLatch** |

## 2. Filter / chrome axes + FilterSheet lock

| Axis | Evidence |
|------|----------|
| World tabs | `WORLD_TABS`: all · car · real_estate · materials · facilities · stays — `67-93`; `selectWorld` → `commit(criteriaForWorld)` — `144-156` |
| FilterSheet | **Absent** from MapsHubApp — no sheet, no `lockCategory` |
| List/map | `listMode` toggle — `193-204`, `282-322` |
| Brand chrome | BANCO + Maps wordmark — `219-238` (`testID="maps-hub-brand"`) |
| Category lock | Per-world criteria set explicitly in `criteriaForWorld` — `96-120`; no category chip row |

## 3. Navigation outs

| Line | Href / action |
|------|----------------|
| 170 | `/listing/${item.id}` |
| 180 | `router.back()` |
| 207 | `activeTab.sectionHref` → `/section/{car\|real-estate\|materials\|factories\|booking}?map=1` |
| 318 | `/listing/${id}` via `onOpenListingId` |

No push to `/section/real-estate` as default hub entry.

## 4. Map contract

| Surface | Contract |
|---------|----------|
| Hub body | Default map: `SearchResultsMap` with `mappableItems` + `criteria` — `314-321`. List alternate when `listMode`. |
| Hub `?map=1` | **Not consumed** — `maps.tsx` / `MapsHubApp` ignore map query (no `wantsMapFromParam`). |
| Discover → hub | Path `/section/maps` (Owner Maps=) — PASS |
| Hub → section feeds | `?map=1` → section `mapLatch` — intentional duplication |
| Latch helper | Shared by SectionSearchApp / BookingStaysApp only — `mapLatch.ts:1-4` |
| Search host map | Separate local overlay; pin-gated — not Maps world |

## 5. Dual-end table

| Producer | Consumer | Verdict |
|----------|----------|---------|
| Discover explore / FAB / CTA | `maps.tsx` → `MapsHubApp` | **PASS** |
| `MapsHubApp` criteria + pins | `SearchResultsMap` | **PASS** |
| World tab open-section | Section hosts + `mapLatch` | **PASS** |
| Discover `?map=1` chips | Section `mapLatch` (parallel to hub) | **PASS** (Owner duplication) |
| `mapLatch` helpers | SectionSearchApp `390-417`; BookingStaysApp (import) | **PASS** consumers exist |
| Hub primary identity = RE? | Default `world="all"`; explore ≠ RE | **PASS** |
| Stays world → RE+rent criteria | `MapsHubApp.tsx:115-116` | **HOLD** — correct stays seat; must not be misread as “Maps hardcoded RE” |
| Leaflet / SearchResultsMap stack | Still present; not deleted | **PASS** (no-delete) |

## 6. Suspected miswires (file:line)

1. **Hub ignores `?map=1` on `/section/maps`** — If any producer pushed `/section/maps?map=1`, latch would no-op (`MapsHubApp` never calls `wantsMapFromParam`). Current Discover producers use bare `/section/maps` — `search.tsx:491`. **HOLD** (no live broken producer found).
2. **Stays = RE catalogue** — `criteriaForWorld("stays")` sets `category: "real_estate", engineKey: "rent"` — `115-116`. Dual-end to RE search API is intentional for stays; miswire only if Owner required a distinct stays category enum (no such enum in `Category` type — not an invention gap to fill here).

## 7. DO-NOT-TOUCH (World 7)

- Route identity Maps = `/section/maps` — `maps.tsx`, Stack registration
- `MapsHubApp` world-tab model + intentional `?map=1` section feeds — `67-93`
- `SearchResultsMap` / map-vendor stack (no deletes)
- `lib/mapLatch.ts` contract shared by section/booking hosts
- Primary Discover entry must not regress to `real-estate?map=1`
- Finished Maps hub chrome (void/gold brand block, world chips, MiniAppBottomNav)

---

## Summary verdicts (skeptical of W6 HEALTHY)

| World | Headline |
|-------|----------|
| **1 Discover** | Anti-melt + Maps hub entry **PASS**. Dead host→Discover callbacks **HOLD**. |
| **2 B-oom Car** | Car≠Import + map latch + FilterSheet lock **PASS**. Market/sort **dual-seat DEFECT** vs CarsHomeHeader sacred chrome (`SectionSearchApp.tsx:1602-1650` vs `CarsHomeHeader`). |
| **7 Maps** | `/section/maps` primary path **PASS**; not RE-hardcoded. Stays→RE criteria **HOLD** (intentional). Hub does not use `mapLatch` (N/A for bare hub entry). |

**W6 Chair all-PASS stamp:** superseded for Car chrome dual-seat; Maps/Discover primary path evidence still supports PASS on those rows.
