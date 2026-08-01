# Round 10 — Real tests + money/tombstone/market precision

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Proven HIGH only. Accuracy ≫ speed. Real vitest behavioral coverage — not markers alone.

---

## Defects closed (with executed tests)

### 1) Public listing detail bypassed tombstone gates (HIGH)

**Evidence:** `getListingDetail` filtered only `status !== active` for non-owners. Feed/search use `publicVisibilityConditions()` (`deletedAt` / shadow-ban / flagged). Deep-link still returned full detail + contact token mint path.

**Fix:** Non-owner fail-closed on `is_flagged` / `seller_shadow_banned` / `seller_deleted_at`. Insights + availability controllers call `listingIsPubliclyVisible` first.

**Real test:** `ListingService.detailVisibility.test.ts` — soft-delete / flagged / shadow-ban hide from buyer; owner still sees.

### 2) Concurrent top-up/subscribe opened two Paymob checkouts (HIGH)

**Evidence:** Same idempotency key could race past the “replay if checkout exists” branch into two `createProviderCharge` calls before either wrote `providerRef`.

**Fix:** CAS `provider_opening` claim before PSP; losers poll for bound checkout. Same pattern on subscription external rail.

**Real test:** `PaymentIntentService.round10.test.ts` — concurrent same-key creates → `createProviderCharge` called **once**.

### 3) Webhook preferred unsigned intent over bound order (HIGH residual)

**Evidence:** After Round 6 claim, remap still selected intent from unsigned `merchant_order_id` first. Once order A was bound, a remapped webhook could still try B (rejected by claim) but did not **prefer** the bound intent.

**Fix:** `findIntentIdByPaymobOrderId(signed order.id)` first; only then fall back to unsigned id for first bind.

**Real test:** Bound order + remapped claim → `order_bound_elsewhere`; finder still returns original intent.

### 4) Trending/recommendations ignored market_country (HIGH)

**Evidence:** Home feed rails used preferred market for `getFeed` (R9) but `getTrending()` / `getRecommendations()` had no param and no filter.

**Fix:** API + OpenAPI + client params; `getTrending(limit, market)` via `buildAttributeConditions`; mobile Home passes market on both.

**Real test:** `SearchService.trendingMarket.test.ts` — EG listing not in SA trending and reverse.

---

## Gates

| Gate | Result |
|------|--------|
| Chain integrity | **124/124 PASS** |
| API vitest | **360 passed / 3 skipped** |
| Mobile `pnpm test` | **PASS** |

---

## Deferred (honest)

- MFA delete TOTP UI (BUG-002)
- Device/EAS/APNs/FCM/visual QA → UNVERIFIED
- First-webhook remapping when order not yet bound (needs PSP-side order↔intent proof beyond HMAC unsigned fields) — residual MED; bound-order path closed

Verdict remains **CONDITIONAL GO**.
