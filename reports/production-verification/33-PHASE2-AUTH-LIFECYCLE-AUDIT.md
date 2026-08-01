# PHASE 2 — AUTH LIFECYCLE AUDIT (READ-ONLY)

**SoT repository:** `waelzaid66-max/banco-with-wael`  
**Audit tip:** `3ef1b44` (docs commit atop inventoried tip `2340c97`)  
**Baseline:** `reports/production-verification/32-PHASE1-PRODUCTION-INVENTORY.md` §7 Authentication  
**Rule:** Repository evidence only. **No fixes. No feature code.** Live Clerk Dashboard / Coolify / EAS behavior = **OPS-dependent** or **UNVERIFIED live** unless proven in source.

### Classification legend

| Label | Meaning |
|-------|---------|
| **complete** | Wired end-to-end in code for that surface |
| **partial** | Present but incomplete coverage across surfaces or steps |
| **disconnected** | Code exists on one side without matching consumer/wiring |
| **missing** | No implementation found where a lifecycle was expected |
| **deferred** | Explicitly postponed / soft-launch residual in docs/code |
| **OPS-dependent** | Correctness requires live Clerk tenant / env / deploy config |

---

## Executive matrix

| # | Lifecycle | Classification | Surfaces with implementation |
|---|-----------|----------------|------------------------------|
| 1 | Registration / Sign-up | **complete** (+ OPS-dependent tenant) | mobile, banco-website, banco-web (FROZEN twin), admin-os, dealer-os |
| 2 | Login / Sign-in | **complete** (+ OPS-dependent MFA on hosted UIs) | same as #1 |
| 3 | Logout | **complete** | mobile, website, web, admin, dealer |
| 4 | Session refresh / token cache | **partial** | mobile SecureStore; web/SPA Clerk cookies; API JWT; ACCOUNT_DELETED handler **mobile-only** |
| 5 | Forgot password / recovery | **partial** / **OPS-dependent** | mobile custom; web/admin/dealer via Clerk `<SignIn>` (no custom code) |
| 6 | Email / phone verification | **partial** | email verify on mobile signup + settings; phone collect ≠ verify; hosted UIs OPS |
| 7 | MFA / second factor | **partial** / **OPS-dependent** | mobile custom MFA UI; hosted UIs if Dashboard enabled; biometric = app lock ≠ MFA |
| 8 | Account delete / recovery | **partial** | API + OpenAPI + mobile settings; **no** web/admin/dealer delete UI; **no** undelete API |
| 9 | AuthGate / protected routes | **complete** (mobile soft-gate intentional) | all auth surfaces; landing has no auth |
| 10 | Facebook / social OAuth | **OPS-dependent** | mobile SSO code + fail-closed provider probe; hosted UIs mirror Dashboard |
| 11 | Android / iOS / Web / API diffs | **partial** (documented dual paths) | see §11 |

**Landing** (`artifacts/landing`): no ClerkProvider / sign-in — CTA hops only. Not an auth surface.

---

## 1. Registration / Sign-up

| Field | Finding |
|-------|---------|
| **Coverage** | **Mobile:** custom `useSignUp` email+password in profile tab. **banco-website / banco-web:** Clerk `<SignUp routing="path">` via `ClerkAuthPage`. **admin-os / dealer-os:** Vite `<SignUp>` routes. **API:** first-touch `getOrCreateUser` on `/me` (and related). **Landing:** none. |
| **Broken / disconnected** | Dual UX path (custom mobile vs Clerk-hosted web/SPA) — not a wiring break; same Clerk tenant expected. Landing `DomainRouter` still absolute-hops to `banco.today/dealer-os/` and `/banco-mobile/` while Coolify PATHS use `/market/` + consumer web — **path dualism** (Phase 1 already noted). |
| **Missing runtime / validation / telemetry** | Live social/email strategy set is Dashboard OPS. No app-owned signup analytics beyond Clerk. |
| **Classification** | **complete** (code) / **OPS-dependent** (tenant strategies, publishable keys) |
| **Evidence** | `artifacts/banco-mobile/app/(tabs)/profile.tsx` (`handleSignUp`, `signUp.password`); `artifacts/banco-website/components/ClerkAuthPage.tsx`; `artifacts/banco-website/app/sign-up/[[...sign-up]]/page.tsx` (+ `en/`); twin under `banco-web/`; `artifacts/admin-os/src/App.tsx` `SignUpPage`; `artifacts/dealer-os/src/App.tsx` `SignUpPage`; `artifacts/api-server/src/services/UserService.ts` `getOrCreateUser`; `artifacts/landing/src/App.tsx` `DomainRouter` |
| **Hypothesis** | *(none beyond Phase 1 path dualism)* Landing absolute Clerk-origin hops may 404 or miss Coolify map if `/dealer-os` / `/banco-mobile` are not still aliased — **hypothesis** pending live nginx proof. |

---

## 2. Login / Sign-in

| Field | Finding |
|-------|---------|
| **Coverage** | **Mobile:** `useSignIn` password + MFA + `needs_new_password` branches. **Web twins:** `<SignIn>`. **Admin/dealer:** `<SignIn>` + post-auth role guards. **API:** `@clerk/express` `clerkMiddleware` + `requireAuth`. |
| **Broken / disconnected** | None proven. Mobile comments document prior silent-drop of `needs_second_factor` — **fixed in code** (still OPS whether MFA enrolled). |
| **Missing** | Hosted SignIn forgot/MFA UX not customized in repo — Clerk default. |
| **Classification** | **complete** / MFA outcome **OPS-dependent** |
| **Evidence** | `profile.tsx` `handleSignIn` / `beginSecondFactor`; `ClerkAuthPage.tsx`; `admin-os`/`dealer-os` `App.tsx`; `api-server/src/app.ts` `clerkMiddleware`; `middlewares/authGuard.ts` |
| **Hypothesis** | — |

---

## 3. Logout

| Field | Finding |
|-------|---------|
| **Coverage** | **Mobile:** menu `signOut` after `unregisterCachedPushTokenBestEffort`. **Website/web:** Clerk `UserButton afterSignOutUrl`. **Dealer:** `useClerk().signOut({ redirectUrl: "/" })`. **Admin:** `UserButton`. |
| **Broken / disconnected** | None proven. |
| **Missing** | Web SPAs do not call `setAuthFailureHandler` (logout on tombstone) — see §4. Push unregister is mobile-only (expected). |
| **Classification** | **complete** |
| **Evidence** | `profile.tsx` signout menu; `lib/unregisterPushBestEffort.ts`; `SiteAuthControls.tsx`; `dealer-os/.../sidebar-layout.tsx`; `admin-os/.../admin-layout.tsx` |
| **Hypothesis** | — |

---

## 4. Session refresh / token cache

| Field | Finding |
|-------|---------|
| **Coverage** | **Mobile native:** `ClerkProvider tokenCache={tokenCache}` from `@clerk/expo/token-cache` → **expo-secure-store** (`AFTER_FIRST_UNLOCK`); `tokenCache` is `undefined` on non-native (Expo web). **AuthTokenBridge** `getToken` → `setAuthTokenGetter`. **Query cache cleared on `userId` change.** **Web Next:** Clerk cookies/session via `ClerkProvider` + middleware; `AuthTokenBridgeInner` sets bearer for API client. **Vite SPAs:** Clerk listener clears React Query on identity change. **API:** JWT via `getAuth`. **Proxy:** `/api/__clerk` production-only when `CLERK_SECRET_KEY` set. |
| **Broken / disconnected** | `setAuthFailureHandler` for `ACCOUNT_DELETED` wired **only** in mobile `_layout.tsx`. Shared client (`custom-fetch.ts`) supports it; **website / web / admin / dealer never register a handler** — lingering Clerk session after soft-delete can keep calling API until manual sign-out. |
| **Missing** | No custom refresh-token code (Clerk-managed). Live cookie domain / SameSite **OPS**. |
| **Classification** | **partial** (tombstone auto-signout mobile-only) |
| **Evidence** | `banco-mobile/app/_layout.tsx`; `@clerk/expo/dist/token-cache/index.js` (SecureStore; native-only); `ClerkAppProvider.tsx`; `admin-os`/`dealer-os` `ClerkQueryClientCacheInvalidator`; `clerkProxyMiddleware.ts`; `lib/api-client-react/src/custom-fetch.ts` |
| **Hypothesis** | Web signed-in users with tombstoned DB rows see repeated 401 `ACCOUNT_DELETED` until UserButton sign-out — **hypothesis** from missing handler wiring (no live repro in this pass). |

---

## 5. Forgot password / recovery

| Field | Finding |
|-------|---------|
| **Coverage** | **Mobile:** custom `resetPasswordEmailCode` (`sendCode` / `verifyCode` / `submitPassword`, `signOutOfOtherSessions: true`) + UI step `"reset"` and forgot button. **Website / web / admin / dealer:** no custom reset screens — rely on Clerk-hosted `<SignIn>` built-in recovery (Dashboard email templates). |
| **Broken / disconnected** | None in mobile wiring. Web custom absence ≠ disconnect if Clerk component includes reset (standard Clerk). |
| **Missing** | Phone-based password reset not implemented on mobile (email only — commented in profile). Account **undelete** after soft-delete: **missing** (see §8). |
| **Classification** | **partial** (mobile explicit; web **OPS-dependent** hosted) |
| **Evidence** | `profile.tsx` forgot / reset handlers (~605–637, testID `forgot-password`); no `forgot`/`resetPassword` strings under `banco-website`/`banco-web` app code beyond SignIn mount |
| **Hypothesis** | — |

---

## 6. Email / phone verification

| Field | Finding |
|-------|---------|
| **Coverage** | **Mobile signup:** `signUp.verifications.sendEmailCode` → `verifyEmailCode`. **Settings:** email change creates/verifies Clerk email then promotes primary. **Phone:** collected on signup / profile drafts; MFA can use `phone_code` if enrolled — **no** signup `verifyPhone` path found. **Web/SPA:** Clerk component verification steps if tenant requires them. **Business KYC** (`business/verification.tsx`) is seller verification UX, not Clerk email OTP. |
| **Broken / disconnected** | Phone field ≠ verified identity in code. |
| **Missing** | Dedicated phone verification lifecycle for signup. Live email delivery = Resend/Clerk OPS. |
| **Classification** | **partial** |
| **Evidence** | `profile.tsx` `handleSignUp`/`handleVerify`; `settings.tsx` email modal; `business/verification.tsx`; Phase 1 KYC note |
| **Hypothesis** | — |

---

## 7. MFA / second factor

| Field | Finding |
|-------|---------|
| **Coverage** | **Mobile:** full state machine (`needs_second_factor`, TOTP / email_code / phone_code / backup_code, switch method). Comments state live tenant uses email_code after password. **Web/admin/dealer:** Clerk hosted components — MFA UI appears only if Dashboard MFA enabled. **BiometricProvider:** optional **app unlock** after session exists — not Clerk second factor. |
| **Broken / disconnected** | None in mobile code. Enrollment UX for TOTP not audited as a first-class settings screen in this pass (insufficient evidence of enroll UI beyond verify). |
| **Missing** | Insufficient evidence of in-app MFA enrollment management UI on mobile beyond challenge during sign-in. |
| **Classification** | **partial** (challenge complete on mobile) / **OPS-dependent** (enrollment & hosted) |
| **Evidence** | `profile.tsx` `MFA_PRIORITY`, `selectSecondFactor`, `handleMfaVerify`; `BiometricContext.tsx`; clerkProxy header comment (MFA managed in Dashboard) |
| **Hypothesis** | — |

---

## 8. Account delete / recovery

| Field | Finding |
|-------|---------|
| **Coverage** | **API:** `DELETE /api/v1/users/me` → soft-delete + PII wipe + best-effort `clerkClient.users.deleteUser`; OpenAPI `operationId: deleteAccount`; generated client `deleteAccount()`. **Mobile:** `settings.tsx` + `DeleteAccountModal` (biometrics / keyword / password re-verify). **Auth guards:** tombstone → 401 `ACCOUNT_DELETED`. |
| **Broken / disconnected** | **No** `deleteAccount` usage under banco-website, banco-web, admin-os, dealer-os — API exists, consumer web/SPA UIs **missing**. Soft-delete is durable; Clerk delete failure still returns success (logged) — clients must sign out (mobile does). |
| **Missing** | Undelete / recovery API or ops tool in repo. Web self-serve delete (Play/App Store compliance is mobile-driven). |
| **Classification** | **partial** |
| **Evidence** | `routes/v1/users.ts`; `UserService.deleteAccount`; `openapi.yaml` `/v1/users/me` delete; `lib/api-client-react` generated `deleteAccount`; `settings.tsx` `handleDelete`/`verifyAndDelete`; grep absence on web/admin/dealer |
| **Hypothesis** | Clerk orphan users after failed provider delete need ops cleanup — documented in service log path, not a client bug. |

---

## 9. AuthGate / protected routes

| Surface | Mechanism | Classification |
|---------|-----------|----------------|
| **banco-mobile** | `AuthGateProvider.requireAuth` → modal → profile (no layout hard Redirect). Tabs browse signed-out; unread query gated by `isSignedIn`. | **complete** (intentional soft-gate) |
| **banco-website** | `middleware.ts` `createRouteMatcher` `/workspace(.*)` `/saved(.*)` (+ `/en/...`); `auth.protect()`; fail-closed 503 if no publishable key in prod on protected routes; plug gate before Clerk. | **complete** |
| **banco-web** | Same middleware pattern (twin / FROZEN). | **complete** (frozen dual deploy) |
| **admin-os** | `Show signed-out` → `/sign-in`; `AdminGuard` requires `me.is_admin`. | **complete** |
| **dealer-os** | `Show` + `RoleGuard` on dealer/company/enterprise; else self-serve onboarding via `updateMe`. Legal pages decoupled from Clerk key throw. | **complete** |
| **landing** | No auth. | **N/A** |
| **API** | `requireAuth` / `optionalAuth` / `requireDbUser` / `requireDealerRole` / `requireAdminRole` / `requirePermission`. | **complete** |

| Field | Finding |
|-------|---------|
| **Broken / disconnected** | Dual consumer web (`banco-website` canonical + `banco-web` FROZEN still composed) — auth twin, cutover **OPS/owner** (Phase 1 B-07). |
| **Evidence** | `useAuthGate.tsx`; `(tabs)/_layout.tsx`; `banco-website/middleware.ts`; `admin-os`/`dealer-os` `App.tsx`; `authGuard.ts`; `banco-web/FROZEN.md` |
| **Hypothesis** | — |

---

## 10. Facebook / social OAuth

| Field | Finding |
|-------|---------|
| **Coverage** | **Mobile:** `useSSO` + `startSSOFlow` for `oauth_google` / `oauth_facebook` / `oauth_apple`; buttons gated by `useSocialProviders()` fetching Clerk public `environment` social map — **fail closed** (empty list if offline/miskey). Source comment: production tenant historically empty social dict. **Web/SPA:** Clerk component social buttons = whatever Dashboard enables (no separate probe). |
| **Broken / disconnected** | Showing buttons without enabled strategies was previously broken; **mitigated** by provider probe. Live emptiness = **OPS**, not missing code. |
| **Missing** | Live confirmation of Dashboard social enablement — out of repo. |
| **Classification** | **OPS-dependent** (code ready) |
| **Evidence** | `hooks/useSocialProviders.ts`; `profile.tsx` `handleOAuth`; `WebBrowser.maybeCompleteAuthSession` |
| **Hypothesis** | If Dashboard later enables Facebook without mobile deep-link / redirect URI allowlist, SSO will fail at runtime — standard Clerk config risk, not proven broken in source. |

---

## 11. Android / iOS / Web / API differences

| Concern | Android / iOS | Expo Web (mobile package) | Next (website/web) | Vite (admin/dealer) | API |
|---------|---------------|---------------------------|--------------------|---------------------|-----|
| Token persistence | SecureStore via `tokenCache` | `tokenCache` undefined (Clerk web storage) | Cookies / Clerk Next | Clerk browser session | Bearer JWT verify |
| Auth UI | Custom profile forms | Same RN UI | `<SignIn>`/`<SignUp>` | Same hosted | N/A |
| AuthGate | Soft modal | Soft modal | Middleware hard protect | Role/admin guards | Middleware guards |
| Delete account | Settings + biometrics/password | Keyword fallback (no LocalAuth) | **No UI** | **No UI** | `DELETE /users/me` |
| ACCOUNT_DELETED auto sign-out | Yes | Yes (same bridge) | **No handler** | **No handler** | Returns 401 |
| Push unregister on logout | Yes | Best-effort if token | N/A | N/A | Token rows scrubbed on delete |
| Biometric app lock | Native | Overlay skipped / limited | N/A | N/A | N/A |
| Clerk FAPI proxy | Optional `EXPO_PUBLIC_CLERK_PROXY_URL` | same | `NEXT_PUBLIC_CLERK_PROXY_URL` | `VITE_CLERK_PROXY_URL` | Serves `/api/__clerk` in prod |
| Admin bootstrap | Via `/me` + `ADMIN_EMAILS` | same | same if calling `/me` | admin UI after promote | `meController` + `adminBootstrap.ts` |

| Field | Finding |
|-------|---------|
| **Classification** | **partial** dual-path / surface asymmetry (delete UI, tombstone handler, landing hops) |
| **Evidence** | token-cache native gate; `DeleteAccountModal` `Platform.OS === "web"`; mobile-only `setAuthFailureHandler`; landing DomainRouter vs Coolify PATHS |
| **Hypothesis** | — |

---

## Cross-cutting inventory (OpenAPI / dual path)

| Item | Evidence | Classification |
|------|----------|----------------|
| Account delete in OpenAPI | `lib/api-spec/openapi.yaml` `/v1/users/me` DELETE | **complete** (no OpenAPI gap for delete) |
| Auth itself not in OpenAPI | Clerk is external IdP | Expected — **N/A** |
| banco-web vs banco-website | Identical auth pages/middleware family; web FROZEN | **deferred** cutover / **OPS-dependent** |
| Admin open sign-up | Anyone can hit `/sign-up`; access needs `is_admin` / `ADMIN_EMAILS` promote | **complete** fail-closed UI (not a hole if env set) — allowlist **OPS-dependent** |
| Dealer open sign-up | Sign-up then RoleGuard / onboarding | **complete** |

---

## Speculative findings cap (≤3)

1. **Landing absolute hops** (`/dealer-os`, `/banco-mobile`) vs Coolify `/market` — possible auth-origin mismatch (**hypothesis**, Phase 1 residual).  
2. **Web missing ACCOUNT_DELETED handler** — stuck Clerk session after delete (**hypothesis** from wiring asymmetry).  
3. **Social OAuth** live enablement — code fail-closed; empty tenant = no buttons (**OPS**, not invented bug).

No additional speculative “bugs” asserted.

---

## Phase 2 → later phases (not executed)

| Need | Why |
|------|-----|
| Live Clerk Dashboard export (strategies, MFA, OAuth, email templates) | Classify OPS items |
| Coolify nginx alias proof for `/dealer-os` → `/market` | Resolve landing hop hypothesis |
| Device QA: SecureStore, MFA email_code, delete → sign-out | Runtime |
| Owner cutover banco-web → website | Dual consumer auth |

**End of Phase 2 auth lifecycle audit — no code changes.**
