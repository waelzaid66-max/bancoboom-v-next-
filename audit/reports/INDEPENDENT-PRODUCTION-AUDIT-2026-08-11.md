# BANCO — Independent Production Audit

**Auditor:** Claude — independent QA / anti-contamination role, no development authority
**Date:** 2026-08-11
**Audited tree:** `waelzaid66-max/bancoboom-v-next-` @ `canonical/vnext-assembly` = **`e4b8f29`**
**Ancestry:** `bancoboomstor@a3db5bd8` — a true git ancestor (197 shared commits)
**Environment of record:** node v22.22.2, pnpm 11.9.0 (Corepack), Linux x64
**Mandate:** verify with evidence that all claimed work exists, is integrated, and that no regression or loss occurred.
**Constraints honoured:** no code changed · no files deleted · no restructuring · no guessing. Every finding carries a command, file, or line. Anything I could not verify is marked unverified rather than inferred.

---

## 1. Executive summary

**All claimed work exists, is integrated, and no regression or loss was found.** Every gate I executed independently passed, and every ledger claim I sampled matched the tree.

The remaining distance to production is **not code completeness** — it is **runtime proof**. No capability has been exercised on a physical device or against a live provider, and no release tag exists, which leaves the automated deploy path inert.

Three times during this audit, a pattern that *looked* like a serious defect proved correct on inspection: unauthenticated dealer routes (guarded at router level), an unauthenticated payments endpoint (an HMAC-verified webhook by design), and unclamped pagination limits (clamped at the zod boundary). Those candidate findings were **withdrawn** and are listed in §12 so no one repeats the work.

| Dimension | Verdict |
|---|---|
| Claimed work exists and is integrated | ✅ Confirmed by execution |
| Regression or loss since the fork | ✅ None found |
| Architecture soundness | ✅ Strong — no rewrite justified anywhere |
| Code hygiene | ✅ Exceptional — **one** TODO in the entire source tree |
| Test-layer completeness | 🟡 Good and growing — 120 render + 30 static guards + 91 API test files |
| Runtime / device / provider proof | 🔴 Absent by construction — 0 capabilities at `DEVICE_VERIFIED` or `LIVE_VERIFIED` |
| Production readiness | 🔴 **NO-GO** — concurs with the manager's declared position |

**Issue count: 4 Critical · 4 High · 6 Medium · 3 Low.** Only one Critical is a code defect; the others are dependency, identity, or failure-visibility problems.

---

## 2. Architecture assessment

| Layer | Measured evidence | Assessment |
|---|---|---|
| Monorepo | 18 workspace projects; `packageManager` pinned to `pnpm@11.9.0` and **enforced** by `scripts/workspace-verify.mjs` | Sound — pinning is enforced, not advisory |
| Database | **74 tables · 50 enums · 181 indexes · 116 FK references · 7 check constraints · 8 forward migrations** (`0000`→`0007`) | Sound — single schema authority, no force-push path |
| API | **174 endpoints across 30 route modules**, versioned under `/v1` | Sound — guards at the right layer in each case |
| Mobile | Expo SDK 54 / RN 0.81.5, New Architecture, expo-router typed routes, React Compiler | Modern and internally consistent |
| Maps | One builder (`mapHtml.ts`, 672 lines) + vendored Leaflet 1.9.4 / MarkerCluster 1.5.3 (756 lines inlined); native = WebView, web = iframe, **both import the same builder** | Strong — the platforms structurally cannot drift |
| Messenger | Idempotent send (`client_message_id` + unique index), atomic message/unread transaction, durable notification outbox, durable account-bound text outbox | Strong — correctness built before features |
| Governance | `AGENTS.md` operating contract + 4 mandatory control ledgers + a capability state machine (`RECOVERED → MODERNIZED → TESTED → RUNTIME_VERIFIED → DEVICE_VERIFIED → LIVE_VERIFIED`) | Exceptional for a project of this size |

**No module requires a rewrite.** In every area examined, bounded partial repair is demonstrably possible; I could not prove the contrary anywhere, so no rewrite is proposed.

---

## 3. History, prior reports, and documentation audit

| Item | Measured |
|---|---|
| Total commits in the assembly | **235** |
| Authors | Claude **145** · Codex **43** · Banco Group **39** · Replit Agent **8** |
| vNext work since the fork | **38 commits**, 19 branches, **all 0-unmerged** |
| Release tags | **0** |
| Audit markdown files | **334** under `audit/` |
| Docs | 37 under `docs/` + 22 at repo root |
| Control ledgers | 4 mandatory + the production gate matrix |

**Code hygiene — a standout result.** A repo-wide scan for `TODO`/`FIXME`/`HACK`/`XXX` across `artifacts`, `lib`, and `scripts` returns **exactly one marker in source**:

```
artifacts/banco-mobile/context/LanguageContext.tsx:92  // TODO(lang-sync): also PATCH /v1/me with { language: l }.
```

The other 19 hits live in `artifacts/api-server/dist/` — bundled vendor output — and **`git ls-files` confirms zero build-output files are tracked**. That single TODO turned out to describe a real, user-visible defect (**C-4**), which is a strong argument for the discipline that produced it.

---

## 4. Verification performed — executed, not read

| Gate | Command | Result |
|---|---|---|
| Reproducible install | `pnpm install --frozen-lockfile` | ✅ pass |
| Render layer | `run test:render` | ✅ **120/120, 16 suites** |
| Full mobile chain | `run test` | ✅ all green |
| Mobile typecheck | `run typecheck` (`tsc -b` + `--noEmit`) | ✅ exit 0 |
| Chain integrity | `node scripts/chain-integrity-gate.mjs` | ✅ **242/242** |
| Root compile gate | `npm run build` ×2 consecutive, clean tree | ✅ **exit 0 both**; 2nd = 3m37s |
| Mobile bundle | `run build:web` (Metro web export) | ✅ real export produced |
| Production confidence | `production-confidence-check.mjs` | ✅ 18/18 (measured on the ancestor) |

**Trend across three batches I tracked:** render tests **76 → 97 → 120** while chain assertions held flat at **242/242** — no guard was traded away to buy a test.

The two consecutive clean root builds are deliberate: the regression register lists *"clean repeated final-RC builds"* as blocking, and the previously reproduced parallel `ENOTEMPTY` did **not** recur. Supporting evidence only — my sandbox is node 22, CI is node 24, and `e4b8f29` is not the final RC.

---

## 5. Functional audit — module by module

✅ complete at source+test layer · 🟡 partial · 🔴 missing · ⚠️ risk

| Module | State | Evidence |
|---|---|---|
| **Authentication (Clerk)** | ✅ code / 🔴 live | `ClerkProvider` behind a **2.5s load gate** so failed clerk-js never white-screens the app; the token getter degrades to anonymous rather than throwing |
| **Social sign-in** | ⚠️ blocked by tenant config | All three strategies wired (`profile.tsx:744-750`); `usesAppleSignIn: true`; `expo-apple-authentication` plugged **and** installed. `useSocialProviders.ts` reads the tenant's `/v1/environment` and **fails closed** — the production tenant's social dictionary is empty, so no buttons render (**H-2**) |
| **Registration / account types** | ✅ | Four product families: `individual` · `business` (→ `dealer`\|`company`, preserving an existing company) · `bank` · `funder`. FI sub-type persisted as `fi_license_type` under `FI_DETAIL_KEYS` with an explicit never-erase rule |
| **Profile** | 🟡 | Account-type picker, consent, `account_type` sync. **Language preference never reaches the server** (**C-4**) |
| **Roles & permissions** | ✅ | Two orthogonal axes: `user_role` (business) and `staff_role` (owner/admin/moderator/support/user) with `is_admin` as a derived mirror. `requirePermission(...)` guards **all 44 admin endpoints**; `hasPermission` unit-tested (owner has all incl. `manage_roles`; admin all except it) |
| **Navigation / shell** | ✅ | 5-tab shell, mini-app bottom nav, safe-area authority, render-contract tested (VNX-04) |
| **Five sections** | ✅ standalone | Cars · Property · Stay · Facilities · Materials — every header render-tested; `SectionSearchApp` hosts four, `BookingStaysApp` hosts Stay independently |
| **Mini apps** | ✅ | 6 section screens + Maps hub; boundaries enforced by `section-miniapp-guard` |
| **Messenger** | 🟡 | Wired: reactions, reply/quote, media, attachments, read receipts, listing refs, presence, idempotent send, durable text outbox, 3s polling. Missing: **block/mute (absent from the schema entirely)**, typing, realtime transport, voice notes, per-conversation read cursor |
| **Maps** | 🟡 | Server-side clustering, draw-area, hub world, pin picker, honest "N on the map" caption, `?map=1` latch. The manager closed four real defects (orphaned web bridge, degenerate shapes, stale viewport, response race). Open: tile provider and tile-failure visibility |
| **Search** | ✅ | 6 endpoints; domain isolation; facets; sort axis including `popular` |
| **Discover** | 🟡 | `SearchDiscover` **is mounted** (`search.tsx:588`). The Wave8 "melt bridge" removal was **deliberate**, documented in-code: Discover cards used to filter the shared Search tab in place — an owner-visible regression. saved / recentlyViewed / trending / popular live on the Saved tab, Home's 9 rails, `getTrending`, and the sort axis. **Only "recent searches" is genuinely absent** (**M-5**) |
| **Notifications** | ✅ | 4 endpoints (list, read, register/unregister push token); mobile screen 366 lines; `getExpoPushTokenAsync({projectId})`, Android `default` channel at `HIGH`, permissions requested; durable outbox behind an advisory lock |
| **Wallet / billing** | ✅ source | 5 wallet endpoints; 3 mobile screens (wallet/billing/invoices); billing receipt outbox with migration `0005`; transaction page size clamped (`MAX_TX_PAGE`) |
| **Uploads / media** | ✅ source | 4 endpoints: `request-url`, `promote`, `verify` (all `requireAuth`) + `objects/*path` (`optionalAuth` + `mediaRateLimiter` — correct for private serving with authz inside). Immutable promotion `uploads/ → final/` is unit-tested |
| **Payments** | ✅ source / 🔴 live | Webhook intentionally unauthenticated and **HMAC-verified inside the handler**; idempotency and refund safety preserved |
| **Admin OS** | ✅ source | 44 endpoints, **every one** permission-gated |
| **Dealer OS** | ✅ source | `router.use(requireDealerRole)` protects **all 8** routes including CSV bulk import |

---

## 6. Database audit

- **74 tables · 50 enums · 181 indexes · 116 FK references · 7 check constraints.**
- **8 forward migrations** `0000`→`0007`, journal-tracked; CI proves *fresh migrate → replay → idempotency*.
- Outbox tables follow one correct pattern throughout: `UNIQUE(message_id)` for dedupe, per-channel checkpoints (`in_app_processed_at`, `email_processed_at`), `attempt_count` + `available_at` for backoff, a due-scan composite index, and a role check constraint.
- Referential hygiene is deliberate: `ON DELETE cascade` for owned rows, `set null` for optional references (`listing_id`, `reply_to_id`).
- Schema authority is single-sourced; force-push paths were retired and operator documentation corrected (VNX-OPS-02).

**No defect found.**

## 7. API audit

- **174 endpoints / 30 modules**, all under `/v1`.
- Guard placement verified **by reading each module**, not by grep: router-level (`dealer` → `requireDealerRole`), per-route (`requireAuth`), permission-based (`requirePermission` across admin), and `optionalAuth` for public-but-personalisable surfaces (feed, companies, ads).
- Rate limiting present on effectively every route (`publicRateLimiter` / `writeRateLimiter` / `mediaRateLimiter`), with a policy test.
- **Validation:** 71 zod schemas; **30 of 34 controllers** call `parse`/`safeParse`. The four that do not are each justified — see §12.
- **Response contract:** one envelope `{ data, error: { code, message }, meta }` with a **typed union of 13 error codes** — `INVALID_DATA`, `NOT_FOUND`, `UNAUTHORIZED`, `INTERNAL_ERROR`, `FORBIDDEN`, `RATE_LIMITED`, `INVALID_TOKEN`, `ACCOUNT_DELETED`, `CONFLICT`, `SERVICE_UNAVAILABLE`, `WORKSPACE_NOT_ACTIVE`, `INVALID_STATUS_TRANSITION`. Responses are additionally validated against their zod schema before being sent (`validateResponse`).
- Generated clients (`api-client-react`, `api-zod`) are codegen'd from OpenAPI behind a freshness gate asserting 173 operationIds.

**No unauthenticated write path exists.** The single unauthenticated route is the payments webhook, by design.

## 8. Security assessment

| Control | Status | Evidence |
|---|---|---|
| Secrets in source | ✅ clean | Repo-wide scan: no live keys; every `pk_live_` hit is a comment or example. No `.env` tracked |
| Build artifacts in git | ✅ clean | `git ls-files` → **0** files under `dist/`, `build/`, `.next/` |
| AuthN | ✅ | Clerk with fail-safe degradation to anonymous |
| AuthZ | ✅ | Two-axis roles + permission matrix, unit-tested |
| Input validation | ✅ | zod at the boundary; **every caller-supplied `limit` is clamped** (`.min(1).max(50\|100)`) before reaching a service |
| Tenant isolation / KYC | ✅ source | FI workspace lifecycle with advisory-lock provisioning and an audit trail |
| Private media | ✅ source | Signed serving, ownership checks, immutable promotion, MIME/size policy |
| Payment integrity | ✅ source | HMAC webhook, idempotency, refund safety |
| Rate limiting | ✅ | Applied across the surface |
| Dependency security | ✅ | `dependency-security-gate.mjs` + lockfile supply-chain verification in CI |
| **User-level abuse control** | 🔴 **gap** | **No block/mute anywhere** — see H-3 |

## 9. Performance assessment

Measured from a real Metro web export and from source:

| Metric | Value |
|---|---|
| Total web export | **19 MB** |
| JS | 6.9 MB — **single entry chunk 7.13 MB** |
| Assets | 12 MB |
| Fonts | 26 files / 6.6 MB shipped; **only 8 files / 1.67 MB loaded** |
| Heaviest assets | `section-hero/car.png` 1.1 MB · `boom-logo.png` 774 kB · `banco-glow.png` 561 kB — all PNG |
| Messenger refresh | 3s poll per open thread ≈ 20 req/min/thread |
| Root build | 3m37s under serialized workspace scheduling |
| Index coverage | 181 indexes over 74 tables, including composite due-scan and thread indexes on both outboxes |

## 10. User journeys — traced through the code

| Journey | State | Notes |
|---|---|---|
| Guest browse → listing detail | ✅ | Feed and listing reads are public with `optionalAuth` personalisation |
| Sign up → choose account family → profile | ✅ | Four families; consent recorded; `accountTypeChosen` never set before `/me` succeeds |
| Business/FI onboarding → verification | ✅ source | FI has its own activity and its own regulatory identity fields, so a bank never mislabels itself as a dealer |
| Publish a listing (create → media → publish) | ✅ source | `POST /listings` plus the upload claim/promote/verify chain, all `requireAuth` |
| Buyer contacts seller → chat | ✅ | Conversation keyed uniquely on (listing, buyer, seller); idempotent sends; durable outbox |
| Receive a notification (in-app + push) | ✅ source | Outbox → worker under advisory lock → in-app and email channels with independent checkpoints |
| Search → filter → map | ✅ | Shared engine, server clustering, `?map=1` latch shared between hosts |
| Wallet / billing / invoices | ✅ source | Clamped pagination; receipt outbox |
| Admin moderation | ✅ source | Every action permission-gated |
| **Receive email in your chosen language** | 🔴 **broken** | See C-4 |

---

## 11. Issues register

### 🔴 CRITICAL

**C-1 — Production deploy path is inert.**
`git tag -l` → **0**; root `package.json` version `0.0.0`; `.github/workflows/deploy.yml` triggers only on `push: tags: ["v*.*.*"]`. With no tag in existence the automated production deploy **cannot fire**. Owner decision — a tag fires a real deploy.

**C-2 — Basemap depends on OpenStreetMap's public tile servers.**
`mapHtml.ts:78` → `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`. The OSM Tile Usage Policy does not cover commercial or heavy use and is enforced by blocking; the `{s}` subdomain form is additionally deprecated. At marketplace traffic this is a *"maps stopped working today"* event with no warning and no change on our side. A tile provider or self-hosting is required **before launch**.

**C-3 — Tile failure is invisible.**
No `tileerror` handler exists in the generated map document; the only handled failure path is locate-me. If tiles are blocked, throttled, or the device is offline, the user sees **pins on a blank grey canvas with no message**. Together with C-2 this turns a supplier problem into a silent product failure. Contained to one file.

**C-4 — The user's language choice never reaches the server, so server email is sent in the wrong language.** *(new in this audit)*

Proven chain:
- `EmailService` resolves the recipient's language from the database and **defaults to Arabic**: `.select({ language: users.language })` … `return row?.language === "en" ? "en" : "ar"`.
- The server side is complete: `users.language` exists (`schema:510`) and `UpdateMeSchema` accepts `language: z.enum(["ar","en"])` (`schemas.ts:923`).
- But `language` appears **nowhere in `lib/api-spec/openapi.yaml`** and **nowhere in the generated client**, so the mobile app physically cannot send it. `LanguageContext.tsx:92` records exactly this, and the choice is stored only in device `AsyncStorage`.

**Effect:** `users.language` stays NULL for app users, so **every English-speaking user receives all server email in Arabic**, regardless of the language they chose in the app. The fix is small and contained — add the field to the OpenAPI request body, re-run orval, call `updateMe({ language })`. No schema or service change is needed.

### 🟠 HIGH

**H-1 — The workspace identity guard blocks the final compile gate on a legitimate clone.**
`scripts/workspace-verify.mjs:6-9` requires `origin` to end with a literal `.git`; line 77 compares with `endsWith` and never normalises. `git clone <plain GitHub URL>` stores the non-`.git` form → `prebuild` fails → **`npm run build` is unreachable**. **Reproduced twice**, including a live abort of my second build run; adding `.git` produced `BANCO_WORKSPACE_OK`. This also endangers the "Reproducible checkout" release gate, where the failure would read as an identity violation rather than a URL-format mismatch.

**H-2 — Social sign-in is invisible in production — owner-side, zero code.**
The production Clerk tenant has an empty social dictionary and provider discovery **fails closed**, so Apple/Facebook/Google buttons never render. Enabling the providers in the Clerk Dashboard makes them appear **with no release**. Apple Sign-In becomes mandatory for App Store review once any other social login ships.

**H-3 — No user-level abuse control in Messenger.**
Block and mute are absent from the schema entirely — verified with word-bounded searches after discarding a first pass in which `mute` matched the `mutedForeground` colour token and `voice` matched `invoice`. App stores expect user-blocking wherever user-to-user messaging ships. Already `P0 later` on the manager's backlog; recorded here as a **launch-gating compliance risk**.

**H-4 — A superseded, conflicted PR is still open on the ancestor repository.**
`bancoboomstor#8` is `mergeable_state: dirty` and obsolete: merging it would remove the jest devDeps and exclude `tests/render/**` from typecheck, deleting the render layer that VNX-01/04/05/06/07 stand on. **It should be closed, not merged.** It is my own PR; the decision is the manager's.

### 🟡 MEDIUM

**M-1 — 4.98 MB of fonts are shipped and never loaded.** 26 font files (6.6 MB) ship; 8 (1.67 MB) are loaded. Cause: `app/_layout.tsx:8,15` imports from the package roots, whose index re-exports 20 weights, each requiring its `.ttf`. Per-weight subpaths are viable — the packages declare no `exports` map, verified on disk. The same import graph feeds the native binary.

**M-2 — `eas.json` → `submit.production.ios`** holds `{"appleId":"","ascAppId":"","appleTeamId":""}`. Empty strings read as invalid rather than absent, so `eas submit -p ios` fails instead of prompting.

**M-3 — EAS slug divergence.** vNext and `bancoboomstor` declare `slug: banco-mobile`; legacy `bancotoday` declares `slug: bancoboom` for the **same** `projectId 45f092c8-…`. An EAS project has one slug — confirm on expo.dev before the first store build. *(I cannot query expo.dev.)*

**M-4 — `user_role.enterprise` is unreachable.** Present in the enum; no picker entry, no onboarding activity, and no `apiAccountTypeForFamily` branch can produce it. Needs an explicit decision so it does not become dead-but-branched-on.

**M-5 — "Recent searches" does not exist.** An exhaustive sweep of seven naming variants (`searchHistory`, `search_history`, `recentSearch`, `recent_search`, `lastQuer*`, `queryHistory`, `recentQuer*`) across mobile, `api-server/src`, and `lib/db/src` returns zero files. Not damaged, orphaned, or guard-reverted — never built on this lineage.

**M-6 — Web bundle weight.** 19 MB total with a single 7.13 MB JS chunk and 1.1 MB photographic PNGs. Affects first load on the web surface only.

### 🟢 LOW

**L-1 — OSM attribution string incomplete.** `mapHtml.ts:367` → `"&copy; OpenStreetMap"`. ODbL expects "OpenStreetMap **contributors**" plus the copyright link — and the same file argues at line 283 that attribution is a legal notice, not decoration.

**L-2 — Property and Facilities are the only two sections without a dedicated static guard file**, relying on the shared section/neutral guards. Not a defect; simply the thinnest coverage of the five.

**L-3 — Messenger polling cost.** 3s polling per open thread is an intentional architecture — the backlog states poll-only explicitly and forbids a transport change before an ADR. Recorded as a scaling cost to revisit, not a defect.

---

## 12. Verified as correct — please do not re-audit

Each of these looks like a defect under a careless search and is not:

- **Dealer routes are protected.** `router.use(requireDealerRole)` covers all 8, including CSV bulk import. A line-level grep of the route definitions suggests otherwise; the router-level guard is real.
- **The payments webhook is unauthenticated by design** and HMAC-verified inside the handler — it is the only path that settles payments.
- **Admin uses `requirePermission`**, finer than `requireAuth`, on all 44 endpoints.
- **Pagination is safe.** Four services use `params.limit` without a local `Math.min`, but every caller-supplied `limit` is clamped in the zod layer (`.min(1).max(50|100).default(20|30)`) before reaching them. Defense sits at the boundary, which is correct.
- **The four controllers without zod are each justified:** `userController` reads **no** `req.body/query/params`; `paymentsController` is the HMAC webhook; `referenceController` manually coerces its three query params and its service clamps `limit` to `MAX_LIMIT = 20`; the fourth is a test file.
- **i18n parity cannot silently break.** `ar` is constrained as `ar: typeof en` at compile time, so a missing Arabic key fails the build, and a guard additionally verifies every `t()` key used in the app resolves.
- **Outbox concurrency is sound** — advisory lock (key `48150009`) on both the cron and startup-drain paths, plus `UNIQUE(message_id)` and per-channel checkpoints. No duplicate-send path exists.
- **`app.config.ts` spreads `app.json`** (no static store config is lost) and **throws** on an EAS build whose origin is unset or `replit.com`.
- **Android App Links are scoped correctly** to `/l` and `/listing`, matching the iOS AASA; the EAS guard and the host resolver read the **same three env vars**, so a store build cannot ship unscoped filters.
- **iOS privacy manifests are complete and correct** — UserDefaults `CA92.1`, FileTimestamp `C617.1`, DiskSpace `E174.1`, SystemBootTime `35F9.1`.
- **`react-native-maps` removal is intentional and complete** — zero imports remain; maps are WebView-hosted.
- **Push is correct for SDK 54 / Android 13+** — `projectId` passed, `default` channel at `HIGH` importance, permissions requested.
- **No build output is tracked in git** — `git ls-files` returns 0 files under `dist/`, `build/`, `.next/`.
- **Test wiring is intact** — every `test:*` script points at a file that exists; zero unwired test files remain.

---

## 13. Verified completed work

| Area | Proof |
|---|---|
| Canonical ancestry + rollback | 197 shared commits; `a3db5bd` is a true ancestor; `recovery/source-bancoboomstor-a3db5bd8` pinned |
| Protection chain | 242/242 chain assertions; `retired-red-guard` and `render-coverage-guard` both wired |
| Messenger idempotency + notification outbox | PostgreSQL-scoped runtime verification in CI; unique index + atomic transaction confirmed in schema |
| Messenger durable text outbox | 16 render suites / 120 tests green on this tree |
| Shared shell + all five section headers | Render contracts for each; both hosts (`SectionSearchApp`, `BookingStaysApp`) covered |
| Maps draw-area, hub world, response ordering | Four real defects closed by the manager; verified green here |
| Root build serialization | Two consecutive clean builds; `ENOTEMPTY` non-recurring |
| Deployment source-of-truth correction | `docs/DEPLOYMENT_SOURCE_OF_TRUTH.md` now names the consolidated repo and explicitly excludes pre-consolidation ones |

## 14. Missing work

| Missing | Classification |
|---|---|
| Block / mute | Never built — absent at schema level (H-3) |
| Typing indicator, realtime transport, voice notes | Never built; poll-only is an explicit architectural decision (L-3) |
| Per-conversation read cursor | Absent — per-message `read_at` plus side counters exist, which is not a cursor |
| Recent searches | Never built on this lineage (M-5) |
| Language sync to server | Server complete; contract and client missing (C-4) |
| Device and live-provider proof | 0 capabilities at `DEVICE_VERIFIED` / `LIVE_VERIFIED` |
| Release identity | 0 tags (C-1) |

## 15. Regression findings

**No new regression was found.** Every historical defect previously reported is closed on this tree, and I verified each closure:

| Historical defect | Status on `e4b8f29` |
|---|---|
| Duplicate `sectionAccentAlpha` (TS2323/TS2393) | ✅ single declaration |
| Lockfile drift killing every CI job at install | ✅ resolved at the root — jest devDeps restored and `test:render` rewired |
| 4 unregistered banks-screen icons | ✅ registered |
| Orphaned jest render tests | ✅ revived and expanded into a 120-test render layer |
| `retired-red-guard` wired to nothing | ✅ wired (VNX-01) |
| `render-coverage-guard` stranded on a branch | ✅ landed |
| `DEPLOYMENT_SOURCE_OF_TRUTH.md` naming the wrong repo | ✅ corrected |

**Loss check.** The fork carries true ancestry, all 19 recovery branches are 0-unmerged, and a file-level comparison against the two tagged pre-migration originals (`banco-with-wael` tag `w.4.1`, and `bancoo`) found only **two** absent files — `sync-aws-virgen.yml` and `sync-bancooom.yml`, automation for retired repositories. Both originals' last features (EAS build/publish, `oauth_facebook`) are present. **Nothing substantive was lost.**

**One research result the team may not have.** I searched **all 25 repositories in the account** for the distinguishing markers of the unrecovered "advanced Messenger wave" — `isTyping`/`typingIndicator`/`blockedUsers`/`mutedConversations`, `WebSocket`/`socket.io`/`EventSource`, `block_user`/`blocked_users`/`user_blocks`, and a voice recorder — and found **zero hits anywhere**. It is not hiding in an older repository; if it exists it is outside GitHub. *Limit: GitHub code search principally indexes default branches, so this is strong but not absolute.* This supports treating it as bounded reconstruction rather than recovery.

## 16. Risk analysis

| Risk | Likelihood | Impact | Exposure |
|---|---|---|---|
| OSM blocks tile requests (C-2) with silent failure (C-3) | Medium–High at scale | **Severe** — maps appear broken app-wide | Every map surface, both platforms |
| English users receive Arabic email (C-4) | **Certain today** | Medium–High — trust and comprehension | Every non-Arabic user, every server email |
| Store rejection for missing user-blocking (H-3) | Medium | High — blocks release | iOS + Android review |
| Store rejection for missing Apple Sign-In once social ships (H-2) | Medium | High | iOS review |
| Device-specific defects found late | **High** — zero device proof exists | High — late discovery is expensive | All mobile |
| Provider integration failures (Clerk, storage, Paymob, push, email) | Medium | High | Auth, media, payments, notifications |
| First-load abandonment on web from bundle weight (M-1, M-6) | Medium | Medium | Web surface |
| Someone merges `bancoboomstor#8` (H-4) | Low | **Severe** — deletes the render layer | Whole mobile test posture |

## 17. Prioritised action plan

**Tier 0 — zero code, unblocks immediately (owner)**
1. Enable `oauth_apple` / `oauth_facebook` / `oauth_google` in the Clerk Dashboard → buttons appear with no release (H-2).
2. Close `bancoboomstor#8` (H-4).
3. Choose a map tile strategy — provider key or self-hosted (C-2). Procurement, not code, and it gates launch.
4. Issue a written decision on the release tag (C-1).

**Tier 1 — small, isolated, one file each**
5. Add `language` to the PATCH `/v1/me` request body in `openapi.yaml`, re-run orval, call `updateMe({ language })` (C-4). Server and schema are already done.
6. Add `tileerror` handling with an honest offline/blocked state plus a render test (C-3).
7. Normalise a trailing `.git` in the origin guard and assert both URL forms (H-1).
8. Correct the OSM attribution string (L-1).
9. Fill or remove the empty `submit.production.ios` fields (M-2).

**Tier 2 — measured wins**
10. Per-weight font imports — 4.98 MB measured, viability verified (M-1).
11. Convert the heaviest photographic PNGs (M-6).
12. Confirm the EAS slug on expo.dev (M-3).
13. Decide `enterprise`: document as admin-assigned, or retire (M-4).

**Tier 3 — capability work, only after Phases 1–3 are adjudicated (the manager's own sequencing)**
14. Block/mute — new table plus a policy check in `ConversationService.sendMessage`; no transport change (H-3).
15. Decide "recent searches": build or explicitly reject (M-5).
16. Voice notes — the schema already anticipates `mediaKind: "audio"` and `expo-audio` is installed.
17. Realtime — per the standing decision, **no transport change before an ADR**; the honest sequence is offline queue first (idempotent send already makes replay safe), then evaluate SSE before WebSockets.

**Tier 4 — the real remaining distance (not code)**
18. Physical Android and iOS devices — unlocks every device gate; **0 capabilities are device-proven today**.
19. Live provider credentials — Clerk, object storage, Paymob sandbox, email, push.
20. Coolify/Docker staging — unlocks image, compose, staging, backup/restore, and rollback gates.
21. Recover or formally write off the lost "advanced Messenger wave" (see §15).

---

## 18. Auditor's statement

No file in any repository was created, modified, deleted, or restructured during this audit, apart from this report, delivered on a dedicated audit branch so the live assembly branch is untouched.

**No rewrite is recommended anywhere.** In every area examined, bounded partial repair is demonstrably possible; I could not prove the contrary in any module, so the directive's bar for proposing a rewrite is not met.

Where I could not verify something — live providers, physical devices, the Clerk Dashboard, expo.dev — it is stated as unverified rather than inferred. Three candidate findings were **withdrawn** during this audit after inspection disproved them; they are listed in §12 so the effort is not repeated.

The manager's declared position — **assembly `GO` one bounded batch at a time; production deploy `NO-GO`** — is, on this evidence, correct and well-supported.

---
*Independent audit — evidence-based and execution-verified. Any finding without a reproducible command or a file/line pointer was excluded by design.*
