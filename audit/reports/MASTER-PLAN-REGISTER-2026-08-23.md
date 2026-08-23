# The master plan — every open item, its evidence, its owner, and the command that closes it

**Forty-two hours frozen. Seventy-five branches. Nine P0s. Every fix ordered so far is still unapplied — I checked each one this morning rather than assuming.**

**This document replaces every plan I have issued. One register, one condition set, one DONE test per item, and a measurement beside every claim.**

`canonical @ 4f2c81c` — frozen **42 hours**. **2026-08-23.**

---

# §0 · THE LIVE STATE — measured this morning, not quoted

```
canonical                          4f2c81c   2026-08-21 10:27   frozen 42h
branches                           75  ·  28 fully merged (deletable)  ·  47 with work (925 commits)

auth sessionId call sites unfixed  8      ← was 6 when I filed it; two more surfaces added
root package.json "test" script    ABSENT ← on canonical and all 75 branches
price_cash typeof guard            1      ← still `typeof … === "number"`, still always null
deleteListing hard DELETE          1      ← still `db.delete(listings)`
migrate.ts CREATE EXTENSION        0      ← DEPLOY-01 unfixed
chain gate EXPECTED_CHECKS pin     0      ← denominators still self-reported
```

> **Nine ordered fixes. Zero applied. Two defects have grown since being filed.**

---

# §1 · THE CONDITIONS — unchanged, and they bind me too

**① DONE is the full battery on a tree containing the work**, not the work's own test:
```
install --frozen-lockfile 0 · typecheck 0 · build 0 · chain 245/245 · confidence 26/26
security 0 blocking · mobile 127/127 · API 527+/527+ against a real PostgreSQL
```
**② Prove your guard executes.** `node audit/tools/guard-reachability.mjs <branch>` — two seconds. **Fourteen guards have shipped dead.**
**③ Static guard AND a real mount.** A text guard cannot tell code from prose — proven twice.
**④ Pin the control in the same commit that changes it.**
**⑤ A guard's `why` outranks its `test`.**
**⑥ Never weaken a guard to match source.** *Replacing an assertion that checks the wrong thing is not weakening it — state which you are doing.*
**⑦ `banco-mobile/package.json` resolves by `audit/tools/union-mobile-package-json.mjs`, never by hand.**
**⑧ One branch per unit of work. No `probe/` `tmp/` `staging/` on the shared remote. No force-push to a shared branch.**
**⑨ Label `RUNTIME_UNPROVEN` honestly.**
**⑩ `lib/**` and `scripts/run-api-tests-local.mjs` belong to Space A.**
**⑪ Cross-audit before handover.**
**⑫ Use the ten-state vocabulary.**
**⑬ A RED-by-design branch never enters an assembly that claims green.**
**⑭ Verify the clone is complete before any ancestry claim** — `git rev-parse --is-shallow-repository`. *My own Correction #30.*
**⑮ Nobody reports a bug in a surface they have not run.** *The five-minute recipe is in `RUN-THE-APP-YOURSELF-2026-08-22.md`.*
**⑯ Do not extrapolate a class from one instance.** *My own Correction #32, written the same day I proved n=1.*

---

# §2 · P0 — nine items. Each is small. All nine have been open since 2026-08-01.

| # | Item | Evidence | Owner | DONE |
|---|---|---|---|---|
| **P0-1** | **`DEPLOY-01`** — fresh deploy fails, 0 tables | reproduced: `42704 ResolveOpClass`, then 414 ms / 74 tables with the extension | **A** | drop the DB, recreate empty, `run migrate` with no manual `CREATE EXTENSION` → **74 tables** |
| **P0-2** ✅ | **`price_cash` always null** — **scope corrected 2026-08-23: 4 defects, 3 surfaces** | driver returns `"58039215.00"` typeof **string**; guard is `=== "number"` → `null` on every response. Casualties measured: web workaround corrupts the price · mobile edit field empty, save blocked · booking rate + estimate hidden on all three clients | **C** | `getListingDetail` returns `price_cash` as the exact stored integer **and** `p0-2-casualty-chain.mts` exits 0 |
| **P0-3** ✅ | **web edit divides price by up to 10⁶** | measured: `45,398,169 → "45.40M EGP" → submits 45.4`. **Blocked on `P0-2`** — hydrating from `price_cash` on canonical yields an empty field | **B** | round-trip: hydrate then submit preserves the stored value **4/4**, both twins byte-identical, both typecheck 0 |
| **P0-4** | **web workspace cannot create a listing** | all three categories rejected; the form discards the API's message | **B** | each category's payload passes `validateAttributes` from a mounted form |
| **P0-5** | **deletion erases thread, booking, report, leads** | measured blast radius: `1·2·1·1·3·2 → 0·0·0·0·0·0` | **C** | Gate-4 matrix green **with no edit to the test file** |
| **P0-6** | **`A-0a` root recursive `test`** | 0 of 75 branches; CI runs 3 test commands | **A** | `guard-reachability` returns **UNREACHABLE: 0** on the trunk candidate |
| **P0-7** ✅ | **public API dies on an auth secret** | measured: bad key → 500 on `/api/v1/listings`, `/sitemap.xml`, `/robots.txt`; probes stay 200 | **C** | ~~`/api/readyz` returns 503~~ — **superseded by Correction #38**: `readyz` stays **200** and names `clerk_config: "down"`; public routes 200, protected routes **401**, `health.test.ts` unedited |
| **P0-8** | **`fix/auth-account-deleted-retry` red** | **8 unguarded sites** across 4 surfaces; 3 commits added since filing | **D** | `pnpm run typecheck` exits 0 from the root |
| **P0-9** | **no gate declares its size** | delete one check → `23/23 passed` exit 0; delete one assertion → `244/244 passed` exit 0 | **A** | remove any one check → the gate **fails** |

---

# §3 · THE PLANS — six spaces, parallel, one blocker

## Space A — the runner and the gates *(everything else depends on A-0a)*

**A-0a · the root recursive test** — `"test": "pnpm -r --if-present run test"` + `P-root-recursive-test` + the mobile-aggregate assertion. **Then rename the four orphan scripts to `test`** (`lib/api-client-react`, `lib/search-contract`, `scripts`, `lib/db`). **DONE: UNREACHABLE 0.**
*Fourteen guards have shipped dead. Every one of their authors wired them correctly — to a package the runner never visits.*

**A-1 · `pg_trgm` in `migrate.ts`**, after `client.connect()`, before `migrate()`, plus `P-migrator-provisions-trgm` which asserts the ordering. **Not a forward migration** — the journal runs `0000` first and `0000` is what fails. **Not an edit to `0000`** — `baseline.ts` hashes applied migrations.

**A-2 · `.gitignore` credential pin** — `google-service-account.json`, `*.p8`, `*.p12`, `*.keystore`, `*.mobileprovision`, each as an exact line, plus the assertion. **`git check-ignore` exits 1 today, on a public repository.**

**A-3/A-4/A-5 · declare every denominator**
```js
const EXPECTED_CHECKS   = 245;                       // chain gate
const EXPECTED_RESULTS  = skipTypecheck ? 24 : 26;   // confidence gate
```
plus a chain assertion **on the confidence gate**, which today it does not mention at all. **Same self-referential total in `ops-live-cutover-check.mjs:309` and `staging-p0-smoke.mjs:204` — pin those too.**
*Five branches currently carry a 242-assertion gate against canonical's 245. Both print a green line.*

**A-6 · readiness must check what breaks first** — add a `clerk_config` check to `/readyz`. **DONE: unset the key → 503.**

**A-7 · the comment census in CI**, threshold 5 (the count of deliberate prose pins). **A sixth is a code contract that prose can satisfy.**

**A-8 · reconcile the two baseline implementations** — `fix/db-baseline-adoption` (18) vs `audit/db-adoption-guard` (3) conflict on `lib/db/src/baseline.ts` and `MIGRATIONS.md`. **One survives; the other rebases. A written comparison before either merges.**

## Space B — the two web surfaces *(byte-identical: every fix is two files)*

**B-1 · hydrate from `price_cash`, never `price_display`** — delete the `.replace(/[^\d.]/g, "")`; it exists only to undo a formatter and it is the instrument of the corruption. **Blocked on C-1.**
**B-2 · surface the API's error** — `onError: (err) => setFormError(extractApiMessage(err) ?? copy.errorGeneric)`. **Three lines. Ship before B-3** — it converts an undiagnosable dead end into a fixable one today.
**B-3 · share the taxonomy** — move `REQUIRED_SPEC_KEYS` + `requiredSpecKeysFor` into a package both clients import. **Do NOT add three free-text fields** — that was my order and it was wrong: free text passes the presence check and is invisible to every filter.
**B-4 · a mounted round-trip test per category**, plus `P-web-workspace-spec-fields-cover-required` **on both `banco-web` and `banco-website`** — byte-identical files, pin both or the twin regresses silently.

## Space C — the API

**C-1 · `price_cash: listing.base_price_cash == null ? null : Number(listing.base_price_cash)`** + `P-listing-detail-price-cash-numeric`, which asserts `Number(...)` present **and** the `typeof === "number"` guard gone. *Purely additive: the field has been null for every client since day one.*
**C-3 · retire instead of destroy** — `status: "archived", deletedAt: new Date()`. **The 15 CASCADEs stay** — they are correct for a real deletion, which becomes an administrative operation. **Public visibility already filters on `active` at all four call sites.**
**C-4 · media reclamation via the existing outbox** — a storage failure must not roll back the retirement.
**C-6 · sixteen per-site SQL concurrency assertions** + `TRUST_PROXY_HOPS`. **Per file, never a blanket ban** — `lib/advisoryLock.ts` uses `pg_try_advisory_lock` correctly by design.
**C-7 · the behavioural concurrency harness** — two connections, **each sleeping ~400 ms after acquiring the lock, before its check-then-act**, asserting exactly one credit. **DONE: swap in `pg_try_advisory_lock` and the test fails.** *Demonstrated: 5/5 credited once vs 5/5 credited twice.*
**C-8 · the public API must not fail closed on an auth secret** — mount `clerkMiddleware` on the authenticated router only, or give it an anonymous path.
**C-9 · `GET /api/v1/listings/feed` returns 500** with a healthy DB and a valid key. **Unexplained. Diagnose before the next assembly.**

## Space D — mobile

**D-0a (final) · replace the comment-satisfiable assertion** with the two-slot expression. **Canonical satisfies it, `unified-dock-v2` satisfies it, a comment cannot.** **DONE: `unified-dock-v2` goes green on all four gates.**
**D-1 · one car-header branch.** Keep **`fix/car-header-unified-dock-v2`** (44 commits, typecheck ok, chain 245/245, one failing assertion). **Delete the other seven.**
**D-2 · remove `toHaveAccessibilityState`** — it is not registered and throws `TypeError` at runtime. Present on five branches.
**D-3 · `CarBrowseAxes` must import `SearchSort`**, not re-declare a five-value `SortKey`. **Add `popular` to `SORT_ICONS` and the translations** — the contract declares it, `FilterSheet` offers it, `url.ts` round-trips it, and the server implements it at `SearchService.ts:741`.
**D-4 · `sessionId ?? null` at 8 sites** across `banco-web`, `banco-website`, `admin-os`, `dealer-os`.
**D-5 · restore the RE `propertyType` fallback byte-for-byte**, then pin every section's strips.
**D-6 · split the map-bridge negative test** so the latch cannot mask it — three lines.

## Space E — ops and hygiene

**E-1 · resolve the `ops:deployment-sot-guard` collision** — two branches, same key, different scripts, **and CI invokes it zero times on both.** Wire the survivor into `ci.yml`.
**E-2 · `local.env.example`** — uncomment both Clerk keys, mark them **REQUIRED for the API server**, and put the working fake values in. *A fake key in an example file is documentation, not a secret.*
**E-3 · one boot smoke test in CI** — `migrate → seed → boot → assert 200 on readyz, /api/v1/listings, /sitemap.xml`. **Nothing in this repository proves the server starts.** 245 assertions, 527 API tests, 127 render tests, **and not one boots it.**
**E-4 · delete the 28 fully-merged branches** and the 4 duplicate car trees. **Safe — verified against full history after Correction #30.**
**E-5 · fix the stale `SearchService.ts:408` comment** — it tells the next engineer to build the GIN index that has existed since `0000` and that `EXPLAIN` shows the planner using.

---

# §4 · WHAT IS BLOCKED ON THE OWNER — still two

| # | Decision | Cost to you | What it unblocks |
|---|---|---|---|
| **1** | **Ratify vNext as the deploy repository.** The code has lived there alone for 14 days; `bancoboomstor`'s last commit is 2026-08-09. Then **one commit** flips 13 documents and 14 assertions together. | one sentence | **60 held commits** |
| **2** | **Open one failed CI run and read the annotation banner.** | ten seconds | `ci.yml:36` runs exactly the gate that yesterday's regression fails — **a live CI would have caught it within minutes** |

**Nobody may delete or weaken the 14 deploy-repository assertions to make a branch pass.** *That is the mistake I made once and was correctly stopped on.*

---

# §5 · THE MERGE ORDER — 28 green branches, verified individually

**Merge in this order, running the full battery between each, resolving `banco-mobile/package.json` with the union tool:**

```
1  audit/current-truth · audit/cross-repo-continuation · audit/db-adoption-guard
2  fix/maps-bootstrap-fail-closed · fix/recent-search-chrome · polish/discover-five-portals
3  fix/android-api36-release-compliance · fix/api-test-db-safety · staging/certify-pr30-pr42
4  test/push-send-retry-p0 · test/push-receipt-p0 · test/marketplace-token-normalization
5  fix/account-deletion-resume · fix/profile-visible-role-authority-red
6  fix/db-baseline-adoption            ← after A-8 resolves the collision
7  fix/car-header-unified-dock-v2      ← after D-0a
8  fix/auth-account-deleted-retry      ← after D-4
9  release/production-assembly         ← after owner decision #1
```

**HOLD, correctly:** `fix/gate3-listing-moderation` (16 RED API tests) · `test/listing-deletion-retention-red` (5 RED API tests). **Both are RED by design and must stay red until their fixes land.**

---

# §6 · HOW THIS REGISTER DIFFERS FROM EVERY PLAN I HAVE ISSUED

**Every earlier plan was written from reading. This one has a measurement beside every line, and eleven of my own corrections are folded into it:**

- `price_raw` was never needed — **the field exists and a type check disabled it** *(#23)*
- the deploy-repository question is a ratification, not a choice *(#22)*
- `26/26` is not what CI produces — it produces `24/24` *(#26)*
- "six gates" was five; the two recursive ones had never run on an assembly *(#27)*
- the recovery branches are fully merged, not stranded — my clone was shallow *(#30)*
- canonical does not carry the `testID` literal; a comment satisfies the guard *(#31)*
- and that class is **one instance**, not 1,400 lines *(#32)*

> **A plan is only as good as the worst measurement in it. Seven of the items above were wrong in a plan I published, and each was found by running something instead of reading it.**

---

# §7 · STANDING

**Register: 32 classes · 9 at P0 · 39 corrections published.**
**Seven fully proven and patched: `P0-1 P0-2 P0-3 P0-6 P0-7 P0-8 P0-9`. `P0-5` behaviourally proven, patched for steps 1–2 only — 4 DTOs and 98 client references still open. `P0-4` specified, unproven. Five patches in `audit/patches/`, each `git apply --check` clean against a pristine tree.**
**Sequencing: `P0-3` must not land without `P0-2` — alone it converts a wrong price into an empty one.**
**Trunk candidate: `local/owner-assembly-20260822-r2` — 16 inputs, 135 commits, eight gates green, API 527 passed.**
**Production: `NO-GO`.**

> **Nine P0s. Every one is a line or two. All nine have been open since the initial import on 2026-08-01, and not one has been applied in the 42 hours since I specified them with reproductions.**
>
> **The engineering is not the bottleneck and never was. Nothing promotes, and nothing enforces.**

---
*Every figure in §0 measured this morning against a full-history clone, not carried forward from an earlier report. Every DONE criterion is a command whose output decides it. The conditions in §1 include four rules derived from my own errors, and §6 lists the seven plan lines those errors corrected. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
