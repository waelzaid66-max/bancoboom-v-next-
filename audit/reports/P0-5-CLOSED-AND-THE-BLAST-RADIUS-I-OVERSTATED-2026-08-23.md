# `P0-5` closed — and the blast radius I published was a grep count, not a measurement

**I wrote that finishing `P0-5` meant "38 OpenAPI touchpoints and 98 client references that have never considered a detached row". I have now done it. It was five schema lines and four client sites, and two of those four were already correctly guarded by whoever wrote them.**

**All nine P0s now carry measurements. `pnpm run typecheck` exits 0 from the root for the first time on this branch.**

`canonical/vnext-assembly` compared against the proof branch · real PostgreSQL 16 · full API suite via the official runner · patch in `audit/patches/P0-5-steps-3-6-detached-contract.patch`. **2026-08-23.**

---

# §1 · ⚠️ Correction #42 — I turned a `grep -c` into a work estimate and published it

**What I wrote in `P0-5-PROVEN-AND-ITS-REAL-COST`:**
```
OpenAPI spec references to listing_id     : 38
client call sites reading listing_id      : 98
```
> *"98 client references have never considered a booking, a conversation, a report or a lead whose listing is gone."*

**Both numbers are real counts. Neither is the number of things that needed to change.**

| | published | **measured by doing it** |
|---|---|---|
| OpenAPI schemas needing `nullable: true` | *38 touchpoints* | **5** — `Lead`, `ConversationSummary`, `Report`, `Booking`, `BookingListItem` |
| …already correct | — | **2** — `Story` and `ImportOrder` **already declared `nullable: true`** |
| …correctly non-null | — | `Ad`, `Comment`, `MapCluster` and the request bodies — *those tables still cascade, or the field is an input* |
| client references | *98 to audit* | **98 exist · 0 fail to typecheck · 4 needed a change · 2 were already guarded** |

```
$ pnpm --filter @workspace/<surface> run typecheck        after the DTOs went nullable
banco-mobile 0   banco-web 0   banco-website 0   dealer-os 0   admin-os 0   landing 0
```

> **A count of matches is not a count of defects.** *I have spent this session insisting that a denominator must be earned, and then published two denominators I had not earned. The estimate made the item look like a project; it was an afternoon.*

**The direction of the error matters too.** *Overstating the cost of a correct fix is not a safe error — it is the argument for leaving a defect in place.*

---

# §2 · What actually had to change

## The four response types now say what the database does
```ts
// Nullable since migration 0008: the row survives its listing detached, so
// the evidence is not destroyed when a seller erases a listing (Gate 4).
// A null here means "the listing this refers to is gone", never "unknown".
listing_id: string | null;
```
**`BookingDTO` · `ConversationSummaryDTO` · `AdminLeadRow` · `ReportRow`.** *`11` type errors → `0`.*

**Two joins keyed on that id.** A booking with no listing has no host to name; a detached conversation has no thumbnail. **Both now drop the nulls rather than querying for them** — `inArray(listings.id, [null])` is a question with no answer.

## The four client sites, and the one that would have produced a 500

| site | before | now |
|---|---|---|
| `banco-mobile/app/bookings.tsx` | `router.push(\`/listing/${item.listing_id}\`)` | 🔴 **`/listing/null`** → guarded, row not pressable |
| `banco-web` + `banco-website` `BookingsPanel` | `localizedPath(\`/listing/${booking.listing_id}\`)` | 🔴 **`/listing/null`** → the link is not rendered |
| `banco-mobile/app/(tabs)/messages.tsx` | `params: { listingId: item.listing_id }` | 🔴 **see below** → the key is omitted |
| `admin-os/src/pages/reports.tsx` | `{r.listing_title ?? r.listing_id}` | renders `—`, the table's own convention |
| `banco-web` + `banco-website` `LeadsPanel` | `{lead.listing_id ? … : …}` | ✅ **already correct — no change** |

**The conversation route param is the one that hides.** *The thread screen guards `params.listingId` in six places — `!!params.listingId`, `if (!params.listingId) return`, `{params.listingId ? … }`. Every one of them tests presence. A `null` passed into an expo-router param serialises into the route as the **string `"null"`**, which is present and truthy, so all six guards pass and `getListing("null")` runs — into the malformed-id path I filed earlier that answers **500**, not 400.*

**TypeScript would never have caught it: `\`${null}\`` is a valid string, and `"null"` is a valid param.** *The fix follows a pattern already in this codebase — `assistant.tsx:142` spreads the key in conditionally rather than passing a null.*

---

# §3 · The foreign-key census — I had four in mind, the database has eleven

```
CASCADE   ads · interactions · lead_tokens · listing_attributes · listing_comments
          listing_links(×2) · listing_media · payment_options · saved_listings · user_behavior

SET NULL  audit_log · bookings · conversations · import_orders · lead_billing
          lead_history · message_notification_outbox · messages.listing_ref_id
          price_observations · reports · stories
```

**Migration `0008` converted four of those eleven. The other seven were already `SET NULL` before any of my work** — which raised the obvious question: **do their DTOs lie the way the four did?**

**I checked instead of assuming. They do not.** *`Story.listing_id` and `ImportOrder.listing_id` already carry `nullable: true` in the spec; the rest have no public DTO. There is no second instance of this defect, and I am not going to invent one.*

---

# §4 · ⚠️ Correction #43 — my own reachability tool had the blind spot it was built to find

**`P0-6`'s DONE test is `guard-reachability` returning `UNREACHABLE: 0`. I ran it on the proof branch:**
```
test files: 151   reachable: 144   UNREACHABLE: 7
      artifacts/banco-web/tests/workspace-listing-form.test.mjs
      artifacts/banco-website/tests/workspace-listing-form.test.mjs
      lib/search-contract/tests/*.test.mjs        (5 files)
```

**All seven run.** *I had watched them run — 32/32 on each web package, 47/47 on `search-contract`.*

**The tool only understood two runners:**
```js
if (/\bvitest\b/.test(cmd)) globbing.push([dir, "vitest"]);
if (/\bjest\b/.test(cmd))   globbing.push([dir, "jest"]);
```
**`node --import tsx --test tests/*.test.mjs` was invisible to it** — the pattern `search-contract` has used all along, and the one I adopted for the new web tests **because** it was the repo's precedent.

> **A census that cannot see a whole class of runner reports a wrong denominator. That is the exact disease this tool exists to detect, sitting inside the tool.** *Five false positives had been in every reading I have taken from it.*

**Fixed — and the fix is control-tested, not assumed:**
```
proof branch                     test files: 151   reachable: 151   UNREACHABLE: 0
origin/canonical/vnext-assembly  test files: 147   reachable: 142   UNREACHABLE: 5
```
**It still discriminates.** *On canonical those five are genuinely dead: there is no root recursive `test`, so nothing ever invokes `search-contract`'s own script. **47 assertions that have never executed in CI** — and `P0-6` is precisely what turns them on.*

---

# §5 · The pins — `P0-5` step 6, both mutation-tested

**Two chain-gate assertions, `245 → 247`:**

| pin | mutation | result |
|---|---|---|
| `P-listing-delete-detaches-evidence` | restore `onDelete: "cascade"` + `.notNull()` on `conversations` | 🔴 `[FAIL]`, `246/247` |
| `P-migration-0008-detach-listing-evidence-registered` | drop the entry from `meta/_journal.json` | 🔴 `[FAIL]`, `246/247` |

**The schema pin strips comments before testing**, so a sentence describing the shape cannot satisfy it — Correction #31's lesson, applied to my own new guard rather than to someone else's old one.

---

# §6 · The battery

```
pnpm run typecheck (root, recursive)   exit 0    ← first time on this branch
api-server suite, official runner      93 files passed | 1 skipped
                                      518 tests passed | 3 skipped | 0 failed
Gate-4 acceptance (unedited)           6/6
chain-integrity-gate                   247/247
production-confidence (CI mode)        24/24
seller workspace parity                40/40, both surfaces
banco-web / banco-website              32/32 each
guard-reachability                     UNREACHABLE: 0 of 151
```

**The patch `git apply --check`s clean against a pristine pre-fix tree.**

---

# §7 · Standing — nine of nine

| P0 | Status |
|---|---|
| `P0-1` `P0-2` `P0-3` `P0-4` `P0-6` `P0-7` `P0-8` `P0-9` | ✅ proven and patched |
| **`P0-5` deletion retention** | ✅ **closed — all six steps: migration · media reclamation · DTOs · codegen · client audit · pins** |

**Seven patches in `audit/patches/`, each verified to apply to a pristine tree. Register: 32 classes · 9 at P0 · 1 at P2 · 43 corrections published.**

> **Nine P0s, filed 2026-08-01, specified with reproductions two days ago, all nine now measured and patched.** *Two of the last three corrections were mine about my own instruments: a tool that could not see a runner, and an estimate that was a grep. The gates I was auditing were not worse than the ones I built — they were the same kind of thing, built by people with the same amount of time.*

---
*The four DTOs changed and the compiler read in full rather than sampled. The OpenAPI edit made at five located line numbers and the regenerated client diffed to confirm exactly five type changes. The client blast radius established by typechecking all six surfaces, then by reading all 98 references and classifying each — not by counting matches. The `"null"` param hazard traced through the destination screen's six guards to the route that answers 500. The foreign-key census taken from `pg_constraint` on a live migrated database, and the seven pre-existing `SET NULL` tables checked for the same defect rather than assumed clean. Both new pins mutation-tested. The reachability tool's fix control-tested against canonical to prove it still discriminates. No file modified outside the proof branch; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
