# PR #23 — Account deletion terminal-state ownership — 2026-08-22

Repository: `waelzaid66-max/bancoboom-v-next-`
Base: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
Lane: Accounts teardown only
Decision: `RED / PRODUCT FIX NOT YET APPLIED / NO MERGE`

## Current-source proof

Both delete journeys in `artifacts/banco-mobile/app/settings.tsx` currently do:

1. `suspendForAccountDeletion()`;
2. `deleteAccount()`;
3. `purgeAfterAccountDeletion()`;
4. push-token unregister;
5. Clerk `signOut()`;
6. router replacement;
7. one outer catch that calls `resumeAfterAccountDeletionFailure()`.

Therefore a failure after server deletion has already succeeded can still hit the resume path.

## Existing authority that must be preserved

`MessageOutboxContext` already has one terminal/purge authority:

- `prepareForSignOut()` sets `purgingRef.current = true` before durable owner purge;
- `purgeAfterAccountDeletion` is an alias of `prepareForSignOut`;
- `suspendForAccountDeletion()` suspends processing before the delete request;
- `resumeAfterAccountDeletionFailure()` is needed when the delete request itself fails.

Do not add a second account-deleted/tombstone ref. Do not delete suspend/resume/purge. Do not remove push unregister, Clerk sign-out, routing, password verification, SSO fallback, or either deletion journey.

## Minimal accepted Product repair

Harden `resumeAfterAccountDeletionFailure()` so it refuses to resume when `purgingRef.current` is already true.

Why this boundary is correct:

- before `deleteAccount()` succeeds, `suspendForAccountDeletion()` does **not** set `purgingRef`; API failure therefore remains resumable;
- after `deleteAccount()` succeeds, both existing journeys call `purgeAfterAccountDeletion()` before Clerk sign-out; that existing authority sets `purgingRef = true` before storage cleanup starts;
- if purge storage, push unregister, Clerk sign-out, or routing later fails, the existing outer catch may still execute, but resume becomes a safe no-op for the already terminal account;
- this preserves the current UI/content flows and avoids duplicating delete logic in `settings.tsx`.

## Required verification

- `account-deletion-terminal-state-guard.test.mjs` GREEN;
- `account-deletion-preservation-guard.test.mjs` GREEN;
- existing `messenger-wiring-guard.test.mjs` GREEN unchanged in semantics;
- mobile typecheck/build on exact final SHA;
- final diff must touch only the terminal resume boundary plus tests/audit unless contrary evidence appears.

No API, DB, schema, generated client, Maps, Search, listing, deployment or message payload changes are authorized in this lane.

Run npm run build
