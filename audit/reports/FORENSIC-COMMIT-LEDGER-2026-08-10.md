# BANCOBOOMSTOR — Forensic Commit Ledger

- **Date:** 2026-08-10
- **Repository:** `waelzaid66-max/bancoboomstor`
- **Forensic baseline:** `a3db5bd8c3edd060d35078aefeec709297abbad9`
- **Requested recovery baseline:** `recovery/pre-forensics-20260809-a3db5bd`
- **Decision:** **NO-GO for recovery.** This report records evidence only. No source repair, merge, cherry-pick, branch switch, reset, clean, gc, prune, commit, or push was performed. The root build gate ran only after the census and ledger were complete.

## 1. Evidence boundary

The current checkout is a fresh full clone, not the original workstation clone. It can prove committed objects and remote refs, but it cannot reconstruct another clone's local reflogs, stashes, worktrees, or dangling objects.

| Census item | Result at `a3db5bd8` |
|---|---|
| Branch / upstream | `main` / `origin/main`, `+0 -0` |
| Worktree | One worktree, clean before this report |
| Stashes | None in this fresh clone |
| Reflog | Clone event only |
| Unreachable objects | None transferred by the clone |
| Recovery branch | Absent from local refs, remote refs, `git ls-remote`, and GitHub branch search |
| Remote manager branch | `origin/claude/project-understanding-manager-lcgi3u` exists at `8b696073c9bb79e81399189c531ff413991750fe` |
| Package manager | Machine `pnpm` is `11.16.0`; Corepack resolves repository-declared `pnpm@11.9.0` |
| Workspace verification | `BANCO_WORKSPACE_OK`, branch `main`, head `a3db5bd8c3ed`, changed paths `0` when a temporary Corepack shim was placed first in `PATH` |

The first `workspace:verify` attempt is also material evidence: even when launched with `corepack pnpm`, its child lookup found machine `pnpm 11.16.0` and failed. The temporary Corepack shim was required so child processes also resolved `11.9.0`. No project file was changed by that correction.

### 1.1 Source intake and trust order

The two uploaded handoff files are byte-identical: both are 16,185 bytes and both hash to `ce940d8ebca30492174e295d9fdf09e5f33ef5a37fe5ea48b9865088acdaaf5f`. They are one source duplicated twice, not two independent confirmations.

The following repository handoffs were then read in full:

| Source | Historical baseline stated by the source | Forensic use |
|---|---|---|
| `audit/handoff/MASTER-MEMORY-DUMP-FOR-CODEX-FULL-AR.md` | manager branch around `96e7363` | Requirements, known traps, and leads |
| `audit/handoff/FORENSIC-EVIDENCE-PACK-FOR-CODEX-AR.md` | manager branch around `fa797ed` | Historical line anchors and claimed gates |
| `audit/handoff/FULL-AUDIT-ALL-WORK-AND-PROBLEMS-AR.md` | PR #2 around `59ab037` | Historical agent/merge claims |
| `audit/reports/MASTER-STABILIZATION-STATE-2026-08-09.md` | local candidate over `36766cfc` | Later backend/security/deployment claims |
| PR #8 branch reports | `origin/claude/qa-audit-fixes` over `36766cfc` | Side-branch defects and consolidation leads |
| `origin/claude/halo-e1biie` forensic reports | historical `d3f8df1` era | Corrected historical branch, maps, messenger, user-journey, and operability leads |

These documents disagree with one another because they describe different dates and branch states. The governing evidence order is therefore: current Git object/blob and current executable result on the exact SHA; then current remote/PR metadata; then dated reports; then older handoffs; finally owner requirements. A handoff can identify what to investigate, but it cannot overrule a later blob or a current command result.

`audit/handoff/README.md` is explicitly historical. For example, it still tells an agent to push directly to `main`, while later PR governance forbids that. It is not an operational authority for this recovery.

## 2. Anchor census

All of the following are present, are commits, and are ancestors of the current baseline:

`fa023715`, `d3f8df1`, `66771d6`, `ae52fe3`, `04ece0d`, `f61cb95`, `a3db5bd8`, `eaa835a`, `42fb093`, `34af253`, `7fc46fc`, `a5a982f`, `4859bee`, `fe64895`, `e4cb8f2`, `310028d`, `857ae26`, `96e7363`, `f045d27`, `9f04383`, `98b74d9`, `73a5c22`, `127e3d7`, `a4c1eb0`, `34709b4`, `12ce4f4`, `13dd751`, `0d4ea409`, `1bfa485`, `9d402d4`, `e66a561`, `d098047`, `ca19018`, `a61c1e1`, `11d8185`, and `7a47b94`.

`224ef4f48b0282b55e9559c473e4e2abe22868c9` and `7e73e5a8201e4ec46e9a3e8d323a84a3a4af6a1d` are not objects in `bancoboomstor`; they are verified commits in the legacy repository `waelzaid66-max/-BANCO-CA-OOM-`.

The additional identity, FI/DB, and release anchors named by the uploaded handoff are also present and are ancestors of HEAD:

`e495e02`, `63f89e8`, `7565186`, `04c6bba`, `3858479`, `3170eec`, `9293e00`, `a4a32dd`, `7f476a7`, `c9b084b`, `04ed87a`, `40e1498`, `fa023715`, `66771d6`, `ae52fe3`, `04ece0d`, `f61cb95`, and `a3db5bd8`.

The following anchors are not reachable in any ref of `bancoboomstor`, the verified legacy repository, or the other eight non-empty BANCO repositories published under the same GitHub account:

`d53d424`, `723c8e`, `0c678e7`, `a08bc36`, `7e20a70`, `a969531`, `8fc8089`, `08be2b0`, `852070c`, `e8afb72`, `fd4f9d3`, `e8f4d2c`, `f4d62d8`, `ac6cfeb`, `a1ed24f`, `2211abf`, and `ce70ba194b1f18622bf4590d1adb77ed940d74bb`.

They therefore remain `UNPROVEN` and unavailable in the complete corpus currently under review. A short SHA collision found by a global GitHub search is not evidence for this project, and no claim may infer the missing objects' contents.

### 2.1 Remote branch and pull-request census

All remote heads were fetched read-only without pruning. Relationship below is relative to exact HEAD `a3db5bd8`.

| Remote ref group | Relationship / unique work | Current disposition |
|---|---|---|
| `are-you-here`, `boom-car-hero-header`, `five-headers`, `integration-all`, `project-understanding-manager-lcgi3u`, `testing-correction-pressure` | Ancestors of HEAD | Their reachable work is already in current ancestry; branch names do not establish semantic completeness |
| `halo-e1biie`, `halo-i07jkh`, `local-audit-cars-header-defect` | Diverged; unique commits are documentation only | Evidence leads only; no product merge candidate |
| `headers-dynamic-polish` | Diverged by four commits | The well-known renderer is byte-identical at HEAD and its other major work was integrated or evolved; the missing `render-coverage-guard` remains a separate protection candidate |
| `qa-audit-fixes` / PR #8 | Diverged by six commits | Bank icon mappings, the single clamped `sectionAccentAlpha`, Metro Replit exclusion, and a synchronized later lock state exist at HEAD via `66771d6`/`f61cb95`; the two QA reports remain branch-only. Never merge this whole branch over newer security/backend work |
| `copilot/audit-current-head-66771d6` | Diverged by one docs commit | Evidence lead only |
| `copilot/full-audit-primary-agent-report` | Diverged by two docs commits plus `2934e3d` | The render suite is wired at HEAD, but the proposed render-coverage meta-guard is absent and must be reviewed against the current Jest/RNTL runner before reuse |

GitHub PR metadata was read directly on 2026-08-10:

| PR | State | Merge/head SHA | Forensic note |
|---:|---|---|---|
| #1 | Merged | `83da99e` | Docs audit |
| #2 | Merged | `11d8185` | Five-header integration; primary conflict crime scene |
| #3 | Merged | `a6417bd` | Root API typecheck correction |
| #4 | Merged | `ecdf776` | Governance docs |
| #5 | Merged | `b6ed860` | Import/identity/schema-guard work |
| #6 | Merged | `d3f8df1` | Mobile build and first render layer |
| #7 | Merged | `73a5c22` | Messenger send-icon runtime fix |
| #8 | **Open** | head `601fdb2` | Do not merge wholesale: principal code fixes are already represented by later current-history implementations |

## 3. Merge `11d8185` adjudication

The commit object has parents:

1. `fa023715df4af48f12bb3260d08dbfa4848cdd83`
2. `8b696073c9bb79e81399189c531ff413991750fe`

Its message records eight conflicts. For every conflict path in the production, test, and package scope examined below, blob comparison proves that the merge selected the second-parent blob wholesale, except `import/auctions.tsx` and `import/documents.tsx`, which retained literal conflict markers until `7a47b94` and then also became byte-identical to the second parent. The conflicted handoff document was not used to infer runtime semantics.

| Conflict path | First parent | Second parent | Merge / cleanup result | Finding |
|---|---:|---:|---:|---|
| `components/search/SectionSearchApp.tsx` | `f224420` / 3110 lines | `bd0f46e` / 3166 | `bd0f46e` through HEAD | Entire second-parent blob selected |
| `app/import/auctions.tsx` | `4f54638` | `b10e07a` | markers at `11d8185`; `b10e07a` at `7a47b94` through HEAD | Cleanup selected second parent |
| `app/import/documents.tsx` | `e7a8883` | `3deed13` | markers at `11d8185`; `3deed13` at `7a47b94` through HEAD | Cleanup selected second parent |
| `app/import/index.tsx` | `5878228` | `55f4446` | `55f4446` through HEAD | Entire second-parent blob selected |
| `app/import/order/[id].tsx` | `9b72803` | `8a8990e` | `8a8990e` through HEAD | Entire second-parent blob selected |
| `package.json` (mobile) | `3e75494` | `8cf33fa` | `8cf33fa` at merge; later changed by `66771d6` | Second parent selected; partial later repair |
| `tests/import-honesty-guard.test.mjs` | `15ca622` | `20f74c8` | `20f74c8` through HEAD | Entire second-parent blob selected |

For `SectionSearchApp.tsx`, the net first-parent-to-second-parent diff contains later Cars filter-strip work plus comment changes; no known Property, Materials, Facilities, or Stay control is removed by that net diff. That is useful source evidence, but it is not an end-to-end semantic proof for a 3166-line integration file.

## 4. Forensic Commit Ledger

Classification is deliberately singular per row. `UNPROVEN` means the source and focused checks look coherent but native/runtime behavior was not exercised on this SHA.

| Feature | File | Good SHA | Later SHA | Merge/Conflict | HEAD state | Classification | Evidence | Recovery candidate | Risk |
|---|---|---|---|---|---|---|---|---|---|
| Composite section integration | `components/search/SectionSearchApp.tsx` | `a61c1e1` + later Cars line `96e7363` | `11d8185` | Recorded conflict; merge chose second-parent blob `bd0f46e` wholesale | Same blob through HEAD; focused guards green | `UNPROVEN` | 3110 vs 3166 lines; remerge diff; `section-guard` 92/92 | None. Validate feature-by-feature; never restore this whole file | **Critical** — central integration point |
| Cars header, hero, category/stats bands, three filter strips | `CarsHomeHeader.tsx`; `SectionSearchApp.tsx` | `857ae26` + `96e7363` | `11d8185` | Clean Cars header update plus conflicted parent file | Header blob equals `857ae26`; section blob equals `96e7363`; source controls present | `UNPROVEN` | `cars-category-strip`, `cars-stats-strip`, `section-primary-strip`, `section-engine-strip`, brand/origin strip; section guard 92/92; honesty 5/5 | No code recovery; obtain 320/390 native evidence on exact HEAD | High visual/native risk |
| Property pinned identity and browse controls | `PropertyHomeHeader.tsx`; `SectionSearchApp.tsx` | `a61c1e1` (contains `9d402d4` fix plus later collapse work) | `11d8185` | No net removal in conflict diff | Property blob equals `a61c1e1`; `slot="scroll"` intentionally paints no controls | `UNPROVEN` | Offer/type/search controls remain outside `ListHeaderComponent`; section guard green | No recovery; empty/error native reproduction first | Medium |
| Stay header, type tabs, collapse | `StaysHomeHeader.tsx`; `BookingStaysApp.tsx` | `8f5056c` (contains `d098047`) | `a61c1e1` | No conflict at `11d8185` | Header blob unchanged through HEAD; all identity/controls pinned | `UNPROVEN` | Stay honesty 4/4; section guard green; no Stay `listHeader` | No recovery; native render/scroll proof | Medium |
| Facilities pinned brand/search/type controls | `FacilitiesHomeHeader.tsx`; `SectionSearchApp.tsx` | `ca19018` | `a61c1e1` | No conflict loss | Header blob is byte-identical to `ca19018`; type strip uses `showPinned` | `UNPROVEN` | Source comment and branch prove type strip moved out of overlay path; section guard green | No recovery; empty/error native proof | Medium |
| Facilities hero and proven count during empty/error/loading | Same | `ca19018` | HEAD | No merge loss; layout condition persists | `slot="scroll"` hero/count enter `ListHeaderComponent`; opaque absolute overlay covers them | `HIDDEN` | `SearchResultsSurface` uses `StyleSheet.absoluteFill` over the list; only controls are pinned | Reproduce the exact state before deciding whether identity/count must remain visible | Medium; pinning the whole hero would reintroduce viewport loss |
| Materials identity, search, type/origin/commodity controls | `MaterialsHomeHeader.tsx`; `SectionSearchApp.tsx` | `e495e02` / `a61c1e1` | `11d8185` | No net conflict loss | Header blob equals `e495e02`; browse axes are outside results overlay | `UNPROVEN` | Materials guard 8/8; section guard green | No recovery; native render/scroll proof | Medium |
| Materials tagline during empty/error/loading | `MaterialsHomeHeader.tsx`; `SectionSearchApp.tsx` | `e495e02` | HEAD | No merge loss; layout condition persists | Tagline is the scrolling slice and is covered by the opaque overlay | `HIDDEN` | Only `materialsScrollHeader` enters `ListHeaderComponent`; source labels it prose, not a control | UX decision only after reproduction | Low/medium |
| Discover recent searches, popular brands, saved searches, trending, recently viewed | Legacy `SearchDiscover.tsx`; current `components/SearchDiscover.tsx` | Legacy `224ef4f` | Legacy `7e73e5a` | Historical deletion predates `bancoboomstor` migration | Current file is 832 lines but contains none of the five feature symbols/props | `DELETED` | Legacy file 935 lines; deletion file 597 lines; diff `+193/-531`; current production file unchanged since `89d28d3` | `audit/handoff/restore/SearchDiscover-PEAK-224ef4f.tsx` and `REMOVED-five-services-JSX.txt`, adapted rather than copied blindly | High — old contracts and current guards differ |
| Attempt to restore the five Discover services | Restore artifact + `search.tsx` wiring | Candidate documented by `13dd751` | `0d4ea409` | Working-tree restoration was reverted after two guards failed | No restoration commit; tree returned clean | `REVERTED-BY-GUARD` | `section-miniapp-guard` forbids four melt props; chain guard forbids saved-search apply bridge | Requires an explicit product/architecture decision and narrowed guards; never bypass guards | High |
| Discover section mini-app routing | `SearchDiscover.tsx`; `(tabs)/search.tsx`; route files | Legacy `b63edaa`, `1312860`; migrated baseline `89d28d3` | HEAD | Historical routing damage is separate from service deletion | `SECTION_ROUTE` + `router.push`; no `onBrowseSection`; all route files exist | `UNPROVEN` | Section guard 92/92; current SearchDiscover blob unchanged since initial current-repo commit | No recovery; router/device journey proof | Medium |
| Discover 2×2 photo section cards | `SearchDiscover.tsx` | Legacy `6b18408` | Migrated baseline `89d28d3` | Historical ENTER-row overwrite was repaired before migration | `sectionGrid` and `sectionCard` present; ENTER styles rejected by guard | `UNPROVEN` | Section guard 92/92 | No recovery; screenshot evidence on exact HEAD | Medium visual risk |
| Map bottom-control clearance | `MapOverlayChrome.tsx`; `SearchResultsMap*`; `mapHtml.ts` | `127e3d7` | `a4c1eb0` | No conflict | Current blobs equal latest map commits | `UNPROVEN` | Map chrome 16/16 | No recovery; WebView/native proof | Medium |
| Draw-search-area geometry and honest count | Map files; `lib/geoArea.ts` | `a4c1eb0` | HEAD | No conflict | Source/test blobs unchanged | `UNPROVEN` | Map chrome 16/16; geo-area 11/11 | No recovery; live map/WebView proof | Medium |
| Bookable map glyph as inline SVG | `mapHtml.ts` | `34709b4` | HEAD | No conflict | Blob byte-identical to `34709b4` | `UNPROVEN` | Guard parses generated page and rejects emoji/font glyphs; 16/16 | No recovery; Android/iOS WebView screenshot | Medium |
| Messenger presence in thread | `app/messages/[id].tsx`; `PresenceDot.tsx` | `f045d27` | `66771d6` | Later thread mutation was media/security work, not a replacement | `PresenceLabel` remains wired; original render test unchanged | `UNPROVEN` | Messenger wiring 12/12; render suites 3/3, 31/31 | No recovery; authenticated device journey | Medium |
| Messenger send icon | `components/icons.tsx`; render test | `9f04383` | `66771d6` | Icon registry later changed, but send mapping/test retained | Filled send mapping present; test blob unchanged | `UNPROVEN` | Render suites 3/3, 31/31 | No recovery; Android/iOS render proof | Medium |
| Import red tint binding in auctions/documents/hub | Import screens | `8b69607` | `11d8185`, `7a47b94` | Literal markers then cleanup selected second parent | `RED_TINT(alpha)` delegates to `sectionAccentAlpha("car", alpha)` | `PRESERVED` | Result blobs equal second parent; import honesty 6/6 | None | Low |
| Import order cancelled-state visual semantics | `app/import/order/[id].tsx` | Competing parents: `fa023715` vs `8b69607` | `11d8185` | Whole second-parent blob selected | Background changed `muted → secondary`; destructive border changed half-alpha → full | `MUTATED` | Remerge diff proves semantic choice; no visual contract proves which parent is correct | None until screenshot/design evidence adjudicates the intended state | Medium |
| Import honesty coverage for `app/import-tracking.tsx` and both stage rails | `tests/import-honesty-guard.test.mjs` | `fa023715` | `11d8185` | Whole second-parent guard selected | Current guard omits `app/import-tracking.tsx` and only checks order-detail rail | `MUTATED` | First-parent-to-HEAD diff removes the file and paired-rail loop; current 6/6 cannot cover what is absent from the guard | Reintroduce feature-based coverage after checking current intentional grey status token | Medium |
| Repo-wide retired-red guard execution | `tests/retired-red-guard.test.mjs`; mobile `package.json` | `63f89e8` / `fa023715` | `11d8185`; partial package repair `66771d6` | Merge selected package without `test:retired-red` | Guard file exists, passes manually 2/2, but has zero references in package scripts, CI, or root scripts | `ORPHANED` | `rg retired-red-guard\|test:retired-red` returns no wiring; direct Node run passes | Rewire the existing guard into the mobile chain after scope review | Low |
| Mobile renderer test chain | Mobile `package.json`; Jest render tests | `d3f8df1`, `9f04383`, `98b74d9` | Removed at `11d8185`; restored `66771d6` | Merge initially selected package without render test/deps | `test:render` and all dependencies are wired at HEAD | `PRESERVED` | Jest 3/3 suites, 31/31 tests | None | Low; still not physical-device evidence |
| PR #8 bank icon mappings, single clamped accent-alpha implementation, and Metro Replit exclusion | `components/icons.tsx`; `lib/sectionTheme.ts`; `metro.config.js` | `90022c2`, `c58a790` | `66771d6`, `f61cb95` | PR #8 remains open; later current-history work implemented/evolved the fixes | All four bank icon names map; exactly one clamped `sectionAccentAlpha`; Metro block list present; current lock/build pass | `PRESERVED` | Icons 6/6; root build PASS; production-confidence verifies the Metro exclusion | None; never merge PR #8 wholesale | Low |
| Render-suite coverage meta-guard | `tests/render-coverage-guard.test.mjs` | `a8e2ba5`; alternative `2934e3d` | Divergent side branches | Never reached HEAD | Three Jest/RNTL render suites are wired, but no meta-guard asserts declared render-critical coverage | `ORPHANED` | File absent at HEAD; present on `headers-dynamic-polish` and Copilot side history; old versions contain runner/coverage assumptions that must be reconciled | Adapt the strongest assertions to the current Jest/RNTL suite; do not copy blindly | Medium — a stale meta-guard can report false coverage |
| Shared section-neutral identity tokens | `lib/sectionTheme.ts`; section headers; neutral guard | `e495e02` | duplicate wave, then `66771d6` | Historical clean-merge duplication was removed; later file evolved | One token home remains; headers do not hand-write the protected neutrals | `PRESERVED` | Section-neutrals 4/4; single-function scan; root typecheck/build PASS | None | Low source risk; visual identity still requires device review |
| Assistant identity is exactly `B` across entry points | `app/assistant.tsx`; i18n; assistant identity guard | `5cf5e4e` | `66771d6` | No destructive merge found | Current source and entry points retain the single name | `PRESERVED` | Assistant identity guard 4/4 | None | Low |
| FI workspace lifecycle, provisioning, transition locking, suspension, and audit trail | `FinancingService.ts`; `UserService.ts`; controller/routes; migration `0004`; Admin/mobile surfaces | `7565186` through `fa023715` | `66771d6`, `ae52fe3` | Linear later hardening changed `UserService` and the schema, not a whole-tree replacement | Four-state machine, `FOR UPDATE`, lifecycle events, unique ownership, and error contracts remain in source | `UNPROVEN` | All named FI commits are ancestors; current source markers present; accounts source guard 18/18; DB-backed execution blocked without PostgreSQL | No recovery; execute migration×2, seed, transition, provisioning, suspension, and boot-cycle journeys on exact HEAD | **High** — transactional and tenant-isolation behavior |
| Four account families and Clerk role/account lifecycle | Mobile auth/profile/onboarding; `meController`; `UserService`; Clerk integration | `66771d6` | HEAD | Later commits did not replace the account implementation | Individual, business/dealer, bank, and funder paths exist; FI success awaits provisioning in source | `UNPROVEN` | Accounts/Clerk source guard 18/18; root build PASS; no live Clerk tenant/session/deletion journey | No code recovery; staging tenant proof first | High auth/RBAC risk |
| Private media, KYC/import/chat attachments, immutable final URLs, ACL, range serving, and native streaming upload | API upload/object-storage/media files; mobile upload/gallery/media policy | `66771d6` | HEAD | No later overwrite of the media wave | Source implementation and DB-independent tests remain | `UNPROVEN` | DB-independent media pack: 68 PASS, 3 live-provider tests skipped; DB-backed `uploadClaims` suite cannot load without `DATABASE_URL`; mobile media-scale 5/5 | No recovery; configured S3 and Replit/GCS tests plus DB-backed ownership journeys | **High** security/data-integrity risk |
| Paymob order binding, webhook routing, void/refund safety, and payment idempotency | Payment controller/provider/services/tests | `66771d6`; later billing/payment work `ae52fe3` | HEAD | Linear hardening, no merge replacement | DB-independent controller/provider behavior present; DB-backed settlement state remains unexecuted | `UNPROVEN` | DB-independent payment pack 16/16; three DB-backed suites refuse to load without `DATABASE_URL`; no live Paymob HMAC/inquiry/replay | No recovery; PostgreSQL then Paymob staging proof | **Critical** money movement risk |
| Durable billing receipt outbox, email/notification jobs, and retry path | migration `0005`; `BillingNotificationService`; jobs; notification/email services | `ae52fe3` | HEAD | No later overwrite | Migration and source remain byte-stable after the commit | `UNPROVEN` | Commit ancestry, migration journal `0000` through `0005`, chain markers; no PostgreSQL/worker/provider execution | No recovery; DB transaction/retry/deduplication and provider failure-isolation proof | High |
| Migration authority and replay discipline | `lib/db/migrations`; journal/snapshots; CI/deploy scripts; `ensureSchema` | `a4a32dd` through `fa023715`; `ae52fe3`; `f61cb95` | HEAD | Later linear hardening | Six committed migrations; current gates reject `push-force` as authoritative | `UNPROVEN` | Chain 235/235 and production-confidence source check pass; local runtime has no PostgreSQL, so migrate×2/seed/full DB suite did not run | No code recovery; disposable PostgreSQL 16 exact-SHA gate | **Critical** schema/data risk |
| Exact-HEAD CI chain and monorepo scope | GitHub workflows; root scripts; workspace policy | `f61cb95`; chain update `a3db5bd8` | HEAD | No later commit | Local root build and source gates pass; no exact-HEAD GitHub check/status was returned | `UNPROVEN` | Root build PASS; chain 235/235; GitHub connector returned no PR-triggered workflow run or combined status for `66771d6`, `f61cb95`, or `a3db5bd8` | Do not recover code; run immutable-SHA CI before any release claim | High process risk |
| Production dependency security gate | `scripts/dependency-security-gate.mjs`; lock/workspace/workflows | `f61cb95` | HEAD | No conflict | Gate is wired and runs on current lock | `PRESERVED` | Exact-HEAD audit: 0 blocking; two narrow `image-size@1.2.1` Metro build-time waivers expire 2026-09-09 | None now; re-adjudicate or update before waiver expiry | Medium time-bounded supply-chain risk |
| `.well-known` renderer and placeholder refusal | Coolify Dockerfile/templates/renderer; universal-link guard | `5e9437e` | `66771d6` | Historical report called it stranded, but current HEAD contains the exact renderer blob | Renderer is byte-identical to side-branch implementation and strict Docker build args remain | `PRESERVED` | Universal-links 13/13; production-confidence validates the source contract | None | Medium until real Apple Team ID and Play signing fingerprint are injected and served |
| Canonical deployment repository references | Deployment SoT/docs/compose/status/scripts | `66771d6`; strengthened `f61cb95` | HEAD | No conflict | Active operational surfaces name `bancoboomstor`; older repository names remain only in historical context | `PRESERVED` | Chain includes 14 canonical-deploy-repository assertions, all within 235/235 PASS | None | Low source risk |
| Coolify compose/images, migrate, health/readiness, backup/restore/rollback | `docker-compose.coolify.yml`; `deploy/coolify/**`; deploy docs | `66771d6` | HEAD | No later overwrite | Configuration and source guards present | `UNPROVEN` | Production-confidence source checks pass; `docker` is not installed in this runtime, so even compose parsing/image runtime was not executed | No recovery; run image/config/migrate/health/restart/backup/restore/rollback on exact SHA | High deployment risk |
| AWS `banco-web` Docker prebuild repair | `deploy/aws/Dockerfile.banco-web`; `prepare-next-build.mjs`; chain | `a3db5bd8` | HEAD | Baseline commit itself | Source fix is current and root Next builds pass | `UNPROVEN` | Root build PASS; Docker unavailable, so the actual image build was not run | No recovery; build and smoke the AWS image | Medium |
| EAS/Expo production configuration and native bundles | `app.json`; `app.config.ts`; `eas.json`; mobile build scripts | migrated baseline plus `66771d6` config hardening | HEAD | No destructive merge found | SDK 54, identifiers, project ID, preview/production profiles, links config are present | `UNPROVEN` | Production-confidence 23/23 with typecheck intentionally skipped after separate root typecheck; no signed EAS Android/iOS build or physical-device journey | No recovery; signed builds and device matrix | High release risk |
| Push/notification routing and delivery jobs | Mobile notification routing; API notification service/jobs | `66771d6`; `ae52fe3` | HEAD | Linear later job hardening | Routing contracts and source job paths present | `UNPROVEN` | Notification routing 11/11; production wiring 47/47; no signed push receipt/delivery/deep-link journey | No recovery; live Expo/APNs/FCM delivery and retry proof | Medium/high |

## 5. Focused command evidence at exact HEAD

All commands below ran from the repository root at `a3db5bd8c3edd060d35078aefeec709297abbad9`.

| Command / workspace | Result |
|---|---:|
| `corepack pnpm --filter @workspace/banco-mobile run test:section-guard` | 92/92 PASS |
| `... run test:car-hero-honesty` | 5/5 PASS |
| `... run test:stay-honesty` | 4/4 PASS |
| `... run test:materials-core` | 8/8 PASS |
| `... run test:map-chrome` | 16/16 PASS |
| `... run test:geo-area` | 11/11 PASS |
| `... run test:messenger-wiring` | 12/12 PASS |
| `... run test:render` | 3/3 suites, 31/31 tests PASS |
| `... run test:import-honesty` | 6/6 PASS |
| `node --test artifacts/banco-mobile/tests/retired-red-guard.test.mjs` | 2/2 PASS manually; guard remains unwired |
| `git diff --check` | PASS |
| `PATH=<Corepack pnpm-11.9.0 shim>:$PATH npm run build` / root workspace | PASS; `workspace:verify` confirmed the root and SHA, all nine scoped TypeScript workspaces passed, and all build-bearing workspaces completed, including API, Expo web export, both Next apps, Admin OS, Dealer OS, Landing, and Mockup Sandbox |
| `node scripts/chain-integrity-gate.mjs` / root | 235/235 PASS; source markers only |
| `pnpm run confidence --skip-typecheck` / root | 23/23 PASS, including the full mobile regression chain; typecheck was skipped only in this repeat because the separate literal root build had already passed it |
| Mobile `test:icons` | 6/6 PASS |
| Mobile `test:accounts` | 18/18 PASS; source/static guard, not live Clerk |
| Mobile `test:production-wiring` | 47/47 PASS; source/static guard |
| Mobile `test:universal-links` | 13/13 PASS; source/config guard |
| Mobile `test:assistant-identity` | 4/4 PASS |
| Mobile `test:section-neutrals` | 4/4 PASS |
| Mobile `test:media-scale` + `test:cdn` | 5/5 + 3/3 PASS; source/config readiness only |
| Mobile `test:notification-routing` | 11/11 PASS |
| API DB-independent media Vitest pack / `@workspace/api-server` | 9 files PASS, 1 live-provider file skipped; 68 tests PASS, 3 skipped |
| API media pack including `uploadClaims.test.ts` | Exit 1: the other 68 tests passed and 3 skipped, but the DB-backed suite failed to load because `DATABASE_URL` is absent |
| API DB-independent payment Vitest pack / `@workspace/api-server` | 3 files, 16/16 PASS |
| API payment pack including three DB-backed service suites | Exit 1: the 16 DB-independent tests passed; the DB-backed suites failed to load because `DATABASE_URL` is absent |
| `pnpm run security:audit` / root | PASS; 0 blocking advisories, two narrowly scoped `image-size@1.2.1` waivers expiring 2026-09-09 |
| `docker --version` before Coolify/AWS runtime verification | Exit 127: Docker is unavailable in this runtime; no image/compose result may be claimed |

The build emitted non-fatal Vite chunk-size and Next ESLint-plugin warnings. These checks still do not prove physical Android/iOS behavior, live Clerk, live maps, live APIs, database state, deployment, or semantic completeness of features not represented in the assertions. The DB-dependent exits above are evidence of an unavailable prerequisite, not evidence that the covered behavior passes or fails.

## 6. Stop conditions before recovery

1. Treat the requested recovery branch and 17 unavailable anchors as a closed evidence gap in the current corpus. Do not infer or reconstruct their contents; reopen those rows only if the objects become available later.
2. Adjudicate the three protection regressions first: the orphaned retired-red guard, the weakened Import tracking coverage, and the side-branch-only render-coverage meta-guard. None authorizes production-code restoration by itself.
3. Run exact-HEAD disposable PostgreSQL 16 migration×2, seed, and DB-backed FI/auth/media/payment/billing journeys before treating those rows as preserved runtime behavior.
4. Reproduce the `HIDDEN` and mobile `UNPROVEN` rows on exact-HEAD 320/390 viewports and at least one Android/iOS runtime before selecting UI recovery candidates.
5. Build and run the current Docker/Coolify/AWS paths before any deployment classification can leave `UNPROVEN`.

**Recovery remains blocked.** The green root build was run only after the census and ledger; it does not change the forensic classifications or prove semantic completeness.

## 7. Collection and adjudication plan

| Phase | Scope | Current state | Exit evidence |
|---|---|---|---|
| A | Uploaded sources, repository handoffs, refs, stashes/reflogs/object census | Complete for the available corpus | Fingerprints, ref census, anchor resolution |
| B | PR #1–#8 and all live remote branch relationships | Complete at commit/path level | Current PR metadata, side-branch unique-path inventory, no whole-branch recovery candidate |
| C | UI/integration/Discover/Maps/Messenger/Import ledger | Source adjudication complete; runtime rows remain open | Existing rows plus 320/390/native evidence |
| D | Identity/auth/FI/DB/media/KYC/payments/notifications/security | Source and DB-independent collection complete; DB/live behavior open | PostgreSQL and live-provider exact-SHA journeys |
| E | CI/Docker/Coolify/AWS/EAS | Static configuration and local build collected; runtime open | Exact-SHA CI, image runtime, staging deploy, signed devices |
| F | Recovery candidate selection | **Not started** | A reviewed ledger row with a precise candidate, dependencies, regression test, and no unresolved newer-work conflict |

The next investigation unit is protection-chain adjudication, not product-code recovery. It has the smallest blast radius and determines whether later recovery experiments can be trusted.

## 8. Protection-chain adjudication — read-only result

| Protection | Current forensic finding | Safe candidate shape | Decision |
|---|---|---|---|
| Retired-red guard | The existing repo-wide guard scans real mobile source, passes 2/2 manually, and is absent only from execution wiring | Wire the existing file into the mobile chain after one final scope mutation check | Candidate is precise; no production-code recovery authorized yet |
| Import feature coverage | `app/import-tracking.tsx` still exists and still draws the mirrored stage rail. Merge `11d8185` removed it from both the feature file list and paired-rail assertion. Its intentional cancelled grey `#9CA3AF` means restoring the old guard wholesale would also restore old assumptions | Preserve the current generalized colour checks, then restore feature-based membership and paired-rail invariants with the explicit cancelled-grey exception | Candidate must be synthesized assertion-by-assertion; no first-parent file replacement |
| Render coverage meta-guard | The `a8e2ba5` version knows the current Jest/RNTL architecture but rejects the later `SendIcon` suite as undeclared. The `2934e3d` version declares `components/icons.tsx`, but its component detector only recognizes `export function`; the current icon registry exports differently, so that candidate cannot prove what it claims. Its comment also incorrectly describes the current runner as `node:test` | Keep Jest reachability and mount checks from the earlier version; replace filename/export inference with an explicit `{source file, exported symbol, render suite, claim}` registry that includes `PresenceDot`, `PresenceLabel`, and the exported icon facade used by `SendIcon.render.test.tsx` | Both side-branch files are leads, not cherry-pick candidates |

This closes the planning question for the first recovery tranche: it is a test-chain repair tranche only, and even that remains blocked until the proposed assertions are written as a reviewed patch rather than imported from a branch.
