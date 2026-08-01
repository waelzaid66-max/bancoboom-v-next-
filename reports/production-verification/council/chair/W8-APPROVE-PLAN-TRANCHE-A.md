# W8-CHAIR-APPROVE-PLAN — Tranche A (Car dual-chrome · Materials origin)

**Chair:** Chief Production Architect  
**Date:** 2026-07-31  
**SoT:** `main`  
**Studies:** W8-STUDY-01 · W8-STUDY-02  
**Plan parent:** `81-WAVE8-SECTION-BY-SECTION-DELIVERY-MACHINE.md`

---

## Approve

| ID | World | Change | Forbidden |
|----|-------|--------|-----------|
| D-W8-01 | §2 B-oom Car | Remove market weld + sort control from `CarsHomeHeader` only. Primary strip keeps `MarketCountryButton` + `section-sort-cycle` (unguarded SoT). | No Import touch · no engines/chips rollback · no Stay rewrite |
| D-W8-02 | §5 Materials | Delete **legacy** second origin block (`showOriginChrome` chipRow with duplicate `materials-origin-strip`). Keep origin cluster inside `materials-type-strip`. | No MaterialsHomeHeader rewrite · no commodity strip delete |

## Success

- One `section-sort-cycle` in Car tree  
- One `materials-origin-strip` in Materials tree  
- materials-core-guard + section-miniapp-guard PASS  
- No Stay/RE/Import/Banks file edits  

## EXECUTE

Chair lands on `main` (or short fix branch → merge). Seats VERIFY after.
