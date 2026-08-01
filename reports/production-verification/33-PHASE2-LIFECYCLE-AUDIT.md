# PHASE 2 — PRODUCTION LIFECYCLE AUDIT

**SoT repository:** `waelzaid66-max/banco-with-wael`  
**Tip audited:** `3ef1b44` (inventory tip cited as `2340c97` in Phase 1)  
**Baselines:** `32-PHASE1-PRODUCTION-INVENTORY.md`, `19-FINAL-PRODUCTION-CERTIFICATION.md`, `31-PRODUCTION-RECOVERY-LEDGER.md`  
**Phase rule:** Lifecycle audit only. **No repairs. No invention.**  
**Runtime:** Code-path evidence only — live Coolify/EAS/Paymob/device remain **UNVERIFIED**.

### Classification legend

| Term | Meaning |
|------|---------|
| **complete** | End-to-end source path wired (create → settle/serve/notify as applicable) |
| **partial** | Core path exists; a step is incomplete, soft-launch gated, or cross-market inconsistent |
| **disconnected** | Module exists but contract/handler/consumer do not align |
| **missing** | No evidenced implementation for a named step |
| **deferred** | Explicit residual in cert 19 / ledger 31 — no invention this wave |
| **OPS-dependent** | Code ready; live success needs secrets/host/device |

---

## A. Payments

| Step | Coverage | Broken/disconnected | Classification | Evidence | Root cause (if evidenced) |
|------|----------|---------------------|----------------|----------|---------------------------|
| Create intention (Paymob) | `createProviderCharge` → `POST {apiBase}/v1/intention/` with `notification_url` / `redirection_url`; requires https `PUBLIC_API_BASE_URL` | — | **complete** (code) + **OPS-dependent** (creds/callback host) | `artifacts/api-server/src/lib/paymentProvider.ts` (`createProviderCharge`, `requireConfig`); called from `PaymentIntentService.createTopupIntent` / `SubscriptionService` | Fail-closed without https callback |
| Webhook settle | `POST /api/v1/payments/webhook` — HMAC verify → amount/currency guards → `claimPaymobOrderForIntent` → settle or reverse | Not in OpenAPI | **complete** (code) + **OPS-dependent** (live webhook) | `routes/v1/payments.ts`; `controllers/paymentsController.ts`; OpenAPI has **no** `/payments` (Phase 1 §4) | Spec/Express gap — not a runtime disconnect |
| Return URL | `GET /api/v1/payments/return` HTML “Payment received”; **does not settle** | Client must poll confirm | **complete** (informational by design) | `paymentsController.paymentReturnHandler`; comments in same file | Settlement is webhook-only |
| Topup create | `POST /api/v1/wallet/topup` → `createTopupIntent` → intention + optional pre-bind `paymob_order_id` | — | **complete** | `routes/v1/wallet.ts`; `PaymentIntentService.createTopupIntent`; mobile `app/wallet.tsx` | — |
| Topup confirm | `POST /api/v1/wallet/topup/:id/confirm` → `getTopupIntentStatus` **read-only** (never settles) | — | **complete** (poll-by-design) | `walletController.confirmTopupHandler`; `PaymentIntentService.getTopupIntentStatus` | Money only via webhook |
| Subscribe | `POST /api/v1/subscriptions` → PSP intention | — | **complete** | `routes/v1/subscriptions.ts`; `subscriptionController.subscribeHandler`; mobile `app/plans.tsx` | — |
| Subscription confirm | `POST /api/v1/subscriptions/intents/:id/confirm` (status poll) | — | **complete** (poll-by-design) | `subscriptionController.confirmSubscriptionHandler` | Same webhook SoT |
| Cancel subscription | `POST /api/v1/subscriptions/cancel` | — | **complete** | `routes/v1/subscriptions.ts` | Period end / no immediate refund (service comments) |
| Refund / void reversal | Webhook `isRefunded`/`isVoided` → `reverseTopupAfterPspReversal` / `reverseSubscriptionAfterPspReversal`; partial clawback | Shortfall flags ops | **complete** (code) + **OPS-dependent** (manual shortfall) | `paymentsController` reverse branch; `PaymentIntentService.reverseTopupAfterPspReversal`; Round 14–16 tests; cert 19 | Wallet may lack funds → `psp_reversal_shortfall` |
| Paymob TOFU residual | Prefer `findIntentIdByPaymobOrderId`; else fall back to **unsigned** `merchant_order_id` / `extras.intent_id`; pre-bind when Intention returns `intention_order_id` | First webhook before bind if Paymob omits order id at intention time | **deferred** (HIGH) | `paymentProvider.verifyPaymobWebhook` (intent from unsigned fields); `checkoutBoundPaymentMetadataSql` only sets `paymob_order_id` when `providerOrderId` present; cert 19 / ledger 31 | Needs signed correlation / order fetch — **no invention** |

**Domain verdict A:** **partial** overall — money paths complete in code; TOFU deferred; live Paymob **OPS-dependent**; OpenAPI omits payments.

---

## B. Wallet

| Step | Coverage | Broken/disconnected | Classification | Evidence | Root cause |
|------|----------|---------------------|----------------|----------|------------|
| Balance | `GET /api/v1/wallet` → `getWalletBalance` | — | **complete** | `routes/v1/wallet.ts`; `WalletService` | — |
| Transactions ledger | `GET /api/v1/wallet/transactions` | — | **complete** | same; `applyTransaction` chokepoint in `WalletService.ts` | — |
| Topup credit | Webhook → `settleTopupIntent` → `applyTransaction` credit | Confirm endpoint does not credit | **complete** | `PaymentIntentService.settleTopupIntent` | Design: webhook SoT |
| Promo grants | Cron `promo-ad-credit` + admin renew; separate from wallet money | Promo ≠ wallet | **complete** (virtual credit path) | `PromoAdCreditService.runPromoAdCreditCycle`; `GET /wallet/promo`; admin `/promo-campaign*` | Intentional separate ledger (`promo_ad_*` tables) |
| Promo consume | Boost spends promo first then wallet | — | **complete** | `AdsService` + tests | — |

**Domain verdict B:** **complete** (code) + promo/wallet separation intentional; live settle **OPS-dependent**.

---

## C. Marketplace listings

| Step | Coverage | Broken/disconnected | Classification | Evidence | Root cause |
|------|----------|---------------------|----------------|----------|------------|
| Create | `POST /api/v1/listings` → insert `status: "active"` + media + attrs | — | **complete** | `ListingService.createListing` (~L339); journey tests | — |
| Publish (separate) | No draft→publish API step; create is publish | Enum includes `draft` unused on create | **partial** / **missing** as distinct step | `listingStatusEnum` has `draft`; create hardcodes `"active"` | Product never wired draft flow |
| Edit | `PATCH /api/v1/listings/:id` including media replace + status | — | **complete** | `ListingService.updateListing`; `update.test.ts` | — |
| Media upload | Upload claim path then listing persists URLs (see E) | — | **complete** (wired into create/update) | create/update media asserts + promote ACL | — |
| Bump | `POST /api/v1/listings/:id/bump` — cooldown on `bumped_at` | Inactive/flagged/shadow-banned blocked | **complete** | `ListingService.bumpListing`; `bump.test.ts` | — |
| Archive | Owner `status: "archived"` via patch; cron archives stale active | — | **complete** | `updateListing`; `jobs/archiveListings.ts` (90d) | — |
| Sold | Owner `status: "sold"` via patch; price observation side-effect | — | **complete** | `updateListing` sold branch; `update.test.ts` | — |
| Delete | `DELETE` → **hard** `db.delete(listings)` | Not soft-delete | **complete** (hard delete) | `ListingService.deleteListing` | Soft-delete is on **users**, not listings |
| Tombstone (public hide) | Public surfaces gate flagged + shadow-ban + `users.deletedAt` | Seller soft-delete / ban hides inventory | **complete** | `lib/feedVisibility.publicVisibilityConditions`; detail visibility tests; Round 16 tombstone gates | “Tombstone” = visibility contract, not listing soft-row |

**Domain verdict C:** **complete** for active marketplace lifecycle; **partial** only for unused `draft` status.

---

## D. Search / filter / facets / map / trending

| Step | Coverage | Broken/disconnected | Classification | Evidence | Root cause |
|------|----------|---------------------|----------------|----------|------------|
| Search | `GET /api/v1/search` — filters incl. `market_country` | Web LIVE default false | **complete** (API) + **OPS-dependent** / soft-launch (web) | `searchController.searchHandler`; `SearchService` L199–206; compose `NEXT_PUBLIC_WEB_SEARCH_LIVE:-false` | Intentional soft-launch (ledger 31) |
| Map clusters | `GET /api/v1/search/map` — same `parsedFromSearchQuery` (incl. market) | Web map flag default false; Maps key OPS | **complete** (API) + **OPS-dependent** | `mapClustersHandler`; `mapClusters` uses `buildAttributeConditions` | Soft-launch + key |
| Facets | `GET /api/v1/search/facets?category=` only | **Ignores `market_country`** — chip counts cross-market | **disconnected** + **deferred** (MED) | `FacetsQuerySchema` category-only; `getFacets(category?)`; OpenAPI facets params = category only; search/trending OpenAPI **have** `market_country` | Contract never expanded — cert 19 / ledger 31 |
| Trending | `GET /api/v1/search/trending?market_country=` | — | **complete** | `searchController` trending; `getTrending` | — |
| Recommendations | Same market filter; falls back to trending | — | **partial** (no personalization beyond trending) | `getRecommendations` → `getTrending` | Evidenced fallback, not a break |
| Autocomplete | `GET /api/v1/search/autocomplete` | — | **complete** | route + handler | — |

**Domain verdict D:** **partial** — search/map/trending market-aware; **facets market_country gap is the cert-deferred MED disconnect**.

---

## E. Uploads / storage

| Step | Coverage | Broken/disconnected | Classification | Evidence | Root cause |
|------|----------|---------------------|----------------|----------|------------|
| request-url | `POST /api/v1/uploads/request-url` → presign + claim | — | **complete** | `routes/v1/uploads.ts`; `uploadController.requestUploadUrlHandler` | — |
| promote | `POST /api/v1/uploads/promote` → public ACL | — | **complete** | `promoteUploadHandler` | — |
| verify | `POST /api/v1/uploads/verify` | — | **complete** | `verifyUploadHandler` | — |
| serve | `GET /api/v1/uploads/objects/*path` + ACL / legacy listing media | — | **complete** | `serveObjectHandler`; `isLegacyListingMedia` | — |
| Provider switch | `OBJECT_STORAGE_PROVIDER=s3\|replit` | `replit` **forbidden** when Coolify markers set | **complete** (fail-closed) | `objectStorageProvider.ts` L106–120; tests | Coolify must use s3 |
| S3 vs Replit | S3: `objectStorage.s3.ts` needs `AWS_REGION` + `S3_BUCKET` (+ keys on VPS) | Without keys on Coolify uploads fail at runtime | **OPS-dependent** | compose coolify passes `AWS_ACCESS_KEY_ID`, `S3_BUCKET`, `OBJECT_STORAGE_PROVIDER`, `COOLIFY_URL`/`FQDN`; ledger §4 | VPS has no IAM role — static keys required |
| Coolify keys | Env wired in compose; values UNVERIFIED | — | **OPS-dependent** | `docker-compose.coolify.yml` ~L142–152; Phase 1 §10/15 | Live secret presence not inventable |

**Domain verdict E:** **complete** code path; production uploads **OPS-dependent** on s3 + static AWS keys.

---

## F. Notifications + push

| Step | Coverage | Broken/disconnected | Classification | Evidence | Root cause |
|------|----------|---------------------|----------------|----------|------------|
| In-app create/list/read | `NotificationService.createNotification`; `GET/POST /notifications` | — | **complete** | `routes/v1/notifications.ts`; service | — |
| Push token register | `POST /api/v1/notifications/push-token` | — | **complete** | route; `PushService.registerPushToken`; mobile `hooks/usePushNotifications.tsx` | — |
| Unregister | `DELETE` + mobile best-effort on logout | — | **complete** | route; `unregisterPushBestEffort.ts` | — |
| Expo send | `sendPushToUser` → `https://exp.host/--/api/v2/push/send` after create | No server Expo secret (token-based) | **complete** (code) + **OPS-dependent** (APNs/FCM via Expo) | `PushService.ts`; cert 19 device residual | Device/EAS UNVERIFIED |
| Types | message, lead, rfq, payment_*, booking, car_import, etc. | Comment author scrub residual (MED) historically closed on tip for delete | **complete** with prior MED privacy notes | `NotificationService` type union; ledger comment-scrub | — |

**Domain verdict F:** **complete** wiring; delivery **OPS-dependent**.

---

## G. Chat messages

| Step | Coverage | Broken/disconnected | Classification | Evidence | Root cause |
|------|----------|---------------------|----------------|----------|------------|
| List / create conversation | `GET/POST /api/v1/conversations` | Tombstone listing gates on create | **complete** | `routes/v1/conversations.ts`; `ConversationService` | — |
| Messages get/send | `GET/POST .../messages` | Notifies via `createNotification` | **complete** | `sendMessage` → notification; social/tests | — |
| Read / delete / reply / media | Routes present | — | **complete** | conversations router lines 16–27 | — |

**Domain verdict G:** **complete**.

---

## H. RFQ / global-supply / import-orders / investments / financing (brief)

| Domain | Coverage | Broken/disconnected | Classification | Evidence |
|--------|----------|---------------------|----------------|----------|
| RFQ | list/create/mine/get + offer + accept; shadow-ban / deleted gates | — | **complete** | `routes/v1/rfqs.ts`; `RfqService.ts` |
| Global supply | list/create/mine/get + respond; shadow-ban on respond | — | **complete** | `routes/v1/global-supply.ts`; `GlobalSupplyService.respondToRequest` |
| Import orders | create / mine / get / patch stage / cancel; stage FSM | Discover CTA may be browse-only (product residual, Phase 1) | **complete** (API) + **partial** (entry UX residual) | `ImportOrderService` stage map; routes |
| Investments | list/create/mine/get/patch + interest | — | **complete** | `routes/v1/investments.ts`; `InvestmentService` |
| Financing | FI inbox + patch; admin intermediaries/branches/seats/requests | Seat/Clerk OPS for bank users | **complete** (code) + **OPS-dependent** | `routes/v1/financing.ts`; `FinancingService`; admin financing routes |

**Domain verdict H:** **complete** API lifecycles; import entry / FI seats may be **OPS/product partial**.

---

## I. Admin moderation / support / payments config

| Area | Coverage | Broken/disconnected | Classification | Evidence |
|------|----------|---------------------|----------------|----------|
| Moderation queue | `GET .../moderation/queue` + `POST .../listings/:id/moderate` | Admin OS page wired | **complete** | `routes/v1/admin.ts`; `admin-os/pages/moderation.tsx` |
| Reports | list + resolve | — | **complete** | admin routes |
| Support tickets | list/get/respond/resolve | — | **complete** | admin routes; `support` consumer routes exist |
| Payment config | get/put/test encrypted DB config | Needs `PAYMENT_CONFIG_ENCRYPTION_KEY` | **complete** + **OPS-dependent** | admin payment-config; `admin-os/pages/settings.tsx` |
| Email / promo / plans | config + promo campaign renew + plans CRUD | — | **complete** | admin.ts L98–127 |
| Financing admin | requests + intermediaries + branches + seats | — | **complete** | admin.ts L105–115 |

**Domain verdict I:** **complete** (source-connected Admin OS ↔ API).

---

## J. Cron jobs lifecycle

| Job | Schedule (Africa/Cairo default) | What it does | Advisory lock | Classification | Evidence |
|-----|--------------------------------|--------------|---------------|----------------|----------|
| archive-old-listings | daily 03:00 | Active → archived if `createdAt` > 90d | `48150001` | **complete** | `jobs/index.ts`; `archiveListings.ts` |
| expire-subscriptions | daily 02:00 | Expire lapsed subs; archive overflow listings to baseline cap | `48150003` | **complete** | `subscriptionExpiry.ts` |
| promo-ad-credit | daily 02:30 | Expire promo balances; grant monthly allowance | `48150006` (`PROMO_AD_CREDIT_LOCK_KEY`) | **complete** | `PromoAdCreditService` |
| dealer-performance | Mon 04:00 | Log per-dealer weekly metrics | `48150002` | **complete** (log-only, not persisted dashboard) | `dealerPerformance.ts` |
| weekly-reports | Mon 08:00 | Email dealer digests (Resend) | `48150004` | **complete** + **OPS-dependent** (email) | `weeklyReports.ts`; prior note: no durable per-week send ledger (`17-HIDDEN-DEFECTS`) |
| subscription-expiring-reminders | daily 09:00 | Notify subs within 3 days | `48150007` | **complete** | `subscriptionExpiringReminders.ts` |
| backfill-staff-roles | startup once | Idempotent staff role backfill | `48150005` | **complete** | `runStartupBackfills` |
| Lock mechanism | — | `pg_try_advisory_lock` / unlock on same pooled connection | `lib/advisoryLock.ts` | **complete** | Multi-instance safe skip |

**Registration:** `index.ts` long-running process only (`startScheduledJobs`); **not** on Vercel handler (Phase 1).  
**Domain verdict J:** **complete** in-process cron; weekly email send **OPS-dependent** / weak durable idempotency residual.

---

## K. Health / readyz / migrate dependency

| Probe | Coverage | Broken/disconnected | Classification | Evidence | Root cause |
|-------|----------|---------------------|----------------|----------|------------|
| `/api` liveness | Process up + deploy pin | — | **complete** | `routes/health.ts` `GET /` | — |
| `/api/healthz` | OpenAPI HealthCheckResponse | — | **complete** | health.ts | — |
| `/api/livez` | Deploy pin alias | Not in OpenAPI | **complete** (code); spec gap | health.ts; Phase 1 | — |
| `/api/readyz` | DB `SELECT 1` + money tables `payment_intents`, `transactions`, `promo_ad_transactions` | 503 if migrate not applied | **complete** (fail-closed) | health.ts L64–109; `health.test.ts` | Wrong/empty DB cannot settle money |
| API ↔ migrate | Compose `migrate` is **profile-gated** one-shot `pnpm ... push -- --force`; API `depends_on` postgres healthy **only** (not migrate) | Fresh DB without migrate → readyz money_schema down | **OPS-dependent** | `docker-compose.coolify.yml` migrate service + api depends_on; docs comment | Ops must run migrate profile after schema change |
| Boot patches | `ensureSchemaPatches` at boot (best-effort continue) | Not a substitute for push migrate | **partial** relative to full schema | `lib/bootstrap.ts` | Push remains SoT apply |
| Frontend health wait | banco-web/website `depends_on: api: service_healthy` (readyz) | — | **complete** (compose tip) | coolify compose; Round 16 OPS fix | — |

**Domain verdict K:** **complete** probes; schema readiness **OPS-dependent** on migrate profile.

---

## Cross-cutting residuals (from cert 19 / ledger 31 — still open)

| Residual | Class | Evidence |
|----------|-------|----------|
| Unsigned first-bind Paymob TOFU | **deferred** HIGH | §A; cert 19 |
| Facets ignore `market_country` | **deferred** / **disconnected** MED | §D |
| Dual banco-web / banco-website | intentional cutover | ledger B-07; FROZEN.md |
| `WEB_SEARCH_LIVE` / MAP default false | soft-launch **OPS-dependent** | compose bake defaults |
| Device/EAS/APNs/FCM/Paymob live | **OPS-dependent** UNVERIFIED | cert 19 |
| OpenAPI missing payments / readyz / livez | spec gap | Phase 1 §4; grep openapi |
| MFA delete TOTP UI | **deferred** MED | cert 19 |
| CPL fail-open insufficient funds | intentional product | cert 19 |
| Adaptive feed / rate-limit multi-instance | **OPS-dependent** (needs shared store) | cert 19 |

---

## Summary table (domains A–K)

| Domain | Classification | One-line |
|--------|----------------|----------|
| A Payments | **partial** + **deferred** TOFU + **OPS-dependent** | Intention→webhook settle/reverse complete; unsigned first-bind residual; live Paymob unverified |
| B Wallet | **complete** + **OPS-dependent** settle | Balance/tx/promo paths wired; promo separate from money |
| C Listings | **complete** (draft unused = **partial**) | Create=publish active; bump/archive/sold/delete/tombstone gates present |
| D Search | **partial** / facets **deferred** | Search/map/trending market-aware; facets category-only |
| E Uploads | **complete** + **OPS-dependent** S3 keys | request→promote→serve; Coolify forbids replit |
| F Notifications | **complete** + **OPS-dependent** push | Register + Expo send wired |
| G Chat | **complete** | Conversations/messages + notify |
| H B2B suite | **complete** (+ import UX / FI **OPS** partial) | RFQ, supply, import FSM, investments, financing |
| I Admin | **complete** + payment config **OPS** | Moderation/support/payments/promo/financing |
| J Cron | **complete** + email **OPS** | 6+1 jobs, advisory locks |
| K Health/migrate | **complete** + migrate **OPS-dependent** | readyz fails closed without money schema |

---

## PHASE 2 VERDICT

Lifecycle audit complete for tip `3ef1b44`. Major money, listing, chat, upload, notify, B2B, admin, and cron paths are **source-connected**. Explicit open items remain: **Paymob TOFU (deferred HIGH)**, **facets `market_country` (deferred MED / disconnected)**, and **OPS/device verification** (Paymob webhook, S3 keys, migrate, EAS/push, search soft-launch flags).

**This Phase did not repair, refactor, or invent.**
