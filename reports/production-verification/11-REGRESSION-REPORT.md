# 11 — Regression Report

**Repo:** `banco-with-wael`  
**Branch:** `cursor/production-verification-5cf0`  
**Date:** 2026-07-29  

## Before repair (Phase 0 baseline on `6719f23`)

| Guard test | Result |
|------------|--------|
| `Expo product identity stays canonical (BANCO / com.bancooom.app)` | FAIL — actual `com.bancoboom.app` |
| `account-type gate keeps Skip + dismiss-first anti-trap` | FAIL — no `onboard-skip` |
| `profile overflow menu stays touch-safe` | FAIL — `onStartShouldSetResponder` pollution |
| accounts-clerk-journey + scale-readiness subset | PASS |

## After repair (this branch)

Command:

```bash
cd artifacts/banco-mobile && node --test \
  tests/lib-hardening.test.mjs \
  tests/universal-links-config.test.mjs \
  tests/accounts-clerk-journey.test.mjs \
  tests/scale-readiness.test.mjs
```

**Result: 44/44 PASS, 0 FAIL**

| Guard | After |
|-------|-------|
| R-16 identity `com.bancooom.app` | PASS |
| R-17 Skip + dismiss-before-updateMe | PASS |
| R-18 menu absoluteFill + ScrollView + maxHeight 85% | PASS |
| Accounts/Clerk journey suite | PASS |
| Scale readiness | PASS |

## Env-blocked (not regressions)

| Test | Status |
|------|--------|
| `i18n-usage.test.mjs` | INCONCLUSIVE_ENV — needs `pnpm install` / local `tsc` |
| `icons.test.mjs` | INCONCLUSIVE_ENV — needs `@expo/vector-icons` installed |

## Merge pollution root cause (do not reintroduce)

| Bad pattern | Source commits |
|-------------|----------------|
| `com.bancoboom.app` overwrite | `84602a9` EAS restore from bancoboom after `d35c732` set `com.bancooom.app` |
| Skip wipe | MFA/bancoboom merge after `1ade0c0` Skip restore |
| Menu responder trap | `93b650b`-style wipe; fixed in `78cf1b2`, returned again |

Living tests in `lib-hardening.test.mjs` + `universal-links-config.test.mjs` are the regression fence.
