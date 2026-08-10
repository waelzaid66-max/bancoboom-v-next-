# BANCO Codex Recovery Backlog

This ledger covers provable Codex work in the owner-selected recent window and
owner-attributed capabilities for which no Git object was recovered. A claim
without repository/branch/SHA/blob/path/test evidence remains `UNPROVEN`.

## Account-wide decisions already reached

| Capability | Evidence | Current decision | Remaining gate |
|---|---|---|---|
| Accounts/Clerk lifecycle hardening | `66771d6`; `meController.ts`, `UserService.ts`, mobile profile/onboarding | `ALREADY_PRESERVED` in `a3db5bd8` | Live Clerk/role/deletion journeys |
| Private media/upload/KYC/chat storage | `66771d6`; upload/object-storage/private-media files and tests | `ALREADY_PRESERVED` | PostgreSQL plus live S3/Replit/device proof |
| Payment binding/idempotency/refund safety | `66771d6`, `ae52fe3`; payment provider/controller/services | `ALREADY_PRESERVED` | PostgreSQL and Paymob staging |
| Messenger media/security integration | `66771d6`; `ConversationService.ts`, controller, thread, guards | `ALREADY_PRESERVED`; must constrain reconstruction | Authenticated two-party media journey |
| Import document ownership/media | `66771d6`; `ImportOrderService.ts`, `OrderDocuments.tsx` | `ALREADY_PRESERVED` | PostgreSQL/provider journey |
| Billing receipt outbox | `ae52fe3`; migration `0005`, `BillingNotificationService.ts` | `ALREADY_PRESERVED`; used as architectural precedent | Worker/provider runtime |
| Dependency/CI/release/AWS Docker hardening | `f61cb95`, `a3db5bd8` | `ALREADY_PRESERVED` | Exact target CI and Docker/Coolify runtime |

## Reconstruction and adjudication queue

| Priority | Capability | Historical/recovery evidence | Decision | Dependency / acceptance |
|---|---|---|---|---|
| P0 frozen candidate | Messenger notification outbox | Advanced wave owner-attributed; no commit/blob; billing outbox `ae52fe3` precedent; product `38697ea`, verification `6af3413`, CI `31396133572` | `RECOVER` reconstructed; PostgreSQL tested journeys `RUNTIME_VERIFIED` | Push receipts, live email, device routing, retention/queue operations, staging/live DB |
| P0 frozen candidate | Messenger client send idempotency | No historical object; base lacked the field; target `e318cef` | `RECOVER` reconstructed; candidate `TESTED` | PostgreSQL race/retry and device reconnect proof |
| P0 frozen | Shared mobile results/navigation shell | `ea71942`, `127e3d7`; current blobs `a9aaff1`, `d1f451d`; target `7e1f17c` | `ALREADY_PRESERVED`; renderer protection added with no product delta; CI all jobs PASS | Android/iOS safe-area/deep-link/accessibility/device matrix |
| P0 | Section-specific integration architecture | `SectionSearchApp.tsx` conflicted merge lineage `a61c1e1`, `11d8185`; current blob `bd0f46e` | `CONFLICT_DAMAGED/UNPROVEN`; adjudicate per capability, never wholesale | Cars/Property/Facilities/Materials capability matrices; Stay remains independent app |
| P0 frozen | Cars identity/header usability | `eaa835a`…`96e7363`, especially real collapse `310028d`; current blob `bfbe1e1`; target `e3f92c2`; CI `31399958518` | `ALREADY_PRESERVED`; renderer protection added with no product delta | Combined section journey, 320–430 AR/EN/RTL/LTR, accessibility, Android/iOS/device runtime |
| P0 frozen | Property identity/header usability | `1bfa485` → hidden-control fix `9d402d4` → current blob `f47ddfa`; target `b51f791`; CI `31404662388` | `ALREADY_PRESERVED`; renderer protection added with no product delta | Combined section journey, 320–430 AR/EN/RTL/LTR, accessibility, Android/iOS/device runtime |
| P0 | Stay/Facilities/Materials identities | known lineages and hidden overlay pattern | `RECOVER` only after independent archaeology | Empty/error/scrolling/pinned state proof |
| P0 | Maps runtime | `127e3d7`, `a4c1eb0`, `34709b4`, `12ce4f4`; current blobs preserved | `ALREADY_PRESERVED` in source; no older copy | Web/Android/iOS certification; repair only reproduced defects |
| P0 later | Messenger offline/reconnect/read cursor/block/mute | Owner-attributed advanced wave, no recovered object | `UNPROVEN`; reconstruct after platform phases | Product policies, schema/API design, DB/device tests |
| P1 later | Messenger realtime/typing/voice/delivery states | No recovered object; poll-only is current intentional architecture | `UNPROVEN`; no transport change before ADR | Provider/transport/privacy/battery policy and device proof |
| P0 | Discover recent/popular/saved/trending/recently viewed | historical shrink and later guard-reverted restoration | `RECOVER` capability-by-capability | Understand guard rejection and section routing first |
| P0 | Four account journeys | source indicates four account families; exact policies need matrix | `ALREADY_PRESERVED` source, behavior `UNPROVEN` | Signup→delete matrix and live Clerk/KYC |
| P1 | Publishing/listings/media | current hardening plus historical UI/routes | `UNPROVEN` until page inventory | Create/edit/publish/storage journeys |
| P1 | Payments/financing | current source hardening | `ALREADY_PRESERVED` source | PostgreSQL, Paymob, FI/admin lifecycle |
| P1 | Admin/Dealer/Web | current workspaces and historical reports | `UNPROVEN` completeness | Route/permission/production journey inventory |

## Unresolved Codex anchors

The recent forensic ledger records 17 supplied SHA anchors that were absent from
the available Git corpus. They stay `UNPROVEN`; they are never invented or used
as cherry-pick claims. Equivalent behavior may still be accepted only through a
file/blob/patch-id/function-signature match or a newly supplied object.

## Decision vocabulary

- `RECOVER`: proven behavior must enter the target through a bounded batch.
- `SUPERSEDE`: target behavior replaces a historical implementation while
  retaining its product intent and later safety invariants.
- `ALREADY_PRESERVED`: no source restoration; verify runtime before changing.
- `INTENTIONALLY_REJECT`: evidence records why the capability is excluded.
- `UNPROVEN`: insufficient object, policy, test, or runtime evidence.

No backlog item may silently become `FORGOTTEN`; closing it requires one of the
four decisions above plus an exact evidence pointer.
