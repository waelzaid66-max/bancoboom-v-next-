# 77 — Ten-Section Production Inventory

**Date:** 2026-07-31T15:11Z  
**Tip:** `cursor/section-wiring-audit-e37c` @ `59f3fba`  
**Owner law:** exactly **10 sections** · finished chrome must not break · no deletes · Car ≠ Import · Maps = `/section/maps` · ads E2E  
**Method:** Dual-end route + host + chrome grep · section-miniapp-guard **76/76 PASS** · materials/stay/production wiring guards PASS  
**Supersedes for Maps/Cars:** prior `73` / AUD-61 “Discover→RE DEFECT” stamps (pre–REL-16/17/20). Rebind under `68`.

---

## Owner count (exactly 10)

| # | Section | Canonical entry |
|---|---------|-----------------|
| 1 | Discover | `/(tabs)/search` + `SearchDiscover` |
| 2 | B-oom Car | `/section/car` |
| 3 | B-PROPERTIES | `/section/real-estate` |
| 4 | BOOM STAY | `/section/booking` |
| 5 | Materials | `/section/materials` |
| 6 | Factories | `/section/factories` |
| 7 | Maps | `/section/maps` |
| 8 | Banks | `/business/banks` |
| 9 | Car Import | `/import` |
| 10 | Accounts | profile · `listings/create` · `listings/mine` |

Stack registration evidence: `artifacts/banco-mobile/app/_layout.tsx` — `section/car|real-estate|factories|materials|booking|maps`, `business/banks`, `import/index`, `listings/create|mine`.

---

## 1. Discover — `/(tabs)/search` + SearchDiscover

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `artifacts/banco-mobile/app/(tabs)/search.tsx` mounts `<SearchDiscover` |
| Host / header | Search tab host; Discover overlay when `viewState === "discover"` |
| Chrome / filters | Discover = portal cards only (no CategoryTabs/engines). Catalogue chips/FilterSheet gated `viewState !== "discover"` |
| Category lock | N/A (portals push mini-apps; no in-place melt) |
| Map entry | Primary → `/section/maps` (`exploreOnMap`). Secondary chips → per-section `?map=1` (intentional duplication) |
| Status | **FINISHED-DO-NOT-TOUCH** (anti-melt + Maps #11 producer) |
| Grep | `SearchDiscover` · `SECTION_ROUTE` · `router.push("/section/maps")` · `discover-explore-map` · `discover-map-portals` |

```488:491:artifacts/banco-mobile/app/(tabs)/search.tsx
  const exploreOnMap = () => {
    ...
    router.push("/section/maps");
```

```40:45:artifacts/banco-mobile/components/SearchDiscover.tsx
const SECTION_ROUTE: Record<BrowseSection, Href> = {
  car: "/section/car",
  real_estate: "/section/real-estate",
  facilities: "/section/factories",
  materials: "/section/materials",
};
```

---

## 2. B-oom Car — `/section/car`

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `app/section/car.tsx` |
| Host / header | `SectionSearchApp` + `CarsHomeHeader` (REL-20 Stay-parity BOOM+CAR) |
| Chrome | `listingMode: "pill"`, `engines: "chips"` (REL-17) · brand/origin strips · `FilterSheet` |
| Category lock | `category="car"` hard-locked in commit/update/applyPatch |
| Map entry | Header map + FAB `section-map-toggle` · Discover/Maps hub `?map=1` · `?engine=import` deep-link (browse imported cars ≠ Import hub) |
| Status | **FINISHED-DO-NOT-TOUCH** |
| Grep | `category="car"` · `engines: "chips"` · `<CarsHomeHeader` · `never melt Import` |

```14:21:artifacts/banco-mobile/app/section/car.tsx
export default function CarSectionScreen() {
  return (
    <SectionSearchApp
      category="car"
      ...
      chrome={{ listingMode: "pill", engines: "chips" }}
```

**Car ≠ Import:** `CarsHomeHeader` never links `/import`; Import hub’s “Search Cars” deliberately pushes `/section/car?engine=import`.

---

## 3. B-PROPERTIES — `/section/real-estate`

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `app/section/real-estate.tsx` |
| Host / header | `SectionSearchApp` + `PropertyHomeHeader` (+ `ReServiceDesks` where wired) |
| Chrome | Offer engines **chips** · propertyType **pill** · FilterSheet = refinements only · active removable chips |
| Category lock | `category="real_estate"` |
| Map entry | Header `onOpenMap` / FAB · `?map=1` latch (`mapLatch.ts`) |
| Status | **FINISHED-DO-NOT-TOUCH** |
| Grep | `PropertyHomeHeader` · `chrome={{ engines: "chips", propertyType: "pill" }}` · `re-property-header` |

Stay bridge (intentional): header Stays → `/section/booking`; Request → `listings/create?request=1&category=real_estate`.

---

## 4. BOOM STAY — `/section/booking`

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `app/section/booking.tsx` → `BookingStaysApp` |
| Host / header | `StaysHomeHeader` (لا تُمس) |
| Chrome | Type tabs in header · rental-term strip · Wanted · sort · `FilterSheet` · `StayCard` |
| Category lock | Hard lock `real_estate` + `engineKey: "rent"` on commit/update/applyPatch |
| Map entry | `?map=1` latch + `stays-map-toggle` |
| Status | **FINISHED-DO-NOT-TOUCH** |
| Grep | `BookingStaysApp` · `StaysHomeHeader` · `engineKey: "rent"` · `wantsMapFromParam` |

```240:256:artifacts/banco-mobile/components/search/BookingStaysApp.tsx
  // Hard lock (fact): Stay is always real_estate + rent — never melt ...
  const commit = useCallback(
    (next: SearchCriteria) => {
      commitRaw({ ...next, category: "real_estate", engineKey: "rent" });
```

---

## 5. Materials — `/section/materials`

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `app/section/materials.tsx` |
| Host / header | `SectionSearchApp` + `MaterialsHomeHeader` (B-CORE) |
| Chrome | Identity header · industrial/engine chips · origin chips · commodity strip · listingMode refinements in FilterSheet · `chrome={{ listingMode: "pill", engines: "chips" }}` |
| Category lock | `category="materials"` |
| Map entry | Header map + FAB · `?map=1` |
| Status | **FINISHED-DO-NOT-TOUCH** |
| Grep | `MaterialsHomeHeader` · `isMaterialsSection` · `materials-core-guard` PASS |

**Stay/RE/Materials comparison:** same intentional pattern — dedicated HomeHeader + FilterSheet refinements + category lock + map latch. No missing mount / wrong melt.

---

## 6. Factories — `/section/factories`

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `app/section/factories.tsx` |
| Host / header | `SectionSearchApp` **generic** header (back · title · search · filter) — no Stay-parity HomeHeader |
| Chrome | `listingMode: "pill"`, `engines: "chips"` · industrial subtype chips · FilterSheet · MiniAppBottomNav |
| Category lock | `category="facilities"` |
| Map entry | FAB `section-map-toggle` + `?map=1` (no header map icon — FAB covers) |
| Status | **HEALTHY** (functional) · premium-header upgrade = **HOLD** (not Approved; do not freestyle) |
| Grep | `category="facilities"` · `showIndustrialChips` · generic `section-back` / `section-filter-toggle` |

Not a melt/nav defect — asymmetric chrome vs Car/RE/Materials is intentional until Chair names a REL.

---

## 7. Maps — `/section/maps`

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `app/section/maps.tsx` → `MapsHubApp` |
| Host / header | `MapsHubApp` dark hub (`testID="maps-hub"`) · world tabs · list toggle |
| Chrome | World filter tabs All/Car/Properties/Materials/Factories/Stays · reuses `SearchResultsMap` / clusters (no vendor delete) |
| Category lock | Per-world criteria in hub (`criteriaForWorld`) — not a catalogue melt |
| Map entry | **This is the Maps hub.** Also deep-links section `?map=1` feeds (Owner: intentional duplication) |
| Status | **FINISHED-DO-NOT-TOUCH** (REL-16) |
| Grep | `MapsHubApp` · `name="section/maps"` · `router.push("/section/maps")` · `maps-hub-world-tabs` |

```10:11:artifacts/banco-mobile/app/section/maps.tsx
export default function MapsSectionScreen() {
  return <MapsHubApp />;
```

---

## 8. Banks — `/business/banks`

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `app/business/banks.tsx` · Stack `business/banks` |
| Host / header | Trust-blue FI hub (BANKS_ACCENT) · brochure products + institution inbox |
| Chrome | Product rows (non-card) · Join / awaiting-admin · FI inbox (403 = non-member) |
| Category lock | Outside `SECTION_ROUTE` (dedicated business world) |
| Map entry | None (not a catalogue map world) |
| Status | **HEALTHY** · partner directory API = **HOLD / intentional gap (D-11)** — brochure by ads-first law |
| Grep | `discover-banks-hub` · `BANKS_ACCENT` · guard “Ads-first: Banks hub is brochure” |

---

## 9. Car Import — `/import`

| Field | Evidence |
|-------|----------|
| Entry route | **YES** — `app/import/index.tsx` · Stack `import/index` (+ request/calculator/auctions/documents/order) |
| Host / header | Import hub hero + 9-card service grid · `MiniAppBottomNav` |
| Chrome | Service cards → real screens only (no dead taps) |
| Category lock | N/A (ops hub, not catalogue). Browse imported stock → `/section/car?engine=import` (Car world) |
| Map entry | N/A as hub; process/track screens separate |
| Status | **FINISHED-DO-NOT-TOUCH** (hub contract) |
| Grep | `import-hub-` testIDs · `href: "/section/car?engine=import"` · Discover `discover-car-import` → `/import` |

**Import vs Stay/RE/Materials:** different shape by design (ops hub, not `SectionSearchApp`). Mounts complete; no wrong melt into Car chrome.

---

## 10. Accounts — profile · create · mine

| Field | Evidence |
|-------|----------|
| Entry routes | **YES** — `(tabs)/profile.tsx` · `listings/create.tsx` · `listings/mine.tsx` · Stack registered |
| Host / header | Profile (Clerk + `/me`) · create wizard · mine list + `PromoteButton` |
| Chrome | Account actions · boost CTA · role-gated Banks/Import shortcuts |
| Category lock | Create taxonomy per category; not a browse mini-app |
| Map entry | Create address map picker (listing geo) — separate from Maps hub |
| Status | **HEALTHY** / core paths **FINISHED-DO-NOT-TOUCH** |
| Grep | `listings/create` · `listings/mine` · `PromoteButton` · `create-boost` → `/plans` |

---

## Ads E2E (platform goal — must not break)

| Step | Path | Evidence |
|------|------|----------|
| Publish | `listings/create` | create screen + boost card `create-boost` → `/plans` |
| Promote | `listings/mine` + `PromoteButton` | `boostListing` via dealer API · `AdsService` |
| Discover / feed | Search + section results | `is_sponsored` on `SmartAssetCard` / Stay / Industrial cards · FeedService sponsored inject |
| Map | Maps hub + section `?map=1` | `SearchResultsMap` |
| Contact | `listing/[id]` | `contactLead` + thread → `/messages/[id]` |

No ads-path break found on tip. Do not touch finished section chrome while working ads.

---

## Stay / RE / Materials / Import — finished-intent check

| Surface | Intentional finished pattern? | Real defect? |
|---------|-------------------------------|--------------|
| Stay | Dedicated `BookingStaysApp` + `StaysHomeHeader` + rent lock | **No** |
| RE | `PropertyHomeHeader` + offer/type chrome + FilterSheet refinements | **No** |
| Materials | `MaterialsHomeHeader` + smart strips + FilterSheet | **No** |
| Import | Separate hub world; Car bridge only via `?engine=import` | **No** |

Asymmetry vs Factories generic header is **HOLD**, not a broken-nav defect.

---

## Guard proof

```
section-miniapp-guard.test.mjs     76/76 PASS
production-wiring-guard.test.mjs   47/47 PASS
materials-core-guard + stay-honesty 12/12 PASS (combined run)
```

Key guard asserts: MOB-07 → `/section/maps`; CarsHomeHeader mount; map portal duplication; Stay shell لا تُمس; Banks brochure; Car engines chips.

---

## Defects safe to fix without touching finished chrome

**None.**

Residual non-defects (do not “fix” as product bugs):

| Item | Class | Note |
|------|-------|------|
| Factories generic header | **HOLD** | Wait Chair REL — do not invent Stay-parity header |
| Banks partner directory | **HOLD / D-11** | Brochure intentional under ads-first |
| REL-21 vehicle-type tabs | **HOLD** | CarsHomeHeader comment: wait taxonomy Approve |
| Guard comment still says “RE + ?map=1” in one FAB test title | docs drift | Assertions already require `/section/maps` |

---

## Verdict

All **10** owner sections mount and wire correctly on tip. Wave 6 REL-16/17/20 landings hold. Prior Maps→RE and Cars-pill defects are **closed**. No safe-to-fix production defects that require chrome surgery.
