# VNX-OPS-01 — Root Build Scheduling

## Decision

The root production build now serializes workspace builds with pnpm 11.9.0.
This is a bounded build-control repair, not a product change. It addresses the
reproduced `ENOTEMPTY` failure in Next export cleanup without broadening the
allowlisted cleanup or deleting complete `.next` directories.

The specific parallel-export regression is `TESTED`. Universal build
repeatability and a clean release-candidate build remain `UNPROVEN` until the
final production gate because one later local repeat stalled once inside Next
compilation and could not be reproduced by an immediate isolated build.

## Provenance

| Field | Evidence |
|---|---|
| Repository | `waelzaid66-max/bancoboom-v-next-` |
| Branch | `canonical/vnext-assembly` |
| Base | `e49299ca5f6097ebdffc40e7f73f2f82d01642f9` |
| Repair commit | `d6b42b5542837ae502febc3a7425efc68241b4ac` |
| Repair tree | `93b6427a126e1b751956d28f40a96a759b833e24` |
| Files | root `package.json`; `scripts/chain-integrity-gate.mjs` |
| Historical lead | `f61cb9528b3590a04e0c68dacc4faefa98bee865`; `audit/reports/WAVE1-SECURITY-CI-VALIDATION-2026-08-09.md` |

## Reproduction and adjudication

The inherited root script used pnpm recursive concurrency 4. Two literal root
build attempts from the Property-candidate worktree failed after successful
typechecks and other workspace builds:

- `banco-web/.next/export/_next`: `ENOTEMPTY` during `rmdir`;
- `banco-web/.next/export`: `ENOTEMPTY` during `rmdir`.

The same `banco-web` prebuild/build completed alone with 46/46 pages, and
`pnpm -r --workspace-concurrency=1 --if-present run build` completed all 17
build-bearing workspaces, including `banco-web` 46/46 and `banco-website`
48/48. pnpm 11.9.0 documents `--workspace-concurrency` as the recursive worker
limit; the default is 4. This isolates the reproducible failure to parallel
workspace scheduling rather than Property, TypeScript, or a missing source
implementation.

The repair changes only the root command to:

```text
pnpm run typecheck && pnpm -r --workspace-concurrency=1 --if-present run build
```

The existing per-Next allowlisted `prepare-next-build.mjs` remains unchanged.

## Verification ledger

| SHA / tree under test | Command | Workspace | Test type | Result |
|---|---|---|---|---|
| `e49299c` plus Property test-only candidate | `npm run build` | root | Production build / reproduction | **EXPECTED FAIL** twice: `ENOTEMPTY` in `artifacts/banco-web/.next/export*` |
| same candidate | `pnpm run prebuild` then `pnpm run build` | `artifacts/banco-web` | Isolated Next build | **PASS**, 46/46 pages |
| same candidate | `pnpm -r --workspace-concurrency=1 --if-present run build` | root | Diagnostic workspace build | **PASS**, 17/18 projects; both Next surfaces PASS |
| pre-repair assertion | `node scripts/chain-integrity-gate.mjs` | root | Static protection | **EXPECTED FAIL**, 241/242; only `P-root-build-serial-workspaces` failed |
| repair candidate | `node scripts/chain-integrity-gate.mjs` | root | Static protection | **PASS**, 242/242 |
| repair candidate with Property test-only files present | `npm run build` | root | Full production build | **PASS**: workspace verify, all typechecks, API/Expo/Vite/Next builds; web 46/46, website 48/48 |
| same candidate, immediate local repeat | `npm run build` | root | Repeatability probe | **INCONCLUSIVE/INTERRUPTED**: stalled once inside `banco-web` Next compilation for more than five minutes; interrupted with exit 130; no `ENOTEMPTY` |
| same filesystem immediately after interruption | `pnpm --filter @workspace/banco-web run build` | root → `banco-web` | Isolated Next retry | **PASS**, 46/46 pages |
| exact `d6b42b5` | GitHub Actions `31403501605` | Ubuntu CI + PostgreSQL 16 | CI / integration | **PASS**, all 7 jobs; API 90 files/499 tests passed, 1 file/3 tests skipped |

CI's static production-gate job executed the exact scheduling assertion. Its
build job is not a substitute for the literal root build because that job
builds a scoped workspace subset. The local literal root build is therefore
recorded separately and the final clean exact-SHA root build remains blocking.

## Open production gates

- Fresh clone plus frozen install and two bounded literal root builds on the
  final release SHA.
- Root-build timeout/diagnostic capture if the isolated Next stall recurs.
- All Docker image, Compose, Coolify staging, provider, physical-device,
  backup/restore, and rollback gates in
  `CANONICAL-PRODUCTION-GATE-MATRIX.md`.

No application, API, schema, migration, security, deployment topology, or
runtime behavior changed in this micro-batch.
