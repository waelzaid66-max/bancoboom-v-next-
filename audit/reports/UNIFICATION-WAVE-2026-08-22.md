# UNIFICATION WAVE — every written rule becomes an executed one

**The root cause was not incompetence. Every rule that would have prevented these problems already existed in this repository, and nothing enforced any of them. This wave converts the rules into assertions.**

**Specifications, not descriptions. Each assertion below is written against the gate's actual shape — `{ id, file, test: (s) => boolean, why }`, single file, `test` may `JSON.parse`. Copy them.**

`canonical @ 4f2c81c` · 209 assertion blocks producing 245 checks. **2026-08-22.**

---

# §1 · THE FIVE UNENFORCED RULES — and the assertion that ends each

## R-1 · "A guard must actually run"
**Violated four times after the finding was filed. Two more tests unreachable in `lib/`.**

### `A-0a` — root recursive test *(Space A)*
```js
{
  id: "P-root-recursive-test",
  file: "package.json",
  test: (s) => {
    const pkg = JSON.parse(s);
    return typeof pkg.scripts?.test === "string"
      && /pnpm\s+-r\b/.test(pkg.scripts.test)
      && /--if-present/.test(pkg.scripts.test)
      && /\brun\s+test\b/.test(pkg.scripts.test);
  },
  why: "build and typecheck are recursive; test was not, so lib/* guards could never execute no matter how they were wired",
}
```
**Root `package.json` gains:** `"test": "pnpm -r --if-present run test"`

### `A-0b` — the mobile aggregate must reach every mobile script *(Space A)*
**Both halves live in one file, so a single-file assertion is sufficient:**
```js
{
  id: "P-mobile-aggregate-covers-every-guard",
  file: "artifacts/banco-mobile/package.json",
  test: (s) => {
    const pkg = JSON.parse(s);
    const agg = pkg.scripts?.test ?? "";
    return Object.keys(pkg.scripts ?? {})
      .filter((k) => k.startsWith("test:"))
      .every((k) => agg.includes(`run ${k}`));
  },
  why: "A guard with a script that the aggregate never invokes is a guard that does not exist; four shipped dead before this was asserted",
}
```

**Then the glob runner** so a new `tests/*.test.mjs` needs **zero** `package.json` edits. **The assertion is the net; the glob is the cure.**

**DONE:** the two `lib/api-client-react` tests execute in CI with no change to `ci.yml`, and a new mobile guard runs with no change to `package.json`.

---

## R-2 · "Pin the control in the same commit that changes it"
**Violated on day two. Cost: 44 commits, 7 branches, three weeks.**

### `D-0a` — the car header must emit the literal the guard has asserted since 2026-08-01 *(Space D)*
```js
{
  id: "P-car-header-testid-literal",
  file: "artifacts/banco-mobile/components/search/car/CarsHomeHeader.tsx",
  test: (s) => /testID="cars-home-header"/.test(s),
  why: "The section guard has asserted this literal since the initial import; canonical still satisfies it and a ternary that hides it from static reading is the deviation, not the contract",
}
```
**This is not an owner decision.** Canonical carries the literal today. **The branch must satisfy a contract that predates it.** Give the scroll slot its `cars-hero-band` identity by a second element or a separate attribute — **both IDs can coexist.**

---

## R-3 · "Section work must not delete another section's capability"
**Violated 2026-08-21 in `9c0ddb1`. RE strips deleted by a CAR change. Chain still read 245/245.**

### `D-0b` — pin each section's strips *(Space D)*
```js
{
  id: "P-section-strips-cross-guard",
  file: "artifacts/banco-mobile/components/search/SectionSearchApp.tsx",
  test: (s) =>
    /propertyType/.test(s) &&
    /testID="section-primary-strip"/.test(s) &&
    /testID="section-engine-strip"/.test(s) &&
    /testID="car-brand-origin-strip"/.test(s),
  why: "A Cars refactor removed the Real-Estate propertyType fallback while every gate stayed green; one section's work must never delete another section's capability",
}
```
**First restore the RE `propertyType` fallback byte-for-byte** — canonical 47 occurrences, branch 41 — **then add this.**

---

## R-4 · "A prerequisite the code names must be provided"
**`pg_trgm` is required by migration `0000` and provisioned by no deploy path.**

### `A-1` — the migrator provisions its own prerequisite *(Space A)*
`lib/db/src/migrate.ts`, after `client.connect()`, **before** `migrate()`:
```ts
// pg_trgm must exist before 0000 creates its gin_trgm_ops indexes. Idempotent,
// safe on every deploy, and it keeps committed migrations immutable.
await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
```
```js
{
  id: "P-migrator-provisions-trgm",
  file: "lib/db/src/migrate.ts",
  test: (s) => {
    const ext = s.indexOf("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    const mig = s.indexOf("migrate(db,");
    return ext !== -1 && mig !== -1 && ext < mig;
  },
  why: "A fresh database fails at 0000 with 42704 and rolls back to zero tables; the journal runs 0000 first so a forward migration can never reach it, and baseline.ts hashes applied migrations so 0000 cannot be edited",
}
```
**Not a migration. Not an edit to `0000`.**

---

## R-5 · "Never ship a credential path a repository can track"
**`git check-ignore` exits 1 today, on a public repository.**

### `A-2` — the ignore rule is itself pinned *(Space A)*
```js
{
  id: "P-credentials-never-committable",
  file: ".gitignore",
  test: (s) =>
    ["google-service-account.json", "*.p8", "*.p12", "*.keystore", "*.mobileprovision"]
      .every((p) => s.split("\n").some((l) => l.trim() === p)),
  why: "eas.json names a Play publishing key at a repo-relative path on a public repository; one git add -A publishes it",
}
```

---

# §2 · WAVE ORDER — five agents, parallel, no dependencies

| Space | Task | Blocks |
|---|---|---|
| **A** | `A-0a` root recursive test · `A-0b` aggregate assertion · **then** the glob runner | **every guard in this document** |
| **A** | `A-1` `pg_trgm` + assertion · `A-2` gitignore + assertion | fresh deploy · credential exposure |
| **B** | File the `price_raw` requirement to C, then hydrate both surfaces from it | — |
| **C** | **`price_raw` on the detail response — one line, B is blocked on it** | B |
| **D** | Consolidate 7 branches → 1 · `D-0a` literal · **restore RE `propertyType`** · `D-0b` · wire 3 dead guards | the merge queue |
| **E** | Fix the stale `SearchService.ts:408` comment | prevents a rebuild of a working path |

**All six can start now. `A-0a` is the one that makes the other five real.**

---

# §3 · UNIFIED DIRECTION — one standard, every agent, no exceptions

**① A batch is DONE when the full battery passes on a tree containing it** — not when its own test passes.
```
security 0 blocking · chain 245+/245+ · confidence 26/26 · mobile ≥127 · API 505/505
```

**② Every new test must be proven to execute.** Run it. **Paste the count.** "The file exists" is not evidence.

**③ Static guard AND a real mount.** A source-text guard sees tokens, never control flow.

**④ Pin the control in the same commit that changes it.** *This rule already existed and its violation on day two is the most expensive event in the project.*

**⑤ A guard's `why` outranks its `test`.** When they disagree, the `why` is the invariant.

**⑥ Never weaken a guard to match current source.** *I violated this; the colleague was right.*

**⑦ `banco-mobile/package.json` conflicts resolve as a UNION.** It fired twice in one merge sitting; taking a side deletes another branch's guard silently.

**⑧ One branch per unit of work.** No `probe/` `staging/` `tmp/` on the shared remote.

**⑨ Label `RUNTIME_UNPROVEN` honestly.** API 36 is config; nothing has compiled against it.

**⑩ `lib/**` belongs to Space A.** A writes the shared change; each client owner writes their own propagation commit.

**⑪ Cross-audit before handover.** Your paired space answers six questions in writing, including *"what did you check that the author did not?"*

**⑫ Use the ten-state vocabulary.** `PRESERVED` `RESTORED` `EXPANDED` `PARTIAL` `PERSISTING_GAP` `NEW_BUILD` `RUNTIME_UNPROVEN` `SUPERSEDED_LABEL` `OWNER_POLICY_REQUIRED` `HOLD`. **Collapsing three of these into "missing" is how my own Discover entry inflated fourfold.**

---

# §4 · PRESERVE — no change without a written reason

**Payments:** HMAC before any DB access · routing only through HMAC-covered fields · **503 rather than ACK** · `pg_advisory_xact_lock` on the order id · refund-wins
**Authority:** 44/44 admin routes guarded · the S4 four-layer demote control · the route-guard assertion bounded by the **next** route
**Identity:** owner-keyed outbox · foreign-owner purge both directions · **JWT subject checked against entry owner before send**
**Search:** trigram GIN · the composite keyset that avoids the boundary-skip bug
**Deploy:** loopback-only publish · **numeric `TRUST_PROXY_HOPS`, never `true`** · `/readyz` 503 on DB loss · migrations profile-gated
**Maps:** the fail-closed three-state machine with its revival latch

---

# §5 · THE MERGE QUEUE — verified, waiting, and it is the throughput problem

**Green in the owner assembly, six gates, ready now:**
```
audit/current-truth · audit/cross-repo-continuation · maps-bootstrap-fail-closed
android-api36 · api-test-db-safety · db-adoption-guard · auth-account-deleted-retry
```
**Plus `db-baseline-adoption` after two sentences in `MIGRATIONS.md`** — 18 commits, API 505/505, baseline 14/14, **held by prose.**

**Delete:** 6 redundant car-header branches · `probe/` `staging/` `tmp/` · both `ci/final-rc-*` · `maint/safe-batch-01` · **close PR #4 as superseded.**

> **57 branches, 503 unmerged commits, 0 merged in 24 hours. This queue is the bottleneck, not agent capacity.**

---

# §6 · WHAT REMAINS WITH THE OWNER — two, not three

| # | Decision |
|---|---|
| 1 | **Which repository deploys** — `bancoboomstor` or `bancoboom-v-next-`. Then one commit moves documents and guard together. |
| 2 | **Open a failed CI run and read the annotation banner.** Ten seconds. Until CI executes, every figure in this project is one machine on Node 22 against a Node 24 target. |

**The `testID` ruling is returned to you as already answered** — canonical has carried the literal since 2026-08-01 and the guard has asserted it since the same commit. **§1 `D-0a` closes it without you.**

**And schedule the runtime week:** a device, a browser, live credentials, a deployment rehearsal with a restore actually performed, and **an Android build proving API 36 compiles.**

---

# §7 · WHY THIS WAVE IS DIFFERENT

**Every previous instruction in this engagement — mine and theirs — was written guidance. All of it was correct. None of it executed.**

**The five assertions in §1 are the same rules, in a form nobody can forget, skip, or resolve away in a merge.** This repository already proved the pattern works: **245 chain assertions that no agent has talked around, including four of mine that caught my own recommendations.**

> **The engineering was never the problem. The gap between a rule that is written and a rule that runs is the problem, and it is five assertions wide.**

---
*Assertion specifications written against the gate's real shape, verified by reading `P-root-build-serial-workspaces` as the template for a `JSON.parse` test and `P-car-compact-strip` as the template for a regex test. Single-file constraint confirmed — no `files:` array exists — and each specification respects it. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
