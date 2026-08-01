# W1-AUD-03 — i18n + RTL residuals

## Finding AUD-03
- Severity: **LOW**
- Status: **OPEN_IN_REPO** (non-blocking residuals)
- Evidence:
  - Mobile nearest honesty uses `t("search.sortOptions.nearest")` / `t("search.nearestNeedsNearMe")` in `FilterSheet.tsx` — not hardcoded EN-only on that path.
  - Web (`banco-web` + `banco-website`) nearest copy lives in `lib/search-ui-copy.ts` with AR+EN objects — present on tip.
  - Profile Skip control still uses inline ternary `{isRTL ? "تخطى" : "Skip"}` in `app/(tabs)/profile.tsx` (~877) instead of `t(...)` — parity risk if EN/AR trees drift.
  - Full hardcoded-string sweep / compile of every surface: **UNVERIFIED** this session (not run `i18n-usage` against tip tree in clean checkout; tip claims gates elsewhere).
- User impact: Minor UX inconsistency on Skip label path; nearest/web paths appear intentional.
- Regressions if wrong fix: Mass string moves without key parity.
- Recommended owner: Reliability (tiny) after Chair Approve — or defer Wave 2
- Recommended fix shape: Replace Skip ternary with `t("profile.skipRole")` (add EN+AR keys). Do not reopen frozen search-contract.
