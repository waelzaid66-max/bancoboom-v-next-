# Top-Level Audit — `canonical/vnext-assembly` @ `f45c32c`

Executed on the manager's tree, untouched, clean working directory. Every number below comes from running the command, not from reading code. No file was changed, added to, or deleted during this audit; the tree was restored immediately afterwards.

**Date:** 2026-08-14 · **Subject:** `f45c32c92b8a` (Codex, 2026-08-13 16:01:01 +0200) · **Verdict:** healthy in every dimension the project controls; one externally-triggered failure.

---

## 1. Executive summary

The owner's belief that the latest version is clean is **correct**. Five of six top-level gates pass on the manager's tree with no assistance. The single failure is not a defect in this codebase — it is a vulnerability published upstream, in a third-party library, **after** the manager delivered.

| # | Gate | Result on untouched `f45c32c` |
|---|---|---|
| 1 | `pnpm install --frozen-lockfile` | ✅ exit 0 — lockfile in sync |
| 2 | Chain integrity | ✅ **242 / 242** |
| 3 | Production confidence (full run) | ✅ **26 / 26** |
| 4 | Mobile render suite | ✅ **120 / 120** across 16 suites |
| 5 | Root `npm run build` | ✅ exit 0 |
| 6 | Dependency security gate | ❌ **1 blocking** — see §3 |

Nothing in the repository is broken, missing, or regressed. The manager's own delivery record is accurate.

## 2. Integrity of the tree

| Check | Result |
|---|---|
| Newest branch by any author | `canonical/vnext-assembly`, Codex, 2026-08-13 — nothing newer exists |
| History depth | 238 commits |
| Previous canonical `e4b8f29` | still an ancestor — nothing was dropped in the promotion |
| Manager branches (`recovery/*`, `codex/*`) | 20, all intact |
| Tags | **0** — the tag-triggered deploy path has never fired |

## 3. The single failure — C-5, and why nobody hid it

```
[BLOCK] GHSA-2V37-7H3G-55P8 nanoid (high): custom generators can loop
        indefinitely when size is zero
Audit summary: 3 moderate/high/critical; 2 narrowly waived; 1 blocking.
[FAIL] production dependency audit has unwaived blocking advisories
```

**The manager's own record, committed inside `f45c32c` itself** (`audit/recovery/CANONICAL-PRODUCTION-GATE-MATRIX.md`, Dependency/security row):

> *Current gate PASS: two narrowly scoped Metro `image-size@1.2.1` waivers expire 2026-09-09 and **zero blockers**.*

Both statements are true, and they do not contradict each other:

| When | Same commit `f45c32c` | Result |
|---|---|---|
| 2026-08-13 | `pnpm run security:audit` | **zero blockers** |
| 2026-08-14 (this audit) | identical command, identical tree | **1 blocking** |

The gate does not carry a frozen vulnerability list — it queries the global advisory database **live on every run**. Not one character of source changed between those two rows. This is a time-triggered upstream event, not a defect introduced by anyone on this project, and not something the manager could have reported before it existed.

**Exposure.** Two copies are installed on canonical, and they differ in kind:

```
nanoid@3.3.8   ← eas-cli                    (devDependencies)  → build/CLI only
nanoid@3.3.17  ← @react-navigation/core → native → bottom-tabs
                 → @workspace/banco-mobile  (dependencies)     → RUNTIME
```

`pnpm audit` reports `vulnerable: <3.3.18`, `patched: >=3.3.18`. Both installed copies are inside the vulnerable range, and one of them is on the mobile runtime path.

**Operational cost while open.** `Production gates (static)` fails on **every** branch. `Production confidence` is then *skipped rather than evaluated*, so a whole gate silently stops reporting — batches show 6/7 for this reason alone, which can be mistaken for an unrelated regression.

## 4. ⚠️ New finding — a trap in the obvious fix

This is the most valuable item in this audit, because it is invisible on review and would be inherited by whoever fixes C-5.

The tree already carries eight security bumps written as open-ended ranges (`tar: '>=7.5.17'`, `qs: '>=6.15.2'`, `uuid: '>=11.1.1'`, …). Following that house pattern gives `nanoid: '>=3.3.18'`. **That is wrong here**, for a reason that does not apply to any of the eight precedents:

| | tar / qs / uuid | nanoid |
|---|---|---|
| Patched line | **is** the current major | is the **`legacy`** dist-tag |
| `latest` | same line | **6.0.1** |
| Module system | unchanged | **>=4 is ESM-only** |

Verified in an isolated probe with pnpm 11.9.0: an unbounded `nanoid: '>=3.3.18'` resolves to **6.0.1**, which breaks the CommonJS `require` in `postcss` and `@react-navigation`.

**It does not fail immediately, which is what makes it dangerous.** The existing lockfile already holds a `3.3.18` entry (postcss uses it), and pnpm reuses a satisfying entry rather than re-resolving. So the override appears correct, passes every gate, and detonates the first time anyone re-resolves from scratch — a second time-triggered failure, of exactly the class this audit is reporting.

**Correct form:** `nanoid: '>=3.3.18 <4'` — this changes **zero** resolved versions relative to the unbounded form on the current lockfile, and removes the trap.

**The bound also matches what canonical already does.** `vite` declares `nanoid ^5.1.6`, yet resolved to **3.3.17** on `f45c32c`. The project already keeps every requester on the 3.x line; the bound records that intent instead of leaving it to chance.

Also note pnpm's precedence rule: a `pkg@version` override outranks a general one. The existing `'nanoid@3.3.12': '3.3.17'` entry must therefore be **replaced**, not supplemented — adding a blanket line beside it leaves the 3.3.17 and 3.3.8 requesters on vulnerable copies while looking correct in review.

## 5. Register status

| Finding | Status on `f45c32c` |
|---|---|
| C-1 deploy path inert (0 tags) | open — owner decision |
| C-2 basemap on OSM public tiles | open — procurement decision |
| C-3 no `tileerror` handling | open |
| C-4 language never reaches the server | open — contract + codegen only |
| **C-5 nanoid blocking advisory** | 🔴 **open — blocking every CI run** |
| H-1 origin guard rejects legitimate clones | fix exists on `maint/safe-batch-01` |
| H-2 social sign-in invisible | open — Clerk Dashboard, zero code |
| H-3 no block/mute | open — manager's `P0 later` |
| H-4 superseded PR on ancestor repo | ✅ closed 2026-08-14 |
| M-1…M-6 · L-1…L-3 | open (L-1 fixed on `maint/safe-batch-01`) |

**Totals: 5 Critical · 3 High (1 closed, 1 fixed on a branch) · 6 Medium · 3 Low.**

## 6. Recommendation — no action taken

C-5 is the only item blocking CI across the whole project, and the remedy is two lines of dependency metadata. It is also the only finding here where the *obvious* fix carries a trap (§4), so it should be applied deliberately rather than quickly.

Recommended, for the manager to execute or delegate:

1. Replace `'nanoid@3.3.12': '3.3.17'` with `nanoid: '>=3.3.18 <4'` — replace, do not supplement.
2. Regenerate the lockfile and confirm every `nanoid` symlink resolves to a single `3.3.18` copy.
3. Confirm the lockfile diff mentions no package other than nanoid.
4. Re-run the full battery and exact-SHA CI.

The remaining four Criticals are unaffected by this and continue to hold production at **NO-GO**, consistent with the manager's own position.

---
*Top-level audit — executed, not inferred. The manager's tree was checked out clean, measured, and restored unchanged. No code was modified, no file deleted, nothing restructured, and nothing was pushed to `canonical/vnext-assembly`.*
