# W4-CHAIR-ZONE-B-SECTIONS — Section mini-apps (static audit)

**Zone:** B — Section mini-apps  
**Scope:** STATIC only (no runtime / no visual session)  
**Date:** 2026-07-31  
**Verdict:** Zone B wiring **HEALTHY**. REL-07 `emptyPostRequestCreateCategory` is present and correctly maps car→car, real_estate→real_estate, facilities/materials→industrial.

---

## REL-07 / AUD-SEC-01 (shared)

| Check | Result |
|--|--|
| Helper present | **YES** — `emptyPostRequestCreateCategory` in `SectionSearchApp.tsx` |
| Mapping | `car` → `"car"`; `real_estate` → `"real_estate"`; else (`facilities` / `materials`) → `"industrial"` |
| Empty CTA uses helper | **YES** — `createCategory = emptyPostRequestCreateCategory(category)` then `/listings/create?request=1&category=${createCategory}` |
| Hardcoded RE melt on empty CTA | **ABSENT** (guarded by `section-miniapp-guard.test.mjs` REL-07 test) |
| RE header request | Intentionally stays `category=real_estate` (allowed exception) |

**Evidence:**  
`artifacts/banco-mobile/components/search/SectionSearchApp.tsx:163-173`, `:1219-1229`, `:1300-1302`  
`artifacts/banco-mobile/tests/section-miniapp-guard.test.mjs:1489-1511`  
`reports/production-verification/COUNCIL-DECISIONS.md` D-2026-07-31-12

---

## Category / engine lock (shared engines)

### SectionSearchApp
- Hard-locks `category` (and optional `lockedEngine`) on every `commit` / `update` / `applyPatch`.
- FilterSheet: `lockCategory` + `shownCategories={[category]}`; category UI hidden.
- No category tabs on section pages.

**Evidence:** `SectionSearchApp.tsx:263-295`, `:2209-2218`

### BookingStaysApp
- Hard-locks `category: "real_estate"` + `engineKey: "rent"` on commit/update/applyPatch and FilterSheet `onUpdate`.
- FilterSheet: `lockCategory`, `shownCategories={["real_estate"]}`, `engines={[]}`.

**Evidence:** `BookingStaysApp.tsx:240-258`, `:261-271`, `:887-917`

### Map latch (?map=1 / MOB-07)
Shared helpers in `lib/mapLatch.ts`: `wantsMapFromParam`, `openOrLatchMap`, `resolveMapLatch`.  
Latch opens on results; clears on empty/error; does **not** wait for page pins.  
Both `SectionSearchApp` and `BookingStaysApp` consume the same contract; preserve latch across market hydrate / first seed.

**Evidence:** `lib/mapLatch.ts:1-50`; `SectionSearchApp.tsx:319-437`, `:1304-1307`; `BookingStaysApp.tsx:310-350`

---

## MOB-B-01 — `/section/car`

| Field | Finding |
|--|--|
| **Locked category/engine** | `category="car"`; no `lockedEngine` (engines free within car; chrome `listingMode: "pill"`, `engines: "pill"`) |
| **Entry from Discover** | Section card → `SECTION_ROUTE.car` = `/section/car`. Map portal chip → `/section/car?map=1`. Car-import Discover CTA → `/import` (browse then `/section/car?engine=import`) |
| **Empty CTA destinations** | Post-request → `emptyPostRequestCreateCategory("car")` → `/listings/create?request=1&category=car`. No RFQ (`activeGroup` null for car). Reset when filters dirty. |
| **Map `?map=1`** | Hosted by `SectionSearchApp` latch; Discover map portal + Materials-style header map via `openOrLatchMap` |
| **Status** | **HEALTHY** |
| **Evidence** | `app/section/car.tsx:16-24`; `SearchDiscover.tsx:40-45`, `:104-108`, `:331-336`, `:380-387`; `SectionSearchApp.tsx:167-173`, `:319-327`, `:1223-1229`; `app/import/index.tsx` (`?engine=import`) |

---

## MOB-B-02 — `/section/real-estate`

| Field | Finding |
|--|--|
| **Locked category/engine** | `category="real_estate"`; no `lockedEngine`. Offer strip (sale/rent) + property-type strip; chrome `engines: "chips"`, `propertyType: "pill"` |
| **Entry from Discover** | Section card → `/section/real-estate`. Primary Explore-on-map CTA → `exploreOnMap` → `/section/real-estate?map=1` (Search tab host). Stays portal is separate (`/section/booking`) |
| **Empty CTA destinations** | Post-request → helper(`real_estate`) → `category=real_estate`. Header `onOpenRequest` also `category=real_estate`. Header `onOpenStays` → `/section/booking` (cross-section by design, not empty-CTA melt) |
| **Map `?map=1`** | Discover primary map producer; PropertyHomeHeader `onOpenMap` → `openOrLatchMap` |
| **Status** | **HEALTHY** |
| **Evidence** | `app/section/real-estate.tsx:11-19`; `SearchDiscover.tsx:40-45`, `:84-87`, `:275-278`; `app/(tabs)/search.tsx:485-491`; `SectionSearchApp.tsx:1280-1307`, `:1223-1229` |

---

## MOB-B-03 — `/section/factories`

| Field | Finding |
|--|--|
| **Locked category/engine** | `category="facilities"` (route name factories ↔ browse key facilities); chrome `listingMode: "pill"`, `engines: "chips"` |
| **Entry from Discover** | Section card → `SECTION_ROUTE.facilities` = `/section/factories`. Map portal → `/section/factories?map=1` |
| **Empty CTA destinations** | Post-request → helper → `category=industrial` (REL-07). RFQ CTA → `/rfq/create` when `activeGroup` set (`industrialGroupForCategory("facilities")` non-null) |
| **Map `?map=1`** | SectionSearchApp latch + Discover map portal chip |
| **Status** | **HEALTHY** |
| **Evidence** | `app/section/factories.tsx:11-19`; `SearchDiscover.tsx:40-45`, `:343-347`; `SectionSearchApp.tsx:167-173`, `:480`, `:1248-1272`; `lib/taxonomy/src/categories.ts:39-42` |

---

## MOB-B-04 — `/section/materials`

| Field | Finding |
|--|--|
| **Locked category/engine** | `category="materials"`; chrome `listingMode: "pill"`, `engines: "chips"`; MaterialsHomeHeader |
| **Entry from Discover** | Section card → `/section/materials`. Map portal → `/section/materials?map=1` |
| **Empty CTA destinations** | Post-request → helper → `category=industrial`. RFQ → `/rfq/create` (`activeGroup` for materials) |
| **Map `?map=1`** | SectionSearchApp latch; MaterialsHomeHeader `onOpenMap` → `openOrLatchMap` |
| **Status** | **HEALTHY** |
| **Evidence** | `app/section/materials.tsx:10-18`; `SearchDiscover.tsx:40-45`, `:337-341`; `SectionSearchApp.tsx:1345-1359`, `:1223-1272`; `lib/taxonomy/src/categories.ts:39-50` |

---

## MOB-B-05 — `/section/booking`

| Field | Finding |
|--|--|
| **Locked category/engine** | Dedicated `BookingStaysApp` — always `real_estate` + `rent` (not `SectionSearchApp`) |
| **Entry from Discover** | Booking hub card → `/section/booking`. Map portal stays → `/section/booking?map=1`. RE header Stays control → `/section/booking` |
| **Empty CTA destinations** | Clear (if dirty) + post-request → `/listings/create?request=1&category=real_estate` (hardcoded; correct for Stay lock — no category melt). No RFQ bridge |
| **Map `?map=1`** | Same MOB-07 latch as RE (`wantsMapFromParam` / `resolveMapLatch` / preserve across hydrate). Listing opens with `?focus=booking` |
| **Status** | **HEALTHY** (map UI paint = **UNVERIFIED_VISUAL** under static-only scope) |
| **Evidence** | `app/section/booking.tsx:11-13`; `BookingStaysApp.tsx:186-271`, `:310-350`, `:631-684`, `:436`; `SearchDiscover.tsx:203-214`, `:349-353` |

---

## Shared engine checklist

| ID | Engine | Focus | Status |
|--|--|--|--|
| **MOB-B-06** | `SectionSearchApp.tsx` | Empty CTAs, map latch, category lock, REL-07 helper | **HEALTHY** |
| **MOB-B-07** | `BookingStaysApp.tsx` | Exists; Stay lock + map latch parity + empty CTA → RE | **HEALTHY** |

Stack registration: `app/_layout.tsx` names `section/car`, `section/real-estate`, `section/factories`, `section/materials`, `section/booking` (lines ~179–195).

---

## Zone B rollup

| ID | Route | Status |
|--|--|--|
| MOB-B-01 | `/section/car` | HEALTHY |
| MOB-B-02 | `/section/real-estate` | HEALTHY |
| MOB-B-03 | `/section/factories` | HEALTHY |
| MOB-B-04 | `/section/materials` | HEALTHY |
| MOB-B-05 | `/section/booking` | HEALTHY |
| MOB-B-06 | SectionSearchApp | HEALTHY |
| MOB-B-07 | BookingStaysApp | HEALTHY |

**Defects found (static emit path):** none for category melt at `router.push`.  
**Chair amendment (D-15 / distrust):** Emit-only HEALTHY was **insufficient**. Create consumer dropped `industrial` until **REL-10**. Zone B remains healthy on locks/map; empty-CTA **end-to-end** requires Zone C REL-10.
