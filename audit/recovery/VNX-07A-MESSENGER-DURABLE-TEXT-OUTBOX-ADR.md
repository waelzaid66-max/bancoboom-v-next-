# VNX-07A — Messenger Durable Account-Bound Text Outbox

## Current decision

The owner-attributed advanced Messenger wave has no recoverable Git object.
VNX-07A is therefore a bounded reconstruction on top of the preserved
VNX-02/VNX-03 server authority, not a historical cherry-pick. It closes one
capability only: durable, body-only text attempts from the normal mobile
composer. It is **FROZEN** at source/static/RNTL/build/CI layers and remains
`UNPROVEN` on physical devices and live Clerk/network/provider environments.

| Field | Value |
|---|---|
| Repository | `waelzaid66-max/bancoboom-v-next-` |
| Branch | `canonical/vnext-assembly` |
| Decision base | `cd16d17abbaea48fe8bf82edd85dbcc2228e7a15` |
| Base tree | `325cddf584a5da6fefb8ff03619eaee87120974e` |
| Product/test commit | `5c2631a94408a509b7ea35dde972ae31d75e9f76` |
| Product tree | `ebf2c817e4cf1ae3880674eb783322f9b2c50fd1` |
| Remote rollback ref | `recovery/vnx-07-messenger-durable-text-outbox` → `5c2631a94408a509b7ea35dde972ae31d75e9f76` |
| Exact-SHA CI | [run `31460794057`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31460794057), run 16/attempt 1, `SUCCESS`, 2m22s, all seven jobs passed |
| Capability state | `RECONSTRUCTED/MODERNIZED/TESTED`; server UUID transaction remains PostgreSQL-scoped `RUNTIME_VERIFIED` |
| Production decision | `NO-GO` |

## Reproduced gap and classification

At the base, `artifacts/banco-mobile/app/messages/[id].tsx` kept pending sends
only in component state. A process kill, screen teardown, or relaunch removed an
unacknowledged text attempt even though VNX-02 already supplied the durable
`client_message_id` server contract. The existing Messenger guard still passed.

The advanced client outbox is not classified `DELETED`: no original blob or
commit was recovered. The defensible classification is `UNPROVEN` historical
work followed by a bounded `RECONSTRUCTED/MODERNIZED/TESTED` implementation.
The initial focused provider command was deterministically RED because the
provider/module did not exist on the base.

## Accepted behavior and safety invariants

- Body-only text is serialized under an account-scoped AsyncStorage v1 key
  before any token acquisition or POST.
- Each immutable attempt retains owner, conversation, UUID, body, and creation
  time. The queue is capped at 100 entries, 200,000 total body characters,
  4,000 characters per body, 24 hours of automatic retry, and seven days of
  retention.
- One root provider owns replay. A failed/waiting head blocks only its own
  conversation lane; serialized order remains the durable FIFO authority.
- Transport captures owner/session/generation, verifies the Clerk JWT `sub`,
  passes an explicit bearer plus `AbortSignal`, and rechecks identity before and
  after the request. Tokens are never persisted.
- Explicit logout, account deletion, loaded account switch, and tombstone
  transitions abort and sanitize the owner queue. Unresolved Clerk state
  suspends work without purging.
- A matching acknowledgement alone removes a record. Failed ACK storage cleanup
  is retried locally with bounded backoff and never replays the network POST.
- Query-cache acknowledgement seeding is fenced against late account changes.
- Composer revision and conversation binding prevent stale enqueue completion
  from clearing an A→B→A draft or a reply selected while persistence is pending.
- The existing direct path remains authoritative for replies, offers,
  listing-card shares, images, video, audio, and all media URLs.

## Adversarial findings closed before freeze

The final candidate was not accepted on its first green test result. Read-only
adversarial reviews reproduced and then verified closure of these cases:

1. late user-A acknowledgements writing into user-B's shared query cache;
2. logout/delete proceeding while an in-flight flush remained unsettled;
3. purge or Clerk sign-out failure leaving the provider permanently suspended;
4. storage removal failure leaving plaintext queue data or blocking new-owner
   hydration;
5. persistent ACK-removal failure causing an idempotent POST replay storm;
6. same-millisecond relaunch order being changed by random UUID sorting;
7. missed AppState background transitions and a non-proving StrictMode test;
8. stale composer completion erasing a newly retyped equal-value draft or a
   later reply selection.

The final independent Messenger and production reviews both returned `GO` for
this bounded freeze. That decision does not expand the runtime certification.

## Provenance and immutable blobs

| File | Base blob | VNX-07A blob | Decision |
|---|---|---|---|
| `artifacts/banco-mobile/context/MessageOutboxContext.tsx` | absent | `d3a01dc5f4f1ceee83d40f65e6cd24929bfed207` | root processor, identity fences, persistence, lifecycle and ACK cleanup |
| `artifacts/banco-mobile/lib/messageTextOutbox.ts` | absent | `b110a0c3462bd8e29371b50426936b46781aa11e` | versioned codec, validation, retention, retry and FIFO policy |
| `artifacts/banco-mobile/app/messages/[id].tsx` | `62412e84493c092acf3fb0a65bf948aeb0b008db` | `3780837683a693a5307e9aa504c236c6fd345652` | body-only enqueue plus draft/reply revision fence |
| `artifacts/banco-mobile/app/_layout.tsx` | `5fcb5427d4f0925e3bc8c9e0e3db26a2ad903273` | `6b280e76e977af51563ace4b050b755a5b5d8f2b` | single root provider and tombstone teardown |
| `artifacts/banco-mobile/app/(tabs)/profile.tsx` | `8ecea095ab85671e9bf5137c82ec92716e40b834` | `0e1997aff04dde4c0feabdc8adc6ad3cf893eaad` | explicit logout/delete coordination and visible failure |
| `artifacts/banco-mobile/app/settings.tsx` | `702dccf03cd51f8a88f3db001efc6a2052228567` | `7719351cc6064e341ccb5e75b9366dca8b6442cd` | explicit logout coordination and recovery |
| `artifacts/banco-mobile/context/BiometricContext.tsx` | `38ee25ae271f08f90a9de19d61566e29204a600c` | `e4f82396d9334b1090dcc537578ef630ec732596` | exposes hydration boundary to the processor |
| `artifacts/banco-mobile/constants/i18n.ts` | `2ffd861503555db6ee258979973f7da2cb1de41f` | `f1f80d7cd60fa5275e6c077bf4e710ce05b22c69` | bilingual durable-send and lifecycle failure copy |
| `artifacts/banco-mobile/tests/render/MessageOutboxProvider.render.test.tsx` | absent | `18227eb24151642a6a168386036ef3155c1ef2ed` | 16 mounted persistence/identity/lifecycle/ordering cases |
| `artifacts/banco-mobile/tests/render/ThreadScreen.render.test.tsx` | absent | `a748c783ce8fe1dd5a48aeb8342376e639b14ae5` | six mounted composer/path/visibility cases |
| `artifacts/banco-mobile/tests/messenger-wiring-guard.test.mjs` | `ed5d577adb24ffba146c96101cd0424958069c79` | `295d0b3aed1b8a47dc9a8a5d49a329e7e6c3a1f5` | static root/body-only/lifecycle boundary |
| `artifacts/banco-mobile/tests/render-coverage-guard.test.mjs` | `e093a15d01a71dd8e801199dc90688d91e225c95` | `8ac05e487898697a8edba41631ece47697fa5d7e` | makes both new RNTL suites reachable |

Preserved and unchanged:

- `SectionSearchApp.tsx` blob
  `bd0f46e766e1f274b05206e46d662f88a6bc9edc`;
- `ConversationService.ts` blob
  `35fef650e473f72229b4e07545720989edffe742`;
- PostgreSQL integration test blob
  `8de550f6246e426fa87e3cceddf3b9d69809bb5e`; and
- migration `0006_outgoing_thunderball.sql` blob
  `caf760042ae695117c90ee51326ab086a2b47c02`.

No API controller, OpenAPI, generated schema, database schema/migration,
provider, Map, section parent, or deployment runtime changed.

## Verification ledger

All local pnpm gates used the Corepack-provided `pnpm 11.9.0` shim.

| SHA/tree | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| base tree over `cd16d17` | focused `MessageOutboxProvider.render.test.tsx` Jest run | `artifacts/banco-mobile` | RNTL / RED | **EXPECTED FAIL**: provider/module absent |
| exact product tree `ebf2c817` | focused provider + thread Jest run | mobile | RNTL | **PASS**, 2 suites/22 tests |
| same | `node --test tests/messenger-wiring-guard.test.mjs tests/render-coverage-guard.test.mjs` | mobile | Static/meta | **PASS**, 22/22 (Messenger 16 + registry 6) |
| same | ESLint over all 12 touched product/test files with `--max-warnings 0` | mobile | Targeted lint | **PASS**, zero output |
| same | `pnpm --filter @workspace/banco-mobile run typecheck` | root/mobile | TypeScript | **PASS** |
| same | `pnpm --filter @workspace/banco-mobile test` | root/mobile | Full mobile chain | **PASS**, ending 16 suites/120 renderer tests |
| same | `node scripts/chain-integrity-gate.mjs` | repository root | Cross-product static rail | **PASS**, 242/242 |
| same product tree, with documentation-only closeout changes present | `PATH=<Corepack pnpm 11.9.0 shim>:$PATH npm run build` | repository root | Full production build | **PASS**: all typechecks/workspace builds, Expo 3,566 modules, Next 46/46 and 48/48 pages |
| exact `5c2631a94408a509b7ea35dde972ae31d75e9f76` | GitHub Actions run `31460794057` | Ubuntu 24.04 + PostgreSQL 16 | CI/integration | **PASS**, all seven jobs; migrations 418ms + replay 7ms; `ConversationService` 10/10; API 90 files/499 tests passed with 1 file/3 tests skipped; mobile 16 suites/120 tests |

The CI production-static job also passed chain 242/242 and confidence 23/23.
Dependency audit recorded two narrowly scoped Metro build-time `image-size`
waivers through 2026-09-09 and zero blockers. These are CI evidence, not live
production certification.

## Explicitly excluded and open gates

VNX-07A does not provide background execution after the OS kills the app. It
does not add realtime/WebSocket, typing, read cursor, block, mute, voice
recording, or durable media/reply/listing/offer sends. AsyncStorage is
application-sandbox persistence; this is not an encryption-at-rest or secure
erase claim. PII-free off-device telemetry is not implemented by this batch.

The following remain `UNPROVEN`: Android/iOS airplane-mode and kill/relaunch;
two-account physical-device switching; live Clerk token/session behavior; live
network timeout/reconnect; encrypted-at-rest extraction; provider and push/deep
link journeys. The PostgreSQL job proves the existing same-UUID server result
on the exact product SHA, but not the mobile device lifecycle.

Two production-program defects discovered during closeout remain separate and
blocking: root `lint` currently covers maintenance scripts rather than all
workspaces, and several operator-facing Coolify/migration documents still
describe obsolete `push --force` behavior although executable CI/compose paths
use committed migrations. They are recorded for VNX-OPS-02; neither is hidden
by this freeze.

Production remains **NO-GO**.
