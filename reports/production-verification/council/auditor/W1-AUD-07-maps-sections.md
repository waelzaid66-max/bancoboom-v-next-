# W1-AUD-07 — Maps per section (latch / near-me / nearest / Stay)

## Finding AUD-07
- Severity: **LOW**
- Status: **ALREADY_FIXED_ON_TIP** for honesty contracts; soft dependency remains
- Evidence:
  - `?map=1` latch: `SectionSearchApp.tsx` + `BookingStaysApp.tsx` comments MOB-07; preserve latch across market hydrate.
  - Near-me + nearest gate MAP-08: `FilterSheet.tsx` refuses `nearest` without `nearMeEnabled`; web `SearchControls.tsx` / `SearchNearMeControl.tsx` same honesty.
  - Stay overlay: `SearchResultsMap.tsx` accepts Stay card preview prop; `mapHtml.ts` bookable pin prefix for furnished/daily.
  - Charter §4 frozen: offline Leaflet vendor ACCEPTED on tip — **do not redo**.
  - Soft residual: if tip still loads any CDN path in non-vendor builds, treat as accepted soft risk unless Chair reopens MAP-07 (Auditor did not re-diff vendor files line-by-line this session beyond grep presence of contracts).
- User impact: Users cannot silently get meaningless nearest sort; Stay map preview wired.
- Regressions if wrong fix: Breaking latch or forcing Google Maps (forbidden by confidence gates).
- Recommended owner: none Wave 1
- Recommended fix shape: none — keep frozen.
