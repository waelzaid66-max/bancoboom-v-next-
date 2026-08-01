# W6-SUP-30 — Ten Worlds index + do-not-delete Maps assets

**Seat:** Idle / Support  
**Orders:** `74-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE6.md` §D SUP-30  
**Tip SoT:** `main` @ `6ad7a48` (post #32 Accept)  
**Design SoT (Chair branch):** `cursor/section-wiring-audit-e37c` @ `d2bbe02` — `docs/superpowers/specs/2026-07-31-wave6-section-separation-boom-car-maps-design.md`  
**Date:** 2026-07-31  
**Mode:** Docs only · **zero product code** · no tip fight  

**STATUS note:** Wave 6 code EXECUTE waits Owner Maps A/B/C + design Approve. SUP-30 is evidence inventory — allowed now.

---

## 1. Ten Worlds index (SoT — one World per packet)

| # | World | Route / surface | Identity | Forbidden cross-touch |
|---|-------|-----------------|----------|------------------------|
| 1 | Discover / Search host | `/(tabs)/search` | BANCO Search | Section chrome internals |
| 2 | **B-oom Car** | `/section/car` | Vehicles (cars · boats · launches · planes…) | Import hub · RE · Stay |
| 3 | B-PROPERTIES | `/section/real-estate` | B-PROPERTIES | Car · Stay · Import |
| 4 | BOOM STAY | `/section/booking` | BOOM STAY | Car · RE sale · Import |
| 5 | Materials (B-CORE) | `/section/materials` | Materials header | Car · RE · Stay |
| 6 | Factories | `/section/factories` | Industrial browse | Car · RE |
| 7 | **Maps** | Discover Maps entry + per-section `?map=1` + Leaflet stack | Maps identity | Must **feed** 2–6 without owning their filters |
| 8 | Banks / FI | `/business/banks` | Brochure + inbox (D-11) | Public directory without Owner epic |
| 9 | Car Import | `/import/*` | Import hub | **Never** Car section chrome |
| 10 | Accounts / publish E2E | profile · create · edit · mine · chat · notif | Clerk + listings | Section visual chrome |

Supporting (named Approve only): Feed · Messages · Wallet/Plans.

**Hard laws:** Car ≠ Import · Maps ≠ RE · ads E2E · no deletes · distrust `68`.

---

## 2. Do-not-delete Maps asset list (verified on `main`)

Paths under `artifacts/banco-mobile/` unless noted.

### Vendor (offline Leaflet — MAP-07)

| Path | Role |
|------|------|
| `assets/map-vendor/leaflet.js` | Leaflet core |
| `assets/map-vendor/leaflet.css` | Leaflet CSS |
| `assets/map-vendor/leaflet.markercluster.js` | MarkerCluster |
| `assets/map-vendor/MarkerCluster.css` | Cluster CSS |
| `assets/map-vendor/MarkerCluster.Default.css` | Cluster default CSS |

**Forbidden:** delete / gut / “simplify away” this vendor tree without Chair Approve naming World 7 + blast radius.

### Bridge + UI

| Path | Role |
|------|------|
| `components/search/mapVendorInline.ts` | Inline vendor bridge |
| `components/search/mapHtml.ts` | HTML map document |
| `components/search/SearchResultsMap.tsx` | Native WebView map |
| `components/search/SearchResultsMap.web.tsx` | Web iframe map + `/search/map` |
| `components/search/MapOverlayChrome.tsx` | Count + pin preview |
| `components/MapPinPicker.tsx` | Pin picker (listing geo) |
| `lib/mapLatch.ts` | `?map=1` latch contract |

### Consumers (do not strip map mode)

| Path | Role |
|------|------|
| `components/search/SectionSearchApp.tsx` | Per-section map mode + latch |
| `components/search/BookingStaysApp.tsx` | Stay map latch parity |

### Prior inventory doc

`docs/superpowers/specs/2026-07-31-production-messenger-maps-inventory.md` (if present on tip — background only).

---

## 3. Gap (honest — not a delete ticket)

Primary Discover Maps CTA still **misrouted → RE** per audit `73` / design §2 — Maps world feels absent while libraries exist. Fix = **REL-16** after Owner Approve (Opt A/B/C). Idle does **not** code it.

---

## 4. SUP-31

**STANDBY** — no Car / Import / Maps product code until Chair EXECUTE paste.

End of W6-SUP-30.
