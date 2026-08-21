# Intake and priority order — `canonical @ 4f2c81c`

Full intake of all agent work, reports and plans, followed by a precise priority order. Executed **2026-08-21 18:15 UTC**.

**Headline: canonical is healthy and every gate passes. But six divergent branches now hold 79 commits, the branch named `release` contains none of the other five, and two of them collide on a script name that no guard pins.**

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

**Pending branches, by weight:**

| Branch | Commits above canonical | Code files touched |
|---|---|---|
| `release/production-assembly-20260821` | **34** | 18 |
| `fix/db-baseline-adoption-20260821` | **18** | 9 |
| `audit/current-truth-20260821` | 11 | docs only |
| `audit/cross-repo-continuation-20260821` | 10 | docs only |
| `fix/car-header-unified-dock-v2-20260821` | 4 | 2 |
| `fix/deployment-sot-next-20260821` | 2 | 21 |
| `fix/maps-bootstrap-error-20260821` | **0** — merged | — |

**79 commits are outstanding across six live branches.**

## 3 · 🟠 Structural finding — the topology is divergent, not stacked

canonical **is** an ancestor of every branch, so all six build on the same base. **But no branch contains any other:**

```
release/production-assembly  ⊅  audit/current-truth
                             ⊅  audit/cross-repo-continuation
                             ⊅  fix/db-baseline-adoption
                             ⊅  fix/car-header-unified-dock-v2
                             ⊅  fix/deployment-sot-next
```

**The branch named `release/production-assembly` holds 34 commits and excludes the other 45.** That name reads as "the assembled release candidate." It is not one — it is one work-stream among six.

**Risk, stated plainly:** anyone treating that branch as the release, or tagging from it, ships without the baseline-adoption work (18 commits), the car-header work, the deployment SOT work, and both audit trails. Nothing currently prevents that; **tags are still 0**, so the mistake has not been made.

**Recommendation:** either rename it to its actual scope, or make it a genuine integration branch by merging the others into it. **Do not tag from it in its current state.**

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

## 5 · Priority order

Ordered by what blocks the most, not by size.

### P0 — blocks everything downstream

**① CI cannot execute.** Proven across all three trigger types (`workflow_dispatch` mine, `pull_request` and `push` theirs), two people, canonical and feature branches alike — 0 jobs or 0 steps, dead in 3–7 seconds. **79 commits are now pending merge with no independent verification available on the target runtime.** Every gate figure in this report was executed here on **Node 22**; CI uses **Node 24**.

*The fastest discriminator remains the annotation banner on any failed run page in the GitHub web UI — the REST endpoints do not expose it.*

**② ⏰ The 2026-09-09 waiver — 19 days.** Re-verified: `patched >=2.0.3`, `latest` still `2.0.2`, upstream has **not** shipped. Wait · extend (a recorded, deliberate weakening) · or accept red CI. **Doing nothing selects the third.**

### P1 — must be settled before any merge

**③ The `ops:deployment-sot-guard` collision** (§4). Cheap to fix now, expensive after a bad resolution lands.

**④ The release-branch topology** (§3). Decide whether it is *the* release or *a* stream, before anyone tags. **Tags remain 0 — this is still free to fix.**

### P2 — merge sequence, once ①–④ are settled

Order chosen to minimise conflict surface:

1. **`audit/*` branches first** — documentation only, zero code, zero conflict risk. They also carry the forensic record the later merges should be read against.
2. **`fix/car-header-unified-dock-v2`** — 2 code files, no overlap with anything.
3. **`fix/db-baseline-adoption`** — 18 commits, 9 files, no overlap detected. Largest code change; merge alone and verify.
4. **`fix/deployment-sot-next`** and **`release/production-assembly`** — **last, and only after ③.** These are the only pair that share a file.

**Verify the full battery after each merge, not once at the end.** With CI down, a local run is the only signal, and batching merges would make a regression untraceable.

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

**Process: at risk.** Six divergent branches, 79 unmerged commits, one unpinned collision, a branch named `release` that is not one, and **no working independent verification.**

**Production: `NO-GO`** — unchanged, and the reason is unchanged: the runtime has never been witnessed.

---
*Intake by execution: branches enumerated, topology computed, the collision traced to file presence on each side, gates run on canonical. No file modified; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
