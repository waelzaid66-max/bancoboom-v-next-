# VNX-CI-02 — Actions Infrastructure State Quantified

## Decision

`VNX-CI-01` closed the reachability half of this defect on 2026-08-21 and
recorded the remaining half as unresolved infrastructure state. That diagnosis
is upheld without correction. This batch does not replace it and does not
propose a source, workflow, or configuration change: it converts a two-run
observation into a measured 347-run history, isolates the discriminator, and
names the one owner action that can clear it.

The authority this batch builds on, quoted from `VNX-CI-01`:

> Each run marked all seven jobs failed before a runner or job step started. The
> … is GitHub Actions infrastructure/account state, not evidence that seven
> product commands failed. The infrastructure cause remains unresolved until a
> new run starts a runner and exposes executable steps.

| Field | Evidence |
| --- | --- |
| Base | `1c18f08` on `main` |
| Product commit | None — measurement only, no product delta |
| Prior authority | `VNX-CI-01-CANONICAL-ACTIONS-2026-08-21.md` |
| Reachability fix | Present and correct: all three workflows declare `branches: [main, canonical/vnext-assembly]` |
| Trigger proof | The push to `main` at `c04e4d4` did create runs, so reachability is closed |
| Remaining fault | Runs are created and die before any step executes |
| Classification | `UNPROVEN` cause, measured extent; remedy is outside the repository |

## Reproduced defect

`ci.yml` run history read through the GitHub API rather than the Actions web
view, so each run's `event`, `conclusion`, and job timing could be compared
rather than eyeballed.

**347 runs. 19 successful. The last success is run #23 on 2026-08-14T19:01:56Z.
Every run since — 324 consecutive — has failed.**

The discriminator is not the branch, the workflow, or the commit. It is the
trigger:

| Trigger | Outcome |
| --- | --- |
| `workflow_dispatch` (manual) | All 19 successes. 2–3 minutes, real step execution |
| `push` / `pull_request` (automatic) | Fails in 4–6 seconds, zero steps, zero logs |

The latest run on `main` (`32737331738`, 7 jobs) records
`created 14:13:06 · started 14:13:06 · completed 14:13:09–10`. `get_job_logs`
returns `HTTP 404` for all seven job ids: there is no log because no step ran.
This reproduces `VNX-CI-01`'s "before a runner or job step started" exactly, ten
days and 324 runs later.

A workflow that never starts a runner cannot be repaired by editing the
workflow. No product or workflow change can close this.

## Candidate change

None in this repository. The remedy is an owner action in account settings.

1. Read `Settings → Billing → Actions` for a spending limit or an exhausted
   included-minutes quota.
2. Read `Settings → Actions → General` for a policy requiring approval on
   automatically-triggered runs.
3. Confirm in two minutes by dispatching `ci.yml` manually on `main` from the
   Actions tab. If the manual run executes steps while pushes continue to die in
   seconds, the fault is confined to the automatic trigger path and the
   workflows themselves are sound.

## Verification ledger

| Gate | Result |
| --- | --- |
| `ci.yml` total runs | 347 |
| `ci.yml` successful runs | 19 |
| Last successful run | #23, id `31831418894`, 2026-08-14T19:01:56Z |
| Consecutive failures since | 324 |
| Trigger of all 19 successes | `workflow_dispatch`, without exception |
| Latest `main` run jobs | 7 of 7 failed |
| Latest `main` run job timing | created, started and completed inside 4 seconds |
| Job log retrieval | `HTTP 404` on all seven job ids — no step produced output |
| Workflow trigger configuration | `branches: [main, canonical/vnext-assembly]` — `VNX-CI-01` holds |
| Chain integrity | 247/247 PASS |
| Production confidence | 26/26 PASS |
| Root TypeScript | PASS, exit 0 |
| Mobile guard packs | 42/42 PASS, each executed independently |
| API tests | 97 files, 533 passed, 0 failed |
| Root `pnpm run build` | PASS, exit 0 |
| Dependency security | 0 blocking; two Metro-only waivers expire 2026-09-09 |

Every row above is a local execution or a direct API read on 2026-08-24, and
every one was re-executed after this document was drafted rather than quoted
from an earlier run.

The local PostgreSQL instance stopped twice while this ledger was being
produced, both times under the full battery, and returned `ECONNREFUSED` mid-run
with a stale pid file. Each time it was restarted and the affected gate re-run to
completion. The two interrupted runs are not counted as results. This is
recorded because an agent that reads a partial suite as a pass is the same
failure class this batch is about.

## Explicitly unproven

- **The cause.** Spending limit and approval policy are both consistent with the
  manual/automatic split, and neither is confirmed. Billing is not readable
  through the tooling available to this agent. The cause stays `UNPROVEN` until
  the owner reads the two settings pages named above.
- **Every gate in the ledger above is local.** Local execution is sufficient for
  source adjudication and insufficient for release. It is not a substitute for
  the external gates in `CANONICAL-PRODUCTION-GATE-MATRIX.md`.
- **No claim is made that product commands would pass in CI.** They have not run
  there since 2026-08-14. A local pass predicts a CI pass; it does not prove one.

## Carry-forward findings

- No `VNX-*` batch dated after 2026-08-14 can cite a CI run as evidence, because
  none exists. The 17 CI run ids cited across `audit/recovery/` all fall between
  2026-08-10 and 2026-08-13 — inside the working window.
- This is the mechanical reason `CODEX-RECOVERY-BACKLOG.md` carries 12
  `UNPROVEN` entries whose remaining gate is runtime proof. The instrument that
  would produce that proof has not executed in ten days. Restoring Actions
  unblocks those 12 entries at once — not because their code changes, but
  because evidence becomes obtainable.
- Attribution: the infrastructure cause was identified on 2026-08-21 in
  `VNX-CI-01`, not on 2026-08-24. This batch contributes extent and the trigger
  discriminator only.
- The trigger discriminator is the load-bearing observation. Manual runs
  succeeding rules out the workflow YAML, the runner image, the product
  commands, and the branch configuration — all shared between the two paths.
- `deploy.yml` triggers on `v*.*.*` tags only and the repository carries zero
  tags, so the deployment path has never executed. Separate boundary, not a
  symptom of this fault.
- A green local battery standing beside 324 red CI runs is the exact condition
  under which a team stops reading its own signal. That cost is already paid and
  is not recoverable by any change to the code.

## Release boundary

This batch closes nothing in source and adds no product delta.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale, Clerk, storage, Paymob, push/email delivery,
Docker/Coolify runtime, backup/restore, rollback, EAS signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.
