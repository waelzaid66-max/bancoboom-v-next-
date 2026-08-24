# BANCO vNEXT — MAPS P0 TEAM RECONCILIATION

Date: 2026-08-24

## 1. Scope and immutable evidence boundary

This audit is bound to the immutable P0 receiving snapshot:

- Repository: `waelzaid66-max/bancoboom-v-next-`
- Receiving branch at snapshot: `integration/p0-reconciliation-20260824`
- Snapshot SHA: `5c919cd32347abddd8d6157d1d63cf1f4915b6f3`
- Canonical ref identity at that checkpoint: `canonical/vnext-assembly@6d83cb57e94dcd3cc7085daf0da27a6bc91e3a8c`

This file is an audit/coordination artifact only. It is not Product source, an integration receiving tree, a release branch, or executable acceptance evidence.

Any branch movement after the snapshot must be reconciled by exact SHA and changed-path census before this ledger is treated as current.

## 2. Principal finding

The Maps program is not blocked by one undifferentiated "Maps issue". It is split into distinct authorities that must not be merged, fixed, or tested as one broad branch:

1. native browse map bootstrap within one WebView epoch;
2. native browse map source-epoch reset;
3. web browse map bootstrap fail-close parity;
4. create-listing MapPinPicker bootstrap fail-close;
5. API map-pin currency authority;
6. final provider, device, capacity, attribution, and release provenance.

Conflating these lanes would recreate exactly the failure mode the current program is designed to prevent: broad Product churn with no proof of which defect was closed.

## 3. Agent attribution limitation

GitHub history in this repository is written through the shared account `waelzaid66-max`. Therefore GitHub actor metadata alone cannot prove whether a change was authored by Claude, Codex, another agent, or a human operator.

Agent performance must be audited by artifacts, not by claimed identity. Each future handoff must state:

- `AGENT_ID` or execution lane name;
- exact parent SHA;
- exact head SHA;
- owned paths;
- complete changed-file census;
- commands actually executed;
- test counts and exact failures;
- untested boundaries;
- collision check against the current receiving tree;
- whether the work is RED-only, Product candidate, integration, or release evidence.

A message that says only "done", "fixed", "tested", or "build passed" is non-evidence.

## 4. Authority ledger at the snapshot

### 4.1 PR #100 — current P0 Product receiving tree at the checkpoint

Authority:

- Accounts / MessageOutbox terminal account-deletion preservation;
- native browse `SearchResultsMap` fail-closed bootstrap candidate;
- Android API 36 source candidate;
- Auth `ACCOUNT_DELETED` session-generation candidate;
- create-listing `MapPinPicker` bootstrap candidate.

Binding rule:

- this is the only P0 Product receiving tree at the checkpoint;
- it is not Release/Deploy authority;
- draft/mergeable Git state is not acceptance;
- no merge or deployment is authorized while mounted execution and final build/device gates remain open.

Known acceptance gaps at the checkpoint:

- native map static guard false-red caused by a meaningless no-op setter in `tile_error`;
- MapPinPicker mounted execution missing;
- native source-epoch reset defect open;
- broader exact-head Jest/typecheck/export/root-build evidence open.

### 4.2 PR #106 — native browse map source-epoch RED

Owned path:

- `artifacts/banco-mobile/tests/render/SearchResultsMap.bootstrap-source-epoch.red.test.tsx`

Purpose:

- prove that a same-marker HTML/source rebuild must create a new bootstrap epoch;
- ready from the old source may not remain ready for the new source;
- failed from the old source may not poison a valid new source;
- a fresh bridge `ready` is required for the new epoch;
- terminal failure remains terminal only inside one unchanged source epoch.

Classification:

- source-bounded RED contract;
- Product write remains blocked until the exact test reaches assertions and fails for the intended stale-state reason.

### 4.3 PR #104 — web browse map bootstrap RED

Owned paths:

- `artifacts/banco-mobile/tests/map-web-bootstrap-failclose-red.test.mjs`
- `artifacts/banco-mobile/tests/render/SearchResultsMap.web.bootstrap-failclose.red.test.tsx`

Purpose:

- explicit web loading/ready/failed authority;
- trusted bridge-source fencing;
- error terminality;
- localized unavailable UI;
- ready-gated overlay chrome;
- marker-signature reset;
- preservation of tile-error alert-once and existing viewport/area/select/draw/locate behavior.

Important reconciliation:

- a stale PR-body head is not acceptable bookkeeping;
- however, an older immutable snapshot does not invalidate the RED if the audited Product blob is byte-identical to the current receiving tree;
- body/head identity must still be corrected before execution or Product authorization.

Classification:

- test-only;
- no web Product write until mounted RED execution is captured and independently reviewed.

### 4.4 PR #107 — MapPinPicker mounted acceptance

Owned path:

- `artifacts/banco-mobile/tests/render/MapPinPicker.bootstrap-failclose.render.test.tsx`

Purpose:

- loading state is explicit;
- seeded initial coordinate is not confirmable before ready;
- bootstrap error renders unavailable UI;
- failed state disables confirmation;
- pressing the disabled action cannot call `onConfirm`;
- late ready cannot revive failed;
- malformed bridge data is safe;
- normal ready -> center -> confirm preserves the selected coordinate;
- market reframe and reopen reset to loading.

Classification:

- expected GREEN from source comparison only;
- runtime GREEN remains unproven until exact-head Jest execution;
- do not absorb into PR #100 merely because the source appears compatible.

### 4.5 PR #99 — API map-pin currency authority RED

Owned Product target after RED acceptance:

- the bounded map-price formatting hunk inside `artifacts/api-server/src/services/SearchService.ts`.

Source-proven defect:

- map single-pin formatting uses a local `MAP_CURRENCIES` authority;
- shared market taxonomy is the platform currency source of truth;
- valid persisted currencies supported by the shared taxonomy can be relabeled as EGP only on the map;
- this can make one listing display different money identity between card/detail and map.

Future Product law:

- use the shared listing-currency normalizer;
- remove the map-only allowlist;
- preserve `basePriceCash` plus `specs.currency` selection;
- preserve price-requested semantics;
- preserve rent-term suffixes;
- no DB/schema/migration/OpenAPI/mobile/provider/release expansion.

Classification:

- test/source defect evidence only until current collision review and executable acceptance are complete.

### 4.6 PR #68 — CAR header Product lane

Owned Product targets:

- `artifacts/banco-mobile/components/search/SectionSearchApp.tsx`
- `artifacts/banco-mobile/components/search/car/CarsHomeHeader.tsx`

Relationship to Maps:

- CAR is owner-visible P0 work but is not a Maps Product lane;
- it must preserve the existing map/list seat and mounted `SearchResultsMap` behavior;
- it must not absorb any native/web Map Product correction;
- current P0 receiver at this checkpoint is PR #100, not historical PR #72.

Classification:

- pre-Product audit/RED tree at the last verified checkpoint;
- exactly one bounded two-file true-local-hunk Product commit remains the authorized shape;
- no whole-file reconstruction or third Product path.

### 4.7 PR #9 — release/deployment authority

Relationship to this program:

- Maps Product branches do not own release manifests, Coolify, Docker, immutable image provenance, EAS submission, or production deployment;
- final accepted Maps Product must later be rebound into the final release candidate and proven on the exact release SHA.

## 5. Changed-path collision matrix

| Surface | Current owner | Forbidden parallel writer |
|---|---|---|
| Native browse bootstrap Product | PR #100 / future accepted #106 hunk | #104, #107, #68, #99 |
| Native source-epoch mounted RED | PR #106 | competing native source-epoch test |
| Web browse bootstrap RED/Product | PR #104 | #100 native lane, #106, #107 |
| MapPinPicker Product | PR #100 | #98 old lane, #104, #106 |
| MapPinPicker mounted acceptance | PR #107 | competing mounted picker test |
| API map-pin currency | PR #99 | mobile map/Product branches |
| CAR host layout | PR #68 | Maps/API branches |
| Release/deploy | PR #9 | every Product/test lane |
| Mobile `package.json` test union | final integration manager only | wholesale branch selection |

## 6. Audit findings on team execution

### Finding A — source correctness was repeatedly over-read as runtime acceptance

A source hunk can be directionally correct while the mounted test still fails because of Modal behavior, effect timing, mocked bridge delivery, disabled Pressable semantics, stale closures, or repository test configuration.

Correction:

- classify source review and executable acceptance separately;
- never write `PASS` where only regex/static/source comparison was run.

### Finding B — moving integration branches made child evidence stale

A child PR based on a moving Product branch can silently compare against a newer base and hide the actual reviewed snapshot.

Correction:

- use immutable snapshot branches for acceptance packets;
- record exact Product blob identities;
- rebind only when the owned Product file changes, not for cosmetic ancestry.

### Finding C — old PR bodies retained superseded SHAs

A correct final diff with a stale body still creates operational ambiguity and can cause another agent to write from the wrong parent.

Correction:

- PR body must be rebound after every accepted head movement;
- historical SHAs stay in comments as history, not as the declared current head.

### Finding D — test-only lanes can still collide semantically

Different test paths may encode incompatible Product laws even when Git reports zero file intersection.

Correction:

- review behavioral contracts, not only filenames;
- within-one-epoch terminality and new-source reset must coexist;
- web and native parity must not erase platform-specific bridge-source fencing.

### Finding E — historical receiving PR #72 remained in some handoffs

Continuing to refer to #72 as current creates a false integration target after #100 was established from current canonical ancestry.

Correction:

- #72 is historical assembly evidence;
- all new accepted hunks must be reconciled against the actual current receiver and canonical head before write.

### Finding F — hosted red badges remain non-evidence without steps/logs

A failed workflow object with no executable step/log evidence does not prove Product failure. It also does not prove Product success.

Correction:

- do not mutate Product to satisfy opaque hosted red badges;
- restore an authoritative executor or obtain exact-head local/controlled execution;
- keep release NO-GO until command evidence exists.

## 7. Binding execution order

The Maps program must close in this order unless new current evidence changes ownership:

1. Reconcile current GitHub heads and changed paths against this immutable snapshot.
2. Execute PR #106 mounted RED and confirm intended failure.
3. Execute PR #104 static plus mounted RED and confirm intended web failure.
4. Execute PR #107 mounted acceptance against the exact current MapPinPicker Product bytes.
5. Remove the native `tile_error` semantic no-op only if the current source still contains it; rerun the stronger static guard.
6. Author one bounded native source-epoch Product hunk after #106 RED acceptance.
7. Author one bounded web bootstrap Product hunk after #104 RED acceptance.
8. Author one bounded API currency-authority Product hunk after #99 RED/current-collision acceptance.
9. Integrate one reviewed batch at a time into the current receiving tree with complete before/after path census.
10. Run focused mounted/static suites, mobile aggregate/render/typecheck, API typecheck/build, Expo export, affected web/admin/dealer builds, and root `npm run build` on one exact clean candidate.
11. Bind final AAB/IPA/device/provider/capacity/attribution evidence to the release SHA.

## 8. Stop conditions

Stop immediately and re-audit before any Product write if:

- PR #100 head moved and the owned Product blob changed;
- a second agent touched an owned Product path;
- a RED test fails in setup rather than the intended assertion;
- a test requires weakening an already accepted safety invariant;
- package/config/generated-client conflicts appear;
- a branch contains undocumented extra files;
- a writer proposes whole-file replacement for a shared large service or host;
- an execution result cannot be tied to the exact GitHub SHA.

## 9. Production status

`NO-GO / MAPS SOURCE PROGRAM PARTITIONED / MULTIPLE EXECUTION GATES OPEN / NO MERGE / NO DEPLOY`

The next accepted output must be evidence on one exact lane, not another broad audit or speculative Product rewrite.

Run npm run build only on the exact final candidate after focused acceptance packets are resolved.
