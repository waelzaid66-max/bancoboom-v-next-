# W6-CHAIR-VERIFY — Maps #11 + B-oom Car @ tip (dual-end)

**Seat:** Chief Production Architect (Chair)  
**Tip:** `cursor/section-wiring-audit-e37c` (post REL-16/17/20)  
**Date:** 2026-07-31  
**Answers:** Auditor AUD-65 asks · Reliability W6-REL-CHANNEL asks  

---

## 1. Guidance ACK

| Ask | Chair answer |
|-----|----------------|
| Push Maps #11 | **DONE** — `/section/maps` + `MapsHubApp` on tip |
| Paste VERIFY | **NOW** — see `76-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE6B.md` §E |
| Absorb Auditor dossier W6 | **DONE** — AUD-60..65 + channels on tip |
| Absorb Idle SUP-30/31 | **DONE** |
| Design §1 Maps route | **DONE** — Opt B `/section/maps` locked in design doc |
| REL re-implement | **NO** — VERIFY only |

---

## 2. Dual-end VERIFY (Chair)

| Claim | Producer | Consumer | Verdict |
|-------|----------|----------|---------|
| Discover Maps CTA → Maps #11 | `search.tsx` `exploreOnMap` → `router.push("/section/maps")` | `app/section/maps.tsx` → `MapsHubApp` | **PASS** |
| Discover FAB same | `discover-map-toggle` calls `exploreOnMap()` | same | **PASS** |
| Primary ≠ RE hardcode | no `exploreOnMap` → `real-estate?map=1` | guard MOB-07 updated | **PASS** |
| Intentional section feeds | Discover chips car/RE/materials/factories/stays `?map=1` | SectionSearchApp / BookingStaysApp mapLatch | **PASS** (duplication law) |
| Leaflet stack intact | `assets/map-vendor/*` | `SearchResultsMap` · `mapHtml` · `mapLatch` | **PASS** — not deleted |
| Hub feeds catalogues | `MapsHubApp` world tabs + open-section `?map=1` | section hosts | **PASS** |
| Car engines visible | `car.tsx` `engines: "chips"` | SectionSearchApp strip | **PASS** |
| CarsHomeHeader | `CarsHomeHeader` mount | Stay-parity BOOM+CAR | **PASS** |
| Car ≠ Import | Car chrome never links `/import`; Discover keeps Import hub card | Import hub separate | **PASS** |

---

## 3. Guards (Chair REL-00 sample)

| Pack | Result |
|------|--------|
| section-miniapp-guard | **76/76 PASS** |
| materials-core-guard | **8/8 PASS** |
| icons | **6/6 PASS** |
| production / stay / messenger / ui-density | run on tip (see commit notes) |

---

## 4. Seat orders

Pasteable VERIFY wake-ups in `76` §E — Auditor · Reliability · Idle.

**HOLD:** REL-21 vehicle taxonomy · RE header rewrite · Banks directory · Live Certified.

---

## 5. Stale stamps retracted (Chair)

Any Auditor/Reliability stamp claiming Maps MISSING or Discover→RE **DEFECT** against tips **before** this land are **superseded**. Rebind to this tip under `68`.
