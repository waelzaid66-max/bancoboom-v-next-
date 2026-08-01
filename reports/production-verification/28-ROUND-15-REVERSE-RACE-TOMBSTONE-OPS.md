# Round 15 — Reverse race, orphan clawback, tombstone, client keys, AWS wait

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Accuracy ≫ speed. Multi-repo residual hunt after R14. Source re-verify every claim. Proven CRITICAL/HIGH only. No invented features (no Clerk inbound webhook, no Redis, no MFA TOTP UI, no CPL product flip).

---

## Hunt method

Re-read R14 residuals → money reverse/settle race + orphan credit → client idempotency key retention → GlobalSupply/Save/Conversation tombstones → AWS SSM fire-and-forget → character-level verify → patch + real vitest + chain markers.

---

## Defects closed

### 1) CRITICAL — Refund/void before success left settle open

**Evidence:** Pre-settle reverse called `mark*Failed` only (`pending→failed`) without durable `psp_reversed`. Late success webhook still settled from `failed`.

**Fix:** `reverseTopupAfterPspReversal` / `reverseSubscriptionAfterPspReversal` set `psp_reversed` under intent `FOR UPDATE` for pending/failed. Settle locks intent and refuses credit/activation when marker is set.

**Real test:** PaymentIntent + Subscription Round 15 suites.

### 2) CRITICAL — Orphan subscription top-up not clawed

**Evidence:** Reverse only expired charge-linked subs. Orphan path credits `${id}:orphan_topup` and left wallet credit after refund ACK.

**Fix:** Claw orphan credit via `adjustment` debit (partial + shortfall flag). Net-zero `:topup`+`:charge` path unchanged.

### 3) HIGH — Clawback typed as `refund` debit

**Evidence:** Schema/UI treat `refund` as credit (`TX_CREDIT.refund = true`).

**Fix:** Top-up/orphan clawbacks use `adjustment` debit.

### 4) HIGH — Web WalletPanel / plans / dealer bulk keys

**Evidence:** Web cleared top-up key on pending (mobile already kept it). `openSubscribe` always cleared attempt key. Bulk boost regenerated `batchToken` every confirm click.

**Fix:** Keep pending keys; clear subscribe key only on plan change; `bulkBoostBatchRef`.

### 5) HIGH — Save / Conversation / GlobalSupply tombstones

**Evidence:** New saves had no visibility gate. Conversation `getUserId` ignored `deletedAt`; shared listing refs unchecked. GlobalSupply matches/responses omitted supplier `deletedAt`.

**Fix:** Save active+`publicVisibilityConditions` on insert; Conversation fail-closed; filter deleted suppliers.

### 6) HIGH OPS — AWS SSM send-command fire-and-forget

**Evidence:** Workflow did not wait or check invocation Status.

**Fix:** Capture CommandId → `wait command-executed` → fail if Status ≠ Success.

---

## Explicitly deferred (honest)

| Item | Why |
|------|-----|
| CPL fail-open on insufficient funds | Documented product/tests |
| Clerk inbound `user.deleted` | Feature invention |
| Adaptive feed / rate-limit Redis | Infra invention |
| MFA TOTP delete UI | Product BUG-002 |
| Mobile AsyncStorage attempt keys | Device UNVERIFIED |
| Facets market_country | MED residual |
| Device/EAS visual QA | UNVERIFIED |

---

## Gates

| Gate | Result |
|------|--------|
| Chain | **158/158 PASS** |
| API vitest | **381 passed / 3 skipped** |
| Cross-repo cherry-pick | **NONE** |
