# BANCO — Maps and Messenger Forensic Recovery Ledger

- **Date:** 2026-08-10
- **Window:** 2026-07-22 through 2026-08-10 UTC
- **Current baseline:** `bancoboomstor@a3db5bd8c3edd060d35078aefeec709297abbad9`
- **Scope:** Maps and Messenger only
- **Purpose:** correct the invalid inference that preserved Codex-authored commits imply preserved Codex task output
- **Action boundary:** evidence only; no product-code edit, merge, cherry-pick, commit, push, or vNext population

## 1. Corrected answer

The owner objection is valid.

The earlier identity ledger proved only this:

- five commits authored and committed as `Codex <codex@openai.com>` are present;
- none of those five Git objects is missing.

It could not prove that every Codex cloud/local task was committed, pushed, or
committed under the Codex identity. Feature integrity must be adjudicated from
files, blobs, routes, schema, guards, and runtime evidence.

The focused result is:

| Domain | Source result | Runtime result | Forensic classification |
|---|---|---|---|
| Maps | Latest known committed Maps hub and all later map capabilities are present and wired in `a3db5bd8` | No native/WebView/device render was performed in this investigation | `UNPROVEN` — preserved source, runtime not certified |
| Messenger | The committed polling messenger is present and later hardened, but the claimed advanced realtime/integrity wave is absent from source | Static guards pass; device/live behavior not certified | `UNPROVEN` — owner-claimed Codex output has no recoverable Git object; capabilities are absent from HEAD |

## 2. Maps provenance

### 2.1 Historical peak and current blobs

The dedicated Maps mini-app landed in `banco-with-wael` at `85cfe7f` and was
later corrected to the BANCO red identity at `e4d36b6`. The repository was then
snapshot-migrated into `bancoboomstor` at `89d28d3`.

| Capability/file | Historical source | Historical blob | Current blob | Result |
|---|---|---|---|---|
| Dedicated `/section/maps` route | `banco-with-wael@85cfe7f` | route introduced there | current route present | `PRESERVED` |
| `MapsHubApp` with All/Cars/Properties/Materials/Factories/Stays worlds | `banco-with-wael@85cfe7f`, evolved by `e4d36b6` | `01bba4f44d2be50477d8593c2381313d675fa29d` at old default head | `01bba4f44d2be50477d8593c2381313d675fa29d` | byte-identical `PRESERVED` |
| Map latch | July production wiring | `711c46567869b9f40107934b65a41549f3248d2f` | `711c46567869b9f40107934b65a41549f3248d2f` | byte-identical `PRESERVED` |
| Map overlay/bottom clearance | `127e3d7` | older default blob `35a5be8...` | `547ed5a30e2bf623cabe827ff1b3d8a5f6a6ddc2` | current is later |
| Native map host/clusters | July wiring, then `a4c1eb0` | `5ca4d1bea6ba36850b3fea5f4a9461312597798a` | `5017d4b9c23bc251940712368addb1b5c4d41c84` | current is later |
| Web map host/geolocation | July wiring | `141e49d969be8f6aa2add8b0a25cae4b95e62dfe` | `3d24c9fb44e43190c3769307f3faa117b4ef18fe` | current is later |
| Leaflet page, clusters, radius, pins | July wiring, then `34709b4` | `ad4bc386996a0c04b71ed4df2dc9eb204ff7a4d8` | `4a20ef18935dd48607f72d4435f89ab81bfdb046` | current is later |
| Draw-area/polygon geometry | `a4c1eb0` | absent from old default head | `0b4ce5361080d52fd0b57765ff57f0d62371b9fe` | added in current lineage |
| Listing pin picker | July wiring | `601a82dcee79f48d493cdc24b5c779370b1cbf10` | `75d37ed9dee6448d943fdd12245b7782b74d721f` | current is later |

### 2.2 Current Maps capability census

| Capability | Current evidence | Status |
|---|---|---|
| Dedicated Maps mini-app | `app/section/maps.tsx` mounts `MapsHubApp` | `PRESERVED` |
| Discover entry | `SearchDiscover` CTA and Search-tab FAB route to `/section/maps` | `PRESERVED` |
| Stack registration | `app/_layout.tsx` registers `section/maps` | `PRESERVED` |
| Per-section feeds | Cars, Property, Materials, Factories, Stay route with `?map=1` | `PRESERVED` |
| Geolocation | native WebView plus web iframe/navigator handling | `PRESERVED` |
| Server clusters | `getMapClusters`, viewport reporting, cache, stale-response guard | `PRESERVED` |
| Near-me radius | criteria radius and circle drawing | `PRESERVED` |
| Draw search area | inline draw controls and area bridge messages | `PRESERVED` |
| Polygon filtering | `geoArea.ts` ray-casting and bounds helpers | `PRESERVED` |
| Honest mapped count | exact-only area count and server total handling | `PRESERVED` |
| SVG pins | bookable and control glyphs are inline SVG | `PRESERVED` |
| Bottom-nav clearance | derived through `miniAppNavClearance` | `PRESERVED` |
| Map/list sync | hub list toggle, open-listing bridge, filter/viewport refresh | `PRESERVED` |
| Map latch | shared latch plus Stay/section handling | `PRESERVED` |
| Pin picker | create/edit map pin surface exists | `PRESERVED` |
| Runtime visibility | no Android/iOS/WebView render in this forensic pass | `UNPROVEN` |

Maps is therefore **not deleted from Git** and is not orphaned from navigation.
If it is absent on the owner's screen, the remaining hypotheses are stale
binary/bundle, wrong deployed SHA, runtime failure, auth/data state, or visual
coverage. Source restoration would be the wrong first action.

## 3. Messenger provenance

### 3.1 What the committed lineage contains

The July `banco-with-wael` messenger production wave was incorporated into the
snapshot migration. The current files are later, larger blobs:

| File | Old default-head blob / chars | Current blob / chars | Result |
|---|---|---|---|
| Inbox | `9df293c...` / 12,963 | `7e5d697...` / 15,067 | later current implementation |
| Thread | `330ebcc...` / 65,191 | `27b3eef...` / 70,459 | later current implementation |
| `ConversationService` | `5c35efa...` / 25,000 | `020f2a0...` / 27,439 | later current implementation |
| Controller | `58d244b...` / 5,192 | `a463496...` / 5,421 | later current implementation |
| Routes | `fdaf95e...` / 1,066 | same blob | byte-identical |

Current committed behavior includes:

- inbox/unread and deep-link wiring;
- listing/company/assistant thread routing;
- polling with focus control;
- cursor-style older-page loading;
- optimistic send and tap-to-retry;
- reactions, reply/quote, listing sharing, offers, report, and soft-hide;
- image/video/audio attachment schema and rendering;
- private participant-authorized media and finalization hardening;
- read timestamps and denormalized unread counters;
- push/in-app notification routing;
- privacy-bounded presence in inbox and thread; and
- the corrected send icon plus renderer tests.

### 3.2 Advanced capabilities absent from HEAD

| Claimed/expected capability | Current source result | Classification | Recovery evidence |
|---|---|---|---|
| `client_message_id` idempotency and UUID reconciliation | no DB column, API input, unique index, or client payload | `UNPROVEN` | no commit/blob located |
| Durable per-message outbox | only billing has a transactional outbox; Messenger does not | `UNPROVEN` | no commit/blob located |
| Offline send queue/reconnect replay | no Messenger queue or replay worker | `UNPROVEN` | no commit/blob located |
| Realtime/WebSocket transport | current guard explicitly rejects WebSocket clients and requires poll-only behavior | `UNPROVEN` | July inventory records it as an intentional gap |
| Typing indicator/events | only prose uses the word “typing”; no event, schema, endpoint, hook, or component | `UNPROVEN` | no commit/blob located |
| Read cursor | per-message `read_at` and aggregate unread exist; no participant cursor | `UNPROVEN` | no commit/blob located |
| Explicit mutual block | rate limiting and report exist; no block relation/gate | `UNPROVEN` | historical report records MSG-08b as missing |
| Per-thread mute | no schema, API, or UI | `UNPROVEN` | historical report records MSG-13 as missing |
| In-chat voice recording | backend accepts audio and UI can open audio; composer only picks images/videos | `UNPROVEN` | `expo-audio` dependency exists, but no recorder wiring; historical report records MSG-14c as missing |

These rows are not classified `DELETED`, because no original implementation
object has been recovered. The defensible statement is:

> The capabilities are absent from `a3db5bd8`. The owner attributes a later
> implementation to Codex, but the available Git refs, reflogs, stashes,
> worktrees, dangling objects, reports, and known SHAs contain no recoverable
> implementation. If that task existed, it did not reach the preserved Git
> corpus.

## 4. Targeted test evidence

| SHA | Command | Workspace | Type | Result |
|---|---|---|---|---|
| `a3db5bd8` | `node --test tests/messenger-wiring-guard.test.mjs tests/map-chrome-guard.test.mjs tests/geo-area-guard.test.mjs` | `artifacts/banco-mobile` | static/source guards | 39/39 PASS: Messenger 12, Maps chrome 16, geometry 11 |
| `a3db5bd8` | prior literal `npm run build` after census | repository root | build | PASS, exit 0 |

The 39 guards do not prove Maps WebView rendering or Messenger device/network
behavior. One of them explicitly protects the poll-only architecture, so a
green result cannot be cited as proof that realtime Messenger exists.

## 5. Recovery decision

1. Keep `bancoboomstor@a3db5bd8` as the recovery base. It contains the strongest
   verified Maps source and the latest security/storage/payment/deployment
   hardening.
2. Do not restore Maps from an older repository. First prove the exact SHA on
   Web/Android/iOS and diagnose why the existing route is not visible.
3. Treat the absent Messenger capabilities as a reconstruction tranche, not a
   cherry-pick tranche. Rebuild them on top of the current private-media,
   participant-auth, idempotent-payment, migration-authority, and CI invariants.

No recovery code was written in this phase.

Run npm run build
