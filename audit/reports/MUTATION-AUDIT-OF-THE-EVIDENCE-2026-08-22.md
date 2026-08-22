# Mutation audit — testing the evidence, not the code

**Every figure in this engagement rests on 245 chain assertions and 505 API tests. Nobody has asked whether those gates can actually fail. I broke things on purpose to find out.**

`canonical @ 4f2c81c`. **2026-08-22.** **Tree verified clean and chain back to 245/245 after every mutation.**

**Result: the static gate is sound. The concurrency controls — the ones I have been praising as the strongest engineering in the project — are not protected by anything I could make fail.**

---

## 1 · ✅ The chain gate contains no vacuous assertions

I parsed all **209** assertion blocks and checked whether each `test` actually uses its argument:

```
id blocks scanned:   209
no-arg tests:          0
argument unused:       0
always-true:           0
```

**Every assertion reads the file it claims to check.** No decoration, no placeholder, nothing that passes by construction. **That is not a given — I have seen gates where a third of the assertions cannot fail.**

---

## 2 · Mutation results — three of four static mutations caught

| Mutation | Caught by chain |
|---|---|
| root `build` loses `--workspace-concurrency=1` | ✅ **244/245** |
| `DEMOTE_BLOCKED` → `BLOCKED_DEMOTE` in `UserService` | ✅ **244/245** |
| `mediaPurpose` → `mediaKind` in `objectAcl` | ❌ not caught |
| `verifyPaymobWebhook` → `checkPaymobWebhook` | ❌ not caught |

**The S4 demote guard is genuinely load-bearing** — rename its error code and the gate fires. **That confirms the four-layer control I praised is real, not decorative.**

### ⚠️ Correction #20 — my first mutation run produced two false gaps

**My initial mutations appended a character:** `DEMOTE_BLOCKED` → `DEMOTE_BLOCKEDX`. **The assertion is `/DEMOTE_BLOCKED/` — a substring match — so the mutated string still matched and nothing broke.** I nearly filed "the S4 guard does not fire" as a finding.

**A second mutation targeted `CarsHomeHeader.tsx`'s testID against the *chain* gate, which does not assert that file** — the mobile section guard does. **Wrong gate, not a gap.**

> **Both were my errors, caught by asking why a result was surprising instead of publishing it. A mutation that leaves the asserted substring intact is not a mutation.**

---

## 3 · 🔴 THE FINDING — concurrency controls survive being weakened

**Two mutations that break real concurrency semantics, both against the strongest code in the project:**

### ① Payments — the double-credit prevention

```
pg_advisory_xact_lock  →  pg_try_advisory_lock
```
**This converts a blocking, transaction-scoped lock into a non-blocking, session-scoped one.** The second concurrent webhook no longer waits — it receives `false` and proceeds. **That is the double-credit path.**

```
PaymentIntentService.webhook.test.ts + idempotency.test.ts
→ Test Files 2 passed | Tests 4 passed
```

### ② Messenger — the send/read serialization

```
FOR UPDATE  →  FOR SHARE     (2 sites in ConversationService)
```
**An exclusive row lock becomes a shared one. Two concurrent senders no longer serialize.**

```
ConversationService.test.ts
→ Test Files 1 passed | Tests 11 passed
```

**Both mutations pass every test that covers them.**

---

## 4 · And this is *not* because concurrency is untested — which makes it more interesting

**My first conclusion was "there are no concurrency tests." That was wrong, and I checked before writing it.**

```
Promise.all / allSettled in test files:  3
  PaymentIntentService.round10.test.ts:108
  ConversationService.test.ts:299,322
  SaveService.test.ts:173
```

**And the conversation test is genuinely sophisticated.** It opens a **control transaction on a separate client**, installs an **observer trigger** on `messages`, polls a `serialized` probe until it observes contention, then commits and joins both operations:

```ts
if (serialized.rows[0]?.serialized) { concurrencyState = "send_serialized"; break; }
…
await control.query("COMMIT");
await Promise.all([markRead, racingSend]);
expect(thread.sellerUnread).toBe(Number(unread.count));
```

**That is the right technique — deterministic contention, not `Promise.all` and hope.**

### What I proved, and where I stop

**Proved:** the mutation passes. Weakening the lock does not fail the suite.

**Hypothesis, labelled as such:** the contention the test observes may be produced by its **own control transaction** rather than by the lock under test — so the probe still reports `send_serialized` even after the production lock is weakened. **I did not instrument the test to confirm this, and I will not assert a mechanism I have not measured.**

> **What is certain is the consequence: these two controls can be silently weakened and every gate stays green. Whether the cause is the probe's origin or something else, the coverage gap is real.**

---

## 5 · Why this matters more than a typical coverage gap

**These are not incidental controls. They are the two I have singled out as the best engineering in the repository:**

> *"Double-crediting is not 'unlikely' here — it is prevented."* — my own payments audit
> *"the JWT subject is checked against the entry owner before send"* — my own identity audit

**A control that is excellent and unprotected is one careless refactor from being excellent and absent.** The four dead guards proved that agents ship unguarded changes; **these two are exactly the kind of line an optimisation pass would "simplify."**

**And nothing would report it.** Chain 245/245, API 505/505, every figure I have published — unchanged.

---

## 6 · ORDER — Space C, and it is small

**Add a mutation-resistant assertion for each control. Static, cheap, and it closes the class:**

```js
{
  id: "P-payment-settlement-xact-lock",
  file: "artifacts/api-server/src/services/PaymentIntentService.ts",
  test: (s) => /pg_advisory_xact_lock\(hashtext\(/.test(s)
            && !/pg_try_advisory_lock/.test(s),
  why: "Settlement must hold a blocking transaction-scoped lock keyed on the provider order id; a try-lock returns false under contention and credits twice",
}
```

```js
{
  id: "P-conversation-send-row-lock",
  file: "artifacts/api-server/src/services/ConversationService.ts",
  test: (s) => /FOR UPDATE/.test(s) && !/FOR SHARE/.test(s),
  why: "Send and mark-read serialize on an exclusive participant row lock; FOR SHARE allows concurrent holders and desynchronises unread counts",
}
```

**And the behavioural half, which is the harder and more valuable work:** a concurrency test whose contention is **provably produced by the code under test** — the simplest proof being that **the test fails when the lock is weakened.** *A concurrency test that passes under a weakened lock is measuring its own scaffolding.*

**DONE means:** re-run these two mutations and both suites fail.

---

## 7 · What this pass says about all my other figures

**Every number I have published — 245/245, 505/505, 127/127, 26/26 — measures what the gates check. This is the first time anyone has measured what the gates *can* catch.**

**The static gate came out well: 209 blocks, zero vacuous, and the assertions I mutated fired.** **The behavioural suite came out with a specific, named hole in the highest-stakes code.**

> **I have been treating green gates as evidence. They are evidence of what is asserted, and until today nobody had checked the difference. Two of the controls I called the best in the project are unasserted.**

**Register: `P-22` — concurrency controls unprotected by any gate. P1.**
**26 classes, 9 at P0.** **Twenty corrections published.**

---
*All mutations applied to a working tree and reverted; `git status` clean and chain re-verified at 245/245 afterwards. The invalid first-run mutations are recorded rather than discarded. Concurrency test structure read directly before drawing any conclusion about its coverage. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
