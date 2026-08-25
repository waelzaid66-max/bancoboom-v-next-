# BANCO vNEXT Monorepo Operating Contract — Reconciliation Hold

Repository `waelzaid66-max/bancoboom-v-next-` is the only active BANCO vNEXT
source repository. Historical repositories and branches remain read-only
comparison, provenance and rollback evidence. They are never wholesale merge,
build or deployment authorities.

## Current state — binding

`release/golden-vnext-20260825` is a preserved **comparison candidate**, not a
certified release and not yet the complete Product union. Do not deploy it, tag
it, submit EAS builds from it, point Coolify at it, or promote it while this hold
is active.

The previous statement that this candidate had only the FI account-entry defect
left was too strong and is superseded. Exact final-blob checks found accepted
Product semantics on PR #100 that are absent from the current candidate, while
other current-main files supersede PR #100. Therefore neither tree may replace
the other wholesale.

Relevant immutable comparison points:

| Role | Exact ref |
|---|---|
| Last repeatedly green stable control | `bancoboomstor@a3db5bd8c3edd060d35078aefeec709297abbad9` |
| Current broad Product tree | `main@5c330bb8ab332be207bc39d9375c7434fd0ac1dd` |
| Current P0 receiving candidate | `integration/p0-reconciliation-20260824@a4ea3a077c6d3f7354401085dab6f12a9d3b683a` |
| Preserved release-control comparison candidate | `release/golden-vnext-20260825` |

These refs are comparison inputs. None is automatically the final release base.
Age, branch name, commit count, report volume and a historical green badge do not
decide the winner.

## Directly proven current reconciliation facts

- `app/_layout.tsx` is byte-identical between current main and PR #100; its Auth
  session-handler integration is not missing from main.
- `MapPinPicker.tsx` is byte-identical between current main and PR #100.
- PR #100 `MessageOutboxContext.tsx` contains account-deletion terminal-purge
  fences on enqueue, queued persistence, retry and discard that current main and
  the preserved candidate do not contain byte-identically.
- PR #100 `custom-fetch.ts` captures auth-failure session/generation provenance
  before asynchronous token acquisition and rejects stale ACCOUNT_DELETED
  responses; current main and the preserved candidate do not contain that exact
  request snapshot.
- Current-main `SearchResultsMap.tsx` contains later generated-page source-epoch,
  stale-publication and cache-rotation authority beyond PR #100's earlier
  bootstrap-only implementation. Selecting PR #100 wholesale would regress it.
- Android notification-icon source and EAS release hardening exist on the
  preserved comparison candidate, but this does not make its Product tree
  complete.

## Required base-selection process

Before any Product repair, build a path-and-capability matrix across the exact
comparison refs. Every differing Product path must receive one classification:

- `BYTE_IDENTICAL`
- `CURRENT_SUPERSEDES`
- `RECEIVER_ONLY_ACCEPTED`
- `STABLE_ONLY_VALID`
- `REGRESSED_IN_CURRENT`
- `TEST_OR_AUDIT_ONLY`
- `UNKNOWN_RUNTIME`

For every non-identical Product path, trace the producer, persistence/API
boundary, mounted consumer, focused tests and later modifying authority. A Git
ancestry difference alone is not loss proof. A report or PR body alone is not
acceptance proof.

If necessary, construct two immutable candidates:

1. stable control plus only proven current-only deltas;
2. current receiver plus only proven stable-only/restoration deltas.

Run the same exact build, disposable-DB, Expo, mounted render, physical-device,
Maps, Messenger, header, provider and rollback matrix against both. Select the
smaller complete reproducibly green candidate. Do not combine by whole-branch
merge or full-file historical restore.

## Current Product and release lanes

The FI account-entry boundary is source-proven, but it is not the only open
Product/reconciliation item. It remains on Product hold until the lossless base
is selected and its RED contract is rebound to that exact SHA.

Other current evidence that must be reconciled rather than silently dropped
includes:

- account-deletion and Message Outbox terminal fencing;
- stale Auth request/session provenance;
- native and web Maps source-epoch/bootstrap behavior;
- CAR owner-visible header/dock completeness;
- map currency authority;
- privacy/account-deletion retention and post-tombstone writers;
- notification/outbox lifecycle and provider/device acceptance.

Separate Product-source defects from execution and release blockers. The
following are not permission for Product rewrites:

- live database identity and migration-data postconditions remain unverified;
- the only tag-triggered AWS workflow targets an unratified incomplete stack;
- Coolify, Clerk, storage, push/email, Paymob, DNS, EAS signing, store submission,
  backup/restore and physical-device journeys remain external/runtime gates;
- hosted CI badges without executed steps and logs are non-evidence.

## Session opening protocol

Before changing a file or interpreting a failure:

1. record repository, branch, exact HEAD and `git status --short --branch`;
2. confirm `pnpm --version` is exactly `11.9.0`;
3. run `pnpm run workspace:verify` from the one authoritative worktree;
4. read this hold and the newest binding coordination comment;
5. run `node scripts/guard-quality-audit.mjs` before believing a guard failure;
6. compare final trees and blobs, not only ancestry or report prose;
7. reproduce behavior before authorizing a Product change;
8. write `UNDETERMINED` when runtime or external evidence is missing.

## Writer and safety law

- No Product writer starts from the preserved golden branch while this hold is
  active.
- One bounded writer owns a shared host at a time.
- Never merge or cherry-pick an old branch wholesale.
- Never replace a current shared file with an old full-file blob.
- Shared manifests, generated contracts and package files require semantic union.
- Never force-push, reset, stash, delete branches or delete historical evidence.
- Never use a Replit-local tree as source authority.
- Never run production baseline/migrate, deploy, tag, submit stores, rotate
  secrets or alter external providers without exact-SHA acceptance and explicit
  Owner authorization.

## Release boundary

A final candidate exists only when one exact SHA has:

1. lossless semantic-union proof;
2. frozen install, workspace verification, whole-workspace typecheck and root
   build;
3. full Mobile and API suites on an isolated PostgreSQL lifecycle;
4. committed migration and data-postcondition proof;
5. Docker/Coolify image, readiness and public-origin smoke;
6. EAS Android/iOS build IDs tied to the same Git SHA;
7. physical-device owner journeys for headers, Maps, Messenger, accounts, media,
   notifications, AR/EN, RTL/LTR and navigation;
8. backup, restore and rollback evidence.

Anything not executed is `UNDETERMINED`. Production remains `NO-GO`.

Run npm run build only after an exact lossless candidate exists.
