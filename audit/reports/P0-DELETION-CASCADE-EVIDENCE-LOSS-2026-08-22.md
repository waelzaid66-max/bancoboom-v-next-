# 🔴 P0 — A seller can destroy moderation evidence, buyer message history and booking records by deleting their own listing

**Gate-4's RED matrix names it. I verified it at the schema level and the cascade is worse than the report states.** `canonical @ 4f2c81c`. **2026-08-22.**

**My own `LIST-LIN-02` was a subset of this. I found the media half and missed the evidence half.**

---

## 1 · The cascade, read from the live database

Every foreign key referencing `listings`, with its delete behaviour:

```
conversations       ON DELETE CASCADE      ← the buyer/seller thread
reports             ON DELETE CASCADE      ← MODERATION EVIDENCE
bookings            ON DELETE CASCADE      ← transaction history
lead_history        ON DELETE CASCADE      ← captured leads
lead_tokens         ON DELETE CASCADE
listing_comments    ON DELETE CASCADE
interactions        ON DELETE CASCADE
ads                 ON DELETE CASCADE
```

**And the chain continues one level deeper:**

```
messages                     -> conversations   ON DELETE CASCADE
message_notification_outbox  -> conversations   ON DELETE CASCADE
```

### The complete chain

```
DELETE listing
  ├─ conversations CASCADE
  │     ├─ messages CASCADE                    ← every message, not just the thread row
  │     └─ message_notification_outbox CASCADE
  ├─ reports CASCADE                           ← the accusation against this listing
  ├─ bookings CASCADE                          ← what money was paid for
  └─ lead_history CASCADE
```

**Note the trap I nearly fell into:** `messages.listing_id` is `ON DELETE SET NULL`, which looks protective. **It is not the path that matters** — that FK is the listing-*share* reference. The messages die through `conversations CASCADE` regardless.

---

## 2 · What this means, in order of severity

### ① 🔴 The reported party can destroy the report

`reports ON DELETE CASCADE`. **A seller who is reported for a fraudulent, prohibited or misrepresented listing can delete that listing and the report goes with it.**

**The accused controls the evidence.** There is no moderation queue entry left, no record that a complaint existed, and no trail for a repeat-offender pattern. **A seller who does this repeatedly looks like a seller who has never been reported.**

**This is the finding. Everything else below is serious; this one is structural.**

### ② 🔴 Buyers lose their entire conversation

`conversations CASCADE → messages CASCADE`. **A buyer's complete message history with a seller — including agreed price, condition claims, delivery terms, anything said — is deleted by the seller's unilateral action.**

The buyer took no action and is not notified. **In a marketplace, the conversation *is* the contract record.**

### ③ 🔴 Booking and transaction history

`bookings CASCADE`. **If money moved, the record of what it was for is destroyed** while the payment rows survive elsewhere — leaving a payment with no counterpart.

### ④ Lead history and captured leads

`lead_history` and `lead_tokens` CASCADE — **commercially significant for dealer accounts** who pay for leads.

---

## 3 · Gate-4 is correct, and its five RED assertions are the right contract

```
× RED: seller listing deletion must preserve the buyer/seller thread and message history
× RED: seller listing deletion must preserve booking transaction history with a detached listing reference
× RED: seller listing deletion must preserve moderation/report evidence with a detached listing reference
× RED: seller listing deletion must preserve captured lead history with a detached listing reference
× RED: deleteListing must hand first-party media to a durable storage-reclamation path after DB deletion
```

**All five fail today. All five should.**

**And the phrasing is exactly right — "with a detached listing reference."** They are not asking to block deletion; they are asking that the *history* survive with its listing pointer nulled. **`ON DELETE SET NULL` instead of `CASCADE`, plus a tombstone so the record remains readable.** That is the correct shape and the schema already uses it elsewhere: `audit_log`, `import_orders`, `lead_billing`, `price_observations` are all `SET NULL`.

**So the pattern is established in this very schema. It simply was not applied to the tables that hold evidence.**

---

## 4 · ⚠️ Correction #18 — my `LIST-LIN-02` was a subset and I framed it too narrowly

**I reported:** *"deleted listing photos stay publicly readable forever."* **True, and it is item ⑤ of five.**

**I traced the media lifecycle and stopped there. I did not enumerate the foreign keys.** One `pg_constraint` query — the one at the top of this report — would have shown me the whole cascade on the first pass.

> **The lesson is specific and I am recording it: when auditing a delete path, read the schema's delete behaviour before reading the service code. The service showed me `tx.delete(listingMedia)`; the database showed me eight cascades the service never mentions.**

**`deleteListing()` itself carries no comment about any of this** — it owner-checks and deletes. **The most destructive operation in the product is the least documented one.**

---

## 5 · Required repair — and it is a migration, not a code change

**For each evidence-bearing table: `CASCADE` → `SET NULL`, plus a denormalised tombstone so the record stays meaningful after the listing is gone.**

| Table | Change | Why the tombstone matters |
|---|---|---|
| `reports` | `SET NULL` | a report about a deleted listing must still name what was reported |
| `conversations` | `SET NULL` | the thread must survive; buyers keep their record |
| `bookings` | `SET NULL` | a payment needs its counterpart |
| `lead_history` · `lead_tokens` | `SET NULL` | dealers paid for these |
| `listing_comments` | decide | public commentary may reasonably go |
| `interactions` · `ads` | **keep CASCADE** | genuinely listing-scoped, no evidentiary value |

**A bare `SET NULL` is not sufficient on its own.** A report row pointing at nothing is not evidence. **Each retained row needs enough denormalised context — title, category, seller id at time of deletion — to remain readable.** That is what "detached listing reference" has to mean in practice.

> **ORDER: forward migration altering the FK behaviour, plus the tombstone columns, plus the Gate-4 matrix turning GREEN. Do not weaken the Gate-4 assertions to match current behaviour.**

---

## 6 · Receiving — three new branches, all verified

| Branch | Gates | Decision |
|---|---|---|
| **`fix/api-test-db-safety`** (2) | 0 blocking · 245/245 · 26/26 · 124/124 | ✅ **ACCEPT** — §7 |
| **`audit/db-adoption-guard`** (3) | 0 blocking · 245/245 · 26/26 · 124/124 · **API 505/505** | ✅ **ACCEPT** |
| **`test/listing-deletion-retention-red`** (2) | RED by design, 5 assertions | ⏸️ **HOLD for GREEN** — correct process |

**`audit/db-adoption-guard`** adds a readiness probe that is precisely targeted:

```ts
await db.execute(sql`SELECT client_message_id FROM messages LIMIT 0`);
// a pre-journal database accidentally stamped past the historical adoption
// prefix must not receive traffic without the client idempotency column
// Messenger send relies on.
```

**The API now refuses readiness rather than serving traffic with a silently broken Messenger.** Fail-closed on a real adoption hazard. **Verified: API suite 505/505 on that branch.**

---

## 7 · ✅ `fix/api-test-db-safety` — and it closes a hole in a tool *I* used repeatedly

**The old runner accepted any `DATABASE_URL` and ran migrations, seed and destructive tests against it.** I used it nine or more times. **I never flagged that pointing it at a real database would migrate and seed that database.** It is a finding I should have made and did not.

**Verified both halves myself:**

```
$ DATABASE_URL=... node scripts/run-api-tests-local.mjs
[FAIL] Refusing inherited DATABASE_URL: destructive API integration tests never
       mutate an arbitrary supplied database.

$ (armed path)
API integration test database: banco_api_test_533c7752cffd2940
[migrate] done in 518ms          ← then replayed: done in 8ms (idempotent)
Tests  505 passed | 3 skipped
```

**And I confirmed the cleanup rather than trusting it:** `banco_api_test_%` databases remaining afterwards: **0**. `template1` uncontaminated: **0 extensions**.

**It also implements half of my `DEPLOY-01` order** — lines 217 and 258 now run `CREATE EXTENSION IF NOT EXISTS pg_trgm` for both the docker and external paths. **The migrator half is still open.**

---

## 8 · Register

| ID | Entry | Sev |
|---|---|---|
| **P-21** *(new)* | **Listing deletion cascades away moderation reports, buyer message history, bookings and leads** | **P0** |
| **P-5** | superseded — **absorbed into P-21 as item ⑤ of five** | — |

**Register: 25 classes, 9 at P0.**

---

## 9 · Standing

**The team is now finding things I missed, in areas I audited.** Gate-4 is a broader and better-specified version of my own finding, and the DB-safety fix closes a hazard in a tool I used without questioning.

**That is the right direction for a handover.** My job is to verify and to be wrong out loud when I am — this is the second time in two days that a colleague's reading beat mine.

**Production: `NO-GO`.** A new P0, two acceptances, and one correction against my own record.

---
*Cascade enumerated by querying `pg_constraint` against a live database, then traced one level deeper through `conversations`. Gate-4 executed and its five RED assertions observed failing. Both halves of the DB-safety runner exercised, and its cleanup verified by counting leftover databases rather than assuming. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
