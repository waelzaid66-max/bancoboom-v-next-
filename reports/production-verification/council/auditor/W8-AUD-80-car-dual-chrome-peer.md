# W8-AUD-80 — Peer VERIFY · D-W8-01 Car dual-chrome @ `main`

- Seat: Production Auditor · Protocol `68`
- Orders: `81` §4/§6 · `82` · Approve `W8-APPROVE-PLAN-TRANCHE-A`
- **SoT:** `main` @ **`f3b991161de938141ace3fc1bd406352bb33a33a`** (handoff) · land merge `a80de8c` · fix `b4aa364`
- Stamp: `2026-07-31T15:42Z`
- Mode: VERIFY only · **zero product code**

## Success criteria (Approve)

| Criterion | Tip evidence | Pass |
|-----------|--------------|------|
| One `section-sort-cycle` in Car tree | Strip only `:1619` · **absent** in `CarsHomeHeader` | **YES** |
| Market SoT = primary strip | `MarketCountryButton` on `section-primary-strip` · header props **no** `marketCountry`/`onOpenMarket`/`onCycleSort` | **YES** |
| Header comment D-W8-01 | CarsHomeHeader lines 6–10 | **YES** |
| Engines chips retained (REL-17) | `car.tsx` `engines: "chips"` · strip listingMode+engines | **YES** |
| CarsHomeHeader still mounts (REL-20 identity) | `SectionSearchApp` `isCarSection` → `<CarsHomeHeader` | **YES** |
| No Import / Stay / RE edits in land | `b4aa364` files: SectionSearchApp · CarsHomeHeader · guard · docs only | **YES** |

## Dual-end

| Producer | Consumer | Verdict |
|----------|----------|---------|
| Car strip market/sort | criteria update / MarketCountryButton | **PASS** — single seat |
| CarsHomeHeader | identity · search · map · filters only | **PASS** — dual-chrome **CLOSED** |

**JUDGMENT:** D-W8-01 **FIXED_ON_MAIN** · peer **PASS**. STUDY-01 Car DEFECT **SUPERSEDED**.
