# VNX CI-01 — Canonical GitHub Actions Reachability

- Date: 2026-08-21
- Repository: `waelzaid66-max/bancoboom-v-next-`
- Branch: `canonical/vnext-assembly`
- Rollback parent: `80519434dd04c67a8df03f6f5085bcf72f904336`
- Candidate state: commit and push authorized; the exact batch SHA is the commit
  that adds this report; not tagged or deployed

## Reproduced defect

All three verification workflows accepted pushes only to `main`. The canonical
production-candidate branch therefore published MAPS-01 and LANG-01 without
creating a workflow run. Manual dispatch existed, but was not an automatic
release control.

A pre-change executable assertion inspected the Core, Website, and Website
Docker workflows and failed `0/3`: none included
`canonical/vnext-assembly` in its push branches.

## GitHub investigation

Two earlier zero-diff pull requests tried to work around the missing canonical
push trigger:

- PR #2, run `32418481824`, exact head `d69e08d07b45d7b04adadca2e3e30826f8d9efe7`
- PR #3, run `32419090115`, exact head `d4f928e08c779b393d60cab17e47141a4943e40b`

Each run marked all seven jobs failed before a runner or job step started. The
jobs expose no steps or logs, and the log endpoint returns `BlobNotFound`. This
is GitHub Actions infrastructure/account state, not evidence that seven product
commands failed. The infrastructure cause remains unresolved until a new run
starts a runner and exposes executable steps.

## Candidate change

1. Run Core CI automatically on pushes to both `main` and
   `canonical/vnext-assembly`.
2. Apply the same canonical push reachability to the path-filtered Website and
   Website Docker workflows.
3. Keep production deployment tag/manual-only; `deploy.yml` is unchanged.
4. Add three chain-integrity assertions so canonical CI reachability cannot
   silently regress.

## Candidate verification

| Gate                                        | Result                                         |
| ------------------------------------------- | ---------------------------------------------- |
| Canonical workflow push assertion           | 3/3 PASS after expected 0/3 pre-change failure |
| Chain integrity                             | 245/245 PASS                                   |
| Changed-file ESLint                         | PASS with zero warnings                        |
| Workflow/report formatting and YAML parsing | PASS via Prettier                              |
| `git diff --check`                          | PASS                                           |

## Independent base audit

The following was executed on rollback parent `80519434` before this CI-only
change:

| Gate                                    | Result                                               |
| --------------------------------------- | ---------------------------------------------------- |
| Workspace identity, exact `pnpm@11.9.0` | PASS; one clean worktree                             |
| Mobile Node/contract                    | 390/390 PASS                                         |
| Mobile render                           | 124/124 PASS across 17 suites                        |
| TypeScript                              | PASS for root libraries and every shipped artifact   |
| Chain integrity                         | 242/242 PASS                                         |
| Dependency security                     | 0 blocking; two Metro-only waivers expire 2026-09-09 |
| API server esbuild                      | PASS                                                 |
| Vite builds                             | PASS; Admin, Dealer, Landing, Sandbox                |
| Expo Web export                         | PASS; 3,567 modules                                  |
| Next builds                             | PASS; 46/46 and 48/48 pages                          |
| Root scripts lint                       | PASS                                                 |
| Website lint                            | PASS                                                 |

The literal root `npm run build` launcher was rejected before process start by
the execution environment's network-approval layer. Its shipped constituent
typechecks and production builds above were executed directly and passed. This
is not recorded as a literal root-command pass.

## Audit findings carried forward

- `CANONICAL-PRODUCTION-GATE-MATRIX.md` still describes VNX-07B as not
  canonical even though `2e659bb` is an ancestor of current canonical. MAPS-01,
  LANG-01, and the current head also need one control-ledger reconciliation.
- `projects/banco-status` is an isolated legacy Replit project outside the pnpm
  workspace. It has no lockfile, retains the historical repository URL, and
  cannot be inferred as built by the root gate. Its product/deployment ownership
  requires a separate decision; it was not pulled into this CI wave.
- The broad API/DB lint report contains two `no-namespace` errors on legitimate
  Express declaration augmentation and 27 warnings. Root scripts lint and
  website lint pass, but full final-RC workspace lint remains open.
- PostgreSQL snapshot adoption, live Clerk, object storage, Paymob, Maps
  provider/device runtime, Docker/Coolify staging, backup/restore, rollback, EAS,
  Android, and iOS remain unverified on the candidate.

## Release boundary

This batch restores automatic CI reachability for the canonical assembly. It
does not prove that GitHub can allocate runners, and it does not authorize a
tag, deployment, `main` update, database write, or production-ready claim.
Production remains NO-GO until the new immutable SHA produces executable GitHub
jobs and all external gates pass.

Run npm run build
