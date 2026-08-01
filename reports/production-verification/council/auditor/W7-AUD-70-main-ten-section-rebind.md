# W7-AUD-70 — Post-merge dual-end rebind · 10 sections @ `main`

- Seat: Production Auditor · Protocol `68`
- **SoT:** `main` @ **`8cf070b`** (handoff) · merge commit **`ac0d6fe`** ← #39
- Product land: **`85cfe7f`** on main · Orders: `78` §5 · `79` · `80` handoff
- Prior peer: AUD-69 @ tip `76f0c1d` (pre-merge) — **rebind now on main**
- Stamp: `2026-07-31T15:18Z`
- Mode: VERIFY only · **zero product code**

---

## A. Ten-section dual-end @ main — PASS

| # | Section | Producer | Consumer / mount | Pass |
|---|---------|----------|------------------|------|
| 1 | Discover | `(tabs)/search` · `exploreOnMap` → **`/section/maps`** | SearchDiscover portals | **YES** |
| 2 | B-oom Car | `section/car` · `engines:"chips"` · CarsHomeHeader | category lock car | **YES** |
| 3 | B-PROPERTIES | `section/real-estate` | Property chrome | **YES** |
| 4 | BOOM STAY | `section/booking` → BookingStaysApp | rent lock | **YES** |
| 5 | Materials | `section/materials` | Materials header path | **YES** |
| 6 | Factories | `section/factories` generic header | facilities lock | **YES** (HOLD header) |
| 7 | Maps | `section/maps` → MapsHubApp | Leaflet stack retained | **YES** |
| 8 | Banks | `business/banks` brochure | D-11 HOLD directory | **YES** |
| 9 | Car Import | `import/index` · bridge `car?engine=import` | ≠ Car chrome | **YES** |
| 10 | Accounts | profile · create · mine · PromoteButton / create-boost | ads path present | **YES** |

Stack `_layout.tsx`: `section/car|real-estate|factories|materials|booking|maps` · `business/banks` · `import/index` · `listings/create|mine` — **all present**.

---

## B. Stale stamp RETRACT vs main (mandatory)

Product on main **contradicts** merged council rows that still say:

| Stale claim (AUD-61/65 on main tree) | Main reality | Action |
|--------------------------------------|--------------|--------|
| Discover primary → `real-estate?map=1` **DEFECT** | `search.tsx:491` → `/section/maps` | **RETRACT** — SUPERSEDED |
| `/section/maps` **MISSING** | `app/section/maps.tsx` present | **RETRACT** |
| Cars pill burial **DEFECT** | `engines: "chips"` + CarsHomeHeader | **RETRACT** |

**Main docs pollution:** merge landed **pre-absorb** Auditor packets. `main` still ships **old** AUD-61/65 DEFECT/MISSING text and **lacks** AUD-63/66/67/68/69.  
**Ask Chair:** docs PR onto `main` absorbing #36 amended set (pasteable in URGENT) — or mark those rows SUPERSEDED in a Chair stamp. Until then, **product SoT = code greps**; do not trust stale AUD-61/65 rows as current truth.

---

## C. Guards @ main worktree `8cf070b`

```
section-miniapp-guard.test.mjs     76/76 PASS
production-wiring-guard.test.mjs   47/47 PASS
```

---

## D. Live / Accept

| Gate | Result |
|------|--------|
| Live cutover | **NOT_CUTOVER 0/6** — Live Certified **FORBIDDEN** |
| Staging Accept #32 | historical CONDITIONAL GO — infra ops Owner |
| Finished chrome | sacred — no taste rewrite from this seat |

HOLD list unchanged: Factories header · Banks directory · REL-21 · Coolify cutover.

---

## Auditor JUDGMENT

| Question | Answer |
|----------|--------|
| 10 sections rebind on main? | **PASS** |
| Map→RE DEFECT vs main? | **RETRACTED** (false under current code) |
| Open product DEFECT? | **NONE** inventable under finished-sacred law |
| Docs debt? | **YES** — absorb amended Auditor VERIFY onto `main` |
| Product code? | **ZERO** |

**Verdict:** Wave7 AUD-70 **COMPLETE**. SoT code healthy. Council doc absorb still owed. Standby for next **named** packet only.
