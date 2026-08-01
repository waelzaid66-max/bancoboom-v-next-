# Round 14 — Production director pass: reversal, lead lock, RFQ/authz

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Multi-repo residual hunt after R13. Source re-verify every claim. Proven CRITICAL/HIGH only. No invented features (no Clerk inbound webhook, no Redis, no CPL product flip).

---

## Hunt method

Re-read cert residuals → parallel money + tombstone/ops hunts → character-level source verification → patch only proven defects.

---

## Defects closed

### 1) CRITICAL — Post-settlement Paymob refund/void left wallet/sub intact

**Evidence:** `success=false` called `mark*Failed` which only updates `pending→failed`. Completed intents were untouched; Paymob ACK 200.

**Fix:** Expose `isRefunded`/`isVoided` from verifier. Branch to `reverseTopupAfterPspReversal` / `reverseSubscriptionAfterPspReversal` (ledger debit + metadata; expire subscription; shortfall flagged for ops).

**Real test:** PaymentIntent Round 14 reversal suite.

### 2) HIGH — Lead CPL TOCTOU after archive/delete

**Evidence:** Visibility read outside txn; only token locked.

**Fix:** `FOR UPDATE` on listing + re-apply `active` + `publicVisibilityConditions` before charge/disclose phone.

### 3) HIGH — RFQ award to deleted/shadow-banned supplier

**Fix:** Lock supplier in award txn; fail CONFLICT. Filter `fetchOffers`; block shadow-banned submitters.

**Real test:** `RfqService.tombstone.test.ts`.

### 4) HIGH — Import stage with bare `requireAdminRole`

**Fix:** `requirePermission("manage_financing")` on PATCH stage.

### 5) HIGH — `provider_opening` permanent lock after crash

**Fix:** JSONB `provider_opening_at` lease (120s) on top-up + subscription CAS.

### 6) HIGH — First-bind TOFU when Intention returns order id

**Fix:** Parse `intention_order_id` / `order_id` and pre-bind into metadata at checkout.

### 7) MED (bundled) — Comments on non-active listings

**Fix:** Require `listings.status = active` on list/create.

---

## Explicitly deferred (honest)

| Item | Why |
|------|-----|
| CPL fail-open on insufficient funds | Documented product/tests — not silent bug |
| Clerk inbound `user.deleted` | Feature invention |
| Adaptive feed / rate-limit Redis | Infra invention |
| HMAC previous-secret grace | Ops product |
| Mobile AsyncStorage attempt keys | Device UNVERIFIED / larger UX |
| GlobalSupply tombstone paths | MED residual |
| Facets market | MED |
| Device/EAS visual QA | UNVERIFIED |

---

## Gates

| Gate | Result |
|------|--------|
| Chain | **151/151 PASS** |
| API vitest | **374 passed / 3 skipped** |
| Cross-repo cherry-pick | **NONE** |
