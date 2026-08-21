# 🔴 URGENT — CI is not executing, and it is not a code failure

Discovered during the acceptance follow-up. **Every CI run since 2026-08-14 has failed without running a single line of code.** This corrects my own acceptance audit and explains failures the team may currently be attributing to their work.

Measured **2026-08-21 05:55 UTC** against `canonical/vnext-assembly @ 5f44c86`.

---

## 1 · The finding

Eight consecutive runs, all `completed/failure`:

```
2026-08-20T23:19:10Z  fix/recent-search-chrome-20260821       ddd464bb  failure
2026-08-20T22:55:20Z  fix/maps-tile-failure-state-v2          2892be4c  failure
2026-08-20T22:54:01Z  fix/maps-tile-failure-state-v2          3b09cdb0  failure
2026-08-20T22:51:48Z  fix/maps-tile-failure-state-v2          0b27066a  failure
2026-08-20T22:51:20Z  fix/maps-tile-failure-state-v2          fac9b499  failure
2026-08-20T21:56:44Z  fix/maps-tile-failure-state-v2          0ede1886  failure
2026-08-20T21:22:43Z  ci/final-rc-26b1fc0-20260821            d4f928e0  failure
2026-08-20T21:15:36Z  ci/final-rc-f45c32c-20260821            d69e08d0  failure
```

**Last successful run: `2026-08-14T19:01:56Z`** on `fix/nanoid-override` @ `76f7f26` — 7/7 green. Everything after it has failed.

## 2 · Why this is infrastructure, not code — four independent proofs

**Proof 1 · All seven jobs fail together, including the trivial one.** `GCP config gate` does a file-path check and previously completed in ~6 seconds. It fails alongside `API tests (Postgres)` and `Mobile bundle`. A code defect does not fail a path-existence check and a Metro bundle simultaneously.

**Proof 2 · Zero steps executed.**

```
run 32428147172 → 7 jobs, all 7 with zero steps, first job lasted 3 seconds
run 32427518896 → 0 jobs
run 32426090363 → 0 jobs
```

A job with **zero steps** never reached `Set up job`. Nothing was checked out, nothing installed, nothing run. **No code was executed in any of these runs.**

**Proof 3 · A six-hour queue delay, then instant failure.** Run `32428147172` was created `2026-08-20T23:19:10Z`; its first job started `2026-08-21T05:23:18Z` and finished at `05:23:21Z`. Six hours queued, three seconds alive. That is the signature of a job waiting for a runner it never gets.

**Proof 4 · Nothing changed on our side.**

| Check | Result |
|---|---|
| `.github/workflows/` changed since the last green run (`76f7f26`)? | **No** — diff is empty |
| Repository private? | **No** — public |
| Repository archived or disabled? | **No** to both |

**Same workflow, same settings, same repository. Green on 2026-08-14, dead since.**

## 3 · What this means — three consequences

**① The current manager's batches have never actually been CI-verified, and the red is not theirs.** All five runs on `fix/maps-tile-failure-state-v2` and the one on `fix/recent-search-chrome` failed at the platform layer. If anyone has been debugging their code against these failures, that effort is being spent on a phantom.

**② My acceptance criterion #5 is currently unachievable — and my framing of it was wrong.** I wrote *"cut the RC last"* and treated the missing artifact as a process slip. **It is not.** Both RC branches were cut and dispatched, and both were killed by the platform. **Re-pointing the RC at `5f44c86` will not produce a green run today.** That correction matters: the previous instruction sent the team at a problem they cannot fix.

**③ Local gate verification is currently the only verification that exists.** Everything I certified on `5f44c86` — security 0 blocking, chain 242/242, confidence 26/26, render 121/121, root build, ESLint — was executed in this sandbox on Node 22. **CI runs Node 24.** Until Actions executes again, no independent confirmation on the target runtime exists for any commit after `76f7f26`.

## 4 · What I cannot determine from here

**The exact cause requires account-level access I do not have.** What I can state:

- It is **not** the workflow file, **not** repository settings, and **not** the code.
- It is at **account or platform level.**

The candidates, in order of likelihood for this signature:

1. **An Actions spending limit or billing condition on the account.** This is the most common cause of jobs queueing then dying with zero steps. *Note:* public repositories normally receive free standard-runner minutes, which makes this less obvious — but a spending limit set to zero, an expired payment method, or an account-level restriction still produces exactly this.
2. **Actions disabled or restricted at the account/organisation level** — this would not show as `disabled` on the repository object, which reports `false`.
3. **A GitHub-side incident or runner shortage** — less likely given it has persisted across six days and thirty-plus runs.

**Owner action required:** check **GitHub → Settings → Billing and plans → Actions** for a spending limit or payment issue, and **Settings → Actions → General** at the account level for a restriction. Then re-dispatch one run and confirm jobs reach `Set up job`.

## 5 · Correction to my own reports

My acceptance audit (`ACCEPTANCE-AUDIT-5f44c86-2026-08-21.md`, §6 item 5 and §7 direction 1) states that no exact-SHA CI artifact exists because *"two RCs in a row were cut before the head settled"* and directs the team to *"cut the RC last."*

**That diagnosis was wrong.** The RCs were cut and dispatched correctly; they died at the platform layer. The direction, while harmless as general practice, pointed at the wrong cause and would have wasted the team's time.

**Corrected direction: do not re-cut or re-dispatch anything until Actions executes again.** Verify with one cheap dispatch that jobs reach `Set up job`, then cut the RC at the final head.

I found this only because I checked the run history rather than assuming the artifact was simply missing. **Recorded so this audit is weighed rather than trusted** — it is the third correction I have had to make to my own record in this engagement.

## 6 · Revised acceptance position

| Criterion | Status |
|---|---|
| Static gates green on one SHA | ✅ verified locally on `5f44c86` |
| No blocking advisory | ✅ 0 blocking |
| No guard weakened, no frozen surface disturbed | ✅ verified |
| **Exact-SHA CI on the head** | 🔴 **blocked by the platform — not by the team** |
| Native / WebView render, live providers, deployment rehearsal, full lint | ❌ unchanged |
| 2026-09-09 waiver decision | ⏰ **19 days** |

**Production remains `NO-GO`.** The source position is unchanged and good; what changed is that the **independent verification channel is down**, and that is now the single highest-priority blocker — above every product gap, because without it nothing can be certified on the target runtime.

---
*Diagnosis executed against the GitHub Actions API and the repository state. No file modified; nothing pushed to `canonical/vnext-assembly`.*
