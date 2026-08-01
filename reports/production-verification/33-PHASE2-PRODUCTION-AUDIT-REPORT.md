# PHASE 2 — PRODUCTION AUDIT REPORT (OFFICIAL)

**SoT:** `waelzaid66-max/banco-with-wael`  
**Tip:** `3ef1b44` (`cursor/w41-production-release-5cf0`)  
**Baseline inventory:** `32-PHASE1-PRODUCTION-INVENTORY.md`  
**Detail annexes (same phase, read-only):**  
- `33-PHASE2-AUTH-LIFECYCLE-AUDIT.md`  
- `33-PHASE2-LIFECYCLE-AUDIT.md` (money / marketplace / search / uploads / notify / B2B / admin / cron / health)

**Phase rule:** Audit only. **No repairs. No invention. No Phase 3.**  
**Runtime:** Code-path evidence only. Live Coolify / EAS / Paymob / Clerk Dashboard / devices = **UNVERIFIED** unless noted.

---

## 0. Method

1. Reconstruct dependency graphs from Phase 1 map.  
2. Trace each lifecycle through API routes → services → clients → compose/docs.  
3. Classify with repository evidence only.  
4. Cap speculation (≤3 hypotheses, labeled).  
5. Prefer **OPS-dependent** / **deferred** over inventing bugs.

### Classification legend

| Label | Meaning |
|-------|---------|
| **complete** | End-to-end source wiring for that lifecycle/surface |
| **partial** | Present but incomplete across surfaces or steps |
| **disconnected** | Producer/consumer or contract mismatch |
| **missing** | No implementation found where expected |
| **deferred** | Explicit residual in cert 19 / ledger 31 |
| **OPS-dependent** | Code ready; live success needs secrets/host/device/tenant |

---

## 1. Executive lifecycle matrix

| Domain | Lifecycle set | Classification | One-line evidence verdict |
|--------|---------------|----------------|---------------------------|
| Auth | Register / login / logout | **complete** + OPS tenant | Clerk mobile custom + hosted web/SPA; API `clerkMiddleware` |
| Auth | Session / token cache | **partial** | SecureStore mobile; cookies web; `ACCOUNT_DELETED` auto-signOut **mobile-only** |
| Auth | Forgot password | **partial** / OPS | Mobile custom email reset; web via Clerk hosted |
| Auth | Email / phone verify | **partial** | Email OTP mobile; phone collect ≠ signup verify |
| Auth | MFA | **partial** / OPS | Mobile challenge UI; enrollment UI insufficient evidence; hosted OPS |
| Auth | Account delete | **partial** | API + OpenAPI + mobile UI; **no** website/admin/dealer delete UI; no undelete |
| Auth | AuthGate / guards | **complete** | Soft gate mobile; Next middleware; admin/dealer role guards |
| Auth | Social OAuth | **OPS-dependent** | Mobile SSO + fail-closed provider probe |
| Payments | Intention → webhook settle/reverse | **partial** + **deferred** TOFU + OPS | Code complete; unsigned first-bind residual HIGH |
| Wallet | Balance / tx / promo | **complete** + OPS settle | Promo ledger separate intentional |
| Listings | Create→edit→bump→archive→sold→delete→tombstone | **complete** (draft unused = partial) | Create publishes `active`; draft enum unused |
| Search | Search/map/trending/facets | **partial** / facets **deferred** | Facets ignore `market_country` (MED) |
| Uploads | request→promote→verify→serve | **complete** + OPS S3 | Coolify forbids replit; needs static AWS keys |
| Notifications | In-app + Expo push | **complete** + OPS push | Register/send wired |
| Chat | Conversations/messages | **complete** | Routes + notify on send |
| B2B | RFQ / supply / import / investments / financing | **complete** (+ import UX / FI OPS partial) | API FSMs wired |
| Admin | Moderation/support/payments/promo/financing | **complete** + OPS payment config | Admin OS ↔ `/api/v1/admin` |
| Cron | 6 scheduled + startup | **complete** + email OPS | Advisory locks `48150001–007` |
| Health / migrate | healthz/livez/readyz + push migrate | **complete** + migrate OPS | readyz fail-closed without money tables |

---

## 2. Proven issues (evidence-backed only)

### Critical / High (production risk)

| ID | Finding | Class | Evidence | Surfaces |
|----|---------|-------|----------|----------|
| P2-H1 | Paymob **unsigned first-bind TOFU** — webhook may fall back to unsigned `merchant_order_id` when Intention omits order id | **deferred HIGH** | `paymentsController.ts` `boundIntentId ?? verification.intentId`; `paymentProvider.verifyPaymobWebhook`; cert 19 | API money |
| P2-H2 | Coolify uploads **fail at runtime** without `OBJECT_STORAGE_PROVIDER=s3` + static AWS keys | **OPS-dependent** | `objectStorageProvider.ts`; compose env; ledger | Uploads all clients |
| P2-H3 | Fresh DB without migrate profile → `/api/readyz` money_schema **503** (API does not depend_on migrate) | **OPS-dependent** | `health.ts`; `docker-compose.coolify.yml` migrate profile | Deploy |

### Medium

| ID | Finding | Class | Evidence | Surfaces |
|----|---------|-------|----------|----------|
| P2-M1 | Facets API **ignores `market_country`** while search/trending honor it | **disconnected** + **deferred MED** | `FacetsQuerySchema` category-only; `getFacets(category?)`; cert 19 | Search chips |
| P2-M2 | `ACCOUNT_DELETED` auto-signOut handler registered **only on mobile** | **partial** | `banco-mobile/app/_layout.tsx` `setAuthFailureHandler`; client supports it in `custom-fetch.ts`; **absent** on website/web/admin/dealer | Web/SPA after delete |
| P2-M3 | Account delete UI **mobile-only** (API exists for all) | **partial** | `settings.tsx` + `DeleteAccountModal`; no `deleteAccount` usage in website/web/admin/dealer | Web compliance asymmetry |
| P2-M4 | OpenAPI omits `/payments`, `/readyz`, `/livez` | **partial** (spec gap) | Phase 1; openapi vs Express | Client codegen / docs |
| P2-M5 | Dual `banco-web` + `banco-website` still both Coolify services | **intentional** cutover | FROZEN.md; compose B-07 | Deploy hygiene |
| P2-M6 | Web search LIVE/MAP default **false** | **intentional** soft-launch | `search-config.ts`; compose defaults | Consumer web search |
| P2-M7 | Landing DomainRouter absolute hops to `banco.today/dealer-os` + `/banco-mobile` vs Coolify `/market` PATHS | **disconnected** path dualism (**hypothesis** until live nginx) | `landing/src/App.tsx`; nginx 301 aliases exist for `/dealer-os`→`/market` | Landing domains |
| P2-M8 | Listing `draft` status unused (create always `active`) | **partial** | `ListingService.createListing`; enum has draft | Product unused path |
| P2-M9 | dealer-os `pages/not-found.tsx` exists but **not registered** in `App.tsx` Switch | **disconnected** (orphan UI) | `dealer-os/src/pages/not-found.tsx`; no Switch import | Dealer SPA |

### Low

| ID | Finding | Class | Evidence |
|----|---------|-------|----------|
| P2-L1 | Phone collected on signup without dedicated phone verify lifecycle | **partial** | mobile profile signup |
| P2-L2 | MFA enrollment management UI insufficient evidence beyond sign-in challenge | **partial** / OPS | profile MFA challenge |
| P2-L3 | Weekly dealer email cron has weak durable per-week send ledger (prior residual) | **OPS** / residual | `weeklyReports.ts`; 17-HIDDEN-DEFECTS |
| P2-L4 | Recommendations = trending fallback (no deep personalization) | **partial** by design | `getRecommendations` |
| P2-L5 | Cron/dealer-performance is log-only (not persisted dashboard) | **complete** as coded | `dealerPerformance.ts` |

---

## 3. What is NOT broken (avoid false work in Phase 3)

| Area | Why leave alone without new evidence |
|------|--------------------------------------|
| Paymob TOFU | Explicit **no invention** — needs signed correlation design / live Intention payload |
| Facets market_country | Needs OpenAPI + schema + client contract expansion — owner/product decision |
| Dual Next apps | Owner cutover only |
| Search LIVE false | Soft-launch intentional |
| Social OAuth empty tenant | Fail-closed by design; Dashboard OPS |
| Redis / MFA TOTP enroll UI invent / Clerk inbound delete | Forbidden invent per prior policy |
| Money settle via confirm endpoints | **By design** poll-only; webhook is SoT |

---

## 4. Coverage summary (Phase 2)

| Bucket | Count (approx) |
|--------|----------------|
| Lifecycles audited (auth + domains A–K) | **~25** |
| Classified **complete** (code) | Majority of money/listings/chat/upload/notify/B2B/admin/cron |
| Classified **partial** | Auth surface asymmetry, draft unused, phone verify, MFA enroll evidence |
| Classified **disconnected** | Facets market, dealer not-found orphan, landing hop dualism (hyp.) |
| Classified **deferred** | Paymob TOFU HIGH, facets MED |
| Classified **OPS-dependent** | S3 keys, migrate, Paymob live, Clerk tenant, EAS/push, email |

**Production readiness implication:** Source graph is largely coherent. Remaining blockers for FULL CERT are dominated by **OPS/device** + **explicit deferred HIGH/MED** — not missing auth/API tiers.

---

## 5. Speculation cap (≤3 hypotheses)

1. Landing absolute hops may miss Coolify path map without live nginx proof (301s exist for `/dealer-os`→`/market`; `/banco-mobile` has no nginx alias).  
2. Web users with tombstoned DB + lingering Clerk JWT see repeated 401 until manual sign-out (missing `setAuthFailureHandler`).  
3. Social OAuth enablement without redirect URI allowlist fails at runtime (standard Clerk config — not proven broken in source).

---

## 6. Annex index

| File | Scope |
|------|-------|
| `33-PHASE2-AUTH-LIFECYCLE-AUDIT.md` | Auth lifecycles 1–11 detailed tables |
| `33-PHASE2-LIFECYCLE-AUDIT.md` | Payments→Health domains A–K detailed tables |

---

## PHASE 2 VERDICT

**Lifecycle audit complete for tip `3ef1b44`.**

Major production lifecycles are **source-connected**. Explicit open classes:

- **Deferred HIGH:** Paymob unsigned first-bind TOFU  
- **Deferred/disconnected MED:** Facets `market_country`  
- **Partial (code asymmetry):** Web delete UI + tombstone auto-signOut  
- **OPS-dependent:** S3, migrate, live Paymob/Clerk/EAS/push  
- **Owner:** Dual web cutover  

**This Phase did not repair, refactor, or invent.**

---

## STOP — AWAITING OWNER APPROVAL

**Next phase (only after your explicit approval):**  
**PHASE 3 — PRODUCTION RECOVERY**  
Repair **only** issues proven above, priority reconnect/rewire, no speculative redesign.

Reply with approval to proceed to Phase 3, or prioritize which finding IDs (e.g. P2-M2/M3 only) may be repaired first.
