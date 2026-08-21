# BANCO BOOM NEXT — Coolify Deployment Guide

The authoritative production deployment instructions are centralized under `release/production/`.

## Authoritative source

- Repository: `https://github.com/waelzaid66-max/bancoboom-v-next-`
- Canonical branch: `canonical/vnext-assembly`
- Final production ref: exact approved immutable release SHA/image digest
- Compose: `docker-compose.coolify.yml`
- Machine manifest: `release/production/manifest.json`
- Operator runbook: `release/production/COOLIFY_RUNBOOK.md`
- Environment contract: `release/production/ENVIRONMENT_CONTRACT.md`
- Go-live checklist: `OPS_GO_LIVE_CHECKLIST.md`
- Release source gate: `pnpm release:verify`

Historical repositories are not deploy sources.

## Services

| Service | Source | Role |
|---|---|---|
| `postgres` | `postgres:16` | persistent database |
| `migrate` | committed migrations through API builder | one-off migration runner |
| `api` | `artifacts/api-server` | API, readiness `/api/readyz` |
| `banco-website` | `artifacts/banco-website` | canonical Next consumer/marketing site |
| `banco-web` | `artifacts/banco-web` | optional legacy profile only |
| `web` | landing + dealer + admin | Nginx static/front proxy |

Mobile is built with EAS from `artifacts/banco-mobile`; it is not a Coolify container.

## Required controlled order

1. Freeze one candidate SHA.
2. Run frozen install and all repository/release gates.
3. Build images from that exact SHA without opening traffic.
4. Start PostgreSQL and require health.
5. Classify DB state and run committed migrations safely.
6. Start API and require `/api/readyz = 200`.
7. Start canonical web services after API readiness.
8. Verify live auth/storage/email/push/maps/payments.
9. Verify Android/iOS physical-device journeys.
10. Verify backup/restore and rollback.
11. Record SHA, image digests, migration state and Coolify deployment ID.

Do not use one-click/default deployment for a schema-bearing release before the migration gate is complete.

## Environment

Use `release/production/ENVIRONMENT_CONTRACT.md` for the authoritative variable-name inventory. Secret values belong only in Coolify/EAS/provider secret stores.

## Networking

Recommended first production topology:

- apex → `web:80`
- `/api/` → `api:8080`
- `/market/` → dealer OS
- `/admin/` → admin OS
- `/.well-known/` → application association files

`banco-web` remains profile-gated and is not part of the default production surface unless explicitly approved.

## Hard stop conditions

Stop immediately if:

- Coolify points at a historical repository;
- deployed SHA cannot be proven;
- `pnpm release:verify` fails;
- CI did not execute real steps;
- DB migration state is ambiguous;
- provider/device/restore gates are missing.

For exact commands and evidence requirements, follow `release/production/COOLIFY_RUNBOOK.md` and `OPS_GO_LIVE_CHECKLIST.md`.

Run `npm run build`.
