# Round 16 — Partial refund claw, tombstones, notif scrub, prod compose

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Accuracy ≫ speed. Multi-repo residual hunt after R15. Source re-verify every claim. Proven CRITICAL/HIGH only. No invented features (no Clerk inbound webhook, no Redis, no MFA TOTP UI, no CPL product flip, no Paymob order-fetch invention).

---

## Hunt method

Re-read R15 residuals → money webhook amount gate + boost debit tombstone → Review/GlobalSupply write gates → deleteAccount notification privacy → prod compose health depends → character-level verify → patch + real vitest + chain markers.

---

## Defects closed

### 1) CRITICAL — Partial refund ACK with zero clawback

**Evidence:** Success-path exact `amount_cents === intent` gate ran before refund/void branch. Partial Paymob refunds ACK 200 with no ledger reverse.

**Fix:** Split guards — reverse allows `0 < cents ≤ intent` (missing amount → full claw). Pass `clawAmountEgp`; cumulative `psp_clawed_cents` with per-delivery idempotency (`txn:` / watermark).

### 2) HIGH — Boost debits soft-deleted seller

**Evidence:** Listing `FOR UPDATE` without seller `deletedAt` check; debit path ignores tombstone.

**Fix:** Seller `FOR UPDATE` + `deletedAt IS NULL` before promo/wallet debit.

### 3) HIGH — `createReview` skipped seller tombstone

**Evidence:** `listReviews` uses `isNull(deletedAt)`; `createReview` did not.

**Fix:** Mirror list gate.

### 4) HIGH — GlobalSupply respond missing shadow-ban

**Evidence:** RFQ `submitOffer` rejects; GlobalSupply respond did not.

**Fix:** Same FORBIDDEN gate.

### 5) HIGH — deleteAccount left named notifications

**Evidence:** Only `message` notifications purged; `new_match` / follow `system` / `review` kept pre-delete names.

**Fix:** Purge by `company_user_id`, `follower_id`, authored `review_id`.

### 6) HIGH OPS — prod compose frontends ignored API health

**Evidence:** Coolify uses `condition: service_healthy`; `docker-compose.prod.yml` bare `depends_on: api`.

**Fix:** Match Coolify healthy depends for web / website / static web.

---

## Explicitly deferred (honest)

| Item | Why |
|------|-----|
| Unsigned first-bind TOFU (`merchant_order_id`) | Needs signed correlation or server-side Paymob order fetch — not invented this round |
| Facets `market_country` | MED chip-count skew only |
| CPL fail-open / Clerk inbound delete / Redis / MFA UI | Product/infra invention |
| Comment-notification name scrub | No `author_id` in data — MED residual |
| Device/EAS visual QA | UNVERIFIED |

---

## Gates

| Gate | Result |
|------|--------|
| Chain | **164/164 PASS** |
| API vitest | **384 passed / 3 skipped** |
| Cross-repo cherry-pick | **NONE** |
