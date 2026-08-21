# CAR B-OOM unified dock — working note

Target branch: `fix/car-header-unified-dock-20260821`

Single objective: repair the CAR B-OOM browse screen layout without deleting or disabling any existing control.

Current verified defect shape on canonical `4f2c81cc`:
- `CarsHomeHeader` owns top bar, hero, search, category strip and stats.
- `SectionSearchApp` then renders market/sort/listing mode, engine/condition, brand and origin as three additional sibling strips.
- The result is one visually continuous card but still a vertically oversized fixed sibling stack before listings.
- The floating map/list control is separately overlaid above the bottom navigation and must remain functional.

Implementation boundary:
- Move the existing parent-owned controls into one compact header dock slot; keep their existing handlers, criteria fields and test IDs.
- Keep one category strip only.
- Keep all market, sort, listing mode, engine/condition, brand, origin, map, save, filters, stats, profile and notification actions.
- Preserve the existing `SearchResultsSurface` shared-value scroll path; collapse real geometry, not opacity only.
- No Search/Discover routing changes, no filter semantics changes, no API/taxonomy changes, no data deletion.

Status: branch created; source patch pending.

Run npm run build
