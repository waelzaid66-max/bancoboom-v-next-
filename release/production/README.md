# BANCO BOOM NEXT — Production Assembly

This directory is the single operator-facing authority for the production release assembly.

## Immutable identity

- Repository: `waelzaid66-max/bancoboom-v-next-`
- Canonical branch: `canonical/vnext-assembly`
- Assembly branch: `release/production-assembly-20260821`
- Assembly base SHA: `4f2c81cc553938e808a98adb84d00ecfc76732c5`
- Package manager: `pnpm@11.9.0`
- Docker/CI Node: `24`
- Mobile bundle id: `com.bancooom.app`

Historical repositories are evidence only. They are not production deploy sources.

## Production layout

The production system remains one monorepo. Do not copy product packages into a second repository or a duplicated release tree. Release isolation is achieved by one immutable SHA, one manifest, one deploy contract, one environment contract, and exact image provenance.

Source packages:

- API: `artifacts/api-server`
- Mobile: `artifacts/banco-mobile`
- Canonical Next site: `artifacts/banco-website`
- Legacy/profile-gated Next twin: `artifacts/banco-web`
- Landing SPA: `artifacts/landing`
- Dealer/Market OS: `artifacts/dealer-os`
- Admin OS: `artifacts/admin-os`
- Shared libraries: `lib/*` and `lib/integrations/*`

Coolify build inputs:

- Compose: `/docker-compose.coolify.yml`
- API: `/deploy/coolify/Dockerfile.api`
- Canonical site: `/deploy/coolify/Dockerfile.banco-website`
- Optional legacy site: `/deploy/coolify/Dockerfile.banco-web`
- Nginx SPA assembly: `/deploy/coolify/Dockerfile.web`

## Controlled release sequence

1. Freeze one candidate SHA. No direct product pushes after freeze.
2. `pnpm install --frozen-lockfile`.
3. Run workspace, security, typecheck, build, confidence, and release-source gates.
4. Build Docker images from the exact candidate SHA without starting application traffic.
5. Start PostgreSQL only and require a healthy database.
6. Classify database state. Fresh databases run committed migrations directly. Existing pre-journal databases require independent schema-equivalence proof before a one-time baseline.
7. Run the committed migration service and require exit 0.
8. Start API and require `/api/readyz = 200`.
9. Start `banco-website` and `web`; start `banco-web` only when the legacy profile is explicitly required.
10. Verify live Clerk, object storage, email/push, Maps and Paymob sandbox integrations.
11. Verify Android and iOS physical-device journeys, AR/EN, RTL/LTR and accessibility.
12. Execute backup/restore and rollback rehearsal.
13. Record SHA, image digests, migration state, Coolify deployment id and rollback SHA before GO.

## Hard prohibitions

- Do not deploy `bancoboomstor`, `bancoo`, `bancoboom`, `banco-with-wael`, or any other historical clone.
- Do not deploy by an ambiguous moving branch after final certification. Use the certified immutable SHA/image digest.
- Do not merge stale PR branches wholesale into the release candidate.
- Do not replace `package.json` or test chains from an older branch; integrate test additions explicitly.
- Do not delete historical audit/recovery evidence merely because it contains an old repository name.
- Do not claim Production Ready from local/static tests only.

## Status

Production is **NO-GO** until the exact release SHA has executable CI evidence and all runtime/provider/device/restore gates pass.

Run `npm run build`.
