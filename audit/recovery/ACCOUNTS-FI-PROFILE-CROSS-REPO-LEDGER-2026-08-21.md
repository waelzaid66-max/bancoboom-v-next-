# Accounts / FI / Profile — Cross-Repo Recovery Ledger — 2026-08-21

**Base:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Mode:** forensic only; no Product edits in this branch.

## 1. Historical authority disposition

`docs/audit/M1-ACCOUNTS-AUTH-MODULE-AUDIT.md` is valuable historical evidence from `bancostormainvirgen@3b55a0e`, but its final phrase **"M1 is production-grade" is not current production authority**. The same report explicitly left enterprise/staff journeys and pixel/native UX out of scope, while the later VNX production matrix correctly keeps live Clerk/device/runtime proof open.

Current maturity must therefore be capability-specific, not inherited from the M1 summary verdict.

## 2. Current capability ledger

| Capability | CURRENT classification | Evidence / interpretation |
|---|---|---|
| Lazy first-touch DB provisioning | `PRESENT` | `getOrCreateUser` uses unique `clerk_id`, `ON CONFLICT DO NOTHING`, winner-only welcome email and tombstone rejection. |
| Soft-deleted account re-entry protection | `PRESENT` | first-touch and DB-user lookups reject/omit `deletedAt` rows; Clerk lag cannot revive API access. |
| DB role as business authority | `PRESENT/PARTIAL UI` | server role drives account logic and FI workspace; Profile computes `role = meRole || clerkRole`, but one visible role pill still bypasses the computed role. |
| Staff permission mirror API ↔ Admin OS | `PRESENT/GUARDED` | `permissionsMirror.test.ts` parses both policy files and requires identical roles, permissions and matrices; owner must hold every permission. |
| Client self-demote guard | `PRESENT` | Profile consults `/me` role first for elevated-role demotion decisions. |
| Server self-demote guard | `PRESENT` | `updateUserProfile` blocks FI/company/enterprise → individual and applies a conditional write to close races. |
| FI role provisioning | `PRESENT` | financial-institution role synchronously calls idempotent `ensureFiWorkspace` before PATCH `/me` success. |
| FI awaiting-admin membership state | `RESTORED/PRESENT` | current Banks hub uses `/me` role plus institution inbox membership probe and renders `banks-awaiting-link` for FI without membership instead of Join CTA. |
| Business/KYC document merge | `PRESENT` | `mergeBusinessCompanyDetails` prevents a later business save that omits documents from wiping KYC document state; upload claims are finalized best-effort after durable profile update. |
| Clerk role/profile mirror | `PRESENT/BEST-EFFORT ONLY` | server mirrors after DB write but intentionally swallows provider failure; Clerk is not authoritative. |
| Visible Profile role pill | `PARTIAL / CURRENT DEFECT` | current business decisions use computed DB-first `role`; visible pill still uses `user.publicMetadata.role` directly when custom `categoryLabel` is absent. Historical CA-OOM implementation used the computed `role` here. |
| Profile DB-role regression guard | `INCOMPLETE COVERAGE` | current guard asserts `/me` and `const role = meRole || clerkRole` exist but does not prove the visible role consumer uses `role`; therefore the UI regression passes the guard. |
| Server account deletion/tombstone | `PRESENT at source` | current `UserService.deleteAccount` captures media before wipe, anonymizes/tombstones atomically, removes privacy-sensitive state/push-token rows and runs provider/storage cleanup after durable DB mutation. |
| Client deletion/session teardown | `VERIFY CURRENT` | historical hardening exists; exact current mobile path still requires direct source + guard + runtime verification before PASS. |
| Push-token cleanup on sign-out/delete | `VERIFY CURRENT` | server delete path removes tokens; client unregister ordering and account-switch behavior still require exact-current inspection/device proof. |
| Messenger outbox account isolation during auth teardown | `VNX TESTED / DEVICE UNPROVEN` | VNX-07A protects account-bound body-text outbox at source/render/CI; physical account-switch, kill/relaunch and live Clerk/network remain unproven. |
| MFA/social/reset | `SOURCE EXISTS / LIVE TENANT UNPROVEN` | current Profile has MFA-capable flow and provider discovery; live Clerk configuration and physical-device provider journeys remain release gates. |
| Company role | `SOURCE-SUPPORTED / CREATION POLICY RECHECK` | API accepts `company`; current UI account-family mapping can preserve or request company in some flows, but complete production creation/permission journey must be re-run. |
| Enterprise role | `SERVER/ENUM PRESENT / PRODUCTION CREATION UNPROVEN` | never delete/migrate merely because no normal client creation path is visible; requires explicit product/schema decision. |

## 3. Proven current UI defect — DB role consumer mismatch

The historical recovery reason was valid: `syncRoleToClerk` is best-effort and can fail, so visible product chrome must not depend on the Clerk mirror when `/me` has a role.

CURRENT Profile correctly derives:

`const role = meRole || clerkRole`

and uses that value for business/FI mode decisions. However the visible role pill currently renders, when no custom category label exists, from:

`user.publicMetadata?.role`

rather than `role`.

Historical `-BANCO-CA-OOM-` source rendered:

`categoryLabel || (role || member)`

This is a bounded recovery candidate, but **no Product patch is authorized by this ledger alone**. Before modification the defect must have a RED assertion attached to the visible consumer, not merely to the existence of the computed role.

## 4. Deletion lifecycle — current source facts vs unproven runtime

Current API source retains the strong M1 architecture:

1. resolve user/tombstone;
2. capture message/story/KYC media references before privacy wipe;
3. mutate/anonymize relational state transactionally;
4. preserve referential structures where counterparties still require history;
5. remove push/privacy-sensitive rows;
6. run object-storage deletion after DB commit;
7. remove Clerk identity after the durable local privacy action.

This is **source-preserved**, not a current live certificate. Required current closure includes:

- exact current `UserService.deleteAccount` PostgreSQL tests;
- DeleteAccountModal/API-client behavior;
- client auth-failure handler after `ACCOUNT_DELETED`;
- message-outbox abort/sanitize during delete/sign-out/account switch;
- push unregister ordering;
- two-account switch and cold restart;
- Clerk deletion failure/retry;
- real object-storage cleanup result;
- physical Android/iOS deletion and relaunch.

## 5. What must NOT be done

- Do not make Clerk `publicMetadata` the authority to "simplify" role handling.
- Do not remove `company`/`enterprise` enums without product decision + migration + producer/consumer census.
- Do not let FI inherit Dealer console access merely because both are business accounts.
- Do not rewrite onboarding while closing the role-pill defect.
- Do not weaken elevated-role demotion guards.
- Do not replace atomic privacy deletion with client-side cleanup.
- Do not call source-preserved deletion or auth `LIVE_VERIFIED` without Clerk/storage/device evidence.

## 6. Next exact verification slice

`ACC-LIN-02 — client teardown and identity transition`

Trace on CURRENT source:

`API ACCOUNT_DELETED / explicit sign-out / account delete → API client auth-failure handler → MessageOutbox prepare/abort/sanitize → push unregister → React Query/session cache teardown → Clerk signOut/delete → cold restart / second account`.

Required output is a transition matrix with every ordering edge and its guard/test. No Product change until the transition matrix exposes one reproduced defect.

**Status:** `ACCOUNTS SOURCE PARTIALLY VERIFIED / ONE UI REGRESSION PROVEN / LIVE DEVICE+PROVIDER NO-GO`.

Run npm run build.
