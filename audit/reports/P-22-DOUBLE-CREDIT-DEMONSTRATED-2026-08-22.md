# P-22 demonstrated — the weakened lock double-credits, five times out of five

**I reported that the concurrency controls are unprotected by any gate. That was a statement about coverage. Today I made it a statement about money.**

**Two concurrent settlements of the same provider order id, run ten times against a real PostgreSQL 16. With the lock the code has: credited once, five out of five. With the lock a refactor would leave behind: credited twice, five out of five.**

`canonical @ 4f2c81c` · PostgreSQL 16, two genuinely concurrent connections. **2026-08-22.**

---

## 1 · The result

```
two concurrent settlements of the SAME provider order id (5 trials each)

-- as written:  pg_advisory_xact_lock   (blocking, transaction-scoped)
   trial 1   balance=100   settled_rows=1   credited once
   trial 2   balance=100   settled_rows=1   credited once
   trial 3   balance=100   settled_rows=1   credited once
   trial 4   balance=100   settled_rows=1   credited once
   trial 5   balance=100   settled_rows=1   credited once

-- weakened:    pg_try_advisory_lock    (non-blocking; return value ignored)
   trial 1   balance=200   settled_rows=2   *** CREDITED TWICE ***
   trial 2   balance=200   settled_rows=2   *** CREDITED TWICE ***
   trial 3   balance=200   settled_rows=2   *** CREDITED TWICE ***
   trial 4   balance=200   settled_rows=2   *** CREDITED TWICE ***
   trial 5   balance=200   settled_rows=2   *** CREDITED TWICE ***
```

**Same schema, same settlement logic, same two connections, same timing. One character-level difference in a SQL string.**

**Why it is deterministic rather than flaky:** the blocking lock makes the second transaction *wait* until the first commits, so its `NOT EXISTS` check runs against a world where the order is already settled. The try-lock returns `false` and — because the return value is not inspected — **the second transaction proceeds immediately, checks before the first has committed, sees nothing, and credits again.** *Not a narrow window. The whole overlap is the window.*

---

## 2 · 🔴 What makes this the important finding rather than a curiosity

**That exact mutation, applied to `PaymentIntentService.ts` yesterday:**

```
TypeScript                        0 errors
chain integrity                   245/245
PaymentIntentService.webhook.test.ts + idempotency.test.ts    4 passed
```

> **A one-word change that doubles money on every contended settlement passes the compiler, passes 245 assertions, and passes the two test files written specifically for payment idempotency.**

**This is the control I have called the best engineering in the project — twice, in writing.** It is excellent. **It is also invisible to every gate that exists**, which means it is one confident refactor away from being absent, and nothing would report it.

---

## 3 · ORDER — Space C, and now both halves are specified

### C-6 · the static assertion *(as filed, unchanged)*
```js
{
  id: "P-payment-settlement-xact-lock",
  file: "artifacts/api-server/src/services/PaymentIntentService.ts",
  test: (s) => /pg_advisory_xact_lock\(hashtext\(/.test(s)
            && !/pg_try_advisory_lock/.test(s),
  why: "Settlement holds a blocking transaction-scoped lock keyed on the provider order id; a try-lock returns false under contention and credits twice — demonstrated 5/5 on 2026-08-22",
}
```
**And the same shape for the other fifteen sites**, per-file, never as a blanket ban — `lib/advisoryLock.ts` uses `pg_try_advisory_lock` correctly by design and a repository-wide rule would break it.

### C-7 · the behavioural test — and here is a harness that provably fails
**Every concurrency test in this repository today passes under a weakened lock. This shape does not:**

```
① two connections, both settling the SAME provider order id
② each acquires the lock, then sleeps ~400ms BEFORE its check-then-act
③ assert the credited balance is exactly one unit
```

**The sleep is the whole design.** It guarantees the two check-then-act windows overlap, so the *only* thing that can serialize them is the lock under test. **With the real lock the second transaction cannot even reach its check until the first commits; with a try-lock both reach it together.**

> **DONE means: swap `pg_advisory_xact_lock` → `pg_try_advisory_lock` and the test fails. Not "the test exists" — the failure is the evidence.**

*This is the missing half of `P-22`. I specified the assertions three days ago and said the behavioural test was "the harder and more valuable work" without saying how. This is how, and it is about fifteen lines.*

---

## 4 · The rule this closes

**My earlier rule:** *a control is protected only if some gate produces a different observable outcome when the control is removed.*

**Today adds the corollary that makes it usable:**

> **If you cannot construct the failure, you do not yet know what the control does.**
>
> **Constructing it takes minutes, and it converts "we should keep this" into "here is what it costs to lose it."**

**Ten trials. Zero ambiguity. One string.**

---

## 5 · Standing

**`P-22` moves from `unprotected` to `unprotected, with the consequence demonstrated`. It stays P1 only because no live refactor has removed the lock — the control is correct today. Its exposure is total.**

**Fifteen more sites carry the same shape:** `FOR UPDATE` ×9 across `LeadService` `ConversationService` `RfqService` `PromoAdCreditService` `FinancingService` `BookingService` `AdsService`; `pg_advisory_xact_lock` ×3 across `PlanService` `PaymentIntentService` `AdminService`. **Money, bookings, lead attribution, ad credit, messenger serialization. None protected by any gate.**

---
*Demonstration run against PostgreSQL 16 with two genuinely concurrent client connections rather than a simulated race, five trials per variant, identical schema and logic in both arms so the lock function is the only difference. The first version of this harness produced a false negative — both arms credited once, because the transactions did not overlap — and was corrected by moving the sleep to after the lock acquisition so both check-then-act windows coincide; the invalid run is recorded rather than discarded. Scratch database created and dropped. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
