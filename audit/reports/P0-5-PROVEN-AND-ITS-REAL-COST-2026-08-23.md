# `P0-5` proven — 6/6 on an unmodified acceptance test. And the fix is the one P0 that is genuinely large.

**I applied the deletion-retention fix and ran the Gate-4 test that another agent wrote as its acceptance criterion. All six pass, with the test file byte-identical to theirs.**

**Then the typecheck showed what nobody had measured: making those columns nullable produces eleven type errors across four services, and the contract reaches 98 client call sites and 38 OpenAPI touchpoints.**

`canonical @ 4f2c81c` · real PostgreSQL 16 · patch in `audit/patches/P0-5-deletion-retention.patch`. **2026-08-23.**

---

# §1 · ⚠️ Correction #37 — my own `C-3` order would have failed this test

**I ordered:**
> *"C-3 · retire instead of destroy — `status: "archived", deletedAt: new Date()`. The 15 CASCADEs stay."*

**The Gate-4 contract says the opposite, and it says it explicitly:**
```ts
expect(listingRows).toHaveLength(0);      // the listing row must be GONE
expect(mediaRows).toHaveLength(0);        // its listing_media rows must be GONE
expect(detail).toBeNull();
…
expect(thread?.listingId).toBeNull();     // the conversation SURVIVES, detached
expect(booking?.listingId).toBeNull();
expect(report?.listingId).toBeNull();
expect(lead?.listingId).toBeNull();
```

**My retirement design keeps the listing row. It would fail two assertions.** *And their design is better on the point I myself flagged as `OWNER_POLICY_REQUIRED`: the listing genuinely disappears — which is what an erasure request needs — while the evidence survives detached.*

> **I read their test before writing a line, which is the only reason this is a correction and not a wasted day.**

---

# §2 · The fix, and it is two parts

## Migration `0008_detach_listing_evidence`
```sql
ALTER TABLE "conversations" ALTER COLUMN "listing_id" DROP NOT NULL;
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_listing_id_listings_id_fk";
ALTER TABLE "conversations" ADD CONSTRAINT … ON DELETE SET NULL …;
-- and the same for bookings, reports, lead_history
```
**`listing_media` deliberately keeps `ON DELETE CASCADE`** — the contract requires those rows gone.

```
applied to an existing database   → done in 28ms
applied to a fresh database       → done in 718ms, 74 tables
resulting FK actions:
  bookings|SET NULL|nullable YES      conversations|SET NULL|YES
  lead_history|SET NULL|YES           reports|SET NULL|YES
  listing_media|CASCADE|NOT NULL      ← unchanged, as required
```

## Media reclamation in `deleteListing`
**The primitive already existed and was already tested** — `objectStorageService.deleteServingUrls`, with its own suite proving it *"deletes resolved objects, skips foreign/invalid URLs, treats missing as deleted"*. **`deleteListing` simply never called it.**

```ts
// media identities are read BEFORE the delete — listing_media stays CASCADE,
// so afterwards these rows are gone and the objects would be unreachable
const mediaRows = await db.select({ url: …, thumbnailUrl: … })…;
await db.delete(listings).where(eq(listings.id, id));
// reclamation runs AFTER the commit and never rolls it back
const result = await objectStorageService.deleteServingUrls(servingUrls);
if (result.failed > 0) logger.error({ listingId: id, ...result }, "…reported failures");
```

---

# §3 · The proof

```
$ diff <(git show origin/test/…:ListingDeletionRetention.gate4.test.ts) <the copy I ran>
  IDENTICAL — zero edits

$ npx vitest run src/services/ListingDeletionRetention.gate4.test.ts
  VITEST_EXIT=0
  Test Files  1 passed (1)
  Tests       6 passed (6)
```

**Five RED assertions and one GREEN invariant, all satisfied, on a test I did not touch.**

---

# §4 · 🔴 AND THE REAL COST — eleven type errors nobody had measured

```
$ pnpm --filter @workspace/api-server run typecheck
  exit 2      error TS: 11
```
```
AdminService.ts(661)        AdminLeadRow.listing_id
BookingService.ts(27,296,309)   BookingDTO.listing_id
ConversationService.ts(350,352,359)  ConversationSummaryDTO.listing_id
ReportService.ts(126,150,183,297)    ReportDTO.listingId
```

**Every consumer of those rows declares `listing_id: string`. Making the column nullable makes four public API response types nullable.**

## The blast radius, measured

```
API DTOs that must become nullable        :  4
OpenAPI spec references to listing_id     : 38
client call sites reading listing_id      : 98
    banco-mobile 57 · banco-web 17 · banco-website 17 · dealer-os 5 · admin-os 2
```

> **`P0-5` is behaviourally solved and contractually unfinished.** *The database does the right thing. Four response shapes now lie about it, and 98 client references have never considered a booking, a conversation, a report or a lead whose listing is gone.*

**This is not a reason to abandon the fix.** *It is the reason nobody should apply the migration alone and call it done — which is exactly what would have happened.*

---

# §5 · ORDER — Space C, and it is a real project, not a line

**C-3 (superseded) → C-3′:**
1. ✅ **`0008_detach_listing_evidence`** — written, applied both ways, proven
2. ✅ **media reclamation in `deleteListing`** — written, uses the existing tested primitive
3. 🔴 **four DTOs to `listing_id: string | null`** — `BookingDTO`, `ConversationSummaryDTO`, `AdminLeadRow`, `ReportDTO`
4. 🔴 **regenerate the OpenAPI spec and the typed client** — 38 touchpoints
5. 🔴 **audit 98 client references** for the detached case. *A conversation about a deleted listing still has to render something; that is a product decision, not a type cast.*
6. 🔴 **`P-listing-delete-detaches-evidence`** pinning the four `SET NULL` constraints, so a future migration cannot quietly restore the cascade

**DONE for the whole item:** Gate-4 6/6 **and** `pnpm run typecheck` exit 0 **and** each client surface renders a detached row without crashing.

**Steps 1–2 are in `audit/patches/P0-5-deletion-retention.patch` and can land today.** *Steps 3–5 are the part that has been invisible.*

---

# §6 · Standing

| P0 | Status |
|---|---|
| `P0-1` DEPLOY-01 · `P0-2` `price_cash` · `P0-6` root test · `P0-8` auth · `P0-9` gate size | ✅ **proven and patched** |
| **`P0-5` deletion retention** | ✅ **behaviourally proven** · 🔴 **DTO + client propagation open** |
| `P0-3` `P0-4` `P0-7` | specified, unproven |

**Register: 32 classes · 9 at P0 · 1 at P2 · 37 corrections published.**

> **Six of nine P0s now have a measurement instead of an argument. The seventh turned out to be the one that was never small — and the only way to learn that was to apply it and read the compiler.**

---
*The acceptance test copied in from its branch and verified byte-identical by `diff` before being run, so the pass cannot be an artifact of an edit. The migration applied both to an already-migrated database and to an empty one. The type errors read in full and attributed to the four DTOs they come from. The client blast radius counted per surface rather than estimated. The media reclamation primitive confirmed to pre-exist, with its own test, before being wired. No file modified outside `audit/` on the audit branch; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
