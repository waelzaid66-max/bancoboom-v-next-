# BANCO BOOM NEXT — Production Environment Contract

This document defines variable names and ownership only. Never place secret values in Git.

## Database
- `POSTGRES_USER`
- `POSTGRES_PASSWORD` (required)
- `POSTGRES_DB`
- `DATABASE_URL` (derived inside Compose for API/migrate)
- `DB_POOL_MAX`

## Auth / session
- `CLERK_SECRET_KEY` (required)
- `CLERK_PUBLISHABLE_KEY`
- `SESSION_SECRET` (required)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (canonical site build)
- `NEXT_PUBLIC_CLERK_PROXY_URL`
- `VITE_CLERK_PUBLISHABLE_KEY` (SPA build)
- `VITE_CLERK_PROXY_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (mobile build)
- `EXPO_PUBLIC_CLERK_PROXY_URL`

## Object storage
- `OBJECT_STORAGE_PROVIDER=s3`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `PUBLIC_OBJECT_SEARCH_PATHS`
- `PRIVATE_OBJECT_DIR`

## Public URLs / routing
- `PUBLIC_API_BASE_URL`
- `PUBLIC_APP_URL`
- `CORS_ALLOWED_ORIGINS`
- `BANCO_WEBSITE_URL`
- `BANCO_WEB_URL`
- `BANCO_WEB_MARKET_URL`
- `BANCO_WEB_ADMIN_URL`
- `VITE_API_BASE_URL`
- `VITE_MARKET_URL`
- `VITE_ADMIN_URL`
- `VITE_WEB_URL`
- `EXPO_PUBLIC_DOMAIN` or `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_PUBLIC_APP_URL`
- `EXPO_PUBLIC_ROUTER_ORIGIN`

## Store/application links
- `NEXT_PUBLIC_APP_ANDROID_URL`
- `NEXT_PUBLIC_APP_IOS_URL`
- `VITE_APP_ANDROID_URL`
- `VITE_APP_IOS_URL`

## Payments
- `PAYMENT_CONFIG_ENCRYPTION_KEY` (required)
- `PAYMOB_MODE`
- `PAYMOB_API_BASE`
- `PAYMOB_PUBLIC_KEY`
- `PAYMOB_SECRET_KEY`
- `PAYMOB_HMAC_SECRET`
- `PAYMOB_INTEGRATION_IDS`

## Email / AI / notifications
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Observability / operations
- `ERROR_ALERT_WEBHOOK`
- `LOG_LEVEL`
- `LOG_DIR`
- `CRON_TIMEZONE`
- `TRUST_PROXY_HOPS`
- `COOLIFY_URL`
- `COOLIFY_FQDN`
- `GIT_SHA`
- `BUILD_ID`

## Release rule
Every production deployment must record which variables are configured/missing by NAME only, without exposing values. Required variables must fail closed at startup/build. Optional provider variables must have a documented degraded mode.
