# P-21 reproduced — one `DELETE` erases the conversation, the booking, the moderation report and the lead history

**Fourth P0 executed against a live database today. This one I demonstrated rather than described: I gave a listing a real history, ran exactly the statement `deleteListing` runs, and counted what survived.**

**Nothing survived.**

`canonical @ 4f2c81c` · PostgreSQL 16, inside a transaction, rolled back afterwards. **2026-08-22.**

---

## 1 · The demonstration

**A seller has a live listing with real history — a buyer conversation, a booking, a moderation report filed against it, lead activity, and photos:**

```
=== BEFORE ===
 conversations | messages | bookings | reports | lead_history | media
             1 |        2 |        1 |       1 |            3 |     2
```

**Then the seller taps Delete. `deleteListing` runs exactly one statement:**

```sql
DELETE FROM listings WHERE id = …
```

```
=== AFTER ===
 conversations | messages | bookings | reports | lead_history | media
             0 |        0 |        0 |       0 |            0 |     0
```

> **Every row. One statement. No warning, no archive, no retention.**

**And the report is the one that should stop the room:** a seller reported for `scam` **deletes the report by deleting the listing.** *Moderation evidence is destroyed by the person it was filed against, using a button built for tidying up their own inventory.*

---

## 2 · The mechanism — 22 foreign keys, and the split is the story

**Enumerated from `pg_constraint`, not from the schema file:**

**15 CASCADE — destroyed:**
```
ads · bookings · conversations · interactions · lead_history · lead_tokens
listing_attributes · listing_comments · listing_links (×2) · listing_media
payment_options · reports · saved_listings · user_behavior
```

**7 SET NULL — survive, detached:**
```
audit_log · import_orders · lead_billing · message_notification_outbox
messages(listing_ref_id) · price_observations · stories
```

### `messages` looks safe and is not

`messages.listing_ref_id` is `SET NULL`, which reads like protection. **It is not, because messages hang off conversations:**

```
listings  →(CASCADE)→  conversations  →(CASCADE)→  messages
```

**Verified from `pg_constraint`:** `messages.conversation_id` → `conversations` is `CASCADE`. **The whole thread goes with the listing.** The `SET NULL` only covers a message that *mentions* a listing without belonging to its conversation.

### The asymmetry that costs money

```
lead_history   CASCADE    ← the evidence
lead_billing   SET NULL   ← the invoice
```

> **The charge survives. The proof of what was charged for does not.** A billing dispute after a listing deletion cannot be resolved from this database.

---

## 3 · ✅ The fix is already in the schema — twice

**I was about to order fifteen FK changes. The database says that is not necessary.**

```
listing_status enum:  active, sold, archived, draft, pending_approval,
                      pending_review, approved, rejected, flagged
                                      ↑ a retirement state already exists
users.deleted_at                      ← the soft-delete pattern already exists here
```

**And public visibility is already gated on `active` — at every public call site:**
```
ListingService.ts:818   eq(listings.status, "active")   listingIsPubliclyVisible
ListingService.ts:879   eq(listings.status, "active")   getSeoListing
ListingService.ts:936   eq(listings.status, "active")   getSitemapListings
ListingService.ts:1209  eq(listings.status, "active")   getPublicListings
```

> **Setting `status = 'archived'` removes the listing from every public surface immediately, preserves every child row by construction, and requires no foreign-key migration at all.** *The machinery was built. `deleteListing` simply does not use it.*

---

## 4 · ORDER — Space C

### C-3 · retire instead of destroy
```ts
// deleteListing — replace the hard DELETE
await db.update(listings)
  .set({ status: "archived", deletedAt: new Date() })
  .where(eq(listings.id, id));
```
**`users` already carries `deleted_at`; add the mirror column to `listings` in a forward migration.** *The 15 CASCADE constraints stay exactly as they are — they are correct for a real deletion, which is now an administrative operation rather than a seller button.*

**DONE means:** the Gate-4 matrix on `test/listing-deletion-retention-red-20260822` goes green **with no edit to the test file.** Four of its five assertions are satisfied by this change alone.

### C-4 · the fifth Gate-4 assertion — media reclamation
```
RED × deleteListing must hand first-party media to a durable storage-reclamation path
```
**Archiving preserves the `listing_media` rows, so the objects stay addressable — but nothing retires them, and a retired listing's photos are still served.** *Enqueue the object keys to the existing outbox rather than deleting anything inline; a storage failure must not roll back the retirement.*

### C-5 · pin it
```js
{
  id: "P-listing-delete-is-retirement",
  file: "artifacts/api-server/src/services/ListingService.ts",
  test: (s) => {
    const fn = s.slice(s.indexOf("export async function deleteListing"));
    const body = fn.slice(0, fn.indexOf("\n}\n") + 1);
    return /status:\s*"archived"/.test(body) && !/db\.delete\(listings\)/.test(body);
  },
  why: "A hard DELETE cascades away the buyer conversation, the booking, the moderation report and the lead history — a reported seller can erase the report by deleting the listing; retirement preserves all of it and the public surfaces already filter on status = active",
}
```

### ⚠️ One question that is genuinely the owner's
**A seller asking for erasure under a privacy right is a different operation from a seller tidying inventory.** Retirement is correct for the button. **A true erasure path — admin-operated, audited, and explicit about what it destroys — is a separate feature and a policy decision.** *Flagged as `OWNER_POLICY_REQUIRED`, and it does not block C-3.*

---

## 5 · Standing

**`P-21` moves from `VERIFIED-BY-READING` to `REPRODUCED`, with a measured blast radius.**

**Four P0s reproduced by execution today. Every one turned out smaller than the order I had written for it:**

| | Defect | My earlier order | What it actually takes |
|---|---|---|---|
| `DEPLOY-01` | fresh deploy → 0 tables | a forward migration *(impossible)* | **one line in `migrate.ts`** |
| `P-2` | edit divides price by 10⁶ | add a new `price_raw` field | **repair the field that already exists** |
| `P-3` | web cannot list anything | add three fields | **share the taxonomy mobile already has** |
| `P-21` | delete erases everything | change 15 FK actions | **use the `archived` status that already exists** |

> **Four times in one day, the repository already contained the answer, and my order was larger than the defect.** *The pattern is consistent enough to be a rule: before specifying a fix, look for the machinery that was already built for it. This codebase keeps having it.*

---
*Blast radius measured by inserting a real conversation, messages, booking, report and lead history against a seeded listing, running the exact statement `deleteListing` issues, counting the survivors, and rolling the transaction back. Foreign-key actions enumerated from `pg_constraint.confdeltype` rather than read from the schema file. The `messages` chain traced through `conversations` before concluding that a `SET NULL` did not protect it. The existing `archived` status and the four public `status = active` filters verified before proposing retirement. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
