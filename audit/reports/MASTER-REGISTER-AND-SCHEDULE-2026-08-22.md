# MASTER REGISTER & FIX SCHEDULE

**Complete inventory of every problem, with a distributed fix schedule, date control, and the Docker/Coolify + Expo/mobile audits the owner requested.**

Every figure executed against the shipped source and a live PostgreSQL 16.13. `canonical @ 4f2c81c`. **2026-08-22.**

---

# PART I — DATE CONTROL

## The trunk's health tracks CI's health, exactly

**Canonical commits per day:**

```
2026-08-08   ████ 4
2026-08-09   █████ 5
2026-08-10   █████████████████████████ 25
2026-08-11   █████████████ 13
2026-08-12   ─ 0
2026-08-13   ███ 3
2026-08-14   ███ 3          ← last green CI run: 2026-08-14T19:01:56Z
2026-08-15   ─ 0  ┐
2026-08-16   ─ 0  │
2026-08-17   ─ 0  ├─ SIX DAYS SILENT
2026-08-18   ─ 0  │
2026-08-19   ─ 0  │
2026-08-20   ─ 0  ┘
2026-08-21   ███████████ 11
2026-08-22   ─ 0
```

**Canonical: 252 commits, first commit 2026-08-01.**

> **The trunk went silent the day CI died, resumed for a single day, and has been static since. That is not a coincidence to note in passing — it is the measurable cost of the CI outage, and it is larger than any individual defect in this register.**

## Version state — nothing has ever shipped

| Marker | Value | Meaning |
|---|---|---|
| Git tags | **0** | the deploy path has never fired |
| `app.json` version | `1.0.0` | never incremented |
| `ios.buildNumber` | `1` | never submitted |
| `android.versionCode` | `1` | never submitted |
| Canonical last commit | **2026-08-21 10:27** | static for over a day |
| Live branches | **51** | accumulating against a frozen base |

## The two clocks

| Clock | Deadline | Days | Verified |
|---|---|---|---|
| **Play API 36** | 2026-08-31 | **~9** | config ✅ pinned at 35 · **policy date `UNKNOWN`, confirm in console** |
| **Image-size waiver** | 2026-09-09 | **18** | ✅ `patched >=2.0.3`, `latest` still `2.0.2` — upstream has not shipped |

---

# PART II — DOCKER / COOLIFY AUDIT

## ✅ What is correct — do not change these

| Property | Evidence |
|---|---|
| **All 8 Dockerfiles on `node:24-bookworm-slim`** | matches CI's Node 24 — **no version drift between build and test** |
| **HEALTHCHECK in all 8** | none ships blind |
| **Non-root `USER` in 6 of 8** | the two exceptions end in `nginx:1.27-alpine`, whose workers already drop privileges — **correct, not a gap** |
| Named volume for Postgres | `banco_pgdata:/var/lib/postgresql/data` |
| Healthchecks on every compose service | `pg_isready` · 3× `node -e` · `wget /nginx-health` |
| `depends_on: condition: service_healthy` | real ordering, not a sleep |
| **Migrations profile-gated, never on `up`** | `profiles: ["migrate"]`, `restart: "no"` |
| 14 env vars fail closed | `${POSTGRES_PASSWORD:?…}` |
| Postgres internal-only | *"Do NOT expose a host port in production"* |

**Multi-stage builds, pinned base images, no `:latest` anywhere in the runtime path. This is a well-built deployment surface.**

## 🔴 What is missing

| ID | Problem | Evidence |
|---|---|---|
| **D-1** | **No deploy path provisions `pg_trgm`** — the documented step 5 dies at `0000` and rolls back to 0 tables | searched all compose files, all 8 Dockerfiles, `deploy/coolify`, `deploy/gcp`, `deploy/aws` — **zero references** |
| **D-2** | **No backup or restore tooling** | `pg_dump` appears only in AWS prose. No script, no profile, no job. **A volume holding every listing, message and account, with nothing copying it** |
| **D-3** | **No startup env validation** | `index.ts` reads `process.env` directly; no schema. Compose protects `up`, not the process — a missing provider key becomes a runtime 500 |
| **D-4** | **Deployment SOT contested** | `release/production-assembly` repoints `bancoboomstor` → `bancoboom-v-next-` and fails **5** chain assertions |

---

# PART III — EXPO / MOBILE AUDIT

## Configuration, read from `app.json` and `eas.json`

| Key | Value | Assessment |
|---|---|---|
| `name` / `slug` | BANCO / `banco-mobile` | ✅ |
| `scheme` | `bancooom` | ✅ matches `com.bancooom.app` |
| **`newArchEnabled`** | **`true`** | ⚠️ New Architecture on, with **40 native/expo dependencies**. **Compatibility cannot be verified from source — it needs a build.** `UNKNOWN` |
| `ios.bundleIdentifier` / `android.package` | `com.bancooom.app` | ✅ consistent |
| `version` / `buildNumber` / `versionCode` | `1.0.0` / `1` / `1` | never shipped |
| **`updates.url`** | **unset** | 🔴 **M-1** |
| **`runtimeVersion`** | **unset** | 🔴 **M-1** |
| `extra.eas.projectId` | present | ✅ |
| `usesAppleSignIn` | `true` | 🟠 **M-2** — entitlement with no implementation |
| `compileSdk` / `targetSdk` | **35** | ⏰ Play clock |
| `eas.json` `node` | `24.18.0` | ✅ matches CI |
| `EAS_NO_VCS` | `1` on **every** profile | 🟠 **M-3** |
| iOS submit `appleId`/`ascAppId`/`appleTeamId` | `""` `""` `""` | 🔴 **M-4** |
| Android `serviceAccountKeyPath` | repo-relative, **not gitignored**, public repo | 🔴 **M-5** |

## 🔴 M-1 — Over-the-air updates are structurally impossible

**Verified three ways:**
- `expo-updates` is **not in `package.json`**
- `updates.url` and `runtimeVersion` are **unset**
- **"EAS Update" appears nowhere** in any doc, config or workflow

> **Every fix — including the price P0 — requires a full store submission and review cycle. There is no hotfix path.** For a marketplace launching with known defects and no working CI, **this is the single largest operational risk in the mobile surface.**

**Classification: `VERIFIED MISSING` — a decision, not a defect.** But it must be a *decision*, made deliberately, and it should be made before launch rather than during the first incident.

---

# PART IV — THE COMPLETE PROBLEM REGISTER

**Zone:** 🟥 uncovered (0 tests) · 🟩 covered · ⬛ infrastructure

| ID | Problem | Zone | Sev | Evidence |
|---|---|---|---|---|
| **P-1** | Fresh DB cannot be created — `gin_trgm_ops` without `pg_trgm`, rolls back to 0 tables | ⬛ | **P0** | reproduced 9× |
| **P-2** | Web edit destroys every price ≥1,000 EGP | 🟥 | **P0** | **API round trip: 1,500,000 → 1.5** |
| **P-3** | Web seller workspace cannot create any listing | 🟥 | **P0** | server validator, all 3 categories fail |
| **P-4** | Seller can overwrite admin moderation | 🟩 | **P1** | Gate-3 RED matrix, 16 tests |
| **P-5** | Deleted listing photos stay publicly readable forever | 🟩 | **P1** | `objectAcl.ts:143` + no retirement call |
| **P-6** | "Deletion failed" shown for a successful deletion | 🟩 | **P1** | `settings.tsx:650`, both paths |
| **P-7** | Play publishing key would be committed to a public repo | ⬛ | **P1** | `git check-ignore` → exit 1 |
| **P-8** | Inbox downloaded every 15s app-wide for one integer | 🟩 | **P1** | `_layout.tsx:104` |
| **P-9** | 32 mobile guards, 0 pinned — **root cause: mobile has no glob runner** | 🟩 | **P1** | 3 dead guards on live branches |
| **P-10** | RE `propertyType` fallback deleted by a CAR change | 🟩 | **P1** | 47 → 41 lines; **chain still 245/245** |
| **P-11** | Web-host map bootstrap failure is silent | 🟩 | P2 | no `error` branch at all |
| **P-12** | Saved-search identity collides | 🟩 | P2 | `SessionContext.tsx:110` |
| **P-13** | OFFSET pagination on 3 of 6 sorts | 🟩 | P2 | `SearchService.ts:470` |
| **P-14** | No relevance ranking anywhere | 🟩 | P2 | no `ts_rank`/`similarity` |
| **P-15** | **No Arabic normalisation — `سيارة` ≠ `سياره`** | 🟩 | **P1** | highest-value precision fix |
| **P-16** | `AdaptiveFeedEngine` unreachable from search | 🟩 | P3 | 166 lines, never consulted |
| **P-17** | No load measurement anywhere | 🟩 | P2 | search, clusters, inbox |
| **D-1..D-4** | Deployment gaps | ⬛ | P0–P1 | Part II |
| **M-1..M-5** | Mobile/store gaps | ⬛ | P0–P1 | Part III |
| **X-1** | 51 branches, trunk static >1 day | — | **P0** | Part I |
| **X-2** | CI cannot execute | — | **P0** | 3 trigger types, 2 people |

**23 problem classes. 8 at P0.**

---

# PART V — THE FIX SCHEDULE

## Wave 0 — TODAY. Cheap, unblocks everything else.

| # | Fix | Owner | Effort | Unblocks |
|---|---|---|---|---|
| 0.1 | **`GUARD-01` both directions** — every guard file has a script **and** every script is chained. *Or better: give `banco-mobile` a glob runner like `api-server` has* | Platform | 1 assertion | every guard in this schedule · **3 dead guards today** |
| 0.2 | **Gitignore** `google-service-account.json`, `*.p8`, `*.p12`, `*.keystore`, `*.mobileprovision` | Platform | 3 lines | P-7 |
| 0.3 | **`pg_trgm`** — one line in `lib/db/src/migrate.ts` before `migrate()`. **Not a migration** — the journal runs `0000` first. Also add to `run-api-tests-local.mjs` | Platform | 1 line | P-1, D-1 |
| 0.4 | **`testID` ruling** — literal, or update the guard's `test` **and** `why` | **OWNER** | 1 sentence | **44 commits, 5 branches** |
| 0.5 | **Which repository deploys** | **OWNER** | 1 decision | D-4, the SOT collision |
| 0.6 | **Merge** `audit/*` ×2 + **`maps-bootstrap-fail-closed`** (verified green today) | Release | 3 merges | X-1 |

## Wave 1 — the two high-risk workspaces only

| # | Fix | Owner | Effort |
|---|---|---|---|
| 1.1 | **`price_raw` on the detail response** — mirror `ListingService.ts:1137`. Then hydrate `banco-web`/`banco-website` from it **exactly as `dealer-os` already does** | Web | 1 line + 2 hydrations |
| 1.2 | **Shared listing taxonomy** — extract mobile's `listingCreateTaxonomy`; delete the web's parallel `workspaceSpecFields`. **Typed selects, not text** | Web | refactor |
| 1.3 | **Restore RE `propertyType` fallback byte-for-byte** + a guard pinning each section's strips against edits from another section | Mobile | restore + 1 guard |
| 1.4 | Deduplicate `banco-web`/`banco-website` | Web | 1.1–1.2 do most |
| 1.5 | **A CI job for those workspaces that runs something other than `docker build`** | Platform | 1 job |
| 1.6 | One contract test per money- or authority-touching web path | Web | ~10 lines each |
| 1.7 | `db-baseline-adoption` — two sentences in `MIGRATIONS.md`, then **merge** | API | 2 sentences |

## Wave 2 — authority, privacy, truthfulness

| # | Fix | Owner |
|---|---|---|
| 2.1 | **Gate-3 GREEN** + chain assertion on the authority predicate | API |
| 2.2 | **`deleteServingUrls` on listing media** — reference-aware, idempotent. *The mechanism already exists in 3 lifecycles* | API |
| 2.3 | **Account-deletion catch split** — both paths + a behavioural test that fails `signOut()` | Mobile |
| 2.4 | **Wire the 3 dead guards** (`account-deletion` ×2, `profile-role`) | Mobile |

## Wave 3 — scale, precision, platform grade

| # | Fix | Owner |
|---|---|---|
| 3.1 | **Scalar `GET /v1/conversations/unread-count`**, then keyset the inbox | API |
| 3.2 | **Arabic normalisation** at write and query time — **highest-value precision fix available** | API |
| 3.3 | Keyset **all six** sorts — the pattern is already in the file | API |
| 3.4 | Deterministic, testable relevance rank *(`pg_trgm` gives `similarity()` free after 0.3)* | API |
| 3.5 | Fix the stale `SearchService.ts:408` comment before it prompts a rebuild | API |
| 3.6 | Web-host `MAP-13` port · `SS-LIN-01` identity versioning | Mobile |
| 3.7 | Load measurement — seed a corpus, **publish p50/p95 even when bad** | API |

## Wave 4 — deployment and store

| # | Fix | Owner |
|---|---|---|
| 4.1 | **Backup profile + a restore actually performed** | Platform |
| 4.2 | **Startup env validation** — exit non-zero if incomplete | API |
| 4.3 | **Decide OTA** — `expo-updates` + `runtimeVersion`, or record deliberately that there is no hotfix path | **OWNER** |
| 4.4 | **Apple sign-in — wire it or remove all three declarations.** Pin whichever | Mobile |
| 4.5 | **Play API 36** — confirm the date, then bump and re-run device regression | Mobile |
| 4.6 | iOS submit credentials | **OWNER** |
| 4.7 | The 2026-09-09 waiver decision | **OWNER** |

## ⚫ Owner-scheduled — no audit closes these
Device matrix 320/360/390/430 × AR/EN × RTL/LTR · real-browser WebView · live provider journeys · deployment rehearsal · exact-SHA CI on a green run.

---

# PART VI — MERGE ORDER

**Only after 0.4 and 0.5 are decided:**

```
1. audit/* ×2                    ← docs only, accepted, zero risk
2. maps-bootstrap-fail-closed    ← verified green today: 26/26, 127/127
3. db-baseline-adoption          ← after 1.7 (two sentences)
4. car-header (ONE branch)       ← after 0.4 + 1.3; delete the other four
5. deployment-sot-next           ← after 0.5
6. release/production-assembly   ← after 0.5, last
   gate3                          hold for GREEN
   PR #4                          CLOSE — superseded
```

**Run the full battery after EACH merge, not once at the end.** With CI down, a local run is the only signal; batching makes a regression untraceable.

---

# PART VII — STANDING

**What is verified good:** 505/505 API against a real database · 245/245 chain · 26/26 confidence · 127/127 mobile · 14/14 baseline · 44/44 admin routes guarded · S4 four-layer authority control · advisory locks on one pooled connection · composite keyset avoiding the boundary-skip bug · trigram GIN indexes · 8 Dockerfiles on a pinned Node 24 with healthchecks and non-root users · migrations profile-gated.

**What is not:** 23 problem classes, 8 at P0 · a trunk static for over a day while 51 branches accumulate · no CI · no OTA hotfix path · no backup that has been restored · and a runtime that has never been witnessed on a device.

**Production: `NO-GO`.**

> **The engineering is not the constraint. Two owner sentences, one glob runner, one migration line and three merges move more than another week of implementation would.**

---
*Docker surface audited across all 8 Dockerfiles and 3 compose files. Expo configuration read from `app.json` and `eas.json`; OTA absence confirmed three independent ways. Date control computed from canonical's own commit history. Every register entry carries evidence produced earlier in this engagement and re-verified at the current head. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
