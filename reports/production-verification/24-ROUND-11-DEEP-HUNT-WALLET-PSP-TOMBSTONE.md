# Round 11 — Deep hunt: wallet fingerprint, PSP bind order, tombstones, market

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Search + verify before any patch. Proven CRITICAL/HIGH only. Real vitest.

---

## Hunt method

Three parallel evidence hunts (money / tombstone-IDOR / mobile-market), then **source re-verification** of every claim before coding. Weak MED claims deferred (facets global counts, similar oracle, save-on-tombstone).

---

## Defects closed

### 1) CRITICAL — Ledger idempotency replay ignored fingerprint

**Evidence:** `applyTransaction` returned replay success on any matching `idempotency_key` without checking type/user/amount/reference. Top-up settles with `idempotencyKey: intent.id`. Wallet subscribe used the raw client UUID → reuse granted a free subscription (or stranded a paid top-up).

**Fix:** Fingerprint match on replay; `CONFLICT` on mismatch. Namespace wallet subscribe keys as `subscription_wallet:${key}` (+ lookup/catch updated).

**Real test:** `WalletService.test.ts` cross-purpose reuse → CONFLICT; balance unchanged.

### 2) HIGH — Boost charge vs archive TOCTOU

**Evidence:** In-txn listing status read without `FOR UPDATE`.

**Fix:** `SELECT … FOR UPDATE` before status check / charge.

### 3) HIGH — Paymob bound wrong-amount orders

**Evidence:** `claimPaymobOrderForIntent` ran before amount check; null `amount_cents` skipped the guard; currency unused.

**Fix:** Require finite positive `amount_cents` + `currency === "EGP"` + amount match **before** claim. Expose signed `currency` from verifier.

### 4) HIGH — Bookings on hidden hosts

**Evidence:** `createBooking` only checked `status === active`.

**Fix:** `publicVisibilityConditions` pre-check + in-lock seller tombstone/flag/shadow checks.

**Real test:** `BookingService.tombstone.test.ts`.

### 5) HIGH — Ad impression billing after listing hidden

**Evidence:** `recordImpression` billed without joining listing visibility.

**Fix:** Non-billable `listing_hidden` when listing fails public gates.

### 6) HIGH — Home sort dropped market

**Evidence:** Sort nav pushed only `sort`; URL parser defaults missing market to EG.

**Fix:** Pass `market_country: marketCountry`.

### 7) HIGH — Coolify web trending/hub unscoped

**Evidence:** `banco-web` / `banco-website` `HomeTrendingStrip` + `HubFeedTeaser` omitted market (HomeFeedTeaser already scoped).

**Fix:** `DEFAULT_MARKET_COUNTRY` on both (parity with R8 frozen-web money fix).

---

## Deferred (honest)

- Facets without market (MED — chip counts cross-market)
- MFA TOTP UI, device/ops UNVERIFIED
- First-webhook remapping before any bind (MED residual; amount-before-bind closed)

---

## Gates

| Gate | Result |
|------|--------|
| Chain | **132/132 PASS** |
| API vitest | **362 passed / 3 skipped** |
| Mobile tests | **PASS** |
