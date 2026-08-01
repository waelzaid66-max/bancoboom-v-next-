# 41 — P2-H1 Paymob unsigned first-bind TOFU (evidence decision)

**Finding ID:** P2-H1  
**Severity:** HIGH (money)  
**Tip audited:** `aee476c` on `cursor/w41-production-release-5cf0`  
**Policy:** SoT only · HIGH confidence only · **no invent** · money path fail-closed only with evidence  
**Code change this turn:** **NONE**

---

## 1. Verdict (one line)

**DEFER — no safe reconnect in-repo.** Residual TOFU remains when Intention omits order id at checkout; closing it requires an **owner-chosen design** plus **live Intention / order-API evidence**, not code invention.

---

## 2. Attack / residual (precise)

### 2.1 What HMAC covers

`verifyPaymobWebhook` builds the digest from `HMAC_FIELD_ORDER` in `paymentProvider.ts`. That list includes **`order.id`** and economic flags (`amount_cents`, `success`, `is_refunded`, …). It does **not** include:

- `order.merchant_order_id`
- `extras.intent_id` / `payment_key_claims.extra.intent_id`

After a valid HMAC, those intent-correlation fields are still **unsigned**.

### 2.2 Webhook resolution order

`paymobWebhookHandler` (`paymentsController.ts`):

1. Reject invalid HMAC → `401`
2. Require signed `order.id` (`providerOrderId`) — else ACK `200` no-op
3. `boundIntentId = findIntentIdByPaymobOrderId(providerOrderId)` — metadata `paymob_order_id`
4. `intentId = boundIntentId ?? verification.intentId` ← **TOFU window**
5. Amount / currency guards, then `claimPaymobOrderForIntent`, then settle/reverse/fail

When step 3 misses (no pre-bound metadata), step 4 trusts unsigned `merchant_order_id` / extras.

### 2.3 Remap scenario (same-amount)

1. Victim intent `V` pending, amount `A` EGP, **no** `metadata.paymob_order_id`
2. Attacker completes payment for their own order `O` with signed amount `A`
3. Attacker delivers a body whose HMAC fields match Paymob’s signed set for `O`, but sets unsigned `merchant_order_id` (or extras) to `V`
4. `boundIntentId` is null → settlement/claim targets `V`

**Not** a forge-HMAC attack. It is **first-bind correlation** on unsigned fields.

---

## 3. Mitigations already shipped (closed paths)

| Round / tip | Mitigation | Effect |
|-------------|------------|--------|
| R6+ | `claimPaymobOrderForIntent` | One signed `order.id` → one intent; remaps after bind → `order_bound_elsewhere` |
| R10 | Prefer `findIntentIdByPaymobOrderId` before unsigned id | Bound orders ignore remapped merchant id |
| R14 | Parse Intention `intention_order_id` / `order_id` / `order.id` → `providerOrderId` → `checkoutBoundPaymentMetadataSql(..., providerOrderId)` | **Pre-bind** closes TOFU when Intention returns an order id |
| Ongoing | Exact amount match (success); currency `EGP` | Shrinks remap set to same-amount pending intents |

**Residual condition (only):** Intention response has **no** parseable order id → checkout metadata has checkout URL but **no** `paymob_order_id` → first webhook still uses unsigned intent id.

---

## 4. In-repo search — what does **not** exist

| Candidate reconnect | Present? | Notes |
|---------------------|----------|-------|
| Paymob order retrieve / fetch by `order.id` | **No** | No `/ecommerce/orders`, accept-order client, or similar |
| Second HMAC field including merchant id | **No** | Paymob field list is fixed; we do not invent fields |
| Live captured Intention JSON proving order id always present | **No** | Smoke S26 is OPS: “Document Intention payload” |
| Fail-closed checkout when `providerOrderId == null` | **Not coded** | Would be a **behavior change**; needs live proof Paymob always returns order id or owner accepts checkout hard-fail |

Intention open already sends `special_reference: intentId` and `extras.intent_id` — correlation hints only; webhook still reads them as **unsigned**.

---

## 5. Design options (owner must pick — do not invent mid-ship)

| Option | Behavior | Closes TOFU? | Risk | Prerequisites |
|--------|----------|--------------|------|---------------|
| **A — Fail-closed checkout** | If Intention omits order id → refuse to open charge (throw); never persist unbound checkout | Yes, for new opens | Breaks topup/subscription if Paymob sometimes omits field | Live Intention samples (test+live) showing field always present **or** owner accepts hard-fail |
| **B — Server-side order fetch** | On unbound webhook: GET order by signed `order.id` with secret; bind from Paymob-authoritative merchant ref | Yes | New PSP client surface; authz/timeouts/retries | Documented Paymob order API + design review; tests; no invent of endpoint shape |
| **C — Keep defer (current)** | Leave `boundIntentId ?? verification.intentId`; rely on R14 when field present | No (residual) | Known HIGH residual | Accept for CONDITIONAL GO; document in smoke S26 |

**This tip chooses C** until owner orders A or B with evidence.

### Explicitly rejected without evidence

| Idea | Why rejected |
|------|----------------|
| Drop unsigned fallback and `503` forever when unbound | Strands paid webhooks if Intention never pre-bound — chicken-egg without fetch (B) or force pre-bind (A) |
| Trust `special_reference` as signed | Not in `HMAC_FIELD_ORDER` |
| Invent Paymob order URL / response schema from memory | Forbidden by SoT / cert 19 / ledger |

---

## 6. Release posture (unchanged)

| Question | Answer |
|----------|--------|
| Blocks **merge** of `w.4.1` tip? | **No** — already **GO merge** (`39-*`) |
| Blocks **FULL CERT**? | **Yes** until owner accepts residual **or** ships A/B with proof |
| Agent code change now? | **No** |

---

## 7. Owner next (ordered)

1. **Preferred ship path:** merge → tag `w.4.1` → Coolify → smoke (`37-*`), including **S26** capture of Intention JSON (`intention_order_id` / `order_id` / `order.id`).
2. Reply here with **A**, **B**, or **accept C** for FULL CERT waiver of this residual.
3. Only after that: implement the chosen option under a new ordered repair wave.

---

## 8. STOP

Evidence package complete. **No application code modified.** Residual P2-H1 remains **deferred HIGH**.
