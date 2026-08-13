# BANCO — Independent Production Audit

**Auditor:** Claude (independent QA / anti-contamination role — no development authority)
**Date:** 2026-08-11
**Audited tree:** `waelzaid66-max/bancoboom-v-next-` @ `canonical/vnext-assembly` = **`e4b8f29`**
**Ancestry:** `bancoboomstor@a3db5bd8` (true git ancestor — 197 shared commits)
**Environment of record:** node v22.22.2, pnpm 11.9.0 (Corepack), Linux x64
**Mandate:** verify with evidence that claimed work exists, is integrated, and that no regression or loss occurred.
**Constraints honoured:** no code changed · no files deleted · no restructuring · no guessing. Every finding carries its command, file, or line.

---

## 1. Executive summary

The project is a large, coherent pnpm monorepo whose **claimed work does exist and is integrated**. Every gate I executed independently passed, and every ledger claim I sampled matched reality. I found **no new regression** and **no evidence of lost work** in the current assembly.

The distance to production is therefore **not** a code-completeness problem. It is a **runtime-proof** problem: nothing has been exercised on a physical device or against a live provider, and the release identity (tags) does not exist, which leaves the automated deploy path inert.

| Dimension | Verdict |
|---|---|
| Claimed work exists and is integrated | ✅ **Confirmed** by execution |
| Regression or loss since the fork | ✅ **None found** |
| Architecture soundness | ✅ **Strong** — see §2 |
| Test-layer completeness | 🟡 **Good and growing** (120 render + 30 static guards + 91 API test files) |
| Runtime / device / provider proof | 🔴 **Absent by construction** — 0 capabilities at `DEVICE_VERIFIED` or `LIVE_VERIFIED` |
| Production readiness | 🔴 **NO-GO** — concurs with the manager's own declared position |

**Headline count:** 3 Critical · 4 High · 6 Medium · 2 Low. None of the Critical items is a code defect; all three are dependency, identity, or failure-visibility issues.

---

## 2. Architecture assessment

| Layer | Evidence | Assessment |
|---|---|---|
| Monorepo | pnpm workspaces, 18 projects, `packageManager` pinned to `pnpm@11.9.0`, identity guard at `scripts/workspace-verify.mjs` | Sound. Version pinning is enforced, not advisory |
| Database | **74 tables · 50 enums · 181 indexes · 116 FK references · 7 check constraints · 8 forward migrations** (`0000`→`0007`) | Sound. Migration-authority model with drift check; no push-force path remains |
| API | **174 endpoints across 30 route modules**, versioned under `/v1` | Sound. Guards applied at router level where appropriate |
| Mobile | Expo SDK 54 / RN 0.81.5, New Architecture on, expo-router typed routes, React Compiler enabled | Modern and consistent |
| Maps | One engine, two hosts: `mapHtml.ts` (672 lines) + vendored Leaflet 1.9.4 + MarkerCluster 1.5.3 inlined; native = WebView, web = iframe, **both import the same builder** | Strong — the two platforms structurally cannot drift |
| Messenger | Idempotent send (`client_message_id` + unique index), atomic message/unread transaction, durable notification outbox, durable account-bound text outbox | Strong — correctness foundations were built before features |
| Governance | `AGENTS.md` operating contract + 4 mandatory control ledgers + capability state machine (`RECOVERED → MODERNIZED → TESTED → RUNTIME_VERIFIED → DEVICE_VERIFIED → LIVE_VERIFIED`) | Exceptional. Rare in projects of this size |

**Assessment:** the architecture does not require a rewrite anywhere. I found no module where partial repair is impossible.

---

## 3. Verification performed (executed, not read)

| Gate | Command | Result |
|---|---|---|
| Reproducible install | `pnpm install --frozen-lockfile` | ✅ pass |
| Render layer | `pnpm --filter @workspace/banco-mobile run test:render` | ✅ **120/120, 16 suites** |
| Full mobile chain | `… run test` | ✅ all green |
| Mobile typecheck | `… run typecheck` (`tsc -b` + `--noEmit`) | ✅ exit 0 |
| Chain integrity | `node scripts/chain-integrity-gate.mjs` | ✅ **242/242** |
| Root compile gate | `npm run build` ×2 consecutive, clean tree | ✅ **exit 0 both**, 2nd = 3m37s |
| Mobile bundle | `run build:web` (Metro web export) | ✅ real export produced |
| Production confidence | `production-confidence-check.mjs` | ✅ 18/18 (measured on the ancestor) |

**Growth across the three batches I tracked:** render tests 76 → 97 → **120**, while the chain assertion count held flat at **242/242** — i.e. no guard was traded away to buy a test.

---

## 4. Functional audit — module by module

Legend: ✅ complete at source+test layer · 🟡 partial · 🔴 missing · ⚠️ risk

| Module | State | Evidence |
|---|---|---|
| **Authentication (Clerk)** | ✅ code / 🔴 live | `ClerkProvider` + **2.5s load gate** so a failed clerk-js never white-screens the app; token getter degrades to anonymous instead of throwing |
| **Social sign-in (Apple/Facebook/Google)** | ⚠️ **blocked by tenant config, not code** | `startSSOFlow` wired for all three (`profile.tsx:744-750`); `usesAppleSignIn: true`; `expo-apple-authentication` plugged **and** installed. `useSocialProviders.ts` reads the tenant's `/v1/environment` and **fails closed** — the production tenant has an empty social dictionary, so **no buttons render** |
| **Registration / account types** | ✅ | Four product families → `individual` · `business`(→dealer\|company, preserving an existing company) · `bank` · `funder`; FI sub-type persisted as `fi_license_type` with an explicit never-erase rule |
| **Profile** | ✅ | Account-type picker, consent, `account_type` sync to `/me` |
| **Roles & permissions** | ✅ | Two orthogonal axes: `user_role` (business) and `staff_role` (owner/admin/moderator/support/user) with `is_admin` as derived mirror. `requirePermission(...)` guards **all 44 admin endpoints**; `hasPermission` unit-tested (owner has all incl. `manage_roles`; admin all except `manage_roles`) |
| **Navigation / shell** | ✅ | 5-tab shell, mini-app bottom nav, safe-area authority, render-contract tested (VNX-04) |
| **Five sections** | ✅ standalone | Cars · Property · Stay · Facilities · Materials — every header render-tested; `SectionSearchApp` hosts four, `BookingStaysApp` hosts Stay independently |
| **Messenger** | 🟡 | Wired: reactions, reply/quote, media, attachments, read receipts, listing refs, presence, idempotent send, durable text outbox, 3s polling. Missing: **block/mute (absent from schema entirely)**, typing, realtime transport, voice notes, per-conversation read cursor |
| **Maps** | 🟡 | Server-side clustering, draw-area, hub world, pin picker, honest "N on the map" caption, `?map=1` latch. Manager closed 4 real defects (orphaned web bridge, degenerate shapes, stale viewport, response race). Open: tile provider + tile-failure visibility |
| **Search** | ✅ | 6 endpoints; domain isolation; facets; sort axis incl. `popular` |
| **Discover** | 🟡 | `SearchDiscover` **is mounted** (`search.tsx:588`). The Wave8 "melt bridge" removal was **deliberate** (documented: Discover cards used to filter the shared Search tab in place — an owner-visible regression). saved/recentlyViewed/trending/popular all live on Saved tab, Home rails (9 rails), `getTrending`, and the sort axis. **Only "recent searches" is genuinely absent** |
| **Notifications** | ✅ | 4 endpoints (list/read/register+unregister push token); mobile screen 366 lines; `getExpoPushTokenAsync({projectId})`, Android channel at `HIGH` importance, permissions requested; durable outbox behind an advisory lock |
| **Wallet / billing** | ✅ source | 5 wallet endpoints, 3 mobile screens (wallet/billing/invoices); billing receipt outbox with migration `0005` |
| **Uploads / media** | ✅ source | 4 endpoints: `request-url`, `promote`, `verify` (all `requireAuth`) + `objects/*path` (`optionalAuth` + `mediaRateLimiter` — correct for private serving with authz inside). Immutable promotion `uploads/ → final/` is unit-tested |
| **Payments** | ✅ source / 🔴 live | Webhook is intentionally unauthenticated and **HMAC-verified inside the handler** — verified by reading `payments.ts`; idempotency and refund safety preserved |
| **Admin / Dealer OS** | ✅ source | Admin: 44 endpoints, every one permission-gated. Dealer: `router.use(requireDealerRole)` protects **all** 8 routes including CSV bulk import |
| **Mini apps** | ✅ | 6 section screens + Maps hub; boundaries guarded by `section-miniapp-guard` |

---

## 5. Database audit

- **74 tables**, **50 enums**, **181 indexes**, **116 FK references**, **7 check constraints**.
- **8 forward migrations** `0000`→`0007`, journal-tracked; CI performs *fresh migrate → replay → idempotency* proof.
- Outbox tables follow a consistent, correct pattern: `UNIQUE(message_id)` for dedupe, per-channel checkpoints (`in_app_processed_at`, `email_processed_at`), `attempt_count` + `available_at` for backoff, and a due-scan index.
- Referential hygiene: `ON DELETE cascade` for owned rows, `set null` for optional references (e.g. `listing_id`, `reply_to_id`).
- **No defect found.** Schema authority is single-sourced; force-push paths were retired.

## 6. API audit

- **174 endpoints / 30 modules**, all under `/v1`.
- Guard patterns verified by reading, not grepping: router-level (`dealer` → `requireDealerRole`), per-route (`requireAuth`), permission-based (`requirePermission` across admin), and `optionalAuth` for public-but-personalisable surfaces (feed, companies, ads).
- Rate limiting present on essentially every route (`publicRateLimiter` / `writeRateLimiter` / `mediaRateLimiter`).
- **Validation:** 71 zod schemas; **30 of 34 controllers** call `parse`/`safeParse`.
- Generated clients (`api-client-react`, `api-zod`) are codegen'd from OpenAPI with a freshness gate (173 operationIds asserted present).
- **No unauthenticated write path was found.** The one unauthenticated route (`POST /payments/webhook`) is by design and signature-verified.

## 7. Security assessment

| Control | Status | Evidence |
|---|---|---|
| Secrets in source | ✅ clean | Repo-wide scan: no live keys; every `pk_live_` hit is a comment/example. No `.env` tracked |
| AuthN | ✅ | Clerk, with fail-safe degradation to anonymous |
| AuthZ | ✅ | Two-axis roles + permission matrix, unit-tested |
| Tenant isolation / KYC access | ✅ source | FI workspace lifecycle with advisory-lock provisioning and audit trail |
| Private media | ✅ source | Signed serving, ownership checks, immutable promotion |
| Payment integrity | ✅ source | HMAC webhook, idempotency, refund safety |
| Rate limiting | ✅ | Applied across the surface |
| Abuse control (user-level) | 🔴 **gap** | **No block/mute anywhere** — see H-3 |
| Dependency security | ✅ | `dependency-security-gate.mjs` + lockfile supply-chain policy verification in CI |

## 8. Performance assessment

Measured from a real Metro web export:

| Metric | Value |
|---|---|
| Total web export | **19 MB** |
| JS | 6.9 MB (**single entry chunk 7.13 MB**) |
| Assets | 12 MB |
| Fonts shipped | 26 files / 6.6 MB — **only 8 files / 1.67 MB are loaded** |
| Heaviest assets | `section-hero/car.png` 1.1 MB · `boom-logo.png` 774 kB · `banco-glow.png` 561 kB (all PNG) |
| Messenger polling | 3s per open thread ≈ 20 req/min/thread |
| Root build | 3m37s (serialized workspace scheduling) |

## 9. Production readiness

Against the manager's own 16 release gates: **root production build** has partial evidence (I contributed two consecutive clean runs); **every other gate is OPEN** — Docker images, Compose runtime, Coolify staging, external providers, Android, iOS, accessibility, observability, backup/restore, rollback, dependency/security on final RC, PostgreSQL snapshot matrix, reproducible checkout.

**Capability state distribution:** `TESTED` = most · `RUNTIME_VERIFIED` = 2 (PostgreSQL scope only) · `DEVICE_VERIFIED` = **0** · `LIVE_VERIFIED` = **0**.

---

## 10. Issues register

### 🔴 CRITICAL

**C-1 — Production deploy path is inert.**
`git tag -l` → **0**; root `package.json` version `0.0.0`; `.github/workflows/deploy.yml` triggers on `push: tags: ["v*.*.*"]`. With no tag in existence, the automated production deploy **cannot fire**. Owner decision (a tag fires a real deploy).

**C-2 — Basemap depends on OpenStreetMap's public tile servers.**
`mapHtml.ts:78` → `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`. The OSM Tile Usage Policy does not cover commercial/heavy use and is enforced by blocking; the `{s}` subdomain form is additionally deprecated. At marketplace traffic this is a *"maps stopped working today"* event with no warning and no code change on our side. Requires a tile provider or self-hosting **before launch**.

**C-3 — Tile failure is invisible.**
No `tileerror` handler exists in the generated map document (the only handled failure is locate-me). If tiles are blocked, throttled, or the device is offline, the user sees **pins floating on a blank grey canvas with no message**. Combined with C-2 this converts a supplier problem into a silent product failure. Fix is contained to one file.

### 🟠 HIGH

**H-1 — The workspace identity guard blocks the final compile gate on a legitimate clone.**
`scripts/workspace-verify.mjs:6-9` requires `origin` to end with a literal `.git`; line 77 compares with `endsWith` and never normalises. `git clone <plain GitHub URL>` stores the non-`.git` form → `prebuild` fails → **`npm run build` is unreachable**. **Reproduced twice**, including a live abort of my second build run; adding `.git` produced `BANCO_WORKSPACE_OK`. This also endangers the "Reproducible checkout" release gate, where the failure would be misread as an identity violation.

**H-2 — Social sign-in is invisible in production (owner-side, zero code).**
The tenant's social dictionary is empty, and provider discovery **fails closed**, so Apple/Facebook/Google buttons never render. Enabling them in the Clerk Dashboard makes them appear **with no release**. Note: Apple Sign-In is mandatory for App Store review once any other social login ships.

**H-3 — No user-level abuse control in Messenger.**
Block and mute are absent from the schema entirely (verified: every `block*` hit in the schema is unrelated prose; every `mute` hit in the thread is the `mutedForeground` colour token). App stores expect user-blocking wherever user-to-user messaging ships. Already on the manager's backlog as `P0 later`; recorded here as a **launch-gating compliance risk**, not a surprise.

**H-4 — A superseded, conflicted PR is still open on the ancestor repo.**
`bancoboomstor#8` is `mergeable_state: dirty` and obsolete: merging it would remove the jest devDeps and exclude `tests/render/**` from typecheck — deleting the render layer that VNX-01/04/05/06/07 are built on. **It should be closed, not merged.** (This is my own earlier PR; I have deliberately not closed it, as that is the manager's decision.)

### 🟡 MEDIUM

**M-1 — 4.98 MB of fonts are shipped and never loaded.** 26 font files (6.6 MB) ship; 8 (1.67 MB) are loaded. Cause: `app/_layout.tsx:8,15` imports from the package roots, whose index re-exports 20 weights. Per-weight subpaths are viable (no `exports` map blocks deep imports). Same graph feeds the native binary.

**M-2 — `eas.json` → `submit.production.ios`** holds `{"appleId":"","ascAppId":"","appleTeamId":""}`. Empty strings read as invalid, so `eas submit -p ios` fails rather than prompting.

**M-3 — EAS slug divergence.** vNext and `bancoboomstor` declare `slug: banco-mobile`; legacy `bancotoday` declares `slug: bancoboom` for the **same** `projectId 45f092c8-…`. One EAS project has one slug — confirm on expo.dev before the first store build.

**M-4 — `user_role.enterprise` is unreachable.** Present in the enum; no picker, no onboarding activity, and no `apiAccountTypeForFamily` branch can produce it. Needs an explicit decision so it cannot silently become dead-but-branched-on.

**M-5 — "Recent searches" does not exist.** Exhaustive sweep of seven naming variants across mobile, api-server, and `lib/db` returns zero files. Not damaged or guard-reverted — never built on this lineage.

**M-6 — Web bundle weight.** 19 MB total with a single 7.13 MB JS chunk and 1.1 MB photographic PNGs. Affects first load on the web surface.

### 🟢 LOW

**L-1 — OSM attribution string incomplete.** `mapHtml.ts:367` → `"&copy; OpenStreetMap"`. ODbL expects "OpenStreetMap **contributors**" plus the copyright link — and the same file argues (line 283) that attribution is a legal notice.

**L-2 — Property and Facilities are the only two sections without a dedicated static guard file**, relying on the shared section/neutral guards. Not a defect; the thinnest coverage of the five.

---

## 11. Verified as correct — do not re-audit

These were checked and **cleared**, several of which look like defects under a careless grep:

- **Dealer routes are protected.** `router.use(requireDealerRole)` covers all 8, including CSV bulk import. A line-level grep suggests otherwise; the router-level guard is real.
- **The payments webhook is unauthenticated by design** and HMAC-verified inside the handler.
- **Admin uses `requirePermission`**, a finer control than `requireAuth`, on all 44 endpoints.
- **Outbox concurrency is sound** — advisory lock (key `48150009`) on both the cron and startup-drain paths + `UNIQUE(message_id)` + per-channel checkpoints. No duplicate-send path exists.
- **`app.config.ts` spreads `app.json`** (no static store config is lost) and **throws** on an EAS build whose origin is unset or `replit.com`.
- **Android App Links are scoped correctly** to `/l` and `/listing`, matching the iOS AASA; the EAS guard and the host resolver read the **same three env vars**, so a store build cannot ship unscoped filters.
- **iOS privacy manifests are complete and correct** — UserDefaults `CA92.1`, FileTimestamp `C617.1`, DiskSpace `E174.1`, SystemBootTime `35F9.1`.
- **`react-native-maps` removal is intentional and complete** — zero imports remain; maps are WebView-hosted.
- **Push is correct for SDK 54 / Android 13+** — `projectId` passed, `default` channel at `HIGH`, permissions requested.
- **Test wiring is intact** — every `test:*` script points at a file that exists; zero unwired test files remain.

---

## 12. Regression findings

**No new regression was found in this audit.**

Historical regressions I reported earlier were all closed by the manager, and I verified each closure on the current tree:

| Historical defect | Status on `e4b8f29` |
|---|---|
| Duplicate `sectionAccentAlpha` (TS2323/TS2393) | ✅ single declaration |
| Lockfile drift → every CI job died at install | ✅ resolved at the root (jest devDeps restored + `test:render` rewired) |
| 4 unregistered banks-screen icons | ✅ registered |
| Orphaned jest render tests | ✅ revived and expanded into a 120-test render layer |
| `retired-red-guard` wired to nothing | ✅ wired (VNX-01) |
| `render-coverage-guard` stranded on a branch | ✅ landed |
| `DEPLOYMENT_SOURCE_OF_TRUTH.md` naming the wrong repo | ✅ corrected, with pre-consolidation repos explicitly excluded |

**Loss check:** the fork carries true ancestry (197 shared commits, `a3db5bd` is a real ancestor), all 19 branches are 0-unmerged, and a comparison against the two tagged pre-migration originals found only two absent files — `sync-aws-virgen.yml` and `sync-bancooom.yml`, both automation for retired repositories. **Nothing substantive was lost.**

---

## 13. Risk analysis

| Risk | Likelihood | Impact | Exposure |
|---|---|---|---|
| OSM blocks the tile requests (C-2) + silent failure (C-3) | Medium–High at scale | **Severe** — maps appear broken app-wide | Every map surface, both platforms |
| Store rejection for missing user-blocking (H-3) | Medium | High — blocks release | iOS + Android review |
| Store rejection for missing Apple Sign-In once social ships (H-2) | Medium | High | iOS review |
| Device-specific defects surfacing late | **High** — 0 device proof exists | High — late discovery is expensive | All mobile |
| Provider integration failures (Clerk/storage/Paymob/push/email) | Medium | High | Auth, media, payments, notifications |
| First-load abandonment on web from bundle weight (M-1, M-6) | Medium | Medium | Web surface |
| Someone merges `bancoboomstor#8` (H-4) | Low | **Severe** — deletes the render layer | Whole mobile test posture |

---

## 14. Prioritised action plan

**Tier 0 — zero code, unblocks immediately (owner)**
1. Enable `oauth_apple` / `oauth_facebook` / `oauth_google` in the Clerk Dashboard → buttons appear with no release (H-2).
2. Close `bancoboomstor#8` (H-4).
3. Choose a map tile strategy — provider key or self-hosted (C-2). Procurement, not code, and it gates launch.
4. Issue a written decision on the release tag (C-1).

**Tier 1 — small, isolated, no product delta (each is one file)**
5. Add `tileerror` handling with an honest offline/blocked state + a render test (C-3).
6. Normalise the `.git` suffix in the origin guard + a unit assertion for both URL forms (H-1).
7. Correct the OSM attribution string (L-1).
8. Fill or remove the empty `submit.production.ios` fields (M-2).

**Tier 2 — measured wins**
9. Per-weight font imports — 4.98 MB measured, verified viable (M-1).
10. Convert the heaviest photographic PNGs (M-6).
11. Confirm the EAS slug on expo.dev (M-3).
12. Decide `enterprise`: document as admin-assigned, or retire (M-4).

**Tier 3 — capability work, only after Phases 1–3 are adjudicated (manager's own sequencing)**
13. Block/mute — new table + policy check in `ConversationService.sendMessage`, no transport change (H-3).
14. Decide "recent searches": build or explicitly reject (M-5).
15. Voice notes — schema already anticipates `mediaKind: "audio"`, `expo-audio` already installed.
16. Realtime — per the manager's standing decision, **no transport change before an ADR**; the honest sequence is offline queue first (idempotent send already makes replay safe), then evaluate SSE before WebSockets.

**Tier 4 — the real remaining distance (not code)**
17. Physical Android and iOS devices — unlocks every device gate; **0 capabilities are device-proven today**.
18. Live provider credentials — Clerk, object storage, Paymob sandbox, email, push.
19. Coolify/Docker staging — unlocks image, compose, staging, backup/restore and rollback gates.
20. Recover or formally write off the lost "advanced Messenger wave": I searched **all 25 repositories in the account** for its distinguishing markers (`isTyping`/`typingIndicator`/`blockedUsers`/`mutedConversations`, `WebSocket`/`socket.io`/`EventSource`, `block_user`/`blocked_users`/`user_blocks`, voice recorder) and found **zero hits**. It is not hiding in an older repository; if it exists it is outside GitHub (a Replit snapshot, a laptop, an archive). *Limit: GitHub code search principally indexes default branches, so this is strong but not absolute evidence.*

---

## 15. Auditor's statement

No file in either repository was created, modified, deleted, or restructured during this audit, apart from this report. No rewrite is recommended anywhere: in every area examined, partial and bounded repair is demonstrably possible. Where I could not verify something — live providers, physical devices, the Clerk Dashboard, expo.dev — I have said so rather than inferred it.

The manager's declared position (**assembly `GO` one bounded batch at a time; production deploy `NO-GO`**) is, on this evidence, **correct and well-supported**.

---
*Independent audit — evidence-based, execution-verified. Findings without a reproducible command or a file/line pointer were excluded by design.*
