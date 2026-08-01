# W8-AUD-84 — Peer VERIFY · Tranche C pollution stabilize @ `main`

- Seat: Production Auditor · Protocol `68`
- Orders: `82` (A+B+C CLOSED · VERIFY C) · Approve `W8-APPROVE-PLAN-TRANCHE-C` · CLOSED stamp
- **Note on IDs:** Chair pasteable said “AUD-83 Tranche C peer”; **AUD-83** already used for deep plans/wiring audit → this packet is **AUD-84** fulfilling that duty.
- **SoT:** `main` @ **`ddb9371e2215d6cd7462c5320228687ba3a36b6a`** · land `fb81f92` · status tip `812e703`
- Stamp: `2026-07-31T15:59Z`
- Mode: VERIFY · **zero product code**

## Success criteria (Approve C)

| ID | Criterion | Tip evidence | Pass |
|----|-----------|--------------|------|
| D-W8-04 | Dead `applySaved` gone from Search host | No `const applySaved` · comment forbids reintroduce · lib-hardening asserts absence | **YES** |
| D-W8-05 | Maps prose `#11` → **§7 of 10** | `maps.tsx` · `MapsHubApp` · Discover/search comments · guard titles MOB-07/CTA/mount | **YES** |
| D-W8-06 | Guards updated | section-miniapp + lib-hardening | **YES** |
| Forbidden | No Leaflet delete · no Stay/RE/Import/Banks rewrite · browseBrand kept | land files = search/maps/guards/docs | **YES** |

## Dual-end reconfirm (post-C)

| Check | Result |
|-------|--------|
| Discover → `/section/maps` | **PASS** |
| SearchDiscover Props `{onExploreMap}` only | **PASS** (Tranche B holds) |
| Car sort single-seat · Materials origin×1 | **PASS** (A holds) |
| section-miniapp-guard | **77/77 PASS** |
| lib-hardening | **32/32 PASS** |
| materials / production-wiring | **8/8 · 47/47 PASS** |

**JUDGMENT:** Tranche C **FIXED_ON_MAIN** · peer **PASS**. Pollution stabilize for install-readiness **ACK**. Live Certified still **FORBIDDEN** (NOT_CUTOVER).

Posture: **STANDBY** · ASK before next World.
