# BANCO vNext — Cross-Repo Recovery Continuation — 2026-08-21

**Status:** CURRENT AUDIT CONTINUATION / PRODUCT WRITE HOLD  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Purpose:** continue the prior Codex manager/VNX recovery program without losing accepted work, without trusting stale reports wholesale, and without reopening already-frozen capabilities unless CURRENT source reproduces a defect.

## 1. Manager continuity established

The relevant prior manager is the same Codex manager whose VNX program organized multiple agents through the late Aug-20 / early Aug-21 recovery window. The durable authority left by that program is the combination of:

- `audit/recovery/CANONICAL-CAPABILITY-LEDGER.md`
- `audit/recovery/CANONICAL-PRODUCTION-GATE-MATRIX.md`
- `audit/recovery/RECOVERY-REGRESSION-REGISTER.md`
- `audit/recovery/CURRENT-MANAGER-RECONCILIATION-2026-08-21.md`
- individual `VNX-*` capability reports and rollback branches.

These documents are evidence, not infallible truth. Every actionable claim is rechecked against CURRENT source and owner-law chronology before Product modification.

## 2. What the prior manager actually completed

### Preserved/frozen at bounded source/test layers

- Messenger send idempotency and PostgreSQL transaction boundary.
- Messenger notification outbox and replay/cooldown rail.
- Durable account-bound **body-text** mobile outbox; non-text durability remains separate.
- Messenger mark-read/send serialization accepted on VNX-07B evidence.
- Shared mobile results/navigation shell.
- Cars, Property, Materials, Facilities, Stay header components at their individual freeze points.
- `SectionSearchApp` bounded four-catalogue host contract (VNX-05F) **without rewriting the conflict-damaged source**.
- `BookingStaysApp` independent host contract (VNX-05G).
- Maps draw-area/web parity/cache ordering (VNX-06A).
- Maps hub world/hydration authority (VNX-06B).
- Maps criteria-response ordering (VNX-06C).
- Root build serialization invariant.
- Committed-migration operator authority.
- Dependency security bounded overrides and later safe maintenance blobs.

### Critical interpretation

`TESTED` in the VNX program never means device/live/provider/production certified. The prior manager explicitly kept physical-device, provider, staging, backup/restore and rollback gates open.

## 3. Source areas that remain historically dangerous

### `SectionSearchApp.tsx`

Classification remains `CONFLICT_DAMAGED` historically. Two high-risk merges selected whole parent blobs. VNX-05F protected only defensible CURRENT host behavior and intentionally did **not** rewrite the file. Therefore:

- no wholesale replacement;
- no old-branch transplant;
- no assumption that all live facets/states are certified;
- every section-specific repair must prove category/engine/filter/map isolation before and after.

### Booking/Stays

The current parent is `PRESERVED` after an unsafe scrolling-control split was reverted. Owner law requires browse controls to remain above opaque empty/error result overlays. `StaysHomeHeader` black identity is owner-approved and guard-locked; old rose-header restoration is forbidden.

## 4. Maps owner-law and recovery state

### Accepted mobile architecture

- Leaflet + MarkerCluster + OpenStreetMap.
- Native host: WebView; web host: iframe/DOM.
- Shared server map contract: `/v1/search/map`.
- `react-native-maps` / Google-native mobile path is retired/forbidden unless a later explicit Owner ADR supersedes it.
- Google Maps code on web surfaces is a separate web concern and does not override the mobile ban.

### Accepted placement

Owner correction established Maps as a dedicated mini-app:

- primary Discover Maps CTA → `/section/maps`;
- per-section `?map=1` feeds remain intentionally duplicated for Cars, Property, Materials, Facilities and Stay;
- MapsHub reuses `SearchResultsMap`; it must not become a second map engine;
- seller `MapPinPicker` is a separate create/edit placement flow, not the buyer Maps hub.

### Current restored capabilities

`marketCountryMapCenter` was genuinely lost during an earlier wipe but is restored in CURRENT source, consumed by native/web map hosts and protected by regression tests. Do not reopen it as missing.

### VNX Maps defects actually repaired

- web draw-area bridge orphaning;
- degenerate polygon acceptance;
- stale clear-to-area viewport authority;
- cache-hit response ordering;
- MapsHub late market hydration resetting selected world;
- post-unmount MapsHub commit;
- stale old-criteria cluster publication during new-criteria debounce.

### Maps still UNPROVEN

- real browser iframe/postMessage behavior;
- Android/iOS WebView interaction;
- OSM/provider/network failures;
- physical-device geolocation/touch draw/pan/zoom/rotation;
- large-result clusters/count and memory pressure;
- five-domain real-data map/list journeys;
- `MapPinPicker` persistence;
- accessibility/device/runtime monitoring.

## 5. Corrected manager/agent claims

### Discover restore claim — REJECT AS CURRENT AUTHORITY

`CURRENT-MANAGER-RECONCILIATION` listed a five-capability Discover restoration (recent, popular brands, saved, trending, recently viewed). That cannot be executed wholesale. Owner-law and anti-melt/anti-strip decisions prohibit restoring recent/saved/trending rails into `SearchDiscover` merely because old JSX/styles exist. Saved Search itself is preserved as a capability and must be verified producer→persistence→matcher→reopen without forcing its UI into Discover.

### B-OOM Stay authorization — CORRECTED TO PROVEN

Earlier audit wording called Stay derivation authorization unproven. That was incomplete. CURRENT `.agents/memory/banco-stay-header-lock.md` and the historical section guard record Owner decision 2026-07-19 FINAL approving the black `StaysHomeHeader` and superseding the rose hero. Preserve it.

### FI awaiting-admin link — RESTORED

The old cross-repo ledger identified this as lost. CURRENT `business/banks.tsx` now uses `/me` role + institution-membership probe and exposes `banks-awaiting-link` for FI users awaiting admin membership. Do not reopen as missing.

### Profile DB-role authority — PARTIAL REGRESSION STILL PRESENT

CURRENT profile business/permission logic computes `role = meRole || clerkRole`, which is correct. However the visible role pill still falls back directly to `user.publicMetadata.role` when no custom `categoryLabel` is set. Historical CA-OOM source used the computed `role` for the visible pill. The current static guard named `Profile role prefers /me over Clerk publicMetadata` proves the computed role exists but does not assert that the visible role pill consumes it. Classification: **PARTIALLY RESTORED / CURRENT UI DEFECT / GUARD BLIND SPOT**. No Product patch until the full recovery ledger wave closes.

## 6. CI truth

Recent red Actions on current audit/release candidates terminated before Step 1 (`steps=null`, no job logs exposed). This is not accepted as evidence that typecheck/build/PostgreSQL/Expo/Docker commands ran and failed. Classification remains `ACTIONS_EXECUTION_INFRA_FAILURE / ROOT_CAUSE_UNKNOWN` until GitHub exposes executable runner evidence.

Historical exact-SHA VNX CI successes remain valid evidence for their exact frozen SHAs only; they do not certify current `4f2c81cc` runtime.

## 7. Current system-level audit boundaries

Every subsystem must be verified end-to-end, not from one file:

1. **Search/Saved Search** — mobile criteria → nav serialization → API → saved row → alert matcher → reopen route.
2. **Section mini-apps** — route slug → identity/header → FilterSheet/useSearchMiniApp → API category/spec keys → list/map → listing detail.
3. **Maps** — section/world criteria → viewport/near/area → `/v1/search/map` → stale-response protection → map/list consistency.
4. **Accounts/FI** — Clerk identity → `/me` role/account state → permissions → profile/banks/onboarding → deletion/session/push cleanup.
5. **Messenger** — identity → conversation/read state → body/media durability → notifications/outbox → push/email/provider/device.
6. **Media** — picker/crop → claim → object storage → ACL/finalization → listing/chat/profile/KYC rendering.
7. **Publishing** — create/edit/publish/unpublish/mine/import → DB/API → notifications → map/search visibility.
8. **Payments/FI** — intent/order binding → webhook/replay → ledger/subscription/refund → admin/FI operations.
9. **Release** — exact Git SHA → frozen install/build → image digest/SBOM → migration set → Compose/Coolify → health/provider/device → backup/restore/rollback.

## 8. Release/deploy state

Source-side Deployment SoT was reconciled separately in PR #9. Production remains NO-GO. Still blocking:

- executable exact-SHA CI;
- immutable Docker image tags/digests (no mutable `:latest` release provenance);
- clean build of every shipped Dockerfile;
- Compose runtime with migrations-before-traffic and restart behavior;
- Coolify exact-SHA staging, domains/TLS/secrets/well-known/proxy smoke;
- live PostgreSQL adoption + snapshot upgrade + backup/restore;
- Clerk/storage/email/push/Maps/Paymob live journeys;
- Android API 36 release compliance and native icon/FCM/EAS provenance;
- signed Android/iOS physical-device matrices;
- accessibility/i18n/RTL/font-scale/touch/keyboard/rotation;
- observability/SLO/worker-outbox alarms;
- rollback rehearsal and traceability record.

## 9. Product write policy

Until this cross-repo ledger is completed:

- audit/documentation only;
- no wholesale branch merge/cherry-pick;
- no old Product restore by name alone;
- no feature deletion to make reports/tests cleaner;
- no map engine/provider rewrite;
- no header redesign;
- no `SectionSearchApp` wholesale replacement;
- no Discover strip restoration;
- no enum/schema deletion without producer/consumer/migration proof;
- no weakening guards to fit current code.

Every first Product patch must cite:

1. Owner-law/accepted contract;
2. exact CURRENT defect evidence;
3. historical good blob/behavior if recovery is involved;
4. touched files and non-goals;
5. RED test/guard demonstrating the defect;
6. GREEN focused + adjacent + root gates;
7. rollback ref;
8. runtime/device boundaries still unproven.

## 10. Next forensic wave

Continue the old Master Tracker and cross-repo archaeology item-by-item. For every historical OPEN/lost claim classify CURRENT reality as one of:

`PRESENT` · `RESTORED` · `PARTIAL` · `LOST` · `BROKEN` · `ORPHANED` · `MUTATED` · `UNPROVEN` · `SUPERSEDED`.

Priority order for the next census:

1. Accounts/FI/profile lost-feature parity and guard quality.
2. Search/Discover/Saved Search capabilities without violating anti-melt/anti-strip law.
3. Listings/create/edit/publish/import and media/upload completeness.
4. Messenger remaining block/mute/non-text/realtime claims versus accepted VNX foundation.
5. Admin/Dealer/Web route/permission parity.
6. Android/Expo/EAS native build/config/assets/API-36/FCM.
7. Docker/Compose/Coolify/DB/provider/release certification.

**Current decision:** `NO-GO / RECOVERY CONTINUATION ACTIVE / PRODUCT PRESERVATION LOCKED / EXACT-CURRENT RUNTIME UNPROVEN`.

Run npm run build.
