# BANCO BOOM NEXT — Production Package Inventory

Audited from `release/production-assembly-20260821`, based on canonical `3951c729`.

## Shipped artifacts

| Path | Production role | Delivery |
|---|---|---|
| `artifacts/api-server` | API + in-process jobs | Coolify `api` |
| `artifacts/banco-mobile` | Android/iOS application | Expo EAS |
| `artifacts/banco-website` | canonical Next consumer/marketing site | Coolify `banco-website` |
| `artifacts/landing` | public landing SPA | bundled into Coolify `web` |
| `artifacts/dealer-os` | market/dealer SPA | bundled into Coolify `web` at `/market/` |
| `artifacts/admin-os` | admin SPA | bundled into Coolify `web` at `/admin/` |

## Conditional / non-default shipped artifact

| Path | Role | Rule |
|---|---|---|
| `artifacts/banco-web` | frozen/legacy Next twin | profile `legacy-banco-web`; OFF by default; enable only by explicit release decision |

## Non-production artifact

| Path | Role | Release rule |
|---|---|---|
| `artifacts/mockup-sandbox` | design/mockup sandbox | never deploy as a production service |

## Shared libraries required by the monorepo

The following roots exist and remain part of the frozen install/typecheck/build graph. They are not independent Coolify services:

- `lib/api-client-react`
- `lib/api-spec`
- `lib/api-zod`
- `lib/db`
- `lib/design-tokens`
- `lib/integrations-openai-ai-server`
- `lib/search-contract`
- `lib/taxonomy`

`pnpm-workspace.yaml` also contains the forward-compatible pattern `lib/integrations/*`. No `lib/integrations/` directory exists in the audited tree. This is not a missing production package and must not trigger recovery from a historical repository without separate evidence.

## Deployment infrastructure

Required production inputs:

- `docker-compose.coolify.yml`
- `deploy/coolify/Dockerfile.api`
- `deploy/coolify/Dockerfile.banco-website`
- `deploy/coolify/Dockerfile.banco-web` (conditional profile)
- `deploy/coolify/Dockerfile.web`
- `deploy/coolify/nginx.conf`
- `deploy/coolify/well-known/*`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- root `package.json`

## Explicit exclusions from the production assembly

- `projects/banco-status` — isolated legacy/Replit project outside the pnpm workspace; not inferred as built or deployed by root gates.
- `artifacts/mockup-sandbox` — non-production sandbox.
- root/AWS/GCP/Vercel deployment paths — not part of the Coolify production path unless a separate release target is explicitly approved.
- audit/recovery/handoff documents — evidence only, never deployment inputs.
- historical repositories/clones — evidence only, never production source.

## Acceptance rule

A directory existing in Git does not make it a production service. Only entries declared in `release/production/manifest.json` and verified by `pnpm release:verify` belong to the production assembly.

Run `npm run build`.
