# BANCO — Comprehensive Corrective Master Plan

**Date:** 2026-08-09
**Canonical repository:** `waelzaid66-max/bancoboomstor`
**Verified base:** `main@66771d6bec143f675217c44aa48753021c83aa3d`
**Package manager:** `pnpm@11.9.0`
**Decision:** **RC1 NOT READY** — the repository candidate is healthy, but the
live-service and physical-device gates in this document are still mandatory.

This is the current controlling corrective plan. Older audits, Copilot/Claude
handoffs, and historical plans remain evidence, not execution authority. Current
code, the current diff, and exact-tree tests are the source of truth.

## 1. Executive state

The verified base commit is already pushed and green across all GitHub workflows:

| Evidence on `66771d6b`                              |                                                               Result |
| --------------------------------------------------- | -------------------------------------------------------------------: |
| CI                                                  |                                                      7/7 jobs passed |
| PostgreSQL 16 migration + replay + seed + API suite | 89 files / 491 tests passed; 3 configured live-storage tests skipped |
| Website workflow, including Lighthouse              |                                                               Passed |
| Docker workflow                                     |                                                    5/5 images passed |
| Local worktree before this wave                     |                   Clean; one worktree; `main`; `origin/main` matched |

The current bounded corrective wave closes the remaining internal P0 identified
by the latest audit: a successful financial transaction could commit, then lose
its in-app receipt/email when the process died before a process-local
`setImmediate` ran.

### Current wave: durable billing receipt outbox

| Control             | Implementation                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Atomicity           | `billing_receipt_outbox` is inserted inside the same PostgreSQL transaction as the ledger write |
| Covered money paths | wallet top-up; wallet and PSP subscription charge; both lead-charge paths                       |
| Recovery            | startup drain plus a ten-second scheduled processor                                             |
| Replica safety      | PostgreSQL advisory lock `48150008`                                                             |
| Partial delivery    | independent in-app and email checkpoints                                                        |
| In-app dedupe       | unique `notifications.dedupe_key` derived from ledger transaction id                            |
| Email retry dedupe  | stable Resend `Idempotency-Key` derived from ledger transaction id                              |
| Failure behavior    | exponential retry, capped at one hour; error retained on the outbox row                         |
| Schema safety       | additive migration `0005_early_talisman.sql`; `/readyz` fails closed if it is missing           |

The in-app row is durable and idempotent. Email remains dependent on a configured
provider; Resend's provider-level idempotency window is 24 hours, so the honest
contract is retry-safe at-least-once processing, not a claim of mathematically
permanent exactly-once external delivery. Expo push fan-out remains best-effort
and still needs the signed-device/live-provider gate below.

Local evidence for this wave so far:

| Gate                                                          |                                                        Result |
| ------------------------------------------------------------- | ------------------------------------------------------------: |
| Reproduced pre-fix integrity gate                             |                        Failed exactly 4 new outbox guarantees |
| Post-fix chain integrity                                      |                                                223/223 passed |
| Drizzle migration history check                               |                                                        Passed |
| API + shared DB TypeScript check                              |                                                        Passed |
| `git diff --check`                                            |                                                        Passed |
| PostgreSQL behavioral tests for atomic commit/rollback/dedupe |                   Added; exact-candidate CI execution pending |
| Final root `npm run build`                                    | Passed; exit 0; all workspace typechecks and builds completed |

## 2. Copilot PR #8 — adjudicated, do not merge

PR #8 (`copilot/full-audit-primary-agent-report`) was audited against its old
base and against current `main`. It is open, non-mergeable, and superseded.

| Copilot finding                           | Current decision                                              |
| ----------------------------------------- | ------------------------------------------------------------- |
| Duplicate `sectionAccentAlpha`            | Valid on old base; fixed and guarded on current `main`        |
| Four missing icon mappings                | Valid on old base; fixed and tested                           |
| Metro deleted-path watch/block-list issue | Valid on old base; fixed without replacing Expo defaults      |
| Missing lock/render-test repair           | Valid on old base; restored and green                         |
| Stale deployment source of truth          | Valid lead; expanded to all live operator surfaces and closed |
| Allegedly stranded well-known renderer    | Not actionable; renderer already exists in current ancestry   |

Merging PR #8 would reintroduce an old base and is not part of this plan.

## 3. Reconciliation of every inherited finding

### Closed or superseded

| Area                               | Final classification                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Original missing icons             | Closed and tested                                                                              |
| Object-storage test harness 401    | Harness closed; live-provider proof remains external                                           |
| Duplicate workflows/port conflicts | Closed and guarded                                                                             |
| Stale mobile bundle                | Closed; current Metro bundle is built in CI                                                    |
| Merge-conflict markers             | Closed and continuously scanned                                                                |
| GitHub database gap                | Superseded; exact base ran PostgreSQL 16 successfully                                          |
| Metro deleted-path watch           | Closed and tested                                                                              |
| Map “draw area”                    | Implemented in Leaflet bridge and covered by geo-area/map-chrome guards                        |
| Import red/rainbow identity drift  | Closed; canonical car theme tokens and honesty guards are present                              |
| FI source account lifecycle        | Four account families and FI workspace lifecycle exist in source; live tenant remains unproved |

### Confirmed remaining product work

| Item                                                   |                Priority | Required boundary / evidence                                                                                                    |
| ------------------------------------------------------ | ----------------------: | ------------------------------------------------------------------------------------------------------------------------------- |
| Live Clerk tenant, paired keys and redirects           |                      P0 | Rotate exposed historical keys; prove individual, business, bank and funder signup/session/restore/deletion                     |
| Live Paymob settlement and refund reconciliation       |                      P0 | Signed success/decline/void/refund, replay, authenticated inquiry, exact ledger reconciliation                                  |
| Live S3 and Replit/GCS immutable-finalization exercise |                      P0 | Upload A, finalize, replace temp with B, prove final remains A; retry and owner-mismatch proof                                  |
| Exact-candidate PostgreSQL suite                       |                      P0 | Migration check, migrate twice, seed, all API tests, new outbox atomicity tests                                                 |
| Expo push delivery                                     |                      P1 | Signed Android/iOS, background/terminated tap, badge, deep link and dead-token proof                                            |
| CDN/derivatives/origin shielding                       |                      P1 | Responsive images/posters, range-aware cache, hit ratio and egress profile                                                      |
| Distributed abuse control                              |                      P1 | Edge/WAF or shared store; multi-replica proof                                                                                   |
| Docker/Coolify runtime                                 |                      P1 | Build, migrate, ready/health, restart, backup, restore and rollback                                                             |
| External cleanup retry                                 |                      P1 | Durable retry for failed Clerk deletion and external-media cleanup after DB tombstone                                           |
| Advisory-lock collision                                |                      P1 | Give `AdminService.STAFF_ROLE_MUTATION_LOCK` and promo-credit work distinct keys; concurrency regression                        |
| `ADMIN_EMAILS` owner allowlist                         |                      P1 | Explicit production list and proof that no unintended address self-promotes                                                     |
| Banks & Funders standalone world                       |         P1 product epic | Preserve FI backend; add separate bank/funder registration journeys, public directory, lead reception and asset-financing forms |
| BOOM STAY search dates/guests                          | P1 product completeness | Check-in, check-out and guests in search criteria/API/deep links; real conflict/filter tests                                    |
| Messenger mute/block/voice                             |                   P1/P2 | Server model, authorization/privacy semantics, native recording/playback and device tests; no UI-only buttons                   |
| SearchDiscover local gradients/bank blue               |                      P2 | Replace duplicate local tokens with canonical `sectionTheme`; visual widths 320/360/390/430                                     |
| Car raised filter compartments                         |                      P2 | Owner-approved visual treatment, not blind styling; screenshot/device verification                                              |
| Android notification glyph                             |    P2/P1 release polish | Approved monochrome transparent asset and physical Android proof                                                                |
| Admin/dealer bundle size and source-map warnings       |                      P2 | Route splitting and measured regression, without behavior rewrite                                                               |
| Profile restructure and developer/compound model       |       Decision required | Older reports suggested them, but no later owner approval authorizes a broad model/layout change                                |

The old council decision that Banks & Funders may remain a brochure is
superseded by the owner's later explicit decision: bank and funder are separate
account families and must become their own mini-app world. That work must build
on, not replace, the existing FI lifecycle, seats, inbox and admin controls.

## 4. Release-critical execution program

### Wave 0 — durable billing receipts

**Status:** implemented and root-build proven locally; PostgreSQL CI pending.

Acceptance:

1. A committed ledger entry always has one outbox row in the same transaction.
2. An aborted ledger transaction has no outbox row.
3. Reprocessing creates one in-app notification only.
4. Email retries carry the same provider idempotency key.
5. A failed channel retains the row and does not repeat the successful channel.
6. Multi-replica workers serialize on an advisory lock.
7. A deployment missing migration 0005 returns `/readyz` 503.

Rollback boundary: migration 0005 is additive. Older application code tolerates
the added table/nullable column. Do not drop the table during an emergency
rollback; deploy the prior application, retain queued rows, then forward-fix and
drain them.

### Wave 1 — immutable candidate and exact CI

Owner: repository/release engineer.

1. Run the final root build.
2. Review the complete diff and secret scan.
3. Commit one bounded wave and push `main` only under the existing authorization.
4. Require CI, PostgreSQL, website and Docker workflows on the exact commit.
5. No release label while any required job is pending or skipped unexpectedly.

Acceptance: green exact-SHA jobs, migration replay, new DB tests, no untracked
release file, and a clean worktree.

### Wave 2 — Paymob staging and reconciliation

Owner: backend + payments operations.

1. Configure test-mode secrets outside git.
2. Exercise signed callbacks and duplicated delivery.
3. Prove client polling cannot settle value.
4. Query Paymob authoritatively for cumulative partial-refund amount.
5. Apply one exact reversal, clear the reconciliation marker only afterward,
   and prove retry/restart behavior.
6. Kill the API after ledger commit and prove the outbox resumes the in-app
   receipt/email without a second ledger entry.

Acceptance: ledger/balance/invoice/outbox equality before and after replay,
recorded provider references, and no unresolved critical admin marker.

### Wave 3 — Clerk and the four accounts

Owner: identity/security + mobile.

1. Rotate historical exposed keys before shared staging.
2. Inject a publishable/secret pair from one tenant; verify domains and redirects.
3. Prove individual, business, bank and funder journeys on clean devices.
4. Prove FI workspace creation/retry, admin link/seat access and forbidden
   unlinked inbox access.
5. Prove logout, token expiry, account deletion and failed external cleanup retry.
6. Freeze and review the exact production `ADMIN_EMAILS` allowlist.

Acceptance: API role, Clerk metadata, mobile route and FI workspace agree after
restart; deleted accounts cannot authenticate or retain private access.

### Wave 4 — storage, CDN and abuse controls

Owner: platform/media.

Run the opt-in live-storage suite on both provider families, then add/prove CDN
variants, posters, byte ranges, private-media bypass rules, cache invalidation,
origin shielding and a shared rate-limit policy. Record p95/p99, cache-hit ratio,
origin egress and failure behavior; source/unit evidence alone is insufficient.

### Wave 5 — deploy, restore and rollback

Owner: platform/release.

Build and run the exact images, apply migration 0005 once and replay safely,
verify liveness/readiness/deploy SHA, restart during queued work, take a backup,
restore it into a disposable environment, and rehearse application rollback
without destructive schema reversal.

### Wave 6 — signed native devices

Owner: mobile QA.

Use low/mid/high Android and representative iOS devices. Cover account creation,
picker/camera, large upload, image/video seek, private KYC/chat/import media,
map location/draw, background/weak-network recovery, push/deep links, payment
return, memory, crashes and RTL at 320/360/390/430 widths.

### Wave 7 — product completion without architecture melt

Execute as separate mini-app waves in this order:

1. Banks & Funders directory, registration and financing-lead journeys.
2. BOOM STAY date/guest search contract.
3. Messenger mute/block, then voice only after privacy/storage design.
4. SearchDiscover canonical theme cleanup.
5. Car compartment polish after an approved visual reference.

Every wave must begin with a failing contract/visual check, preserve testIDs and
section boundaries, avoid fabricated counts/data, and end with focused tests plus
the root build.

## 5. Go/no-go matrix

| Gate                        | Current state                          | RC1 condition                                   |
| --------------------------- | -------------------------------------- | ----------------------------------------------- |
| Source/build on pushed base | Green                                  | Re-run on outbox candidate                      |
| Billing outbox              | Local source green                     | PostgreSQL + restart proof on exact SHA         |
| Clerk                       | Unproved/live secrets require rotation | Four journeys and deletion pass                 |
| Paymob                      | Source hardened                        | Signed live/test callbacks and inquiry pass     |
| Storage                     | Source hardened                        | Both live provider exercises pass               |
| Docker/Coolify              | Base images green                      | Exact candidate runtime/restore/rollback pass   |
| Native                      | Export evidence only                   | Signed physical-device matrix passes            |
| Scale                       | No production load proof               | Agreed SLO/load/CDN/shared-limit profile passes |

## 6. Immediate command order

1. Review diff, migration and generated snapshot; scan current tree for secrets.
2. Re-run `npm run build` after the final report-only update.
3. Commit/push the bounded wave, then wait for exact-SHA CI/PostgreSQL/website/Docker.

Do not deploy, tag, rotate external secrets, or claim `RC1 READY` during this
wave. Those actions require their explicit live gates above.

## References

- Resend: <https://resend.com/docs/dashboard/emails/idempotency-keys>
- Existing detailed validation: `audit/reports/RC1-VALIDATION-2026-08-09.md`
- Existing A–J state: `audit/reports/MASTER-STABILIZATION-STATE-2026-08-09.md`
