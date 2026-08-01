# 03 — Backend · Database · API Audit

**Tip:** `06c709a` · Evidence from static analysis of `artifacts/api-server`, `lib/db`, `lib/api-spec`

---

## 1. Architecture

| Layer | Finding | Evidence |
|-------|---------|----------|
| Runtime | Express 5.2.x on Node 24 (Docker) | `package.json`, `deploy/coolify/Dockerfile.api` |
| Entry | Build → `dist/index.mjs`; health-first then schema ensure | `src/index.ts`, `src/app.ts` |
| Routing | Central `v1/index.ts` mounts domain routers | `src/routes/v1/index.ts` |
| Validation | Zod via `@workspace/api-zod` (generated) | deps + controllers |
| ORM | Drizzle via `@workspace/db` | schema + services |
| Auth | `@clerk/express` middleware + `authGuard` RBAC | `app.ts`, `middlewares/authGuard.ts` |
| Logging | pino / pino-http / pino-roll; request id | `lib/logger.ts`, `requestLogger.ts` |
| Errors | Envelope + `errorHandler`; 500 redaction; process crash hooks | `errorHandler.ts`, `index.ts` |
| Rate limits | public 120/min, search 60, write 30, AI 12 | `middlewares/rateLimiter.ts` |

**Verdict:** Coherent modular backend. No evidence of dual competing API servers in-repo.

---

## 2. Authentication & authorization

| Control | Status | Evidence |
|---------|--------|----------|
| Clerk middleware global on API | Present | `app.ts` |
| Clerk Frontend proxy path | `/api/__clerk` | `clerkProxyMiddleware.ts` |
| `requireAuth` / `optionalAuth` | Present; tombstone fail-closed | `authGuard.ts` |
| Dealer / admin role gates | Present | `dealer.ts`, `admin.ts` |
| Permission matrix on admin | Per-route `requirePermission` | `admin.ts` |
| Soft-deleted users blocked | `users.deletedAt` checks | authGuard + UserService |

**Live Clerk tenant config / SSO buttons:** dashboard-dependent → **UNVERIFIED** for production keys.

---

## 3. Database audit

| Topic | Finding |
|-------|---------|
| Tables | 69 (inventory §2) |
| FK density | High (~102 references) |
| Indexes | Broad; includes trigram GIN for title/description search |
| Soft deletes | Users + conversation-side deletes |
| Hard deletes | Listing/media cascades present on some children |
| Migration discipline | **Push + runtime patches** — no versioned SQL migrations tree |
| Dump artifact | `release/banco_dev_dump_2026-07-21.sql.gz` (dev dump; not a migration SoT) |

### Risks

| ID | Severity | Issue | Root cause | Production risk |
|----|----------|-------|------------|-----------------|
| DB-01 | P1 | No versioned migrations | Operational choice of `drizzle-kit push` | Environment skew between Coolify/AWS/dev |
| DB-02 | P1 | Migrate is compose profile one-shot | Documented in OPS checklist | Prod schema lag if ops skip |
| DB-03 | P2 | Runtime `ensureSchema` / concurrent index creates | Boot-time patches | Race/ordering complexity under multi-replica |

---

## 4. API consistency

| Check | Result | Evidence |
|-------|--------|----------|
| Single OpenAPI file | PASS | `lib/api-spec/openapi.yaml` only |
| OpenAPI ops ≈ Express regs | PASS (173 ≈ 173) | static counts |
| Generated clients present | PASS | `lib/api-client-react/src/generated/*`, `lib/api-zod/src/generated/*` |
| Surfaces depend on generated client | PASS | package.json deps across mobile/web/admin/dealer/landing |
| Hand-written first-party API fetch | 1 known | `admin-os/.../financing.tsx` CSV export `fetch` |
| Presigned storage PUTs | Expected bypass | upload helpers |
| Codegen freshness vs tip | **UNVERIFIED** this session (orval not re-run) | prior gate in confidence script exists |

---

## 5. Backend feature modules (presence, not live proof)

Present services with tests (non-exhaustive): Listing, Search (+ map clusters), Conversation/Messenger, Wallet, Payment/Paymob intents, Plans/Subscriptions, Notifications/Push, RFQ, Import orders, Financing, Bookings, Ads, Abuse, Admin plans, Marketplace lifecycle e2e, Upload claims / object storage.

---

## 6. Security notes (static)

| Item | Status |
|------|--------|
| Rate limiting | Present on public/search/write/AI |
| Secret redaction in logs | Authorization/cookie keys redacted |
| Payment config encryption key required | Env contract |
| S3 fail-closed outside Replit | Recent Coolify hardenings (PR #31 theme) |
| Upload IDOR / like-escape fixes | Historical fix docs under `audit/fixes/` — **regression re-proof UNVERIFIED** this session |
| `pnpm audit` / CVE scan | **UNVERIFIED** |

---

## 7. Backend audit scorecard

| Area | Score /10 | Notes |
|------|----------:|-------|
| Structure | 9 | Clear routers/controllers/services |
| AuthZ depth | 8 | RBAC + permissions; live keys UNVERIFIED |
| Data model | 8 | Rich; migration process is the weak link |
| Contract alignment | 8 | Counts match; freshness UNVERIFIED |
| Tests (presence) | 9 | 79 files / ~400 cases; execution via CI green on tip |
| Resilience (rate limit, errors) | 8 | Solid patterns |
| Observability | 5 | Logs/metrics/webhook; no APM |
