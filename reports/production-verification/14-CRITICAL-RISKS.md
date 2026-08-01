# 14 — Critical Risks

| ID | Risk | Sev | Likelihood | Mitigation |
|----|------|-----|------------|------------|
| K-01 | Re-merge from `bancoboom` / Replit agents overwrites identity, Skip, menus | CRITICAL | High historically | Keep `lib-hardening` + `universal-links` tests in CI; never cherry-pick blindly |
| K-02 | Coolify without `OBJECT_STORAGE_PROVIDER=s3` | CRITICAL | High if secrets incomplete | Compose docs; API logs error; media broken until set |
| K-03 | Shipping under wrong package id if ops ignore gate | CRITICAL | Med | Confirm no store listing on `com.bancoboom.app` before first store submit |
| K-04 | Dual Next apps (`banco-web` frozen twin) diverge silently | HIGH | Med | Freeze discipline; prefer `banco-website` for website work |
| K-05 | Clerk social providers empty in production tenant | HIGH | Known | App fail-closed — users see email only; enable in Clerk Dashboard when ready |
| K-06 | `@assets` alias to missing `attached_assets` | MED | Low (unused) | Do not import `@assets` until path exists |
| K-07 | Stale `lib/integrations/*` workspace glob | LOW | Low | Config confusion only |
| K-08 | Scale to 10M users | HIGH (capacity) | Future | Pool/indexes present; needs load test + CDN + DB capacity plan — not claimed PASS |

## Production readiness honesty

Static + unit/guard evidence supports **code contract** readiness for accounts/Clerk repairs and Coolify compose shape.  
**Not** claimed: live multi-region load, store review, full device matrix, live OAuth tenant enablement.
