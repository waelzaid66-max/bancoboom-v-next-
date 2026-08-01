# Round 13 — Cross-repo hunt: Paymob outcomes, settlement races, boost/mobile/AWS

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Multi-repo + multi-branch search BEFORE any patch. Proven CRITICAL/HIGH only. Real vitest + mobile static guards.

---

## Hunt method

1. Inventory all clones under `/tmp/repo-audit` + workspace (`bancoo`, `bancoboom`, `CA-OOM`, `bancotoday`, `bancostormainvirgen`, BWW sibling branches).
2. Parallel hunts: SoT money residuals, cross-repo diffs, ops/auth/tombstone residuals.
3. **Cross-repo verdict:** SoT tip is equivalent or stronger on all focus patterns — **do not cherry-pick** older tips.
4. Source re-verification of every CRITICAL/HIGH claim before coding.

---

## Defects closed

### 1) CRITICAL — Refunded / voided / auth-only Paymob events could settle

**Evidence:** HMAC includes `is_refunded` / `is_voided` / `is_auth` / `is_capture`, but `success` only checked `success && !error && !pending`.

**Fix:** Require not refunded, not voided, and not auth-without-capture.

**Real test:** `PaymentConfigService.test.ts` Round 13 outcome flags.

### 2) HIGH — Soft-delete race credited tombstoned wallets

**Evidence:** Owner `deletedAt` checked outside the money txn; credit UPDATE matched by `id` only.

**Fix:** Credit requires `deleted_at IS NULL`; top-up/subscription settlement re-locks user `FOR UPDATE` inside the txn.

**Real test:** `WalletService.test.ts` soft-deleted credit → NOT_FOUND.

### 3) HIGH — Paymob order claim full metadata replace + no intent lock

**Evidence:** Stale read + `set({ metadata: meta })` could wipe `checkout_url`; two orders racing null could last-write-wins.

**Fix:** `FOR UPDATE` on intent + JSONB merge of `paymob_order_id` only.

**Real test:** merge preserves checkout_url.

### 4) HIGH — Boost idempotency cross-tenant / cross-listing free success

**Evidence:** Unique-violation catch returned any ad for the key without seller/listing/type fingerprint.

**Fix:** CONFLICT unless seller + listing + adType match.

**Real test:** AdsService Round 13 cases.

### 5) HIGH — Mobile cleared attempt key while intent pending

**Evidence:** `wallet.tsx` / `plans.tsx` set `*AttemptKeyRef = null` on pending poll → next tap new UUID → second PSP checkout.

**Fix:** Keep key until `completed`.

**Guard:** mobile `lib-hardening.test.mjs`.

### 6) HIGH OPS — AWS `deploy.sh` migrate without `DATABASE_URL`

**Evidence:** SSM renders `.env.production` for Compose, but `db-migrate.sh` requires host-shell `DATABASE_URL`.

**Fix:** Parse + `export DATABASE_URL` from the rendered env file before migrate.

---

## Explicitly deferred (honest)

| Item | Why |
|------|-----|
| CPL fail-open on insufficient funds | Product/revenue policy; not silent double-credit |
| Lead listing FOR UPDATE mid-charge | MED-HIGH; next money pass |
| HMAC previous-secret grace | Ops/config product |
| Clerk `user.deleted` inbound webhook | Feature invention |
| Adaptive feed / rate-limit Redis | Infra invention |
| Facets market, first-bind remap, RFQ tombstones | MED |

---

## Gates

| Gate | Result |
|------|--------|
| Chain | **144/144 PASS** |
| API vitest | **371 passed / 3 skipped** |
| Mobile lib tests | **PASS** |
