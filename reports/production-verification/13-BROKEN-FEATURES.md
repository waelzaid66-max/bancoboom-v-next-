# 13 — Broken Features

Only items with **proof** (test FAIL or byte/path evidence). Opinions excluded.

| ID | Feature | Status | Location | Root cause | Repair |
|----|---------|--------|----------|------------|--------|
| B-01 | Expo store identity | **FIXED** | `artifacts/banco-mobile/app.json` | bancoboom EAS merge set `com.bancoboom.app` | Restored `com.bancooom.app` |
| B-02 | Account-type Skip / anti-trap | **FIXED** | `profile.tsx` picker | Skip wiped; dismiss-after-updateMe order wrong | Restored Skip + dismiss-before-`updateMe` |
| B-03 | Profile overflow menu touches | **FIXED** | `profile.tsx` Modal | Nested `onStartShouldSetResponder` | Restored absoluteFill + ScrollView + maxHeight 85% |
| B-04 | Email sign-in account-type heal | **FIXED earlier** | `profile.tsx` | OAuth-only `authJustHappenedRef` | Prior accounts harden on `6719f23` |
| B-05 | MFA delete account | **FIXED earlier** | `settings.tsx` | Rejected `needs_second_factor` | Prior accounts harden |
| B-06 | Object storage default Replit | **MITIGATED** | `objectStorageProvider.ts` | Default `replit` | Loud warn + Coolify docs require `s3` — still defaults if unset |
| B-07 | `banco-web` vs `banco-website` twin | **OPEN (hygiene)** | both artifacts | Frozen duplicate | Owner decision — not deleted this mission |
| B-08 | i18n/icons living tests | **INCONCLUSIVE_ENV** | mobile tests | No `node_modules` | Re-run after install |

## Still PENDING_RUNTIME (not marked broken)

OAuth Google/Apple/Facebook live completion, push notifications, camera, offline reconnect, full payment webhook against Paymob, Coolify live SSL — require staging credentials/devices.
