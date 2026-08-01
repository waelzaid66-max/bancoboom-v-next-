# W8 — Tranche B CLOSED (Chair)

**Date:** 2026-07-31  
**Branch tip:** `2afccf8` (pre-merge)  
**Defect:** D-W8-03 Discover dead melt props  

## REL-00

| Pack | Result |
|------|--------|
| section-miniapp-guard | 77 pass |
| materials-core-guard | 8 pass |
| production-wiring-guard | 47 pass |

## Product truth

- `SearchDiscover` Props = `{ onExploreMap }` only  
- FilterSheet `onBrowseBrand` still wired from Search host + SectionSearchApp  
- Maps CTA still `/section/maps` (no RE hardcode)  

## Next

Seats VERIFY (AUD-82) → **STANDBY**. No further product World without Owner naming a HOLD epic.
