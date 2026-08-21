# Consolidation, rejections, and the team plan

**Correct work inventoried and pinned. Broken work rejected with evidence. Deep audit continued into the two workspaces never examined. No guesses — every line below was executed or read.**

`canonical @ 4f2c81c`, **2026-08-22.**

---

# §1 · ✅ PINNED — the verified assembly, all six gates green

**`local/owner-assembly-20260821` rebuilt and pushed.** Contents, each verified before entry:

| Merged | Why it qualified |
|---|---|
| `audit/current-truth-20260821` | docs only, zero code |
| `audit/cross-repo-continuation-20260821` | docs only, zero code |
| **`fix/maps-bootstrap-fail-closed`** | **now fully green — see §2** |
| `fix/recent-search-chrome` | union resolution, never "theirs" |

**Full battery, executed against a live PostgreSQL 16.13:**

```
security   0 blocking       chain     245/245
confidence 26/26            mobile    127/127
API        505/505  [PASS] api-server integration suite
```

**Nothing entered this assembly while any gate was red. That rule held for every candidate.**

---

# §2 · ✅ ACCEPTED — `fix/maps-bootstrap-fail-closed`

**They fixed the one item I named, within hours.** `1a2f301 test(maps): register native map render coverage`.

| Gate | Before | **Now** |
|---|---|---|
| Confidence | 25/26 | ✅ **26/26** |
| Mobile | FAIL | ✅ **127/127** *(+3 — the new render tests)* |
| Chain | 245/245 | ✅ 245/245 |
| Security | 0 blocking | ✅ 0 blocking |

**ACCEPTED and pinned into the assembly.** The implementation remains the best batch received: a terminal three-state machine, a revival latch, chrome suppression, RTL, `accessibilityRole="alert"`, reused i18n keys, design tokens.

**One follow-up, not a blocker:** the web host still drops `type:"error"` entirely — `mapHtml.ts:363` is shared, but `SearchResultsMap.web.tsx` has no branch for it. **Same blank map, same silence, different cause.**

---

# §3 · 🔴 REJECTED — with the evidence for each

| Branch | Rejected because |
|---|---|
| `polish/discover-five-portals` | **Fails the guard it added itself** — `missing Discover testID discover-map-car`. A batch its own guard rejects is not reviewable. |
| `release/production-assembly` | **chain 240/245** — repoints deployment `bancoboomstor` → `bancoboom-v-next-` and does not update the guard asserting the old target. **Owner decision first.** |
| `fix/maps-tile-failure-state-v2` (PR #4) | **Superseded.** Merging regresses `5f44c86`. **Close it.** |
| `probe/*`, `staging/*` ×3 | **Identical blobs** to the authoritative car-header branch. Delete. |

**Conditionally held, not rejected:**

| Branch | Held on |
|---|---|
| `fix/car-header-*` ×5 | **one owner decision** — `testID` contract. Everything else is green: 245/245, 26→25/26, one failing test. |
| `fix/db-baseline-adoption` | **two sentences** in `MIGRATIONS.md`. Code is **API 505/505 + baseline 14/14**. |
| `fix/account-deletion-resume-red` · `fix/profile-visible-role-authority-red` | **guards not wired** — 3 guard files, 0 scripts, verified inert by `git grep`. Content is correct. |
| `fix/gate3-listing-moderation` | RED by design; needs its GREEN. |

---

# §4 · 🟢 DEEP AUDIT — the zero-coverage zone is **not uniformly risky**

**I audited `admin-os` and `dealer-os`, which no pass had examined. The result corrects my own framing.**

### `admin-os` — low risk despite zero tests

| Check | Result |
|---|---|
| Admin routes total | **44** |
| Routes carrying a permission guard | **44** — `requirePermission` appears 45× |
| Routes **without** a guard | **0** |
| Permission matrix unit-tested server-side | ✅ `lib/permissions.test.ts` |
| Pinned by a chain assertion | ✅ |
| Listing-write logic in the client | **none** |

`authGuard.ts:141` states the architecture: *"The server is the single source of truth for the permission matrix — the admin web app only mirrors it for display."* **Verified true.**

**And the chain assertion protecting it is exceptional.** It bounds each route's middleware window by the **next** route rather than a fixed line count, and the comment explains why:

> *"A five-line window bled into the following route's guard, so a one-line ungated route slipped through the negative test — it borrowed its neighbour's `requirePermission`."*

**They found a false-negative in their own guard and fixed it.** That is a higher standard than most teams ever reach.

### `dealer-os` — carries write logic, **and gets the price right**

`listing-form-sheet.tsx:234`:

```ts
const p = cleanNumberString(listing?.price_raw);   // ← the RAW field
setPrice(p);
```

**`dealer-os` hydrates from `price_raw`, not `price_display`. It does not have the price-corruption defect.**

### ⚠️ Correction #14 — my repair order for the price P0 had a better answer already in the codebase

**I ordered:** *"make `price_cash` honest — `Number(listing.base_price_cash)`, or declare it a string in the contract."* That is an API contract change touching generated artifacts.

**There is a cheaper, proven answer already shipping:**

```
lib/api-zod/…/api.ts:2033    "price_raw": zod.string().optional()      ← already in the contract
ListingService.ts:1137       price_raw: r.base_price_cash              ← emitted as-is, no typeof gate
```

**`price_raw` already exists, is already correct, and is already used successfully in production by `dealer-os`.**

**But — and this is why the order must be precise — I checked which endpoint carries it:**

| Endpoint | `price_raw` |
|---|---|
| `getDealerListings()` (line 1029) | ✅ emits it — this is what `dealer-os` reads |
| `getListingDetail()` (line 619) | ❌ **does not emit it** — emits `price_display` + the always-null `price_cash` |

`banco-web`/`banco-website` hydrate from **detail** (`useGetListing`), so `price_raw` is not reachable by them **today**.

> **CORRECTED ORDER: add `price_raw: listing.base_price_cash` to the detail response, mirroring line 1137 exactly. One line. The field name, shape and contract entry already exist — nothing is invented, no generated artifact changes meaning, and the web forms then do what `dealer-os` already proves works.**
>
> **Do not build a second raw-price concept alongside one that already works.**

### The refined risk map

| Workspace | Tests | Write logic | **Real risk** |
|---|---|---|---|
| `api-server` | 93 | — | ✅ low |
| `banco-mobile` | 49 | yes | ✅ low |
| `admin-os` | 0 | **none** — display mirror over a fully-guarded server | 🟢 **low** |
| `dealer-os` | 0 | yes — **and correct on price** | 🟡 medium |
| `banco-web` · `banco-website` | 0 | yes — **every P0 lives here** | 🔴 **high** |

**My earlier framing treated all four zero-test workspaces as equally dangerous. They are not.** The danger is not "no tests" — it is **"no tests over write logic the server cannot fully protect."** That is two workspaces, not four.

**This sharpens where the testing effort goes, and it should reduce the work rather than expand it.**

---

# §5 · THE TEAM PLAN — who does what, in order

### 🔴 OWNER — three decisions, nothing proceeds past them
1. **The `testID` contract** — literal, or update the guard's `test` **and** `why`. **38 commits and five branches are waiting on this one sentence.**
2. **Which repository deploys** — `bancoboomstor` or `bancoboom-v-next-`. Then one commit moves documents and guard together.
3. **Confirm the Play API-36 date** in the console. If it holds, it is a ~10-day clock.

### 🟢 MERGE TODAY — already earned it
4. `audit/*` ×2 → canonical. **Docs only. Zero risk. Accepted two passes ago.**
5. `fix/maps-bootstrap-fail-closed` → canonical. **Verified green on all six gates today.**
6. `fix/db-baseline-adoption` → fix two sentences in `MIGRATIONS.md`, then merge. **Its code is the most runtime-verified work in the tree.**

### 🔵 PLATFORM TEAM — close the classes, not the instances
7. **`pg_trgm`** — one line in `lib/db/src/migrate.ts` before `migrate()`. **Not a migration.** Also add it to `run-api-tests-local.mjs`.
8. **`GUARD-01`, both directions** — every `tests/*.test.mjs` has a script **and** every script is chained. **Direction ① is the one I originally omitted, and it is the one that would have caught the three dead guards now on branches.** Better still: give `banco-mobile` a glob runner like `api-server` has.
9. **Gitignore the Play credential set** — three lines, public repo.

### 🟠 WEB TEAM — the high-risk workspaces, and only these two
10. **`price_raw` on the detail response** (§4) — one line — then hydrate `banco-web`/`banco-website` from it exactly as `dealer-os` does.
11. **Shared listing taxonomy** — extract mobile's `listingCreateTaxonomy` into a package; delete the web's parallel `workspaceSpecFields`. **Typed selects, not text.**
12. **Deduplicate `banco-web`/`banco-website`** — items 10–11 do most of it.
13. **One contract test per money- or authority-touching web path.** Ten lines each, importing the real validator.

### 🟣 MOBILE / API TEAM
14. **Wire the three dead guards** (`account-deletion` ×2, `profile-role` ×1).
15. **Gate-3 GREEN** + a chain assertion on the authority predicate.
16. **`deleteServingUrls`** on the listing-media path — reference-aware, idempotent.
17. **Account-deletion catch split** — both paths.
18. **`MSG-LIN-07`** — scalar unread-count, then keyset the inbox.
19. **Web host `MAP-13` port** (§2).

### ⚫ OWNER-SCHEDULED — no audit closes these
Device matrix · real-browser WebView · live providers · deployment rehearsal + **a restore actually performed** · exact-SHA CI.

---

# §6 · Standing

**Pinned and green:** the assembly, on six gates including 505/505 against a real database.

**Rejected with evidence:** four branches, each for a stated, reproducible reason.

**Deep audit result:** the zero-coverage zone is **half the size I thought**. `admin-os` is a display mirror over an exceptionally well-guarded server; `dealer-os` already implements the price pattern correctly. **The real exposure is two workspaces.**

**And the price fix got cheaper:** `price_raw` already exists, is already in the contract, and is already proven by `dealer-os`. **One line on the detail endpoint replaces the contract change I originally ordered.**

**Production: `NO-GO`.** Unchanged — and the distance is now measurably shorter than when this pass began.

---
*Assembly rebuilt and verified on a live PostgreSQL 16.13; test data removed. Admin route coverage counted by execution over `routes/v1/admin.ts`. `price_raw` traced from the contract to its emitter to the exact endpoint that carries it — and to the one that does not. Guard inertness verified by `git grep` across `package.json`, `scripts/`, `.github/`. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
