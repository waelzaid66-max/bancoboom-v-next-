# 52 — MOBILE-FIRST PRINCIPAL AUDIT (Expo / Native)

**Authority:** Principal Native Engineer — BANCO mobile is the primary product.  
**SoT:** `waelzaid66-max/banco-with-wael` @ `61072b2` (+ this commit)  
**Policy:** Verified facts only. No invent. No architecture rewrite. Cross-repo search completed.  
**Date:** 2026-07-30

---

## 0. Mission statement (locked)

Every prior repair (API, Coolify, Clerk, nginx, CI, Paymob hardening, tombstones) exists to serve **one** consumer: the Expo app in `artifacts/banco-mobile`.  
A “green Coolify” without a working production mobile binary is **not** product success.

---

## 1. Executive verdict

| Layer | Verdict |
|-------|---------|
| **SoT mobile code completeness vs all sister repos** | **SoT is a SUPERSET** — nothing critical missing from peers |
| **Static gates (typecheck + full mobile test pack)** | **PASS** — see §6 |
| **EAS-ready binary (after env bake)** | **CONDITIONAL** — code ready; EAS dashboard envs required |
| **Store submission (Play / App Store)** | **NOT READY** — AASA/assetlinks 404 + DNS dead + EAS env |
| **Real end-user production experience on device** | **NOT CERTIFIED** — API host + Clerk live + deep links + payments |

**Confidence in this audit’s facts:** **100%** (every claim has path/probe evidence).  
**Confidence that a user can complete a full production journey today:** **0%** until OPS §8 cleared.

---

## 2. Cross-repository search (7 clones)

| Repo | Mobile tree | Files | Bundle / package | Face ID plist | vs SoT |
|------|-------------|-------|------------------|---------------|--------|
| **banco-with-wael (SoT)** | yes | **194** | `com.bancooom.app` | **yes** | canonical |
| bancoo | yes | 186 | `com.bancoboom.app` | no | older / thinner |
| bancoboom | yes | 188 | `com.bancoboom.app` | no | older |
| bancotoday | yes | 180 | `com.bancooom.app` | no | slug=`bancoboom` |
| -BANCO-CA-OOM- | yes | 180 | `com.bancooom.app` | no | thinner |
| bancostormainvirgen | yes | 186 | `com.bancoboom.app` | no | older |
| bancostormain | **no mobile** | 0 | — | — | empty |

### 2.1 Missing from SoT that exists elsewhere?

**Zero files.** Every peer path is either also in SoT or SoT has a hardened replacement.

### 2.2 SoT-only advances (peers lack)

- `lib/pushTokenCache.ts`, `lib/unregisterPushBestEffort.ts`
- tests: `accounts-clerk-journey`, `notification-routing`, `scale-readiness`
- `NSFaceIDUsageDescription`
- Push mute / unregister-before-signOut / tap dedupe
- `ACCOUNT_DELETED` → `signOut` + RQ cache clear on identity change
- Play Data Safety aligned to `/market/privacy`
- Android+iOS `autoIncrement` in `eas.json` (CA-OOM/bancotoday: iOS-only)

### 2.3 Identity fork risk (HIGH ops awareness)

| ID | Risk |
|----|------|
| I1 | Sister repos still use **`com.bancoboom.app`**. SoT canonical is **`com.bancooom.app`**. If any live store listing already ships under `bancoboom`, do **not** blindly overwrite — confirm Play/App Store console identity before EAS production submit. EAS `projectId` is shared (`45f092c8-…126f`) across clones. |

### 2.4 Well-known / Firebase assets across ALL clones

**Absent everywhere:** `apple-app-site-association`, `assetlinks.json`, `google-services.json`, `GoogleService-Info.plist`.  
Not a “SoT forgot a file from bancoo” gap — **nobody has them**. Must be created for production host after DNS→Coolify (needs Apple Team ID + Android signing cert SHA-256).

---

## 3. SoT mobile architecture (what the product actually is)

| Surface | Status in code |
|---------|----------------|
| Identity | `BANCO` · scheme `bancooom` · `com.bancooom.app` · EAS project wired |
| Auth | Clerk email/OTP/MFA; SSO gated by `useSocialProviders` (tenant currently email-first) |
| API | `@workspace/api-client-react` + base URL from `EXPO_PUBLIC_*` |
| Feed / search / sections | Implemented + search-contract |
| Create / edit listings | Multi-step + uploads |
| Chat | Polling 3–8s (no socket) |
| Saves / session | Optimistic + API |
| Plans / wallet | UI → Paymob WebBrowser checkout (live Paymob ops-deferred) |
| Banks / FI | Hub + inbox (ads-first honesty) |
| Biometric | Unlock + delete confirm |
| Push | Expo tokens + EAS projectId; silent degrade |
| Delete account | API + biometric/password + push unregister |
| i18n | EN/AR structural parity |

---

## 4. Ranked blockers for a REAL complete mobile user

### CRITICAL (blocks production device success)

| # | Blocker | Evidence | Owner |
|---|---------|----------|-------|
| C1 | EAS bake: `EXPO_PUBLIC_DOMAIN` **or** `EXPO_PUBLIC_API_BASE_URL` | `_layout.tsx` FATAL; relative `/api` fails | EAS dashboard production env |
| C2 | EAS bake: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…`) | Empty key → signed-out guest after 2.5s | EAS + Clerk live keys |
| C3 | Production API reachable over HTTPS | Live `banco.today/api/readyz` → **404** (Replit placeholder) | Coolify DNS + migrate + secrets |
| C4 | Universal / App Links cannot verify | `banco.today/.well-known/aasa` & `assetlinks` → **404**; `banco.autos` → **503** | Host well-known after DNS |
| C5 | `eas.json` has **no** `env` block | Secrets must live in EAS Environment | Confirm dashboard before build |

### HIGH (breaks journeys or store)

| # | Blocker | Evidence |
|---|---------|----------|
| H1 | Share / router origin | Need `EXPO_PUBLIC_PUBLIC_APP_URL` + `EXPO_PUBLIC_ROUTER_ORIGIN` or defaults → `replit.com` |
| H2 | `app.config.ts` overwrites multi-host links when webHost set | Drops `banco.deals` / `banco.autos`; narrows Android pathPrefix |
| H3 | Paymob live deferred | Plans/wallet expect `checkout_url`; money path ops-blocked |
| H4 | Clerk SSO empty by tenant design | Google/Apple buttons gated; email/OTP must be bulletproof on device |
| H5 | Runtime packages mostly in `devDependencies` | Expo/RN/Clerk in `devDependencies` — EAS footgun if prod-only install ever used |
| H6 | No device/E2E | CI is static source guards; does not replace a real device smoke |

### MEDIUM (quality / future breakage)

| # | Item |
|---|------|
| M1 | Maps WebView depends on unpkg CDN |
| M2 | No NetInfo / offline UX layer |
| M3 | Crash logs console-only (no Sentry) |
| M4 | Notification icon is landscape color logo (Android glyph quality) |
| M5 | Chat poll-only under latency |
| M6 | `usesAppleSignIn: true` without `expo-apple-authentication` (Clerk OAuth path) |
| M7 | Landing `/banco-mobile/` hop (P2-M7b) — web side, affects web→app funnel |

### FIXED THIS TURN (mobile CI completeness)

| Fix | Why |
|-----|-----|
| Wire orphan tests into `package.json` `test` | `accounts-clerk-journey`, `notification-routing`, `scale-readiness`, `cdn-readiness` existed but were **not** in CI default pack |

---

## 5. Live host probes (agent egress, 2026-07-30)

| URL | Result |
|-----|--------|
| `https://banco.today/` | **404** |
| `https://banco.today/api/readyz` | **404** |
| `https://banco.today/.well-known/apple-app-site-association` | **404** |
| `https://banco.today/.well-known/assetlinks.json` | **404** |
| `https://banco.today/l/test` | **404** |
| `https://banco.deals/.well-known/...` | **404** |
| `https://banco.autos/` | **503** |

**Conclusion:** No production API or deep-link verification surface exists on public DNS today. A store build pointed at these hosts cannot deliver a complete user experience.

---

## 6. Verification matrix (executed this audit)

| Check | Result |
|-------|--------|
| `pnpm --filter @workspace/banco-mobile run typecheck` | **PASS** |
| Full mobile `test` pack (icons→cdn) | **PASS** — **148** tests (6+30+11+3+15+56+1+13+2+8+3) |
| Orphan suites individually | **PASS** (13+2+8+3) |
| `chain-integrity-gate.mjs` | **167/167** |
| `production-confidence-check.mjs --skip-typecheck` | **12/12** |
| Cross-repo missing-file search | **0 SoT gaps** |
| Live deep-link / API probes | **ALL FAIL** (ops) |

---

## 7. What “complete mobile success” requires (ordered)

### Phase A — Backend for the phone (Coolify)
1. DNS `banco.today` → Coolify nginx  
2. Secrets: Clerk **live**, S3 keys, session, payment encryption  
3. `migrate` profile  
4. Smoke `37-*` until `/api/readyz` returns BANCO JSON (`money_schema=ok`)

### Phase B — Deep links for the phone
1. Publish `/.well-known/apple-app-site-association` (Team ID + `com.bancooom.app`)  
2. Publish `/.well-known/assetlinks.json` (SHA-256 of Play signing cert)  
3. Decide single-host vs multi-host strategy **before** baking `EXPO_PUBLIC_PUBLIC_APP_URL` (H2)

### Phase C — EAS production binary
```bash
# EAS dashboard production env MUST include:
# EXPO_PUBLIC_DOMAIN=banco.today   # or EXPO_PUBLIC_API_BASE_URL=https://banco.today
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
# EXPO_PUBLIC_PUBLIC_APP_URL=https://banco.today
# EXPO_PUBLIC_ROUTER_ORIGIN=https://banco.today

cd artifacts/banco-mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Phase D — Device smoke (not optional)
On a real Android + real iPhone:
1. Cold start → feed loads  
2. Email signup / OTP / MFA  
3. Create listing + photo  
4. Save / unsave  
5. Chat send/receive  
6. Push (foreground + cold tap)  
7. Biometric lock  
8. Delete account path (staging account)  
9. Universal link `https://banco.today/l/<id>` opens app  
10. Custom scheme `bancooom://listing/<id>`

### Phase E — Store
1. Play Data Safety from updated `PLAY_STORE_DATA_SAFETY.md`  
2. Confirm package id `com.bancooom.app` (I1)  
3. Privacy URL `https://banco.today/market/privacy`  
4. Submit AAB + iOS after Phase D green

---

## 8. Honest certification

| Question | Answer |
|----------|--------|
| Is SoT the strongest mobile tree among all clones? | **YES** |
| Is anything small missing from another repo? | **NO critical; SoT ahead** |
| Can we certify FULL mobile production today? | **NO** |
| Why? | Public API/DNS dead; no AASA/assetlinks; EAS envs not proven; no device E2E; Paymob live deferred |
| What we strengthened this turn | Mobile CI now runs **all** static journey guards (148 tests) |

---

## 9. Non-negotiable rule going forward

> Do not declare BANCO production complete until Phase D device smoke is green on Android **and** iOS against a live Coolify API with verified App/Universal Links.

Coolify green without phone green = incomplete product.

---

**Report owner tip for next agent:** Resume at Phase A with a public `readyz` URL; then Phase B well-known; then EAS bake; then Phase D checklist. Do not invent AASA/assetlinks without Apple Team ID + Play cert fingerprints from the owner.
