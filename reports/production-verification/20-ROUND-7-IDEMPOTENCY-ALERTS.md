# Round 7 — Payment idempotency + saved-search alert precision

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Proven HIGH defects only. Prefer false-negatives over false-positive money/alerts.

---

## Defects closed

### 1) Top-up / subscription creation lacked client idempotency (HIGH)

**Evidence:** `TopupCreateSchema` / `SubscribeSchema` had no `idempotency_key`;
`createTopupIntent` / external `startSubscription` used `randomUUID()` per call →
network retry / double-tap opened a second Paymob checkout for the same user action.

**Fix:**
- Require `idempotency_key` (UUID) on top-up + subscribe request bodies (OpenAPI + Zod + generated clients).
- Use the key as `payment_intents.id`; replay returns the bound checkout URL and never opens a second PSP order once one is bound.
- Failed charge rows may resume under the same key; completed/expired → CONFLICT.
- Wallet subscribe path uses the same key as ledger `idempotencyKey` and replays via `findSubscriptionByChargeKey` on unique race.
- Mobile (`wallet.tsx`, `plans.tsx`) + website `WalletPanel` emit stable per-attempt UUIDs (`expo-crypto` / `crypto.randomUUID`).

**Tests:** `PaymentIntentService.idempotency.test.ts` (replay + amount mismatch).

### 2) Saved-search alerts ignored structured filters (HIGH false positives)

**Evidence:** Mobile stored raw camelCase `criteria` (or null) in `filters`;
`AlertService.notifyNewMatch` never read `filters` — only category/price/query columns.
A search saved with `market_country=SA` still alerted on any EG listing in-category.

**Fix:**
- `savedSearchMatch.ts`: `match_version: 1` required; unversioned dumps fail-closed; null filters keep legacy column-only path.
- Mirrors SearchService predicates (market_country COALESCE EG, material, payment plan, attributes, etc.).
- Near-me geo → fail-closed (cannot evaluate at publish time).
- Cooldown claim runs **only after** a confirmed match (misses no longer burn the window).
- Mobile `SessionContext` persists `{ match_version: 1, ...buildSearchParams(criteria) }`; main Search tab now passes full criteria.

**Tests:** `savedSearchMatch.test.ts`.

---

## Gates

| Gate | Result |
|------|--------|
| Chain integrity | **108/108** (was 103; +5 Round 7 markers) |
| API vitest | **355 passed / 3 skipped** |
| Mobile `pnpm test` | **PASS** |

---

## Still OPEN / UNVERIFIED (unchanged policy)

- MFA delete TOTP UI (BUG-002)
- Web map twin vs native clusters
- Device / EAS / APNs / FCM / visual QA → **UNVERIFIED**
- Ops Coolify live Paymob webhook end-to-end → **UNVERIFIED**

**Note:** Mobile saved-search **navigation** rich criteria replay closed in Round 8.

**Verdict remains: CONDITIONAL GO — not full million-user certification.**
