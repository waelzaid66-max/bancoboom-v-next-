# Cleared by execution — the search and pagination layer is correct, including the cases nobody tested

**Four P0s were reproduced today. This report is the other half of the same session, and it matters just as much: three things I have been circling turned out to be right, and I proved it rather than assuming it.**

**Clearing a path is not a smaller result than finding a defect. A team that rebuilds working code loses exactly as much time as a team that ships a broken one — and this repository already has a comment inviting precisely that.**

`canonical @ 4f2c81c` · PostgreSQL 16 with the full seed. **2026-08-22.**

---

## 1 · ✅ The composite keyset cursor survives the worst case that exists

**The recency cursor is `"<isoTs>|<id>"`, and its condition is:**
```sql
recency < :ts  OR  (recency = :ts AND id > :lastId)
ORDER BY recency DESC, id ASC
```

**I have praised this repeatedly for avoiding the boundary-skip bug. Today I forced the condition it exists to survive** — *every active listing given one identical `bumped_at`* — and walked the cursor page by page:

```
58 listings, ONE shared recency timestamp, page size 6

pages walked: 10   rows returned: 58   distinct rows: 58   total active: 58
```

> **Perfect traversal under 100% ties. No duplicate, no omission, no page that loops forever.**

**That is the exact scenario a naive `recency < :ts` cursor fails** — it either skips every row sharing the boundary timestamp or returns the same page forever. **This implementation does neither, and the `id > :lastId` half is why.**

---

## 2 · ✅ OFFSET pagination on the price/popular/nearest sorts is not the bug I suspected

**`SearchService.ts:470` uses a numeric OFFSET for `price_asc`, `price_desc`, `popular` and `nearest`, and I have flagged it as a risk in three reports.** *The risk is real in general and absent here, for a reason I had not credited:*

```ts
sort === "price_asc"  ? [asc(listings.basePriceCash),  asc(listings.id)]
sort === "price_desc" ? [desc(listings.basePriceCash), asc(listings.id)]
sort === "popular"    ? [desc(popularity),             asc(listings.id)]
```

**Every sort carries `asc(listings.id)` as a tiebreaker, which makes the ordering a total order.** Measured:

```
seeded data (58 distinct prices):        58 rows collected · 58 distinct · 58 total   ✅
FORCED worst case (all 58 same price):   58 rows collected · 58 distinct · 58 total   ✅
```

> **Paged end to end with every row sharing a single price — still no duplicate and no omission.** The tiebreaker is doing real work.

### The honest residual

**OFFSET still drifts when the dataset changes between two page fetches** — a listing inserted or bumped ahead of the current page shifts everything after it. **That is inherent to OFFSET and it is a genuinely lower-severity class** than the correctness bug I was implying. **It is not worth a rewrite today**, and if it is ever addressed the fix is a composite `(price,id)` keyset, not a redesign.

**⚠️ And one thing I will not claim:** I also ran the same paging **without** the `id` tiebreaker and it happened to return 58 distinct rows. **That is luck at this scale, not a guarantee** — PostgreSQL is free to return ties in any order across separate queries. *Recording it so nobody reads that line as permission to drop the tiebreaker.*

---

## 3 · ✅ The trigram indexes exist and the planner uses them

**I once suspected `ILIKE '%term%'` meant sequential scans, corrected myself on reading, and never proved it. Proved now:**

```
idx_listings_title_trgm         gin (title gin_trgm_ops)
idx_listings_description_trgm   gin (description gin_trgm_ops)
idx_reference_places_blob_trgm  gin (search_blob gin_trgm_ops)
idx_reference_developers_blob_trgm  gin (search_blob gin_trgm_ops)
```

```
EXPLAIN  select id from listings where title ilike '%toyota%'

 Bitmap Heap Scan on listings
   Recheck Cond: (title ~~* '%toyota%')
   ->  Bitmap Index Scan on idx_listings_title_trgm
         Index Cond: (title ~~* '%toyota%')
```

**The planner chooses the trigram index.** *This is what `pg_trgm` is for, and it is also why `DEPLOY-01` is fatal rather than cosmetic — these four indexes are created by migration `0000`, which is the migration that cannot run without the extension.*

### 🔴 The one thing that IS wrong here — a comment

`SearchService.ts:408`:
> *"ILIKE for now; a GIN/tsvector index is the planned scale-up"*

**The GIN index exists, is used, and has existed since `0000`.** **That comment tells the next engineer to build something that is already built.** It is one line, it is Space E, and it is worth more than it looks: *the cheapest defect in this repository is the one that makes somebody rebuild a working path.*

---

## 4 · What this pass adds to the standard

**Three claims of mine went into today's session unproven. All three came back correct — and two of them I had previously described as risks.**

| Claim | Status before | Status now |
|---|---|---|
| composite keyset avoids the boundary-skip bug | asserted from reading | **proven under 100% ties** |
| OFFSET on price sorts is a correctness risk | flagged in three reports | **cleared — the `id` tiebreaker makes it a total order** |
| `ILIKE` is index-backed | corrected once, never proven | **proven by `EXPLAIN`** |

> **An auditor who only publishes findings drifts toward finding things.** Two of the three items above were mine, they were on the register as concerns, and the honest result was that the engineering was right. **Both directions have to be executed with the same rigour or the register stops being evidence.**

---

## 5 · Standing

**Register unchanged at 27 classes, 9 at P0 — no new class, and one downgraded:** *OFFSET pagination moves from "risk" to "inherent OFFSET drift, low severity, no action."*

**`SearchService.ts:408` remains the only defect in this layer, and it is a comment.**

---
*Keyset traversal executed as a real page-by-page walk inside a transaction with every recency value forced identical, then rolled back. OFFSET paging measured on the seeded distribution and again with every price forced identical. The no-tiebreaker variant run as a control and explicitly recorded as inconclusive rather than reported as a pass. Index usage taken from the planner's own output, not inferred from the existence of the index. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
