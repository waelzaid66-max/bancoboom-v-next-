# W5-SUP-20 — Zone F tip rebind (Wave 5)

**Seat:** Idle / Support  
**Orders:** `71-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE5.md` §D SUP-20  
**Tip SHA:** `a9f5c358149c473019a0c07fcbaea087d143422a`  
**Prior F audit:** `3a234ef` · W4b SUP-10 @ `50e3885` family  
**Date:** 2026-07-31  
**Mode:** Rebind only · zero product code · protocol `68`  

**Diff fact:** `git diff 3a234ef..a9f5c35` on Zone F app paths (import · import-tracking · industry · wallet · billing · plans · settings · legal) = **EMPTY**.  
Wave 5 product delta = `listings/edit` + `listings/mine` (REL-12) only — **outside F surfaces**.

**L2 sample:** section-miniapp-guard **74/74** · `ops:live-cutover` **0/6 NOT_CUTOVER** (DNS still Replit/Horizons; upload_claims gate present in script per D-21).

---

## MOB-F-01…14 rebind @ `a9f5c35`

| ID | Route | Status | Notes |
|----|-------|--------|-------|
| MOB-F-01 | `/import` | **CONFIRMED** RISK LOW | Start ungated; process≈myImports→tracking |
| MOB-F-02 | `/import/request` | **CONFIRMED** RISK LOW | Server `requireAuth` YES |
| MOB-F-03 | `/import/calculator` | **CONFIRMED** HEALTHY | |
| MOB-F-04 | `/import/auctions` | **CONFIRMED** HEALTHY | Static catalog |
| MOB-F-05 | `/import/documents` | **CONFIRMED** HEALTHY | Info-only |
| MOB-F-06 | `/import/order/[id]` | **CONFIRMED** HEALTHY | Owner-scoped server |
| MOB-F-07 | `/import-tracking` | **CONFIRMED** RISK LOW | Request ungated |
| MOB-F-08 | `/industry` | **CONFIRMED** HEALTHY | `category: industrial` |
| MOB-F-09 | `/wallet` | **CONFIRMED** RISK LOW | Soft-auth; server gated |
| MOB-F-10 | `/billing` | **CONFIRMED** RISK LOW | Same |
| MOB-F-11 | `/plans` | **CONFIRMED** RISK LOW | Same |
| MOB-F-12 | `/settings` | **CONFIRMED** RISK LOW | Auth YES; no explicit Stack.Screen |
| MOB-F-13 | `/legal/privacy` | **CONFIRMED** HEALTHY | |
| MOB-F-14 | `/legal/terms` | **CONFIRMED** HEALTHY | |

**Counts:** 7 HEALTHY · 7 RISK LOW · **0 STALE** · **0 DEFECT/CRITICAL/HIGH**

---

## Dual-end (protocol 68)

| Link | Verdict |
|------|---------|
| Import → `/section/car?engine=import` | **CONFIRMED** — seed + `Object.assign(sp, engine.params)` → `origin_type=imported` |
| Origin chrome lag | **AMENDED** RISK LOW UX (unchanged) |
| Industry → `/listing/{id}` | **CONFIRMED** |
| Settings → plans/wallet/legal | **CONFIRMED** |
| F → create empty CTA | **N/A** — F does not emit (REL-10 Zone B/C) |

**Truth map `70` §5 Import/Wallet = H** — matches Idle RISK LOW soft-auth posture; not upgraded without Approve.

End of W5-SUP-20.
