# W6-REL-PREFLIGHT-16 — Maps primary (amended for Owner #11)

**Seat:** Reliability · **HOLD** until Chair tip land + VERIFY/EXECUTE paste  
**Remote tip:** `603f1ea`  
**World:** Maps (mini-app **#11**)  
**Law update:** Owner — Maps is its own section/mini-app; primary must open **`/section/maps`**, not Real Estate and not chooser-only as final identity.

## Dual-end @ remote tip (pre-land)

| End | Evidence | Verdict |
|-----|----------|---------|
| Producer primary | `search.tsx:491` → `/section/real-estate?map=1` | **DEFECT** |
| Producer CTA/FAB | `discover-explore-map` + FAB → same | **DEFECT** |
| Consumer `/section/maps` | **No file / no route** | **MISSING** (required by Owner #11) |
| Leaflet stack | vendor · SearchResultsMap · mapLatch | **PRESENT — do not delete** |
| Section `?map=1` latch | SectionSearchApp | HEALTHY for car/RE/materials/factories/booking |

## Superceded interim

Opt A Discover-only chooser (Chair local WIP) is **not** the Owner end-state. Reliability will **not** VERIFY chooser-as-primary as FIXED for Maps identity.

## VERIFY checklist (when landed)

- [ ] `app/section/maps.tsx` (or equivalent) exists  
- [ ] Discover primary + FAB → `/section/maps` (not RE)  
- [ ] Maps hub feeds sections without deleting Leaflet  
- [ ] Guard: primary destination ≠ `real-estate?map=1`  
- [ ] i18n copy not property-only  

**Status:** PREFLIGHT amended · awaiting Chair push.
