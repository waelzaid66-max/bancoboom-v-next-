# VNX LINT-02 — Audited Dead Bindings

- Date: 2026-08-21
- Repository: `waelzaid66-max/bancoboom-v-next-`
- Branch: `canonical/vnext-assembly`
- Product commit: `875406e3a7b04f30b0e2d033a4e861562e068dd4`
- Rollback parent: `f1188fa6026d083006984145a542a9cc367b95cb`
- Scope: existing lint findings in `scripts`, API source/tests/seeds, and DB
  schema only; no API contract, query result, schema, migration, UI, CI,
  Docker, or deployment behavior changed

## Adjudication

VNX-LINT-01 left 27 warnings for independent review and identified one real
Dealer sort defect. VNX-DEALER-01 corrected that defect separately. The
remaining 18 findings were then reviewed at their use sites before deletion:

- unused imports in API services, DB schema, seeds, and DB tests;
- one unused seed helper;
- one deliberately omitted `userId` field renamed to document the omission;
- one unused exception binding in best-effort pruning;
- one stale ESLint suppression where URL construction is the validation side
  effect; and
- the unused `LeadService.column` lookup. The live interaction increment is
  already expressed explicitly in the following insert/upsert for every action
  type, so removing the lookup does not remove or redirect a counter update.

## Verification on the exact product tree

| Gate                                                                  | Result                                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `eslint scripts artifacts/api-server/src lib/db/src --max-warnings 0` | PASS; 0 errors / 0 warnings                                               |
| `eslint scripts --max-warnings 0`                                     | PASS                                                                      |
| Website/Landing lint with `--max-warnings 0`                          | PASS                                                                      |
| All 12 TypeScript project checks                                      | PASS                                                                      |
| API production build                                                  | PASS                                                                      |
| Admin / Dealer / Landing / Sandbox Vite builds                        | PASS; inherited source-map/chunk-size warnings remain                     |
| Expo Web export                                                       | PASS; 3,567 modules                                                       |
| Next production builds                                                | PASS; 46/46 and 48/48 pages                                               |
| Chain integrity                                                       | 245/245 PASS                                                              |
| Dependency security                                                   | 0 blocking; two Metro-only waivers expire 2026-09-09                      |
| `git diff --check`                                                    | PASS                                                                      |
| Literal root `npm run build`                                          | BLOCKED before script execution by the environment network-approval layer |
| Exact-SHA CI                                                          | Not certified; GitHub Actions billing lock remains an external blocker    |

## Newly measured lint-coverage gap

Admin, Dealer, Mobile, and Sandbox define no package lint scripts and are not
part of the root lint commands. A diagnostic direct ESLint run over their
application source (excluding vendored assets, build scripts/config, and tests)
reported 49 affected files, 51 errors, and 61 warnings:

| Workspace | Files | Errors | Warnings |
| --------- | ----: | -----: | -------: |
| Admin     |     6 |      4 |        8 |
| Mobile    |    34 |     47 |       29 |
| Dealer    |     8 |      0 |       23 |
| Sandbox   |     1 |      0 |        1 |

The largest error classes are 31 React Native/Expo `require()` asset imports
and 15 references to `react-hooks/exhaustive-deps` while
`eslint-plugin-react-hooks` is not installed/configured. A completely raw run
including vendored Leaflet and Node/CommonJS tooling reports 1,131 findings and
is not a meaningful application gate. The next lint-control batch must define
runtime-aware scopes and plugins before changing product code; it must not hide
the debt by ignoring whole workspaces.

## Decision

The official scripts/API/DB and Website/Landing lint scopes are clean and the
dead-binding cleanup is build-tested. **Full-monorepo lint remains OPEN** until
the four unconfigured workspaces have explicit, runtime-correct lint gates.
Production remains **NO-GO** under the independent database, CI, Docker,
Coolify, staging, provider, device, backup/restore, and rollback gates.

Run npm run build
