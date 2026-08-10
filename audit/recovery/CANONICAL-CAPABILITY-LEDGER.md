# BANCO Canonical Capability Ledger

This is the freeze authority. `TESTED` records only the stated test layer; it is
not shorthand for runtime, device, live-provider, or production readiness.

## Frozen or candidate capabilities

| Capability | State | Historical/best evidence | Target SHA | Test evidence | Runtime certification | Open risk |
|---|---|---|---|---|---|---|
| Canonical ancestry and rollback | `RECOVERED` | `bancoboomstor@a3db5bd8`, tree `07c4393d` | `f4ddee9` | workspace identity + root build PASS | N/A | Target `main` intentionally absent |
| Protection-chain reachability | `TESTED` | guards across `63f89e8`, `fa023715`, `a8e2ba5`, `2934e3d` | `3668906` | focused 14/14; render 31/31; full mobile chain; typecheck/build PASS | N/A | Static/render coverage does not certify product runtime |
| Messenger client-send idempotency | `RUNTIME_VERIFIED` (PostgreSQL scope) | claimed advanced wave unrecovered; reconstructed from current architecture | product `e318cef`; verified on descendant `6af3413` | Original DB drift/contract/mobile/typecheck/root gates PASS; CI `31396133572` `ConversationService` 10/10 and full API 499 tests PASS | PostgreSQL send/idempotency journey verified; Android/iOS offline reconnect `UNPROVEN` | Device/network ambiguity and live multi-replica stress remain |
| Messenger notification outbox | `RUNTIME_VERIFIED` (PostgreSQL scope) | claimed advanced wave unrecovered; bounded reconstruction using billing outbox `ae52fe3` as precedent | product `38697ea`; verification `6af3413` | Local DB drift/241 chain/contract/mobile/root gates PASS; CI `31396133572` all 7 jobs PASS; PostgreSQL 90 files/499 tests PASS | Fresh migration, replay, transaction/outbox/cooldown/API journeys verified; push receipts, live email, Android/iOS `UNPROVEN` | Retention, queue alerting/replay, provider/device and staging/live DB gates remain |
| Shared mobile results/navigation shell | `TESTED` | `ea71942`, `127e3d7`, merge blobs at `a61c1e1` and `11d8185` | `7e1f17c` | Render meta 6/6; RNTL/Jest 5 suites/40 tests; full mobile/typecheck/root build PASS; CI `31398232413` all 7 jobs PASS | Android/iOS physical-device runtime `UNPROVEN` | Section-specific integration remains separate; real safe-area/deep-link/accessibility/device gates open |
| Cars header identity, controls, and real collapse | `TESTED` | `eaa835a` → `96e7363`, especially real geometry fix `310028d`; current header blob `bfbe1e1` | `e3f92c2` | Cars RNTL 5/5; render meta 6/6; full render 6 suites/45 tests; full mobile/typecheck/root build PASS; CI `31399958518` all 7 jobs PASS | Combined section, Android/iOS, and physical-device runtime `UNPROVEN` | 320/360/390/430, AR/EN, loading/results/empty/error, native timing, accessibility, and live-data gates open |
| Property header identity, pinned controls, and lockup collapse | `TESTED` | `1bfa485` split → hidden-control correction `9d402d4` → current tokenized blob `f47ddfa` at `e495e02`; preserved through `a61c1e1`/`11d8185` | `b51f791` | Property RNTL 8/8; render meta 6/6; full render 7 suites/53 tests; full mobile/typecheck/root build PASS; CI `31404662388` all 7 jobs PASS | Combined section, Android/iOS, and physical-device runtime `UNPROVEN` | 320/360/390/430, AR/EN, loading/results/empty/error, native timing, accessibility, live data and possible 320dp brand truncation lead remain open |
| Root build scheduling invariant | `TESTED` for reproduced parallel-export failure | historical cleanup `f61cb95`; repeated `ENOTEMPTY` under inherited recursive concurrency 4 | `d6b42b5` | RED 241/242; GREEN 242/242; serial all-workspace build and one literal root build PASS; CI `31403501605` all 7 jobs PASS | Clean repeated final-RC build `UNPROVEN`; one non-reproduced local Next stall recorded | Do not broaden `.next` deletion without a reproduced cache defect; final exact-SHA clean/repeat gate remains open |
| Maps source superset | `TESTED` | `127e3d7`, `a4c1eb0`, `34709b4`, `12ce4f4`; current source preserved | source baseline `a3db5bd8` | map chrome 16/16; geo area 11/11; production wiring guards | WebView/provider/Android/iOS `UNPROVEN` | No code recovery until a runtime defect is reproduced |
| Modern security/storage/payment/deploy rail | `TESTED` at source/unit/build layers only | `66771d6` → `ae52fe3` → `f61cb95` → `a3db5bd8` | inherited at `f4ddee9` | existing targeted packs and root build | PostgreSQL/providers/Docker/Coolify `UNPROVEN` | Must never be weakened by UI recovery |

## Not frozen

| Program capability | Current classification | Required before first modifying batch |
|---|---|---|
| Section-specific `SectionSearchApp` integration | `CONFLICT_DAMAGED/UNPROVEN` | Current blob equals the second parent/result of conflicted merge `11d8185`; adjudicate each domain without rewriting the file |
| Cars full `SectionSearchApp` integration | `MUTATED/UNPROVEN` | Header is frozen separately at `e3f92c2`; still mount the combined list-scroll/overlay/facet/market journey and run 320/360/390/430 device matrix |
| Stay identity/header/booking | `HIDDEN/UNPROVEN` candidate | Reproduce states and preserve rental/booking taxonomy |
| Facilities identity/header | `HIDDEN/UNPROVEN` candidate | Reproduce states and section isolation |
| Materials identity/header | `UNPROVEN` | Lineage and current geometry/state audit |
| Maps runtime and per-domain personality | `UNPROVEN` runtime | Shared engine journey then five independent integrations |
| Messenger offline/read/block/mute/realtime/typing/voice | `UNPROVEN` | Product/security/transport ADRs and staged independent batches |
| Four account journeys/Auth/KYC/Profile | `UNPROVEN` runtime | Evidence-derived role policy matrix and live tenant journeys |
| Search/Discover | `DELETED/ORPHANED/REVERTED_BY_GUARD/UNPROVEN` by capability | Separate lineage and guard adjudication for each feature |
| Publishing/listings/media | `UNPROVEN` end to end | Route/API/storage/permission inventory and live private-media journeys |
| Payments/financing | `UNPROVEN` runtime | PostgreSQL and live Paymob/FI lifecycle certification |
| Admin/Dealer/Web | `UNPROVEN` completeness | Route/permission/journey inventory |
| CI/Docker/Coolify/release/rollback | `UNPROVEN` runtime | Immutable-SHA CI, image/compose/staging/backup/restore/rollback evidence |

## Freeze rule

A capability advances only through the applicable states:
`RECOVERED` → `MODERNIZED` → `TESTED` → `RUNTIME_VERIFIED` →
`DEVICE_VERIFIED` → `LIVE_VERIFIED`. A later batch that breaks a frozen test or
invariant fails immediately and must repair the regression before continuing.
