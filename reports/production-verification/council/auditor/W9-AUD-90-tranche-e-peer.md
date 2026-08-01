# W9-AUD-90 — VERIFY Tranche E (مهمة المسندة من المدير)

- Seat: Production Auditor  
- **Chair ASSIGN:** `85` §2.1 Wave9 STRICT · Job **AUD-90** VERIFY · then STANDBY  
- Approve plan: `W9-APPROVE-PLAN-TRANCHE-E.md`  
- Inventory machine: `87-WAVE9-PRODUCTION-REINVENTORY-MACHINE.md`  
- **SoT tip:** `main` @ **`a243b28`** (product land **`e4d36b6`** ⊂ tip)  
- Floors: `a05190e` · `6999915` · Wave9 E **OK**  
- Stamp: `2026-07-31T18:12Z`  
- Mode: dual-end greps + guards · **zero product code**  
- Note: packet id **W9-AUD-90** = Chair’s Wave9 AUD-90 seat job (distinct from prior W8-AUD-90 docs-compliance)

---

## 0. Channel (85 §3)

```text
SEAT: Auditor
PACKET: W9-AUD-90
TIP: a243b28
FLOORS: OK
VERDICT: PASS
EVIDENCE: D-W9-01..05 FIXED_ON_MAIN · section 90/90 · materials 8/8 · ui-density 4/4 · chain 167/167 · Leaflet/mapLatch/FilterSheet PRESENT · no #C4A35A MapsHub · no #650E36 Stay · hideOriginAxis={isMaterialsSection} · section-header-map→openOrLatchMap · live NOT_CUTOVER 0/6 · PIO classified READ-ONLY (env/runtime — not Tranche E fail)
ASK_CHAIR: merge absorb #45 (includes this peer) · Replit PASTE expect section 90/90 + Maps RED · HOLD D-W9-06/07/08 need Approve Plan before any Car/RE/Stay dual-filter work · Auditor STANDBY
```

---

## 1. Success criteria (Approve Plan) — بند بند

| ID | Success criterion | Dual-end evidence @ tip | Judgment |
|----|-------------------|-------------------------|----------|
| **D-W9-01** | No `#C4A35A` in MapsHubApp · `sectionAccent("all")` | `MapsHubApp.tsx`: `const ACCENT = sectionAccent("all")` · `rg #C4A35A` **no match** | **PASS** |
| **D-W9-02** | `testID="section-header-map"` · `openOrLatchMap` | Same Pressable @ ~1469–1483 in `SectionSearchApp.tsx` · comment cites Factories / no invented header | **PASS** |
| **D-W9-03** | Materials `hideOriginAxis` · showOrigin false when set | Host: `hideOriginAxis={isMaterialsSection}` · FilterSheet: `showOrigin = … && !hideOriginAxis` · strip `materials-origin-strip` still present | **PASS** |
| **D-W9-04** | No `#650E36` in BookingStaysApp · StaysHomeHeader remains | `rg #650E36` **no match** · comment D-W9-04 · W9-E guard asserts `<StaysHomeHeader` | **PASS** |
| **D-W9-05** | Maps world-tabs `flexGrow: 0` | `MapsHubApp.tsx` `style={{ flexGrow: 0 }}` · `testID="maps-hub-world-tabs"` | **PASS** |
| Cross | Leaflet stack on disk | `leaflet.js/.css/.markercluster.js` · `mapVendorInline.ts` · `mapHtml.ts` · `mapLatch.ts` · `FilterSheet.tsx` **PRESENT** | **PASS** |
| Cross | section-guard **90/90** | this machine: **90/90 PASS** (W9-E tests included) | **PASS** |
| Cross | materials + ui-density | **8/8** · **4/4** | **PASS** |

**Companion:** chain-integrity **167/167** · live **NOT_CUTOVER 0/6** (OPS — not E regression).

**JUDGMENT:** Tranche E **FIXED_ON_MAIN** · peer **PASS**. Forbidden surfaces untouched (no Leaflet delete · no FactoriesHomeHeader · no Stay header rewrite · no strip delete).

---

## 2. Greps (حرفي — قابل لإعادة التشغيل)

```bash
# (1) Maps gold gone + red-family bind
rg -n '#C4A35A|sectionAccent\(\s*"all"\s*\)' artifacts/banco-mobile/components/search/maps/MapsHubApp.tsx
# expect: no #C4A35A · sectionAccent("all") present

# (2) Factories/generic header map
rg -n 'section-header-map|openOrLatchMap' artifacts/banco-mobile/components/search/SectionSearchApp.tsx

# (3) Materials origin dual severed in sheet
rg -n 'hideOriginAxis=\{isMaterialsSection\}|showOrigin = criteria.category === "materials" && !hideOriginAxis' \
  artifacts/banco-mobile/components/search/SectionSearchApp.tsx \
  artifacts/banco-mobile/components/search/FilterSheet.tsx

# (4) Stay rose dead CSS
rg -n '#650E36' artifacts/banco-mobile/components/search/BookingStaysApp.tsx
# expect: no matches

# (5)+(6)
ls artifacts/banco-mobile/assets/map-vendor/leaflet.js
cd artifacts/banco-mobile && node --test tests/section-miniapp-guard.test.mjs
# expect: 90/90
```

---

## 3. HOLD register (لا ارتجال — من `87`)

| ID | World | Status | Auditor |
|----|-------|--------|---------|
| D-W9-06 | Car engines dual | HOLD | **ASK Chair** قبل أي Approve Plan |
| D-W9-07 | RE type+Wanted dual | HOLD | same |
| D-W9-08 | Stay type+Wanted dual | HOLD | same |
| Factories premium header · Banks directory · REL-21 · Live/Coolify · Arabic seed | HOLD | Owner only |

---

## 4. PIO / runtime intel (READ ONLY على tip) — ليس فشل E

`reports/intelligence/2026-07-31-PRODUCTION-INTELLIGENCE-REPORT.md`:

| Finding | Class under council law |
|---------|-------------------------|
| Expo/Next white screen · Clerk secret-key-invalid | **ENV/runtime** → Replit/Owner secrets · not Tranche E product fail |
| 0 facet categories / 110 listings | Data/facet · classify |
| banco-web vs website | OPS deploy · known |
| Unmerged `*-5cf0` temptation | **REJECT merge** per `85` |

Auditor: **classify only** · لا نفتح منتج من PIO بدون ASSIGN.

---

## 5. STANDBY

VERIFY المطلوب من المدير **منجز**.  
Zero product code.  
Next: Replit shots على tip الجديد (section **90**) · Chair absorb #45 · أي D-W9-06/07/08 فقط بعد Approve Plan.

— Auditor · W9-AUD-90 PASS · personal-precision peer
