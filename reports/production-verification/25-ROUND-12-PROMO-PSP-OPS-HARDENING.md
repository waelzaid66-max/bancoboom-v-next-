# Round 12 — Full production hardening (promo / PSP / ops)

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Search + verify before any patch. Proven CRITICAL/HIGH only. Real vitest.

---

## Hunt method

Deep residual hunt after Round 11 (money idempotency, PSP metadata, dealer-os money UX, compose/readyz/Clerk fail-closed). Each candidate re-verified in source before coding. MED residuals deferred.

---

## Defects closed

### 1) CRITICAL — Promo consume idempotency ignored fingerprint

**Evidence:** `consumePromoCredit` replayed on key alone. Listing hard-delete cascades `ads` (drops `boostIdempotencyKey`) while `promo_ad_transactions` survive → same client key on a new boost undercharged.

**Fix:** Fingerprint user + type=`consume` + referenceType/Id; `CONFLICT` on mismatch.

**Real test:** `PromoAdCreditService.test.ts` cross-reference reuse → CONFLICT; balance unchanged.

### 2) HIGH — Failed Paymob resume wiped `paymob_order_id`

**Evidence:** Failed → pending set `metadata: { provider, resumed: true }` (and charge_error / checkout bind used full replace). Second checkout could strand a paid order.

**Fix:** SQL metadata merge helpers preserve `paymob_order_id`. Bound-order resume refuses second PSP open (`CONFLICT`). Same for subscription path.

**Real test:** `PaymentIntentService.round10.test.ts` Round 12 cases.

### 3) HIGH — Dealer-os bulk boost omitted `idempotency_key`

**Evidence:** Zod requires key; single boost sends `boostAttemptKeyRef`; bulk sent only listing/type/duration → 400.

**Fix:** Per-listing `idempotency_key` with shared batch token.

### 4) HIGH OPS — `docker-compose.prod.yml` world-bound API `:8080`

**Evidence:** Coolify compose already loopback; prod compose published all interfaces while API trusts `X-Forwarded-For`.

**Fix:** `127.0.0.1:${API_HOST_PORT:-8080}:8080`.

### 5) HIGH OPS — `/readyz` green without money schema

**Evidence:** `SELECT 1` only → empty/wrong DB still 200.

**Fix:** Probe `payment_intents` / `transactions` / `promo_ad_transactions` (`money_schema` check).

### 6) HIGH — Web Clerk keyless production no-op on protected routes

**Evidence:** Missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → `NextResponse.next()` for `/workspace` etc.

**Fix:** Production + protected → 503 fail-closed (`banco-web` + `banco-website`).

---

## Deferred (honest)

- Facets without market (MED)
- MFA TOTP UI, device/ops UNVERIFIED
- First-webhook remapping before any bind (MED residual)

---

## Gates

| Gate | Result |
|------|--------|
| Chain | **138/138 PASS** |
| API vitest | **366 passed / 3 skipped** |
| Mobile tests | prior PASS (R11 market guard) |
