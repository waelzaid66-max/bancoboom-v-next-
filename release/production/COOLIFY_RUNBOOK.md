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

## Safe deployment procedure

1. Set Coolify source repository to BANCO BOOM NEXT. Verify the displayed repository URL manually before any build.
2. Select `docker-compose.coolify.yml`.
3. Pin the approved exact SHA in the deployment/source configuration when supported. Record it in the release evidence.
4. Build all required images first. Do not expose application traffic yet.
5. Start `postgres`; require its healthcheck to pass.
6. Determine whether the database is fresh or an existing pre-journal database.
7. Fresh database: run `docker compose --profile migrate run --rm migrate` directly.
8. Existing pre-journal database: prove schema equivalence to the release migration state before any one-time baseline, then run migrate.
9. Start `api`; require `/api/readyz` to return HTTP 200.
10. Start `banco-website` and `web`. Start `banco-web` only if the explicit legacy profile is required.
11. Verify reverse-proxy routes, CORS, Clerk proxy behaviour, object storage, email/push and public URLs.
12. Run payment sandbox verification before enabling production payment mode.
13. Execute end-to-end smoke tests and physical-device mobile tests.
14. Capture database backup and verify restore in an isolated target.
15. Rehearse rollback to the previously approved SHA/image set.

## Release evidence to record

- Git commit SHA
- Git tree/repository identity
- CI run IDs and job logs
- Docker image digests
- Migration journal/state
- Coolify deployment ID
- Provider test evidence
- Android/iOS build identifiers
- Backup identifier and restore result
- Rollback SHA and rehearsal result

## Stop conditions

Stop deployment immediately if any operator-facing source points to `bancoboomstor` or another historical repository, if CI did not execute real steps, if migrations are ambiguous, or if the deployed image SHA cannot be proven.

Run `npm run build`.
