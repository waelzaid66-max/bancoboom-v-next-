# BANCO Canonical Production Gate Matrix

## Authority and current decision

This matrix is the release authority for `waelzaid66-max/bancoboom-v-next-`.
Historical production reports and inherited runbooks are evidence leads; none
certifies the vNext target until rerun against the exact release SHA and
recorded here or in its linked capability ledger.

| Field | Current value |
|---|---|
| Canonical assembly branch | `canonical/vnext-assembly` |
| Last protected capability SHA | Messenger durable account-bound body-text outbox `5c2631a94408a509b7ea35dde972ae31d75e9f76` (bounded product/test reconstruction) |
| Canonical migration-operator authority SHA | VNX-OPS-02 `e4b8f29727ca2d3c314196113a6db85b488d04cc` |
| Latest accepted recovery SHA | VNX-07B Messenger read/unread serialization `2e659bbad94f7999b346b96b0bcd6f9127cf492b` (published recovery branch; not canonical) |
| Last build-control SHA | root serialization `d6b42b5542837ae502febc3a7425efc68241b4ac` |
| Source ancestry | `bancoboomstor@a3db5bd8c3edd060d35078aefeec709297abbad9` |
| Assembly status | `GO`, one reversible micro-batch at a time |
| Production deploy | `NO-GO` |
| Production-ready claim | `NO-GO` |

The release candidate must be one immutable SHA. Results from different SHAs
cannot be combined into a production certificate.

## Product and platform completion matrix

| Program | Required capability closure | Minimum exact-SHA exit evidence | Current position |
|---|---|---|---|
| Shared mobile shell | Routes, five-tab escape paths, results/overlay ownership, state retention, safe-area authority | Static + RNTL + 320/360/390/430 + AR/EN + RTL/LTR + Android/iOS device journeys | Shared source/render `TESTED`; device `UNPROVEN` |
| Five marketplace sections | Cars, Property, Stay, Facilities, Materials identities, filters, taxonomy, loading/results/empty/error, scroll/collapse | Independent lineage decision, renderer, screenshot geometry, interactions, API-backed device journey per section | All five standalone headers plus both bounded parents—the four-catalogue host and independent Stay host—`TESTED`; live facets/booking/all states, current geometry, accessibility, provider, and device journeys open |
| Maps | List/map sync, locate, clusters, draw polygon, honest count, pin picker, provider bridge, bottom clearance | Unit + generated-page parse + web browser + Android/iOS WebView + live provider + large-result journey | VNX-06A draw-area geometry/web-host/cache ordering, VNX-06B hub-world hydration, and VNX-06C criteria-response ordering `TESTED` at unit/static/RNTL/build/CI layers; real browser, provider, device, large-result, domain and pin-persistence journeys remain `UNPROVEN` |
| Messenger | Send/idempotency, outbox, unread/read cursor, retry/offline, block/mute, media, notifications, deep links, presence, optional realtime/typing/voice decisions | PostgreSQL concurrency + API + render + two-account Android/iOS + offline/reconnect + push/email/storage provider journeys | Server send/notification transaction is PostgreSQL-scoped `RUNTIME_VERIFIED`; VNX-07A body-text client outbox is `TESTED` on `5c2631a`; VNX-07B read/unread serialization is accepted on published recovery SHA `2e659bb` with exact-SHA CI `31706332675` and PostgreSQL 90 files/500 tests, but is not promoted to canonical. Physical-device relaunch/account-switch, block/mute, non-text, provider and live journeys remain open |
| Accounts/Auth/Profile | Personal, dealer, company, financial-institution journeys; MFA/social/reset/delete; tenant/role transitions | Policy matrix + PostgreSQL + live Clerk tenant + Android/iOS/web journeys | Source hardening preserved; live journeys `UNPROVEN` |
| KYC and permissions | KYC ownership/access, staff roles, company/dealer/FI permissions, deletion/tombstone rules | Negative authorization matrix + PostgreSQL + private-document provider journey | Source hardening preserved; runtime/live `UNPROVEN` |
| Search and Discover | Domain isolation, routing, filters/facets, saved/recent/popular/trending/recently-viewed, map entry | Capability-level archaeology + static/render/integration/device journeys | Mixed `DELETED/ORPHANED/REVERTED_BY_GUARD/UNPROVEN` |
| Listings and publishing | Create/edit/publish/unpublish/mine, requests, import lifecycle, galleries, notifications | PostgreSQL + API + web/mobile E2E across roles and markets | Source exists; end-to-end `UNPROVEN` |
| Storage and media | Upload claims/origin, MIME/size, object ownership, private ACL, signed URLs, ranges, immutable promotion, chat/KYC/import media | Negative security tests + live object storage + web/mobile upload/view/download journeys | Source hardening preserved; live provider `UNPROVEN` |
| Payments and financing | Intent/order binding, idempotency, webhook/replay, refund safety, subscription/billing, FI lifecycle/locking/audit | PostgreSQL race/replay + Paymob sandbox + admin/FI journeys + audit and refund proof | Source hardening preserved; provider runtime `UNPROVEN` |
| API and jobs | OpenAPI/generated clients, auth/rate-limit/CSRF, workers/outboxes, readiness, graceful shutdown | Contract drift + full PostgreSQL integration + multi-replica/job failure/retry journeys | CI regression green; production topology `UNPROVEN` |
| DB and migrations | Single schema authority, forward migrations, replay, indexes, backups, upgrade compatibility | Fresh DB migrate, migrate twice, production-like snapshot upgrade, backup/restore drill, documented rollback compatibility | Fresh PostgreSQL CI verified; snapshot/restore/live `UNPROVEN` |
| Admin and Dealer OS | Complete routes, tenant permissions, moderation, payments/FI/import/listing operations | Route/permission inventory + role E2E + production build | Build green; completeness/runtime `UNPROVEN` |
| Public and workspace web | Public browse/listing/auth, seller workspace, messages, responsive/i18n, SEO/well-known | Browser E2E, accessibility, responsive matrix, live auth/API/storage, production build | Build green; live journeys `UNPROVEN` |

## Release engineering gates

| Gate | Required proof on the same release SHA | Blocking status |
|---|---|---|
| Reproducible checkout | Fresh clone, Corepack `pnpm 11.9.0`, `pnpm install --frozen-lockfile`, workspace identity | OPEN for final RC |
| Code quality | Root lint, targeted workspace lint, all package typechecks, all unit/static/render/integration tests | VNX-07A and VNX-07B touched-file lint passed with zero warnings, but root `lint`/CI currently cover maintenance scripts only. Full workspace/final-RC lint remains OPEN and must not be inferred from `ESLint (scripts)` |
| Root production build | `npm run build` across API, Expo export, both Next apps, Admin, Dealer, Landing, sandbox | VNX-OPS-01 serial scheduling protected at `d6b42b5`; one full local pass and exact-SHA CI green. One inconclusive local Next stall remains recorded; two clean bounded runs must pass on final RC |
| Dependency/security | `pnpm run security:audit`, lockfile policy, secret scan, image/dependency vulnerability review | Current gate PASS: two narrowly scoped Metro `image-size@1.2.1` waivers expire 2026-09-09 and zero blockers. Exact final-RC rerun, history/provider credential proof, image scan, and waiver closure remain OPEN |
| PostgreSQL | Drift check, fresh migration, idempotent replay, full suite, concurrency, snapshot upgrade | Latest accepted recovery CI `31706332675` passed 90 files/500 tests, including deterministic send/read serialization. Snapshot upgrade, restore, live adoption, and the broader concurrency matrix remain OPEN |
| Migration operator authority | Executable and operator-facing sources agree on committed migrations, safe baseline rules, and Postgres → migrate → API order | CLOSED at source/docs/guard layers by VNX-OPS-02 `e4b8f297`; exact-SHA workflow-dispatch CI `31462992521` passed 7/7. This manual CI did not build product Docker images or exercise Compose, Coolify, deploy, production DB adoption, backup/restore, or rollback |
| Docker images | Build every shipped Dockerfile from clean context; immutable digest/SBOM/provenance | OPEN |
| Compose runtime | Start full stack, health/readiness, migrations-before-traffic, inter-service routing, restart behavior | OPEN |
| Coolify staging | Exact image/SHA, managed networking, domains/TLS, proxy hops, secrets, well-known files, smoke journeys | OPEN |
| External providers | Live Clerk tenant, private object storage, email, push receipts, Maps provider, Paymob sandbox/FI integrations | OPEN |
| Android | Release-like build on physical device: auth, sections, maps, chat, media, push/deep link, offline/reconnect | OPEN |
| iOS | Release-like build on physical device: auth, sections, maps, chat, media, push/deep link, offline/reconnect | OPEN |
| Accessibility/i18n | AR/EN, RTL/LTR, font scaling, screen reader, touch targets, keyboard/rotation where applicable | OPEN |
| Observability | Structured logs, metrics, traces where applicable, SLOs, alert routes, worker/outbox backlog and provider failure alarms | OPEN |
| Backup and restore | Timed database/object restore drill with integrity and RTO/RPO result | OPEN |
| Rollback | Previous image/app availability, compatible DB plan, feature flags, tested rollback decision/runbook | OPEN |
| Release traceability | SHA → tests → image digests → migration set → config → deployment → rollback record | OPEN |

## Execution sequence

| Phase | Scope | Batch rule |
|---|---|---|
| 0 | Git preservation, canonical baseline, ledgers, guard-chain repair | Complete; immutable recovery refs retained |
| 1 | Shared shell/navigation/results architecture | Complete at render/CI layer; device certification deferred to final device matrix |
| 2 | Cars, Property, Stay, Facilities, Materials | VNX-05A–G freeze standalone headers plus both bounded parent hosts; live state/facet/booking, current-width, accessibility, provider, and device matrices remain release blockers without wholesale parent replacement |
| 3 | Shared Maps engine and five domain integrations | VNX-06A draw-area integrity, VNX-06B hub-world integrity, and VNX-06C criteria-response ordering complete; shared browser/native engine, map/list, pin persistence, five domains, provider/device journeys still open; no provider rewrite without reproduced defect and ADR |
| 4 | Remaining Messenger integrity and product capabilities | VNX-07A body-text durability is complete at source/render/CI. VNX-07B read/unread serialization is accepted on published recovery branch `2e659bb` with PostgreSQL CI but awaits canonical promotion. Device certification, block/mute and non-text durability remain independent; realtime/typing/voice still require transport/privacy/battery ADRs |
| 5 | Accounts/Auth/KYC/Profile | Four journeys and negative permission matrix |
| 6 | Search/Discover | Deleted, orphaned, routed, and guard-reverted capabilities remain separate |
| 7 | Listings/publishing/import/storage/media | Preserve current private-media and ownership invariants |
| 8 | Payments/FI | Preserve idempotency, order binding, lifecycle locks, refund/audit rails |
| 9 | Admin/Dealer/Web | Inventory and close every route/role journey |
| 10 | CI/Docker/Coolify and full production certification | Clean exact-SHA run through staging, devices, providers, restore, rollback |

Every modifying capability follows:
`UNDERSTAND → ARCHAEOLOGY → PROVENANCE → RECOVER → RECONCILE → MODERNIZE → VERIFY → FREEZE`.
No phase may build on a failing gate.

## Evidence record required for every claim

Each result must record:

- repository, branch, exact SHA, tree, and relevant blob/file;
- command, working directory/package, tool/runtime version, test type, result,
  counts, skips, and warnings;
- environment class: local, CI PostgreSQL, staging, live provider, simulator,
  emulator, or physical device;
- artifacts: logs, screenshots/video when visual, image digest, migration set,
  deployment ID, and rollback pointer;
- explicit untested boundaries.

The allowed maturity progression is:
`RECOVERED → MODERNIZED → TESTED → RUNTIME_VERIFIED → DEVICE_VERIFIED → LIVE_VERIFIED`.
Compilation or a static guard cannot skip a maturity level.

## Final release decision rule

Production becomes **GO** only when one final SHA closes every blocking row
above, has no unresolved P0/P1 security/data-integrity defect, is deployed to
Coolify staging by immutable artifact, completes the provider and physical
device journeys, and passes backup/restore plus rollback rehearsal. Until then,
the accurate statement is: canonical assembly is progressing; production is
not certified.
