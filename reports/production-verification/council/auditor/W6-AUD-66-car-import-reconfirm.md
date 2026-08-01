# W6-AUD-66 — Car ≠ Import reconfirm @ tip `59f3fba`

- Seat: Production Auditor · Worlds: **B-oom Car (2)** + **Car Import (9)**  
- Tip: **`4afdf839ad998cc4e9be251b2e40b576ab24dab9`** (code = `85cfe7f`)  
- Orders: `76` AUD-66  
- Stamp: `2026-07-31T15:12:00Z`

## Dual-end

| Producer | Destination | Consumer | Separation |
|----------|-------------|----------|------------|
| Discover `discover-car-import` | `/import` | Import hub | **OK** |
| Import hub Search Cars | `/section/car?engine=import` | Car browse seed | **OK bridge** |
| Discover Cars section card | `/section/car` | Car + CarsHomeHeader + chips | **OK** |
| Car section | no `/import` push | chrome only | **OK** |

## REL-17/20 on Car world (not Import)

| Item | Status |
|------|--------|
| `engines: "chips"` | present — does **not** melt Import |
| `CarsHomeHeader` | present — Stay-parity identity for Car only |
| Import hub routes | auctions/calculator/documents/request **intact** |

## JUDGMENT

**Car≠Import HOLDS** on EXECUTE tip. No defect. No product code.
