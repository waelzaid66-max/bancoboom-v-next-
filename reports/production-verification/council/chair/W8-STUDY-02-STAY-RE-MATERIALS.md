# W8-STUDY-02 — Stay · B-PROPERTIES · Materials (sacred finished)

**Seat:** Production Reliability (study)  
**SoT:** `main` @ `4a3e106` (wiring evidence unchanged from post-merge tip)  
**Date:** 2026-07-31  
**Scope:** Worlds **4 BOOM STAY** · **3 B-PROPERTIES** · **5 Materials** only  
**Law:** ZERO product code · finished chrome sacred · no taste rewrites · dual-end only · suspect miswires need `path:line`  

**Guards sampled on tip:** `section-miniapp-guard` **76/76 PASS** · `materials-core-guard` **8/8 PASS** · `stay-honesty-guard` PASS  

---

## Method

For each world: entry → category lock → filter axes → map latch → router outs → empty CTAs → dual-end PASS/DEFECT/HOLD → do-not-touch.  
Checked specifically: empty CTA destinations · wrong category melt · `FilterSheet` `lockCategory` missing · `?map=1` no-op · Stay/RE header actions that 404.

---

## World 4 — BOOM STAY

| Field | Evidence | Verdict |
|-------|----------|---------|
| **Entry** | `app/section/booking.tsx:11-12` → `<BookingStaysApp />` · Stack `section/booking` in `app/_layout.tsx:195` · Discover portal `SearchDiscover.tsx:210` → `/section/booking` | **PASS** |
| **Host / header** | `BookingStaysApp` + presentational `StaysHomeHeader` (`testID="stays-header"`) | **PASS** |
| **Category lock** | Hard lock on commit/update/applyPatch: `category: "real_estate"` + `engineKey: "rent"` — `BookingStaysApp.tsx:240-258` · FilterSheet update re-locks `:901-910` · seed `:264-269` | **PASS** |
| **Filter axes** | Header Band D type tabs (studio/apartment/villa/chalet/office) · secondary strip: market · sort · Wanted · rental-term picker · `FilterSheet` refinements with `propertyTypeOptions={STAY_TYPE_OPTIONS}` · `lockCategory` · `engines={[]}` · `hidePaymentType` — `:887-918` | **PASS** |
| **Map latch** | `wantsMapFromParam` init `:314` · `resolveMapLatch` `:332-339` · header `onOpenMap` → `openOrLatchMap` `:704-707` · FAB `stays-map-toggle` · latch preserved across market hydrate `:347-349` | **PASS** |
| **Router outs** | Card/map → `/listing/{id}?focus=booking` `:436` · `:942` · empty post-request → `/listings/create?request=1&category=real_estate` `:666` (route exists `listings/create`) · back = `router.back()` | **PASS** |
| **Empty CTAs** | Reset (in-place) · post-request (real create route) — no empty destination | **PASS** |
| **FilterSheet lockCategory** | Present `:896` | **PASS** |
| **Do-not-touch** | `StaysHomeHeader` · Stay hard-lock · `StayCard` · Booking shell · MiniAppBottomNav | Sacred |

**Dual-end map**

| Producer | Consumer | Verdict |
|----------|----------|---------|
| Discover chip `/section/booking?map=1` (`SearchDiscover.tsx:356`) · Maps hub same | `BookingStaysApp` mapLatch | **PASS** — not a no-op |

**HOLD (not defects):** office type uses default icon in `StaysHomeHeader` `tabIcon` (no `office` case) — visual only, not a router/lock miswire. Taste/header polish forbidden.

---

## World 3 — B-PROPERTIES

| Field | Evidence | Verdict |
|-------|----------|---------|
| **Entry** | `app/section/real-estate.tsx:11-18` → `SectionSearchApp category="real_estate"` · `chrome={{ engines: "chips", propertyType: "pill" }}` · Stack `section/real-estate` | **PASS** |
| **Host / header** | `SectionSearchApp` mounts `PropertyHomeHeader` when `isRealEstateSection` — `SectionSearchApp.tsx:1273-1337` | **PASS** |
| **Category lock** | Prop category forced on commit/update/applyPatch `:253-285` · `FilterSheet` `shownCategories={[category]}` + `lockCategory` `:2238-2247` · `onSelectCategory={() => {}}` | **PASS** |
| **Filter axes** | Header: offer all/sale/rent · Wanted · Band D types (Commercial/More pickers) · market+sort beside BANCO · FilterSheet = refinements only (`filterSheetEngines` strips offer/type engines `:136-148`, `:444-447`) · `propertyTypeOptions` scoped to `RE_TYPE_PRIMARY` `:2250-2252` · rental chrome when rent offer | **PASS** |
| **Map latch** | Shared `mapLatch` `:387-417` · header `onOpenMap` → `openOrLatchMap` `:1297-1300` · FAB when `showMapChrome` | **PASS** |
| **Router outs** | Stays → `/section/booking` `:1289-1291` (registered) · Request → `/listings/create?request=1&category=real_estate` `:1293-1295` (registered) · empty post-request via `sectionEmptyPostRequestCategory` → `real_estate` · listing open `/listing/{id}` | **PASS** — no 404 header actions |
| **Empty CTAs** | Reset · post-request (category-locked) · RFQ only when `activeGroup` (RE has none → RFQ hidden) | **PASS** |
| **Category melt** | Hard lock prevents FilterSheet/partial from changing category | **PASS** |
| **Do-not-touch** | `PropertyHomeHeader` · RE offer/type composition · Stay bridge · FilterSheet lock | Sacred |

**Dual-end map**

| Producer | Consumer | Verdict |
|----------|----------|---------|
| Discover `/section/real-estate?map=1` · Maps hub | `SectionSearchApp` latch | **PASS** |

**HOLD:** Owner product taste on RE header identity (prior `73` PRODUCT HOLD) — not a wiring defect; no rewrite.

---

## World 5 — Materials (B-CORE)

| Field | Evidence | Verdict |
|-------|----------|---------|
| **Entry** | `app/section/materials.tsx:10-18` → `SectionSearchApp category="materials"` · `chrome={{ listingMode: "pill", engines: "chips" }}` · Stack `section/materials` | **PASS** |
| **Host / header** | `MaterialsHomeHeader` (`testID="materials-core-header"`) when `isMaterialsSection` — `SectionSearchApp.tsx:1338-1374` | **PASS** |
| **Category lock** | Same SectionSearchApp hard lock to prop `category="materials"` `:253-285` · `lockCategory` on FilterSheet `:2247` | **PASS** |
| **Filter axes (intended)** | Header: identity + search/Filters + market weld + map/sort/save · Under header: type+origin axis strip (`materials-type-strip`) · commodity strip when raw (`materials-material-strip`) · listingMode refinements in FilterSheet (header chrome; primary strip gated off for materials `:1602`) | **PASS** (axes present) |
| **Map latch** | Header `onOpenMap` → `openOrLatchMap` `:1349-1352` · shared `?map=1` latch | **PASS** |
| **Router outs** | Empty post-request → `sectionEmptyPostRequestCategory("materials")` → `raw_materials` create (`listingCreateTaxonomy.ts:102-108`) · RFQ → `/rfq/create` when industrial group · no Stay/Request header (correct for Materials) | **PASS** |
| **Empty CTAs** | Destinations resolve to registered create/RFQ routes | **PASS** |
| **Do-not-touch** | `MaterialsHomeHeader` · materials axis strips · MiniAppBottomNav · category lock | Sacred |

**Dual-end map**

| Producer | Consumer | Verdict |
|----------|----------|---------|
| Discover `/section/materials?map=1` · Maps hub | `SectionSearchApp` latch | **PASS** |

### Materials origin dual-mount — DEFECT

Intentional design comment: types + origin in **ONE** horizontal scroll (`SectionSearchApp.tsx:1929-1930`). Origin is already inside `materials-type-strip` at `:1976-2013` (`testID="materials-origin-strip"`).

A **second** origin row still mounts under the same gate:

```2093:2127:artifacts/banco-mobile/components/search/SectionSearchApp.tsx
      {/* ── Origin chips (materials only) ── */}
      {showOriginChrome ? (
        <View
          ...
          testID="materials-origin-strip"
        >
          {(["all", "local", "imported"] as const).map((o) => {
```

Both gates equal `isMaterialsSection` (`showMaterialsAxisStrip = showOriginChrome = isMaterialsSection` at `:832-837`). Same `selectOrigin` · duplicate `testID="materials-origin-strip"` · duplicate `section-origin-*` hits.

**Not taste:** leftover dual wire of one filter axis after axis-strip consolidation.  
**Repair shape (Chair Approve only):** delete the second block `:2093-2127` (or gate it off when axis strip owns origin). Do not touch header / commodity strip / category lock.

---

## Cross-world checklist (suspect probes)

| Probe | Stay | RE | Materials |
|-------|------|-----|-----------|
| Empty CTA → nowhere | PASS | PASS | PASS |
| Category melt via sheet | PASS (locked) | PASS (locked) | PASS (locked) |
| `lockCategory` missing | PASS present | PASS present | PASS present |
| `?map=1` no-op | PASS latches | PASS latches | PASS latches |
| Header action 404 | N/A (map/save/back only) | PASS Stays+Request+Map | PASS Map only |

---

## Do-not-touch (all three)

- No taste rewrites of Stay / RE / Materials HomeHeaders  
- No melting Stay into generic RE search · no melting Materials into Factories  
- No deleting intentional Discover/Maps per-section `?map=1` feeds  
- No FilterSheet category unlock on section mini-apps  
- Factories / Cars / Maps / Banks / Import out of scope here  

---

## Defect list

1. **DEFECT · Materials · MEDIUM** — Duplicate origin axis: `SectionSearchApp.tsx:1976-2013` (inside axis strip) **and** `:2093-2127` (legacy chip row) both mount when `isMaterialsSection`. Same handlers + duplicate `materials-origin-strip` testIDs.

**Else:** none for Stay / B-PROPERTIES / Materials entry · lock · map latch · header router outs · empty CTAs · `lockCategory`.
