# BANCO BOOM NEXT — Build Provenance Audit

Audited on the production assembly branch after reconciliation with canonical `4f2c81cc553938e808a98adb84d00ecfc76732c5`.

## Proven source boundary

All Coolify Dockerfiles use the repository root as build context and execute a frozen pnpm install from the same monorepo checkout. None of the audited Dockerfiles clones, fetches, or references a historical Git repository.

| Image/service | Dockerfile | Source packages | Install/build boundary |
|---|---|---|---|
| `api` | `deploy/coolify/Dockerfile.api` | `artifacts/api-server` + workspace deps | Node 24, `COPY . .`, `pnpm install --frozen-lockfile --filter "@workspace/api-server..."`, API build |
| `banco-website` | `deploy/coolify/Dockerfile.banco-website` | `artifacts/banco-website` + workspace deps | Node 24, `COPY . .`, frozen filtered install, Next standalone build |
| `banco-web` | `deploy/coolify/Dockerfile.banco-web` | `artifacts/banco-web` + workspace deps | Node 24, `COPY . .`, frozen filtered install, Next standalone build; legacy profile only |
| `web` | `deploy/coolify/Dockerfile.web` | landing + dealer-os + admin-os + workspace deps | Node 24, `COPY . .`, frozen filtered install, three Vite builds, Nginx runtime |

The root `packageManager` field pins `pnpm@11.9.0`; Dockerfiles enable Corepack and therefore resolve the workspace-declared pnpm version rather than embedding a separate package-manager authority.

## API provenance

The API build receives `GIT_SHA` and `BUILD_ID` from Compose build args. The same values are exposed at runtime so `/api/readyz` can identify the deployed source. Final acceptance must compare the returned SHA to the certified release SHA.

## Remaining immutable-image blocker

Current Coolify Compose assigns mutable image names:

- `banco-api:latest`
- `banco-web:latest`
- `banco-website:latest`
- `banco-web-static:latest`

Building from a pinned checkout protects source selection, but a mutable tag weakens artifact provenance and rollback if the tag is overwritten. This is not accepted as the final global-grade release state.

### Required bounded hardening before Production GO

1. Introduce one required release image identifier derived from/recorded against the certified Git SHA (for example `RELEASE_IMAGE_TAG`).
2. Tag every application image with that immutable identifier; the optional legacy image follows the same rule when enabled.
3. Record the resulting content digest for every built image in `RELEASE_EVIDENCE_TEMPLATE.md`.
4. Deploy/rollback by the recorded immutable tag/digest, never by an unqualified moving `latest` artifact.
5. Preserve the existing exact-source build context and Dockerfile service semantics; this hardening must not change application code.
6. Verify Coolify does not silently rebuild from a different moving branch when redeploying an already certified image set.

Do not modify the Compose runtime YAML for this item until the Source-of-Truth header reconciliation is complete and the change can be tested as a separate bounded deployment batch.

## Status

- Same-repository build context: PASS (source inspection)
- Frozen package resolution: PRESENT in all audited application Dockerfiles
- Historical external source fetch: NONE FOUND in audited Coolify Dockerfiles
- Exact API SHA exposure: PRESENT, runtime proof still required
- Immutable application image naming/digest deployment: OPEN BLOCKER

Production remains NO-GO.

Run `npm run build`.
