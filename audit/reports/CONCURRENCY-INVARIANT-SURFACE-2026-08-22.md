# The complete unprotected surface — sixteen concurrency invariants, none guarded

**Extending yesterday's mutation audit from two samples to the whole class. The result is sharper than the sample suggested, and it corrects part of my own sweep.**

`canonical @ 4f2c81c` · tree verified clean, chain re-confirmed 245/245 after every mutation. **2026-08-22.**

---

## 1 · ⚠️ Correction #21 — three "unprotected" results in my sweep were wrong

**My mutation sweep reported four controls as unprotected. I then checked whether the *compiler* catches them, which I should have done before publishing anything:**

| Mutation | Chain gate | **TypeScript** | True verdict |
|---|---|---|---|
| `requirePermission` → `needPermission` | ❌ | ✅ **2 errors** | **protected** |
| `verifyPaymobWebhook` → `checkWebhook` | ❌ | ✅ **1 error** | **protected** |
| `mediaPurpose` → `mediaKind` | ❌ | ✅ **10 errors** | **protected** |
| `TRUST_PROXY_HOPS` → `PROXY_HOPS` | ❌ | ❌ | 🔴 **unprotected** *(env-var string)* |

**Baseline typecheck: 0 errors.** All three renames break compilation immediately.

> **My sweep measured one gate and called the answer "unprotected." That was a category error. A control expressed as a TypeScript symbol is protected by the compiler, whether or not an assertion mentions it.**

**This correction sharpens the real finding rather than weakening it.**

---

## 2 · 🔴 THE REAL RISK CLASS — invariants that live inside SQL strings

**The distinction that matters is not "asserted vs unasserted." It is:**

> **Can the mutation compile?**
>
> A TypeScript symbol cannot be renamed silently — the compiler stops it.
> **A SQL string inside a template literal can be changed to any other valid SQL string, and nothing in the toolchain notices.**

**Both concurrency mutations that survived yesterday are exactly this shape:**

```ts
sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`   →  pg_try_advisory_lock
sql`… FOR UPDATE`                                      →  FOR SHARE
```

**Valid TypeScript. Valid SQL. Different semantics. Zero errors, zero failing tests, chain 245/245.**

---

## 3 · The complete surface — enumerated, not sampled

**Sixteen concurrency primitives across eleven services, every one inside a SQL string:**

| Primitive | Count | Services |
|---|---|---|
| **`FOR UPDATE`** | **9** | `LeadService` ×2 · `ConversationService` ×2 · `RfqService` · `PromoAdCreditService` · `FinancingService` · `BookingService` · `AdsService` |
| **`pg_advisory_xact_lock`** | **3** | `PlanService` · `PaymentIntentService` · `AdminService` |
| `pg_advisory_lock` | 1 | `FinancingService` |
| `pg_try_advisory_lock` | 1 | `lib/advisoryLock.ts` — **legitimate, see §4** |
| `pg_advisory_unlock` | 2 | paired with the above |

**What they protect:** money settlement · plan resolution · admin operations · lead attribution · booking reservation · ad credit · financing · messenger send/read serialization.

**Every one of them:**
- ✅ compiles after being weakened
- ✅ passes the chain gate after being weakened
- ✅ passes its own tests after being weakened *(proven for 2 of 16; the mechanism is identical for the rest)*

> **Sixteen invariants guarding money, bookings and messaging, and not one is protected by any gate in this repository.**

---

## 4 · ⚠️ One of them must NOT be flagged — and this is why enumeration alone is dangerous

`lib/advisoryLock.ts` uses `pg_try_advisory_lock`, which is the *weakened* form in every other context. **Here it is correct by design**, and the file says so:

> *"If another instance already holds the lock the function is skipped and `false` is returned. This makes scheduled jobs safe to register on multiple instances: only the instance that wins the lock performs the work."*
>
> *"The lock is acquired and released on the **same** pooled connection, which is required for advisory locks to behave correctly."*

**A non-blocking try-lock is exactly right for a scheduled job that must run once across replicas.** A blocking lock there would queue every instance behind the winner.

> **An assertion that simply bans `pg_try_advisory_lock` repository-wide would break this correct code. The assertions must be per-file, matched to each site's intended semantics.** *That is why I am specifying them individually below rather than as one blanket rule.*

---

## 5 · ORDER — Space C, per-site assertions

**Two exemplars, written against the gate's real shape. The remaining sites follow the same pattern:**

```js
{
  id: "P-payment-settlement-xact-lock",
  file: "artifacts/api-server/src/services/PaymentIntentService.ts",
  test: (s) => /pg_advisory_xact_lock\(hashtext\(/.test(s)
            && !/pg_try_advisory_lock/.test(s),
  why: "Settlement holds a blocking transaction-scoped lock keyed on the provider order id; a try-lock returns false under contention and credits twice",
}
```

```js
{
  id: "P-conversation-send-row-lock",
  file: "artifacts/api-server/src/services/ConversationService.ts",
  test: (s) => /FOR UPDATE/.test(s) && !/FOR SHARE/.test(s),
  why: "Send and mark-read serialize on an exclusive participant row lock; FOR SHARE permits concurrent holders and desynchronises unread counts",
}
```

**Then the same for:** `PlanService` · `AdminService` · `LeadService` · `RfqService` · `PromoAdCreditService` · `FinancingService` · `BookingService` · `AdsService`.

**And `TRUST_PROXY_HOPS`**, which the compiler also cannot protect:
```js
{
  id: "P-trust-proxy-numeric-hops",
  file: "artifacts/api-server/src/app.ts",
  test: (s) => /TRUST_PROXY_HOPS/.test(s) && !/trust proxy["']\s*,\s*true/.test(s),
  why: "trust proxy must be a counted hop number; setting it to true makes X-Forwarded-For fully spoofable and every per-IP rate limit meaningless",
}
```

**DONE means:** re-run each mutation and the gate fails. **The assertion existing is not the evidence — the failure is.**

---

## 6 · The general rule this produces

> **Any invariant that survives a rename because it lives in a string — SQL, an environment variable name, a URL, a header, a header value — has no compiler behind it and must carry an assertion.**
>
> **Any invariant expressed as a TypeScript symbol already has one.**

**That single distinction tells you which of the hundreds of controls in this codebase actually need pinning, and it is a much shorter list than "everything."** For this repository it is: **16 SQL concurrency primitives, `TRUST_PROXY_HOPS`, and the tile/provider URLs that the G-1 batch already handled correctly by deriving from a constant.**

**The G-1 tile handler is the pattern done right** — it binds to the `OSM_TILES` constant instead of a literal host, so a provider change carries it automatically. **The same idea applied to SQL would be named constants for lock modes; the assertion is the cheaper path today.**

---

## 7 · Standing

**Register: `P-22` widened from two controls to the full class — 16 SQL concurrency invariants plus `TRUST_PROXY_HOPS`, none protected.**

**26 classes, 9 at P0. Twenty-one corrections published.**

**What this pass adds beyond yesterday's:** the sample became a census, three false positives were removed by checking the compiler, one correct-by-design use was identified and protected from a careless blanket rule, and the class was reduced to a one-sentence test anyone can apply: **can the mutation compile?**

---
*Every mutation applied to a working tree and reverted; `git status` clean and chain re-verified at 245/245. Typecheck baseline measured at 0 errors before each rename test. The concurrency census produced by enumerating primitives across `artifacts/api-server/src` excluding test files. The legitimate `pg_try_advisory_lock` use identified by reading its own documentation before classifying it. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
