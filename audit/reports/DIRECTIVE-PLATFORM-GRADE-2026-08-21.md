# Directive — platform-grade work orders, evidence-based

Owner instruction: complete the missing design across Maps, headers, Messenger and the mobile apps, and bring search to the structural standard of a major social platform — architecture, precision, intelligence, layering, stability, visual distribution.

**Every order below is anchored to something I executed or read in the source. Nothing here is invented, and nothing here prescribes visual design — the design authority is yours. My role is to state precisely what is missing, what proves it, and what "done" must mean.**

**Order of the orders is by blast radius, not by size.**

---

## 🔴 DEPLOY-01 — a fresh production database cannot be created at all. P0, above everything.

**Proven by execution, not inferred.** I started PostgreSQL 16.13, created an empty database, and ran the project's own migrator:

```
[migrate] FAILED: DrizzleQueryError: Failed query:
CREATE INDEX "idx_listings_title_trgm" ON "listings" USING gin ("title" gin_trgm_ops);
cause: error: operator class "gin_trgm_ops" does not exist for access method "gin"
severity: ERROR   code: 42704

tables in public schema afterwards:  0
```

**Zero tables.** The migration is transactional, so it rolls back completely. `0000_fantastic_warbird.sql` creates three trigram/GIN indexes (`idx_listings_title_trgm:1195`, `idx_listings_description_trgm:1196`, `idx_listing_attributes_specs:1173`) but **no migration anywhere creates the `pg_trgm` extension.**

I searched the entire repository. `pg_trgm` appears **only as a manual operator step**:

```
deploy/gcp/reports/06-READINESS_CHECKLIST_GONOGO.md:26   - [ ] `pg_trgm` enabled          ← unchecked box
deploy/aws/reports/06-READINESS_CHECKLIST_GONOGO.md:68   1. [ ] … CREATE EXTENSION pg_trgm
replit.md:51                                             Fresh DB also needs CREATE EXTENSION pg_trgm
```

**A checkbox in a readiness document is not a deployment mechanism.** Every first deployment to Coolify, GCP, AWS or any new environment fails at migration step one unless a human remembers an undocumented prerequisite.

**Confirmed the fix, same database:**

```
CREATE EXTENSION IF NOT EXISTS pg_trgm;
[migrate] applying migrations … done in 579ms
tables in public schema:  74
```

**Order:** add `CREATE EXTENSION IF NOT EXISTS pg_trgm;` as a forward migration ordered **before** any `gin_trgm_ops` index, so the schema provisions its own prerequisites. Keep the operator checklists — but they must stop being the only mechanism.

**Done means:** `createdb && pnpm --filter @workspace/db run migrate` succeeds on a database with no manual preparation, **and** a chain assertion pins the extension migration ahead of the trigram indexes so the ordering cannot regress.

**Note for the baseline work:** `baselineEquivalence.ts` replays `0000 + 0001` into a reference schema. It inherits the same dependency — the extension must exist before adoption runs, or the equivalence proof fails for a reason unrelated to schema drift.

---

## 🟠 MAP-13 — a failed map bootstrap shows a blank box and says nothing

`SearchResultsMap.tsx:328`:

```ts
if (msg.type === "ready" || msg.type === "error") {
  setReady(true);
}
```

`mapHtml.ts:363` emits that signal in exactly one place:

```js
if (!window.L) { post({ type: "error" }); return; }
```

**That is Leaflet failing to load — the map will never render anything.** It is classified identically to a successful bootstrap: the loader is dismissed, `setReady(true)`, and **no message reaches the user.**

**The comparison makes the gap plain.** G-1 landed a correct, bilingual, honest alert for `tile_error` — a *partial* failure where the map still works. The *total* failure has no message at all. **The worse outcome is the silent one.**

**Order:** separate the two states. `error` must reach a distinct terminal state with a user-visible bilingual message in the app's existing register, and a retry affordance if your design calls for one. Do not rewrite Maps to do it — the report's boundary is correct and I agree with it.

**Done means:** a render test mounting the host, delivering `{type:"error"}`, and asserting the failure state is visible and distinct from `tile_error`; plus a static guard asserting the two branches never collapse. Both hosts.

---

## 🟠 MSG-LIN-07 — the unread badge downloads the entire inbox every 15 seconds

Their report flagged this. **I verified it, and it is worse at the client than described.**

`artifacts/api-server/src/services/ConversationService.ts:295` — `listConversations(clerkId)` has **no limit, no cursor, no offset**. It selects every non-hidden conversation, orders the full set, then loads counterparty names, presence and listing titles across all of it.

`artifacts/banco-mobile/app/(tabs)/_layout.tsx:104-114`:

```ts
const { data } = useListConversations({ query: { refetchInterval: 15000, … } });
return (data?.data ?? []).reduce((sum, c) => sum + (c.unread ?? 0), 0);
```

**The tab bar downloads every conversation the user has, four times a minute, app-wide, for the entire signed-in session — to compute one integer.** `messages.tsx:80` adds a second full fetch every 8s while the tab is focused.

For a dealer with thousands of threads this is the whole inbox over mobile radio, continuously. It is not a UI bug — small data hides it completely, which is exactly why it will surface first in production, on your most valuable accounts.

**Order:**
1. A cheap dedicated unread aggregate — `GET /v1/conversations/unread-count` returning a scalar — and point the badge at it.
2. Cursor-paged `listConversations` with deterministic recency ordering, keyset not offset.
3. Website / mobile / generated-client parity.

**Constraint from their own report, and it is the right one: do not break the unread badge while paginating the inbox.** The badge must never require the list.

**Done means:** the badge's payload is constant-size regardless of inbox depth, proven by a test that seeds a large inbox and asserts the response shape.

---

## 🔴 GUARD-01 — thirty-two guards, zero pinned. Fix the class before the next merge.

Restated because it protects every order in this directive. Measured:

```
guards in artifacts/banco-mobile:   32
pinned by a chain assertion:         0
```

Any one can be dropped from the aggregate `test` script while chain integrity still reports **245/245**. I proved it by deleting the C-4 language-sync guard: chain 245/245 PASS, render-coverage 6/6 PASS, guard file dead on disk.

**Order — one assertion, not thirty-two:** read `artifacts/banco-mobile/package.json`, enumerate every `test:*` key, assert each appears in the aggregate `test` script. Self-maintaining: every guard you add for the orders above is protected on the day you add it.

**Do this first.** Every "done means" in this document depends on a guard that currently cannot defend itself.

---

## 🟡 SS-LIN-01 — Saved Search identity collides across genuinely different searches

Their report is correct. Verified at `artifacts/banco-mobile/context/SessionContext.tsx:110`:

```ts
function searchSignature(s: SavedSearchInput): string {
  return [s.q, s.category, s.minPrice, s.maxPrice, s.location, s.paymentType].join("|");
}
```

Six legacy fields. The rich `criteria` object is ignored **even when the caller supplies it** — and the signature is used as the row **id** (`savedSearches.some((s) => s.id === sig)`, line 390).

So Toyota vs BMW, imported vs local, apartment vs villa, sale vs rent, near-me on vs off — all collide whenever the six legacy fields match. The user is told a search is already saved when it is not, or is blocked from saving it. **The server matcher distinguishes them correctly; only the client identity is blind.**

**Order:** version the client identity around a deterministic canonical form of the supported rich criteria. **Preserve legacy ids already on devices** — removal and reopen of existing saved searches must keep working through the migration. That constraint is theirs and it is correct.

---

## 🔎 SEARCH — the platform-grade standard, measured against what is actually there

The owner asked for search at the structural standard of a major social platform. Here is the honest position, dimension by dimension. **Two of the seven are already strong — I am not going to ask you to rebuild what works.**

### ✅ Already at standard — preserve, do not redesign

**Fuzzy matching is properly indexed.** I initially suspected `ILIKE '%term%'` meant sequential scans, and I was wrong — `0000_fantastic_warbird.sql` creates `gin_trgm_ops` GIN indexes on `title` and `description`, plus a GIN index on the `specs` jsonb. Trigram GIN serves leading-wildcard `ILIKE`. **The source comment at `SearchService.ts:408` — *"ILIKE for now; a GIN/tsvector index is the planned scale-up"* — is out of date and should be corrected before it prompts someone to rebuild a working path.**

**Keyset pagination is correct where it is used, and correct for the right reason.** `SearchService.ts:421-428` uses a composite `"<isoTs>|<id>"` cursor matching `ORDER BY (recency DESC, id ASC)`, with this comment:

> *A timestamp-only "< ts" cursor would SKIP rows that share the boundary*

That is precisely the bug most implementations ship. It was understood and avoided.

### ⚠️ Below standard — ordered work

**① Layering — three of six sorts abandon the keyset.** `SearchService.ts:470`:

```ts
const offset = useOffset && cursor ? Math.max(0, parseInt(cursor, 10) || 0) : 0;
```

`price_asc`, `price_desc`, `popular` and `nearest` paginate by **numeric OFFSET**. Deep pages scan and discard every preceding row, and concurrent inserts shift the window so users see duplicates and gaps. No social platform paginates a feed this way.

**Order:** extend the composite-keyset pattern the file already implements to every sort — `(sort_key, id)` as the tiebreaker in all cases. The correct implementation is already in this file; it needs applying to the other three axes, not inventing.

**② Precision — no relevance ranking exists.** I searched `SearchService.ts` for `ts_rank`, `similarity()`, `word_similarity` and any scoring term. **There is none.** A match is boolean, then results are ordered by recency or price. So a query for `"toyota corolla 2020"` cannot rank an exact title match above a listing that merely mentions "toyota" in its description.

`pg_trgm` — already installed for DEPLOY-01 — exposes `similarity()` and `word_similarity()`, so a relevance score is available without new infrastructure.

**Order:** introduce a relevance-ranked sort. **Design the ranking yourself** — the weighting of title vs description vs specs, and how trust/quality signals participate, is a product decision, not an audit finding. What I require is that it is *deterministic and testable*: same query and same corpus, same order, every time.

**③ Intelligence — `AdaptiveFeedEngine.ts` is 166 lines and search does not consult it.** There is a feed-intelligence layer in the codebase. The search path does not use it. Whether personalised ranking belongs in search is your call — but the current state is an intelligence layer that search cannot reach, and that should be a decision rather than an accident.

**④ Arabic.** Trigram matching is language-agnostic, which is why it works at all here — but there is no Arabic normalisation anywhere in the search path: no alef/hamza folding (أ إ آ → ا), no ta-marbuta/ha folding (ة → ه), no tatweel or diacritic stripping. In an Arabic-first marketplace, `سيارة` and `سياره` are different searches today. **This is the single highest-value precision fix available**, and it is normalisation at write and query time, not a new engine.

**⑤ Stability under load — never measured.** No load test exists for search, the map cluster endpoint, or the conversation inbox. Correctness is well covered — nine `SearchService.*.test.ts` suites, and they are good — but **behaviour at volume is unwitnessed**, exactly like the runtime.

**Order:** seed a large corpus and record p50/p95 for the search path, the map viewport query, and the inbox at realistic dealer volumes. **Publish the numbers even when they are bad** — an unmeasured system has no stability claim to make.

**⑥ Visual distribution — mine to measure, not to design.** Density, rhythm, hierarchy and the 320–430 breakpoint behaviour cannot be certified from source, and I will not pretend otherwise. **This needs the device matrix (AR/EN, RTL/LTR) that item 6–9 of the acceptance criteria has always named.** I can verify a rendered result; I cannot originate the design.

---

## Merge blockers, restated — these gate everything above

From the merge rehearsal, all three re-confirmed standalone at each branch's own head:

| Branch | Failure | Fix |
|---|---|---|
| `fix/db-baseline-adoption` | confidence **25/26** | restore two sentences in `MIGRATIONS.md` |
| `fix/car-header-unified-dock-v2` | guard **92/93** | the `testID` literal decision — yours |
| `fix/deployment-sot-next` | its guard **exits 1** on its own branch | drop `DEPLOYMENT_PLAN.md` from `LIVE_AUTHORITIES`, or skip `SUPERSEDED` files |

And the two conflicts where the natural resolution silently deletes a control: **PR #5 must be resolved as a union, never "theirs"**, and the SOT collision must keep both gates under their own names.

---

## The standard every order is held to

This codebase already has a house standard, and it is a good one. Nothing above is exempt:

1. **A static guard and a real mount** — not a source-text assertion alone.
2. **A chain assertion pinning the control**, in the same commit that adds it. The canonical-push CI batch is the model: change the control, then pin the change.
3. **Constant-derived, never literal** — the G-1 tile handler binds to `OSM_TILES`, so a provider change carries it. M-1 cannot recur by construction.
4. **Bilingual, honest copy** on every failure path — say what failed, what still works, what to do.
5. **Read a guard's `why` before fighting it.** The recent-search batch put the feature in the search chrome because the blocking guard's own rationale prescribed it. That was right.

---

## What I will do next, and what I will not

**I will:** verify each item against the source and against a real database when it lands, re-run the full battery, and correct my own record in place when I get something wrong — as I did above on the trigram indexes, where my first read was mistaken and the code was fine.

**I will not:** design your interfaces, choose your ranking weights, or resolve your product decisions. Where this document says "yours", it means it.

**Production remains `NO-GO`.** CI still cannot execute, the 2026-09-09 waiver has 19 days — and as of today, **a fresh database cannot be migrated at all.** DEPLOY-01 is now the first thing standing between this project and a running deployment.

---
*Every finding executed or read at `canonical/vnext-assembly @ 4f2c81c`. Migration failure and repair reproduced against a disposable PostgreSQL 16.13. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
