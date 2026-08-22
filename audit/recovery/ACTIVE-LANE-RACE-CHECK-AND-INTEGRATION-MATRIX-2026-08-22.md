# ACTIVE LANE RACE-CHECK AND INTEGRATION MATRIX — 2026-08-22

## Authority snapshot

- Repository: `waelzaid66-max/bancoboom-v-next-`
- Canonical authority: `canonical/vnext-assembly`
- Race-check result at this audit point: `canonical/vnext-assembly` is IDENTICAL to `4f2c81cc553938e808a98adb84d00ecfc76732c5` (`ahead_by=0`, `behind_by=0`).
- This document is audit/integration evidence only. It authorizes no merge, deploy, canonical movement, or cross-lane source copy.
- Current source + owner chronology + Git ancestry + exact-SHA executable evidence outrank historical reports or prior PASS claims.

## Current active lane heads

| PR | Lane | Current head | Current authority / rule |
|---|---|---|---|
| #9 | Release / Deploy | `ed08d593d4c258f93ce8155d0c146230be79a4cc` | Only Release/Deploy integration authority. Do not absorb Product branches wholesale. |
| #12 | DB baseline adoption | `c9665e32cf80e9f83fa2f33868c0c1edb3e22792` | Frozen from production/prod-like execution. Requires isolated PostgreSQL proof before release use. |
| #13 | CAR header/dock | `3ee1f12a8f2405f816524c873b8aaf7b0f39c512` | Product writes frozen pending fresh reconciliation/exact-head execution. Historical PASS from earlier heads is not inherited. |
| #14 | Listings moderation | `526e45c4d9a28cb4661384a2bda3b00798bfa3e9` | RED authority matrix. Product repair must use true hunks and real codegen; generated clients must not be hand-edited. |
| #15 | Maps bootstrap | `1a2f301a6c97a169e1f1a0bf881ec09c0edf7379` | Verification/test-maintenance only. The new head is one commit beyond prior evidence head and requires fresh exact-head execution. |
| #16 | Discover polish | `67e2aad712d9b4d9b19f3e3bfef1e1bfc95380ce` | Verification-only visual candidate; preserve routes/testIDs/section isolation and current portal architecture. |
| #19 | Profile visible role | `8505850da8ad4fa3b98c41e964b9b66a63e4117b` | RED-only one-consumer defect. Future fix must consume existing DB-first computed role only. |
| #23 | Account deletion teardown | `dd06969745dc82e6137ce339e45324d3dbbc0bd8` | RED/preservation lane. Existing `purgingRef` is terminal authority; no second tombstone flag and no deletion-journey removal. |

Audit branches remain evidence lanes, not Product merge lanes:
- #10 `146282c7fde8bd63c4eba9e43b8ac949df044958` before this audit append.
- #11 `65d3c3fa40a37b884797bf6a64acef7458812b73`.

## Shared collision surfaces — semantic UNION required

### 1. Mobile aggregate test chain

`artifacts/banco-mobile/package.json` is currently a shared collision surface across active Product candidates.

Known additive scripts that must survive final accepted integration if their lanes are accepted:
- #13: `test:car-dock-zero-loss`
- #15: `test:map-bootstrap`
- #16: `test:discover-portals`

The integrated RC must preserve the existing canonical test chain including prior gates such as `test:language-sync` and `test:map-chrome`. Never resolve this file by taking one feature branch wholesale.

### 2. `SectionSearchApp.tsx`

#13 touches the historically conflict-sensitive shared host. CAR acceptance must prove no non-CAR behavior loss and no unrelated comment/format churn. No other lane may stack Product work on the dirty/unverified CAR head.

### 3. API contracts and generated clients

#14 future Product repair spans OpenAPI + server validators + generated clients. The codegen pipeline must execute; generated clients must not be manually patched. Any simultaneous API-contract lane must be reconciled semantically before RC assembly.

### 4. Database authority

#12 owns baseline-adoption Gate 1. `baseline`, migrations, `migrate`, and compatibility schema patches are integration-critical. No other lane may infer production adoption or remove compatibility authority from static source evidence alone.

### 5. Account teardown / Messenger outbox

#23 is bounded to terminal resume behavior. Preserve both deletion journeys, suspend/resume/purge APIs, push unregister, Clerk sign-out, routing, owner-bound outbox purge, and Messenger semantics. The existing `purgingRef` remains the single terminal authority.

### 6. Release manifests / image provenance

#9 owns release/deploy surfaces. Product branches do not edit deployment manifests. Release assembly must consume only accepted lane trees after end-of-work race-check and merged-state execution.

## Drift corrections recorded

### PR #15 body drift

The PR body still described `5c64486f65320ac3d45c2c9df233cd26c7e9b06e` as the current head with exactly four changed files. Current head is `1a2f301a6c97a169e1f1a0bf881ec09c0edf7379`; the additional delta is `artifacts/banco-mobile/tests/render-coverage-guard.test.mjs`, registering `SearchResultsMap` in the render-critical inventory.

This closes the previously recorded source-side inventory omission but does **not** inherit executable PASS from the old head. A correction was posted directly on PR #15. Current classification remains `SOURCE DELTA BOUNDED / EXACT-HEAD EXECUTION UNPROVEN / DO NOT MERGE`.

### PR #13 race

Current CAR head `3ee1f12a...` moved after prior evidence. Earlier exact-head PASS sets are historical only. Keep Product writes frozen until current final-tree reconciliation and exact-head execution are captured.

## Execution-environment truth

A local isolated clone attempt for #23 failed before checkout because the available container cannot resolve `github.com`. Therefore no local test/build PASS may be claimed from this environment. Product code was not modified from that failed attempt.

For #23, current source inspection confirms the RED defect: `resumeAfterAccountDeletionFailure()` clears `purgingRef.current` unconditionally before resuming scheduling. The accepted conceptual repair is bounded, but implementation should not be pushed from a non-executable environment unless the manager explicitly accepts source-only movement with execution still marked unproven.

## Integration acceptance rule

Before any lane is promoted:
1. Re-check canonical and every accepted lane head.
2. Review final-tree diff against the frozen canonical; reject unrelated churn.
3. Semantic-UNION all shared manifests/test chains/contracts.
4. Execute exact merged-state tests/builds on the immutable candidate.
5. Only then hand the candidate to Release/Deploy for staging/provider/device/rollback gates.

No PASS evidence from one SHA may be inherited by a later SHA.

Run npm run build
