# Accounts + Clerk Proof Report — `banco-with-wael`

**Date:** 2026-07-29  
**Repo:** https://github.com/waelzaid66-max/banco-with-wael  
**Branch:** `cursor/accounts-clerk-harden-5cf0` → merge to `main`  
**Trigger:** Owner suspicion that Replit Agent pollution broke Clerk / accounts paths after the `bancoo` formation wave.

---

## Verdict

Accounts/Clerk on the new stack are **mostly sound** (4 account types, FI `intent=fi`, S4 demote guard, MFA, fail-closed social buttons, AuthGate → profile). Deep audit found **real defects** (not paranoia) — several match classic Replit-agent path damage (wrong defaults, wrong docs, OAuth-only flags). Those are fixed in this pass and guarded by `tests/accounts-clerk-journey.test.mjs`.

---

## Journeys traced (before → after)

| Journey | Before | After |
|--------|--------|-------|
| Email sign-up personal/business | OK via `consentPendingRef` → `updateMe` | OK + `signupInFlightRef` prevents picker race |
| OAuth new user → 4-type picker | OK (`authJustHappenedRef` on SSO only) | OK |
| Email **sign-in** legacy user without `accountTypeChosen` | **STUCK** — picker never opened | Fixed — flag set on finalize + cold-launch heal |
| MFA complete after password | Same stuck hole | Fixed |
| Password reset finalize | Same stuck hole | Fixed |
| FI picker / banks / verification | FI `intent=fi` OK; banks/verification missing from Stack registry | Stack screens registered |
| Manage account type (menu) | OK escape hatch | OK |
| Delete account with MFA enrolled | **BLOCKED** — treated `needs_second_factor` as wrong password | Fixed |
| Avatar / KYC / listing upload on Coolify | Silent Replit `:1106` if env unset | Loud error log + Coolify docs require `s3` |
| Help menu | Opened Settings (duplicate of Settings item) | `mailto:support@banco.today` |

---

## What was already correct (do not “fix”)

1. **DB role is SoT** — demote guard S4 client (`profile.tsx`) + server (`UserService` `DEMOTE_BLOCKED`).
2. **FI chain** — `?intent=fi` forces bank activity; never dealer onboarding.
3. **`useSocialProviders` fail-closed** — empty Clerk social dict → no fake Google/Apple/Facebook buttons.
4. **Provider tree** — `ClerkProvider` → `ClerkLoadGate` → `AuthGateProvider` → `SessionProvider`.
5. **AuthGate** — guests prompted toward profile tab (sign-in surface).
6. **MFA** — strategy auto-pick + switch + resend (from bancoboom merge).

---

## Bugs fixed this pass

| ID | Severity | Fix |
|----|----------|-----|
| BUG-001 | CRITICAL | `authJustHappenedRef` on email / MFA / reset finalize; heal stuck sessions missing `accountTypeChosen` without racing email signup (`signupInFlightRef`) |
| BUG-002 | HIGH | `settings.verifyAndDelete` accepts `needs_second_factor` as password-verified |
| BUG-003 | HIGH | Object-storage unset → loud console error; Coolify order docs require `OBJECT_STORAGE_PROVIDER=s3` |
| BUG-004 | MEDIUM | `profile.accountSetupRetryTitle/Message` en+ar i18n |
| BUG-005 | MEDIUM | Register `business/banks`, `verification`, `analytics`, `rfq-inbox` in `_layout.tsx` |
| BUG-006 | MEDIUM | `app.config.ts` prefers `EXPO_PUBLIC_PUBLIC_APP_URL` before `replit.com` |
| BUG-007 | LOW | Help → mailto support |
| DOC | — | Clerk proxy middleware no longer claims “no external Clerk dashboard” (Replit lie) |

---

## Replit pollution still present (not deleted — Coolify-safe if ignored)

| Artifact | Risk if used on Coolify |
|----------|-------------------------|
| `.replit`, `start-dev.sh` requiring `REPLIT_*` | Dev scripts only — do not use for Coolify boot |
| `OBJECT_STORAGE_PROVIDER` default `replit` | **Must set `s3` in Coolify secrets** |
| `build.js` Replit domain helpers | Only when Replit env vars set |
| `.replit-artifact/` folders | Platform metadata — unused by Coolify compose |
| CORS trusts `REPLIT_DOMAINS` when set | **Never set `REPLIT_*` on Coolify** |

Deploy path of record: `docker-compose.coolify.yml` + `deploy/coolify/COOLIFY-DEPLOY-ORDER.md`.

---

## Living proof

```bash
cd artifacts/banco-mobile
node --test tests/accounts-clerk-journey.test.mjs
node --test tests/scale-readiness.test.mjs
```

Expected: all accounts-clerk tests PASS; scale-readiness remains 8/8 PASS.

---

## Account-type matrix (production contract)

| Type | How chosen | Next step |
|------|------------|-----------|
| `individual` | Email personal, or picker | Profile home |
| `dealer` | Email business, or picker | `/business/onboarding` |
| `company` | Picker / manage account type | `/business/onboarding` |
| `financial_institution` | Picker / banks CTA | `/business/onboarding?intent=fi` → `/business/banks` |

Self-demote FI/company → individual is **blocked** (client alert + server 403).

---

## Residual risks (ops, not code)

1. Clerk Dashboard must enable the social providers you want; app correctly hides buttons when empty.
2. Coolify **must** set `OBJECT_STORAGE_PROVIDER=s3` + keys or media breaks.
3. EAS production should set `EXPO_PUBLIC_ROUTER_ORIGIN=https://banco.today` (or your live host).
4. Manual device QA still recommended for: Google/Apple/Facebook (when enabled), MFA totp+email, FI onboarding, delete-account with MFA.
