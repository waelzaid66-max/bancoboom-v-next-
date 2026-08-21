# BANCO BOOM NEXT — Production Assembly State

**Integration branch:** `release/production-assembly-20260821`  
**Base canonical SHA:** `4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Decision:** **NO-GO**

This state record distinguishes source closure from executable/runtime certification. A green source item does not imply production readiness.

## Closed / preserved source facts

- Correct product repository identified: `waelzaid66-max/bancoboom-v-next-`.
- Canonical assembly branch identified: `canonical/vnext-assembly`.
- Production assembly is additive; no Product code is modified by this branch.
- Production deployment authority is now isolated under `release/production/`.
- `docker-compose.coolify.yml` operator comments and the four live operator runbooks were repointed by bounded micro-patches to BANCO BOOM NEXT / `canonical/vnext-assembly`; detailed operational content was preserved.
- Historical `bancoboomstor` references remain only where explicitly marked as provenance/forbidden source, not as live deploy authority.
- Exact package/service inventory recorded.
- Coolify Dockerfiles audited: same repository-root build context, Node 24, frozen pnpm resolution; no external historical Git clone/fetch found.
- Committed migrations are the schema authority; historical schema push is not the production migration path.
- `baseline` is not accepted as schema-equivalence proof.
- Canonical CI trigger governance has source coverage for `canonical/vnext-assembly`; runner execution is a separate unresolved blocker.
- Release-specific static gate and workflow exist and include a stale-release-branch refusal check.
- This assembly was reconciled onto canonical `4f2c81cc`; canonical is an actual parent of the release integration history.

## P0 — must close before merge/deploy

1. **Executable release verification**
   - Source-level Deployment SoT cleanup is closed.
   - `pnpm release:verify` must execute on the reconciled exact candidate and pass; source inspection alone is not an executable PASS.

2. **GitHub Actions execution**
   - Workflows are created for candidates, but recent jobs terminate before Step 1 with no logs/steps.
   - No source/build PASS may be inferred from those red runs.
   - Final SHA requires real Node 24 runner execution.

3. **Immutable image provenance**
   - Application images are currently named with mutable `:latest` tags.
   - Final release requires immutable release tag/digest mapping and recorded rollback artifacts.

4. **Database production adoption**
   - Live production schema equivalence/adoption is unproven.
   - Exact backup, migration, replay/snapshot-upgrade and isolated restore evidence is required.

5. **Runtime provider verification**
   - Clerk/Traefik, S3, email/push, Maps provider, Paymob sandbox and error-alert path remain live-unproven.

6. **Physical mobile verification**
   - Android and iOS production builds/device journeys, AR/EN, RTL/LTR, accessibility and app/universal links remain unproven on the final SHA.
   - Android-specific source blockers are recorded separately in `ANDROID_MOBILE_FORENSIC_2026-08-21.md`; they are not silently folded into this release-source branch.

7. **Rollback**
   - Immutable prior image set + DB-compatible rollback and restore rehearsal remain open.

## P1 source items carried into final RC

- Maps bootstrap `{type: "error"}` must not be treated as successful `ready`; rebuild boundedly from the current accepted base after release-source isolation is stable.
- Recent Search UI must be reconstructed from current canonical, not stale PR #5; replay only in safe discover/default state and preserve Saved Search authority.
- Full final-RC lint scope still requires exact-SHA execution; manager commits have improved lint coverage/source cleanliness, but runner evidence is still required.

## Superseded parallel branches

- PR #4 Maps v2: stale/superseded; do not merge wholesale.
- PR #5 Recent Search: stale/divergent; do not merge wholesale.
- PR #8 Deployment SoT guard: enforcement concept accepted, but PR #9 is the single production-assembly integration authority. Avoid duplicate guard implementations.

## Final acceptance

Production GO requires one immutable final SHA with one evidence set covering source gates, executable CI, image digests, migrations, staging, providers, physical devices, backup/restore and rollback.

Run `npm run build`.
