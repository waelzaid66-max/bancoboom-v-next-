# 102 — Master Tracker Legacy Open Tasks Reconciliation

**Date:** 2026-08-21  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical audited source:** `canonical/vnext-assembly @ 4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Audit branch:** `audit/current-truth-20260821`  
**Mode:** forensic continuation / Product preservation lock  
**Parent report:** `101-CROSS-REPO-RECOVERY-LEDGER-MASTER-TRACKER-2026-08-21.md`

---

## 0. Why this addendum exists

Report 101 adjudicated the major cross-repo capability claims. This addendum closes the remaining literal bullets under the historical `docs/audit/MASTER-TRACKER.md` section **“Open tasks carried forward (do NOT drop)”** and reclassifies the old module-level `pending/NEXT` labels.

The historical tracker is evidence, not current deployment authority. Its own header now says so. This document therefore does not copy its old state labels forward blindly.

**No Product/API/Mobile source is modified by this batch. No merge/cherry-pick is authorized.**

---

## 1. Historical open task: enterprise / staff journeys

Historical statement: enterprise/staff journeys were never audited because old M1 excluded them.

### 1.1 Staff axis — old blanket “never audited” is superseded

Current code separates business/account role from internal staff role.

The current Admin service has a real staff-role mutation path with:

- `owner / admin / moderator / support / user` staff roles;
- authorization expected upstream through `manage_roles`;
- self-change protection;
- last-owner protection;
- a transaction-wide PostgreSQL advisory lock around owner-count read + decision + write;
- synchronized `isAdmin` mirror;
- audit logging after a successful change;
- separate ban guards protecting privileged accounts.

Therefore the historical blanket statement **“staff journeys never audited” is stale as a source claim**.

Current classification:

- staff-role source/authz foundations: `PRESERVED / AUDITED LATER`;
- full mounted Admin UI journey across every staff role: `RUNTIME/ROLE-MATRIX VERIFICATION OPEN`;
- no staff-role redesign authorized.

### 1.2 Enterprise business role — still not a reachable product journey

Current DB/business logic still recognizes `enterprise`, but:

- current `PATCH /me` account-type input does not accept `enterprise`;
- the four native account families do not expose Enterprise;
- current Admin `setUserRole()` mutates the **separate staff-role axis**, not `users.role` business/account type;
- this audit did not establish another current production route that creates/promotes an Enterprise account.

Therefore the old phrase sometimes found in release-era material — “enterprise is admin-assigned by design” — is not current executable proof.

**Classification:** `OWNER_POLICY_REQUIRED / CURRENTLY UNREACHABLE`.

Do not delete the enum and do not invent a new UI until owner policy states who may become Enterprise, by which authority, with which verification/billing/permissions effects.

---

## 2. Historical UNKNOWN M1-F5 — non-field Clerk errors

Historical question: can Clerk errors such as rate-limit, network, session-state or other non-field failures disappear because the UI only renders field errors?

### 2.1 Current source answers the structural half of the question

Current Profile auth flow obtains `signInErrors` / `signUpErrors` from Clerk hooks.

Password sign-in does:

```ts
const { error } = await signIn.password(...);
if (error) return;
```

Signup similarly returns after `signUp.password()` error.

The visible form renders field-scoped messages such as:

- `signInErrors.fields.identifier`;
- `signInErrors.fields.password`;
- `signUpErrors.fields.emailAddress`;
- `signUpErrors.fields.password`;
- verification/MFA code field errors.

There is no general auth-error panel in the inspected password/signup form that consumes a non-field error before those handlers return.

By contrast, OAuth catch deliberately extracts Clerk `longMessage/message` and surfaces it through an Alert.

### 2.2 Correct current verdict

The old `UNKNOWN` can now be narrowed:

- **general non-field password/signup error presentation is not protected by current source**;
- exact Clerk error classes/messages that reach that non-field channel still require provider-contract/live-case evidence before designing mapping/wording.

**Classification:** `PERSISTING SOURCE GAP — GENERAL AUTH ERROR SURFACE ABSENT`.

This is a bounded future Accounts candidate, but not authorized yet. A proper patch must first define the accepted Clerk error shape, avoid leaking sensitive provider detail, preserve field errors, and add renderer/behavior tests for at least network/rate/session/general errors.

---

## 3. Historical open task: accessibility beyond account screens

The old tracker’s exact file-count statistic is stale and must not be repeated as current truth.

What remains valid is the **per-module accessibility obligation**.

Current source contains substantial later accessibility work in Profile, Search and section headers. However report 101 independently reproduced missing accessibility semantics on inspected Global Supply icon controls.

Therefore:

- “accessibility is globally missing” = false;
- “account-screen pass closed accessibility for the app” = false;
- cross-module accessibility remains a real audit lane.

**Classification:** `CROSS-CUTTING VERIFICATION OPEN`, with at least one current bounded source gap already proven in Global Supply index.

Required method for each module:

`interactive control inventory → accessibilityRole/Label/State/Hint where needed → focus/order → touch target → RTL → screen-reader/device runtime`.

Do not launch a repository-wide cosmetic refactor. Fix per module only after exact current evidence.

---

## 4. Historical open task: uploads at every upload point

Historical instruction: inspect every image/video/document path end-to-end:

`picker → claim → verify → storage → cleanup`.

### 4.1 Foundation is no longer missing

Current repository has later upload-security architecture including:

- `upload_claims` ownership/expiry records;
- schema/readiness verification around upload claims;
- private/finalized upload ownership checks in server consumers;
- KYC upload hardening before business-profile persistence;
- best-effort claim settlement after durable persistence;
- Profile cover flow that promotes a private upload before storing a public cover URL;
- Messenger attachment authorization/finalization work in current ConversationService.

This means the old task must not be read as “build upload ownership from scratch”.

### 4.2 What remains open

The historical discipline is still correct: **every producer/consumer pair must be audited per module**, because different media classes have different privacy and lifecycle rules.

Open verification classes include:

- listing image/video;
- avatar/cover;
- KYC/verification documents;
- Messenger image/video/audio;
- stories/social media if enabled;
- import/support/document flows that accept files;
- deletion/account-exit cleanup;
- real S3/object-storage ACL, expiry and serve behavior.

**Classification:** `FOUNDATION PRESERVED / PER-MODULE VERIFICATION DEBT / LIVE STORAGE RUNTIME UNPROVEN`.

No wholesale upload rewrite is authorized.

---

## 5. Historical owner decision: country/currency strips in Real Estate + Materials

The old tracker recorded an owner complaint that country/currency/filter strips were spread and uncoordinated, with direction to collapse the RE + Materials experience.

Current source is materially later than that snapshot:

- active Search uses compact `MarketCountryButton/Picker` rather than the historical spread-country strip;
- `SectionSearchApp` owns one shared market preference and picker state while hard-locking each section category;
- current Property header explicitly documents country/currency as a **micro** control near BANCO;
- current Materials header explicitly says the market is welded beside BANCO and computes one compact flag/currency/market metadata unit;
- browse axes are intentionally separated from the market control instead of duplicating country strips.

Therefore the old implementation gap is **not a current source-recovery task**.

**Classification:** `RESTORED / SUPERSEDED OLD LAYOUT GAP`.

Remaining evidence is visual runtime QA on Android/iOS/web for spacing, clipping, safe area and RTL. Do not restore the historical country-chip matrices.

---

## 6. Historical open task: Vercel preview failures

The old tracker already classified those failures as pre-existing/non-required and said the real API target was Coolify.

Current canonical GitHub workflow directory contains:

- `ci.yml`;
- `ci-website.yml`;
- `ci-website-docker.yml`;
- `deploy.yml`.

There is no current Vercel workflow in the inspected canonical workflow set.

Current deployment documents and compose assets continue to describe Docker/Coolify for server/web deployment and EAS for the native app.

Therefore old Vercel preview failures are **not a current production-release blocker unless a new required branch-protection check explicitly makes them one**.

**Classification:** `SUPERSEDED / NON-RELEASE-AUTHORITY`.

Do not divert the stabilization program into repairing optional historical Vercel previews.

### 6.1 Separate documentation inconsistency discovered

`docs/DEPLOYMENT_SOURCE_OF_TRUTH.md` still names historical repository `waelzaid66-max/bancoboomstor`, while the current forensic/canonical program is operating in `waelzaid66-max/bancoboom-v-next-` and later workspace-origin work explicitly moved authority toward BANCO BOOM NEXT.

This is **documentation/control-plane drift**, not permission to deploy either repository by assumption.

**Classification:** `DEPLOYMENT AUTHORITY RECONCILIATION REQUIRED BEFORE LIVE CUTOVER`.

No production deployment should be initiated until repository/branch/SHA authority is stated in one current exact-SHA document and the compose/image provenance is rebound to it.

---

## 7. Historical OPEN GAP: Car Import entry disconnected from import system

The historical Master Tracker said the Discover Car Import card only opened imported-car browse and that the real request/tracking system was accessible mainly from Profile.

That statement is stale at current canonical.

Current product topology has a dedicated `/import` hub. The current hub exposes real paths for:

- imported-car browsing/search;
- auctions;
- shipping/customs calculation;
- request/import workflow;
- tracking/orders;
- documents;
- support and related import tools.

Current Discover routes Car Import into that dedicated hub rather than only the old `section/car?engine=import` destination.

Therefore:

- old source connectivity gap: `RESTORED / EXPANDED`;
- historical old-route guard is not current authority;
- full real running create→API→DB→admin/stage→notification→tracking proof remains `RUNTIME_UNPROVEN`.

Do not revert the hub merely to satisfy an old guard/report.

---

## 8. Historical module table: M2–M7 “NEXT / pending” is not current truth

The old module progress table is a pre-canonical work-program snapshot, not a present capability matrix.

Current source now contains substantial later work across every one of those domains:

- M2 Search + section mini-apps — current isolated sections, headers, filters, Saved Search, market/near/map contracts;
- M3 Maps — dedicated map world, section maps, seller pin input, draw area, nearest, clustering and later tile-error handling;
- M4 Listing lifecycle — current create/list/detail/mine/moderation/visibility/media systems;
- M5 Messenger/notifications/email — current idempotency, unread serialization, text outbox, durable server notification outbox and notification routing; advanced Messenger remains new-build;
- M6 Payments/subscriptions/wallet/FI — current ledger/payment intents/subscriptions/FI lifecycle/outboxes; live provider and DB-adoption gates remain open;
- M7 Deployment — current Docker/Compose/Coolify/EAS artifacts exist, but live exact-SHA deployment/device/store proof is still open.

Thus the word `pending` in that old table must never be translated into “module missing”.

**Classification:** `SUPERSEDED MODULE PROGRESS LABELS`.

Each domain now needs a current source/runtime gate matrix, not old task-state inheritance.

---

## 9. Final reconciliation table for the literal legacy open list

| Historical open item | Current evidence-based state | Correct treatment |
|---|---|---|
| enterprise/staff journeys never audited | staff source guards later implemented/audited; Enterprise product creation still unreachable | split axes; staff runtime matrix + Enterprise owner policy |
| M1-F5 non-field Clerk errors UNKNOWN | handlers return on generic error; UI shows field errors only; OAuth has general Alert | `PERSISTING SOURCE GAP`; bounded future auth-error surface |
| accessibility beyond account screens | later coverage exists, but Global Supply gap reproduces | per-module audit remains open |
| uploads every point | ownership/finalization foundation exists | per-module producer→storage→consumer verification + live provider QA |
| spread country/currency strips | current RE/Materials/Search use compact market controls | old source gap `RESTORED`; device visual QA remains |
| Vercel preview failures | no current Vercel workflow; Coolify/EAS is release direction | superseded/non-release unless branch protection proves otherwise |
| Car Import Discover disconnected | dedicated current `/import` hub now exists | old gap `RESTORED/EXPANDED`; live E2E still unproven |
| M2–M7 pending/NEXT | major later implementations exist | historical progress labels superseded |

---

## 10. Cross-cutting control-plane findings after 101 + 102

The complete historical reconciliation now yields four distinct classes of work. They must not be mixed:

### A. High-risk production authority

- `BASELINE-ADOPTION-P0`;
- exact current deploy repository/branch/SHA authority reconciliation;
- executable CI runner evidence;
- backup/restore/rollback.

### B. Current bounded source gaps

- Profile visible role pill authority (report 100);
- non-field Clerk auth error surface (this report);
- Global Supply inspected accessibility controls (report 101).

### C. Owner-policy/new-build work

- Enterprise creation/assignment policy;
- Discover Trending placement;
- advanced Messenger block/mute/realtime typing/voice/durable non-text queue.

### D. Runtime proof only

- Clerk live tenant flows;
- storage provider;
- Paymob settlement/reversal;
- push/email provider;
- Maps real device/WebView/provider;
- Car Import live E2E;
- Coolify exact-SHA deployment;
- signed EAS Android/iOS + physical-device journeys + store acceptance.

Any agent that converts category D into speculative source code is violating the current investigation method.

---

## 11. Preservation orders added by this reconciliation

1. Do not treat old M2–M7 `pending` labels as current module absence.
2. Do not reintroduce spread country/currency strips into RE/Materials.
3. Do not revert Car Import from `/import` hub to the historical direct browse route without a new owner decision.
4. Do not equate staff role with account/business role.
5. Do not create Enterprise UI/API merely because the enum exists.
6. Do not rewrite upload architecture; audit each upload lifecycle against the current claims/finalization model.
7. Do not mark Clerk auth fully user-safe until general/non-field error handling is explicitly proven.
8. Do not treat historical Vercel preview failures as production blockers without current required-check evidence.
9. Do not deploy from the stale repository name in old deployment documentation until exact current authority is reconciled.
10. Keep Product preservation lock until the forensic control plane and P0 production-authority risks are ordered by the owner/manager.

---

## 12. Current verdict

The historical Master Tracker’s remaining literal open list is now reconciled against current canonical source.

The important result is not “everything is fixed”. It is more precise:

- several old source gaps were genuinely restored or expanded later;
- several historical `pending/UNKNOWN` labels are stale;
- a few bounded current source gaps remain real;
- Enterprise and some advanced capabilities require owner policy/new design rather than recovery;
- major external/deployment/device items remain runtime-unproven;
- database adoption and current deployment authority remain higher-risk than the small Product gaps.

**No first Product patch is authorized by 101 or 102.**

The next safe audit unit is a current user-journey evidence matrix, not another historical-branch merge.

**Run npm run build**
