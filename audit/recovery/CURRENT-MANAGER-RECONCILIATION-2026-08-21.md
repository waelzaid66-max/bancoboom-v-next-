# BANCO vNext — Current Manager Reconciliation

**Date:** 2026-08-21
**Canonical branch:** `canonical/vnext-assembly`
**Canonical head before this record:** `26b1fc0f474764ff7cacf3d77b1a90d5c1180505`

This document is append-only reconciliation. It does not replace or delete prior manager reports. Historical reports remain evidence. Current Git ancestry, current source, exact commit comparisons, and executable gates are the authority.

## 1. Preservation verdict

The prior managers' accepted VNX implementation is preserved in the canonical ancestry. No recovery branch should be blindly merged or cherry-picked.

Direct ancestry checks against current canonical prove `behind_by = 0` for representative control points spanning the previous program:

- `recovery/vnx-03-messenger-notification-outbox` at `38697ea8566139415b58d6dc28d7392a73c4cfc4`
- `recovery/vnx-05-booking-stays-contracts` at `a7aa3a6824f1d16a570dcd1c823701caafe386df`
- `recovery/vnx-06-map-criteria-integrity` at `290039db82f9c0ae927702f93b69ded92e8527b2`
- `recovery/vnx-07-messenger-durable-text-outbox` at `5c2631a94408a509b7ea35dde972ae31d75e9f76`
- VNX-07B accepted head `2e659bbad94f7999b346b96b0bcd6f9127cf492b` is an ancestor of the canonical line via `f45c32c`.

Therefore the canonical line preserves the accepted Messenger, section-header, Booking Stay, Maps, build-scheduling and migration-authority work. Historical branch survival is rollback/provenance, not evidence of missing promotion.

## 2. Changes integrated after the previous canonical handoff

### Dependency security C-5 — CLOSED

Canonical now contains `76f7f26afe57db466e16f0d6bbeda9600daeaf16`.

The unsafe stale targeted nanoid pin was replaced by the bounded `nanoid: '>=3.3.18 <4'` override. Security override upper bounds for tar, qs and uuid are explicit. This preserves the accepted fix while avoiding the ESM-major re-resolution trap documented by the later audit.

### Safe maintenance batch — CLOSED

Canonical now contains `26b1fc0f474764ff7cacf3d77b1a90d5c1180505` on top of `76f7f26`.

The exact blobs from `maint/safe-batch-01` were promoted without merging its diverged history:

- `artifacts/banco-mobile/components/search/mapHtml.ts` — OSM attribution correction
- `scripts/workspace-verify.mjs` — accept legitimate GitHub clone URLs with or without `.git`

No dependency fix was overwritten.

## 3. CI interpretation

Two zero-diff CI-only pull requests were used to request the canonical workflow. Both runs returned all seven jobs as failed before any job step was exposed or executed. Job step arrays were empty and the runs terminated in seconds.

This is not accepted as evidence of seven source regressions. Until GitHub Actions starts a runner and produces executable steps/logs, this is classified as `CI_INFRASTRUCTURE_UNRESOLVED`, not `PRODUCT_FAIL`.

Do not modify product source merely to make this pre-execution failure disappear.

## 4. Report-family adjudication

### 2026-08-08 bug reports

Useful as historical leads only. Later VNX batches and current ancestry supersede their raw OPEN/CLOSED labels.

### 2026-08-09 master stabilization / RC1 / corrective plan

Architectural rules remain controlling where not superseded: no blind merges, exact-SHA evidence, committed migrations, external-provider proof, device proof, rollback proof. Many source defects listed there were later closed by VNX batches. Live Clerk, Paymob, storage, deployment, signed devices and rollback remain external/runtime gates.

### 2026-08-10 forensic ledgers

Provenance remains useful, but status columns are stale in several places. In particular VNX-07B is no longer pending canonical promotion. Some older ORPHANED/MUTATED rows were subsequently repaired by VNX-01 and later batches.

### 2026-08-11 independent production audit / scale study

Treat as measurement against its recorded commit only. Findings that depend on current source must be rechecked before action. Do not merge the audit branch wholesale.

### 2026-08-14 investigation handoffs

C-5 and the safe maintenance findings have now been acted on. Discover, Accounts and Maps claims are retained only where current source corroborates them.

### 2026-08-20 handoff / forensic reports

These are not execution authority. Their actionable claims were independently rechecked against current source before inclusion below.

## 5. Current open work — source-proven

### MAPS-01 — tile failure state

`mapHtml.ts` uses OSM tiles and the vendored Leaflet code can emit `tileerror`, but project source has no tile-layer `tileerror` subscription. Native `SearchResultsMap.tsx` treats generic `error` the same as `ready`, which can hide the loader and leave a grey map without user explanation. This is a bounded source defect.

Required batch: dedicated tile-failure bridge event, native/web user-visible failure state, render/contract coverage. Do not change the tile provider in this batch.

### DISCOVER-01 — five capability restore

Current `SearchDiscover` does not expose the five peak capabilities: recent searches, popular brands, saved searches, trending, recently viewed. Preserved peak source and removed JSX exist in-repo, while i18n/styles/parent handlers substantially survive.

Two guards intentionally forbid the previous restore prop surface. This is a governance conflict, not permission to delete guards. Before restoration, the manager must define a single saved-search restoration authority so Discover does not compete with the existing nav-param path. Then amend the guards with replacement assertions in the same bounded batch.

### ACCOUNTS-01 — runtime matrix and unreachable enum values

Source supports the four UI account families, but live Clerk/KYC/device lifecycle remains unverified. `company` is accepted by API/DB but no shipped client grants it; `enterprise` has no production creation path. Treat both as one product-policy decision. Do not remove enum values without a migration.

### MESSENGER-01 — VNX-07C is new-build scope

Accepted Messenger foundations are preserved. Block/mute, realtime typing transport, voice notes and durable non-text flows are not recoverable from the accepted history and must not be described as a missing merge. Build as independent policy/schema/API/UI batches after ADRs and abuse/privacy rules.

### PAYMENTS-01 — settlement-path availability

Current `routes/v1/payments.ts` exposes `/webhook` and `/return` without a route/router limiter. HMAC verification protects integrity; the residual issue is availability. Do not add a generic public limiter without proving Paymob retry/burst semantics, because a naive 429 policy can discard legitimate settlement retries.

### OBS-01 — observability guard coverage

Existing error reporting/wiring is not currently classified as broken. The protection gap is that critical reporter wiring/redaction is not pinned by the current chain. Add assertions/tests only as a separate no-product-delta hardening batch; do not refactor the reporter during that batch.

## 6. Current open work — runtime/external proof

These remain NO-GO boundaries regardless of source completeness:

- live Clerk tenant, redirects, social providers, account deletion and two-account switching
- live PostgreSQL adoption/equivalence on the deployment target
- live object-storage finalization/private-media journeys
- Paymob signed success/decline/void/refund/replay/inquiry and ledger reconciliation
- Docker/Compose/Coolify staging, migration order, restart, backup, restore and rollback
- Android/iOS signed EAS builds and physical-device journeys
- browser/WebView Maps provider behavior, accessibility, latency and large-result behavior
- push/email provider delivery and dead-token/retry behavior
- store package/listing ownership verification

No static audit may upgrade these to PASS.

## 7. Execution order

1. Keep current canonical frozen except for one bounded batch at a time. First source batch: MAPS-01 tile failure state, because C-5 and the safe maintenance fixes are already integrated and this is the smallest confirmed user-visible source defect.
2. Restore exact executable CI once GitHub Actions can start runners; run the full seven-job workflow on the exact resulting SHA. A pre-step Actions failure is tracked separately from source status.
3. Continue the prior program rather than replacing it: account runtime proof, Discover governance/restore, publishing/media runtime, payments, Admin/Dealer/Web E2E, then Docker/Coolify/release/device certification. Advanced Messenger remains independent new-build scope.

## 8. Non-negotiable preservation rules

- No reset, force-push, whole-branch merge, mass cherry-pick, folder deletion or architecture rewrite.
- No previously green VNX batch is reopened without a reproduced defect on current canonical.
- No historical report is deleted to make status look cleaner. New reconciliation supersedes status while preserving evidence.
- Every promotion records exact parent, exact changed paths, verification evidence and unproven external gates.
- Product source, audit evidence and runtime certification are different layers and must remain labeled separately.
