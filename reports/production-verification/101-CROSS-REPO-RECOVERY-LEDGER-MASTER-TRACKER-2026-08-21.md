# 101 — Cross-Repo Recovery Ledger: Master Tracker Open Capabilities

**Date:** 2026-08-21  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical branch:** `canonical/vnext-assembly`  
**Canonical audited head:** `4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Audit branch:** `audit/current-truth-20260821`  
**Authority mode:** forensic / read-only Product lock  
**Release state:** `NO-GO / AUDIT ACTIVE / PRODUCT PRESERVATION LOCKED`

---

## 0. Mission and hard boundary

This ledger continues the current forensic truth series after reports 97–100. Its purpose is not to create a new product plan from memory and not to replay an old agent report. It re-adjudicates the remaining open/deferred/lost claims in the historical `docs/audit/MASTER-TRACKER.md` against:

1. current canonical source,
2. current canonical Git ancestry,
3. preserved historical peak/recovery artifacts,
4. later manager reconciliation,
5. owner-law chronology already established by reports 97–100,
6. executable guards/tests where they exist,
7. explicit separation between source proof and live/runtime proof.

**No Product/API/Mobile code is modified by this batch.**

No branch is authorized for merge by this document. No historical branch is a merge source merely because it contains a feature. No old `FINAL`, `READY`, `CERTIFIED`, `OPEN`, `CLOSED`, `DEFERRED`, or `MISSING` label is accepted until rebound to current canonical source and chronology.

---

## 1. Chronology rule and the Thursday 22:00 marker

The owner supplied an important chronology marker: the organizing manager continued working with the team through approximately **Thursday 2026-08-20 22:00 Africa/Cairo**. That statement is accepted as owner-provided context.

Git can independently prove commit contents, ancestry, repository paths and commit timestamps. Git metadata **cannot prove which conversational agent identity physically produced a commit**. Therefore this ledger does not infer “same Codex manager” from an author name or SHA alone.

A later canonical sequence exists at:

- `26b1fc0f474764ff7cacf3d77b1a90d5c1180505` — safe clone-origin handling + OSM attribution;
- `64af93faf8cf8560497b2216f56e7b43852e0b06` — prior-manager-plan reconciliation;
- `1ccdbacc8db2abc5d9477b4e60daea6076bead56` — authoritative origin lock.

Their recorded Git times are later than the owner’s approximate 22:00 Cairo marker. They are therefore treated as **later evidence that must be classified by content and ancestry**, not silently attributed to a person. The `64af93f` reconciliation is valuable because its content preserves prior manager decisions and explicitly says historical reports are evidence rather than execution authority.

---

## 2. State vocabulary used in this ledger

| State | Meaning |
|---|---|
| `PRESERVED` | Current canonical contains the accepted capability and its lineage is not contradicted by newer owner law. |
| `RESTORED` | Historical loss/deferment is no longer true; later accepted work restored/implemented it. |
| `EXPANDED` | Current capability materially exceeds the historical implementation without evidence that the expansion violates owner law. |
| `PARTIAL` | Producer/data/API or consumer exists, but the complete user journey or presentation does not. |
| `PERSISTING_GAP` | Current source independently reproduces the historical gap. |
| `NEW_BUILD` | Not a recoverable lost merge; implementing it requires a new bounded design/policy/schema/API/UI batch. |
| `RUNTIME_UNPROVEN` | Source may be complete, but provider/device/deployed-environment evidence is absent. |
| `SUPERSEDED_LABEL` | Historical status text is stale even if the document remains valuable evidence. |
| `OWNER_POLICY_REQUIRED` | Code supports more than the currently reachable product, and a product-policy decision is required before adding/removing a path. |
| `HOLD` | Do not patch until lineage/governance or a higher-risk prerequisite is closed. |

---

## 3. Executive adjudication — what the old tracker got stale about

The old Master Tracker is useful chronology, but several of its “deferred/missing” statements are no longer current truth.

### 3.1 Maps: three historically deferred capabilities are now implemented

Historical tracker state included:

- draw-area / polygon selection deferred;
- `sort=nearest` deferred;
- full web viewport clusters deferred.

Current canonical contradicts those old labels:

#### Draw area / polygon — `RESTORED / PRESERVED`

Current map hosts use the shared geo-area contract (`artifacts/banco-mobile/lib/geoArea.ts`) and the web/native map family contains draw-mode / area bridge behavior. The VNX lineage includes `02149836f57fc60cb99d641abd116c499c7da480` (`fix(maps): restore honest draw-area parity`) followed by `444f944f099be9cf5329da7479f2c28cb557759f` (`freeze map draw-area integrity`).

**Do not rebuild polygon selection from old branches.**

Remaining proof: real device/WebView gesture behavior is runtime QA, not source recovery.

#### Nearest sort — `RESTORED / PRESERVED`

Current shared search contract and backend support `nearest`, near coordinates and radius. `SearchService` computes distance, uses nearest ordering only when coordinates exist, and falls back honestly when they do not.

Native `FilterSheet.tsx` exposes `nearest` as a real sort chip. It explicitly blocks selecting nearest without Near Me and offers to enable Near Me instead of silently sending an impossible sort.

Therefore the old “nearest deferred” label is **SUPERSEDED**.

#### Web viewport clusters — `RESTORED / PRESERVED`

Current `SearchResultsMap.web.tsx` is not a static pin dump. It uses the shared map-cluster API, viewport state, debounce/cache behavior and current map bridge/contracts.

Therefore the old “full web viewport clusters deferred” label is **SUPERSEDED**.

Remaining proof: provider/browser latency and large-result runtime remain `RUNTIME_UNPROVEN`.

### 3.2 Maps architecture remains owner-controlled Leaflet/WebView, not a rewrite candidate

Report 99 already established the current owner-law topology:

1. `/section/maps` = dedicated all-world buyer mini-app;
2. section `?map=1` = intentional local section map feed;
3. `MapPinPicker` = seller coordinate input.

These are separate surfaces that happen to share mapping capability. The accepted stack is the current Leaflet/OSM/WebView family plus server clustering. Historical/native-map alternatives are provenance, not permission to replace it.

`MAPS-01` tile-failure handling, which `64af93f` still listed as open, was subsequently addressed by canonical `5f44c865a1bc1459f78fc1b2482d47c2d2ae3b6d`. Therefore it is not a current first Product patch.

---

## 4. Discover: the old “five lost services” must be decomposed

The `64af93f` manager reconciliation correctly noticed that the old peak Discover had five presentation strips absent from current `SearchDiscover`. However, treating all five as one restore batch is now rejected. A strip disappearing is not the same as its underlying capability disappearing.

### 4.1 Recent searches — `PARTIAL / DATA LAYER PRESERVED / UI CANDIDATE UNPROMOTED`

Current `SessionContext.tsx` already owns:

- identity-scoped recent-query storage;
- `recentQueries` state;
- `recordQuery()`;
- case-insensitive dedupe;
- capped history;
- per-user/guest storage separation.

Current `SearchScreen` calls `recordQuery()` only for deliberate submits/suggestion taps, not every debounced half-typed query.

What is absent from canonical is the **visible recent-search chrome** on the Discover/search landing state.

Draft PR #5 (`fix/recent-search-chrome-20260821`, head `ddd464bb00782a29b28fb91af2fdbd89d08ceb7e`) is a bounded candidate for exactly that UI/wiring. It is not merged and explicitly forbids touching `SearchDiscover`, Saved Search authority, section routing or saved-search nav params.

**Current verdict:** do not call the feature wholly missing; do not merge PR #5 until its own current-base/exact-SHA executable evidence is re-established.

### 4.2 Saved Search — `PRESERVED / DO NOT RESTORE FROM OLD DISCOVER JSX`

Saved Search is a live current capability outside the removed Discover strip:

- `SearchScreen` has a real save-search action;
- `SessionContext` persists locally and uses server `POST /v1/me/saved-searches` / delete wiring;
- rich criteria snapshots are preserved;
- `SavedScreen` lists saved searches and replays them back into Search using shared nav-param serialization;
- the server alert pipeline has saved-search consumers.

Therefore “Saved Search disappeared because the old Discover strip disappeared” is false.

**Status: PRESERVED.** The old Discover strip is historical presentation, not an authority to duplicate this system.

### 4.3 Popular brands — `PRESERVED AS SEARCH CAPABILITY / DISCOVER STRIP ABSENT`

Current mobile Search still imports the canonical popular-brand dataset and derives quick brands that actually have live inventory. They are used in the active Search/filter experience and Section Search family.

The old Discover popular-brands strip itself is absent, but the capability is not lost.

**No wholesale restoration is authorized.** Any future Discover presentation needs a current UX decision proving it adds value without duplicating active Search chrome.

### 4.4 Recently viewed — `PARTIAL PRESENTATION / DATA CAPABILITY PRESERVED`

`SessionContext` owns identity-scoped `recentlyViewed` and `recordView`; current listing detail records real viewed items. What is not present is the historical Discover presentation strip consuming that state.

This is therefore **not data loss**. It is a presentation/placement question.

Status: `PARTIAL`, with Product patch `HOLD` until current Discover information hierarchy is explicitly approved.

### 4.5 Trending — `NOT RECOVERABLE AS A BLIND MOBILE STRIP`

Historical removed JSX exists. Current repository also has trending concepts in web/home/search/backend domains, but current `SearchDiscover` does not expose the old mobile strip.

The investigation has not found evidence that current owner law requires the historical strip to return verbatim, nor evidence that its old ranking/data source is the current intended mobile authority.

Status: `OWNER_POLICY_REQUIRED / HOLD`, not “missing merge”.

### 4.6 Discover conclusion

The previous phrase **“restore five services” is too broad and is superseded as an execution instruction**.

The five capabilities now classify as:

| Capability | Current state |
|---|---|
| Recent searches | `PARTIAL`; data/writer preserved; bounded draft UI candidate exists |
| Saved Search | `PRESERVED`; current save/replay/server path exists |
| Popular brands | `PRESERVED` in active Search; old Discover strip absent |
| Recently viewed | `PARTIAL`; producer/storage preserved; old Discover strip absent |
| Trending | `OWNER_POLICY_REQUIRED`; no blind old-JSX restore |

---

## 5. Accounts: four product families, DB roles, and two stale assumptions

### 5.1 Four user-facing account families — `PRESERVED`

Current Profile offers four product families:

- Individual;
- BANCO Business;
- Bank;
- Funder.

Bank and Funder deliberately map to the backend `financial_institution` role and branch in FI onboarding by regulatory intent/type. This is not a missing fourth/fifth DB-role bug.

### 5.2 Company — API-supported, but new native creation is not currently exposed

Current `UserService.updateUserProfile()` accepts `account_type: company` and can persist the DB `company` role.

However current Profile maps a **new** BANCO Business choice to `dealer`; it only preserves `company` if the current authoritative DB role is already `company`. Business onboarding normally omits `account_type` for the non-FI path so the server preserves an existing elevated role or maps a new ordinary business to dealer.

Therefore:

- backend capability: `PRESERVED`;
- native creation path for a new `company`: `UNREACHABLE CURRENTLY`;
- deleting the enum: **not authorized**;
- inventing a company picker now: **not authorized without owner policy**.

Status: `OWNER_POLICY_REQUIRED`.

### 5.3 Enterprise — historical “admin-assigned by design” is not proven by current code

`enterprise` exists in the DB role enum and downstream business-role logic.

But current `PATCH /me` input does not accept `enterprise`, and current Admin `setUserRole()` changes the separate **staff role** (`owner/admin/moderator/support/user`), not the business/account role.

No current production creation path was established by this audit.

Therefore the RC-era statement “Enterprise is admin-assigned by design” is **not accepted as current executable truth** merely because a historical Known Limitations file says so.

Status: `OWNER_POLICY_REQUIRED / UNREACHABLE CURRENTLY`.

### 5.4 Profile role display — `PARTIAL`, carried from report 100

The DB `/me` role is already the functional authority in important current decisions, but report 100 proved the visible role/category pill still has a Clerk-metadata fallback path. That remains a bounded consumer-authority defect; it is not permission to rewrite Account onboarding.

---

## 6. Messenger: distinguish recovered foundations from genuinely new scope

The historical Messenger/Maps recovery ledger correctly described a weak point-in-time baseline. Later VNX work materially changed that truth.

### 6.1 Client logical-send idempotency — `RESTORED / PRESERVED`

Current source has `messages.client_message_id`, a uniqueness boundary scoped by conversation + sender + client message id, and server retry logic returns the already-committed logical message rather than incrementing unread/notifications twice.

This is later accepted work, not an open historical loss.

### 6.2 Read/unread serialization — `RESTORED / PRESERVED`

Send and mark-read operations share conversation row locking. The VNX lineage includes the accepted read/unread serialization and timestamp-projection corrections.

Do not replace this with a new counter model without a reproduced current defect.

### 6.3 Durable server notification outbox — `RESTORED / PRESERVED`

Message notification work is committed in the same server transaction as the message/unread projection and drained by an advisory-locked scheduled worker with retry/channel checkpoints.

Historical “notification can be lost after process stop” claims are stale for this accepted path.

### 6.4 Durable client TEXT outbox — `RESTORED / PRESERVED`

Current `messageTextOutbox.ts` is account-scoped and maintains queue/retry/failure/hold semantics around stable `clientMessageId` values. It is a real offline/retry foundation for **text** sends.

Therefore the old statement “offline send queue absent” is stale if applied to text.

### 6.5 Advanced Messenger — `NEW_BUILD`, not recovery

Still not accepted as a recoverable missing branch:

- block/mute;
- realtime typing transport;
- voice recording pipeline;
- durable offline non-text/media queue equivalent to the text outbox.

These need separate policy/schema/API/UI/abuse/privacy design. Existing attachment support does not magically prove durable offline media replay.

**Do not search for an old branch and merge these wholesale.**

---

## 7. Car Import: source capability expanded; live journey still unproven

The old tracker said the import subsystem had DB/API/service/routes/request/tracking/notifications but had not been exercised E2E against a running API/DB.

Current source is materially richer:

- `/import` is now a dedicated mini-app front door;
- current hub exposes nine real destinations/capabilities, including search, auctions, shipping/customs tools, order tracking, documents, imports and support;
- current Discover routes to the dedicated `/import` hub;
- the historical peak repo `-BANCO-CA-OOM-` instead routed Car Import directly to the Cars mini-app with `?engine=import`.

This proves current capability is an **evolution/expansion**, not evidence that the older direct route should be restored.

Status:

- source/router/product topology: `EXPANDED / PRESERVED`;
- live create → API → DB → admin/stage → notification → tracking journey: `RUNTIME_UNPROVEN` from this audit.

No Car Import rewrite is authorized.

---

## 8. Global Supply: a historical accessibility gap still reproduces

The old tracker explicitly called out missing accessibility labels on icon-only controls in Global Supply.

Current `artifacts/banco-mobile/app/business/global-supply/index.tsx` still contains icon-driven `Pressable` controls (including navigation/create actions) with test IDs but without corresponding `accessibilityRole` / `accessibilityLabel` coverage at those controls.

This is not a recovered capability and not a runtime-only concern.

Status: `PERSISTING_GAP`.

Important scope rule: this finding is currently proven for the inspected Global Supply landing/index controls. It must not be inflated into a claim that every Global Supply subpage has the same defect without inspecting each subpage.

Candidate class: small native accessibility patch, but still **HOLD** until the entire recovery ledger is accepted and higher-risk P0 lanes are ordered.

---

## 9. Search / Maps shared filtering: current implementation is stronger than old tracker labels

Current Search now has:

- market-country as a real DB-backed filter;
- Near Me coordinates/radius;
- nearest sort with UI honesty guard;
- current map/list shared criteria;
- rich saved-search criteria replay;
- facet-gated section/filter axes;
- per-section Search mini-app topology rather than one melted generic surface.

Therefore old reports that call these entire capabilities “missing” must be narrowed to the exact consumer/surface that was missing at their SHA.

This is a standing anti-regression rule: **never delete a current shared criterion because one historical UI did not expose it.**

---

## 10. Payments: source integrity and availability are different gates

Current payment routes still expose:

- `POST /v1/payments/webhook` — public transport, HMAC-authenticated in handler;
- `GET /v1/payments/return` — public informational redirect.

No route-level limiter is present in `routes/v1/payments.ts`.

This preserves the `64af93f` finding: settlement integrity and route availability are separate. A generic limiter must not be added blindly because legitimate Paymob retries/bursts can be financially significant.

Status: `PERSISTING_HARDENING_GAP / PROVIDER_SEMANTICS_REQUIRED`.

Live signed success/decline/refund/void/replay/inquiry remains `RUNTIME_UNPROVEN`.

---

## 11. Observability: implementation exists; protection boundary is narrower than implementation

Current API has error-reporter implementation, tests, middleware/runtime wiring and runbook material. This audit did not reproduce a claim that observability is absent.

The manager’s `OBS-01` classification therefore remains the correct shape: the open item is protection/guard coverage around critical wiring and redaction, not permission to refactor the reporter.

Status: `HARDENING / NO PRODUCT DELTA`.

Any future batch should add executable assertions/tests first and keep runtime semantics unchanged unless a current defect is reproduced.

---

## 12. Database adoption is a separate P0 lane and must not be hidden inside recovery work

The immediately preceding forensic DB audit found a higher-risk deployment-authority problem independent of the product capability ledger:

- `baseline.ts` treats any non-empty public DB as baseline-eligible;
- it stamps every migration hash not already recorded without executing that SQL;
- it does not reject a partial migration journal;
- it can therefore be re-run after future migrations and falsely mark a new migration applied;
- schema equivalence and DML postconditions are documented operator requirements, not enforced by the baseline code itself.

This matters directly to the recovered capability chain because:

- `0004` contains FI lifecycle reconciliation/backfill;
- `0005` carries billing receipt durability;
- `0006` carries Messenger logical-send idempotency;
- `0007` carries durable message-notification outbox.

A false migration journal can therefore make recovered source code appear deployed while its DB guarantees are missing.

Status: **`P0 — BASELINE ADOPTION AUTHORITY`**.

This remains separate from Discover/Maps/Global-Supply Product work and should be closed before production DB adoption.

---

## 13. Runtime/external gates that are NOT “lost capabilities”

The following must never be turned into speculative code patches merely because static evidence cannot mark them PASS:

- live Clerk tenant/provider/redirect/MFA/account switching/deletion;
- production PostgreSQL snapshot equivalence and adoption;
- live private object-storage finalize/serve/ownership behavior;
- Paymob signed settlement/reversal/reconciliation behavior;
- actual push/email delivery, token invalidation and provider retry behavior;
- Maps provider/WebView/device accessibility, gesture and latency behavior;
- Docker/Compose/Coolify migration ordering, restart, health, immutable image and rollback;
- backup/restore drill;
- signed EAS Android/iOS builds;
- physical-device navigation, keyboard, safe-area, permissions, camera/gallery/GPS/push;
- Google Play / App Store package/listing/account ownership.

Classification: `RUNTIME_UNPROVEN`, not `SOURCE_MISSING`.

---

## 14. Cross-repo recovery decisions — current adjudicated table

| Historical claim/capability | Current verdict | Action |
|---|---|---|
| Maps draw-area/polygon deferred | `RESTORED / PRESERVED` | Protect; device QA only |
| `sort=nearest` deferred | `RESTORED / PRESERVED` | Protect; no rebuild |
| full web viewport clusters deferred | `RESTORED / PRESERVED` | Protect; runtime scale QA |
| Maps tile failure missing | `CLOSED` by later canonical work | Do not reopen without repro |
| Recent searches lost | `PARTIAL`; data writer/storage current, UI candidate unmerged | Evaluate PR #5 only after exact-SHA gates |
| Saved Search lost | `FALSE AS CAPABILITY`; current save/server/replay path exists | Do not restore old Discover JSX |
| Popular brands lost | `FALSE AS CAPABILITY`; active Search owns it | Discover placement requires UX authority |
| Recently viewed lost | `PARTIAL`; producer/storage current, old strip absent | HOLD placement decision |
| Trending strip lost | historical presentation exists, current authority unclear | `OWNER_POLICY_REQUIRED` |
| Company account absent | backend supports it; new native creation path not exposed | `OWNER_POLICY_REQUIRED` |
| Enterprise admin-assigned | not proven by current executable code | `OWNER_POLICY_REQUIRED`; do not delete enum |
| Messenger client idempotency missing | `RESTORED / PRESERVED` | Protect |
| Messenger offline text queue missing | `RESTORED / PRESERVED` | Protect |
| Messenger durable notifications missing | `RESTORED / PRESERVED` | Protect |
| Messenger block/mute/typing/voice/non-text offline | `NEW_BUILD` | ADR/policy/schema/API/UI later |
| Car Import weak/direct route | current dedicated hub is `EXPANDED` | Preserve; live E2E still unproven |
| Global Supply icon a11y gap | `PERSISTING_GAP` on inspected index | Small future native patch after ordering |
| Payments route availability | `PERSISTING_HARDENING_GAP` | Need provider retry semantics first |
| Observability absent | not reproduced | Guard/hardening only |
| DB migration adoption safe because docs say so | false safety assumption | `P0` executable fail-closed adoption fix |

---

## 15. False-claim patterns to prevent across all engineers

### Pattern A — “not visible in this screen” → “feature lost”

Wrong. Saved Search and popular brands demonstrate why. Trace producer → persistence/API → consumer(s) before declaring loss.

### Pattern B — old `DEFERRED` → still deferred today

Wrong. Draw-area, nearest and web clusters were implemented later.

### Pattern C — old branch has richer code → merge it

Wrong. Current Car Import demonstrates legitimate evolution away from an older direct route. Use old code as provenance only.

### Pattern D — static source complete → production PASS

Wrong. Car Import live E2E, external providers, devices, deployment and database adoption remain independent proof layers.

### Pattern E — enum exists → user journey exists

Wrong. `company` and `enterprise` demonstrate schema capability vs reachable product policy.

### Pattern F — historical report says “admin-assigned by design” → current admin route does it

Wrong until current API/service/UI proves that exact business-role mutation. Current Admin role mutation is for the separate staff-role axis.

### Pattern G — documentation says “run once” → destructive/authoritative CLI is safe

Wrong. `baseline.ts` must itself fail closed against re-run/partial-journal/future-migration stamping.

---

## 16. Preservation orders for all engineers

Until a new owner/manager ruling supersedes this ledger:

1. No Product patch from this report is automatically authorized.
2. No reset, force-push, whole-branch merge, mass cherry-pick, folder deletion or architecture rewrite.
3. Do not restore historical Discover JSX wholesale.
4. Do not replace the current Leaflet/OSM/WebView architecture.
5. Do not collapse the dedicated Maps mini-app into section maps or delete intentional section map feeds.
6. Do not rebuild the five section headers from an older branch without a current reproduced regression and lineage proof.
7. Do not replace accepted Messenger idempotency/outbox/read-unread work.
8. Do not call advanced Messenger a recovery task; it is new-build scope.
9. Do not remove `company` or `enterprise` enum values without explicit product policy plus migration impact analysis.
10. Do not treat `isAdmin/staff_role` as the same axis as user/business account role.
11. Do not add a naive public limiter to Paymob settlement without proving provider retry/burst behavior.
12. Do not baseline any existing DB until executable adoption safety is corrected and live equivalence is independently established.
13. Every later patch must name exact producer, persistence/API contract, consumers, tests/guards, runtime gates, parent SHA and changed paths.

---

## 17. Recommended execution order from current reality

This is ordering guidance, not Product authorization:

### Gate 0 — preserve canonical and finish forensic control plane

- keep canonical frozen;
- append this ledger to the audit branch;
- reconcile it into Issue #7;
- no Product patch during adjudication.

### Gate 1 — P0 deployment/data authority

Close `BASELINE-ADOPTION-P0` fail-closed, with tests for:

- empty DB rejection;
- existing full pre-journal DB only after explicit equivalence proof boundary;
- partial journal rejection;
- second baseline invocation rejection;
- future migration must remain pending after prior adoption;
- FI 0004 DML postconditions;
- Billing 0005 structures/uniqueness;
- Messenger 0006 uniqueness;
- Messenger 0007 durable-outbox structures.

### Gate 2 — no-product-delta protection gaps

- observability guard/redaction assertions;
- migration/readiness assertions for actual critical constraints, not only table existence;
- current report/ledger reconciliation.

### Gate 3 — first bounded Product candidate only after owner/manager order

Potential small candidates identified by evidence, **not yet authorized**:

- Profile visible role authority consumer correction (report 100);
- Global Supply index accessibility labels;
- Recent Search chrome candidate PR #5 after rebase/current-base/exact-SHA executable proof.

These must not be bundled together.

### Gate 4 — runtime/product journeys by subsystem

After source authority is stable, verify separately:

- Accounts × four families;
- each of the ten mini-app/portal worlds;
- Messenger;
- Notifications;
- Maps;
- Car Import;
- FI;
- Billing/Payments;
- BANCO Admin;
- BANCO Market/Dealer;
- Web surfaces.

### Gate 5 — deployment and signed native release

Docker/Compose/Coolify → DB migrate/adoption → providers → backup/restore/rollback → exact-SHA CI → EAS Android/iOS → physical-device journeys → store validation.

---

## 18. Current release verdict

**NO-GO remains correct.**

This is not because the product is broadly “lost”. The opposite is now source-proven: many capabilities previously described as missing/deferred were restored or expanded, and blindly recovering them again would create regressions.

The present risk is control-plane accuracy:

- stale report labels;
- partial consumer-authority gaps;
- a dangerous baseline-adoption boundary;
- unproven runtime/provider/device/deployment gates;
- and a small number of real bounded source gaps that must not be mixed across domains.

The first safe outcome of this ledger is therefore **not a Product patch**. It is a shared, append-only classification that stops agents from rebuilding preserved work, merging historical branches wholesale, or upgrading runtime uncertainty into imaginary source defects.

**Run npm run build**
