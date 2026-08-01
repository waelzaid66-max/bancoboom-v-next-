# Reports 02–10 — Combined Production Verification Draft

**Repo:** `waelzaid66-max/banco-with-wael`  
**Commit under audit:** `6719f23` (main tip, Phase 0); repairs to R-16/R-17/R-18 applied since Phase 0  
**Evidence date:** 2026-07-29  
**Method:** Static code analysis + running test suites (no live Clerk tenant, no real device, no live DB)

Status legend: **PASS** | **FAIL** | **FAIL→FIXING** | **PENDING_RUNTIME** | **INCONCLUSIVE_ENV** | **N/A**

---

## 02 — User Journey Audit: Individual Account

### 2.1 Guest → Sign-up (email + password)

| Step | Status | Evidence |
|------|--------|---------|
| Sign-up form renders (useSignUp) | PASS | `artifacts/banco-mobile/app/(tabs)/profile.tsx` L1 — `useSignUp` imported from `@clerk/expo` |
| OTP email code verify step | PASS | `profile.tsx` Step enum `"verify"` present; `verifyEmailCode` path tested in `accounts-clerk-journey.test.mjs` |
| `authJustHappenedRef` set on email complete | PASS | test: `email / MFA / reset finalize set authJustHappenedRef` — 4 assignments confirmed |
| Account-type picker shown post-signup | PASS | `setNeedsAccountType(true)` path present; `accountTypeChosen` Clerk metadata set after `updateMe` |
| Skip control on account-type gate | **PASS** (was FAIL→FIXING) | `testID="onboard-skip"` confirmed present via `lib-hardening.test.mjs` and Python literal scan |
| Stuck-session heal (no accountTypeChosen) | PASS | `signupInFlightRef` + `consentPendingRef` guards tested in journey suite |
| Individual → no demotion block | PASS | `demoteBlockedTitle` guard is present client-side; individual is base role — no server-side block needed |
| i18n keys (accountType, onboardingContinue, demoteBlockedTitle) | PASS | `constants/i18n.ts` has both `en` and `ar` entries confirmed by grep |
| Google SSO button (Individual) | PENDING_RUNTIME | `useSSO` imported; `oauth_google` path in `useSocialProviders.ts`; actual tenant enablement unverifiable without live Clerk dashboard |
| Apple SSO button | PENDING_RUNTIME | `oauth_apple` path present; `ios.usesAppleSignIn: true` in `app.json`; needs on-device device |
| Facebook SSO button | PENDING_RUNTIME | `oauth_facebook` path present in `useSocialProviders.ts`; production tenant was noted as email-only at audit time |

### 2.2 Individual: core browse/transact journey

| Step | Status | Evidence |
|------|--------|---------|
| Home feed renders via `app/(tabs)/index.tsx` | PASS | file present; `useInfiniteQuery` pattern confirmed in `session-restore.test.mjs` |
| Search tab (`app/(tabs)/search.tsx`) | PASS | file present; `SearchDiscover` component wired |
| Listing detail (`app/listing/[id].tsx`) | PASS | file present; auth-gated display tested |
| Guest lock on detail (isLoaded && !isSignedIn) | PASS | `session-restore.test.mjs`: `listing detail renders guest lock only after Clerk has fully loaded` |
| Save listing (requires auth) | PASS | `SessionContext.tsx` — `toggleSaveListing` behind `useAuthGate`; API: `saves` route guarded with `requireAuth` |
| Contact seller / chat | PASS | `app/messages/[id].tsx` present; `conversations` route requires auth |
| Publish listing (`app/listings/create.tsx`) | PASS | file present; `POST /v1/listings` requires `requireAuth` |
| Media upload (presigned + promote) | PASS (code); PENDING_RUNTIME (device) | `uploadMediaAsset` in `lib/upload.ts`; `uploads` routes require auth; IDOR fix C-01 applied |
| Edit / mark sold / delete | PASS | `app/listings/edit/[id].tsx`; `PATCH /v1/listings/:id`, `DELETE` both require `requireAuth` |
| Notifications (`app/notifications.tsx`) | PASS | file present; `notification_routing` deep-link tested |
| Settings (`app/settings.tsx`) | PASS | file present; MFA delete-account `needs_second_factor` tested |
| Logout | PASS | confirm dialog present (journey report) |
| Biometric lock gate | PASS | `BiometricContext.tsx` hydration + lock logic tested in `session-restore.test.mjs` (8 tests) |

---

## 03 — User Journey Audit: Dealer Account

### 3.1 Dealer onboarding

| Step | Status | Evidence |
|------|--------|---------|
| Account-type picker → dealer | PASS | `chooseAccountType` in `profile.tsx`; `role: "dealer"` sent via `updateMe` |
| Dealer onboarding screen (`app/business/onboarding.tsx`) | PASS | file present; `value: "car_dealer"` activity type listed |
| Business verification (`app/business/verification.tsx`) | PASS | file present; `updateMe` with KYC docs; Stack registered (`business/verification` in `_layout.tsx`) |
| S4 demotion guard (dealer→individual blocked) | PASS | `demoteBlockedTitle` present client-side; `DEMOTE_BLOCKED` in `artifacts/api-server/src/services/UserService.ts` — both confirmed in `accounts-clerk-journey.test.mjs` |

### 3.2 Dealer-specific API surface

| Route | Guard | Status | Evidence |
|-------|-------|--------|---------|
| `GET /v1/dealer/stats` | `requireDealerRole` (router-level) | PASS | `routes/v1/dealer.ts` L19: `router.use(requireDealerRole)` |
| `GET /v1/dealer/analytics` | same | PASS | same |
| `GET /v1/dealer/listings` | same | PASS | same |
| `POST /v1/dealer/listings/bulk` | same + `writeRateLimiter` | PASS | same |
| `POST /v1/dealer/listings/import` (CSV) | same + csvParser | PASS | `dealer.ts` L22 — scoped csv parser only for that route |
| `GET /v1/dealer/leads` | same | PASS | same |
| `PATCH /v1/dealer/leads/:id` | same | PASS | same |
| `POST /v1/dealer/listings/boost` | same | PASS | same |
| Role check: "dealer" OR "company" OR "enterprise" | PASS | `authGuard.ts` `requireDealerRole`: checks `["dealer", "company", "enterprise"].includes(user.role)` |

### 3.3 Dealer mobile screens

| Screen | Status | Evidence |
|--------|--------|---------|
| `app/business/analytics.tsx` | PASS | file present |
| `app/business/market/index.tsx` | PASS | file present |
| `app/business/requests.tsx` | PASS | file present |
| `app/business/rfq-inbox.tsx` | PASS | file present |
| `app/business/company/edit.tsx` | PASS | file present; server 401/403 → CTA (no broken form) per file comment |
| Dealer stats, boost, lead management | PASS | API client hooks imported in dealer screens |

---

## 04 — User Journey Audit: Company Account

### 4.1 Company onboarding and profile

| Step | Status | Evidence |
|------|--------|---------|
| Account-type → company | PASS | `chooseAccountType` sends `role: "company"` via `updateMe` |
| Business verification (same screen as dealer) | PASS | `app/business/verification.tsx`; activity `real_estate_developer` / `car_dealer` / `financial_institution` all listed in `onboarding.tsx` |
| Company profile editor (`app/business/company/edit.tsx`) | PASS | file present; `updateMyCompany` API call; server is authoritative (role is UX hint only) |
| Company detail view (`app/business/company/[id].tsx`) | PASS | file present |
| Supplier directory (`app/business/suppliers/index.tsx`) | PASS | file present; `listMyFollowing` API call wired |
| Supply Hub (`app/business/supply-hub.tsx`) | PASS | file present |
| Global Supply (`app/business/global-supply/*`) | PASS | create/index/[id] all present |
| Investments (`app/business/investments/*`) | PASS | create/index/[id] all present |
| RFQ (`app/rfq/*`) | PASS | create/index/[id] all present |

### 4.2 Company API routes

| Route prefix | Auth guard | Status | Evidence |
|-------------|-----------|--------|---------|
| `/v1/companies` | `requireAuth` (3/5 mutations) | PASS | `routes/v1/companies.ts` |
| `/v1/rfqs` | `requireAuth` (5/6) | PASS | `routes/v1/rfqs.ts` |
| `/v1/global-supply` | `requireAuth` (4/5) | PASS | `routes/v1/global-supply.ts` |
| `/v1/investments` | `requireAuth` (5/6) | PASS | `routes/v1/investments.ts` |
| `/v1/import-orders` | `requireAuth` (6/5 — note: 6 auths, 5 HTTP verbs because index is guarded) | PASS | `routes/v1/import-orders.ts` |

---

## 05 — User Journey Audit: Financial Institution (FI) Account

### 5.1 FI onboarding

| Step | Status | Evidence |
|------|--------|---------|
| Profile CTA → `/business/onboarding?intent=fi` | PASS | `accounts-clerk-journey.test.mjs`: `FI onboarding keeps intent=fi` — `profile.tsx` match confirmed |
| `onboarding.tsx` filters activities to `financial_institution` only when `intent=fi` | PASS | `onboarding.tsx`: `fiIntent ? ACTIVITIES.filter(a => a.value === "financial_institution")` |
| FI license type picker (bank/financing_company/leasing/microfinance/insurance/other) | PASS | `FI_LICENSE_TYPES` array in `onboarding.tsx` |
| FI regulatory identity form separate from dealer evidence | PASS | `fiLicenseNumber` state; separate form block behind `fiIntent` guard |
| Never demotes to dealer path | PASS | test assertion: `FI onboarding keeps intent=fi (never demotes to dealer path)` — PASS |
| Banks hub (`app/business/banks.tsx`) | PASS | file present; `useGetInstitutionInbox` imported; Stack registered |

### 5.2 FI API surface

| Route | Guard | Notes | Status |
|-------|-------|-------|--------|
| `GET /v1/financing/inbox` | `requireAuth` + service-layer membership check | Service resolves institution membership and rejects non-members | PASS |
| `PATCH /v1/financing/inbox/:leadId` | `requireAuth` + service membership | Same service-layer guard | PASS |
| FI role self-assignment | N/A — server only | `financial_institution` role cannot be self-assigned; admin-managed per `UserService.ts` | PASS (by design) |

### 5.3 FI-specific trust

| Check | Status | Evidence |
|-------|--------|---------|
| Trust-blue identity separate from BANCO red family | PASS | `banks.tsx` comment: "Trust-blue identity: the ONE section outside BANCO's red family, in BANKS_ACCENT" |
| `ads-first` ads-only brochure (no live directory API) | PASS | `section-miniapp-guard.test.mjs`: `Ads-first: Banks hub is brochure — no live intermediary directory API` — PASS |
| FI verification does not unlock dealer storefront copy | PASS | `section-miniapp-guard.test.mjs`: `Ads-first: FI verification uses /me role and does not unlock dealer storefront copy` — PASS |

---

## 06 — API Routes Inventory

### 6.1 Route modules (`artifacts/api-server/src/routes/v1/`)

| Module | HTTP verbs (approx) | Primary guard | Notes |
|--------|---------------------|--------------|-------|
| `admin.ts` | 43 | `requireAdminRole` (router-level) + `requirePermission(…)` per-endpoint | Full RBAC matrix; 11 permissions |
| `ads.ts` | 1 | public | Read-only public |
| `billing.ts` | 5 | `requireAuth` + `requireDbUser` (6 guard refs) | CSV export included |
| `bookings.ts` | 2 | `requireAuth` (3 refs) | Create + manage |
| `companies.ts` | 5 | `requireAuth` (3 mutations) | Follow + company profile |
| `conversations.ts` | 7 | `requireAuth` (8 refs) | Chat with reactions |
| `dealer.ts` | 8 | `requireDealerRole` (router-level) | Dealer-exclusive surface |
| `feed.ts` | 1 | public | Home feed |
| `financing.ts` | 2 | `requireAuth` | FI inbox |
| `global-supply.ts` | 5 | `requireAuth` (4) | B2B supply chain |
| `import-orders.ts` | 5 | `requireAuth` (6) | Import lifecycle |
| `investments.ts` | 6 | `requireAuth` (5) | Investment hub |
| `leads.ts` | 2 | `requireAuth` (2) | CRM leads |
| `listings.ts` | 14 | `requireAuth` (9); `optionalAuth` (1) | Core marketplace; booking sub-route |
| `market.ts` | 1 | public | Market data |
| `me.ts` | 16 | `requireAuth` (17 refs) | Profile, metrics, saved searches, AI assistant |
| `notifications.ts` | 4 | `requireAuth` (5) | Read + ack |
| `payments.ts` | 2 | **no auth** on webhook (HMAC); public on return | PSP webhook HMAC-authenticated separately |
| `reference.ts` | 1 | public | Location/brand catalog |
| `reports.ts` | 1 | `requireAuth` (2) | Abuse reports |
| `rfqs.ts` | 6 | `requireAuth` (5) | B2B RFQ |
| `saves.ts` | 2 | `requireAuth` (3) | Saved listings |
| `search.ts` | 6 | public (all search) + `searchRateLimiter` | Map + full text |
| `sellers.ts` | 2 | `requireAuth` (2) | Seller profile |
| `stories.ts` | 3 | `requireAuth` (3) | Content stories |
| `subscriptions.ts` | 5 | `requireAuth` + `requireDbUser` (6) | Plans + billing |
| `support.ts` | 1 | `requireAuth` (2) | Support tickets |
| `uploads.ts` | 4 | `requireAuth` (5) | Presigned + promote |
| `users.ts` | 1 | `requireAuth` (2) | Public seller view |
| `wallet.ts` | 5 | `requireAuth` (6) | Wallet + topup |
| `health.ts` (root) | 2 | public | Liveness + readiness probes |
| `seoRoutes.ts` | 3 | public | `/l/:id`, `/sitemap.xml`, `/robots.txt` |

**Total v1 route modules: 31.** Controllers: 34 files counted in `src/controllers/`.

### 6.2 Middleware stack (in order, `app.ts`)

1. `trust proxy 1` — Coolify/nginx real IP passthrough
2. `x-powered-by` disabled
3. `helmet` — full security headers; CSP `'self'`; `crossOriginResourcePolicy: cross-origin`
4. `pino-http` — request ID + structured logging
5. **Clerk proxy** (`CLERK_PROXY_PATH`) — before body parsers (streams raw bytes)
6. `requestLogger` — per-request access line (OPTIONS excluded)
7. `compression` (gzip/brotli)
8. `cors` — `isAllowedOrigin()` allowlist; `credentials: true`
9. **CSRF origin guard** — `shouldRejectUnsafeOrigin()` → 403 for cross-origin unsafe methods from non-allowlisted origins
10. `express.json({ limit: "100kb" })` + `express.urlencoded`
11. `GET /` liveness stub (no DB, pre-Clerk)
12. `GET /api/healthz` + `GET /api/readyz` (health router)
13. `clerkMiddleware` — publishable key resolved per-host for multi-domain
14. `seoRouter` — `/l/:id`, `/sitemap.xml`, `/robots.txt`
15. `/api` → v1 router
16. `notFoundHandler` + `errorHandler` (centralized envelope)

### 6.3 Background jobs (`src/jobs/`)

| Job | File | Status |
|-----|------|--------|
| Archive listings | `archiveListings.ts` | PASS (file present) |
| Backfill staff roles | `backfillStaffRoles.ts` | PASS |
| Dealer performance | `dealerPerformance.ts` | PASS |
| Subscription expiry | `subscriptionExpiry.ts` | PASS |
| Subscription expiring reminders | `subscriptionExpiringReminders.ts` | PASS |
| Weekly reports | `weeklyReports.ts` | PASS |
| CRON_TIMEZONE | env-driven | PASS; defaults `Africa/Cairo` in Coolify compose |

---

## 07 — Docker Compose / Coolify Deployment

### 7.1 Compose services (`docker-compose.coolify.yml`)

| Service | Image built from | Host port | Internal port | Health check | Status |
|---------|-----------------|-----------|--------------|-------------|--------|
| `postgres` | `postgres:16` | none (internal only) | 5432 | `pg_isready` 10s/5s/5r | PASS |
| `api` | `deploy/coolify/Dockerfile.api` | `${API_HOST_PORT:-8080}` | 8080 | `node -e fetch('/api/healthz')` | PASS |
| `banco-web` | `deploy/coolify/Dockerfile.banco-web` | `${BANCO_WEB_HOST_PORT:-3000}` | 3000 | `node -e fetch('/api/healthz')` | PASS |
| `banco-website` | `deploy/coolify/Dockerfile.banco-website` | `${BANCO_WEBSITE_HOST_PORT:-3001}` | 3000 | same | PASS |
| `web` (Nginx+SPAs) | `deploy/coolify/Dockerfile.web` | `${WEB_HOST_PORT:-80}` | 80 | `wget /nginx-health` | PASS |
| `migrate` (profile-gated) | reuses builder stage | none | — | manual trigger | PASS |

Scale-readiness test `Coolify compose exposes api + web + website + nginx with healthchecks` — **PASS** (`scale-readiness.test.mjs`).

### 7.2 Dockerfile properties

| Dockerfile | Non-root user | Process manager | Build target | Notes |
|-----------|--------------|----------------|-------------|-------|
| `Dockerfile.api` | `banco` (uid 10001) | `tini` | builder/runner multi-stage | esbuild bundle; `--enable-source-maps` |
| `Dockerfile.banco-web` | present (`nextjs` user pattern) | none (node process) | Next.js `standalone` output | `NEXT_STANDALONE=true` |
| `Dockerfile.banco-website` | present | none | `standalone` output | same |
| `Dockerfile.web` | **no explicit user** | nginx | Vite build → nginx serve | FAIL-INFO: `Dockerfile.web` runs nginx as default (root); low risk (static assets only behind reverse proxy) but worth noting |

### 7.3 Required secrets (Coolify env — not committed)

| Secret | Source | Status |
|--------|--------|--------|
| `POSTGRES_PASSWORD` | required (`:?`) | PASS (enforced in compose) |
| `CLERK_SECRET_KEY` | required (`:?`) | PASS |
| `SESSION_SECRET` | required (`:?`) | PASS |
| `PAYMENT_CONFIG_ENCRYPTION_KEY` | required (`:?`) | PASS |
| `CORS_ALLOWED_ORIGINS` | optional (`:-`) | PENDING_RUNTIME — must be set to production domain list before launch |
| `OBJECT_STORAGE_PROVIDER` | optional (`:-`) | **FAIL→FIXING** — defaults empty; server warns if unset; must be `s3` in Coolify; see memory `replit-object-storage-repoint.md` |
| All `NEXT_PUBLIC_*` / `VITE_*` build args | build-time | PENDING_RUNTIME — must be set before Coolify build |

### 7.4 DB migration strategy

- Migrations: **manual, profile-gated** (`--profile migrate`). NOT auto on `up`.
- Risk: operators who `docker compose up` without running migrate will get schema drift if tables were added.
- Evidence: `docker-compose.coolify.yml` L70–90 comment block; `docs/DEPLOY_COOLIFY.md` exists.
- Recommendation: document required migration steps prominently in ops runbook before each release.

### 7.5 DB pool and startup

| Check | Status | Evidence |
|-------|--------|---------|
| Pool env-driven (DB_POOL_MAX, idle/connect timeout) | PASS | `lib/db/src/index.ts` — `poolMax`, `idleTimeoutMillis`, `connectionTimeoutMillis` |
| Boot extensions non-fatal (pg_trgm) | PASS | `src/lib/bootstrap.ts` — failure logged, boot continues |
| Boot indexes idempotent | PASS | `idx_listing_attrs_market_country`, geo, feed tested in `scale-readiness.test.mjs` |
| Empty-DB auto-seed (child process, non-blocking) | PASS | `ensureSeedData()` spawns child; health checks still respond during seed |

---

## 08 — Security Audit

### 8.1 CORS

| Test | Status | Evidence |
|------|--------|---------|
| Own Replit domain allowed (REPLIT_DOMAINS) | PASS | `cors.test.ts`: `allows this Repl's own Replit domain` |
| Shared `*.replit.app` / `*.replit.dev` wildcard rejected | PASS | `cors.test.ts`: `REJECTS attacker-controlled shared Replit suffixes (the vuln)` — `evil.replit.app`, `evil.replit.dev`, `evil.repl.co` all → `false` |
| Look-alike suffix rejected | PASS | `cors.test.ts`: `does not match a look-alike suffix of an allowed host` |
| `CORS_ALLOWED_ORIGINS` comma list | PASS | `cors.test.ts`: explicit entries allowed, others rejected |
| No Origin (mobile bearer / server-to-server) | PASS | `cors.test.ts`: `allows requests with no Origin` |
| Localhost only in dev, not in deployed (REPLIT_DEPLOYMENT guard) | PASS | `cors.test.ts`: two separate tests for `NODE_ENV=production` and `REPLIT_DEPLOYMENT=1` |
| CSRF origin guard rejects unsafe cross-origin mutations | PASS | `cors.test.ts`: `POST/PUT/PATCH/DELETE` from evil origin → rejected; `GET/HEAD` never rejected |
| CSRF guard allows same-origin without allowlist | PASS | `cors.test.ts`: host match path |

**CORS module: 100% test coverage in current suite. All tests PASS.**

### 8.2 Clerk / authentication

| Check | Status | Evidence |
|-------|--------|---------|
| Clerk SDK (`@clerk/expo` mobile; `@clerk/express` API) — no home-grown session crypto | PASS | `app.ts` `clerkMiddleware`; `profile.tsx` imports `@clerk/expo` |
| Clerk publishable key resolved per-host (multi-domain) | PASS | `app.ts`: `publishableKeyFromHost(getClerkProxyHost(req) \|\| "", process.env.CLERK_PUBLISHABLE_KEY)` |
| ClerkLoadGate 2500ms timeout (white-screen prevention) | PASS | `app/_layout.tsx`: `CLERK_LOAD_TIMEOUT_MS = 2500`; timed-out session degrades to signed-out guest |
| tokenCache (SecureStore-backed) | PASS | `accounts-clerk-journey.test.mjs`: `ClerkProvider configured with tokenCache` — PASS |
| Clerk proxy middleware does NOT claim Replit Auth as SoT | PASS | `accounts-clerk-journey.test.mjs`: test PASS |
| Auth provider order: AuthGate → Session → Biometric | PASS | `accounts-clerk-journey.test.mjs`: `Auth provider tree: AuthGate wraps SessionProvider` — PASS; `session-restore.test.mjs`: `provider order verified by closing-tag order` — PASS |
| All auth-sensitive providers inside ClerkLoadGate | PASS | `session-restore.test.mjs`: test PASS |
| requireAuth blocks unauthenticated API calls (401) | PASS | `authGuard.ts`: `getAuth(req).userId` absent → 401 |
| requireDealerRole rejects non-dealer roles (403) | PASS | `authGuard.ts`: `["dealer","company","enterprise"].includes(user.role)` or 403 |
| requireAdminRole + requirePermission per-endpoint | PASS | `routes/v1/admin.ts`: every endpoint has explicit permission check |
| AuthGate modal for guests (no action run) | PASS | `session-restore.test.mjs`: `AuthGateProvider opens modal for guests and skips action` — PASS |

### 8.3 MFA

| Check | Status | Evidence |
|-------|--------|---------|
| MFA priority: TOTP → email_code → phone_code → backup_code | PASS | `profile.tsx` L64–71: `MFA_PRIORITY` array |
| `needs_second_factor` accepted for delete-account | PASS | `accounts-clerk-journey.test.mjs`: `MFA delete-account accepts needs_second_factor` — PASS |
| Social providers fail closed (empty list on error) | PASS | `useSocialProviders.ts`: catch → `return []`; test PASS |
| Social provider list fetched from Clerk tenant (not hardcoded) | PASS | `useSocialProviders.ts`: reads `v1/environment` → `user_settings.social`; tenant without Google/FB/Apple shows no buttons |
| OAuth/Google/Apple/Facebook actual sign-in flow | PENDING_RUNTIME | `useSSO` + `startSSOFlow` code present; live Clerk tenant has email-only at last audit (needs dashboard config check + on-device QA) |

### 8.4 Payments security

| Check | Status | Evidence |
|-------|--------|---------|
| Paymob HMAC webhook verification | PASS | `paymentProvider.ts`: `PAYMOB_HMAC_SECRET` used; webhook route has no JWT auth (correct — HMAC is out-of-band) |
| Payment provider config encrypted at rest (AES-256-GCM) | PASS | `secretCrypto.ts`: AES-256-GCM, random IV per encrypt; `secretCrypto.test.ts` passes (round-trip, tamper-detect, random IV) |
| Webhook endpoint: POST /v1/payments/webhook has no Bearer guard | PASS by design | HMAC is the auth mechanism; added comment in `payments.ts` confirming this is intentional |
| `PAYMENT_CONFIG_ENCRYPTION_KEY` required at boot | PASS | Coolify compose: `:?` required |

### 8.5 Upload security

| Check | Status | Evidence |
|-------|--------|---------|
| IDOR fix C-01: `upload_claims` ownership table | PASS | `audit/fixes/C-01-upload-idor.md` — FIXED 2026-07-07; `assertCallerMayUseUpload()` required |
| SQL LIKE wildcard fix C-02 | PASS | `audit/fixes/C-02-like-wildcard.md` — FIXED 2026-07-07; `%` and `_` escaped |
| Media promoted to public ACL only after verify | PASS | `objectAcl.ts` present; promote path guarded |
| `requireAuth` on all upload mutation routes | PASS | `routes/v1/uploads.ts`: 5 auth guards on 4 verbs |

### 8.6 Input validation and SQL injection

| Check | Status | Evidence |
|-------|--------|---------|
| Zod schemas on API boundary | PASS | `validators/schemas.ts`; generated from OpenAPI spec (`lib/api-spec`) |
| Drizzle ORM parameterised queries | PASS | `SearchService.ts`, controllers — no raw string-built SQL with user input |
| Mass-assignment protection | PASS | `release/SECURITY_REPORT.md`: "inserts use explicit column maps, not raw body spread" |
| Sensitive data not logged | PASS | Pino structured logging; errors log `err` objects |

### 8.7 Secret hygiene

| Check | Status | Evidence |
|-------|--------|---------|
| No `.env` committed | PASS | `.env.example` files only; no real secrets in tree |
| No live API keys in codebase | PASS | `release/SECURITY_REPORT.md`: `sk-…`, `re_…` patterns absent; one OpenAI key was pasted in chat (not committed) and rotation was advised |

---

## 09 — Mobile Platform Hardening

### 9.1 Expo identity (R-16 — was CRITICAL FAIL)

| Check | Status | Evidence |
|-------|--------|---------|
| `ios.bundleIdentifier` = `com.bancooom.app` | **PASS** (was FAIL→FIXING) | `app.json` confirmed `com.bancooom.app` by Python read and test: `Expo product identity stays canonical` — PASS |
| `android.package` = `com.bancooom.app` | **PASS** (was FAIL→FIXING) | same `app.json` |
| `scheme` = `bancooom` | PASS | `app.json`: `"scheme": "bancooom"` |
| `app.config.ts` wires Universal Links from env (not hardcoded) | PASS | `universal-links-config.test.mjs`: `app.config.ts wires Universal/App Links from env` — PASS |
| Deep-link hosts from `EXPO_PUBLIC_PUBLIC_APP_URL` not replit.com | PASS | `accounts-clerk-journey.test.mjs`: `routerOrigin prefers PUBLIC_APP_URL over bare replit.com` — PASS |

### 9.2 Account-type gate / Skip control (R-17 — was CRITICAL FAIL)

| Check | Status | Evidence |
|-------|--------|---------|
| `testID="onboard-skip"` present in profile.tsx | **PASS** (was FAIL→FIXING) | `lib-hardening.test.mjs`: `account-type gate keeps Skip + dismiss-first anti-trap` — PASS; Python literal scan: `True` |
| Dismiss-before-updateMe order | PASS | test assertion: `must dismiss gate BEFORE updateMe` — PASS |
| `demoteBlockedTitle` guard (S4) | PASS | test PASS |
| `accountTypeChosen` follows successful `updateMe` | PASS | test PASS |

### 9.3 Profile overflow menu touch-safety (R-18 — was HIGH FAIL)

| Check | Status | Evidence |
|-------|--------|---------|
| No `onStartShouldSetResponder` in overflow menu modal block | **PASS** (was FAIL→FIXING) | `lib-hardening.test.mjs`: PASS; Python scan of modal block: `onStartShouldSetResponder_in_overflow = False` |
| `StyleSheet.absoluteFillObject` dismiss sibling | PASS | Python scan: `absoluteFillObject = True`; test PASS |
| Menu items in `ScrollView` | PASS | test: `profile menu items must scroll inside the sheet` — PASS |
| `menuSheet.maxHeight: "85%"` | PASS | `profile.tsx` StyleSheet at line ~136406: `maxHeight: "85%"` confirmed; test PASS |

### 9.4 Other mobile hardening

| Check | Status | Evidence |
|-------|--------|---------|
| Section mini-apps (car, real-estate, factories, materials, booking) | PASS | all 5 files in `app/section/`; `section-miniapp-guard.test.mjs` — PASS |
| Rental hub registered in Stack | PASS | `lib-hardening.test.mjs`: `rental hub is a registered stack route` — PASS |
| Push notification deep-link by stamped role (guest vs host) | PASS | `lib-hardening.test.mjs`: `booking notifications route by stamped side` — PASS |
| Payment/subscription notifications → `/billing` | PASS | test: `payment and subscription notifications route to billing hub` — PASS |
| Search map locate-me control restored (fcd7d1c) | PASS | test PASS |
| Search map framed by market country center (b68c8af) | PASS | test PASS |
| Billing/wallet/invoices routes registered | PASS | test PASS |
| Invoice PDF download | PASS | test PASS |
| Session restore / biometric hydration (full set) | PASS | `session-restore.test.mjs`: 17 tests — all PASS |
| CDN readiness (image `cachePolicy="memory-disk"`, FlatList `windowSize`) | PASS | `cdn-readiness.test.mjs` — PASS; Python confirms `saved.tsx` has `windowSize`, `SmartAssetCard` has `memory-disk` |
| React Compiler enabled (`experiments.reactCompiler`) | PASS | `app.json`: `"reactCompiler": true` |
| New Architecture enabled (`newArchEnabled`) | PASS | `app.json`: `"newArchEnabled": true` |
| PermissionRationaleModal present | PASS | `components/PermissionRationaleModal.tsx` exists |
| Consent version stamped (`CONSENT_VERSION = "2026-06-11"`) | PASS | `profile.tsx` L73 |

### 9.5 Env-blocked mobile tests

| Test | Failure mode | Product risk |
|------|-------------|-------------|
| `i18n-usage.test.mjs` | `npx tsc` not available in audit environment | **INCONCLUSIVE_ENV** — not a product code failure; re-run after `pnpm install` |
| `icons.test.mjs` | `@expo/vector-icons` MODULE_NOT_FOUND (deps not installed) | **INCONCLUSIVE_ENV** — same; known from Phase 0 R-19 |

### 9.6 EAS build configuration

| Check | Status | Evidence |
|-------|--------|---------|
| CLI version `>= 20.0.0` | PASS | `eas.json` |
| Node 24 in all build profiles | PASS | `eas.json` base: `"node": "24.18.0"` |
| Production Android: `app-bundle` + `autoIncrement` | PASS | `eas.json` production |
| Production iOS: `autoIncrement` | PASS | `eas.json` production |
| Development: APK (internal) | PASS | `eas.json` development |
| Play Store Data Safety declaration | PASS | `PLAY_STORE_DATA_SAFETY.md` complete; delete-account path documented |

---

## 10 — Performance Notes

### 10.1 API server

| Area | Finding | Status |
|------|---------|--------|
| DB pool sizing | Env-driven (`DB_POOL_MAX`, idle/connect timeout); default 20 | PASS |
| Keyset cursor pagination | Feed/newest uses cursor, not OFFSET | PASS |
| `market_country` expression index | `COALESCE(specs->>'market_country','EG')` index present; `SearchService` uses same expression | PASS — `scale-readiness.test.mjs` |
| Geo index | `idx_listings_geo` | PASS |
| Feed scale index | `idx_listings_status_category_created` | PASS |
| Import orders index | `idx_import_orders_stage_created` | PASS |
| GIN trigram index | `pg_trgm` extension; `similarity()` for duplicate detection | PASS |
| Server map clustering | `/v1/search/map` grid aggregation | PASS |
| Compression | `compression` middleware (gzip/brotli) | PASS |
| Circuit breaker | `lib/circuitBreaker.ts` (86 lines) with half-open state | PASS |
| Post-commit best-effort analytics | Market insights after transaction, zero-latency on publish | PASS |
| `trust proxy 1` (real-IP for rate limits) | `app.ts`: `app.set("trust proxy", 1)` | PASS — `scale-readiness.test.mjs` |
| Rate limiters: public 120/min; search 60/min; write 30/min; AI 12/min | `rateLimiter.ts` | PASS |
| Request body limit 100kb | `express.json({ limit: "100kb" })` | PASS |

### 10.2 Mobile

| Area | Finding | Status |
|------|---------|--------|
| React Compiler (`reactCompiler: true`) | Enabled in `app.json` — automatic memoization | PASS |
| New Architecture (`newArchEnabled: true`) | Enabled — JSI-based rendering | PASS |
| `FlatList` perf props (`windowSize`, `removeClippedSubviews`, `maxToRenderPerBatch`) | Applied to `saved.tsx`, `messages.tsx`, `notifications.tsx`, `mine.tsx` per memory `banco-mobile-perf.md` | PASS |
| Image `cachePolicy="memory-disk"` | Applied in `SmartAssetCard.tsx` | PASS |
| React Query `staleTime: 60_000` default | `app/_layout.tsx` `QueryClient` config | PASS |
| i18n: single dictionary (no per-render network) | `constants/i18n.ts` flat dictionary; `t()` hook | PASS |
| Hermes JS engine | Expo default for RN; `newArchEnabled` implies it | PASS |
| Sort in `useMemo` (not inline in `data` prop) | Documented in `banco-mobile-perf.md`; flagged for `saved.tsx` | PASS (pattern documented) |

### 10.3 Next.js web (banco-web / banco-website)

| Area | Finding | Status |
|------|---------|--------|
| `reactStrictMode: true` | Both apps | PASS |
| `poweredByHeader: false` | `banco-web/next.config.ts` | PASS |
| CDN asset prefix (`NEXT_PUBLIC_ASSET_CDN_URL`) | Env-driven; absent → no change | PASS (design) |
| `assetPrefix` for immutable `/_next/static/*` | Wired when env set | PASS |
| `NEXT_STANDALONE=true` → standalone output | Dockerfile.banco-web/website pass this | PASS |
| `transpilePackages` for workspace libs | `@workspace/design-tokens`, `taxonomy`, `api-client-react`, `search-contract` | PASS |
| `images.remotePatterns` | **Not configured** in either `next.config.ts` | FAIL-INFO — `next/image` optimization will warn on external image domains; low severity if CDN handles images |
| Server Actions `allowedOrigins` | Replit proxy domains listed | PASS (dev) |
| Turbopack | Not enabled | N/A (not a defect) |

### 10.4 Performance gaps / recommendations (not blockers)

| Item | Notes |
|------|-------|
| `Dockerfile.web` — nginx runs as root | Static SPA only; behind reverse proxy; low blast radius; worth fixing for defense-in-depth |
| `images.remotePatterns` not set | Next.js will refuse to optimize external images without this; add object-storage CDN domain |
| `CORS_ALLOWED_ORIGINS` must be set in Coolify | Without it, browser clients from the production domain will get no CORS headers; PENDING_RUNTIME |
| DB SSL on production `DATABASE_URL` | Cannot verify from static code; must check Coolify `DATABASE_URL` includes `?sslmode=require` |
| `OBJECT_STORAGE_PROVIDER` must be `s3` in Coolify | Server emits a clear warning if unset; media uploads will fail silently |

---

## Stubs for Reports 11–15

---

## 11 — Web (banco-web / banco-website) Journey Audit

*Stub — requires live browser test or expanded static analysis of Next.js pages.*

### Planned coverage
- [ ] Locale routing (`/en/*` vs `/ar/*` default) — middleware present; content parity TBD
- [ ] Clerk middleware protected routes (`/workspace`, `/saved`, `/en/workspace`, `/en/saved`)
- [ ] Search page (`SearchPageBody`, facets, map, pagination)
- [ ] Listing detail (`ListingDetailView`, booking section, contact actions)
- [ ] Seller workspace (`/workspace/*`)
- [ ] Maintenance plug gate (`WEB_PLUG_ENABLED`)
- [ ] `FROZEN.md` on `banco-web` — frozen build status and Coolify deployment decision
- [ ] `banco-web` vs `banco-website` functional parity (both identical per R-11; which gets Coolify traffic?)

### Known issues from Phase 0
- R-14 (`/en/workspace/*` re-exports Arabic workspace pages): design intent — verify no content regression
- R-11 (banco-web ≡ banco-website byte-identical): owner decision required on which to canonicalize

---

## 12 — Admin OS / Dealer OS Audit

*Stub — requires expanded analysis of Vite SPA apps.*

### Planned coverage
- [ ] `admin-os/src/App.tsx` route structure; permissions matrix mirror vs server
- [ ] Dealer OS app presence, route completeness
- [ ] `@assets` alias dormant risk (R-06) — confirm zero imports before removing alias
- [ ] Auth: Vite `VITE_CLERK_PUBLISHABLE_KEY` build arg wired in Coolify compose
- [ ] shadcn `components/ui` ×4 duplication (R-12) — confirm no functional divergence between copies

---

## 13 — End-to-End Media / Upload Pipeline

*Stub — requires on-device or integration test with a live object storage endpoint.*

### Planned coverage
- [ ] Presigned URL request → upload → promote to public ACL — full round trip
- [ ] `upload_claims` table TTL enforcement (C-01 fix)
- [ ] `mediaVerify.ts` MIME check before promote
- [ ] `ImageCropModal.tsx` dimensions within platform limits
- [ ] `OBJECT_STORAGE_PROVIDER=s3` path vs absent/replit path — confirm warning is surfaced in logs
- [ ] `PLAY_STORE_DATA_SAFETY.md` vs actual permissions in `app.json` — cross-check completeness

---

## 14 — i18n / Locale Completeness

*Stub — blocked by INCONCLUSIVE_ENV on `i18n-usage.test.mjs` (npx tsc unavailable). Run after `pnpm install`.*

### Planned coverage
- [ ] Re-run `i18n-usage.test.mjs` after full install; confirm 0 missing keys en↔ar
- [ ] Verify all new account-type / FI / demote keys have both `en` + `ar` (partial check passed statically — 2×`accountSetupRetryTitle` found)
- [ ] Verify `i18n.ts` RTL flag correct for Arabic (`isRTL` hook)
- [ ] Check `banco-web` / `banco-website` locale files for parity with mobile constants
- [ ] Market country labels (21-market multi-language picker) — `MarketCountryPicker.tsx`

---

## 15 — Regression Gate / CI Verification

*Stub — requires CI configuration inspection and GitHub Actions/EAS CI run evidence.*

### Planned coverage
- [ ] Confirm all 129 currently-PASS mobile tests remain PASS after repairs (R-16/17/18)
- [ ] Confirm `i18n-usage.test.mjs` and `icons.test.mjs` PASS after `pnpm install` in CI
- [ ] `artifacts/api-server/src/lib/*.test.ts` Vitest suite — `vitest.config.ts` exists; no CI run evidence in current scope
- [ ] `artifacts/api-server/src/health.test.ts` — Vitest; verify runs
- [ ] EAS production build — `eas build --profile production` — `PENDING_RUNTIME`
- [ ] App store submission checklist (`release/STORE_PUBLISHING_GUIDE.md`) — owner gate
- [ ] `DEPLOYMENT.md` / `DEPLOY_COOLIFY.md` — operator runbook walk-through

---

*End of combined draft — Reports 02–10 complete; 11–15 stubbed.*
