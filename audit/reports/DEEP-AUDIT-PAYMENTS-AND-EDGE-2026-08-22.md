# Deep audit — payments, rate limiting, and the operational edge

**The money path and the operational security surface, audited at code level. This is the area I had touched only superficially, and it turns out to be the strongest engineering in the repository.**

`canonical @ 4f2c81c`. **2026-08-22.**

**One genuine gap found, and it is not in the code — it is a production prerequisite the code names and the deployment surface does not provide.**

---

## 1 · ✅ The payment path is exceptional. Preserve it exactly.

I audited the Paymob webhook end to end expecting the usual failures. **They are all absent, and several controls are more sophisticated than I would have specified.**

### Order of operations — `paymentsController.ts:28-49`

```ts
const verification = await verifyPaymobWebhook({ obj, providedHmac });
if (!verification.valid) return res.status(401).json({ ok: false });
…
const intentId = await findIntentIdByPaymobOrderId(verification.providerOrderId);
if (!intentId) return res.status(503).json({ ok: false, error: "order_not_bound" });
```

**HMAC is verified before any database access.** No lookup, no write, no side effect precedes the signature check.

### The four controls that make this better than most

**① Routing only through HMAC-covered fields.** The comment is the sharpest security reasoning in the repository:

> *"Route exclusively through the order id bound from the trusted Intention API response. `merchant_order_id` / `extras.intent_id` are **not covered by Paymob's transaction HMAC** and must never establish first-use ownership."*

**Most integrations route on `merchant_order_id` because it is convenient. It sits outside the signature, so an attacker can forge it.** This implementation refuses to let an unsigned field establish ownership. **That is a real attack closed by design.**

**② 503 instead of a false ACK.**

> *"503 so the provider retries (never ACK a signed payment with no durable row)."*

**A signed payment acknowledged without a durable row is money lost silently.** Returning 503 makes the PSP retry until the row exists.

**③ Double-credit prevented structurally** — `PaymentIntentService.ts:472-474`:

```ts
return db.transaction(async (tx) => {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${`paymob_order:${providerOrderId}`}))`
  );
```

**A transaction-scoped advisory lock keyed on the provider order id.** Two concurrent deliveries for the same order serialise; the lock releases at transaction end with no leak path. **Double-crediting is not "unlikely" here — it is prevented.**

**④ Refund wins over a late settlement** — `pspReversedFromMeta()`:

> *"True when a refund/void already won — settlement must never credit afterward."*

**A settlement callback arriving after a refund cannot credit the wallet.** That ordering hazard is one most systems discover in production.

**Plus:** idempotency keys with ownership and purpose checks, `already_processed` derived from intent status, and `paymob_order_id` preserved across failure paths rather than wiped.

> **Order: change nothing here without a written reason. This is the highest-stakes code in the system and it is in better shape than anything else I have audited.**

---

## 2 · ⚠️ Correction #16 — rate limiting exists, and I implied otherwise

**In my earliest audit I flagged "no rate limiter" on the payment webhook.** That was scoped to two files and I did not check the middleware directory.

**`middlewares/rateLimiter.ts` implements four tiers, segmented by traffic class:**

| Limiter | Window | Max | Reasoning |
|---|---|---|---|
| `publicRateLimiter` | 60s | 120 | baseline |
| `mediaRateLimiter` | 60s | **1,200**, env-tunable | see below |
| `searchRateLimiter` | 60s | 60 | expensive path |
| `writeRateLimiter` | 60s | 30 | mutations |

**And the media tier's comment shows market-specific thinking I did not expect:**

> *"Media is fetched many times per feed page and video playback issues multiple byte-range requests. Reusing the ordinary 120/min budget makes one healthy client **(or a carrier-grade NAT)** self-DOS."*

**Carrier-grade NAT awareness matters enormously in this market**, where large numbers of mobile users share a single egress IP. A naive per-IP limit would throttle an entire carrier's subscribers as one client. **They accounted for it.**

**The webhook route having no limiter is defensible and I now think correct:** the HMAC check rejects unsigned floods at 401 before touching the database, and a blanket limiter risks dropping a legitimate PSP settlement retry — which is worse than the flood. **If a limiter is ever added there, key it on *failed* verifications only.**

---

## 3 · 🔴 The one real gap — a production prerequisite nothing provides

**The rate limiter's own comment states a requirement:**

> *"This higher, operator-tunable guard is only an origin safety net; **production still needs distributed edge/WAF limits because `express-rate-limit`'s default store is process-local.**"*

**I searched every deployment target for that provision:**

```
docker-compose.coolify.yml · docker-compose.prod.yml · deploy/coolify/
deploy/gcp/*.md · deploy/aws/*.md
→ no WAF, no Cloudflare rate rules, no edge limiting of any kind
```

**And the compose file itself contemplates the exact scenario that makes process-local limits insufficient** — line 183:

> *"Pool sizing — keep **replicas × DB_POOL_MAX** under Postgres `max_connections`."*

**Replicas are anticipated. With N replicas, every limit above becomes N× its stated value**, because each process keeps its own counter.

> **ORDER: either provide the distributed edge limits the code says production requires, or record explicitly that the deployment runs a single API replica and that the limits are therefore accurate as written. Do not leave a stated prerequisite unprovided and unacknowledged.**

**This is the correct shape of the finding: the code is right, the code told you what it needs, and the deployment does not yet supply it.**

---

## 4 · ✅ Operational security — hard-won knowledge, encoded

Three things in the deployment surface that only come from having been burned:

**① Loopback-only publish, and the reason is recorded** — `docker-compose.coolify.yml:131-134`:

```yaml
# Loopback-only host publish: public traffic must enter via Coolify/Nginx.
# Binding 0.0.0.0 made express-rate-limit trust spoofable X-Forwarded-For.
ports:
  - "127.0.0.1:${API_HOST_PORT:-8080}:8080"
```

**They hit the spoofing vulnerability, diagnosed it correctly, and fixed it at the network binding rather than patching around it.**

**② An exact proxy hop count, not `trust proxy: true`** — and I verified it is actually consumed, `app.ts:27-28`:

```ts
const hops = Number(process.env.TRUST_PROXY_HOPS ?? 2);
app.set("trust proxy", Number.isFinite(hops) && hops >= 1 ? hops : 2);
```

with compose: `# Traefik → nginx → api = 2 hops (override if edge topology differs)`.

**`app.set("trust proxy", true)` is the classic mistake that makes `X-Forwarded-For` fully spoofable and every per-IP limit meaningless. They counted the hops instead.** The fallback is a number, not `true`.

**③ Readiness that actually fails** — the compose healthcheck hits `/api/readyz`, and I verified it is real: `routes/health.ts` returns **503 when the database is down**. So an API that cannot reach Postgres is marked unhealthy and the edge stops routing to it. **Liveness and readiness are genuinely separated.**

---

## 5 · What this changes about my assessment

**I have been describing this project as "strong source, unwitnessed runtime." That was accurate but incomplete.**

**The operational and money-handling layers are not merely strong — they contain corrections that only come from real incidents:** a spoofable-header bug found and fixed at the binding, an HMAC-coverage attack closed by refusing unsigned fields, a false-ACK hazard closed with 503, a double-credit race closed with a transaction-scoped advisory lock, a carrier-NAT self-DOS anticipated, and a false-negative in a route-guard assertion detected and corrected.

**None of that is in my defect register, because none of it is a defect. It deserves to be said plainly, because a register lists only what is wrong and can leave a false impression of a codebase.**

**The defects I have found are real and several are severe. They are also concentrated, and now precisely located:** two web workspaces with no tests over write logic, one unmade contract decision, one missing migration line, one missing glob runner, and a set of operational prerequisites that are named but not yet provided.

---

## 6 · Added to the register

| ID | Problem | Sev | Evidence |
|---|---|---|---|
| **E-1** | **Edge/WAF rate limits named as a production requirement by the code, provided by no deployment target** — and replicas are anticipated, which multiplies every process-local limit | **P1** | `rateLimiter.ts:24-26` · searched all deploy targets · compose line 183 |

**Everything else in this audit is a preservation note, not a defect.**

---

## 7 · Preservation list — change none of these without a written reason

- HMAC verified before any DB access
- Routing exclusively through HMAC-covered fields
- 503 rather than ACK when the order is not bound
- `pg_advisory_xact_lock` keyed on the provider order id, transaction-scoped
- Refund-wins semantics over late settlement
- Four-tier rate limiting with the media tier's NAT allowance
- Loopback-only API publish
- Numeric `TRUST_PROXY_HOPS`, never `trust proxy: true`
- `/readyz` returning 503 on database loss

---
*Payment path traced from route to controller to service to the advisory lock. Rate limiter read in full; my earlier "no rate limiter" claim corrected. `TRUST_PROXY_HOPS` and `/readyz` verified as actually consumed rather than merely declared. Edge-limit absence confirmed by searching all deployment targets. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
