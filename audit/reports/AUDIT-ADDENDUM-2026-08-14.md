# Audit Addendum — 2026-08-14

Companion to `INDEPENDENT-PRODUCTION-AUDIT-2026-08-11.md` and `SCALE-STUDY-ACCOUNTS-AND-HOT-PATHS-2026-08-11.md`. It records what changed in the three days since, what closed, and one new Critical that did not exist when the audit was written.

**Tree at time of writing:** `canonical/vnext-assembly` = **`f45c32c92b8a`** (was `e4b8f29` in the original audit).

---

## 1. Canonical moved — the two accepted batches were promoted

On the owner's instruction, `canonical/vnext-assembly` was advanced **`e4b8f29` → `f45c32c`** as a **fast-forward** (no force, no merge commit). This promoted the manager's two published-and-accepted batches:

```
2892179  fix(messenger): serialize read and unread projections
2e659bb  fix(messenger): decode projection timestamp            ← VNX-07B accepted head
f45c32c  docs(recovery): reconcile accepted control evidence     ← VNX-GOV-01
```

Verified before the push: canonical was a **direct ancestor**, so no conflict was possible; scope was **8 files** (`ConversationService.ts` + its test + six recovery-control docs) with **zero** schema, migration, OpenAPI, controller, mobile, or workflow changes.

Verified after the push: **all 20 `recovery/*` and `codex/*` branches are now 0-unmerged**; history intact at **238 commits**; `e4b8f29` is still an ancestor, so nothing was dropped; **tags remain 0**, so the tag-triggered deploy workflow did not fire.

## 2. Independent verification of VNX-07B

The concurrency reasoning in `ConversationService.ts` was reviewed and is correct. The load-bearing insight, recorded here because it is easy to lose:

> PostgreSQL `now()` and `DEFAULT now()` are fixed at **transaction start**, which may predate a wait on `FOR UPDATE`. The wall clock is therefore read **after** the lock is owned, via `clock_timestamp()`.

Without that, a transaction which started earlier but waited on the row lock would stamp a message with a time **earlier** than one that started later and acquired the lock first — breaking monotonic ordering precisely under the contention the lock exists to serialise.

**Deadlock analysis — no cycle is possible.** `sendMessage` and `markConversationRead` take the conversation row lock and then touch messages. `reactToMessage` takes **only** a message row lock (`FOR UPDATE`, scoped by `conversationId`) and never requests a conversation lock; its participant check runs before the transaction and takes no lock. No transaction holds a message lock while waiting for a conversation lock, so the wait-for graph has no cycle.

Gate results reproduced independently on `f45c32c`: chain integrity **242/242** · production confidence **26/26** (full run) · render **120/120** across 16 suites · root `npm run build` **exit 0**.

**~~Correction to the original audit.~~ WITHDRAWN — this "correction" was itself false.**

> This paragraph originally read: *"The audit stated a read cursor exists. That was imprecise … the audit's sentence was not [right]."*
>
> **That accusation is wrong, and re-checking the source proves it.** The string `cursor` appears exactly **twice** in `INDEPENDENT-PRODUCTION-AUDIT-2026-08-11.md`, and both times it is classified as absent:
>
> - `:106` — lists `per-conversation read cursor` under **Missing**
> - `:288` — *"Per-conversation read cursor | **Absent** — per-message `read_at` plus side counters exist, which is not a cursor"*
>
> **The original audit never claimed a read cursor exists. It was accurate, and this addendum falsely discredited it.** The substantive facts below are correct and unchanged — `conversations` carries only `buyer_unread`/`seller_unread`, `messages` carries per-message `read_at`, and there is no `last_read_message_id`. What was wrong was the **attribution**: the imprecise claim was made by this auditor in conversation, not in the audit document, and the error was then recorded against the wrong artifact.
>
> The manager's backlog classification was right — that part stands. So was the audit's.
>
> *Retained rather than deleted, because a report that quietly removes a false accusation is less trustworthy than one that carries it corrected.*

## 3. 🔴 NEW CRITICAL — C-5: `canonical` fails its own dependency security gate

This did not exist when the audit was written. It appeared between 2026-08-13 and 2026-08-14 from an upstream advisory publication.

```
[BLOCK] GHSA-2V37-7H3G-55P8 nanoid (high): custom generators can loop
        indefinitely when size is zero
[FAIL] production dependency audit has unwaived blocking advisories
Audit summary: 3 moderate/high/critical; 2 narrowly waived; 1 blocking.
```

**Reproduced on untouched `canonical` @ `f45c32c`** with a clean working tree — byte-identical output. It is not caused by any branch.

**Timing.** The VNX-GOV-01 record of 2026-08-13 states `security:audit` passed with *zero blocking*. The advisory database is queried live at gate time, so this is a **time-triggered regression from upstream**, not a code change on any side.

**Exposure — materially different from the existing waivers.**

```
nanoid@3.3.8   ← eas-cli                    (devDependencies)  → build/CLI only
nanoid@3.3.17  ← @react-navigation/core → native → bottom-tabs
                 → @workspace/banco-mobile  (dependencies)     → RUNTIME
```

The `image-size` waivers are justified as *"build-time-only … no patched release exists."* **Neither clause applies here:** nanoid reaches the mobile runtime through `@react-navigation`, and `pnpm audit` reports `vulnerable: <3.3.18`, `patched: >=3.3.18` — a fix is published. Both installed copies fall under the vulnerable range.

**Recommended resolution — precedent already in the tree.** `pnpm-workspace.yaml` carries an `overrides:` block used this way eight times (`tar: '>=7.5.17'`, `markdown-it: '^14.2.0'`, `@babel/core: '7.29.6'`, …). One line in the same style resolves rather than suppresses it:

> ### 🔴 CORRECTION — 2026-08-14, later the same day. **Do not apply the line as first written.**
>
> This section originally recommended:
>
> ```yaml
>   nanoid: '>=3.3.18'          # ← WRONG. Do not use.
> ```
>
> **That recommendation was a trap, and it was mine.** Copying the `tar`/`qs`/`uuid` house style does not transfer to this package: `3.3.18` is only the **`legacy`** dist-tag — `latest` is **6.0.1**, and nanoid `>=4` is **ESM-only**. Verified in an isolated probe (pnpm 11.9.0, `minimumReleaseAge` applied): the unbounded range resolves to **6.0.1**, which breaks the CommonJS `require` in `postcss` and `@react-navigation`.
>
> It does not fail immediately, which is what makes it dangerous. The lockfile already holds a satisfying `3.3.18` entry and pnpm reuses it rather than re-resolving, so the override passes every gate and detonates only on the next from-scratch resolve. **It was written, and exact-SHA CI passed it 7/7** (run `31825603049`, commit `71c9173`). No gate catches this class. That commit was reverted and the branch reduced to a canonical-identical tree before the corrected fix was applied.
>
> **The correct form, and the one that is verified:**
>
> ```yaml
>   nanoid: '>=3.3.18 <4'
> ```
>
> A second requirement is equally invisible in review: pnpm gives a `pkg@version` override **precedence** over a general one, so the existing `'nanoid@3.3.12': '3.3.17'` must be **replaced**, not supplemented. A blanket line added beside it leaves the 3.3.17 and 3.3.8 requesters on vulnerable copies while reviewing as correct.
>
> Full evidence, and the same bounding applied to `tar`/`qs`/`uuid`: `CODEX-INVESTIGATION-HANDOFF-01-2026-08-14.md` and `TRAP-AUDIT-FUTURE-FAILURES-2026-08-14.md`. Verified fix on `fix/nanoid-override` @ `76f7f26`, CI **7/7**.

A waiver is the weaker option: the gate has no generic waiver list — `IMAGE_SIZE_WAIVER_IDS` and `IMAGE_SIZE_WAIVER_EXPIRES_AT` are hardcoded for one package (`dependency-security-gate.mjs:13-18`) — so waiving would mean editing gate code to excuse a runtime dependency that has a published fix.

**Operational impact until resolved:** every CI run on every branch fails `Production gates (static)`, and `Production confidence` is then **skipped rather than evaluated**, so that gate stops reporting entirely. Batches will show 6/7 for this reason alone.

**~~Not applied.~~ STATUS UPDATE — 2026-08-14, later the same day.** A verified fix now exists on `fix/nanoid-override` @ `76f7f26`, exact-SHA CI **7/7** (run `31831418894`). Two files, four effective lines, and the same bounding applied to `tar`/`qs`/`uuid` because they share the failure mode — `uuid`'s open `>=11.1.1` floor had already absorbed **three majors** and installs `14.0.0`. Verified that none of the three changes a resolved version. **Still not merged**: promotion to `canonical/vnext-assembly` remains the manager's decision.

## 4. Two audit findings now have a fix on a branch

`maint/safe-batch-01` @ `6a388c6` — **2 files, +12 / −4**, not pushed to canonical.

**H-1 — the origin guard rejected legitimate clones.** `ALLOWED_REMOTE_PATHS` required a literal `.git` suffix with no normalisation, so a clone from the plain GitHub URL failed the identity check; because `prebuild` runs this gate, root `npm run build` was unreachable on such a checkout. Now the suffix is stripped before comparison. Proven three ways — plain URL passes, `.git` URL passes, and **an unrelated repository is still rejected**. The guard is repaired without being weakened.

**L-1 — OSM attribution.** The tile layer credited `"&copy; OpenStreetMap"` alone while the same file argues at line ~283 that attribution is a licence term. Now renders the linked *"OpenStreetMap contributors"* credit with `rel="noopener"`. **The tile source is unchanged** — `map-chrome-guard` pins `/tile\.openstreetmap\.org/` at line 409, so changing the provider is not a low-risk edit and was not attempted.

CI on that branch: **6 of 7 jobs green**, the seventh being C-5 above, which reproduces on canonical.

**A deliberate omission.** The audit noted `workspace-verify.mjs` has no test coverage. No test was added, because there is **no test runner for root `scripts/`** — only ESLint — so a `*.test.mjs` there would sit unexecuted, recreating precisely the orphaned-test pattern the audit flagged and VNX-01 had to repair. Wiring a runner belongs with the VNX-OPS-02 note on designing full workspace lint separately.

## 5. Status of the original issue register

| Finding | Status on `f45c32c` |
|---|---|
| C-1 deploy path inert (0 tags) | **open** — owner decision |
| C-2 basemap on OSM public tiles | **open** — procurement decision |
| C-3 no `tileerror` handling | **open** |
| C-4 language never reaches the server | **open** — contract + codegen only |
| **C-5 nanoid blocking advisory** | 🟠 **fix verified on `fix/nanoid-override` @ `76f7f26`, CI 7/7 — not merged; blocks every CI run until promoted** |
| H-1 origin guard | fix on `maint/safe-batch-01` |
| H-2 social sign-in invisible | **open** — Clerk Dashboard, zero code |
| H-3 no block/mute | **open** — manager's `P0 later` |
| H-4 superseded PR open on the ancestor repo | ✅ **closed** 2026-08-14, with the reason recorded |
| M-1…M-6 | **open** |
| L-1 OSM attribution | fix on `maint/safe-batch-01` |
| L-2, L-3 | **open** |

**Revised totals: 5 Critical · 3 High (1 closed, 1 fixed on a branch) · 6 Medium · 3 Low.**

## 6. Unchanged verdict

Claimed work exists, is integrated, and no regression or loss was found in the codebase. C-5 is an **upstream** advisory, not a defect introduced by this project. Production release remains **NO-GO**, consistent with the manager's own position, and the four ceilings in the scale study are unaffected by anything in this addendum.

---
*Addendum — evidence-based, execution-verified. No code was changed outside `maint/safe-batch-01`; no files deleted; nothing restructured.*
