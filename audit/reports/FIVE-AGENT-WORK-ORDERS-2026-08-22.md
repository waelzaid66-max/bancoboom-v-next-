# FIVE AGENT WORK ORDERS — non-overlapping spaces, surgical detail

**Direction issued after studying the collective record: 102 agent reports read, every classified finding checked, and this auditor wrong eighteen times and corrected in public.**

**The five spaces below do not overlap. That is the point.** The technical debt in this project was created by agents working the same surfaces without a boundary — five car-header branches, three parallel SOT gates, four guards born dead. **Isolation of ownership is the mechanism that stops it.**

`canonical @ 4f2c81c` · **56 branches** · trunk frozen since 2026-08-21 10:27. **2026-08-22.**

---

# §0 · THE COLLECTIVE POSITION — what every agent agrees on

**I am not issuing this from my own view alone. Read across all 102 reports, these are the points on which every independent agent converges:**

| Point | Who holds it |
|---|---|
| **CI status is not a product verdict** | PR13 revalidation · admin-dealer-web · me |
| **Do not weaken a guard to match current source** | PR13 revalidation · me *(after I violated it)* |
| **Device/runtime evidence is absent and no source audit closes it** | 96-headers · EAS readiness · ACC-LIN-02 · me |
| **No patch is authorised by a ledger alone** | ACCOUNTS-FI · Gate-3 · Gate-4 |
| **Section work must not delete another section's capability** | PR13 revalidation |
| **A static guard proves a token exists, never that behaviour is correct** | ACCOUNTS-FI · ACC-LIN-02 · PR13 · me |

**These six are the constitution. Every order below inherits them.**

---

# §1 · THE FIVE SPACES

**One owner per space. No agent touches another's files. Conflicts between spaces come to me, not to a merge.**

| # | Space | Owns these paths | Never touches |
|---|---|---|---|
| **A** | **Platform & Infrastructure** | `lib/db/**` · `scripts/**` · `.github/**` · `docker-compose*.yml` · `deploy/**` · root `package.json` | any `artifacts/*/src` |
| **B** | **Web Seller Surfaces** | `artifacts/banco-web/**` · `artifacts/banco-website/**` | mobile · api-server |
| **C** | **Data Lifecycle & Authority** | `artifacts/api-server/src/services/**` · `artifacts/api-server/src/controllers/**` | clients · migrations *(request from A)* |
| **D** | **Mobile Client** | `artifacts/banco-mobile/**` | api-server · web · db |
| **E** | **Search, Scale & Intelligence** | `SearchService.ts` · `FeedService.ts` · `AdaptiveFeedEngine.ts` · `ConversationService.ts` *(read paths)* | everything else |

**Where two spaces must meet — C needs a migration, E needs an index — the requesting space files the requirement and A implements it. No cross-space commits.**

---

# §2 · SPACE A — PLATFORM & INFRASTRUCTURE

### Your mandate
**You own the mechanisms that make every other space's work provable. Nothing else can be trusted until yours is.**

### A-1 · 🔴 The glob runner — **do this first, before anything else in this document**

**Evidence:** `api-server/vitest.config` globs `src/**/*.test.ts`; `banco-mobile` has **32 explicit `node --test` scripts and no glob.** Agents carry the auto-discovery assumption across and lose guards.

**Measured cost:** **four guard files** shipped dead since the finding was filed — `account-deletion` ×2, `profile-role` ×1, `android-api36` ×1 *(since wired)*. **And it caused two merge conflicts in one sitting**, both in the same file, both able to silently delete a guard.

**Order:** give `banco-mobile` glob discovery. **Then** add the two-direction assertion as a net: ① every `tests/*.test.mjs` has a script, ② every script is in the aggregate chain.

**Done means:** a new `tests/*.test.mjs` file runs with **zero** edits to `package.json`.

### A-2 · 🔴 `pg_trgm` in the migrator
`lib/db/src/migrate.ts`, after `client.connect()`, before `migrate()`:
```ts
await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
```
**Not a migration** — the journal runs `0000` first and `0000` is what fails. **Not an edit to `0000`** — `baseline.ts` hashes applied migrations.
*Space A already did the runner half (`run-api-tests-local.mjs:217,258`). This is the other half.*
**Done means:** `createdb && migrate` → 74 tables, zero manual steps.

### A-3 · 🔴 `idx_listings_recency_keyset`
```sql
CREATE INDEX idx_listings_recency_keyset
  ON listings (status, (COALESCE(bumped_at, created_at)) DESC, id ASC);
```
**Proven at 200k rows:** current index gives `Seq Scan + Sort`; this gives `Index Scan` with the keyset predicate inside `Index Cond`.
**Done means:** paste the `EXPLAIN` showing `Index Cond` — **the index existing is not the evidence.**

### A-4 · Gitignore the credential set
`google-service-account.json` · `*.p8` · `*.p12` · `*.keystore` · `*.mobileprovision`. **`git check-ignore` returns exit 1 today, on a public repo.** Pin the rule with a chain assertion.

### A-5 · Backup profile + **a restore actually performed**
`pg_dump` exists only in AWS prose. Mirror the `migrate` profile: one-off, `restart: "no"`. **A backup nobody has restored is a hypothesis.**

### A-6 · Edge limits, or record their absence
`rateLimiter.ts:24-26` states production needs distributed limits because the store is process-local, and compose anticipates replicas. **Provide them, or record explicitly that one replica runs.**

### A-7 · A web CI job that is not `docker build`
`ci-website-docker.yml` runs five image builds and zero tests. **Compiling is not working.**

---

# §3 · SPACE B — WEB SELLER SURFACES

### Your mandate
**Two workspaces, zero tests, and every P0 in the register lives here. You are not fixing bugs; you are bringing a zone inside the perimeter.**

### B-1 · 🔴 Price — and the cheap fix is already in your codebase
**Proven end-to-end through the real API:** `1,500,000 → "1.50M EGP" → "1.50" → 1.5`. Every listing ≥1,000 EGP, both surfaces, byte-identical.

**Do NOT invent an honest `price_cash`.** `price_raw` already exists — in the contract as `zod.string().optional()`, emitted without a `typeof` gate at `ListingService.ts:1137`, **and already used correctly by `dealer-os`:**
```ts
const p = cleanNumberString(listing?.price_raw);   // dealer-os does this today
```
**But it is on `getDealerListings`, not `getListingDetail`.** → **file the one-line request to Space C**, then hydrate from it exactly as `dealer-os` does.

### B-2 · 🔴 Create is impossible — all three categories
Server validator against your form's full vocabulary: `car missing=condition · real_estate missing=offer_type · industrial missing=capacity`.

**Do NOT add three text inputs.** `condition` and `offer_type` are **enumerated selects** in `banco-mobile/constants/listingCreateTaxonomy.ts`; `rental_term` is conditional on `offer_type`. **A free-text `condition` passes the validator and then the listing is invisible to every filter strip.**

**Order:** extract mobile's taxonomy into a shared package; **delete** the web's parallel `workspaceSpecFields`. The server already asks for this — `ListingService.ts:200`: *"KEEP IN SYNC with mobile `requiredSpecKeysFor`"* — **mobile is named, web is not.**
*Scope: the **required** set canonical and typed. Optional fields later.*

### B-3 · Deduplicate the two workspaces
The affected files are **byte-identical**. Until they share code, **every fix is applied twice or silently half-applied.**

### B-4 · One contract test per money- or authority-touching path
**Ten lines each, importing the real validator.** The price round-trip alone would have caught B-1 the day it was written.

---

# §4 · SPACE C — DATA LIFECYCLE & AUTHORITY

### Your mandate
**You hold the two P0s where the system destroys or misstates what users own. Both already have RED matrices written by your own team.**

### C-1 · 🔴 Gate-4 — deletion destroys evidence
**Verified from `pg_constraint`:** `conversations` · `reports` · `bookings` · `lead_history` all `CASCADE`, and `messages` cascades from `conversations`.

**The severe case: `reports CASCADE` means the reported party controls the evidence.**

**The pattern is already in your schema** — `audit_log`, `import_orders`, `lead_billing`, `price_observations` are `SET NULL`. **Apply it to the evidence tables, plus denormalised tombstone context.** A report pointing at nothing is not evidence.
**Keep `CASCADE`** on `interactions`, `ads` — genuinely listing-scoped.
**Migration belongs to Space A. File the requirement.**

### C-2 · 🔴 Gate-3 — seller overwrites admin moderation
`updateListing()` omits `status`/`isFlagged`/`flagReason` from the authorizing row · `bulkUpdateListingStatus(…,"activate")` has **no moderation predicate** · owner schemas represent only `active|sold|archived`.
**Write the GREEN. Pin the authority predicate with a chain assertion.**

### C-3 · `deleteServingUrls` on the listing-media path
**The mechanism already exists** and is trusted in three lifecycles (`UserService:621`, `ImportOrderService:467`, `uploadClaims:121`). **Reference-aware and idempotent** — the same object serves as image *and* video poster.

### C-4 · `price_raw` on the detail response — **one line, unblocks Space B**
Mirror `ListingService.ts:1137`: `price_raw: listing.base_price_cash`. **Priority: this is a one-line change that another space is blocked on.**

### C-5 · Preserve — change none of these without a written reason
HMAC before any DB access · routing only through HMAC-covered fields · **503 rather than ACK** · `pg_advisory_xact_lock` on the order id · refund-wins · **44/44 admin routes guarded**.

---

# §5 · SPACE D — MOBILE CLIENT

### Your mandate
**Your surface has 49 test files and the best controls in the project. Your problem is not quality — it is six branches on one component and four guards that never ran.**

### D-1 · 🔴 Consolidate the car-header to **ONE** branch
**Six branches. `CarsHomeHeader.tsx` and `CarBrowseAxes.tsx` are byte-identical blobs across all of them; two have identical trees.** `probe/`, `staging/`, `tmp/` prefixes on a shared remote make converged work look like chaos.
**Declare one authoritative. Delete the other five.**

### D-2 · The `testID` contract — **blocked on the owner, not on you**
44 commits, one failing test. **You attempted the guard-side fix and correctly reverted it** (`cb681a7` → `3ee1f12`). **That was right — changing a guard is not an agent's authority. Do not attempt it again until the ruling lands.**

### D-3 · 🔴 Restore the Real-Estate `propertyType` fallback byte-for-byte
`propertyType`: **canonical 47 → branch 41.** A CAR change deleted RE strip code. **Chain still reads 245/245 — nothing caught it.**
**Then add the guard your own team specified: pin each section's strips against edits originating in another section.**

### D-4 · `P-18` — the visible role pill reads the stale mirror
`profile.tsx:1102` computes `role = meRole || clerkRole` and its comment says it *"closes Clerk-lag chrome bugs."* **`:1533` renders `user.publicMetadata?.role` instead.**
**The computed role is in a local block, not component scope** — lift it once, consume at both sites.
**RED assertion on the visible consumer**, not on the existence of the computed value. *(Your own ledger specified this; I am only repeating it.)*

### D-5 · Wire the dead guards
`account-deletion` ×2, `profile-role` ×1. **Zero references in `package.json`, `scripts/`, `.github/`.** *Space A's glob runner makes this permanent; wire them now regardless.*

### D-6 · Account-deletion catch split
`settings.tsx:650` and `:716` — one `try` spans the irreversible delete and everything after. **A `signOut()` failure tells the user deletion failed when it succeeded.** Split the catch; add a behavioural test that fails `signOut()` and asserts the outbox stays suspended.

### D-7 · Web-host `MAP-13` · `SS-LIN-01` · `popularBrands`
`SearchResultsMap.web.tsx` has **no branch for `type:"error"`** — port the three-state machine. · Saved-search identity uses six legacy fields as the row id; version it, preserve legacy ids. · `popularBrands` is an i18n key with zero consumers.

---

# §6 · SPACE E — SEARCH, SCALE & INTELLIGENCE

### Your mandate
**Two dimensions are already better than most production systems. Do not rebuild them. Four are below standard and one of those is the highest-value fix available in the entire project.**

### ✅ Preserve
Trigram GIN indexes back leading-wildcard `ILIKE`. · The composite `"<isoTs>|<id>"` keyset **avoids the boundary-skip bug most implementations ship**.
⚠️ **But `SearchService.ts:408` still says *"ILIKE for now; a GIN/tsvector index is the planned scale-up."* That comment is out of date and will make someone rebuild a working path. Fix the comment.**

### E-1 · 🔴 **Arabic normalisation — the highest-value precision fix in this project**
No alef/hamza folding (أ إ آ → ا), no ta-marbuta (ة → ه), no tatweel or diacritic stripping. **`سيارة` and `سياره` are different searches today, in an Arabic-first marketplace.**
**Normalisation at write and query time. Not a new engine.**

### E-2 · Keyset the remaining three sorts
`SearchService.ts:470` — `price_asc`, `price_desc`, `popular`, `nearest` use **numeric OFFSET**. Deep pages scan and discard; concurrent inserts cause duplicates and gaps. **The correct pattern is already in this file — apply it, don't invent it.**
*Depends on Space A's index for the recency sort; file your own index requirements the same way.*

### E-3 · Relevance ranking
**None exists** — no `ts_rank`, no `similarity()`, no scoring. `pg_trgm` gives you `similarity()` free once A-2 lands. **Design the weighting yourselves; I require only that it is deterministic and testable.**

### E-4 · Inbox — `MSG-LIN-07`
`listConversations()` has no limit or cursor; the tab bar calls it **every 15s app-wide to sum one integer**. **Scalar `GET /v1/conversations/unread-count` first, then keyset the list. The badge must never require the list** — your constraint, and it is right.

### E-5 · Load measurement
Nine `SearchService.*.test.ts` suites cover correctness well. **Nothing measures behaviour at volume.** Seed a corpus; publish p50/p95 for search, map clusters and inbox. **Publish them even when they are bad.**

---

# §7 · HOW EVERY SPACE WORKS — the rules that prevent what happened before

**① Every batch carries a static guard AND a real mount.** A source-text guard sees tokens, not control flow.

**② Pin the control in the same commit that changes it.** The canonical-push CI batch is the model.

**③ Never weaken a guard to match current source.** *I violated this once and it would have removed a protection. It is in this document because I got it wrong, not because you did.*

**④ Read a guard's `why` before fighting its `test`.** When they disagree, the `why` is the invariant.

**⑤ RED before GREEN, on a Draft PR.** Gate-3 and Gate-4 are the model. **A RED matrix is not a failure — it is a specification.**

**⑥ Never fix one of two duplicated surfaces.**

**⑦ `banco-mobile/package.json` conflicts resolve as a UNION, always.** It happened twice in one sitting; taking a side deletes the other branch's guard silently.

**⑧ One branch per unit of work. Delete `probe/`, `staging/`, `tmp/` from the shared remote once their answer is known.**

**⑨ Report `RUNTIME_UNPROVEN` honestly.** API 36 is set in config; nothing has compiled against it. **The Play clock is not closed.**

---

# §8 · SEQUENCE — and the merges that are already earned

**Wave 0, today:** A-1 glob runner · A-2 `pg_trgm` · A-4 gitignore · C-4 `price_raw` *(one line, unblocks B)* · D-1 consolidate to one branch · D-5 wire guards
**Wave 1:** B-1 · B-2 · A-3 index · D-3 propertyType · D-4 role pill
**Wave 2:** C-1 Gate-4 GREEN · C-2 Gate-3 GREEN · C-3 media · D-6 catch split
**Wave 3:** E-1 Arabic · E-2 keyset · E-4 inbox · E-3 ranking · E-5 load
**Wave 4:** A-5 backup + restore · A-6 edge · A-7 web CI · D-7 · store items

**Merge now — verified, six gates green in the owner assembly:**
`audit/*` ×2 · `maps-bootstrap-fail-closed` · `android-api36` · `api-test-db-safety` · `db-adoption-guard` · `db-baseline-adoption` after two sentences

**Owner decisions gating everything:** the `testID` ruling · which repository deploys · the Play date · the 2026-09-09 waiver · OTA.

---

# §9 · WHAT I OWE YOU

**Eighteen corrections against my own record, all published.** The ones that matter to your work:

- I ordered a **forward migration** for `pg_trgm` that **could never execute** — the journal runs `0000` first
- I ordered **"add three fields"** to the web form that would have produced **free-text junk** the validator accepts
- I ordered a guard **weakened to accommodate a contract violation** — the colleague's reading was right and mine was not
- I called gate3 **"ready to merge"** when it is RED by design
- I said **"Discover ×4 missing"**; three of four ship
- I framed `LIST-LIN-02` as a media bug; **it is item ⑤ of five**

> **Weigh this document; do not trust it. Every claim names a file and a line or a command you can run. If one does not reproduce, say so and I will withdraw it in place.**
>
> **And the two most recent findings in your favour came from you, in areas I had audited. That is the direction a handover should run.**

---
*Issued after reading 102 agent reports in full, verifying every classified finding against source, and executing every gate figure cited. Spaces drawn to be path-disjoint so no two agents can conflict. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
