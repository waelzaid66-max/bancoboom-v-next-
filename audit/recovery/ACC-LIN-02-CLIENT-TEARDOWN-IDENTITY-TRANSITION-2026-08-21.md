# ACC-LIN-02 — Client Teardown & Identity Transition — 2026-08-21

**Base:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Mode:** forensic only; no Product edit in this branch.  
**Scope:** `ACCOUNT_DELETED` / explicit sign-out / account deletion → API auth-failure handler → Messenger outbox abort/sanitize → push unregister → React Query cache teardown → Clerk sign-out → cold restart / second account.

## 1. Current transition matrix

| Edge | CURRENT classification | Exact source evidence |
|---|---|---|
| API tombstone rejection → client teardown | `PRESENT/GUARDED` | `custom-fetch.ts` only invokes the auth-failure handler for `401` + `ACCOUNT_DELETED`; one-shot latch `_accountDeletedSignOutScheduled` prevents repeated teardown storms. |
| Root tombstone handler ordering | `PRESENT` | `_layout.tsx`: `prepareForSignOut()` → `unregisterCachedPushTokenBestEffort()` → Clerk `signOut()`. Tombstoned account still signs out even if outbox purge or push unregister fails. |
| Explicit manual sign-out | `PRESENT/FAIL-CLOSED FOR OUTBOX` | `settings.tsx`: `prepareForSignOut()` must succeed before push unregister + Clerk signOut. On outbox cleanup failure, `resumeAfterSignOutFailure()` runs and sign-out is aborted with user-visible error. |
| Outbox pre-signout fence | `PRESENT/VNX-HARDENED` | `prepareForSignOut()` sets `purgingRef` + `suspendedRef`, advances generation, clears timers, aborts active transport, waits active flush, then sanitizes/removes owner storage. |
| Account deletion pre-API suspension | `PRESENT` | `suspendForAccountDeletion()` suspends + advances generation + aborts active send without deleting durable entries, preserving recovery if API deletion fails. |
| Account deletion after API success | `PRESENT/PARTIAL` | both SSO typed-delete and password-confirmed paths call `purgeAfterAccountDeletion()` after `deleteAccount()` succeeds, then unregister push, sign out and route to tabs. |
| Account deletion after API failure | `PRESENT` | outer catch calls `resumeAfterAccountDeletionFailure()` so queued durable text resumes when tombstone did not happen. |
| Push unregister ordering | `PRESENT/BEST-EFFORT` | `unregisterCachedPushTokenBestEffort()` calls authenticated API while Clerk auth is still alive, then always clears local token cache even on network/provider failure. |
| React Query identity isolation | `PRESENT` | `_layout.tsx` cancels all queries and clears the shared `QueryClient` on any Clerk `userId` change. |
| Durable outbox identity isolation | `PRESENT/VNX-HARDENED` | outbox storage is owner-keyed; on signed-out state previous + foreign owners are purged; on new signed-in owner previous/foreign storage is purged before hydrating the current owner's key. Token JWT subject is checked against entry owner before send. |
| Cold restart / second account source fence | `PRESENT AT SOURCE / DEVICE UNPROVEN` | owner-keyed storage + foreign-owner purge + query cache clear prevent obvious cross-account replay/cache bleed; physical kill/relaunch and two-account Clerk journey remain unverified. |

## 2. Reproduced source-level defect — delete succeeded, signOut failed

Both account-deletion flows currently wrap **server deletion, local purge, push unregister, Clerk signOut and routing in one outer `try/catch`**.

The catch unconditionally calls:

`resumeAfterAccountDeletionFailure()`

That function explicitly clears `purgingRef` and `suspendedRef`, then schedules the outbox drain again.

Therefore this event order is currently possible:

1. `suspendForAccountDeletion()` succeeds;
2. `deleteAccount()` succeeds — server-side tombstone/privacy deletion is now durable;
3. `purgeAfterAccountDeletion()` succeeds or best-effort reports cleanup trouble;
4. push unregister runs;
5. Clerk `signOut()` throws/fails;
6. the outer catch executes `resumeAfterAccountDeletionFailure()`;
7. Messenger processing is re-enabled even though the server account is already deleted.

The next protected API request should eventually receive `ACCOUNT_DELETED` and trigger root teardown again, but that is **reactive recovery after an invalid state was re-enabled**. The local state machine should never classify post-tombstone Clerk signOut failure as "account deletion failed".

**Classification:** `CURRENT ORDERING DEFECT / SECURITY-AND-IDENTITY SAFETY RISK`.

This is bounded. It does not require redesigning account deletion, Messenger, Clerk, push, or QueryClient.

## 3. Guard blind spot

`messenger-wiring-guard.test.mjs` contains a test named:

`VNX-07A coordinates explicit logout, delete, switch, and tombstone teardown`

It proves that:

- settings calls `suspendForAccountDeletion()` before `deleteAccount()`;
- `purgeAfterAccountDeletion()` exists;
- `resumeAfterAccountDeletionFailure()` exists;
- root tombstone handler calls `prepareForSignOut()` before `signOut()`;
- owner storage purge infrastructure exists.

It **does not prove the semantic boundary** that `resumeAfterAccountDeletionFailure()` may run only when `deleteAccount()` itself failed before durable tombstone success.

Therefore the current source defect passes the existing guard. This is a guard-quality defect analogous to the Profile visible-role pill gap.

## 4. Required correction shape — not yet authorized for Product branch

The repair must preserve the current two-phase deletion model:

- pre-delete: `suspendForAccountDeletion()`;
- if `deleteAccount()` fails: `resumeAfterAccountDeletionFailure()` and keep the user signed in;
- if `deleteAccount()` succeeds: account is durably deleted; **never resume outbox again**;
- after durable delete: purge local outbox, unregister push best-effort, attempt Clerk signOut, clear/route local identity safely;
- if Clerk signOut fails after durable delete: remain locally suspended/purged and surface an auth-provider/session cleanup error; allow the global `ACCOUNT_DELETED` handler/cold-start tombstone path to finish cleanup, but never re-enable message sending.

The two deletion variants (password and SSO-only typed DELETE) must share the same semantic helper or be guarded identically; copy-pasted drift is not acceptable.

## 5. Required RED/GREEN evidence before promotion

### RED

Add a focused test that deterministically models:

`deleteAccount resolves → signOut rejects`

and asserts:

- `resumeAfterAccountDeletionFailure()` is **not** called;
- outbox remains suspended/purged;
- push token cache is cleared;
- user receives a cleanup/auth-provider error rather than "delete failed" semantics.

Also retain a separate RED/GREEN journey:

`deleteAccount rejects`

which **must** call `resumeAfterAccountDeletionFailure()`.

### GREEN

Required adjacent coverage:

- explicit manual sign-out still aborts sign-out when durable outbox cleanup itself fails;
- `ACCOUNT_DELETED` auth-failure handler remains one-shot and ordered outbox → push → Clerk;
- second-account hydration still purges foreign owners before loading current-owner storage;
- QueryClient clears on `userId` transition;
- no change to server tombstone transaction or deletion privacy rails.

## 6. Runtime boundaries still open

Even after a source fix, keep these `UNPROVEN` until executed:

- real Clerk signOut failure after successful API tombstone;
- Android/iOS physical delete + relaunch;
- kill/relaunch between server tombstone and Clerk signOut;
- second account sign-in on the same device after failed Clerk cleanup;
- real push unregister/provider behavior;
- object-storage cleanup and Clerk provider deletion failure/retry.

## 7. ACC-LIN-02 verdict

- API tombstone detection: `PROVEN SOURCE`.
- explicit sign-out: `PROVEN SOURCE / VNX-GUARDED`.
- outbox abort/sanitize/account fencing: `PROVEN SOURCE / VNX-TESTED`.
- push unregister ordering: `PROVEN SOURCE / BEST-EFFORT`.
- Query cache identity fence: `PROVEN SOURCE`.
- cold restart / second account: `SOURCE-GUARDED / DEVICE UNPROVEN`.
- account delete failure recovery: `PROVEN SOURCE`.
- **post-delete Clerk signOut failure classification: `BROKEN`**.
- existing teardown guard: `INCOMPLETE SEMANTIC COVERAGE`.

**Current decision:** do not apply a Product fix from this audit branch. First reconcile this finding with the parallel owner audit, then create one bounded Product branch from the then-current canonical with RED tests first.

Run npm run build.
