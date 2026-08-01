# W6-CHAIR — Section Wiring Truth Audit (Owner complaints)

**Seat:** Chief Production Architect  
**Date:** 2026-07-31  
**Tip SoT:** `main` @ `6ad7a48` · branch `cursor/section-wiring-audit-e37c`  
**Method:** Dual-end code evidence · distrust prior Zone B HEALTHY where it stamped map→RE as OK  
**Owner complaints:** Maps opens RE · RE header identity wrong · Cars tertiary filters gone · brands/location/maps missing · sections/accounts unstable · Banks incomplete  

---

## Verdict (one page)

| # | Complaint | Status | Severity | Correct wiring today? |
|---|-----------|--------|----------|------------------------|
| 1 | Discover **Maps** opens **عقارات** | **DEFECT** | **HIGH** | **NO** — primary CTA hardcodes RE |
| 2 | RE upper header identity ≠ Owner ask | **RISK / PRODUCT** | MEDIUM | Partial — `PropertyHomeHeader` ships B-PROPERTIES black shell; Owner rejects as not exact |
| 3 | Cars tertiary filters “deleted” | **DEFECT** | **HIGH** | **NO** — engines collapsed to single **pill** (country-like), not chip strip |
| 4 | Many brands missing; choices laid like countries | **DEFECT / UX** | **HIGH** | Partial — full catalogue in `CarPicker`; strip shows **1 button** + FilterSheet **popular chips only** |
| 5 | Location + maps “where is correct work?” | **RISK** | MEDIUM | Location/`nearMe` live in **FilterSheet** (buried); Discover map primary is wrong (see #1) |
| 6 | Sections/accounts “not stable” | **MIXED** | MEDIUM | Category **locks** exist (strong); chrome **asymmetric** across sections (RE header ≠ Cars pills ≠ Materials) — feels unstable |
| 7 | Banks incomplete | **INTENDED GAP** (D-11) | LOW for Accept | Brochure + FI inbox — **not** partner directory |

**Prior council pollution:** Zone A/B packets marked Explore-on-map → RE as HEALTHY. Under Owner order + `68`, that stamp is **WRONG product**. Retract for map primary.

---

## 1. Maps → Real estate (catastrophe) — dual-end

### Producer (Discover)

```488:492:artifacts/banco-mobile/app/(tabs)/search.tsx
  const exploreOnMap = () => {
    if (brandValue) setDraftQuery("");
    setBrandValue(null);
    router.push("/section/real-estate?map=1");
  };
```

Comment at `:485-487` even admits: forced RE mini-app.  
UI copy: `exploreMapSub` = “Browse properties by location” / “تصفّح العقارات حسب الموقع” (`i18n.ts`).

Discover CTA: `testID="discover-explore-map"` → `onExploreMap` (`SearchDiscover.tsx:279-316`).

### Secondary portals (correct multi-catalogue producers)

| Chip | Destination |
|------|-------------|
| Cars | `/section/car?map=1` |
| Materials | `/section/materials?map=1` |
| Factories | `/section/factories?map=1` |
| Stays | `/section/booking?map=1` |

**Missing:** primary CTA as **Maps identity** (Owner: قسم خاص جوه السيرش). There is **no** `/section/maps` route.

### Consumer

`SectionSearchApp` latches `?map=1` via `mapLatch` — works for any section. Consumer is fine; **producer primary is wrong**.

### Repair shape (Approve REL-16) — do **not** freestyle

Options for Owner pick:

| Opt | Behavior |
|-----|----------|
| **A (recommended)** | Primary CTA → new Discover **Maps chooser** (same 4 portals + RE as equal peers); copy generic “استكشف على الخريطة” without عقارات |
| **B** | Primary CTA → `/section/car?map=1` (cars-first — only if Owner says so) |
| **C** | New route `/section/maps` mini-hub (identity + portals) then section latch |

**Forbidden:** melting map into shared Search criteria; deleting secondary portals; touching Coolify/ASB.

---

## 2. Real estate header identity — what shipped

**File:** `PropertyHomeHeader.tsx` · `testID="re-property-header"`

| Band | Content |
|------|---------|
| A | Back · Map · Stays · Request · Save |
| B | `B_MARK` + text **“PROPERTIES”** + `property-mark.png` seal · tagline · “Powered by” BANCO + market micro + sort |
| C | Search + Filters pill |
| D | Offer all/sale/rent · Wanted · type tabs Apartment/Villa/Commercial/Land/More |

Assets: `b-mark.png`, `property-mark.png`, `banco-logo.png`.  
Colors: void black `#000` · accent `#B81E3C` · Stay-parity comment in file header.

**Owner:** “مش دي الي طلبتها بالضبط”. Code cannot invent the missing mock.  
**Next:** Owner must confirm target (reference image / bullet list). Until then = **PRODUCT HOLD** — no reckless header rewrite.

---

## 3. Cars tertiary filters — why they “vanished”

### Declared chrome (`app/section/car.tsx`)

```tsx
chrome={{ listingMode: "pill", engines: "pill" }}
```

Comment admits chip strips were too wide → collapsed to pills.

### What that means in UI (`SectionSearchApp`)

- `engines: "pill"` → **one** `FilterPillSelect` titled `search.type` with all engines inside a dropdown — **not** visible tertiary chips (new/used/import/fuel/transmission).
- Facet-gated engines (automatic/manual/petrol/diesel/hybrid/electric) still exist in `@workspace/search-contract` `CAR_ENGINES` — but buried inside the pill.
- Brand strip: **single** `car-brand-btn` + origin chips only (`showCarBrandStrip`).

### FilterSheet (the “ruler” / deep filter)

Still has: brand chips (popular) + All brands · year range · location · nearMe · fuel/transmission fields · price.  
So work is **not deleted from repo** — it is **hidden behind pill + sheet**, which feels like مسح on first paint.

### Repair shape (Approve REL-17)

Restore **visible** car tertiary chip strip (or two rows: journey + fuel/trans) on Cars section; keep FilterSheet for year/price/location.  
Do **not** change API engine enum. Revisit `engines: "pill"` → `"chips"` (or hybrid). Guard: section-miniapp car chrome test must assert chip `testID`s for new/used/import + fuel/trans when facets present.

---

## 4. Brands — catalogue vs chrome

| Layer | What exists |
|-------|-------------|
| Taxonomy | `lib/taxonomy/src/cars.ts` — ~**100+** brand entries · **16** `popular: true` |
| CarPicker | Full `CAR_BRANDS` · search · **grouped by country** (`CAR_COUNTRIES`) |
| Section strip | 1 collapsed button → opens picker |
| FilterSheet | Popular chips only + All brands |

Owner: “غياب ماركات كتير · الاختيارات مفروشة مثال الدول”.  
Interpretation: (a) first paint only popular/one button → feels empty; (b) country grouping in picker looks like market-country UX — wrong mental model for brands.

### Repair shape (Approve REL-18)

- Section: show **popular brand chip row** (horizontal) + “All” → picker (not country-looking pills for engines).  
- Picker: prefer A–Z / search-first; country groups optional secondary — Owner confirm.  
- Never shrink taxonomy catalogue.

---

## 5. Location + maps — where correct wiring lives

| Capability | Where wired | Reachability |
|------------|-------------|--------------|
| `?map=1` latch | `SectionSearchApp` + `lib/mapLatch` | OK per section |
| Map results | `SearchResultsMap` / `.web` | OK when mapMode |
| Location filter | `FilterSheet` `filter-location-trigger` | Buried in sheet |
| Near me | FilterSheet + criteria | Buried; sort `nearest` gated |
| Discover primary map | → **RE only** | **WRONG** (§1) |
| Create/edit pin | `MapPinPicker` / GPS | Separate seller path — OK |

**Correct work exists** in FilterSheet + section map latch; **Discover primary misroutes** and **Cars first paint hides** location/nearMe.

---

## 6. Sections / accounts “not stable”

### Strong (do not break)

- `SECTION_ROUTE` Discover → dedicated mini-apps (anti-melt)  
- Section category lock in `commit`/`update`/`applyPatch`  
- Markets/currency SoT · REL-10 create deep-link · REL-12 mine/edit AuthGate  

### Feels unstable (asymmetric chrome)

| Section | Header / chrome |
|---------|-----------------|
| Cars | Generic section header + **pills** |
| Real estate | Full **PropertyHomeHeader** black identity |
| Materials | **MaterialsHomeHeader** |
| Factories | chips engines |
| Booking | **BookingStaysApp** own shell |
| Banks | Separate business world · blue accent |

Different shells are intentional product layers — but without Owner-aligned identity per section, it reads as “مش ثابتة”.

Accounts (individual/dealer/company/FI) locks are server+client REL-09 — separate from section chrome.

---

## 7. Banks — incomplete?

**Yes, by D-11 product decision:** `/business/banks` = brochure product types + gated FI inbox.  
Explicit honesty: “not a live partner directory” (`banks.tsx` ~496 · i18n subtitle).  
**Not a wiring bug** until Owner orders directory epic + public API.

---

## Repair queue (Approve-gated — cheapest first)

| ID | Fix | Blast |
|----|-----|-------|
| **REL-16** | Maps primary CTA ≠ RE; generic copy; equal portals / chooser | Discover + i18n + search.tsx only |
| **REL-17** | Cars engines chrome chips (restore tertiary visibility) | `car.tsx` chrome + SectionSearchApp strip + guards |
| **REL-18** | Cars popular brand chip row + picker UX (Owner pick A–Z vs country) | Section strip + optional CarPicker |
| **REL-19** | Optional: Cars header affordance for location/nearMe/map (not only sheet) | Narrow chrome |
| **PROD-RE-HEADER** | HOLD until Owner reference for identity | PropertyHomeHeader |
| **Banks directory** | HOLD — needs product brief | Out of scope |

---

## Asks for Owner (one answer each)

1. Maps primary: **A chooser** / **B cars map** / **C new `/section/maps`**?  
2. RE header: paste/reference what identity you want (or “keep PROPERTIES for now”).  
3. Car brands picker: **A–Z + search** or keep **country groups**?  
4. Approve REL-16+17 now (Chair force-exec after your pick on #1)?  

---

## Non-goals this audit

No Coolify/DNS · no Live Certified · no CAR IMPORT W4/5 · no currency SoT · no deleting FilterSheet · no inventing RE mock.
