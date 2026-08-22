# Reconciled Release Candidate — 2026-08-23

## Decision

BANCO's evidence-backed source candidate is:

| Field | Value |
|---|---|
| Candidate ref | `release/reconciled-rc-20260823` |
| Evidence-bearing candidate tip | The commit containing this report; resolve the candidate ref for its exact immutable SHA. |
| Release payload commit | `b5b11cd9968f60680cfe69e12eb82bdace6b9987` |
| Release payload tree | `ab4acda730efc64b8e2f530583a830e00e3c2a47` |
| Release payload parent | `4f2c81cc553938e808a98adb84d00ecfc76732c5` |
| Reconciled local source | `0127e2bf4d4d3a5a2044ee30e62c3c8a0079478e` |
| Local/remote merge base | `f45c32c92b8a916a0ba083dbc259b6e17e21102f` |

The candidate ref has a linear two-commit reconciliation tail on the inspected
remote canonical tip: the payload commit selects nine reviewed product/runtime
paths from the local tree, and its direct child versions this evidence report.
The payload inherits the remote security, maps, language-sync, CI, lint,
dealer-pagination, generated-contract, and audit lineage. No merge, reset,
checkout, or rewrite was performed on `canonical/vnext-assembly`.

This is a **source candidate**, not a build or deployment certificate. Build and
runtime certification remain downstream gates.

### GitHub object normalization

The first local construction produced commit `73735194e2431bb085c4d54d067e4fcb0a500170`.
GitHub's Git Data API normalized the terminal newline in that commit message and
produced authoritative payload `b5b11cd9968f60680cfe69e12eb82bdace6b9987`.
Both objects have the same parent, tree, author, committer, timestamp, and
message text. Only the GitHub payload SHA above is valid for team handoff.

## Why neither divergent tip was accepted unchanged

- The local tip was 29 commits ahead and 14 commits behind the inspected remote
  tip. Its final tree contains the remote release capabilities, but also contains
  temporary PR pointers, screenshots, a mockup-only component, generated mockup
  registration, agent memory, and broad environment evidence.
- The remote tip has the clean authoritative security/audit lineage but lacks the
  later CAR header dock, native map bootstrap fail-closed handling, portable
  managed-Postgres concurrency test, and the Replit/nginx route-smoke runtime.
- Patch-title or SHA comparison alone is misleading: the local `9912d113...`
  commit squashes capabilities represented by multiple remote commits. Tree
  comparison confirmed that key dependency, lockfile, origin verification,
  language sync, dealer pagination, CI, lint, map HTML, and generated-contract
  files are byte-identical at the two tips.

## Release payload delta over the remote tip

Only these nine paths differ from parent `4f2c81cc...`:

| Path | Class | Decision and reason |
|---|---|---|
| `.replit` | Build/environment | KEEP — Node 22 and the Nix nginx runtime required by the Replit production router; workflow ownership must still be certified. |
| `package.json` | Build/test | KEEP — exposes the production route-smoke gate. |
| `artifacts/api-server/src/services/ConversationService.test.ts` | Test | KEEP — proves messenger serialization even when managed Postgres hides query text. |
| `artifacts/banco-mobile/components/search/SearchResultsMap.tsx` | Product | KEEP — native map bootstrap errors fail closed while tile errors remain degraded-but-active. |
| `artifacts/banco-mobile/components/search/SectionSearchApp.tsx` | Product | KEEP — preserves the reviewed CAR header/filter dock behavior from the local product line. |
| `artifacts/banco-mobile/server/serve.js` | Runtime | KEEP — identifies the mobile production surface for route validation. |
| `artifacts/banco-mobile/tests/map-chrome-guard.test.mjs` | Test | KEEP — guards bootstrap-vs-tile-error behavior. |
| `scripts/replit-prod-route-smoke.mjs` | Test/operations | KEEP — validates surface identity and API health response shapes using isolated ports. |
| `scripts/replit-prod-start.sh` | Runtime | KEEP — Nix-aware nginx MIME path, configurable isolated ports, ownership preflight, and process-group cleanup. |

## Explicitly excluded local-only tree content

Historical evidence remains reachable from the original local branch. It was not
deleted; it is simply absent from the release candidate.

| Content | Class | Decision |
|---|---|---|
| `.tmp-pr19-profile-8505850d` | Temporary pointer | EXCLUDE |
| `.tmp-pr30-diagnose-c5169f0c` | Temporary pointer | EXCLUDE |
| `.tmp-pr30-focused-c5169f0c` | Temporary pointer | EXCLUDE |
| `.tmp-pr30-final-tree-verification` | Temporary pointer | EXCLUDE |
| `screenshots/car-pr13-current-preview.jpg` | Visual evidence | EXCLUDE |
| `screenshots/car-current-visual-check.jpg` | Visual evidence | EXCLUDE |
| `screenshots/banco-split-variant.jpg` | Visual evidence | EXCLUDE |
| `artifacts/mockup-sandbox/public/images/banco-split-variant-logo.png` | Mockup-only asset | EXCLUDE |
| `artifacts/mockup-sandbox/src/components/mockups/banco/BancoSplitVariant.tsx` | Mockup-only component | EXCLUDE |
| Local generated mockup registration delta | Mockup-only generated evidence | EXCLUDE |
| Local `.agents/memory/*` additions/edits | Agent process memory | EXCLUDE |
| Local `replit.md` delta | Mixed/stale operational narrative | EXCLUDE; this report is the release-source authority. |

## Local-only commit inventory

All 29 commits reachable from local tip `0127e2bf...` and not reachable from
remote tip `4f2c81cc...` are classified below, oldest first.

| # | Commit | Class | Release decision |
|---:|---|---|---|
| 1 | `03b0e036e59d974ee33744dae727aa810d535ed8` | Build/environment | KEEP final `.replit` effect only. |
| 2 | `a0d99414f05e40dde686e95e31ee665047b2a18d` | Build/environment + docs | KEEP final `.replit` effect; EXCLUDE superseded docs. |
| 3 | `51a9c98d0288db5c13e8359beb557b6e7a1641ce` | Merge/product lineage | Capability is already present in the remote-base tree; do not merge the side ancestry. |
| 4 | `33862190a20b0548b7e12b0dbdd9fd233172817e` | Test | KEEP the final test delta. |
| 5 | `740bb1eed62a0c518254cc5d682dda6bf38967e2` | Audit/docs | EXCLUDE local memory/docs delta. |
| 6 | `832abb10834f667c691ca6a8218e1a27d8181ff1` | Product | KEEP through final `SectionSearchApp.tsx`; intermediate revision superseded. |
| 7 | `94fd4fb41e2c85ef4760d4aa5c7cf6a7b477d0fd` | Product | KEEP through final `SectionSearchApp.tsx`; intermediate revision superseded. |
| 8 | `f4d03cc0901e88392dfa373f0abed00ec162183d` | Visual evidence | EXCLUDE screenshot. |
| 9 | `ec8fb092c99a265cb8bfe4cd4888031ba5a28814` | Product | KEEP through final `SectionSearchApp.tsx`; intermediate revision superseded. |
| 10 | `205a5c516e33cd45efc905a4ac8fa4aaeae40559` | Visual evidence | EXCLUDE screenshot. |
| 11 | `1164c173ee6eca69e1a1f4dff80572b43c00a248` | Product + docs | KEEP final CAR component effect; EXCLUDE local docs. |
| 12 | `f822f0a345c5068faaca37df62733745a4e29b24` | Build/environment | KEEP final nginx/Replit runtime effect. |
| 13 | `b8e2a79c7151ed7c84eaab21ed0d46604c3e20c4` | Build/environment | KEEP final `.replit` effect; intermediate revision superseded. |
| 14 | `003f29fdb2866f7a8e5240370de6436a061e3fb5` | Build/environment + test | KEEP final route-smoke/runtime paths. |
| 15 | `57dda22ded48019dba3197c53b36a73ef62af2eb` | Temporary evidence | EXCLUDE. |
| 16 | `f4da94b7f68aa08cdf25452947be215b39b26bfe` | Temporary evidence | EXCLUDE. |
| 17 | `5b48e01c7310277c978e984e8fed3e6046cda05d` | Temporary evidence | EXCLUDE. |
| 18 | `2766daa2a3de2af39115cc63006db3cb93876d62` | Mockup + temporary evidence | EXCLUDE mockup and pointer content. |
| 19 | `e2ef2c1fefafcdbbb86ec7351f9d1dcf7672bca7` | Empty bookkeeping | EXCLUDE. |
| 20 | `e33d3df4bf86c03074f3d39dd35e67a2de5e02b2` | Empty bookkeeping | EXCLUDE. |
| 21 | `ed10628df4f4fff92c002800f288a1978df4581c` | Visual evidence | EXCLUDE screenshot. |
| 22 | `44d068fafd5da72e559057cf51a445800eb97e4d` | Empty bookkeeping | EXCLUDE. |
| 23 | `30bc114bb1a56cb14369a2f6fb21800286ed5eb0` | Visual evidence | EXCLUDE replacement screenshot. |
| 24 | `fb6628cdae81c85bb007da85745999d3c07cfc26` | Empty bookkeeping | EXCLUDE. |
| 25 | `cf9cade62a845b72c4ef5a7897cff51b55b52b6a` | Empty bookkeeping | EXCLUDE. |
| 26 | `7c96632e74893974bd787164a8a9798d960013bd` | Empty bookkeeping | EXCLUDE. |
| 27 | `3e5fd56d427bbd3878bf75adc813226dde161415` | Empty verification bookkeeping | EXCLUDE. |
| 28 | `9912d113c761d478873fe2e5fad16cdb2f4df223` | Product + build + test + audit squash | Remote-equivalent core comes from parent; KEEP only the native map delta and guard. |
| 29 | `0127e2bf4d4d3a5a2044ee30e62c3c8a0079478e` | Runtime + test + agent memory | KEEP mobile marker and route-smoke delta; EXCLUDE memory. |

## Remote-only commit inventory

All 14 commits reachable from remote tip `4f2c81cc...` and not reachable from
local tip `0127e2bf...` are classified below, oldest first. The candidate inherits
this exact ancestry.

| # | Commit | Class | Release decision |
|---:|---|---|---|
| 1 | `71c9173eb2686adf71fd09f1a19bdd63132a20ef` | Dependency/security | Intermediate nanoid override; superseded by #2/#3 but retained in ancestry. |
| 2 | `3332598633edc00e09e49b32919944bc53b651f3` | Dependency/security revert | Intermediate revert; superseded by #3 but retained in ancestry. |
| 3 | `76f7f26afe57db466e16f0d6bbeda9600daeaf16` | Dependency/security | KEEP final bounded nanoid remediation. |
| 4 | `26b1fc0f474764ff7cacf3d77b1a90d5c1180505` | Product + build | KEEP safe clone-origin handling and OSM attribution. |
| 5 | `64af93faf8cf8560497b2216f56e7b43852e0b06` | Audit/docs | KEEP recovery provenance. |
| 6 | `1ccdbacc8db2abc5d9477b4e60daea6076bead56` | Build/environment | KEEP authoritative-origin lock. |
| 7 | `5f44c865a1bc1459f78fc1b2482d47c2d2ae3b6d` | Product + test + audit | KEEP map tile-failure UX and guards. |
| 8 | `80519434dd04c67a8df03f6f5085bcf72f904336` | Product + test + generated contracts | KEEP authenticated language synchronization. |
| 9 | `3951c72906918bb0b5c1e7f8fcc11c862eb8989d` | CI/build + audit | KEEP canonical-branch CI and chain-integrity checks. |
| 10 | `08222f0400273b6f1ddb44b4e152045aceae6665` | Lint/build + audit | KEEP Express augmentation lint boundary. |
| 11 | `8396b394716c7d70235ea3956bab976bfee113cd` | Product + test | KEEP dealer sort-cursor correctness. |
| 12 | `f1188fa6026d083006984145a542a9cc367b95cb` | Audit/docs | KEEP dealer verification boundary. |
| 13 | `875406e3a7b04f30b0e2d033a4e861562e068dd4` | Lint/build + tests | KEEP audited dead-binding cleanup. |
| 14 | `4f2c81cc553938e808a98adb84d00ecfc76732c5` | Audit/docs | KEEP final lint-scope and capability ledger. |

## Candidate integrity checks completed

- Release payload is a commit object with exactly one parent: `4f2c81cc...`.
- Release payload diff contains exactly the nine reviewed paths listed above.
- Evidence-bearing candidate tip is the payload's direct child and adds only this
  reconciliation report.
- Candidate tip tree does not contain any local `.tmp-pr*` pointer.
- Candidate tip tree does not contain the three local review screenshots.
- Candidate tip tree does not contain `BancoSplitVariant` or its local logo asset.
- Candidate tip tree does not contain the four local agent-memory topic additions.
- Core remote dependency, lockfile, origin, map HTML, language-sync, dealer,
  CI, and lint blobs remain unchanged from `4f2c81cc...`.

## Mandatory handoff gates

1. Work from exact ref `release/reconciled-rc-20260823`; do not reset or merge
   `canonical/vnext-assembly` to manufacture equivalence.
2. Certify the root typecheck and build on exact candidate SHA. Expo/Metro port,
   watcher, package-version, and lifecycle failures are unresolved until that
   task passes.
3. Confirm `.replit` workflow ownership against Replit-managed artifact
   workflows; do not recreate duplicate services.
4. Run the mobile guard chain, the managed-Postgres messenger test, and the
   isolated production route smoke.
5. Treat any change to the nine-path candidate delta as source drift requiring
   a new candidate SHA and an updated reconciliation record.
6. Do not publish until production readiness, security, migration, secret,
   route, and real mobile runtime gates pass.

## Known residual risks

- No root build or native/mobile runtime certification is claimed here.
- The CAR header dock remains a product-bearing local delta and requires visual
  and interaction verification on narrow Android/iOS viewports.
- The candidate's simplified `.replit` workflow declaration relies on
  Replit-managed artifact workflows; duplicate current/temporary-clone
  registrations must be reconciled without changing candidate semantics.
- Current mixed development processes cannot be used as evidence that the
  production router owns all child ports cleanly.