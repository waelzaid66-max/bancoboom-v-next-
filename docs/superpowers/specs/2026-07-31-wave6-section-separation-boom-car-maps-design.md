# Wave 6 — Section Separation Law + B-oom Car + Maps (design)

**Date:** 2026-07-31  
**Chair:** Chief Production Architect  
**SoT tip:** `main` @ merge #32 · work branch `cursor/section-wiring-audit-e37c`  
**Owner mandate:** Best stable ads-platform E2E · **no deletes** · **no section melt** · precise per-agent plans · fix prior agent pollution immediately  
**Status:** Design for Owner approval (brainstorming gate) — **no product code until Owner picks Maps option + Approves phases**

---

## 0. Absolute laws (every seat)

1. **Ads platform end-to-end** is the goal — never break publish / browse / contact / pay paths for “cleanup.”  
2. **Forbidden:** delete, hide, or gut working tech (Leaflet vendor, map clusters, FilterSheet, Import hub, Stay shell, messenger, etc.).  
3. **Ten worlds — total separation.** An agent assigned to World N may not edit World M without Chair Approve naming both worlds.  
4. **Car ≠ Import.** `/section/car` = **B-oom Car** (all vehicles). `/import` = Car Import hub — separate forever.  
5. **Maps ≠ Real Estate.** Discover Maps identity must not hardcode `/section/real-estate?map=1`.  
6. Prior HEALTHY that stamped map→RE is **pollution** — retracted under `68` + Owner order.  
7. Stay (`BookingStaysApp` + `StaysHomeHeader`) is the **parity reference** for Car chrome — copy structure, not melt Stay into Car.

---

## 1. The ~11 mini-apps / worlds (SoT map)

| # | World | Route / surface | Identity | Do not touch from other worlds |
|---|-------|-----------------|----------|--------------------------------|
| 1 | Discover / Search host | `/(tabs)/search` | BANCO Search | Section chrome internals |
| 2 | **B-oom Car** | `/section/car` | **B-oom Car** — vehicles (cars · boats · launches · planes…) | Import hub, RE, Stay |
| 3 | B-PROPERTIES | `/section/real-estate` | B-PROPERTIES | Car, Stay, Import |
| 4 | BOOM STAY | `/section/booking` | BOOM STAY | Car, RE sale, Import |
| 5 | Materials (B-CORE) | `/section/materials` | Materials header | Car/RE/Stay |
| 6 | Factories | `/section/factories` | Industrial browse | Car/RE |
| 7 | **Maps (mini-app)** | `/section/maps` + Discover Maps CTA | **Dedicated Maps layer** | Must **feed** 2–6 via intentional `?map=1` duplication |
| 8 | Banks / FI | `/business/banks` | Trust-blue brochure + inbox | Not a public directory (D-11) unless Owner epic |
| 9 | Car Import | `/import/*` | Import hub | **Never** Car section chrome |
| 10 | Accounts / publish E2E | profile · create · edit · mine · chat · notif | Clerk + listings | Section visual chrome |

**Owner count = 11 mini-apps** with Maps as its own special section inside main Search (not a chooser-only shortcut). Feeding maps into other sections — even with repetition — is **intentional**: Maps is high-tech infrastructure for every catalogue.

Supporting: Feed, Messages, Wallet/Plans — do not open unless named in Approve Plan.

---

## 2. What already exists (DO NOT DELETE)

### Maps stack (high-tech — present, mis-surfaced)

| Asset | Role |
|-------|------|
| `assets/map-vendor/*` (Leaflet + MarkerCluster) | Offline vendor (MAP-07) |
| `mapVendorInline.ts` · `mapHtml.ts` | HTML bridge |
| `SearchResultsMap.tsx` / `.web.tsx` | WebView/iframe map + `/search/map` clusters |
| `MapOverlayChrome.tsx` | Count + pin preview |
| `lib/mapLatch.ts` | `?map=1` latch |
| Per-section map mode in `SectionSearchApp` / Stay | Consumer OK |
| Inventory doc | `docs/superpowers/specs/2026-07-31-production-messenger-maps-inventory.md` |

**Gap:** primary Discover CTA routes to **RE** → Maps world feels “غايب” even though libraries are in-repo.

### Stay parity reference

| Piece | Path |
|-------|------|
| Shell | `BookingStaysApp.tsx` |
| Header | `stays/StaysHomeHeader.tsx` — boom-logo · STAY · map · search+filter · type tabs |
| Cards | `StayCard` |
| Lock | always `real_estate` + `rent` |

### Car today (broken vs Owner)

| Piece | Today | Owner want |
|-------|-------|------------|
| Name | Generic “Cars” section | **B-oom Car** |
| Shell | `SectionSearchApp` + pills | Stay-grade dedicated chrome |
| Scope | Car listings / engines | All vehicles (car · boat · launch · plane…) under B-oom Car |
| Import | Discover card + `?engine=import` browse | Import hub stays separate; Car must not become Import |
| Filters | Buried in pill + sheet | Visible Stay-style filters |

---

## 3. Approaches

### Maps entry (Owner locked **B**)

| Opt | Behavior | Status |
|-----|----------|--------|
| A — Chooser only | Primary CTA opens chooser sheets | **Rejected** — Owner: Maps is its own mini-app (#11) |
| **B — Maps hub route (LOCKED)** | `/section/maps` using **same** `SearchResultsMap` + world tabs; Discover CTA → Maps hub; per-section `?map=1` **kept** (intentional duplication) | **EXECUTE** |
| C — All-catalogue only | One mixed map without hub identity | Not chosen |

**Owner law:** Maps = special section inside Search. Duplication of map feeds across sections is intentional. Never delete Leaflet/vendor stack.

### B-oom Car Stay-parity

| Opt | Behavior |
|-----|----------|
| **1 — CarsHomeHeader + SectionSearchApp (recommended phase 1)** | New `CarsHomeHeader` (mirror `StaysHomeHeader`: boom-logo · **CAR** · map · search+filter pill · vehicle-type tabs). Keep `SectionSearchApp` body; restore engine/brand **chips**. Import untouched. |
| **2 — Full CarsApp shell** | Clone `BookingStaysApp` pattern into `CarsApp.tsx` | Cleaner long-term; larger blast |
| **3 — Rename only** | i18n “B-oom Car” without chrome | Insufficient — Owner rejected |

**Chair recommendation:** **Phase 1 = Opt 1** (stable). Vehicle-type taxonomy (planes/boats/launches) = **Phase 2** with taxonomy Approve (no fake filters without API facets).

---

## 4. Phased delivery (stable first)

| Phase | ID | Scope | Forbidden |
|-------|-----|-------|-----------|
| **P0** | REL-16 | Maps mini-app `/section/maps`; Discover CTA → Maps (≠ RE); keep secondary `?map=1` feeds + all Leaflet | Touch Import · delete map vendor · melt Search criteria |
| **P1** | REL-17 | Cars engines/brands **visible chips** (un-bury tertiary) | Import melt · API enum invent |
| **P2** | REL-20 | `CarsHomeHeader` B-oom Car Stay-parity identity | Rewrite Stay/RE headers · Import |
| **P3** | REL-21 | Vehicle-type tabs (car/boat/…) when taxonomy/API ready | Fake empty chips |
| **HOLD** | — | RE header identity tweak · Banks directory · MSG-05 WS | Until Owner reference / epic |

---

## 5. Prior agent problems → immediate treatment

| Pollution | Treatment |
|-----------|-----------|
| Zone A/B HEALTHY for map→RE | Retracted in `73` audit · seats must not re-stamp |
| Car chrome `engines: "pill"` “optimization” | REL-17 reverse visibility without deleting FilterSheet |
| Car Import confused with Cars section | Law §0.4 · Discover may link Import hub; Car identity never says Import |
| Weak-model freelancing across sections | Wave 6 standing orders: one world per packet |

---

## 6. Success criteria

- Discover Maps CTA does not open Properties by default  
- Leaflet/cluster/mapLatch still work in every section that had them  
- B-oom Car reads as Stay-grade identity; filters visible; Import separate  
- Create/publish/browse/contact E2E green (mobile pack + confidence)  
- Zero product deletes  

---

## 7. Owner approval needed

Approve this design doc, then answer the Maps question in chat (A / B / C).  
Then Chair issues pasteable seat orders and executes P0/P1 on an Approve Plan.
