# BANCO BOOM NEXT — Coolify Production Runbook

Use only with the production assembly manifest in this directory.

## Source

- Repository: `https://github.com/waelzaid66-max/bancoboom-v-next-`
- Canonical branch: `canonical/vnext-assembly`
- Compose file: `docker-compose.coolify.yml`
- Final deployment ref: the approved immutable release SHA, not an unverified moving branch.

## Required build/runtime inputs

Never commit secret values. Configure them in Coolify.

Required core variables:

- `RELEASE_SHA` — REQUIRED exact 40-character Git commit SHA approved for this release. It must equal the source revision Coolify is pinned to. Never reuse a release SHA tag for different source bytes.
- `POSTGRES_PASSWORD`
- `CLERK_SECRET_KEY`
- `SESSION_SECRET`
- `PAYMENT_CONFIG_ENCRYPTION_KEY`
- `OBJECT_STORAGE_PROVIDER=s3`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `PUBLIC_OBJECT_SEARCH_PATHS`
- `PRIVATE_OBJECT_DIR`
- `BANCO_WEBSITE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

Provider-dependent values must be configured when their feature is enabled: Paymob, Resend/email, public application/API URLs, mobile store URLs and map keys.

## Immutable application-image contract

All first-party application images use the same release identity: `RELEASE_SHA`. The compose file must never use `:latest` for `banco-api`, `banco-web`, `banco-website`, or `banco-web-static`.

Before build:

1. Pin Coolify to the approved exact Git SHA.
2. Set `RELEASE_SHA` to that exact same 40-character SHA.
3. Record the previous approved `RELEASE_SHA` as the rollback source before changing anything.

After build and before traffic:

1. Record the resolved image reference for every first-party service.
2. Record each local image ID (`docker image inspect <image-ref> --format '{{.Id}}'`).
3. If a registry is used, also record its immutable RepoDigest (`docker image inspect <image-ref> --format '{{json .RepoDigests}}'`).
4. Fill `release/production/IMAGE_ROLLBACK_TEMPLATE.md` with the exact SHA → image-ID/digest mapping and the previous approved release mapping.
5. Stop if any service resolves to a different release tag, an empty tag, `latest`, or an image whose provenance cannot be tied back to the approved source SHA.

A SHA-shaped tag is a release locator; the captured image ID/RepoDigest is the immutable image-content evidence. Both are required for production acceptance.

## Safe deployment procedure

1. Set Coolify source repository to BANCO BOOM NEXT. Verify the displayed repository URL manually before any build.
2. Select `docker-compose.coolify.yml`.
3. Pin the approved exact SHA in the deployment/source configuration. Set `RELEASE_SHA` to the same exact 40-character SHA and record both in release evidence.
4. Build all required images first. Do not expose application traffic yet. Capture the image IDs/digests and rollback mapping before starting application services.
5. Start `postgres`; require its healthcheck to pass.
6. Determine whether the database is fresh or an existing pre-journal database.
7. Fresh database: run `docker compose --profile migrate run --rm migrate` directly.
8. Existing pre-journal database: enter an explicit DB-adoption maintenance window before any baseline. Stop API/application traffic and every migration/deploy/schema writer that can target this database; use the dedicated release/adoption DB credential/session; verify immediately before baseline that no other target-DB session capable of DDL is active; keep that quiescent state continuously through baseline plus the immediately following migrate. Then prove schema equivalence to the approved adoption cutoff, run the one-time baseline, and run normal migrate before reopening writers. The baseline transaction's advisory/table locks are defense-in-depth only and are not a schema-wide mutex against arbitrary concurrent DDL.
9. Start `api`; require `/api/readyz` to return HTTP 200.
10. Start `banco-website` and `web`. Start `banco-web` only if the explicit legacy profile is required.
11. Verify reverse-proxy routes, CORS, Clerk proxy behaviour, object storage, email/push and public URLs.
12. Run payment sandbox verification before enabling production payment mode.
13. Execute end-to-end smoke tests and physical-device mobile tests.
14. Capture database backup and verify restore in an isolated target.
15. Rehearse rollback to the previously approved SHA/image set using the recorded rollback mapping, without rebuilding or retagging the old release.

## Release evidence to record

- Git commit SHA
- Git tree/repository identity
- `RELEASE_SHA` and proof that it equals the Coolify source revision
- CI run IDs and job logs
- First-party image refs, local image IDs and registry digests when available
- Previous approved release SHA + image mapping for rollback
- Migration journal/state
- DB-adoption maintenance-window evidence when baseline is required: writer shutdown, session check, baseline result and migrate result before writer restart
- Coolify deployment ID
- Provider test evidence
- Android/iOS build identifiers
- Backup identifier and restore result
- Rollback SHA and rehearsal result

## Stop conditions

Stop deployment immediately if any operator-facing source points to `bancoboomstor` or another historical repository, if CI did not execute real steps, if migrations are ambiguous, if a pre-journal baseline is required but DDL quiescence cannot be proven and held through baseline+migrate, if `RELEASE_SHA` is absent or does not exactly equal the approved source SHA, if a first-party image uses a mutable tag, or if the deployed image SHA/content identity cannot be proven.

Run `npm run build`.
