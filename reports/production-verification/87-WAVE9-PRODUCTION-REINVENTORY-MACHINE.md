# Wave 9 — Production re-inventory + polish machine

**Chair:** Chief Production Architect  
**Date:** 2026-07-31  
**SoT tip base (pre-land):** `main` @ `5229c89`  
**Parent:** `85` strict orders · `77` inventory · Owner: جرد كامل · فلاتر/مساحات · خرائط · ممنوع مسح · ممنوع كسر الهوية  

---

## 0. Firmware

1. ASK Chair · one World per packet  
2. **NO-DELETE:** Leaflet · mapVendorInline · SearchResultsMap · mapLatch · FilterSheet · messenger  
3. Identity: red-family only (Banks blue exception) — Maps gold = DEFECT (FIXED in E)  
4. Finished sacred: Stay/RE headers · Materials identity · Import · Banks brochure  
5. Real tests after every land  

---

## 1. NO-DELETE proof (this tip)

| Asset | Status |
|-------|--------|
| `assets/map-vendor/leaflet.js` (+ css, markercluster) | **PRESENT** |
| `mapVendorInline.ts` · `mapHtml.ts` · `SearchResultsMap(.web)` | **PRESENT** |
| `lib/mapLatch.ts` | **PRESENT** |
| `FilterSheet.tsx` | **PRESENT** |
| `messages.tsx` · `messages/[id].tsx` | **PRESENT** |
| section-guard **90/90** · materials 8 · ui-density 4 · production-wiring 47 · typecheck | **PASS** |

---

## 2. Page-by-page Worlds matrix (post Tranche E)

| # | World | Map | Filters / spacing | Identity | Verdict |
|---|-------|-----|-------------------|----------|---------|
| 1 | Discover | CTA → `/section/maps` · FAB · portals `?map=1` | Host `hScroll` flexGrow:0 | primary red | **OK** |
| 2 | B-oom Car | Header `openOrLatchMap` · FAB · latch | Engines strip+sheet **DEFECT** · market/sort HOLD | `sectionAccent("car")` | **DEFECT** (engines dual) |
| 3 | B-PROPERTIES | Header map · FAB · latch | type+Wanted duals **DEFECT** · Band D pin HOLD | `sectionAccent("real_estate")` | **DEFECT** (type/Wanted) |
| 4 | BOOM STAY | StaysHomeHeader map · FAB | type+Wanted duals **DEFECT** · rose CSS **FIXED** | RE accent · no `#650E36` | **DEFECT** (type/Wanted) |
| 5 | Materials | Header map · FAB | Origin dual **FIXED** (`hideOriginAxis`) · commodity HOLD | materials accent | **OK** |
| 6 | Factories | `section-header-map` **FIXED** · FAB | Strip industrial OK · no invent header | facilities accent | **OK** |
| 7 | Maps §7 | Hub = map world | tabs `flexGrow:0` **FIXED** | `sectionAccent("all")` · **no gold** | **OK** |
| 8 | Banks | N/A catalogue map | brochure only | blue `#1668B5` exception | **OK** |
| 9 | Car Import | No Leaflet (hub) · deep→car?engine=import | no sheet dual | red-family hardcode | **OK** |
| 10 | Accounts | N/A | profile→mine | primary | **OK** |

---

## 3. Proven DEFECT register

| ID | World | Defect | Sev | Policy |
|----|-------|--------|-----|--------|
| **D-W9-01** | Maps §7 | Accent gold `#C4A35A` | MAJOR | **CLOSED E** → `sectionAccent("all")` |
| **D-W9-02** | Factories | لا header map — FAB فقط | MAJOR | **CLOSED E** → `section-header-map` + latch |
| **D-W9-03** | Materials | Origin مزدوج strip + sheet | MED | **CLOSED E** → `hideOriginAxis` |
| **D-W9-04** | Stay | StyleSheet hero وردي ميت | LOW | **CLOSED E** → dead CSS removed |
| **D-W9-05** | Maps | world-tabs بلا `flexGrow:0` | LOW | **CLOSED E** |
| D-W9-06 | Car | engines dual strip+sheet | MED | **HOLD** — ASK→Approve Plan |
| D-W9-07 | RE | propertyType + Wanted dual | MED | **HOLD** — ASK→Approve Plan |
| D-W9-08 | Stay | type + Wanted dual | MED | **HOLD** — ASK→Approve Plan |

**HOLD (لا ارتجال):** market/sort dual intentional · REL-21 · Banks directory · Factories premium header · Arabic seed · Coolify Live · Band D tabsScroll pin (low risk, ask first)

---

## 4. Tranche E (EXECUTED)

Approve: D-W9-01…05 only. Guards W9-E in `section-miniapp-guard.test.mjs`. Seats VERIFY.

---

## 5. Seat missions بعد Tranche E (واحد لكل مرة · ASK Chair)

| Order | Seat | World | Mission |
|-------|------|-------|---------|
| 1 | Auditor | tip | AUD-90 peer Tranche E |
| 2 | Reliability | tip | REL-00 full mobile pack |
| 3 | Replit | runtime | PASTE unify + R01–R12 · Maps RED not gold · Factories header map |
| 4 | ASK→Car | Car | Approve Plan: sheet engines de-dupe vs strip |
| 5 | ASK→RE | RE | Approve Plan: hide sheet type/Wanted when header owns |
| 6 | ASK→Stay | Stay | Approve Plan: hide sheet type/Wanted · padH VERIFY first |
| 7 | Idle | board | Sync 86/87 board |

---

## 6. Pasteable wake-ups

### Auditor
```
WAVE9. SoT=main. Read 87 inventory + W9-APPROVE-PLAN-TRANCHE-E.
After Chair lands E: AUD-90 Maps red identity · Factories header-map · Materials hideOriginAxis · no Leaflet delete · section-guard 90/90.
Zero product unless EXECUTE. ASK before next World.
```

### Reliability
```
WAVE9. REL-00 after Tranche E: section-guard + materials + ui-density + production-wiring.
Then STANDBY. Queue Replit RED_LOGS only.
```

### Replit
```
After tip updates: re-run PASTE-REPLIT-WAVE8-UNIFY-MAIN-AR.md (floors still a05190e+6999915).
Shots R01–R12. Confirm Maps accent is RED not gold. Factories header has map. NO CODE.
```

### Idle
```
SUP: board from 87. Zero product code.
```
