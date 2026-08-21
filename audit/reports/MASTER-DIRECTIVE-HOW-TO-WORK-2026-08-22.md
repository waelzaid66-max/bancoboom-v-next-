# MASTER DIRECTIVE — how to work on this monorepo, and everything that is wrong with it

**Issued as governing document. Supersedes the ordering in every earlier report of mine; the evidence in them stands.**

45 reports, executed against a live PostgreSQL 16.13 and the shipped source at `canonical/vnext-assembly @ 4f2c81c`. **2026-08-22.**

**Read §1 before touching anything. It is the part that changes how you work, not just what you fix.**

---

# §1 · THE ONE THING TO UNDERSTAND FIRST

## This repository has two zones, and they are not equally protected

| Workspace | Test files | Chain assertions | What CI runs |
|---|---|---|---|
| `api-server` | **93** | 113 | tests against Postgres |
| `banco-mobile` | **49** | 70 | full regression pack |
| `banco-web` | **0** | 7 | **docker build only** |
| `banco-website` | **0** | 2 | **docker build only** |
| `dealer-os` | **0** | 4 | build only |
| `admin-os` | **0** | 1 | build only |

**142 test files in two workspaces. Zero in the other four.**

**Every P0 in this document lives in the uncovered zone. Every piece of engineering I have praised lives in the covered zone.** That is not coincidence and it is not a judgement about the team — it is the direct, mechanical consequence of where verification was asked for.

### The rule this produces, and it governs everything below

> **State which zone a change lives in, every time.**
>
> **A defect *inside* the covered zone is alarming** — it means a guard failed, and the guard must be fixed alongside it.
> **A defect *outside* it is expected** — and **the guard is the fix**, not just the patch.

**Do not fix uncovered-zone defects one at a time and call the class closed. You will be back.**

---

# §2 · THE HOUSE STANDARD — non-negotiable, and it already exists here

This codebase invented a good standard. **Nothing in this directive is exempt from it.** The model to copy is the **S4 self-demote guard**, which has four independent layers:

| Layer | Where |
|---|---|
| Server authority | `UserService.ts:224` — throws `DEMOTE_BLOCKED` |
| Client UX | `profile.tsx:795` — honest bilingual copy, never a silent no-op |
| Chain assertion | `chain-integrity-gate.mjs:67` — `P-account-demote-guard` |
| Tests, both sides | `lib-hardening.test.mjs:170`, `section-miniapp-guard.test.mjs:1857,1892` |

**A direct `PATCH /me` that bypasses the app still fails.** That is what "done" looks like.

### The five rules

1. **A static guard AND a real mount.** Never a source-text assertion alone. A source-text guard sees tokens, not control flow — it can prove a function is *referenced*, never that it is *called in the right order*.
2. **Pin the control in the same commit that changes it.** The canonical-push CI batch is the model: change the trigger, add the assertion, one commit.
3. **Constant-derived, never literal.** The G-1 tile handler binds to `OSM_TILES`, so a provider change carries it automatically. Hardcode a host and you have built a time bomb.
4. **Bilingual, honest copy on every failure path.** Say what failed, what still works, what to do. `"Sign-in failed. Please try again."` on a misconfigured strategy is an infinite loop for the user.
5. **Read a guard's `why` before fighting it.** The recent-search batch put the feature in the search chrome because the blocking guard's rationale prescribed it. That was correct behaviour.

### Three prohibitions

- ❌ **Never relax a server floor to make a client pass.** §5-③ is exactly this temptation and the answer is no.
- ❌ **Never fix one of the duplicated web surfaces.** `banco-web` and `banco-website` are **byte-identical** in the affected files. Every fix applied once is silently half-applied.
- ❌ **Never claim a capability from configuration.** `usesAppleSignIn: true` is not Apple sign-in. A passing parity script is not a working journey.

---

# §3 · THE REGISTER — everything found, with evidence

Each row: **zone · where · what proves it.**

## 🔴 P0 — do these first, in this order

### ① `DEPLOY-01` — a fresh database cannot be created at all
**Zone: infrastructure.** `lib/db/migrations/0000_fantastic_warbird.sql:1173,1195,1196`

```
[migrate] FAILED: operator class "gin_trgm_ops" does not exist   (code 42704)
tables in public schema afterwards:  0
```

The migration creates three trigram/GIN indexes; **no migration anywhere creates the `pg_trgm` extension.** It exists only as an unchecked box in two readiness checklists. The migration is transactional, so it **rolls back to zero tables**. Confirmed repair on the same database: `CREATE EXTENSION` → migrate → **74 tables in 579ms**.

**Reproduced nine times across nine databases today.**

> **DO:** add `CREATE EXTENSION IF NOT EXISTS pg_trgm;` as a forward migration ordered **before** any `gin_trgm_ops` index. Add a chain assertion pinning the ordering.
> **DONE MEANS:** `createdb && migrate` succeeds with zero manual preparation.
> ⚠️ `baselineEquivalence.ts` replays `0000+0001` and inherits this — fix it first or baseline adoption fails for an unrelated reason.

### ② Price corruption — every web edit destroys the price
**Zone: uncovered.** `ListingCreateForm.tsx:99-100,178,218,242` · `ListingService.ts:744-757,761`

```
1500000 → "1.50M EGP" → "1.50" → 1.5        ÷ 1,000,000
 850000 → "850K EGP"  → "850"  → 850        ÷ 1,000
   2000 → "2K EGP"    → "2"    → 2          ÷ 1,000
    999 → "999 EGP"   → "999"  → 999        OK
```

**Every listing ≥ 1,000 EGP.** The seller never touches the price field — any form submit rewrites it. **Both surfaces, byte-identical.**

**And the client-side fix alone does not work.** `price_cash` is gated on `typeof base_price_cash === "number"`, but the column is `numeric` and the driver returns a **string** — measured, not inferred:
```
rows=3 => string:"9731798" , string:"7977844" , string:"6159165"
```
**So `price_cash` is `null` on every response, which is *why* the client reaches for the display string.**

> **DO:** ① emit `price_cash` honestly — `listing.base_price_cash == null ? null : Number(...)`, or declare it a string in the contract, **but decide**. ② Hydrate and write from the raw value only; **never parse `price_display` for a write**. ③ Guard: no write path may consume `price_display`; contract test that `price_cash` is non-null for a priced listing.
> **BOTH SURFACES.**

### ③ Web seller workspace cannot create a listing — any listing
**Zone: uncovered.** `lib/workspace-listing-form.ts:29-60` · `ListingCreateForm.tsx:121-134`

Server's own `validateAttributes()` run against the exact vocabulary the form can emit, **every field filled**:
```
car:          valid=false   missing=condition
real_estate:  valid=false   missing=offer_type
industrial:   valid=false   missing=capacity
```

**100% failure, all three categories.** `buildSpecsObject()` iterates only the visible fields, so the required key can **never** appear. *(Note the trap: `industrial` renders `condition`; `car` requires it and renders neither.)*

**No gate sees it:** `website-seller-workspace-parity-audit.mjs` never references `condition`, `offer_type`, `capacity` or `validateAttributes`. It is a wiring check and it passes.

> **DO:** add `condition` (car) · `offer_type` + `rental_term`-when-renting (real estate) · `capacity` (industrial). **Do NOT relax the server floor** — its comment explains that planes and boats have no odometer, and it is right. The validator already says *"KEEP IN SYNC with mobile `requiredSpecKeysFor`"* — **mobile is named, web is not.** Make one source of truth both clients consume.
> **DONE MEANS:** a ten-line contract test importing the real validator, running in CI.

## 🔴 P1 — authority, privacy and money

### ④ Gate-3 — a seller can overwrite an administrative moderation decision
**Zone: covered (server), and the RED matrix already exists.** Draft PR #14, 16 `RED:` tests.

Three defects: `updateListing()` omits `status`/`isFlagged`/`flagReason` from the authorizing owner row, then writes seller-supplied `status` · `bulkUpdateListingStatus(…, "activate")` has **no moderation predicate** · owner-facing schemas represent only `active|sold|archived`, so a legitimate owner read of a held listing **fails the response contract**.

> **DO:** write the GREEN implementation. **Pin the authority predicate with a chain assertion.** The branch must not merge before then — it turns CI red by design, correctly.

### ⑤ `LIST-LIN-02` — deleted listing photos stay publicly readable forever
**Zone: covered (server) — this one *is* alarming.** `objectAcl.ts:143` · `ListingService.ts:1474`

```ts
if (aclPolicy.visibility === "public" && requestedPermission === READ) return true;
```
Runs before any owner check and **never consults `listing_media`.** Removal deletes only the row — the service contains **no object retirement call of any kind**.

**A seller removes a photo showing their face, their plate, their front door — and it stays anonymously downloadable at its original URL, permanently. The app says it is gone.**

> **DO:** call `deleteServingUrls` — **it already exists** on the `ObjectStorage` interface and is already trusted in three lifecycles (`UserService.ts:621`, `ImportOrderService.ts:467`, `uploadClaims.ts:121`). **This is not "build retirement", it is "call the path that already works."**
> **CONSTRAINT (theirs, and correct):** reference-aware and idempotent — the same object legitimately serves as image *and* video poster. Must survive partial provider failure, cover both providers, tolerate legacy objects without the trusted ACL.
> **DO NOT** merge account-deletion retention policy into this. Separate decision, owner's.

### ⑥ `ACC-LIN-02` — "deletion failed" shown for a deletion that succeeded
**Zone: covered.** `settings.tsx:650-672` and again `716-729`

One `try` spans the irreversible server delete **and everything after it**. A `signOut()` failure is classified as deletion failure: `resumeAfterAccountDeletionFailure()` re-enables messenger on a tombstoned account, **and the user is told deletion failed when it succeeded.**

> **DO:** split the catch. `deleteAccount()` failed → resume and report failure. **Anything after it → never resume**, force local teardown, report the sign-out problem separately. **Both paths.** Pair with a behavioural test that fails `signOut()` and asserts the outbox stays suspended — the existing wiring guard proves the functions exist, not the ordering.

### ⑦ A Play publishing key would be committed to a **public** repository
**Zone: infrastructure.** `eas.json` submit profile

`serviceAccountKeyPath: "./google-service-account.json"`, and:
```
$ git check-ignore -v google-service-account.json ; echo $?
1        ← NOT ignored
```
No rule in either `.gitignore`. Repository is `private: false`. **One `git add -A` publishes it.**

> **DO — today, three lines:** ignore `google-service-account.json`, `*.p8`, `*.p12`, `*.keystore`, `*.mobileprovision`. Prefer EAS-hosted credentials over a repo-relative path. **Pin the ignore rule with a chain assertion.**

### ⑧ `MSG-LIN-07` — the tab bar downloads the entire inbox every 15 seconds
**Zone: covered.** `ConversationService.ts:295` · `app/(tabs)/_layout.tsx:104-114`

`listConversations()` has **no limit, no cursor**. The badge does:
```ts
refetchInterval: 15000 … .reduce((sum, c) => sum + (c.unread ?? 0), 0)
```
**Every conversation, counterparty names, presence and listing titles — four times a minute, app-wide, all session, to compute one integer.** `messages.tsx:80` adds a second full fetch every 8s.

> **DO:** a scalar `GET /v1/conversations/unread-count`; point the badge at it. Then cursor-page the list with a keyset. **Your own constraint is right: the badge must never require the list.**

### ⑨ `GUARD-01` — 32 mobile guards, **zero** pinned
Any guard can be dropped from the aggregate `test` script while chain integrity still reports 245/245. **Proven** by deleting the C-4 guard: chain PASS, render-coverage PASS, guard dead on disk.

> **DO — one assertion, not 32:** enumerate every `test:*` key in `artifacts/banco-mobile/package.json`, assert each appears in the aggregate `test` script. **Self-maintaining.** Every guard this directive asks for is protected the day it is added.
> **DO THIS FIRST — every "done means" below depends on it.**

### ⑩ `MAP-13` — a failed map bootstrap shows a blank box and says nothing
**Zone: covered.** `SearchResultsMap.tsx:328` · `mapHtml.ts:363`

`type:"error"` is emitted **only** when Leaflet fails to load — the map will never render. It is treated identically to `ready`: loader dismissed, **no message.** The lesser failure (`tile_error`) correctly shows a bilingual alert. **The worse outcome is the silent one.**

> **DO:** separate the states; distinct bilingual message; render test delivering `{type:"error"}`; static guard that the branches never collapse. Both hosts. **Do not rewrite Maps** — report 95's boundary is right.

### ⑪ `SS-LIN-01` — saved-search identity collides
**Zone: covered.** `SessionContext.tsx:110`

Six legacy fields joined as the row **id**; the rich `criteria` object ignored **even when supplied**. Toyota vs BMW, sale vs rent, near-me on/off — all collide. **The server matcher distinguishes them; only the client identity is blind.**

> **DO:** version the identity around a deterministic canonical form of the rich criteria. **Preserve legacy ids on devices** — removal and reopen must keep working through the migration.

## ⏰ CLOCKS

| Item | Days | Verified |
|---|---|---|
| **Play API 36** — `app.json:143-144` pins 35 on Expo 54 | **~10** | config ✅ · **policy date `UNKNOWN`** — confirm in the console; I will not assert a date I cannot check |
| **Image-size waiver** `2026-09-09` | 19 | ✅ `patched >=2.0.3`, `latest` still `2.0.2`, **upstream has not shipped**. Wait · extend (a recorded weakening) · accept red. **Doing nothing selects the third.** |
| **CI cannot execute** | — | proven across all three trigger types, two people, 0 jobs or 0 steps in 3–7s. **Account/platform level.** Fastest discriminator: the annotation banner on a failed run page in the web UI. |

## 🟠 SEARCH — platform grade

**Already strong — do not rebuild:** trigram GIN indexes back leading-wildcard `ILIKE` *(my first read suspected sequential scans and was wrong)* · the composite `"<isoTs>|<id>"` keyset **avoids the boundary-skip bug most implementations ship**.
⚠️ **But `SearchService.ts:408` still says *"ILIKE for now; a GIN/tsvector index is the planned scale-up"* — that comment is out of date and will make someone rebuild a working path. Fix the comment.**

**Below standard, ordered:**
1. **`SearchService.ts:470`** — `price_asc`, `price_desc`, `popular`, `nearest` paginate by **numeric OFFSET**. Deep pages scan and discard; concurrent inserts cause duplicates and gaps. **Extend the keyset pattern already in this file to all six sorts — apply it, don't invent it.**
2. **No relevance ranking exists at all.** No `ts_rank`, no `similarity()`, no scoring. `"toyota corolla 2020"` cannot rank an exact title match above an incidental mention. `pg_trgm` — installed for ① — gives you `similarity()` free. **Design the weighting yourselves; I require only that it is deterministic and testable.**
3. **No Arabic normalisation anywhere.** No alef/hamza folding (أ إ آ → ا), no ta-marbuta (ة → ه), no tatweel or diacritic stripping. **`سيارة` and `سياره` are different searches today. This is the highest-value precision fix available**, and it is normalisation at write and query time, not a new engine.
4. `AdaptiveFeedEngine.ts` is 166 lines and **search never consults it.** Make that a decision, not an accident.
5. **No load measurement** for search, map clusters, or the inbox. Seed a large corpus, publish p50/p95. **Publish them even when they are bad.**

## 🟡 ACCOUNTS

- **`enterprise` is unreachable by any client** — not in `apiAccountTypeForFamily`'s return union at all. **`company` is preserve-only** — returned solely when already the role. **Settles M-4.** Admin-provisioned by design, or a product gap. **One decision.**
- **Apple entitlement with no implementation.** `expo-apple-authentication` installed, plugin registered, `usesAppleSignIn: true` — **and never imported.** The Apple path is Clerk **web** SSO. Either wire the native module or remove all three declarations. **Pin whichever you choose.**
- **Live social provider set: `UNKNOWN`** — network policy blocked my query. **Settle it in ten seconds:**
  ```bash
  curl -s "https://clerk.banco.today/v1/environment?__clerk_api_version=2024-10-01&_clerk_js_version=5.0.0" \
    | jq '.user_settings.social | to_entries[] | select(.value.enabled) | .key'
  ```
- **Phone/SMS sign-in absent.** `VERIFIED MISSING`, not a defect — nothing requires it. In a phone-first market it deserves a decision, not silence.

---

# §4 · BRANCH STATE — measured tonight, not carried forward

**Nine live branches, 101 commits, and no branch contains any other** — tested pairwise across all 72 ordered pairs. **Three are not even built on the current canonical.**

| Branch | Gates | Blocker |
|---|---|---|
| `audit/current-truth` · `audit/cross-repo-continuation` | ✅ | none — docs only, **merge now** |
| `fix/db-baseline-adoption` (18) | 25/26 · **API 505/505** · baseline 14/14 | **two sentences in `MIGRATIONS.md`.** Most runtime-verified work in the tree, held by a doc |
| `fix/recent-search-chrome` (11) | ✅ but on `1ccdbac`, **8 behind** | rebase, then **union** resolution — never "theirs" |
| `fix/car-header-unified-dock-v2` (16) | 🔴 **24/26**, mobile FAIL | `toBeSelected()` *(RNTL 13.3.3 has no `toHaveAccessibilityState`)* + the `testID` decision |
| `fix/deployment-sot-next` (2) | ✅ gates | own guard exits 1; strips `package.json` trailing newline |
| `release/production-assembly` (34) | 🔴 **chain 240/245** | **breaks the SOT lock** — §5 |
| `fix/gate3-listing-moderation` (2) | ✅ static · 🔴 16 RED | **hold for GREEN** |
| `fix/maps-tile-failure-state-v2` (PR #4) | — | ❌ **superseded — merging regresses `5f44c86`. Close it.** |

---

# §5 · 🔴 THE DECISION ONLY THE OWNER CAN MAKE

`release/production-assembly` fails **five** chain assertions:

```
P-canonical-deploy-repo-{deployment-sot,coolify-now,go-live,coolify-compose,coolify-guide}
why: "Every live deployment surface must name bancoboomstor as the only canonical repository"
```

It repoints deployment from `bancoboomstor` → `bancoboom-v-next-`. In `docker-compose.coolify.yml` the old name is now **zero**.

**This is not manipulation and the evidence does not support that reading.** Either a deliberate SOT migration — **in which case the guard must change in the same commit** — or an unnoticed regression.

**And it explains the `ops:deployment-sot-guard` collision.** `release` points that script at `release-sot-gate.mjs`; `deployment-sot-next` points it at `deployment-sot-guard.mjs`; each file exists only on its own branch; **neither is referenced by any workflow or chain assertion.** Whoever resolves the merge silently chooses which gate the project runs.

> **The collision is a symptom. The disagreement about which repository is canonical is the cause. Settle that first — it is an owner decision — then make guard and documents agree in one commit, and give the two gates distinct names if both are wanted.**

---

# §6 · ORDER OF WORK — strict

**Wave 0 — today, cheap, unblocks everything**
1. `GUARD-01` — the one self-maintaining assertion. **Everything else depends on it.**
2. `⑦` gitignore the Play key. Three lines.
3. `①` `DEPLOY-01` — one migration line + its assertion.

**Wave 1 — the uncovered zone, and close the class while you are there**
4. `③` web create — add the missing fields, **one source of truth for the floor**, ten-line contract test.
5. `②` price — honest `price_cash`, raw-value-only hydration, guard, **both surfaces**.
6. **Deduplicate `banco-web` / `banco-website`.** They are byte-identical. Until they share code, every fix must be applied twice or it silently is not.
7. **A CI job for those workspaces that runs something other than `docker build`.**

**Wave 2 — authority and privacy**
8. `④` Gate-3 GREEN + chain assertion.
9. `⑤` listing-media retirement, reference-aware.
10. `⑥` account-deletion catch split, both paths.

**Wave 3 — scale and correctness**
11. `⑧` unread-count endpoint, then keyset the inbox.
12. Search: keyset all six sorts · **Arabic normalisation** · relevance ranking · fix the stale comment.
13. `⑩` `MAP-13` · `⑪` `SS-LIN-01`.

**Wave 4 — merges** *(only after §5 is settled)*
`audit/*` → `db-baseline` → `recent-search` (rebase) → `car-header-v2` → `deployment-sot-next` → `release`.
**Run the full battery after each merge, not once at the end.** With CI down, a local run is the only signal, and batching makes a regression untraceable.

**Owner-only, no code:** the SOT repository · Play API 36 date · the 2026-09-09 waiver · `company`/`enterprise` · Apple sign-in ship-or-remove · the live Clerk provider set · C-1 tags · C-2 tile procurement · device matrix, live credentials, deployment window.

---

# §7 · ACCEPTANCE — what "done" means

**Satisfied today:** all static gates green on one SHA · 0 blocking advisories · no guard weakened · **API 505/505 against a real database** · baseline 14/14.

**Not satisfied, each a hard gate:**
1. ❌ A fresh database provisions with **zero manual steps**
2. ❌ The web seller workspace **completes create and edit** end to end
3. ❌ Exact-SHA CI on the head *(blocked at the platform)*
4. ❌ One native render on a physical Android **and** iOS device
5. ❌ One real-browser WebView render
6. ❌ Live provider journeys with real credentials
7. ❌ A deployment rehearsal + restore drill
8. ❌ Full-workspace lint on a green CI run
9. ❌ The 2026-09-09 decision, taken deliberately

**Production: `NO-GO`.** Items 4–7 need hardware, credentials and a deployment window. **No amount of further auditing closes them, and I will not pretend otherwise.**

---

# §8 · HOW I WORK, SO YOU CAN CHECK ME

**I have published ten corrections against my own record.** Each was caught by re-checking, not by reasoning from the first result. The most dangerous: I once recommended an unbounded `nanoid: '>=3.3.18'` override that would have resolved to ESM-only 6.0.1 — **the manager could have applied it directly.**

Others worth knowing: I twice reported the map bridge as unguarded when it has a **stronger** control (`event.source`) — my grep was narrower than the property. I suspected `ILIKE` meant sequential scans; **the trigram indexes were already there.** I called gate3 "ready to merge"; **it is RED by design.** I nearly reported 52 failures that were **my own skipped seed step**. I nearly reported a force-push that was a **stale local ref** — `ls-remote` disproved it.

> **Weigh this audit; do not trust it. Every claim above names a file and a line, or a command you can run. If one does not reproduce, say so and I will withdraw it in place rather than quietly amend it.**

**And the standing verdict, unchanged:** your build is disciplined and honest — 142 test files, 245 chain assertions, controls like the S4 guard that are better than most production systems ship. **Four shipped workspaces sit outside that discipline entirely, and that is where the damage is. Put them inside the perimeter that already protects the other two so well.**

---
*45 reports on `audit/independent-production-audit-2026-08-11`. All findings executed against the shipped source and a live PostgreSQL 16.13. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
