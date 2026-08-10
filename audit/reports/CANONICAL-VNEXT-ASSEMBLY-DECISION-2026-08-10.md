# BANCO Canonical vNext Assembly Decision

## Decision

`waelzaid66-max/bancoboom-v-next-` will be assembled from the exact verified
`bancoboomstor` baseline, not from a synthetic source copy and not from an older
repository tree.

- Source repository: `waelzaid66-max/bancoboomstor`
- Source commit: `a3db5bd8c3edd060d35078aefeec709297abbad9`
- Source root tree: `07c4393d40f7ecfd9bc401747696f40ade54b7b7`
- Target repository: `waelzaid66-max/bancoboom-v-next-`
- Assembly branch: `canonical/vnext-assembly`
- Local rollback ref: `recovery/source-bancoboomstor-a3db5bd8`
- Decision date: 2026-08-10 UTC

The source commit is retained as the rollback boundary. Every recovery batch
must be a reviewable descendant of that commit and must record its evidence,
security invariants, focused checks, and remaining runtime uncertainty.

## Evidence carried into vNext

The following ledgers are copied byte-for-byte from the forensic worktree and
are committed before product changes:

1. `FORENSIC-COMMIT-LEDGER-2026-08-10.md`
2. `CODEX-LAST-20-DAYS-RECOVERY-LEDGER-2026-08-10.md`
3. `MAPS-MESSENGER-FORENSIC-RECOVERY-LEDGER-2026-08-10.md`

These reports distinguish preserved source from runtime proof and explicitly
retain `UNPROVEN` where no recoverable Git object or live/device evidence exists.

## Assembly rules

1. No mass cherry-pick, whole-tree merge, or historical tree overwrite.
2. No rewrite of `SectionSearchApp.tsx`; inspect and change one capability at a
   time only when a reproducible failure exists.
3. A historical UI implementation cannot replace newer database, storage,
   authentication, payment, deployment, or security hardening.
4. Existing Maps source is the current verified superset. Maps requires runtime
   certification first; it must not be downgraded to an older tree.
5. The claimed advanced Messenger wave has no recoverable Git object in the
   collected corpus. Its absent capabilities are reconstruction work with new
   migrations and tests, not forensic cherry-picks.
6. Each product batch starts with a failing focused test and ends with focused
   checks, relevant typecheck, and the root `npm run build` gate.
7. PostgreSQL, Clerk, object storage, Paymob, Docker/Coolify, Android, and iOS
   remain `UNPROVEN` until exercised against the exact reported commit.
8. The workspace identity guard may accept exactly the production source remote
   and the authorized vNext remote. It must continue rejecting unrelated clones.

## Ordered recovery batches

| Batch | Scope | Starting evidence | Required outcome |
|---|---|---|---|
| VNX-00 | Provenance and rollback | `a3db5bd8`, three forensic ledgers | Exact source history preserved; no product delta |
| VNX-01 | Protection chain | Existing retired-red, import-honesty, and render guards | All applicable guards are reachable from the package test chain |
| VNX-02 | DB and security invariants | Current migrations, storage claims, private media, auth and payment hardening | Invariants locked before product reconstruction |
| VNX-03 | Messenger integrity | Current polling messenger plus missing-capability ledger | Idempotent send, durable client outbox, read cursor, block/mute; then realtime/typing and voice recording without weakening private media |
| VNX-04 | Discover recovery | Historical peak implementation and guard history | Restore recent, popular brands, saved, trending, and recently viewed without reintroducing rejected cross-domain architecture |
| VNX-05 | Five-section visibility | Header lineages and empty/error overlay evidence | Preserve identity/collapse while removing proven hidden-state failures |
| VNX-06 | Maps certification | Current preserved Maps superset | Web, Android, and iOS journeys certified; only observed runtime defects changed |
| VNX-07 | Remaining live systems | Accounts, KYC, storage, payments, financing, admin/dealer/web, CI and deployment ledgers | Targeted integration and live/staging evidence attached to exact commits |

## Per-batch provenance record

Every batch must record:

- source repository, branch, commit, tree/blob, and file path;
- whether the work is preserved, adapted historical code, or reconstructed;
- security and data invariants that must not regress;
- focused failing check before the change and exact result after it;
- root build result and all external/device gates still untested;
- the batch commit and its immediate rollback parent.

## Current GO / NO-GO

- **GO:** commit evidence-only VNX-00 and continue on
  `canonical/vnext-assembly` in bounded batches.
- **NO-GO:** deploy, merge the assembly branch to target `main`, claim runtime
  certification, or overwrite current Maps/Messenger code before their relevant
  verification gates exist.
