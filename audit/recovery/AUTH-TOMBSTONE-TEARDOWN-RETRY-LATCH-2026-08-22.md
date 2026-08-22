# AUTH — Tombstoned Account Teardown Retry Latch Gap

Audited: 2026-08-22 Cairo

## Authority snapshot

- Repository: `waelzaid66-max/bancoboom-v-next-`
- Canonical audited source: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
- Audit authority only: PR #10 `audit/current-truth-20260821`
- Related but separate bounded lane: PR #23 account-deletion outbox terminal-state repair

This report changes no Product/API/DB/Mobile/Release runtime source.

## Confirmed shared mechanism

`lib/api-client-react/src/custom-fetch.ts` owns a module-level tombstone notification latch:

- `_accountDeletedSignOutScheduled` starts false;
- a `401` carrying `ACCOUNT_DELETED` sets the latch true before invoking the registered auth-failure handler;
- while the latch is true, later `ACCOUNT_DELETED` responses do not invoke the handler again;
- the latch is reset only when the handler is removed (`setAuthFailureHandler(null)`) or when the handler throws synchronously during invocation.

The handler type is currently synchronous (`(...) => void`), while client handlers typically start asynchronous Clerk teardown and swallow `signOut()` failure.

## Affected current consumers

### Mobile
`artifacts/banco-mobile/app/_layout.tsx` registers an `ACCOUNT_DELETED` handler that asynchronously:

1. calls `prepareForSignOut()`;
2. unregisters cached push token best-effort;
3. runs `await signOut().catch(() => {})`.

The callback itself returns immediately after scheduling the async task. A later Clerk sign-out rejection is swallowed and therefore cannot re-arm the latch.

### Dealer OS
`artifacts/dealer-os/src/App.tsx` registers:

`void signOut().catch(() => {})`

under the same `ACCOUNT_DELETED` handler contract.

### Admin OS
`artifacts/admin-os/src/App.tsx` uses the same one-shot pattern.

### banco-web
`artifacts/banco-web/components/ClerkAppProvider.tsx` uses the same one-shot pattern.

### banco-website
`artifacts/banco-website/components/ClerkAppProvider.tsx` uses the same one-shot pattern.

## Failure mode

1. API correctly reports tombstoned account: `401 ACCOUNT_DELETED`.
2. `custom-fetch` sets `_accountDeletedSignOutScheduled = true`.
3. client handler starts Clerk `signOut()` asynchronously.
4. Clerk/network teardown fails transiently.
5. error is swallowed by `.catch(() => {})` inside the async operation.
6. the synchronous handler invocation already returned successfully, so `custom-fetch` never resets the latch.
7. the Clerk session may remain locally active.
8. later API calls continue returning `401 ACCOUNT_DELETED`, but the auth-failure handler is suppressed forever for that mounted module instance.

This defeats the comment/contract that tombstoned users cannot remain stuck in a lingering Clerk session.

## Relationship to PR #23

PR #23's minimal `purgingRef` guard is still required and correctly scoped. It prevents a post-delete cleanup failure from reopening the durable Messenger outbox after confirmed server deletion.

It does **not** fix this shared auth-failure retry latch and must not be expanded into a cross-client rewrite without explicit manager rebinding.

After the #23 outbox repair, the accurate classification is:

`ACCOUNT DELETE OUTBOX TERMINALITY: source repair candidate / separate tombstone-session retry gap OPEN`.

## Bounded future repair contract

A separate auth-lifecycle unit should guarantee all of the following without creating per-app competing state machines:

1. `ACCOUNT_DELETED` teardown remains deduplicated while one teardown attempt is genuinely in flight.
2. successful teardown stays one-shot/idempotent.
3. failed asynchronous teardown re-arms retry eligibility after a bounded failure outcome; later `ACCOUNT_DELETED` responses can retry.
4. no retry may resume a tombstoned MessageOutbox.
5. mobile still orders tombstone cleanup safely: outbox terminal purge/suspend -> push unregister best-effort -> Clerk local session teardown.
6. web/admin/dealer/website clients share the same retry semantics rather than each inventing a timer/latch.
7. no infinite sign-out loop on a permanent Clerk outage: use bounded retry/backoff or future 401-triggered retry with observability.
8. add executable tests that simulate: first `ACCOUNT_DELETED`, async signOut failure, second `ACCOUNT_DELETED`, retry handler invocation, then successful teardown.

A clean design likely requires the shared auth-failure contract to acknowledge asynchronous completion/failure rather than treating fire-and-forget callback invocation as success. Exact implementation remains for the owning Product/auth lane after reconciliation.

## Additional Settings residual

Both mobile account-deletion flows currently wrap confirmed server deletion and later Clerk sign-out/routing inside one outer catch. If server deletion succeeds but Clerk `signOut()` fails, the UI still reports deletion failure although the account is already deleted. PR #23 can close outbox resurrection without fixing this user-visible/session-finalization misclassification.

Track this separately from the data-integrity repair; do not undo the terminal outbox guard to make the UI appear retryable.

## Execution truth

No executable PASS is claimed. Current hosted CI evidence remains insufficient where job steps/logs are absent.

Run npm run build
