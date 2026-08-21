# BANCO BOOM NEXT — Branch Forensic Ledger

**Audited canonical:** `canonical/vnext-assembly` @ `08222f0400273b6f1ddb44b4e152045aceae6665`  
**Production assembly:** `release/production-assembly-20260821`  
**Rule:** branch survival is not evidence of missing work. Git ancestry/current-source comparison decides whether a branch contains unique implementation.

## Canonical / accepted ancestry

Direct current comparisons show the accepted VNX line is already represented in canonical. Representative VNX-01, VNX-02, VNX-03 and VNX-04 branch tips are ancestors of current canonical (`behind_by = 0` when compared as the base to canonical). The manager reconciliation independently records the same result for VNX-05, VNX-06 and VNX-07 accepted heads. These recovery branches are provenance/rollback, not merge sources.

The following current branches are also behind-only relative to canonical and contain no unique head commits to promote:

- `codex/recovery-controls-vnx-gov-01-20260813`
- `codex/recovery-messenger-read-serialization-20260813`
- `fix/maps-tile-failure-state-20260821`
- `fix/nanoid-override`
- `fix/sot-lock-vnext-only-20260821`
- `recovery/coworker-maps-5f44c865-20260821`
- `recovery/source-bancoboomstor-a3db5bd8`
- `recovery/vnx-ops-01-root-build-scheduling`
- `recovery/vnx-ops-02-migration-operator-authority`

The historical source baseline `a3db5bd8` is 51 canonical commits behind and is never a deployment source.

## Diverged branches — evidence only / bounded reconstruction

### `fix/maps-tile-failure-state-v2-20260821`

Diverged from merge base `1ccdbacc`; current comparison reports unique old-branch deltas in `SearchResultsMap.tsx`, `SearchResultsMap.web.tsx`, a tile guard helper/test, and package test wiring. Do not merge wholesale. The current canonical already contains later MAPS-01 work; any still-valid bootstrap-error behavior must be reconstructed from the accepted final base with fresh tests.

### `fix/recent-search-chrome-20260821`

Diverged from `1ccdbacc`; contains `RecentSearchChips`, `recentSearchPolicy`, search-screen wiring and test-chain changes. Do not merge wholesale. Use only as forensic implementation evidence; reconstruct on the current accepted base while preserving current Saved Search/Discover ownership and all later test-chain additions.

### `maint/safe-batch-01`

History is diverged by one maintenance commit, but its two intended blobs (`mapHtml.ts` OSM attribution and `workspace-verify.mjs` origin handling) were already promoted exactly into canonical at `26b1fc0`. No branch merge is required.

### `audit/independent-production-audit-2026-08-11`

Diverged audit branch with 22 unique commits; the current delta is reports only. It is evidence/claim input, not executable source authority. Claims must be rechecked against current canonical before action.

### `ci/final-rc-26b1fc0-20260821` and `ci/final-rc-f45c32c-20260821`

Each has a unique zero-diff/CI-trigger commit against an older base. They are CI-history evidence, not Product code and not release candidates now.

### `fix/deployment-sot-next-20260821` / PR #8

Contains only the parallel Deployment SoT guard implementation and package command from base `3951c729`. PR #9 is the integration authority; its `ops:deployment-sot-guard` alias points to the single `release-sot-gate.mjs` implementation. Do not merge PR #8.

## Current canonical race reconciliation

During this audit canonical advanced from `3951c729` to `08222f04` with the bounded VNX-LINT declaration-policy correction. Production assembly PR #9 was reconciled by copying the exact two canonical blobs (`eslint.config.mjs` and `VNX-LINT-01-EXPRESS-DECLARATIONS-2026-08-21.md`) into the release branch, producing release head `77f725890f4d0c73db13de09cbe705aa22f8d617`. No historical branch merge was used.

## Merge rule

No old recovery/Codex/audit/RC branch is eligible for wholesale merge. New work starts from the latest accepted canonical/release candidate, reconstructs only a proven missing behavior, unions current tests/contracts, and records the exact resulting SHA.

Run `npm run build`.
