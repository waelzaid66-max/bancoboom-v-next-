# PR #9 — Immutable Image / Operator Contract Reconciliation

Audited: 2026-08-22 Cairo

## Authority snapshot

- Repository: `waelzaid66-max/bancoboom-v-next-`
- Canonical authority: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
- Release authority: PR #9 `release/production-assembly-20260821`
- Audited PR #9 head: `ad9b0afa8655d48b344a56bd33c603be13b280a9`
- This report is audit-only. It does not authorize merge/deploy and changes no Release/Product/API/DB/Mobile runtime source.

## What is correctly closed source-side

Current PR #9 head correctly replaces moving first-party image tags in `docker-compose.coolify.yml` with one required release identity:

- `banco-api:${RELEASE_SHA:?...}`
- `banco-web:${RELEASE_SHA:?...}`
- `banco-website:${RELEASE_SHA:?...}`
- `banco-web-static:${RELEASE_SHA:?...}`

`scripts/release-sot-gate.mjs` now rejects first-party `:latest`, requires exactly the four approved BANCO image names, and requires the no-default `${RELEASE_SHA:?…}` shape. `release:verify` points directly at that gate. `IMAGE_ROLLBACK_TEMPLATE.md` and `COOLIFY_RUNBOOK.md` also correctly require exact SHA → image ID/RepoDigest evidence plus a preserved previous image set.

Classification for this narrow layer: **FIRST-PARTY COMPOSE IMAGE TAGGING — SOURCE CLOSED / EXECUTION UNPROVEN**.

## P0 operator-contract drift still open

The source wiring and the operator-facing documents do not yet describe the same deployment contract.

### 1. `COOLIFY_DEPLOY_NOW.md`

Current audited file still lists:

- `banco-api:latest`
- `banco-web:latest`
- `banco-website:latest`
- `banco-web-static:latest`

Its hard-required environment block also omits `RELEASE_SHA`.

This is a direct contradiction of the current Compose file and release gate. Following the document literally can either fail Compose interpolation because `RELEASE_SHA` is absent or teach an operator to expect a moving tag that no longer exists as the approved contract.

### 2. `OPS_GO_LIVE_CHECKLIST.md`

The Required Coolify environment list omits `RELEASE_SHA`; `GIT_SHA` appears only under “Strongly recommended”. Current Compose requires `RELEASE_SHA` before first-party image interpolation.

### 3. `docs/DEPLOY_COOLIFY.md`

The Required environment table omits `RELEASE_SHA`; `GIT_SHA` remains documented as optional. The guide therefore does not encode the new mandatory release-image identity.

### 4. `release/production/ENVIRONMENT_CONTRACT.md`

This file is explicitly the variable-name/ownership contract, but its operations section contains `GIT_SHA` and `BUILD_ID` while omitting `RELEASE_SHA` entirely.

### 5. `docs/DEPLOYMENT_SOURCE_OF_TRUTH.md`

The “Compose-required (`:?`)” section and First Deployment Checklist omit `RELEASE_SHA`, despite current Compose using `${RELEASE_SHA:?…}` on all first-party application images.

## Why this is release-blocking

The release branch currently claims `IMMUTABLE IMAGE SOURCE CONTRACT CLOSED`, but the operator plane is not coherent with the source plane. In production operations, a correct Compose file plus stale instructions is still unsafe: the human following the documented contract can prepare an invalid environment or reason about the wrong artifact names.

Therefore the accurate status is:

`FIRST-PARTY COMPOSE IMAGE WIRING CLOSED / OPERATOR CONTRACT DRIFT OPEN / RUNTIME PROVENANCE OPEN`.

## Bounded Release-lane correction

PR #9 owner may correct this without touching application behavior:

1. Update the five operator/contract documents above so `RELEASE_SHA` is mandatory and must equal the approved full source SHA pinned in Coolify.
2. Replace every active first-party `:latest` example with the exact `${RELEASE_SHA}` image convention; historical/prohibition mentions may remain clearly historical.
3. Preserve service topology, ports, migration order, DB policy, secrets policy and provider behavior byte-for-semantics; this is documentation/Release-contract reconciliation only.
4. Extend `release-sot-gate.mjs` so active operator documents cannot reintroduce `banco-api:latest`, `banco-web:latest`, `banco-website:latest`, or `banco-web-static:latest`. The gate currently checks image immutability only in Compose.
5. Add a pre-build operational stop condition proving all three identities agree on the release candidate: approved Git SHA == Coolify source revision == `RELEASE_SHA`. Static source inspection alone cannot prove the runtime values.
6. Re-run the exact-head release gate once GitHub Actions/controlled execution can provide real steps/logs. Do not inherit PASS from earlier heads.

## P1 supply-chain determinism gap — separate from P0 correction

Even after the first-party image tag correction, the built bytes depend on moving upstream base-image tags:

- `Dockerfile.api`: `node:24-bookworm-slim` (builder and runner)
- `Dockerfile.banco-website`: `node:24-bookworm-slim`
- `Dockerfile.banco-web`: `node:24-bookworm-slim`
- `Dockerfile.web`: `node:24-bookworm-slim` + `nginx:1.27-alpine`
- Compose database: `postgres:16`

This does **not** invalidate a release whose final image IDs/RepoDigests are captured and whose prior image set is preserved for rollback. It does mean that rebuilding the same Git SHA later can consume different upstream base bytes.

Keep this separate from the P0 operator-doc reconciliation. Before global production certification, either pin approved upstream base digests after compatibility testing or at minimum record resolved base digests/SBOM/provenance for the certified build and forbid rollback by rebuilding old source.

## Execution truth

GitHub Release Assembly run inspected for the earlier release head still exposed `steps=null`, `logs_url=null`; direct job-log retrieval returned `BlobNotFound`, and no workflow artifacts were present. This proves executable evidence is unavailable, not a specific code or runner root cause.

No build/test PASS is claimed by this audit.

Run npm run build
