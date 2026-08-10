# BANCO Canonical Capability Ledger

This is the freeze authority. `TESTED` records only the stated test layer; it is
not shorthand for runtime, device, live-provider, or production readiness.

## Frozen or candidate capabilities

| Capability | State | Historical/best evidence | Target SHA | Test evidence | Runtime certification | Open risk |
|---|---|---|---|---|---|---|
| Canonical ancestry and rollback | `RECOVERED` | `bancoboomstor@a3db5bd8`, tree `07c4393d` | `f4ddee9` | workspace identity + root build PASS | N/A | Target `main` intentionally absent |
| Protection-chain reachability | `TESTED` | guards across `63f89e8`, `fa023715`, `a8e2ba5`, `2934e3d` | `3668906` | focused 14/14; render 31/31; full mobile chain; typecheck/build PASS | N/A | Static/render coverage does not certify product runtime |
| Messenger client-send idempotency | `TESTED` | claimed advanced wave unrecovered; reconstructed from current architecture | `e318cef` | DB drift PASS; API contract 3/3; mobile chain; API/mobile typecheck; root build PASS | PostgreSQL race and Android/iOS reconnect `UNPROVEN` | Commit candidate must pass real DB/device before `RUNTIME_VERIFIED` |
| Maps source superset | `TESTED` | `127e3d7`, `a4c1eb0`, `34709b4`, `12ce4f4`; current source preserved | source baseline `a3db5bd8` | map chrome 16/16; geo area 11/11; production wiring guards | WebView/provider/Android/iOS `UNPROVEN` | No code recovery until a runtime defect is reproduced |
| Modern security/storage/payment/deploy rail | `TESTED` at source/unit/build layers only | `66771d6` → `ae52fe3` → `f61cb95` → `a3db5bd8` | inherited at `f4ddee9` | existing targeted packs and root build | PostgreSQL/providers/Docker/Coolify `UNPROVEN` | Must never be weakened by UI recovery |

## Not frozen

| Program capability | Current classification | Required before first modifying batch |
|---|---|---|
| Shared mobile shell/navigation/section architecture | `UNPROVEN` completeness | Route/screen inventory, overlay/state model, navigation and safe-area render/runtime evidence |
| Cars identity/header/filters | `MUTATED/UNPROVEN` | Full lineage and 320/360/390/430 interaction/scroll matrix |
| Property identity/header | `HIDDEN/UNPROVEN` candidate | Reproduce pinned/list-header/empty-overlay states |
| Stay identity/header/booking | `HIDDEN/UNPROVEN` candidate | Reproduce states and preserve rental/booking taxonomy |
| Facilities identity/header | `HIDDEN/UNPROVEN` candidate | Reproduce states and section isolation |
| Materials identity/header | `UNPROVEN` | Lineage and current geometry/state audit |
| Maps runtime and per-domain personality | `UNPROVEN` runtime | Shared engine journey then five independent integrations |
| Messenger notification outbox | `UNPROVEN`, in flight | Migration, atomicity/retry tests, root build, PostgreSQL/runtime status, final SHA |
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
