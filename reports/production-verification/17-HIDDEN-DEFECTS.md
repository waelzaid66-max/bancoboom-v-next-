# 17 — Hidden production defects (adversarial hunt)

**Branch:** `cursor/production-hardening-5cf0`  
**Date:** 2026-07-29  
**Method:** Assume obvious bugs fixed → hunt concurrency, lifecycle, security, deploy, scale → prove → fix → re-verify.

---

## Closed this hunt (with code + gates)

| ID | Severity | Defect | Fix |
|----|----------|--------|-----|
| H1 | CRITICAL | Soft-deleted users still authorized via `requireAuth` + `getDbUser` (JWT linger after Clerk delete lag) | `requireAuth` rejects `deletedAt`; `getDbUser` filters active; delete clears `isAdmin`/`staffRole` |
| H2 | CRITICAL | PSP charge before durable `payment_intents` row; webhook ACK 200 for unknown intent → stranded money | Insert intent first; webhook returns **503** for unknown |
| H3 | CRITICAL | Subscription unique-slot conflict ACKed while intent stayed pending | Orphan wallet top-up + complete intent; settle from `failed` |
| H4 | HIGH | Premature `failed` webhook blocked later success | Settle from `pending` **or** `failed` |
| H5 | HIGH | Booking create TOCTOU double-book | `SELECT … FOR UPDATE` + overlap in transaction |
| H6 | HIGH | Booking / FI status last-write-wins | Conditional UPDATE on observed status |
| H7 | HIGH | FI seats survived account soft-delete → inbox PII with lingering JWT | Delete `financing_seats` in `deleteAccount` txn |
| H8 | HIGH | Ad budget read-modify-write overspend | Conditional SQL spend `WHERE spent+cost <= total` |
| H9 | HIGH | Listing quota TOCTOU under concurrent creates | `pg_advisory_xact_lock` per seller in quota check |
| H10 | MED | Listing bump cooldown TOCTOU | Conditional `UPDATE … WHERE bumped_at` cooldown |
| H11 | HIGH | Mobile consent set `accountTypeChosen` before `updateMe` | Flag only after successful `/me` |
| H12 | HIGH | Verify Go Back cleared consent during finalize | Disable + lock while signing up |
| H13 | HIGH | Plug **rewrite** left pathname `/` → SiteChrome over maintenance | **Redirect** (web + website twins) |
| H14 | MED | Compose/GCP sent traffic on liveness-only probes | API compose → `/api/readyz`; GCP startup → `readyz` |
| H15 | HIGH | Chat media insert before upload ownership assert | Assert before `insert(messages)`; `UploadOwnershipError.code=FORBIDDEN` |
| H16 | HIGH | Company brand URLs written before ownership assert | Assert before `companyProfiles` upsert |
| H17 | MED | Web `site-env` API fallback `:5000` vs rewrite `:8080` | Aligned both to `localhost:8080` (web + website) |

---

## Verification evidence

| Gate | Result |
|------|--------|
| `node scripts/chain-integrity-gate.mjs` | **68/68 PASS** |
| `pnpm --filter @workspace/api-server run test` | **346 passed / 3 skipped** |
| `node --test artifacts/banco-mobile/tests/accounts-clerk-journey.test.mjs` | **13/13 PASS** |

---

## Residual risks (not fixed this round — tracked)

| Risk | Why deferred |
|------|----------------|
| In-process feed/abuse session Maps + memory rate-limit | Needs Redis/shared store for multi-replica; architectural |
| Weekly digest job lacks per-dealer/week idempotency | Session advisory lock can drop; needs durable send ledger |
| No Clerk `user.deleted` webhook → live listings after dashboard delete | External Clerk dashboard + webhook wiring (ops) |
| `NEXT_PUBLIC_*` bake-only in Coolify images | Ops discipline / rebuild on key change |
| Live Paymob / EAS / OAuth / device push | PENDING_RUNTIME |

---

## Decision impact

These defects were **incident-class** (money stranding, deleted-user access, double-book, ad overspend). Closing them raises confidence for staging Coolify; decision remains **CONDITIONAL GO** until live secrets + PSP webhook + store submit are proven in the target environment.
