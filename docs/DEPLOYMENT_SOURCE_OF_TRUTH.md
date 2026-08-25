# BANCO — Deployment Source of Truth

**Reconciled:** 2026-08-25  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Release branch:** `release/golden-vnext-20260825`

This document controls deployment identity. Historical reports and archived
repositories may explain lineage or provide rollback evidence, but they cannot
override this file, the current Git tree, or the executable workspace verifier.

## 1. Locked identity

| Field | Authority |
|---|---|
| Git repository | `waelzaid66-max/bancoboom-v-next-` |
| Release branch | `release/golden-vnext-20260825` |
| Coolify compose | `docker-compose.coolify.yml` |
| Coolify runbook | `COOLIFY_DEPLOY_NOW.md` |
| Operator checklist | `OPS_GO_LIVE_CHECKLIST.md` |
| Mobile application | `artifacts/banco-mobile` |
| Android package | `com.bancooom.app` |
| iOS bundle identifier | `com.bancooom.app` |
| Expo scheme | `bancooom` |
| EAS project | `45f092c8-52f9-4272-880f-48e6b721126f` |
| Package manager | `pnpm@11.9.0` |
| Docker/CI Node | 24 |

The executable `scripts/workspace-verify.mjs` accepts only the current vNEXT
repository origin. A release checkout from another repository is invalid even if
that repository contains an older green build.

## 2. Lineage and rollback

The current Product line descends from the verified `bancoboomstor` staging
baseline. That old commit remains useful for comparison and rollback analysis.
It is not an independent source to merge, cherry-pick, or configure in Coolify.

Rules:

- do not deploy `bancoboomstor`, `banco-with-wael`, `bancoo`, `bancoboom`,
  `aws-virgen`, or a Replit-local Git history;
- do not copy complete historical files into the release branch;
- do not deploy floating `main`;
- deploy one reviewed commit from the release branch;
- record that exact commit in Coolify/EAS evidence and rollback notes.

## 3. Monorepo applications

| Workspace | Production role | Release mechanism |
|---|---|---|
| `artifacts/api-server` | REST API, jobs, integration services | Coolify service `api` |
| `artifacts/banco-website` | Canonical Next consumer/marketing | Coolify service `banco-website` |
| `artifacts/landing` | Landing page | Built into Nginx service `web` |
| `artifacts/dealer-os` | Dealer/market OS at `/market/` | Built into Nginx service `web` |
| `artifacts/admin-os` | Admin OS at `/admin/` | Built into Nginx service `web` |
| `artifacts/banco-web` | Frozen optional Next twin | Profile `legacy-banco-web`; off by default |
| `artifacts/banco-mobile` | Expo SDK 54 native Android/iOS app | EAS, never Coolify |
| `artifacts/mockup-sandbox` | Development/mockup workspace | Never deployed |

Shared packages live under `lib/*`; release commands must run from the monorepo
root so shared TypeScript, generated clients, taxonomy, DB and app consumers are
verified together.

## 4. Coolify topology

The definitive service graph is in `docker-compose.coolify.yml`:

```text
postgres (healthy)
  └─ manual migrate profile
       └─ api (/api/readyz)
            ├─ banco-website
            └─ web (Nginx: landing + /market + /admin + /api proxy)
```

`banco-web` is profile-gated and must not be enabled by default.

The migration service does not auto-run. The operator must keep the sequence:

1. build the exact release commit;
2. start Postgres;
3. classify the database and create a restore point;
4. run committed migrations;
5. start and verify API readiness;
6. start `banco-website` and `web`;
7. perform public-origin smoke;
8. build native mobile from the same exact commit.

## 5. Database authority

- Fresh empty database: run every committed migration; never baseline it.
- Existing pre-journal database: baseline only after independent exact schema
  equivalence is proven for the adoption boundary.
- Non-empty, a backup file, or a successful connection is not equivalence proof.
- Never use schema push or a forced baseline to make an error disappear.
- Stop deployment when migration, journal, backup, or rollback evidence is
  incomplete.

Full migration policy remains in `lib/db/MIGRATIONS.md`.

## 6. Mobile authority

`artifacts/banco-mobile/app.json` and `eas.json` define:

- Expo SDK 54 / React Native 0.81.5;
- Android API 36;
- local application version authority;
- production Android AAB;
- Android/iOS auto-increment;
- VCS-required builds;
- dedicated Android notification small icon;
- no production `EAS_NO_VCS` inheritance;
- no repo-local store credential path.

The only repository release entry point is:

```bash
pnpm run mobile:verify
pnpm run mobile:eas -- production <android|ios|all> <build|build-and-submit>
```

The EAS wrapper must verify that every build ID reports the exact Git SHA of the
checkout before it may submit that build.

## 7. Required environment boundaries

Secrets remain outside Git. Coolify owns runtime server secrets; EAS owns native
build-time public configuration and store credentials.

At minimum, Coolify must receive:

```text
POSTGRES_PASSWORD
CLERK_SECRET_KEY
SESSION_SECRET
PAYMENT_CONFIG_ENCRYPTION_KEY
OBJECT_STORAGE_PROVIDER=s3
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET
PUBLIC_OBJECT_SEARCH_PATHS
PRIVATE_OBJECT_DIR
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY
BANCO_WEBSITE_URL
```

At minimum, EAS production must receive:

```text
EXPO_PUBLIC_DOMAIN or EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
EXPO_PUBLIC_PUBLIC_APP_URL
EXPO_PUBLIC_ROUTER_ORIGIN
```

No secret values belong in source, reports, logs, comments, or chat.

## 8. Evidence hierarchy

From strongest to weakest:

1. runtime/device/provider evidence tied to one exact release commit;
2. clean exact-checkout build/test output;
3. source and diff review;
4. current report explicitly rebound to the exact commit;
5. historical report, agent prose, screenshot or old branch.

A literal-only guard failure is not a Product defect until the protected behavior
is reproduced. An unexecuted gate is `UNDETERMINED`, not RED and not GREEN.

## 9. Promotion boundary

The release branch may move only by a reviewed fast-forward commit. No direct
historical merge, broad cherry-pick, force-push, generated-file selection, or
whole-host replacement is permitted.

Promotion to the default/canonical release ref occurs only after:

- workspace verify, typecheck, root build and tests;
- isolated PostgreSQL lifecycle and migration proof;
- Docker images and Coolify smoke;
- native Expo export and EAS artifact provenance;
- physical Android/iOS journeys for headers, Maps, Messenger, Auth/accounts,
  media, notifications, RTL/LTR and navigation;
- backup and rollback evidence.

Until those checks close on one commit, status is **Release Candidate — NO-GO**.
