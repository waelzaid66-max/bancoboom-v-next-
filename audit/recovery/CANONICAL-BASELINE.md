# BANCO Canonical Baseline

## Identity and immutable ancestry

| Field | Value |
|---|---|
| Target repository | `waelzaid66-max/bancoboom-v-next-` |
| Assembly branch | `canonical/vnext-assembly` |
| Program-control input HEAD | `8ed12e9` |
| Historical source repository | `waelzaid66-max/bancoboomstor` |
| Historical source commit | `a3db5bd8c3edd060d35078aefeec709297abbad9` |
| Historical source root tree | `07c4393d40f7ecfd9bc401747696f40ade54b7b7` |
| Remote rollback ref | `recovery/source-bancoboomstor-a3db5bd8` |
| Protection-chain ref | `recovery/vnx-01-protection-chain` → `36689065b9ea01d153d7ecd7e18c9c9e19996914` |
| Messenger idempotency ref | `recovery/vnx-02-messenger-idempotency` → `e318cef0002dc87b33a8f1277b147ff6076c360f` |

The target is an assembly repository with the complete source ancestry, not a
manual source dump. The `bancoboomstor` worktree remains read-only. No target
`main` is declared canonical and no deployment is authorized yet.

## Accepted committed layers

| Layer | Commit | Scope | Acceptance |
|---|---|---|---|
| VNX-00 | `f4ddee9` | Forensic evidence, assembly decision, workspace identity | Accepted; no product behavior |
| VNX-01 | `3668906` | Reconnect retired-red, Import, and render-coverage protection chains | Accepted and build-tested |
| VNX-02 | `e318cef` | Messenger `client_message_id`, race-safe message/unread transaction, mobile retry reconciliation | Candidate accepted at source/compile/build level; PostgreSQL/device runtime remains `UNPROVEN` |
| VNX-02 closeout | `8ed12e9` | Exact provenance record | Accepted; documentation only |

The currently edited Message notification outbox is **in-flight VNX-03** and is
not part of this baseline until its migration, tests, build, evidence, commit,
rollback ref, and remote push all succeed.

## Preserved production safety rail from `a3db5bd8`

The baseline retains the latest known source implementations for Clerk/account
hardening, tenant isolation, KYC access, upload ownership, MIME/size policy,
private media and signed serving, payment idempotency/refund safety, FI lifecycle
locking/audit, migration authority, CI gates, Docker/Coolify hardening, AWS Next
prebuild, and release traceability. These are preserved constraints, not claims
of live-provider certification.

Maps at the baseline is the strongest verified **source** superset found. It is
not certified on native/WebView/device runtime. The advanced Messenger wave was
not recoverable as a Git object; missing capabilities are explicitly bounded
reconstruction on top of current security and schema authority.

## Golden capability protocol

Every capability must close these stages in order:

1. **UNDERSTAND** — product intent, UX, policy, dependencies, contracts,
   security, navigation, state, and runtime.
2. **ARCHAEOLOGY** — best historical implementation, subsequent fixes,
   regressions, conflicts, and guards.
3. **PROVENANCE** — source repo/branch/SHA/blob/files and target files.
4. **RECOVER** — restore only the proven intended behavior.
5. **RECONCILE** — retain current DB/API/Auth/Storage/Security architecture.
6. **MODERNIZE** — improve implementation only after recovery intent is fixed.
7. **VERIFY** — appropriate static, unit, render, integration, DB, runtime,
   device, and provider gates with exact SHA/command/workspace/result.
8. **FREEZE** — independent commit, evidence record, rollback ref, capability
   ledger entry, remote push, and root `npm run build` pass.

## Production program order

| Phase | Scope | Exit condition |
|---|---|---|
| 0 | Forensic preservation, baseline, control ledgers | Completed controls and rollback ancestry |
| 1 | Shared mobile shell, navigation, section architecture | Reachability/safe-area/overlay/state contracts proven |
| 2 | Dynamic identities and headers; Cars, Property, Stay, Facilities, Materials independently | Geometry and interaction at 320/360/390/430, AR/EN, RTL/LTR, all states |
| 3 | Shared Maps engine plus domain integrations | Web/native journeys and map/list honesty certified |
| 4 | Messenger end-to-end | DB/API/mobile/notification/storage journeys certified |
| 5 | Four account journeys, Auth, KYC, Profile | Role-policy matrix and live Clerk journeys certified |
| 6 | Search and Discover | Domain isolation plus saved/recent/trending flows certified |
| 7 | Publishing, listings, and media | Create/edit/publish/private media journeys certified |
| 8 | Payments and financing | PostgreSQL and live-provider safety journeys certified |
| 9 | Admin, Dealer, Website | Role-aware end-to-end journeys certified |
| 10 | Cross-product regression and deployment | Clean install through rollback/restore and exact-SHA staging certification |

VNX-03 Message outbox is the one bounded in-flight exception because it began
before this sequence was adopted. Close and freeze it; do not continue into
offline/realtime/typing/read/block/mute/voice until Phases 1–3 are adjudicated.

## Current release decision

- Assembly work: **GO**, one micro-batch at a time.
- Target `main`, production deploy, or production-ready claim: **NO-GO**.
- PostgreSQL, Clerk, storage providers, Paymob, Docker/Compose/Coolify, Android,
  iOS, EAS, push/email delivery, restore/rollback: **UNPROVEN** on this target.
