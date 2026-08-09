# BANCO RC1 Validation — 2026-08-09

**Base:** `main@36766cfc966de4d0c0b8d96a65bff299082ed143`
**Workspace:** `/workspace/scratch/84295b972399/bancoboomstor`
**Scope:** pre-publish validation of the preserved local working tree. The user authorized one commit and push after these gates; no deployment, tag, secret rotation, destructive reset, stash, replacement clone, local branch, or worktree was created.

## Release decision

**Local source/native-bundle candidate: PASS. Million-scale production release: NO-GO until the gates below are proved.**

1. **Clerk:** rotate the exposed keys before any shared staging use, inject them securely with publishable and secret keys from the same Clerk instance, then prove email/SSO and all four account families. Independent scanning found real Clerk key values in tracked historical reports on the base/history; the current tip redacts them, but that does not revoke them or erase Git history.
2. **Database:** run committed migrations, seed, and the full API suite against disposable PostgreSQL 16 on the exact candidate SHA. Application code consumes only an injected `DATABASE_URL`; selecting the final Replit, Qualify, or Coolify hostname is not required for this gate.
3. **Live storage:** the immutable temp-to-final contract is implemented and locally tested. Exercise the opt-in suite on configured S3 and Replit/GCS storage, including overwriting/recreating the temporary key after finalization and proving the final bytes do not change.
4. **Paymob:** exercise signed success/decline/void/refund callbacks and replay on test mode. Authenticate transaction inquiry before applying cumulative partial-refund deltas, clear each durable reconciliation marker only after the exact wallet/subscription adjustment, and prove notification delivery survives process restart.
5. **CDN + derivatives + distributed abuse controls:** put public media behind a proved range-aware CDN, generate responsive image/poster variants, and replace the process-local rate-limit store with an external/edge policy. The new 1,200/min media budget prevents the old 120/min self-throttle but is only an origin fallback.
6. **Signed native devices + load profile:** run picker/camera, image/video upload, seeking, private chat/KYC/import playback, background/weak-network recovery, notifications and deep links on physical low/mid/high-tier Android and iOS devices; then prove the target concurrency, cache-hit ratio, p95/p99 latency, origin egress, memory and crash-free-session SLOs.
7. **Android notification asset:** replace the current wide red BANCO logo with an approved white transparent notification glyph, then rebuild and inspect it on a physical Android device. This is a brand asset decision and was not fabricated locally.

## Final evidence

| Gate | Result |
|---|---:|
| Workspace identity (one repo/worktree, exact base, exact branch) | PASS |
| `pnpm@11.9.0 install --frozen-lockfile` | PASS; 1,802 lockfile supply-chain entries reviewed |
| Peer dependency validation | PASS; no peer issues |
| Literal root `npm run build` after media + DB-gate + AUTH-account + PAYMENT-INTEGRITY + operational-SoT repair | PASS, exit 0 |
| Production confidence | 25/25 PASS |
| Website CI local | 18/18 PASS |
| Chain integrity/history guards | 215/215 PASS |
| Mobile full regression pack | 399/399 PASS |
| Mobile iOS Jest render subset | 31/31 PASS |
| Accounts/Clerk journey | 18/18 PASS |
| API media/range/ACL/rate-limit DB-independent focused rerun | 73/73 PASS; 3 live-storage tests explicitly SKIPPED; DB-backed import/account suites reserved for PostgreSQL CI |
| API payment binding/refund/void DB-independent focused suites | 6/6 PASS |
| Full API/PostgreSQL suite | NOT EXECUTED on this unpushed candidate; the existing CI job injects disposable PostgreSQL 16, then seeds and runs the full suite |
| Committed migration integrity | PASS; CI/deploy/local runners use `check` + `migrate` twice and the static production guard rejects `push-force` authority |
| Storage live-sidecar suite | 3 tests explicitly SKIPPED until configured integration runtime |
| Mobile authenticated-media policy | 4/4 PASS |
| API, mobile, admin, website and shared-lib typechecks | PASS |
| Native Android export | PASS; 3,846 modules, 64 assets, 10.9 MB Hermes bundle |
| Native iOS export | PASS; 3,849 modules, 63 assets, 10.9 MB Hermes bundle |
| Expo web export in final root build | PASS; 3,563 modules |
| Root ESLint (`scripts --max-warnings 0`) | PASS |
| `git diff --check` | PASS |
| Current-tree merge-marker/secret/private-key scan | PASS after redaction; historical Clerk values require external rotation |

## Continuity and monorepo controls

- Added a root `AGENTS.md` source of truth for the official repository, dirty-tree preservation, package-manager identity, and verification order.
- Added `scripts/workspace-verify.mjs` and wired it into `prebuild`; it proves the exact repo root, `main`, base SHA, one worktree, and `pnpm@11.9.0` before building.
- Pinned the package-manager contract and made Replit/setup/confidence checks agree on the same pnpm version and workspace.
- Replaced disposable PostgreSQL `push-force` setup in CI/deploy verification
  with committed migration validation and two migration passes before seed/test;
  the second pass is an explicit idempotency proof.
- The final pre-commit verification reported the same root and base with 122 preserved changed paths; nothing was silently discarded or replayed.
- Reconciled Copilot's docs-only audit commit `ff6638b` without merging its branch. PR #8's duplicate-symbol, icon, Metro, lockfile, and render-test concerns are already resolved by the local candidate and proved by frozen install, mobile typecheck, icons `6/6`, and iOS render `31/31`.
- Expanded Copilot's stale-repository finding from one document to 14 live operator surfaces. The new chain guard failed `201/215` before repair and passes `215/215` after every Coolify/cutover/status/Cloudflare surface was corrected to `bancoboomstor`.
- Verified the allegedly stranded well-known renderer already exists in `main`; no broad branch merge or duplicate implementation was introduced.

## Accounts and Clerk

- Preserved the canonical runtime Clerk publishable key through native builds and removed pinned-key/source-secret risk.
- Restored and tested the four account families: individual, business, bank, and funder.
- Bank and funder remain financial-institution accounts with distinct routes and `fiType`; account selection is responsive 2×2 and localized.
- The account choice becomes durable only after `updateMe` succeeds; dismissal, demotion, deleted-user, and stale-state guards remain intact.
- A financial-institution `PATCH /me` now waits for idempotent workspace provisioning; repeating the request also heals a crash after the role commit instead of returning a permanently half-created bank/funder account.
- The profile `UPDATE` itself rejects a concurrent account tombstone and a stale personal write that lost a race with an FI/company promotion, preventing PII from being written back after deletion.
- A post-commit media-cleanup exception no longer skips the Clerk deletion attempt; the PostgreSQL-backed behavioral regression test is committed to the full DB gate.
- Local source correctness does not rotate a leaked external secret or prove a Clerk tenant configuration; that remains release gate 1.
- Current `ADMIN_EMAILS` behavior intentionally promotes every listed address to Owner on `/me`, even after another Owner exists; the controller comment claiming “first only” is stale. The exact production allowlist must be reviewed before staging.

## Payments and Paymob

- Client `confirm` endpoints are read-only status polling; only the HMAC-verified server webhook can settle wallet or subscription value.
- Intention creation now requires Paymob `intention_order_id` and stores it before returning checkout. A signed webhook with no pre-bound order returns 503 and cannot use unsigned `merchant_order_id` / extras to establish first-use ownership.
- Paymob documents `amount_cents` as the original transaction amount and `refunded_amount_cents` as the cumulative amount across one or more partial refunds. Because the latter is not in the 20-field transaction HMAC, refund callbacks now set `psp_refund_reconciliation_required` instead of changing wallet/subscription value from an untrusted delta.
- The reconciliation marker blocks late success settlement and appears as a persistent critical admin alert. Signed voids still take the full automatic reversal path.
- Source proof is 6/6 focused tests plus 215/215 chain guards. PostgreSQL behavior, live HMAC callbacks, transaction inquiry, marker clearance, and a durable notification/email outbox remain unproved P0/P1 gates.

## Native platform and media

- The app remains Expo/React Native with native Android and iOS exports; no web wrapper was substituted for the mobile product.
- Confirmed image and WAV assets decode, no tracked media link is broken, and there are no tracked video files to validate as bundled course assets.
- iOS ATS is least-privilege with localhost-only development HTTP; location is when-in-use only.
- Android permissions are constrained to camera and foreground location in the explicit config; debug overlay permission remains debug-only.
- Native picker format inference accepts only server-supported containers and fails closed instead of relabeling unsupported video as MP4.
- Private media requests use refreshed Clerk bearer tokens only for the exact configured BANCO upload origin and path; lookalike hosts never receive the token.
- Android/iOS uploads now stream the local file through Expo's native upload task instead of materializing a video-sized `Blob` in the JavaScript heap; the web/unsupported-provider path retains the bounded fallback.
- Gallery and fullscreen pagers use fixed-layout `FlatList` windows; only the active video owns an Expo video player, so inactive slides do not pre-buffer a decoder/source.
- Recycled feed cards reset Expo Image state with `recyclingKey`, resize early on iOS, and use memory+disk caching. Home prefetch is disk-only, begins with eight items, follows the viewport, and caps its URL tracker at 256 entries.

## Upload, KYC, chat, import, and listing security

- Centralized exact stored MIME classification and authoritative positive-size limits: images 15 MB, videos 50 MB, audio 25 MB.
- Public listing/company uploads now require independently verified anonymous readability after ACL promotion; a provider swallowing its ACL write cannot produce a false success.
- KYC, import documents, and first-party chat media are owner-private before the durable database reference is created.
- New public media carries a server-written `public-media` purpose and takes a metadata-only ACL fast path. Legacy/unknown and private-purpose media still checks durable KYC/chat/import relationships first, preventing old public metadata from bypassing owner/participant boundaries.
- Single HTTP byte ranges are parsed strictly and streamed as `206` from both S3 and GCS/Replit providers with `Accept-Ranges`, `Content-Range`, `Content-Length`, ETag and last-modified metadata. Multi-range amplification attempts fail closed with `416`.
- Media serving has a separate operator-tunable 1,200 requests/minute origin budget instead of sharing the general 120/min API limiter; production remains gated on distributed CDN/WAF enforcement.
- KYC and import admins may review only the intended private surfaces; admin status is not blanket access to private chat.
- Mobile chat images/video and import documents now render through authenticated in-app media sources; fullscreen video no longer falls out to an unauthenticated browser.
- Post-commit upload-claim cleanup is best-effort, so a cleanup outage cannot turn a successful durable write into a duplicate-producing client retry.
- Server-issued `/objects/uploads/<uuid>` identities are copied to deterministic `/objects/final/<uuid>` identities before a durable reference is written. S3 binds the source ETag and uses a create-only destination precondition; GCS/Replit pins the source generation and uses `ifGenerationMatch=0`.
- Retrying after destination conflict or after temporary-object deletion resolves only to a proven existing final object. Provider ACL writes refuse a different existing owner, and cleanup deletes only the temporary source.
- Attach retries now read authoritative metadata from the deterministic final object when settlement already removed the temporary source. Only a permanent source-not-found result falls back; network/provider errors remain retryable. The helper is wired to listings/posters, company branding, KYC, chat, and import documents.
- Listing media/posters, company branding, profile cover, KYC, chat attachments, and import documents now persist the returned final URL; the mobile profile no longer stores the pre-promotion temporary cover URL.
- The final hardening makes `PUBLIC_API_BASE_URL` authoritative for issued serving links, validates only HTTP(S) origins without credentials, normalizes proxy lists, and rejects lookalike origins in KYC, verification, promotion, and ACL finalization.
- Public listing/company database-reference fallbacks preserve legacy availability while private references remain `private, no-store`.

## Original eight-issue report

| # | Finding | Final state |
|---:|---|---|
| 1 | Four missing mobile icon mappings | **Fixed and tested.** |
| 2 | Object-storage sidecar tests returned 401 | **Harness fixed.** Live integration is explicit opt-in and still requires the official sidecar. |
| 3 | Clerk redirect loop / mismatched keys | **Current source/report tip redacted; historical-key rotation and paired-tenant staging proof remain.** |
| 4 | Duplicate Replit workflows / port conflicts | **Current source has unique names; confidence prevents duplicate mobile servers.** |
| 5 | Stale mobile static bundle | **Fixed.** Mobile Serve builds current output; build-only workflow stays separate. |
| 6 | Merge conflict markers | **Fixed and continuously gated.** |
| 7 | GitHub CI lacks a database | **Stale finding.** CI provisions PostgreSQL 16; exact-SHA execution remains external. |
| 8 | Metro watches deleted Replit paths | **Fixed and tested** by appending exclusions to Expo's existing block list. |

## Other repairs preserved

- Restored mobile Jest/render dependencies and the render command dropped by an earlier merge.
- Removed the duplicate `sectionAccentAlpha` implementation and kept the clamped implementation.
- Moved media policy guards into DB-independent modules while preserving existing `ListingService` exports.
- Disabled optional Expo telemetry for reproducible restricted builds.
- Replaced fetched `npx wait-on` usage with an internal health poll.
- Strengthened protected-route smoke behavior: missing auth config is 503; configured auth redirects to sign-in.
- Added version-scoped Clerk/React peer policy and guarded unused Solana-wallet peer noise.

## Honest limitations and warnings

- No claim is made for a real-device journey, live Clerk tenant, live Paymob callback, Replit sidecar, production S3 bucket, signing credential, or pushed CI result at this pre-commit evidence point.
- Failed external Clerk/media cleanup after an account tombstone is logged and isolated, but no durable retry/outbox exists yet; this remains part of the jobs/reliability release gate.
- Billing success notifications still use process-local scheduling after financial commit; a crash can lose notification/email delivery. A transactional outbox is not yet implemented.
- Partial Paymob refunds are held for reconciliation because the signed original amount is not the refund delta. Production must not clear the marker or mutate the ledger until an authenticated transaction inquiry is exercised on staging.
- No claim is made that this source tree alone supports millions of daily users. There is no proved public-media CDN/variant pipeline, no distributed rate-limit store, or production load profile.
- Immutable temp-to-final behavior is source- and unit-test-proven, not live-provider-proven. A configured S3 bucket and Replit/GCS sidecar still must demonstrate that changing the reusable temporary PUT key cannot change the final object.
- Admin and dealer Vite bundles exceed 500 kB; this is a performance follow-up, not a correctness failure.
- Vite reports source-map lookup warnings in generated UI modules; builds finish successfully.
- Next.js reports that its plugin is absent from the shared ESLint config; the repository's own lint/website gates pass.
- Node emits `MODULE_TYPELESS_PACKAGE_JSON` for one TypeScript contract test; the test passes and adding package-wide ESM semantics was intentionally not attempted during stabilization.
- npm warns about pnpm-specific config keys when the user-required literal `npm run build` launches the pnpm workspace; the exact pnpm gate still proves 11.9.0.

## Primary references

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo app configuration](https://docs.expo.dev/versions/latest/config/app/)
- [Expo app icons](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo FileSystem legacy upload tasks](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/)
- [Expo Image caching and recycling](https://docs.expo.dev/versions/latest/sdk/image/)
- [Expo Video player preloading](https://docs.expo.dev/versions/latest/sdk/video/)
- [Amazon S3 presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [Amazon S3 CopyObject preconditions](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html)
- [Amazon S3 byte-range GET](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html)
- [Google Cloud Storage request preconditions](https://docs.cloud.google.com/storage/docs/request-preconditions)
- [express-rate-limit stores](https://express-rate-limit.mintlify.app/overview)
- [Apple App Transport Security](https://developer.apple.com/documentation/bundleresources/information-property-list/nsapptransportsecurity)
- [Metro resolver blockList](https://metrobundler.dev/docs/configuration/#blocklist)
- [pnpm peer dependency settings](https://pnpm.io/settings/peer-dependencies)
- [Paymob Create Intention](https://developers.paymob.com/paymob-docs/intention-apis/create-intention)
- [Paymob Transaction Callbacks](https://developers.paymob.com/paymob-docs/manage-callback/transaction-callbacks)
- [Paymob Transaction Inquiry](https://developers.paymob.com/paymob-docs/developers/transaction-inquiry-apis/by-transaction-id)
