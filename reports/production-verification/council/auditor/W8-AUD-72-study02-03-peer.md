# W8-AUD-72 — Peer VERIFY · Chair W8-STUDY-02 / W8-STUDY-03 @ `main`

- Seat: Production Auditor · Protocol `68`
- **SoT:** `main` @ **`e9838638e6e935af367593efa6e43da1590c702e`**
- Chair packets: `council/chair/W8-STUDY-02-STAY-RE-MATERIALS.md` · `W8-STUDY-03-FACTORIES-BANKS-IMPORT-ACCOUNTS.md`
- Prior: AUD-70/71 PASS · absorb PR **#41** (rebase onto this tip)
- Stamp: `2026-07-31T15:29Z`
- Mode: peer only · **zero product code** · DEFECT → Chair Approve Plan before any fix

---

## A. W8-STUDY-02 — Stay · RE · Materials

| World | Chair claim | Auditor dual-end | Peer |
|-------|-------------|------------------|------|
| Stay entry/lock/map/CTAs | PASS · sacred | `booking.tsx` → BookingStaysApp · hard lock rent+RE `:240-258` · mapLatch · create request route | **CONFIRM** |
| RE entry/lock/map/header outs | PASS · sacred | `real-estate.tsx` · PropertyHomeHeader · Stays/Request/Map registered | **CONFIRM** |
| Materials entry/lock/map | PASS axes present | `materials.tsx` · MaterialsHomeHeader · latch | **CONFIRM** |
| Materials **duplicate origin** | **DEFECT MEDIUM** | **CONFIRMED** — see §B | **CONFIRM DEFECT** |
| Stay office icon HOLD | visual only | not re-audited as wiring | **ALIGN HOLD** |
| RE header taste HOLD | prior PRODUCT HOLD | no invent | **ALIGN HOLD** |

Guards @ main: miniapp **76/76** · materials-core **8/8** — PASS.

---

## B. DEFECT peer — Materials dual origin (named for Approve)

| Field | Evidence @ `e983863` |
|-------|----------------------|
| Gate A | `showMaterialsAxisStrip = showOriginChrome = isMaterialsSection` `:832-837` |
| Mount 1 | Axis strip cluster `testID="materials-origin-strip"` **`:1978`** + `section-origin-*` |
| Mount 2 | Legacy chip row `testID="materials-origin-strip"` **`:2097`** under `{showOriginChrome ? (` `:2093-2127` |
| Same handler | both call `selectOrigin(o)` |
| Class | leftover dual wire after consolidation — **not taste** |
| Repair shape (Chair only) | Delete/gate off `:2093-2127` when axis strip owns origin · **do not** touch header / commodity / category lock |

**Auditor:** CONFIRM DEFECT · **HOLD code** until Chair names Approve Plan (World Materials · one packet).

---

## C. W8-STUDY-03 — Factories · Banks · Import · Accounts

| Hunt | Chair | Auditor sample | Peer |
|------|-------|----------------|------|
| Factories map latch | PASS · header icon HOLD | shared mapLatch + FAB `section-map-toggle` · factories host | **CONFIRM** |
| Banks brochure / no fake directory | PASS · D-11 HOLD | `banks.tsx` brochure comment · BANKS_ACCENT | **CONFIRM** |
| Import≠Car melt | PASS · intentional `car?engine=import` bridge | Discover→`/import` · CarsHomeHeader no `/import` | **CONFIRM** |
| create/mine/edit REL-12 walls | PASS · REL-15 HOLD | mine early-return unsigned · create signIn wall | **CONFIRM** |
| Open DEFECT in 6/8/9/10 | **None** | none inventable under sacred law | **CONFIRM** |

---

## D. Absorb / fleet (latest requests review)

| Request | Status |
|---------|--------|
| Absorb Auditor VERIFY (#41) | **MERGEABLE · CI ALL PASS** — rebase to `e983863` this stamp · still owed |
| Absorb REL-00 (#40) | open · MERGEABLE · still owed |
| Close #36 | CONFLICTING · superseded · still open |
| W8 study peer | **this packet AUD-72** |
| Live Certified | **FORBIDDEN** · NOT_CUTOVER 0/6 |
| Product code from Auditor | **ZERO** until Approve on Materials DEFECT |

---

## Auditor JUDGMENT

| Question | Answer |
|----------|--------|
| STUDY-02 wiring (minus origin)? | **PASS / CONFIRM** |
| Materials duplicate origin? | **DEFECT CONFIRMED** — Approve-gated |
| STUDY-03 hunts? | **PASS / CONFIRM** · HOLDs align |
| Next Auditor action without Approve? | Standby · push absorb · report to Chair |

**Verdict:** Peer **PASS** with **one named DEFECT** (Materials origin dual-mount). Chair: absorb #41+#40 · Approve Plan if Owner wants Materials fix · close #36.
