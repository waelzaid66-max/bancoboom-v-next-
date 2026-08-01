# W2-AUD-22 — Peer-review REL-04 (profile Skip i18n)

## Finding AUD-22
- Severity: **LOW**
- Status: **OPEN_IN_REPO** (REL-04 not landed on tip yet)
- Evidence (tip `34aef42`):
  - `artifacts/banco-mobile/app/(tabs)/profile.tsx` ~877 still:
    `{isRTL ? "تخطى" : "Skip"}`
  - No `t("profile.skipRole")` hit in tip profile/i18n grep
  - Wave 2 Approve Plan assigned REL-04 to Reliability
- User impact: Skip label bypasses i18n SoT; minor EN/AR drift risk
- Regressions if wrong fix: Changing Skip behavior (should only change string source)
- Recommended owner: **Reliability** (REL-04)
- Recommended fix shape: Add `profile.skipRole` EN+AR; replace ternary with `t("profile.skipRole")`; keep existing onPress

## Auditor action
Spot-check again after Reliability lands; flip to ALREADY_FIXED_ON_TIP then.
