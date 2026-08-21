# Intake and priority order — `canonical @ 4f2c81c`

Full intake of all agent work, reports and plans, followed by a precise priority order. Executed **2026-08-21 18:15 UTC**, **re-verified and corrected 18:50 UTC** — see the correction notice below.

**Headline: canonical is healthy and every gate passes. But nine live branches now hold 101 commits, the branch named `release` contains none of the other eight, three branches are not even built on the current canonical, and two collide on a script name that no guard pins.**

> ### ⚠️ Correction to this report's own first pass
>
> The 18:15 pass enumerated **six** branches / **79** commits and stated that *"canonical **is** an ancestor of every branch."* **Both statements were wrong**, and I found it by re-running the enumeration against a fresh `git fetch --all --prune` before delivering rather than trusting my first sweep.
>
> - **Three live branches were omitted:** `fix/recent-search-chrome` (11), `fix/maps-tile-failure-state-v2` (8), `fix/gate3-listing-moderation-authority` (2). The first sweep filtered on today's `-20260821` work in progress and dropped two branches whose last commit predates today's session, plus one created while the sweep ran.
> - **The ancestry claim is false for three of them.** `fix/recent-search-chrome` and `fix/maps-tile-failure-state-v2` are built on `1ccdbac` (**8 commits behind** canonical); `fix/deployment-sot-next` is built on `3951c72` (**5 behind**). Canonical *is* an ancestor of the other six.
> - `fix/deployment-sot-next` — **one of the two collision branches** — is one of the stale-base three. That makes §4 more urgent, not less.
>
> The count of code files on `fix/deployment-sot-next` was also wrong: **2**, not 21. §2–§5 below are the corrected figures. **Recorded rather than silently overwritten, so this audit is weighed rather than trusted.**

---

## 1 · Canonical — verified, all gates green

| Gate | Result on `4f2c81c` |
|---|---|
| Working tree at checkout | ✅ clean |
| `pnpm install --frozen-lockfile` | ✅ exit 0 |
| Dependency security | ✅ **0 blocking** |
| Chain integrity | ✅ **245 / 245** |
| Production confidence (full) | ✅ **26 / 26** |
| Mobile render | ✅ **124 / 124** across 17 suites |

Five commits landed since the supervision pass:

```
08222f0  fix(lint): allow declared Express augmentation
8396b39  fix(api): honor dealer listing sort cursors
f1188fa  docs(audit): record dealer sort verification boundary
875406e  chore(lint): remove audited dead bindings
4f2c81c  docs(audit): record lint scope and remaining coverage
```

**The schema file change is benign** — I checked it specifically because `lib/db/src/schema/index.ts` appeared in the diff and a schema change would need a migration. It removes one unused import (`createSelectSchema`) as part of the dead-bindings cleanup. **No structural change, no migration required.**

Two of my open findings are being worked directly: **full-workspace lint scope** (previously OPEN, CI covering `scripts` only) and a **dealer listing sort-cursor** defect.

## 2 · Intake — what now exists

**Agent reports produced today:**

| Location | Count |
|---|---|
| `audit/recovery/` on canonical (VNX-DEALER-01, VNX-LINT-01/02 + four ledgers updated) | 7 |
| `audit/current-truth-20260821` — `reports/production-verification/92–102` | 11 |
| `audit/cross-repo-continuation-20260821` — accounts/FI, admin-dealer-web, listings-media, messenger residuals, EAS store readiness, baseline-adoption forensic | 10 |
| `release/production-assembly-20260821` | 13 |

**Pending branches, by weight** — every branch in the repository carrying commits above canonical, enumerated by execution, nothing filtered:

| Branch | Commits above canonical | Files | Code files | Base |
|---|---|---|---|---|
| `release/production-assembly-20260821` | **34** | 18 | 5 | ✅ canonical |
| `fix/db-baseline-adoption-20260821` | **18** | 9 | 8 | ✅ canonical |
| `audit/current-truth-20260821` | 11 | 11 | **0** — docs | ✅ canonical |
| `audit/cross-repo-continuation-20260821` | 11 | 11 | **0** — docs | ✅ canonical |
| `fix/recent-search-chrome-20260821` | 11 | 5 | 5 | 🟠 `1ccdbac`, 8 behind |
| `fix/maps-tile-failure-state-v2-20260821` | 8 | 5 | 5 | 🟠 `1ccdbac`, 8 behind |
| `fix/car-header-unified-dock-v2-20260821` | 4 | 2 | 2 | ✅ canonical |
| `fix/deployment-sot-next-20260821` | 2 | 2 | 2 | 🟠 `3951c72`, 5 behind |
| `fix/gate3-listing-moderation-authority-20260821` | 2 | 2 | 1 | ✅ canonical |
| **Live total** | **101** | | | |
| `audit/independent-production-audit-2026-08-11` *(mine)* | 24 | 23 | **0** — docs | ✅ canonical |
| `ci/final-rc-f45c32c` · `ci/final-rc-26b1fc0` | 1 each | **0** | 0 | stale — empty RC commits |
| `fix/car-header-unified-dock-20260821` | 1 | 1 | 0 | superseded by `-v2` |
| `maint/safe-batch-01` | 1 | 2 | 2 | superseded by `26b1fc0` |
| `fix/maps-bootstrap-error-20260821` | **0** — merged | — | — | — |

**101 commits are outstanding across nine live branches.** Four more branches are stale or superseded and should be retired; my own audit branch is docs-only and merges cleanly at any time.

**Two notes the table alone does not show:**

- `fix/maps-tile-failure-state-v2` (PR #4) is **superseded** — the maps work landed on canonical via `5f44c86`, in a better form (Leaflet's native `tileerror` on a constant-derived layer, versus this branch's wrapper module with a hardcoded host). **Merging PR #4 now would regress canonical.** Close it, do not merge it.
- `release/production-assembly` adds a **new workflow file**, `.github/workflows/release-assembly.yml`. With Actions dead at the platform layer (P0 ①), that workflow has never executed and cannot be assumed to work.

## 3 · 🟠 Structural finding — the topology is divergent, not stacked

I tested containment **pairwise across all nine live branches — 72 ordered pairs.** The result is total divergence:

```
no live branch is an ancestor of any other live branch
```

Not one pair. Nine parallel work-streams, none built on another's work.

**And six of the nine sit on canonical; three do not:**

| Branch | Built on | Behind canonical |
|---|---|---|
| `fix/recent-search-chrome` | `1ccdbac` | **8 commits** |
| `fix/maps-tile-failure-state-v2` | `1ccdbac` | **8 commits** |
| `fix/deployment-sot-next` | `3951c72` | **5 commits** |

Those three have not seen C-4 (language sync), the canonical-push CI triggers, the three new chain assertions, the dealer sort-cursor fix, or the lint cleanup. **A gate result measured on any of them is a result about an old tree.**

**The branch named `release/production-assembly` holds 34 commits and excludes the other 67.** That name reads as "the assembled release candidate." It is not one — it is one work-stream among nine.

**Risk, stated plainly:** anyone treating that branch as the release, or tagging from it, ships without the baseline-adoption work (18 commits), the recent-search chrome, the car-header work, the Gate-3 moderation authority, the deployment SOT work, and every audit trail. Nothing currently prevents that; **tags are still 0**, so the mistake has not been made.

**Recommendation:** either rename it to its actual scope, or make it a genuine integration branch by merging the others into it. **Do not tag from it in its current state.** And **rebase the three stale-base branches onto canonical before measuring anything on them.**

## 4 · 🔴 Concrete collision — two SOT gates, one script name, no guard

`release/production-assembly` and `fix/deployment-sot-next` both modify root `package.json`, and both add **the same script key pointing at different files**:

```jsonc
// release/production-assembly
"ops:deployment-sot-guard": "node scripts/release-sot-gate.mjs",
"release:verify":           "node scripts/release-sot-gate.mjs"

// fix/deployment-sot-next
"ops:deployment-sot-guard": "node scripts/deployment-sot-guard.mjs"
```

Verified file presence:

| Branch | `release-sot-gate.mjs` | `deployment-sot-guard.mjs` |
|---|---|---|
| `release/production-assembly` | ✅ | ❌ |
| `fix/deployment-sot-next` | ❌ | ✅ |

**This is a semantic collision, not a textual one.** Two independently-built source-of-truth gates were given the same command name. Git will flag the conflicting line, and **whoever resolves it silently chooses which gate the project runs** — the other becomes dead code invoked by nothing.

**And nothing catches a wrong choice:** neither script is referenced by any workflow or by `chain-integrity-gate.mjs` on canonical. There is no assertion pinning which gate `ops:deployment-sot-guard` must invoke.

**Recommendation, before either merges:**
1. Decide which gate is authoritative — they are not interchangeable; one is release-scoped, one deployment-scoped.
2. If both are wanted, give them **distinct** script names.
3. **Pin the decision with a chain assertion**, exactly as the CI-trigger batch did — otherwise this recurs the next time either file is touched.

### 4b · 🟡 A second defect in the same file, found on re-verification

`fix/deployment-sot-next` also **strips the trailing newline from root `package.json`**:

```
-}
+}
\ No newline at end of file
```

Small, but not cosmetic. It makes every future `package.json` diff show a spurious last-line change, it is the kind of thing `prettier --check` and many pre-commit formatters fail on, and it will be silently re-introduced by whoever resolves the §4 conflict in that branch's favour. **One character. Restore it before the merge.**

*Both §4 findings sit on a branch that is 5 commits behind canonical (§3) — so this conflict must be resolved against a tree that has already moved.*

## 5 · Priority order

Ordered by what blocks the most, not by size.

### P0 — blocks everything downstream

**① CI cannot execute.** Proven across all three trigger types (`workflow_dispatch` mine, `pull_request` and `push` theirs), two people, canonical and feature branches alike — 0 jobs or 0 steps, dead in 3–7 seconds. **79 commits are now pending merge with no independent verification available on the target runtime.** Every gate figure in this report was executed here on **Node 22**; CI uses **Node 24**.

*The fastest discriminator remains the annotation banner on any failed run page in the GitHub web UI — the REST endpoints do not expose it.*

**② ⏰ The 2026-09-09 waiver — 19 days.** Re-verified: `patched >=2.0.3`, `latest` still `2.0.2`, upstream has **not** shipped. Wait · extend (a recorded, deliberate weakening) · or accept red CI. **Doing nothing selects the third.**

### P1 — must be settled before any merge

**③ The `ops:deployment-sot-guard` collision** (§4). Cheap to fix now, expensive after a bad resolution lands.

**④ The release-branch topology** (§3). Decide whether it is *the* release or *a* stream, before anyone tags. **Tags remain 0 — this is still free to fix.**

**⑤ Rebase the three stale-base branches** (§3) onto canonical, and **close PR #4 as superseded** rather than merging it — merging it would regress the maps work that already landed via `5f44c86`.

### P2 — merge sequence, once ①–⑤ are settled

Order chosen to minimise conflict surface. Nine branches, merged in five waves:

1. **`audit/*` ×2, plus my own audit branch** — documentation only, **zero code files**, zero conflict risk. They also carry the forensic record the later merges should be read against.
2. **`fix/gate3-listing-moderation-authority`** — 2 files, 1 code file (a test), no overlap.
3. **`fix/car-header-unified-dock-v2`** — 2 code files, no overlap. *(Retire `fix/car-header-unified-dock` — the v1 — unmerged.)*
4. **`fix/recent-search-chrome`** — rebase first (8 behind), then merge alone; 5 code files.
5. **`fix/db-baseline-adoption`** — 18 commits, 8 code files, no overlap detected. Largest code change; **merge alone and verify.**
6. **`fix/deployment-sot-next`** and **`release/production-assembly`** — **last, and only after ③.** These are the only pair that share a file, and the first must be rebased before it is touched.

**Verify the full battery after each merge, not once at the end.** With CI down, a local run is the only signal, and batching merges would make a regression untraceable.

**Retire without merging:** `fix/maps-tile-failure-state-v2` (PR #4, superseded — would regress), both `ci/final-rc-*` (empty commits against stale heads), `fix/car-header-unified-dock` v1, `maint/safe-batch-01`.

### P3 — product work still open

Discover ×4 (1 of 5 done; blocked by two guards + a design ruling) · **H-3** block/mute — **must be built**, the search is closed · **G-2** Clerk host allowlist · the observability seam is still unguarded.

### P4 — owner decisions, zero code

**C-1** tags · **C-2** tile procurement · **M-4** `enterprise` **and** `company` — one decision, not two · **H-2** needs a `pk_live_` build to verify.

### P5 — documentation

CH-1/2/3 and the stale Maps document that names four **shipped** tools as missing.

### ⚫ Not closable by any audit

No native render · no real-browser WebView render · no live provider journey · no deployment rehearsal · no full-workspace lint on a green CI run. **Hardware, credentials, and a deployment window.**

---

## 6 · Standing verdict

**Source: healthy.** 245/245, 26/26, 124/124, 0 blocking, clean history, no manipulation detected in any batch to date, and eight prior findings closed with protection *increasing* (chain 242 → 245, render 120 → 124).

**Process: at risk.** Nine divergent branches, **101 unmerged commits**, three of them built on a canonical that has already moved, one unpinned collision plus a newline defect in the same file, a branch named `release` that is not one, a superseded PR that would regress canonical if merged, and **no working independent verification.**

**Production: `NO-GO`** — unchanged, and the reason is unchanged: the runtime has never been witnessed.

**One process observation, offered plainly:** the gap between nine parallel branches and zero integration is the largest risk in this report — larger than any single defect in it. Every day that gap widens, the merge cost rises and the value of every gate figure measured on a branch falls. **The source is in good shape; the assembly is not.**

---
*Intake by execution: all 14 branches carrying commits above canonical enumerated after a fresh `fetch --all --prune`, containment tested pairwise across 72 ordered pairs, merge bases computed, the collision traced to file presence and to the exact `package.json` lines on each side, gates run on canonical. This report's own first pass was wrong on the branch count and on ancestry; both are corrected above rather than overwritten. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
