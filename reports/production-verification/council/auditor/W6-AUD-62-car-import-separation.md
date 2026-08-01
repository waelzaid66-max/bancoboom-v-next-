# W6-AUD-62 — Car ≠ Import separation audit (Worlds 2 + 9)

- Seat: Production Auditor · Worlds: **B-oom Car** + **Car Import** only
- SoT: `main` @ `6ad7a484cf5dcf6fa35f281212c2509bfdbd1274`
- Orders: `74` AUD-62 · design §0.4 · §5
- Mode: dual-end evidence · zero product code

## Law under test

`/section/car` = B-oom Car (vehicles browse). `/import/*` = Car Import hub. **Never melt.**

## Dual-end map

| Producer | Destination | Consumer | Separation |
|----------|-------------|----------|------------|
| Discover `discover-car-import` | `/import` | `app/import/index.tsx` hub | **SEPARATE OK** (`SearchDiscover.tsx:380-390`) |
| Import hub “Search Cars” card | `/section/car?engine=import` | `SectionSearchApp` seeds `engineParam` (`:308-352`) | **OK bridge** — browse imported cars inside Car world without owning Import chrome |
| Discover section card Cars | `/section/car` | Car section | **OK** |
| Discover map portal Cars | `/section/car?map=1` | Car map latch | **OK** |
| Car section screen | `SectionSearchApp` only | no `/import` push in `car.tsx` | **OK** — Car does not open Import hub |

## Identity / chrome issues (not melt)

| Issue | Evidence | Class |
|-------|----------|-------|
| Car chrome `engines: "pill"` buries tertiary | `car.tsx:22` · `SectionSearchApp:1658-1675` | **REL-17** (visibility) — not Import melt |
| Naming still generic “Cars” not “B-oom Car” | `titleKey="home.categories.car"` | **REL-20** identity — Approve-gated |
| No `CarsHomeHeader` yet | Stay has `StaysHomeHeader`; Car uses generic SectionSearchApp header | **REL-20** |

## Melt risks observed

| Risk | Present? |
|------|----------|
| Car section UI routes to `/import` | **No** |
| Import hub deleted / gutted | **No** — auctions/calculator/documents/request present |
| Discover Import CTA replaced by Car-only | **No** — dedicated `discover-car-import` |
| `?engine=import` treated as Import hub | **No** — seeds Car browse engine only |

## Auditor JUDGMENT

**Car≠Import routing separation HOLDS** on `main`. Residual Owner pain = Car chrome burial + missing B-oom identity (REL-17/20), **not** Import melt.  
Do **not** recommend collapsing Import into Car. Do **not** touch Import in REL-16/17 blast radius.

## AUD-63

**WAIT** — peer VERIFY only after Chair **EXECUTE** lands REL-16/17 on tip.
