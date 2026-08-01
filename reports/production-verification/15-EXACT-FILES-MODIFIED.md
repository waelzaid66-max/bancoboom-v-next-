# 15 — Exact Files Modified

**Mission constraint:** touch only proven defects + audit reports. No renames, moves, or library upgrades.

## Code repairs (this branch)

| File | Change | Defect |
|------|--------|--------|
| `artifacts/banco-mobile/app.json` | `com.bancoboom.app` → `com.bancooom.app` (ios + android) | R-16 |
| `artifacts/banco-mobile/app/(tabs)/profile.tsx` | Restore Skip UI; dismiss-before-updateMe; touch-safe overflow menu + `maxHeight: "85%"` | R-17, R-18 |

## Audit reports added

| File |
|------|
| `reports/production-verification/01-REPOSITORY-AUDIT.md` |
| `reports/production-verification/02-10-AUDIT-DRAFT.md` |
| `reports/production-verification/11-REGRESSION-REPORT.md` |
| `reports/production-verification/12-MISSING-FEATURES.md` |
| `reports/production-verification/13-BROKEN-FEATURES.md` |
| `reports/production-verification/14-CRITICAL-RISKS.md` |
| `reports/production-verification/15-EXACT-FILES-MODIFIED.md` |

## Explicitly NOT modified

- No folder moves/renames  
- No deletion of `banco-web` / shadcn copies / orphans  
- No dependency version bumps  
- No new features  

## Verification command

```bash
cd artifacts/banco-mobile && node --test \
  tests/lib-hardening.test.mjs \
  tests/universal-links-config.test.mjs \
  tests/accounts-clerk-journey.test.mjs \
  tests/scale-readiness.test.mjs
# Expect: 44 pass / 0 fail
```
