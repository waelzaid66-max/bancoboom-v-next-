# PR #13 — Next Patch Instructions — 2026-08-21

Work only on `fix/car-header-unified-dock-v2-20260821` and only after reading `PR13-CAR-CLAUDE-REVALIDATION-2026-08-21.md`.

## Required implementation

1. Keep `SectionSearchApp` as the sole owner of criteria, handlers, picker state and callbacks.
2. Remove the `CarBrowseAxes` reimplementation. Do not replace it with another bespoke CAR control component.
3. Build `carControlsSlot` from the existing JSX nodes already proven in canonical:
   - `section-primary-strip` = MarketCountryButton + sort + listingMode;
   - `section-engine-strip` = existing engine/condition renderer using `axisShape(chrome, "engines")`;
   - `car-brand-origin-strip` = existing brand picker + origin controls.
4. Move those existing nodes into `cars-controls-slot` exactly once. The old CAR sibling seats must become unreachable; generic/non-CAR seats remain behavior-equivalent.
5. Restore the Real-Estate property-type chips fallback exactly from canonical. Do not redesign Property.
6. Keep `section-results-count` in CAR map mode. Compact/reposition is allowed; suppression is not.
7. Preserve every existing testID, accessibility prop, haptic call, FilterSheet path, picker path, category lock, map/list toggle and Saved Search behavior.
8. No API, DB, schema, migration, Maps engine/provider, Messenger, deploy, package-manager, navigation architecture or other section-header changes.

## Verification before any merge discussion

- `car-dock-zero-loss-guard.test.mjs` GREEN without weakening assertions.
- CarsHomeHeader render tests GREEN.
- SectionSearchApp render tests GREEN.
- section-miniapp guard GREEN.
- car-hero-honesty GREEN.
- mobile typecheck GREEN.
- root `npm run build` executed on the exact final SHA.
- final-tree diff reviewed against canonical with explicit proof that every non-comment deletion is either CAR chrome moved exactly once or an intentional duplicate CAR map affordance removal.
- visual/device matrix: 320/360/390/430, AR/EN, RTL/LTR, map/list, loading/empty/error, keyboard, safe area/font scale, Android elevation.

Do not merge on static source evidence alone.

Run npm run build
