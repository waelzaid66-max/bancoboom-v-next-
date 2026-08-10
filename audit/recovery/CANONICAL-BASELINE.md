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
| Messenger notification-outbox ref | `recovery/vnx-03-messenger-notification-outbox` → `38697ea8566139415b58d6dc28d7392a73c4cfc4` |
| Shared-shell contract ref | `recovery/vnx-04-shared-shell-contracts` → `7e1f17c05326f2b3bf538ee6e365196aaec58b58` |
| Cars header contract ref | `recovery/vnx-05-cars-header-contracts` → `e3f92c2422a51a3092d2c7bf61f14d1f6284c9ee` |
| Root-build scheduling ref | `recovery/vnx-ops-01-root-build-scheduling` → `d6b42b5542837ae502febc3a7425efc68241b4ac` |
| Property header contract ref | `recovery/vnx-05-property-header-contracts` → `b51f791b373a709444ff6a51a3d96ad6d31d6ab9` |
| Stay header contract ref | `recovery/vnx-05-stay-header-contracts` → `e85cd3994d15c376f04b3995770d1c8e373c49dd` |

The target is an assembly repository with the complete source ancestry, not a
manual source dump. The `bancoboomstor` worktree remains read-only. No target
`main` is declared canonical and no deployment is authorized yet.

## Accepted committed layers

| Layer | Commit | Scope | Acceptance |
|---|---|---|---|
| VNX-00 | `f4ddee9` | Forensic evidence, assembly decision, workspace identity | Accepted; no product behavior |
| VNX-01 | `3668906` | Reconnect retired-red, Import, and render-coverage protection chains | Accepted and build-tested |
| VNX-02 | `e318cef` | Messenger `client_message_id`, race-safe message/unread transaction, mobile retry reconciliation | PostgreSQL journey later verified by CI `31396133572` on descendant `6af3413`; native reconnect remains `UNPROVEN` |
| VNX-02 closeout | `8ed12e9` | Exact provenance record | Accepted; documentation only |
| Production program | `c402edc` | Canonical ledgers, full production phases, and batch protocol | Accepted; documentation only |
| VNX-03 product | `38697ea` | Atomic Messenger notification outbox, retry/dedupe/checkpoints, cooldown, readiness | Accepted and independently referenced |
| VNX-03 verification | `6af3413` | Protection chain follows enqueue→worker architecture | Local mobile/root gates and all seven CI jobs PASS; PostgreSQL tested journeys runtime-verified; push/provider/device remain `UNPROVEN` |
| VNX-04 protection | `7e1f17c` | Real render coverage for shared results-state and mini-app navigation contracts; no product delta | Local render 40/40, full mobile/typecheck/root build PASS; CI `31398232413` all 7 jobs PASS; device runtime remains `UNPROVEN` |
| VNX-05A Cars protection | `e3f92c2` | Mounted Cars identity, controls, press routing, optional-band behavior, RTL direction, and real hero-height collapse; no product delta | Local Cars 5/5 and render 45/45, full mobile/typecheck/root build PASS; CI `31399958518` all 7 jobs PASS; combined section/device runtime remains `UNPROVEN` |
| VNX-OPS-01 build control | `d6b42b5` | Serial root workspace scheduling plus an exact chain assertion; no product delta and no broader output deletion | Reproduced parallel `ENOTEMPTY`; serial all-workspace and one literal root build PASS; CI `31403501605` all 7 jobs PASS; clean repeated final-RC build remains `UNPROVEN` |
| VNX-05B Property protection | `b51f791` | Mounted pinned identity/browse controls, real lockup collapse, action routing, sentinel-to-API taxonomy, search, and RTL direction; no product delta | Local Property 8/8 and render 53/53, full mobile/typecheck/root build PASS; CI `31404662388` all 7 jobs PASS; combined section/device runtime remains `UNPROVEN` |
| VNX-05C Stay protection | `e85cd39` | Mounted pinned identity/browse controls, real measured header/tagline collapse, action/search/type state, and RTL direction; no product delta | Local Stay 7/7 and render 60/60, full mobile/typecheck/root build PASS; CI `31406559372` all 7 jobs PASS; complete booking/device runtime remains `UNPROVEN` |

VNX-03 is frozen with an independent remote recovery ref and PostgreSQL-scoped
runtime evidence. It does not authorize later Messenger capabilities or a
production claim.

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

The detailed exact-SHA release authority is
`audit/recovery/CANONICAL-PRODUCTION-GATE-MATRIX.md`. Inherited production
reports are inputs to that matrix, not automatic certification of vNext.

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

VNX-03 Message outbox was the one bounded in-flight exception because it began
before this sequence was adopted. It is now frozen; do not continue into
offline/realtime/typing/read/block/mute/voice until Phases 1–3 are adjudicated.

## Current release decision

- Assembly work: **GO**, one micro-batch at a time.
- Target `main`, production deploy, or production-ready claim: **NO-GO**.
- PostgreSQL 16 migration replay and API journeys are verified by CI run
  `31396133572` on `6af3413`; this is not live/staging database certification.
- VNX-05A Cars, VNX-05B Property, and VNX-05C Stay are frozen only at
  source/static/render/build/CI layers. Facilities, Materials, combined section
  and booking integration, and the complete production program remain open.
- Live PostgreSQL, Clerk, storage providers, Paymob, Docker/Compose/Coolify,
  Android, iOS, EAS, push/email delivery, and restore/rollback remain
  **UNPROVEN** on this target.
