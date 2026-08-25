# Parallel Audit Reconciliation — PR #10 + PR #11 — 2026-08-21

**Canonical audited base:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Mode:** forensic / no Product edit.  
**Purpose:** reconcile the owner's parallel audit (PR #10) with the VNX/cross-repo continuation audit (PR #11) before any Product patch.

## 1. Authority model

Neither PR is a standalone execution authority.

- **PR #10 — `audit/current-truth-20260821`**: report-governance, owner-law chronology, current Master Tracker re-adjudication, source/mobile corruption checks, Maps/header lineage, recovered-vs-stale capability labels, and the new DB baseline-adoption P0.
- **PR #11 — `audit/cross-repo-continuation-20260821`**: prior VNX-manager continuity, exact capability freeze interpretation, cross-repo recovery continuation, Accounts/FI/Profile parity, and current identity/teardown transition semantics.

The execution authority remains CURRENT canonical code + owner law + exact executable evidence. These audits are additive evidence and must be reconciled before modification.

## 2. Strong agreement between PR #10 and PR #11

Both independently converge on these decisions:

1. Production remains `NO-GO`.
2. Historical `FINAL/READY/SoT/OPEN/CLOSED` labels are not current authority.
3. Accepted VNX Messenger/Header/Maps work must not be rebuilt blindly.
4. `SectionSearchApp.tsx` is historically conflict-damaged; bounded host contracts are tested, but wholesale replacement is forbidden.
5. Mobile Maps architecture remains Leaflet/OSM/WebView/iframe; no `react-native-maps` revival.
6. `/section/maps` is the dedicated Maps world; per-section `?map=1` feeds are intentional, not duplicate cleanup targets.
7. Saved Search is preserved and must not be re-created from old Discover JSX.
8. "restore five Discover services" is too broad and is superseded as an execution instruction.
9. `marketCountryMapCenter`, nearest sort, draw-area and web clustering are restored/preserved, not current missing features.
10. Messenger logical-send idempotency, notification outbox, read/unread serialization and durable **text** outbox are preserved foundations; block/mute/realtime/voice/durable non-text are NEW_BUILD scope.
11. Company and enterprise require explicit product-policy treatment; enum presence or old prose does not prove a reachable current journey.
12. Android/iOS/provider/deployment uncertainty is `RUNTIME_UNPROVEN`, not automatic source failure.
13. Current red Actions with no executed steps cannot be reported as code-test failures.

## 3. Unique high-value finding from PR #10

### DB baseline-adoption authority — P0

PR #10 report 101 independently identifies a dangerous deployment/data-authority gap:

- baseline logic can treat a non-empty public DB as adoption-eligible;
- it can stamp migration hashes without executing the migration SQL;
- partial journals are not rejected strongly enough;
- a second invocation / future migration can be misclassified as already adopted;
- documentation currently carries equivalence requirements that the executable baseline path does not itself enforce fail-closed.

This is higher priority than UI/accessibility/Recent Search patches because migrations 0004–0007 carry FI lifecycle, billing durability, Messenger idempotency and Messenger notification-outbox guarantees.

**Joint classification:** `P0 — DATA/DEPLOYMENT AUTHORITY`.

No production DB adoption is allowed until this path is independently re-audited and repaired with RED/GREEN tests for partial journal, second invocation and future migration behavior.

## 4. Unique high-value findings from PR #11

### ACC-LIN-01 — Profile visible role consumer

Functional account decisions derive `role = meRole || clerkRole`, but the visible profile role pill can still read Clerk `publicMetadata.role` directly when no custom category label exists. Historical CA-OOM used the computed DB-first `role`.

Current static guard proves the computed role exists but does not prove the visible consumer uses it.

Classification: `CURRENT UI DEFECT + GUARD BLIND SPOT`.

### ACC-LIN-02 — post-delete Clerk signOut failure

Current delete flows suspend Messenger before server deletion. If server delete fails, resuming the outbox is correct.

But server deletion, local purge, push unregister, Clerk `signOut()` and navigation are currently enclosed by one outer catch. If `deleteAccount()` succeeds and the later Clerk `signOut()` fails, the catch calls `resumeAfterAccountDeletionFailure()` and re-enables Messenger processing although the account is already tombstoned.

Current Messenger teardown guard asserts the calls exist but does not enforce this semantic boundary.

Classification: `CURRENT IDENTITY/ORDERING DEFECT + GUARD BLIND SPOT`.

No patch is authorized until this reconciliation is accepted; when patched, RED tests must distinguish:
- delete API failed => resume allowed;
- delete API succeeded => resume forbidden forever, even if Clerk cleanup fails.

## 5. Unique bounded findings from PR #10 that remain lower priority

- Global Supply landing/index icon-only accessibility gap reproduces.
- Paymob route availability remains a hardening gap but requires provider retry/burst semantics before rate-limit policy.
- Observability implementation exists; the open work is guard/redaction protection, not a reporter rewrite.
- Recent Search visible chrome is a bounded candidate only after current-base reconstruction and exact executable proof; it must not become Discover-strip restoration.

## 6. Correct execution order after reconciliation

### Gate 0 — control plane
- keep canonical frozen;
- keep PR #9 release-only, PR #10 truth/report-only, PR #11 cross-repo/transition-only;
- reconcile every new parallel audit result into Issue #7.

### Gate 1 — P0 DB adoption authority
- audit `baseline.ts` + migration journal semantics on CURRENT source;
- RED: partial journal, re-run, future migration, non-equivalent DB;
- GREEN: fail-closed adoption contract;
- preserve migrations 0004–0007 and VNX migration authority.

### Gate 2 — identity/data correctness
- ACC-LIN-02 delete-success/signOut-failure semantics;
- ACC-LIN-01 Profile visible role consumer + stronger guard;
- exact-current PostgreSQL/API/account transition evidence.

### Gate 3 — release/native P0s
- restore real CI runner execution;
- immutable Docker provenance;
- Android API 36 / launcher-adaptive-monochrome / notification icon / FCM/EAS provenance;
- exact-SHA Docker/Compose/Coolify staging.

### Gate 4 — bounded product/accessibility candidates
- Global Supply accessibility;
- Recent Search chrome if still approved and reconstructed from current canonical;
- other section-specific issues only after current owner-law + producer/API/consumer proof.

### Gate 5 — live/device/provider certification
- Clerk, DB snapshot/restore, storage, Paymob, email/push, Maps provider;
- Android/iOS physical-device journeys;
- accessibility/i18n/RTL matrix;
- backup/restore + rollback rehearsal.

## 7. Non-negotiable preservation

- no whole-branch merges from historical recovery refs;
- no Discover five-strip restoration;
- no map-engine rewrite;
- no header rebuild;
- no `SectionSearchApp` wholesale rewrite;
- no Messenger foundation replacement;
- no enum deletion without policy + migration impact;
- no Product patch to hide CI-infrastructure red;
- no report deletion until unique findings are extracted and status supersession is explicit.

## 8. Joint verdict

The two parallel audits are complementary, not conflicting.

Current highest-risk order is now:

`DB BASELINE ADOPTION P0 → ACCOUNT TEARDOWN/ROLE AUTHORITY → CI/IMMUTABLE RELEASE/NATIVE API36 → bounded UX/a11y candidates → full live/device/provider certification`.

**Status:** `NO-GO / FORENSIC CONTROL PLANE CONVERGING / PRODUCT WRITE HOLD`.

Run npm run build.
