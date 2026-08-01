# Round 8 — Saved-search nav + B2B tombstones + top-up regression

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Proven HIGH only. Precision over speed. No MFA UI / SVG / full web-map rewrite.

---

## Defects closed

### 1) Mobile saved-search navigation dropped rich criteria (HIGH)

**Evidence:** `saved.tsx` pushed only legacy six fields; `search.tsx` ignored `searchNavParams` (orphan module). Round 7 fixed **server alerts**; client tap-to-replay still lost brand/market/material/near-me/….

**Fix:**
- `saved.tsx` → `searchCriteriaToNavParams(criteria)` when snapshot present
- `search.tsx` → `hasIncomingSearchNavParams` + `parseMobileSearchNavParams`; `applySaved` prefers `s.criteria`
- `searchNavParams.ts` → include `property_type` / `propertyType` in detect keys

**Tests:** mobile `lib-hardening` static guards.

### 2) B2B public boards leaked soft-deleted owners (HIGH)

**Evidence:** Listings use `publicVisibilityConditions` (`deletedAt IS NULL`). Investments / RFQ / global-supply public boards only filtered shadow-ban (or nothing for RFQ). Offers/responses still accepted on open rows owned by deleted users.

**Fix:**
- Investments: public conditions + detail/interest fail-closed on `owner_deleted_at`
- RFQ: open list + detail + `submitOffer` fail-closed
- Global supply: open list + detail + `respondToRequest` fail-closed

### 3) `banco-web` top-up broken after Round 7 schema (HIGH regression)

**Evidence:** API requires `idempotency_key`; website fixed; frozen `banco-web` still called without key → Zod 400 on Coolify consumer web.

**Fix:** Sync `WalletPanel` attempt-key pattern from `banco-website`.

### 4) Dealer-os boost attempt key unstable on retry (MED)

**Fix:** `boostAttemptKeyRef` on listings + ads (same pattern as mobile `PromoteButton`).

---

## Gates

| Gate | Result |
|------|--------|
| Chain integrity | **114/114** (was 108; +6 Round 8 markers) |
| API vitest | **355 passed / 3 skipped** |
| Mobile tests | **PASS** (incl. saved-search nav guards) |

---

## Still OPEN / UNVERIFIED

- MFA delete TOTP UI (BUG-002) — product
- Web `SearchResultsMap.web` cluster twin (proven incomplete; deferred as larger bounded port)
- Device / EAS / APNs / FCM / visual QA → **UNVERIFIED**
- Live Coolify Paymob webhook E2E → **UNVERIFIED**

**Verdict remains: CONDITIONAL GO.**
