# PHASE 1 — PRODUCTION INVENTORY REPORT

**SoT repository:** `waelzaid66-max/banco-with-wael`  
**Tip inventoried:** `2340c97` (`cursor/w41-production-release-5cf0`)  
**Base of Phase X line:** `114bd53` Round 16 (branch is ~42 commits ahead of `origin/main` @ `0e6c00d`)  
**Phase rule:** Discover only. **No repairs. No new feature code. No Phase 2.**  
**Official release posture on tip:** CONDITIONAL GO — NOT FULL PRODUCTION CERTIFIED (see `19-FINAL-PRODUCTION-CERTIFICATION.md`, `31-PRODUCTION-RECOVERY-LEDGER.md`).

---

## 0. How to read this map

For every item:

| Field | Meaning |
|-------|---------|
| **Exists** | Present in repository |
| **Location** | Path(s) |
| **Dependencies** | What it needs |
| **Consumers** | Who uses it |
| **State** | production / frozen / tooling / intentional soft-launch / deferred |
| **Connected** | wired in mount/compose/import graph (code evidence) |
| **Evidence** | file/commit/doc citation |
| **Runtime** | verified in this Phase 1 pass? (usually **UNVERIFIED live** — inventory ≠ live probe) |
| **Risk** | if disconnected or dual-path |
| **Missing evidence** | what Phase 2/4 still need |

**Connected** here means *source wiring exists*. It does **not** mean Coolify/EAS live success.

---

## 1. Applications (production surfaces)

| Application | Exists | Location | Dependencies | Consumers | State | Connected | Evidence | Runtime | Risk | Missing evidence |
|-------------|--------|----------|--------------|-----------|-------|-----------|----------|---------|------|------------------|
| API server | Yes | `artifacts/api-server` | `@workspace/db`, `api-zod`, OpenAI integration; Clerk; Postgres; S3/replit; Paymob; Resend; Expo push | All clients via `/api` | **production** | Yes — Coolify `api` service | `app.ts`, `docker-compose.coolify.yml`, `deploy/coolify/Dockerfile.api` | UNVERIFIED live | Vercel config present but `git.deploymentEnabled: false` — Coolify is SoT host | Live `/api/readyz` on VPS |
| BANCO Mobile | Yes | `artifacts/banco-mobile` | api-client-react, search-contract, taxonomy; Clerk Expo; EAS | End users (iOS/Android) | **production** | Yes — EAS not Docker | `eas.json`, `app/_layout.tsx`, `release/EAS_BUILD.md` | UNVERIFIED device | Store submit credentials OPS | EAS build/submit logs |
| Admin OS | Yes | `artifacts/admin-os` | api-client-react; Clerk Vite | Staff | **production** | Yes — Coolify nginx `/admin/` | `Dockerfile.web`, `nginx.conf`, `App.tsx` | UNVERIFIED live | Blank page if BASE_PATH wrong (AWS path repaired on tip) | Live `/admin/` smoke |
| Dealer OS (BANCO Market) | Yes | `artifacts/dealer-os` | api-client-react, taxonomy | Dealers/B2B | **production** (README also says “reference”) | Yes — Coolify nginx `/market/` | same as admin | UNVERIFIED live | Path alias `/dealer-os` → 301 `/market/` | Live `/market/` smoke |
| Landing | Yes | `artifacts/landing` | api-client-react (dep); VITE_* bake | Apex CTA entry | **production** | Yes — Coolify nginx `/` | `App.tsx` PATHS, `Dockerfile.web` | UNVERIFIED live | Clerk hops still absolute to `banco.today/dealer-os` + `/banco-mobile` | Live domain matrix |
| banco-website | Yes | `artifacts/banco-website` | api-client-react, design-tokens, search-contract, taxonomy; Clerk Next | Canonical consumer web | **production canonical** | Yes — Coolify `banco-website` | README, `Dockerfile.banco-website`, compose | UNVERIFIED live | Needs bake URLs for market/admin/stores | Live health `surface=banco-website` |
| banco-web | Yes | `artifacts/banco-web` | same family as website | Twin / freeze path | **FROZEN** | Still deployed Coolify `banco-web` | `FROZEN.md`, compose service | UNVERIFIED live | Dual consumer until owner cutover (B-07) | Owner cutover decision |
| mockup-sandbox | Yes | `artifacts/mockup-sandbox` | none workspace | Design preview | **tooling** | Not in Coolify compose | package.json; replit.md workflows | N/A | Must not ship as prod | — |

---

## 2. Shared packages / libraries

| Package | Exists | Location | Dependencies | Consumers | State | Connected | Evidence | Runtime | Risk | Missing evidence |
|---------|--------|----------|--------------|-----------|-------|-----------|----------|---------|------|------------------|
| `@workspace/db` | Yes | `lib/db` | drizzle, pg | api-server, migrate job | production lib | Yes | `schema/index.ts` (~70 tables), `push` scripts | UNVERIFIED live migrate | No versioned SQL migrations — push mode | Live schema == tip |
| `@workspace/api-spec` | Yes | `lib/api-spec` | orval | codegen → zod + client | production SoT | Yes | `openapi.yaml` **136 paths / 162 ops** | N/A | Express has routes not in OpenAPI (payments, readyz, livez) | Spec sync audit (Phase 2) |
| `@workspace/api-zod` | Yes | `lib/api-zod` | generated | api-server | production | Yes | generated from OpenAPI | N/A | Drift if codegen stale | CI codegen freshness |
| `@workspace/api-client-react` | Yes | `lib/api-client-react` | generated | mobile, webs, admin, dealer, landing | production | Yes | workspace deps | N/A | Same drift risk | — |
| `@workspace/search-contract` | Yes | `lib/search-contract` | api-client-react, taxonomy | mobile, webs | production | Yes | exports engines/url/map/facets | N/A | Facets market_country MED residual | Phase 2 lifecycle |
| `@workspace/taxonomy` | Yes | `lib/taxonomy` | — | mobile, dealer, webs, API seed | production | Yes | categories/cars/locations | N/A | — | — |
| `@workspace/design-tokens` | Yes | `lib/design-tokens` | — | banco-web, banco-website | production | Yes | — | N/A | — | — |
| `@workspace/integrations-openai-ai-server` | Yes | `lib/integrations-openai-ai-server` | — | api-server | production optional | Yes if `OPENAI_API_KEY` | package exports | UNVERIFIED | Degrades without key | Live AI call |
| `@workspace/scripts` | Yes | `scripts/` | — | CI/ops | tooling | Yes | gates, website audits, confidence | Local gates green on tip | — | — |

---

## 3. Navigation / screens / routes

### 3.1 Mobile (Expo Router) — **53 routes + 2 layouts**

| Group | Routes (evidence: `artifacts/banco-mobile/app/`) | Connected | Risk |
|-------|--------------------------------------------------|-----------|------|
| Tabs | `/`, `/search`, `/messages`, `/saved`, `/profile` | Yes | AuthGate wraps root; no layout Redirect |
| Listings | `listing/[id]`, `l/[id]`, `listings/mine|create|edit/[id]`, `search-results` | Yes | — |
| Sections | `section/car|real-estate|factories|materials|booking` | Yes | — |
| Business | onboarding, verification, banks, analytics, rfq-inbox, requests, supply-hub, company/*, market, suppliers, investments/*, global-supply/* | Yes | — |
| Money | `wallet`, `billing`, `invoices`, `invoices/[id]`, `plans` | Yes | Live Paymob OPS |
| Comms | `messages/[id]`, `notifications` | Yes | Push OPS |
| Import | `import-tracking`, `import/request` | Yes | Discover CTA may still browse-only (product residual) |
| Other | bookings, rfq/*, industry, settings, assistant, legal/*, rentals/hub, +not-found | Yes | — |

**Auth pattern evidence:** Clerk + `AuthGateProvider` in root `_layout`; tabs use `isSignedIn` for unread query only — **no** signed-out hard redirect in layouts.

### 3.2 Consumer Next (banco-website = banco-web twin) — **48 pages each**

Identical trees: `/`, `/cars`, `/directory`, `/industrial`, `/real-estate`, `/search`, `/saved`, `/listing/[id]`, `/maintenance`, `/sign-in`, `/sign-up`, `/workspace` (+ analytics, bookings, leads, wallet, b2b/rfqs/supply, listings CRUD, messages), plus full `/en/...` mirrors.

**Health:** `/api/health`, `/api/healthz` (website reports `surface=banco-website`, `wave=w4.1` on tip).

### 3.3 Admin OS — **20 wouter routes**

overview, users, listings, moderation, reports, support, leads, financing, ads, revenue, analytics, fraud, monitoring, alerts, plans, promo, settings, sign-in/up.

### 3.4 Dealer OS — **16 wouter routes**

dashboard, listings, leads, analytics, ads, import, rfqs, global-supply, investments, company, wallet, subscription, privacy/terms, sign-in/up. (`not-found.tsx` **exists but not registered** in Switch — inventory note).

### 3.5 Landing PATHS

| Key | Default | Connected |
|-----|---------|-----------|
| app | `/` or store/web env | Yes (VITE_*) |
| market | `/market/` | Yes (Coolify map) |
| admin | `/admin/` | Yes |
| DomainRouter | absolute `banco.today/dealer-os` + `/banco-mobile` | Yes (Clerk origin) |

---

## 4. API surface

| Item | Exists | Location | State | Connected | Evidence | Risk / missing |
|------|--------|----------|-------|-----------|----------|----------------|
| App mount | Yes | `artifacts/api-server/src/app.ts` | production | Yes | `/api` + `/api/v1` + SEO + Clerk proxy | — |
| Health | Yes | `routes/health.ts` | production | Yes | `/api`, `/healthz`, `/livez`, `/readyz` (+ money schema) | Live readyz needs migrate |
| v1 modules | **30** files | `routes/v1/*` | production | Yes | ~**170** handler registrations | — |
| OpenAPI | Yes | `lib/api-spec/openapi.yaml` | production SoT | Partial vs Express | **136 paths / 162 ops**, 31 tag groups | **payments / readyz / livez** not in OpenAPI |
| SEO | Yes | `seoRoutes.ts` | production | Yes | `/l/:id`, sitemap, robots | — |
| Clerk proxy | Yes | `clerkProxyMiddleware.ts` | production | Yes | `/api/__clerk` | — |

### 4.1 API domains (modules)

| Domain | Route prefix | Connected consumers (code) |
|--------|--------------|----------------------------|
| me / profile / prefs / saved searches | `/api/v1/me` | mobile, web workspace |
| feed | `/api/v1/feed` | mobile, web |
| listings + comments + bookings links | `/api/v1/listings` | all surfaces |
| search / map / facets / trending / recs | `/api/v1/search` | mobile, web |
| leads / saves | `/api/v1/leads`, `/saves` | mobile, dealer, web |
| conversations / messages | `/api/v1/conversations` | mobile, web |
| notifications / push tokens | `/api/v1/notifications` | mobile |
| stories | `/api/v1/stories` | mobile |
| dealer | `/api/v1/dealer` | dealer-os |
| admin (43 handlers) | `/api/v1/admin` | admin-os |
| wallet / subscriptions / billing | `/api/v1/wallet|subscriptions|billing` | mobile, dealer, web |
| payments webhook/return | `/api/v1/payments` | Paymob (no Clerk) |
| uploads | `/api/v1/uploads` | mobile, webs |
| companies / RFQ / import / investments / global-supply | respective `/api/v1/*` | mobile business + dealer |
| financing | `/api/v1/financing` | FI seats + admin |
| reports / support / ads / market / reference / users delete | respective | admin/mobile |

---

## 5. Database models (70 tables)

**Location:** `lib/db/src/schema/index.ts`  
**Apply mechanism:** `drizzle-kit push` / `push-force` (no versioned SQL migration tree)  
**Boot patches:** `ensureSchemaPatches` + `pg_trgm` in API bootstrap  

| Domain | Tables (inventory) | Connected |
|--------|-------------------|-----------|
| Taxonomy | brands, models, car_variants, locations, property/finishing/ownership/industrial types, industries | Yes |
| Users / prefs | users, upload_claims, user_social_links, notification_preferences, saved_searches | Yes |
| Listings | listings, listing_attributes, candidate_*, listing_media, payment_options, listing_links, interactions | Yes |
| Ads / abuse | ads, audit_log, rate_events, dedup_keys | Yes |
| Leads | lead_history, lead_tokens, lead_billing | Yes |
| Social | saved_listings, listing_comments, seller_reviews, stories, story_views, user_behavior | Yes |
| Chat | conversations, messages | Yes |
| Notif / push | notifications, push_tokens | Yes |
| Money | plans, transactions, subscriptions, payment_intents, payment_provider_config, email_provider_config, promo_ad_*, invoices | Yes |
| Moderation | reports, support_tickets, support_ticket_messages | Yes |
| B2B | company_profiles, company_follows, rfqs, rfq_offers | Yes |
| Investments | investment_opportunities, investment_interests | Yes |
| Global supply | global_supply_requests, global_supply_responses | Yes |
| Financing CRM | financing_intermediaries, branches, seats, requests | Yes |
| Import | import_orders | Yes |
| Geo / RE ref | reference_developers, reference_places, pending_locations | Yes |
| Market insights | price_observations | Yes |
| Bookings | bookings | Yes |

**Migration pipeline:** Coolify/prod compose profile `migrate` → `pnpm --filter @workspace/db run push -- --force`.

---

## 6. Workers / cron

| Job | Schedule | Location | Connected | Runtime |
|-----|----------|----------|-----------|---------|
| archive-old-listings | daily 03:00 | `jobs/archiveListings.ts` | Yes via `jobs/index.ts` on long-running API | UNVERIFIED live |
| expire-subscriptions | daily 02:00 | `jobs/subscriptionExpiry.ts` | Yes | UNVERIFIED |
| promo-ad-credit | daily 02:30 | PromoAdCreditService | Yes | UNVERIFIED |
| dealer-performance | weekly Mon 04:00 | `jobs/dealerPerformance.ts` | Yes | UNVERIFIED |
| weekly-reports | weekly Mon 08:00 | `jobs/weeklyReports.ts` | Yes | UNVERIFIED |
| subscription-expiring-reminders | daily 09:00 | `jobs/subscriptionExpiringReminders.ts` | Yes | UNVERIFIED |
| backfill-staff-roles | startup once | `jobs/backfillStaffRoles.ts` | Yes | UNVERIFIED |

**TZ:** `CRON_TIMEZONE` default `Africa/Cairo`.  
**Not present:** Redis/Bull queues (inventory: none).  
**Not on Vercel handler:** cron only on `index.ts` long-running process.

In-process intervals: LeadService dedup eviction, AdaptiveFeedEngine session cleanup, slidingWindow rate-limit cleanup.

---

## 7. Authentication / authorization

| Item | Exists | Location | Connected | Evidence | Risk / missing |
|------|--------|----------|-----------|----------|----------------|
| Clerk Express middleware | Yes | `app.ts` | Yes | `@clerk/express` | Live tenant providers OPS |
| Clerk Next middleware | Yes | `banco-web|website/middleware.ts` | Yes | fail-closed 503 on protected if no publishable key in prod | — |
| Clerk Vite SPAs | Yes | admin/dealer | Yes | `VITE_CLERK_*` bake | — |
| Clerk Expo | Yes | mobile | Yes | `EXPO_PUBLIC_CLERK_*` | Device QA |
| Clerk FAPI proxy | Yes | `/api/__clerk` | Yes | optional custom domain | — |
| requireAuth / optionalAuth / requireDbUser | Yes | `middlewares/authGuard.ts` | Yes | — | — |
| requireDealerRole / requireAdminRole / requirePermission | Yes | authGuard + `lib/permissions.ts` | Yes | staff matrix | — |
| Account delete | Yes | `DELETE /api/v1/users/me` + UserService | Yes | comment/review notif scrub on tip | Live Clerk delete lag |

**Permissions enum:** `artifacts/api-server/src/lib/permissions.ts` — staff roles including `owner` with full `PERMISSIONS` list (admin Control Center).

---

## 8. Payments / wallet / subscriptions

| Flow | Exists | Location | Connected | Risk |
|------|--------|----------|-----------|------|
| Paymob Intention + HMAC webhook | Yes | `lib/paymentProvider.ts`, `routes/v1/payments.ts` | Yes | Live webhook + `PUBLIC_API_BASE_URL` OPS |
| Wallet topup / balance / promo | Yes | `routes/v1/wallet.ts` + services | Yes | — |
| Subscriptions subscribe/confirm/cancel | Yes | `routes/v1/subscriptions.ts` | Yes | — |
| Billing invoices/PDF/report | Yes | `routes/v1/billing.ts` | Yes | — |
| Admin payment config (encrypted) | Yes | admin routes + `payment_provider_config` | Yes | needs `PAYMENT_CONFIG_ENCRYPTION_KEY` |
| Unsigned first-bind TOFU | Residual | webhook merchant_order_id path | Documented HIGH deferred | **No invention** — Phase 2/3 only with evidence |

---

## 9. Marketplace / B2B / documents / dashboards

| Capability | Exists | Surfaces | Connected | Notes |
|------------|--------|----------|-----------|-------|
| Listings marketplace | Yes | mobile, web, dealer, admin | Yes | categories car/RE/industrial |
| Search + map clusters + facets | Yes | API + mobile + web | Partial | Facets ignore `market_country` (MED deferred) |
| Saves / leads / contact | Yes | mobile, dealer, web | Yes | — |
| Chat | Yes | mobile, web workspace | Yes | — |
| Stories | Yes | mobile | Yes | — |
| RFQ | Yes | mobile + dealer + API | Yes | — |
| Global supply | Yes | mobile + dealer + API | Yes | — |
| Investments | Yes | mobile + dealer + API | Yes | — |
| Company profiles / follow | Yes | mobile + API | Yes | — |
| Car import orders | Yes | mobile + dealer + API | Yes | Discover entry may be browse-only |
| Financing CRM | Yes | API + admin + FI seats | Yes | — |
| Admin dashboards | Yes | admin-os 20 routes | Yes | — |
| Dealer dashboards | Yes | dealer-os 16 routes | Yes | — |
| Web seller workspace | Yes | `/workspace/*` | Yes | plug kill-switch |
| Document wallet (as separate product module) | **Not found as named module** | — | — | Invoices/PDF exist under billing; no separate “document wallet” package — **missing evidence / naming** for a distinct product |
| KYC | Partial | `business/verification` mobile + company flows | Code exists | Live KYC provider evidence **missing** — inventory as in-app verification UX, not external KYC SaaS |

---

## 10. Uploads / media / storage / CDN

| Item | Exists | Location | Connected | Risk |
|------|--------|----------|-----------|------|
| Upload request/promote/verify/serve | Yes | `routes/v1/uploads.ts` | Yes | — |
| Object storage provider switch | Yes | `objectStorageProvider.ts` | Yes | Coolify must `s3` + AWS keys (VPS no IAM) |
| S3 impl | Yes | `objectStorage.s3.ts` | Yes | — |
| Replit sidecar | Yes | `objectStorage.ts` | Forbidden when Coolify markers | — |
| CDN bake | Optional | `NEXT_PUBLIC_ASSET_CDN_URL` | Optional | unset = byte-identical |
| Cache-Control discipline | Yes | Phase X tip history | Code | Live CDN OPS |

---

## 11. Notifications

| Channel | Exists | Location | Connected | Runtime |
|---------|--------|----------|-----------|---------|
| In-app notifications table + API | Yes | notifications routes/services | Yes | UNVERIFIED |
| Expo push | Yes | `PushService.ts` → exp.host | Yes | Device/APNs/FCM via Expo OPS |
| Email (Resend) | Yes | `EmailService.ts` | Optional | OPS key |
| Comment/review/message scrub on delete | Yes | UserService tip | Yes | tested |

---

## 12. Search / filters / analytics / monitoring / logging

| Item | Exists | Connected | Notes |
|------|--------|-----------|-------|
| Search API + contract | Yes | Yes | soft-launch web LIVE default `false` |
| Facets | Yes | Partial | no `market_country` param |
| Map clusters | Yes | Flag-gated on web | needs Maps key + LIVE |
| Admin analytics/fraud/monitoring/alerts | Yes | admin-os routes + API admin | UNVERIFIED live |
| Pino logging | Yes | api-server logger | `LOG_LEVEL`, `LOG_DIR` |
| Error webhook | Yes | `ERROR_ALERT_WEBHOOK` | optional |
| Health/readyz deploy pin | Yes | `GIT_SHA`/`BUILD_ID` | Coolify wired on tip |

---

## 13. Feature flags / plugs (inventory)

| Flag / env | Default | Effect | State |
|------------|---------|--------|-------|
| `WEB_PLUG_ENABLED` | true | website maintenance kill-switch | production |
| `NEXT_PUBLIC_WEB_SEARCH_LIVE` | false | live vs preview search | intentional soft-launch |
| `NEXT_PUBLIC_WEB_SEARCH_MAP` | false | map live | soft-launch |
| `NEXT_PUBLIC_WEB_MARKET_COPY` | false | B2B copy panels | soft-launch |
| `NEXT_PUBLIC_SEARCH_ENABLED` | true | search UI | production |
| `OBJECT_STORAGE_PROVIDER` | replit (dev) / must s3 on Coolify | uploads | production gate |
| `PAYMOB_MODE` | test | PSP | OPS flip live |

---

## 14. Deployment / CI / infrastructure

| Pipeline | Exists | Location | Connected to tip | Notes |
|----------|--------|----------|------------------|-------|
| Coolify Compose SoT | Yes | `docker-compose.coolify.yml` + `deploy/coolify/*` | Yes | api, migrate, banco-web, banco-website, web(nginx), postgres |
| Generic prod compose | Yes | `docker-compose.prod.yml` | Yes (parity wave) | — |
| AWS Docker / EB | Yes | `deploy/aws/*`, root `Dockerfile`, `.ebextensions` | Secondary | — |
| GCP Cloud Build | Yes | `deploy/gcp/*`, root `cloudbuild.yaml` | Secondary | validation pin wired on tip |
| EAS mobile | Yes | `artifacts/banco-mobile/eas.json` | Yes | not Coolify |
| GitHub Actions | Yes | `.github/workflows/{ci,ci-website,ci-website-docker,deploy,sync-*}.yml` | Yes | Coolify website Docker job on tip |
| Cloudflare | Stub only | `wrangler.toml` → stub-worker | Explicit non-SoT | — |
| Vercel api-server | Config disabled | `git.deploymentEnabled: false` | Intentional | Coolify hosts API |

### Coolify services map

| Service | Port/path | Image |
|---------|-----------|-------|
| postgres | internal | postgres:16 |
| migrate | profile | API builder + drizzle push |
| api | 127.0.0.1:8080 | Dockerfile.api |
| banco-web | 3000 | frozen twin |
| banco-website | 3001 | canonical Next |
| web | 80 | landing + /market + /admin + /api proxy |

---

## 15. Secrets / environment (names only)

**Evidence:** `.env.example`, `docker-compose.coolify.yml`, `docs/DEPLOY_COOLIFY.md`, platform env examples.

**Required class (API boot / Coolify):**  
`DATABASE_URL` or `POSTGRES_*`, `CLERK_SECRET_KEY`, `SESSION_SECRET`, `PAYMENT_CONFIG_ENCRYPTION_KEY`, and for uploads on VPS: `OBJECT_STORAGE_PROVIDER=s3`, `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, prefixes.

**Auth public:** `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_*`, `EXPO_PUBLIC_CLERK_*`, `VITE_CLERK_*`.

**Payments:** `PAYMOB_*`, `PUBLIC_API_BASE_URL`.

**Optional:** `RESEND_*`, `OPENAI_*`, `ERROR_ALERT_WEBHOOK`, Maps, store URLs, `WEB_PLUG_ENABLED`, deploy pin `GIT_SHA`/`SOURCE_COMMIT`.

**Runtime:** secret **values** UNVERIFIED in this Phase 1 (inventory of names/wiring only).

---

## 16. Tests / gates (inventory of verification tools — not Phase 4 execution)

| Gate | Location | Last living result on tip (pre-Phase-1) |
|------|----------|----------------------------------------|
| chain-integrity | `scripts/chain-integrity-gate.mjs` | **164/164 PASS** |
| API vitest | api-server | **385 passed / 3 skipped** |
| production-confidence | `scripts/production-confidence-check.mjs` | **14/14 PASS** |
| mobile node tests | `artifacts/banco-mobile/tests/*` | **148/148** (prior wave) |
| Website audits | many `scripts/website-*.mjs` | tooling present |

Phase 1 does **not** re-certify production; Phase 4 will.

---

## 17. Dual / frozen / disconnected / deferred (honesty map)

| Item | Classification | Evidence |
|------|----------------|----------|
| banco-web + banco-website both in Coolify | intentional dual until owner cutover | FROZEN.md, compose, ledger B-07 |
| site-env defaults `/dealer-os` `/admin-os` | Replit-oriented fallback; Coolify expects bake `BANCO_WEB_*` | `site-env.ts`; nginx 301 aliases |
| OpenAPI missing payments/readyz/livez | spec vs Express gap | openapi.yaml vs routes |
| Facets ignore `market_country` | deferred MED | cert 19 + SearchService |
| Paymob unsigned first-bind TOFU | deferred HIGH | cert 19 — no invention |
| WEB_SEARCH_LIVE default false | intentional soft-launch | search-config + compose |
| dealer-os `not-found` page unused | possible disconnect | pages vs App.tsx Switch |
| Named “document wallet” product module | **not found** as package | billing invoices only — naming gap |
| External KYC SaaS | **not evidenced** | in-app verification screens only |
| Redis | **not present** | forbidden invent per prior policy |
| Live Coolify/EAS/Paymob/Clerk providers | OPS UNVERIFIED | Phase 4 |

---

## 18. Production map (one diagram)

```text
                    ┌─────────────────────────────────────────┐
                    │         Coolify Hostinger VPS           │
                    │  postgres → migrate(push) → api:8080    │
                    │       ↑ cron jobs in API process        │
                    │  banco-website:3001 (canonical Next)    │
                    │  banco-web:3000 (FROZEN twin)           │
                    │  web:80 nginx → / /market /admin /api   │
                    └───────────────┬─────────────────────────┘
                                    │ /api
                    ┌───────────────┴─────────────────────────┐
                    │ Clerk · Paymob · S3 · Resend · Expo Push│
                    │ OpenAI (optional)                        │
                    └───────────────┬─────────────────────────┘
                                    │
         ┌──────────────┬───────────┴──────────┬──────────────┐
         │              │                      │              │
   banco-mobile    admin-os              dealer-os        landing
   (EAS)           (/admin/)             (/market/)       (/)
         │              │                      │              │
         └──────────────┴──────────┬───────────┴──────────────┘
                                   │
                     lib: db · api-spec → api-zod · api-client-react
                          taxonomy · search-contract · design-tokens
```

---

## 19. Phase 1 counts (evidence-backed)

| Category | Count |
|----------|-------|
| Workspace packages (artifacts+lib+scripts+root) | **18** |
| Production apps (excl. mockup) | **7** (+1 frozen twin counted) |
| Mobile routes | **53** |
| Next pages per consumer app | **48** |
| Admin routes | **20** |
| Dealer routes | **16** |
| API v1 route modules | **30** (+ health + SEO) |
| Express handler registrations (routes/) | **~170** |
| OpenAPI paths / ops | **136 / 162** |
| DB tables | **70** |
| Cron jobs | **6 + 1 startup** |
| Coolify compose services | **6** (postgres, migrate, api, banco-web, banco-website, web) |
| GH workflows | **6** |

---

## 20. PHASE 1 VERDICT

**Inventory complete for tip `2340c97`.**

- The production system is a **pnpm monorepo** with Coolify as the documented API/web host and EAS for mobile.
- Most major modules are **present and source-connected**.
- Remaining uncertainty is dominated by **OPS/runtime**, **owner cutover**, and **explicitly deferred** residuals — not by absence of an entire application tier.

**This Phase did not repair, refactor, or optimize.**

---

## STOP — AWAITING OWNER APPROVAL

**Next phase (only after your explicit approval):**  
**PHASE 2 — PRODUCTION LIFECYCLE AUDIT** (still no repair).

Reply with approval to proceed to Phase 2, or request deeper inventory on a specific domain first.
