# BANCO BOOM NEXT — Deployment Source of Truth

**Authority:** Production Release Assembly
**Current release authority:** `release/production/`

## Locked identity

| Field | Value |
|---|---|
| **ONLY deploy repository** | `https://github.com/waelzaid66-max/bancoboom-v-next-` |
| **Canonical assembly branch** | `canonical/vnext-assembly` |
| **Production deploy ref** | exact immutable approved release SHA/image digest |
| **Production manifest** | `release/production/manifest.json` |
| **Coolify runbook** | `release/production/COOLIFY_RUNBOOK.md` |
| **Environment contract** | `release/production/ENVIRONMENT_CONTRACT.md` |
| **Coolify compose** | `docker-compose.coolify.yml` |
| **Release source gate** | `pnpm release:verify` |
| **Mobile package / bundle** | `com.bancooom.app` |
| **App scheme** | `bancooom` |
| **App display name** | `BANCO` |
| **Package manager** | `pnpm@11.9.0` |
| **Docker/CI Node** | `24` |

Historical repositories, including `bancoboomstor`, are recovery/provenance sources only. They must never be selected as the Coolify production source or used for new store builds.

## Production repository shape

This is one monorepo and one release tree. Do not create a second copy of application packages for production.

- `artifacts/api-server` — API
- `artifacts/banco-mobile` — Expo/EAS mobile
- `artifacts/banco-website` — canonical Next consumer/marketing site
- `artifacts/banco-web` — profile-gated legacy Next twin
- `artifacts/landing` — landing SPA
- `artifacts/dealer-os` — market/dealer SPA
- `artifacts/admin-os` — admin SPA
- `lib/*` and `lib/integrations/*` — shared libraries
- `scripts/` — release/verification tooling
- `deploy/coolify/` — Coolify Dockerfiles and nginx assets
- `release/production/` — operator-facing production assembly authority

## Deployable Coolify services

| Service | Source | Dockerfile / image | Health / role |
|---|---|---|---|
| `postgres` | `postgres:16` | upstream image | database health via `pg_isready` |
| `migrate` | committed DB migrations | `deploy/coolify/Dockerfile.api` builder target | one-off migration job |
| `api` | `artifacts/api-server` | `deploy/coolify/Dockerfile.api` | `/api/readyz` |
| `banco-website` | `artifacts/banco-website` | `deploy/coolify/Dockerfile.banco-website` | canonical Next site |
| `banco-web` | `artifacts/banco-web` | `deploy/coolify/Dockerfile.banco-web` | optional `legacy-banco-web` profile |
| `web` | landing + dealer + admin | `deploy/coolify/Dockerfile.web` | `/nginx-health` |

## Controlled deployment order

1. Freeze one candidate SHA. No direct product pushes after freeze.
2. Run frozen install, workspace verification, security, typecheck, build, confidence and release-source gates.
3. Build required Docker images from that exact SHA without opening traffic.
4. Start `postgres` and require health.
5. Classify the database state.
6. Fresh DB: run committed migrations directly.
7. Existing pre-journal DB: independently prove schema equivalence before any one-time baseline, then run committed migrations.
8. Start `api`; require `/api/readyz = 200`.
9. Start `banco-website` and `web`; enable `banco-web` only when explicitly required.
10. Verify live Clerk, S3/object storage, email/push, Maps and Paymob sandbox.
11. Verify Android/iOS physical-device journeys and AR/EN RTL/LTR accessibility.
12. Execute backup/restore and rollback rehearsal.
13. Record SHA, image digests, migration state, Coolify deployment ID and rollback SHA.

## Coolify resource settings

| Field | Required value |
|---|---|
| Resource type | Docker Compose |
| Repository | `https://github.com/waelzaid66-max/bancoboom-v-next-` |
| Assembly branch | `canonical/vnext-assembly` |
| Final deployment ref | exact approved immutable SHA |
| Compose path | `docker-compose.coolify.yml` |

Before building, manually verify the repository shown in Coolify. If it displays a historical repository, stop the deployment.

## Environment

Do not store secret values in Git. The authoritative name-level environment contract is `release/production/ENVIRONMENT_CONTRACT.md`.

Required fail-closed categories include:

- PostgreSQL
- Clerk/session
- payment encryption
- S3/object storage
- canonical web build identity
- SPA Clerk publishable identity

Provider-dependent settings for Paymob, email, push and maps are required before those capabilities are enabled in production.

## Mobile

Mobile is not a Coolify service. It is built with EAS from `artifacts/banco-mobile` and must use bundle ID `com.bancooom.app`. Store builds must be tied to the same certified release environment and validated on physical Android and iOS devices.

## Production acceptance rule

A release is not Production Ready because source/static tests pass. Production GO requires one immutable SHA with executable CI evidence, runtime/provider/device verification, migration proof, backup/restore and rollback evidence.

If any operator-facing file conflicts with `release/production/manifest.json`, the release is blocked until the conflict is reconciled. Historical reports remain historical evidence and are not deployment authority.

Run `npm run build`.
