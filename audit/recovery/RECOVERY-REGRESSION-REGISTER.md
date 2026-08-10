# BANCO Recovery Regression Register

Every later batch must preserve these fixes/invariants or update this register
with stronger evidence. A green compile cannot waive a product/runtime rail.

| Bug or invariant | Historical fix/evidence | Files/surface | Final protection / current status |
|---|---|---|---|
| Semantic conflict loss in the shared section integration point | merges `a61c1e1`, `11d8185`; multiple parents chose whole blobs | `SectionSearchApp.tsx` | Never rewrite/replace wholesale; capability-level three-way comparison required |
| Literal conflict markers entered Import | `11d8185` then cleanup `7a47b94` | Import auctions/documents and related merge files | Parser/build plus restored Import guard membership; VNX-01 |
| Import tracking and paired stage rails fell out of guard scope | first parent around `fa023715`, lost at `11d8185` | Import screens and `import-honesty-guard` | VNX-01 restored explicit membership and cancelled-grey exception |
| Retired red guard existed but did not execute | `63f89e8`/`fa023715`, package merge at `11d8185` | mobile package test chain | VNX-01 wires `test:retired-red`; full mobile chain PASS |
| Render claims could silently become unreachable | side candidates `a8e2ba5`, `2934e3d`; VNX-04 shared-shell census | mobile render suites/registry | VNX-01 registry plus VNX-04 results/nav and VNX-05A–D Cars/Property/Stay/Facilities mounting; 9 suites, 68 tests at `2d39bc3` |
| Cars fake collapse did not reclaim geometry | `310028d` | Cars header and scroll offsets | VNX-05A mounts the current blob and proves height 244→0 at scroll 0→96 while controls remain; Cars 5/5 and CI all jobs PASS at `e3f92c2`; combined section/native 320–430 device tests still required |
| Controls/identity hidden by empty/error overlay | Property `9d402d4`, Stay `d098047`, Facilities `ca19018` | pinned vs scrolling header slices/list overlays | VNX-04 proves overlay/list coexist; Property 8/8, Stay 7/7, and Facilities 8/8 standalone renderers preserve pinned controls and real collapse with exact-SHA CI green. Combined section/booking state and device matrices remain required |
| Historical agent ownership left one section outside canonical neutral tokens | shared migration `e495e02`; Stay follow-up `8b26a08`; VNX-05D RED 3/4 | five section headers and `section-neutrals-guard` | VNX-05D `2d39bc3` binds Facilities to `SECTION_NEUTRAL`; guard now covers all five headers and passes 4/4; domain accents remain independent |
| Discover capability shrink and later routing damage were conflated | `13dd751`, `7e73e5a`, `93b650b`, `c49b3b9`, `0d4ea409` | `SearchDiscover` and section routes | Separate feature deletion, routing orphaning, and guard-reverted restoration |
| Maps bottom controls could sit under bottom navigation | `127e3d7`, `a4c1eb0` | `MapOverlayChrome`, map hosts | Map chrome guard 16/16; native safe-area/device proof still required |
| Draw-area count could overclaim results | `a4c1eb0`; geo area contract | `mapHtml`, `geoArea`, map hosts | Geo-area 11/11 and map chrome guards; large-result runtime remains required |
| Bookable map pin depended on font/emoji rendering | `34709b4` | `mapHtml.ts` | Inline SVG and generated-page parser guard |
| Messenger send icon/presence could regress visually | `f045d27`, `9f04383`, `98b74d9`, `73a5c22` | thread/icons/presence components | RNTL render suites 31/31; Android/iOS visual proof remains required |
| Ambiguous Messenger retry duplicated message/unread | target reconstruction `e318cef` | DB schema/migration `0006`, API, mobile thread | Scoped unique UUID and atomic message/unread transaction; CI `31396133572` `ConversationService` 10/10 on PostgreSQL; native reconnect/device remains `UNPROVEN` |
| Message commit could lose its notification work on process stop | no recovered advanced object; billing precedent `ae52fe3`; reconstruction `38697ea` | `MessageNotificationService.ts`, message transaction, migration `0007`, scheduler/readiness | VNX-03 atomically enqueues and retries with channel dedupe/checkpoints; guard follow-up `6af3413`; CI `31396133572` all jobs and PostgreSQL 499 tests PASS; push/provider/device remain `UNPROVEN` |
| Old Messenger recovery could make private media public | current hardening `66771d6` | upload claims, finalization, private media serving | Attachment ownership/policy/private finalization must remain before durable message |
| Payment replay/refund/order-binding regression | `66771d6`, `ae52fe3` | Paymob/provider/payment services | Existing idempotency and DB-independent tests; live Paymob remains blocking |
| Schema authority bypass through push-force/manual edits | migration line through `0005`, target `0006`, then VNX-03 `0007` | `lib/db`, migration scripts, CI/deploy | Generated additive migrations, drift check, migrate×2 PostgreSQL gate; never force-push schema |
| Build reports hid main API type errors by running mobile-only checks | historical testing blind spot | root scripts/workspaces | Every batch runs package tests/typecheck and final root `npm run build` |
| Parallel recursive root builds failed inside Next export cleanup | inherited parallel root command; reproduced twice after `f61cb95` cleanup hardening | root `package.json`; both Next build surfaces | VNX-OPS-01 `d6b42b5` sets pnpm workspace concurrency to 1 and protects it with chain assertion 242/242; local full root build and exact-SHA CI `31403501605` PASS. One later local Next compile stall was interrupted and did not reproduce in the immediate isolated retry, so clean repeated final-RC builds remain blocking |
| Deployment fixes could be lost while restoring old UX | `f61cb95`, `a3db5bd8` | CI, Docker, Coolify, AWS Next prebuild | Preserve exact files/guards; Docker/Coolify exact-SHA runtime required before release |

For each newly discovered regression add: bug, historical fix, SHA, exact files,
test, and final protection before the affected capability can be frozen.
