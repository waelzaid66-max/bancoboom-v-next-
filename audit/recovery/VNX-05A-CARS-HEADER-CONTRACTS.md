# VNX-05A — Cars Header Contracts

## Decision

The current Cars source is the strongest verified historical superset in the
available lineage. VNX-05A therefore restores no older product file and changes
no application behavior. It freezes the existing identity, controls, and real
hero-height collapse with a mounted renderer contract.

| Field | Value |
|---|---|
| Base | `429ab3135ffaa9fa937bd600b507f5cb95ac601e` |
| Test/protection commit | `e3f92c2422a51a3092d2c7bf61f14d1f6284c9ee` |
| Commit tree | `4e31ed5f15ed7c131cd7066403abadf16e8b8c09` |
| Remote freeze ref | `recovery/vnx-05-cars-header-contracts` |
| Product source delta | None |
| Classification | Cars header identity/press/collapse contract: `TESTED`; combined section and native/device runtime: `UNPROVEN` |

This is the Cars sub-batch of VNX-05. It does not close Property, Stay,
Facilities, Materials, Maps, Messenger, or production certification.

## Historical lineage adjudication

| SHA | Historical capability | Adjudication |
|---|---|---|
| `eaa835a06ea8650067596233031d0f2c00cd6710` | Compressed market/filter row and unclipped identity | Later ownership review kept market/sort in the primary strip rather than welding it into the header |
| `42fb0930e1e67a0bd3600b13616be18d035cba41` | Restored visible filter axes | Intent survives in the current section strips |
| `34af253576821d8fdffcc70966e5bc91cf504e40` | Hero plate and pinned bands | Preserved and later evolved |
| `7fc46fc3085322b17f4e16429823a125414f8222` | Plate became the full scene | Preserved and later evolved |
| `a5a982f3693cb828148f0b7b76ecfc50433fa573` | Removed competing hero copy | Preserved |
| `4859beeb855ffd3973ab620b44f6c66de12fc34c` | Eleven-type SVG strip | Intentionally `MUTATED`: honest free-text quick categories replaced facet-only gating; no fake API enum is emitted |
| `fe648957f2e4f685cd93fc5d17bc3e484051e634` | Extended the scene under the top bar | Preserved and later evolved |
| `e4cb8f273c21ed6e70ddf343239857867b60eae4` | Continued the filter strip into the header surface | Preserved and later evolved |
| `310028d584f772a413ed93ee3e5ce4bfb7fa392e` | Replaced fade-only behavior with real geometry collapse | Preserved; now mounted and regression-tested |
| `857ae26c2966779e97f600ff41b59d76535d4239` | Unified the filter bands into one surface | Current header blob originates here |
| `96e73639f45f3feffb93084d6d5cb3b661b41be7` | Clean internal filter strips and final section wiring | Current Cars header and section blobs match this state |

## Blob and merge evidence

| File/state | Blob | Finding |
|---|---|---|
| `CarsHomeHeader.tsx` at `310028d` | `b01499e6f91442b4c8195aabf2468bd1a0560cd2` | First known real-collapse implementation |
| `CarsHomeHeader.tsx` at `857ae26`, `96e7363`, `11d8185`, source baseline, and VNX-05A | `bfbe1e1308cd6aa94b12bf027e8e17ca559c1441` | Later header superset survives byte-identically |
| `SectionSearchApp.tsx` at `96e7363`, `11d8185`, source baseline, and VNX-05A | `bd0f46e766e1f274b05206e46d662f88a6bc9edc` | Cars wiring survives byte-identically, but the integration file remains conflict-damaged by lineage |
| `CarsHomeHeader.render.test.tsx` at VNX-05A | `2c10216317bd1b11d4bd270dc885eff9a81c958a` | New mounted regression evidence only |
| `render-coverage-guard.test.mjs` at VNX-05A | `45ffca58840290efe2f7ade20523ca0cd2966ecb` | Cars suite is now explicit and chain-reachable |

Merge `a61c1e1` chose its second-parent Cars header blob
`b01499e6f91442b4c8195aabf2468bd1a0560cd2` and second-parent section blob
`f22442065710d102bbfb82ad8758a23c08c7e885`. Merge `11d8185` then chose its
second-parent Cars header blob `bfbe1e1308cd6aa94b12bf027e8e17ca559c1441`
and second-parent section blob `bd0f46e766e1f274b05206e46d662f88a6bc9edc`.
The selected blobs are provable; semantic completeness of the shared
`SectionSearchApp` is not inferred from that selection.

## Capability verdicts

| Cars capability | Current verdict | Evidence / remaining boundary |
|---|---|---|
| BOOM/CAR identity, hero, search, map, save, filter, notifications, profile | `TESTED` at render layer | Real component mounts all controls and press callbacks reach the parent |
| Real hero collapse | `TESTED` at render layer | Shared value `0 → 96` changes hero `height 244 → 0`, `opacity 1 → 0`, and `marginBottom 12 → 0`; controls remain mounted |
| Optional category/stat bands | `TESTED` at render layer | Their absence does not remove search, filter, or map controls |
| RTL back direction | `TESTED` at render layer | Arabic direction mounts the logical right arrow |
| Eleven quick vehicle types | `MUTATED`, protected by honesty guard | Current implementation uses accepted free-text query behavior, not an invented API enum |
| Market and sort ownership | `REVERTED_BY_GUARD` for the header-weld attempt; current strip is preserved | `section-miniapp-guard.test.mjs` rejects market beside BANCO; `D-W8-01` keeps the primary strip as the single source of truth |
| Empty/error overlay visibility | `PRESERVED` in current architecture; combined journey `UNPROVEN` | Cars interactive chrome remains pinned rather than in the covered list header; no mounted full-section empty/error journey yet |
| Scroll bridge from results list into Cars collapse | `UNPROVEN` end to end | VNX-04 proves the shared list updates its scroll value and VNX-05A proves the header consumes one; the conflicted parent integration is not mounted in this batch |
| 320/360/390/430, AR/EN, keyboard, rotation, accessibility, safe area | `UNPROVEN` | Requires screenshot/layout and device matrix |

## RED → GREEN evidence

All local commands used the Corepack-provided `pnpm 11.9.0` shim.

1. After adding Cars to the explicit renderer registry from
   `artifacts/banco-mobile`, `pnpm run test:render-coverage` produced the
   expected **FAIL**: 3/6 meta assertions rejected the absent suite.
2. The first mounted suite passed 4/5 tests and rejected one brittle composite
   parent matcher. The assertion was narrowed to the historical defect: real
   hero height reclamation. TypeScript then rejected an `unknown` mock
   `testID`; the test mock was narrowed to `string`. Product source was never
   changed.
3. Final exact-tree gates:

| Command | Workspace/package | Test type | Result |
|---|---|---|---|
| `pnpm exec eslint tests/render/CarsHomeHeader.render.test.tsx tests/render-coverage-guard.test.mjs --max-warnings 0` | `@workspace/banco-mobile` | Lint | PASS, zero warnings |
| `pnpm run test:render-coverage` | `@workspace/banco-mobile` | Static meta-guard | 6/6 PASS |
| `pnpm run test:render` | `@workspace/banco-mobile` | RNTL/Jest iOS render | 6 suites, 45/45 PASS; Cars 5/5 |
| `pnpm run typecheck` | `@workspace/banco-mobile` | TypeScript | PASS |
| `pnpm test` | `@workspace/banco-mobile` | Full static + render chain | PASS; final renderer 6 suites, 45/45 |
| `npm run build` | repository root | Root typecheck/build | PASS across libraries, API, Expo Web, both Next apps, Admin, Dealer, Landing, and sandbox |

GitHub Actions workflow-dispatch run
[`31399958518`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31399958518)
ran against exact head `e3f92c2422a51a3092d2c7bf61f14d1f6284c9ee`.
It completed **SUCCESS** across all seven jobs: PostgreSQL API tests,
Typecheck/build, Expo Web mobile bundle, full mobile regression, production
static gates, ESLint, and GCP configuration. The PostgreSQL job also replayed
the unchanged migration/API authority and passed 90 test files / 499 tests; 1
file / 3 tests were explicitly skipped. This is regression evidence for the
exact Cars test commit, not a Cars device or live-data journey.

## Production position

VNX-05A raises only the Cars header regression floor. Production remains
**NO-GO**. VNX-05B–E must independently adjudicate Property, Stay, Facilities,
and Materials. Later phases still cover Maps, the remaining Messenger
capabilities, Accounts/Auth/KYC, Search/Discover, publishing/private media,
Payments/FI, Admin/Dealer/Web, and finally clean-install, PostgreSQL, provider,
Docker/Compose/Coolify, Android/iOS, physical-device, observability,
backup/restore, rollback, and exact-SHA staging certification.

## Explicit non-claims

This batch does not certify native Reanimated timing, a combined
`SectionSearchApp` journey, real list momentum, loading/results/empty/error on a
device, physical viewport geometry, Android, iOS, EAS, accessibility, live API
data, or production deployment. Historical screenshots are design/evolution
evidence only and are not runtime proof for this SHA.
