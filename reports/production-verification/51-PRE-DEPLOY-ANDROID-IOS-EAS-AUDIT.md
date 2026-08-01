# 51 — Pre-deploy hard audit: CI re-run + Android/iOS/EAS + residual risks

**Date:** 2026-07-30  
**SoT tip:** `46d3831` (+ this branch hardening)  
**Policy:** Verify facts; repair only verified future-break risks; no architecture rewrite.

---

## 1. GitHub CI re-run (verified)

| Run | Trigger | Result |
|-----|---------|--------|
| [30533857723](https://github.com/waelzaid66-max/banco-with-wael/actions/runs/30533857723) | push merge PR#3 | **success** (6/6) |
| [30534204315](https://github.com/waelzaid66-max/banco-with-wael/actions/runs/30534204315) | `workflow_dispatch` re-run | **success** (6/6) |

Jobs green both times: Typecheck & build · ESLint · API tests · Mobile regression · GCP gate · Production gates.  
Deno workflow: **absent** on tip (removed in PR#3).

Local mobile pack: `pnpm --filter @workspace/banco-mobile run test` → **pass** (icons/lib/resilience/universal-links/session/section/i18n).

---

## 2. Env merge (documentation accuracy)

| Gap found | Fix |
|-----------|-----|
| `DEPLOY_COOLIFY.md` claimed `OBJECT_STORAGE_PROVIDER` default `replit` | Corrected — compose default is empty; Coolify must set `s3` |
| Docs said API healthcheck `/api/healthz` | Corrected to `/api/readyz` (matches compose) |
| Root `.env.example` omitted Coolify-critical names | Added POSTGRES/S3/CORS/PUBLIC_*/BANCO_*_URL/EAS bake list |
| `EAS_BUILD.md` understated required store envs + AASA blockers | Expanded with API base, PUBLIC_APP_URL, well-known blockers |

---

## 3. Android / Apple / EAS — verified future risks

### Ready in repo (facts)

| Item | Evidence |
|------|----------|
| Package / bundle | `com.bancooom.app` |
| Android targetSdk/compileSdk | **35** via `expo-build-properties` |
| EAS production | AAB + `autoIncrement`; iOS `autoIncrement` |
| Icons / splash assets | Present under `assets/images/` |
| EAS projectId | `45f092c8-52f9-4272-880f-48e6b721126f` |
| Fatal guard if API env missing | `_layout.tsx` production FATAL log |

### CRITICAL — will break store / links if ignored

| ID | Risk | Evidence | Owner action |
|----|------|----------|--------------|
| M1 | EAS production env empty in `eas.json` | No `env` block — secrets must be in EAS dashboard | Set `EXPO_PUBLIC_DOMAIN` or `API_BASE_URL`, Clerk pk, `PUBLIC_APP_URL`, `ROUTER_ORIGIN` |
| M2 | No hosted AASA / assetlinks | `banco.today/.well-known/*` → **404**; not in nginx | Publish `.well-known` after DNS→Coolify (needs Apple Team ID + Android SHA256) |
| M3 | DNS not Coolify | `banco.today` = Replit “isn't live yet” | Point DNS to VPS |

### HIGH — App Store / Play rejection or policy mismatch

| ID | Risk | Fix this turn? |
|----|------|----------------|
| M4 | Missing `NSFaceIDUsageDescription` while Face ID used | **YES** — added to `app.json` |
| M5 | `PLAY_STORE_DATA_SAFETY.md` contradicted code (location/camera/privacy URL) | **YES** — corrected to `/market/privacy`, location + camera honesty |
| M6 | `usesAppleSignIn: true` without `expo-apple-authentication` package | **Document only** — Clerk uses `oauth_apple` SSO; native SIWA plugin not installed. Confirm Clerk dashboard Apple provider before store |
| M7 | No `google-services.json` / `GoogleService-Info.plist` | **OPS** — Expo push via EAS projectId; configure FCM/APNs in EAS credentials |

### MEDIUM — deep-link config trap

| ID | Risk |
|----|------|
| M8 | When `EXPO_PUBLIC_PUBLIC_APP_URL` is set, `app.config.ts` **replaces** static `associatedDomains` / `intentFilters` (drops `banco.deals` / `banco.autos`, adds pathPrefix `/l` `/listing`). Choose one link strategy before store bake. |
| M9 | Empty app-level `privacyManifests.NSPrivacyAccessedAPITypes`; deps ship their own PrivacyInfo — monitor App Store privacy questionnaire |
| M10 | P2-M7b: landing still hops to `/banco-mobile/` which nginx does not serve — residual until owner A/B |

---

## 4. Coolify OPS blockers (unchanged — cannot code away)

B1 DNS · B2 www · B3 secrets · B4 migrate · B5 smoke `37-*` · B6 Paymob/P2-H1 · B7 banco-web cutover

---

## 5. Files modified this turn

| File | Why |
|------|-----|
| `artifacts/banco-mobile/app.json` | Add `NSFaceIDUsageDescription` (Face ID used in BiometricContext + DeleteAccountModal) |
| `artifacts/banco-mobile/PLAY_STORE_DATA_SAFETY.md` | Align Data Safety with real permissions + Coolify `/market/privacy` |
| `docs/DEPLOY_COOLIFY.md` | Fix storage default + readyz healthcheck accuracy |
| `.env.example` | Merge Coolify + EAS critical var names |
| `release/EAS_BUILD.md` | Store env requirements + well-known blockers |

---

## 6. Certification

| Scope | Result | Confidence |
|-------|--------|------------|
| GitHub CI on `main` @ `46d3831` | **PASS** (2 consecutive green runs) | **100%** |
| Repo Coolify deploy artifacts | **READY** | **100%** |
| Android/iOS **binary config** after Face ID fix | **READY for EAS build** (after EAS env set) | **95%** |
| Android/iOS **store submission** | **NOT READY** — M1–M3, AASA/assetlinks, DNS | — |
| Full live production | **NOT CERTIFIED** — OPS B1–B5 | — |

**Do not claim FULL PRODUCTION.** Coolify can be deployed when OPS clears B1–B5. Store builds require EAS env + well-known files + live DNS.

**Next owner steps (order):**  
1) Coolify secrets + migrate + DNS → smoke `37-*`  
2) Host AASA + assetlinks on apex  
3) Set EAS production env → `eas build --profile production` Android then iOS  
4) Play Data Safety form from updated `PLAY_STORE_DATA_SAFETY.md`
