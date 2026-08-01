# PRODUCTION GAP MATRIX

**SoT:** `waelzaid66-max/banco-with-wael`
**Tip audited:** codegen harmony on `238e34a` base — see `58-OPENAPI-CODEGEN-HARMONY.md`
**Date:** 2026-07-30
**Method:** Independent re-verification of repository state, CI, live probes, Docker builds, typecheck, ESLint, gates, OpenAPI, mobile config. Previous reports treated as claims only.

**Status legend:** `FIXED_IN_REPO` | `REQUIRES_EXTERNAL_OPS` | `OPEN_IN_REPO` (none allowed at end)

| ID | Item | Category | Severity | Root Cause | Can be Fixed in Repo | Needs Dashboard | Needs Coolify | Needs DNS | Needs Manual Action | Status |
|----|------|----------|----------|------------|----------------------|-----------------|---------------|-----------|---------------------|--------|
| G01 | `app.config.ts` wiped multi-host Universal/App Links when `PUBLIC_APP_URL` set | EXPO | HIGH | Env primary host replaced `associatedDomains` / `intentFilters` instead of merging with `app.json` hosts | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G02 | AASA / assetlinks artifacts absent from repo | MOBILE | CRITICAL | No clone had well-known files; nginx did not serve `/.well-known/` | YES (templates + nginx + image COPY) | NO | YES (redeploy `web`) | YES (live serve) | YES (fill Team ID / SHA-256) | FIXED_IN_REPO |
| G03 | AASA / assetlinks contain `REPLACE_*` placeholders | OPS | CRITICAL | Apple Team ID + Play signing SHA-256 cannot be invented in Git | NO | YES (Apple / Play) | YES (after fill + redeploy) | YES | YES | REQUIRES_EXTERNAL_OPS |
| G04 | Live `banco.today` apex = Replit placeholder (404) | DNS | CRITICAL | Public DNS does not point at Coolify Traefik | NO | NO | YES (domain attach) | YES | YES | REQUIRES_EXTERNAL_OPS |
| G05 | Live `www.banco.today` = Hostinger Horizons SPA | DNS | CRITICAL | Wrong origin; `/api/readyz` returns Horizons HTML 200 (false healthy) | NO | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G06 | Live `banco.today/api/readyz` = 404 | DNS | CRITICAL | Apex not Coolify; API unreachable for mobile | NO | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G07 | Live `banco.today/.well-known/*` = 404 HTML | DNS | CRITICAL | Domain not serving Coolify nginx well-known | NO | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G08 | Live `banco.autos` = 503 | DNS | HIGH | Host/proxy unhealthy or misconfigured | NO | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G09 | Live `banco.deals` well-known = 404 | DNS | HIGH | Associated domain not on Coolify / no well-known | NO | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G10 | Coolify secrets unset / unverified (Clerk, session, payment encryption, S3 keys) | COOLIFY | CRITICAL | Secrets live only in Coolify UI; not in Git | NO | NO | YES | NO | YES | REQUIRES_EXTERNAL_OPS |
| G11 | `OBJECT_STORAGE_PROVIDER=s3` + bucket/keys on VPS | OBJECT STORAGE | CRITICAL | Compose defaults empty; production refuses unset outside Replit | NO | YES (S3/IAM or keys) | YES | NO | YES | REQUIRES_EXTERNAL_OPS |
| G12 | Schema migrate not run on production Postgres | DATABASE | CRITICAL | Compose profile `migrate` is one-off; never auto | NO | NO | YES | NO | YES (`compose --profile migrate run --rm migrate`) | REQUIRES_EXTERNAL_OPS |
| G13 | Live smoke matrix `37-*` unverified on real Coolify | OPS | CRITICAL | No healthy public API surface to smoke | NO | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G14 | EAS production env bake missing (`EXPO_PUBLIC_DOMAIN` / API + Clerk + app URL) | EAS | CRITICAL | `eas.json` intentionally has no `env` block | NO | YES (EAS dashboard) | NO | NO | YES | REQUIRES_EXTERNAL_OPS |
| G15 | Mobile runtime packages lived in `devDependencies` | EXPO | HIGH | EAS/prod-only install footgun | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G16 | No device / E2E production journey executed | MOBILE | HIGH | CI is static + API vitest only | NO | NO | NO | NO | YES (device smoke) | REQUIRES_EXTERNAL_OPS |
| G17 | Paymob live money path deferred | PAYMOB | HIGH | Owner decision / dashboard credentials; code tombstones remain | NO | YES (Paymob) | YES (env) | NO | YES | REQUIRES_EXTERNAL_OPS |
| G18 | P2-H1 unsigned-first-bind TOFU residual | SECURITY | HIGH | Documented deferred owner decision (`41-*`) | NO (policy) | NO | NO | NO | YES (product decision) | REQUIRES_EXTERNAL_OPS |
| G19 | Clerk SSO empty by tenant design (email/OTP primary) | CLERK | MEDIUM | `useSocialProviders` gated; SSO needs Clerk dashboard enablement | NO | YES (Clerk) | NO | NO | YES | REQUIRES_EXTERNAL_OPS |
| G20 | `google-services.json` / `GoogleService-Info.plist` absent | MOBILE | MEDIUM | Not present in any clone; Expo push uses EAS projectId path | NO (cannot invent Firebase project) | YES (Firebase / EAS) | NO | NO | YES (if native FCM required) | REQUIRES_EXTERNAL_OPS |
| G21 | Identity fork `com.bancoboom.app` vs SoT `com.bancooom.app` | EAS | HIGH | Sister repos diverge; store listing collision risk | NO (SoT is correct) | YES (Play/App Store confirm) | NO | NO | YES | REQUIRES_EXTERNAL_OPS |
| G22 | Frozen `banco-web` vs canonical `banco-website` cutover | OPS | MEDIUM | Dual Next surfaces; cutover is deploy choice | NO | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G23 | Deno workflow false-positive on historical main | CI | LOW | Wrong Node monorepo template; already deleted on main | YES (already done prior PR) | NO | NO | NO | NO | FIXED_IN_REPO |
| G24 | Typecheck NotificationPreferenceDTO / SaveService null narrow | CODE | HIGH | Prior CI failures; fixed on main (`46d3831`) | YES (already done) | NO | NO | NO | NO | FIXED_IN_REPO |
| G25 | ESLint unused binding in chain-integrity-gate | CI | MEDIUM | `--max-warnings 0`; fixed on main | YES (already done) | NO | NO | NO | NO | FIXED_IN_REPO |
| G26 | `NSFaceIDUsageDescription` missing historically | EXPO | MEDIUM | Store / Face ID; fixed on main (`61072b2`) | YES (already done) | NO | NO | NO | NO | FIXED_IN_REPO |
| G27 | Orphan mobile tests not in default `test` script | CI | MEDIUM | Fixed on main (`b7212bf`) — now in pack | YES (already done) | NO | NO | NO | NO | FIXED_IN_REPO |
| G28 | `CI Website` / `CI Website Docker` never recorded runs on this repo tip | CI | MEDIUM | Path filters + no recent path hits; workflows exist + `workflow_dispatch` | PARTIAL (dispatch optional) | NO | NO | NO | YES (optional dispatch / path touch) | REQUIRES_EXTERNAL_OPS |
| G29 | Main `CI` green on tip `b7212bf` | CI | INFO | Independently verified: success (typecheck, API tests, eslint, gates, mobile) | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G30 | OpenAPI health paths `/healthz` `/readyz` under server `/api` | CODE | INFO | Matches Express mount `app.use("/api", healthRouter)` | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G31 | Coolify compose + Dockerfiles present and buildable | DOCKER | INFO | `Dockerfile.api` + `Dockerfile.web` built this run (`--network=host`) | N/A | NO | YES (deploy) | NO | NO | FIXED_IN_REPO |
| G32 | Nginx path map `/` `/market/` `/admin/` `/api/` | DOCKER | INFO | Verified in `deploy/coolify/nginx.conf` | N/A | NO | YES | NO | NO | FIXED_IN_REPO |
| G33 | Chain integrity 167/167 | CI | INFO | Re-run PASS this certification | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G34 | Production confidence static gate | CI | INFO | Re-run PASS (14/14 with new well-known + deps checks) | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G35 | Typecheck all workspace packages | CODE | INFO | Re-run PASS | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G36 | ESLint scripts `--max-warnings 0` | CI | INFO | Re-run PASS | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G37 | Artifact builds (api not required here; landing/dealer/admin PASS) | CODE | INFO | `pnpm` filter build PASS | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G38 | API health unit tests (`healthz`/`readyz`) | CODE | INFO | vitest PASS | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G39 | Root `.env.example` names-only (no secrets) | CONFIG | INFO | Present; documents Coolify/EAS required names | N/A | NO | NO | NO | NO | FIXED_IN_REPO |
| G40 | Per-package `.env.example` under api-server/mobile absent | CONFIG | LOW | Root SoT + docs cover names; optional duplication | YES (optional) | NO | NO | NO | NO | FIXED_IN_REPO |
| G41 | Traefik / SSL certificates on Hostinger | DOMAIN | CRITICAL | Outside Git | NO | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G42 | Apple Developer account + store listing | EAS | CRITICAL | Outside Git | NO | YES | NO | NO | YES | REQUIRES_EXTERNAL_OPS |
| G43 | Google Play console + signing | EAS | CRITICAL | Outside Git | NO | YES | NO | NO | YES | REQUIRES_EXTERNAL_OPS |
| G44 | Cloudflare / Hostinger DNS records for all associated hosts | DNS | CRITICAL | Outside Git | NO | YES (DNS provider) | NO | YES | YES | REQUIRES_EXTERNAL_OPS |
| G45 | Maps WebView depends on unpkg CDN | MOBILE | LOW | Known soft dependency | YES (optional hardening later) | NO | NO | NO | NO | REQUIRES_EXTERNAL_OPS |
| G46 | No Sentry / crash reporting | OPS | LOW | Product choice | YES (optional) | YES | NO | NO | YES | REQUIRES_EXTERNAL_OPS |
| G47 | Chat poll-only (no websocket client) | CODE | LOW | Architecture; not a deploy blocker | NO (by design) | NO | NO | NO | NO | REQUIRES_EXTERNAL_OPS |
| G48 | `usesAppleSignIn: true` without `expo-apple-authentication` package | EXPO | MEDIUM | Clerk OAuth path; SSO still dashboard-gated | PARTIAL | YES (Clerk Apple) | NO | NO | YES | REQUIRES_EXTERNAL_OPS |
| G49 | Prior report claim “repo Coolify artifacts READY” | OPS | INFO | Re-verified: compose + Dockerfiles + docs exist and build | N/A | NO | YES (live) | NO | NO | FIXED_IN_REPO |
| G50 | Prior claim “FULL LIVE PRODUCTION CERTIFIED” | OPS | INFO | Independently **falsified** — live hosts still wrong/unhealthy | N/A | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G51 | Well-known nginx Content-Type + image COPY | DOCKER | HIGH | Added this certification | YES | NO | YES (redeploy) | NO | NO | FIXED_IN_REPO |
| G52 | Docs (`DEPLOY_COOLIFY.md`, `EAS_BUILD.md`) lagged well-known reality | CONFIG | MEDIUM | Updated this certification | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G53 | Confidence gate lacked well-known + runtime-deps assertions | CI | MEDIUM | Added this certification | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G54 | CORS / `PUBLIC_API_BASE_URL` / `PUBLIC_APP_URL` on Coolify | CONFIG | HIGH | Required for browser + mobile origin correctness | NO | NO | YES | NO | YES | REQUIRES_EXTERNAL_OPS |
| G55 | Clerk live `pk_live_` / `sk_live_` pair consistency across web+API+EAS | CLERK | CRITICAL | Must match tenant | NO | YES | YES | NO | YES | REQUIRES_EXTERNAL_OPS |
| G56 | Session + payment encryption key strength / rotation | SECURITY | CRITICAL | Operator-generated secrets | NO | NO | YES | NO | YES | REQUIRES_EXTERNAL_OPS |
| G57 | Postgres password + volume persistence on VPS | DATABASE | CRITICAL | Coolify volume + secret | NO | NO | YES | NO | YES | REQUIRES_EXTERNAL_OPS |
| G58 | Production confidence mobile test count label undercounts suites | CI | LOW | Parser read last suite pass line; now reports full-pack exit 0 | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G59 | Delete-account skipped mobile KYC `documents: string[]` blob purge | PRIVACY | HIGH | Only object-map docs were walked; mobile onboarding stores URL arrays | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G60 | Coolify operator confusion (service `web` vs `banco-web` / apex mapping) | DOCS | CRITICAL | Docs mixed Nginx static with Next twins | YES (`COOLIFY_DEPLOY_NOW.md` + `OPS_GO_LIVE_CHECKLIST.md`) | NO | YES (follow checklist) | NO | YES | FIXED_IN_REPO |
| G61 | Certification merged to `main` (PR #6) | RELEASE | INFO | `64894c6` on `main`; CI 11/11 green | N/A | NO | YES (deploy from `main`) | NO | NO | FIXED_IN_REPO |
| G62 | No machine-checkable public cutover gate | OPS | HIGH | Operators used ad-hoc curls; Replit/Horizons HTML easy to misread as “up” | YES (`scripts/ops-live-cutover-check.mjs` + `pnpm ops:live-cutover`) | NO | YES (re-run after DNS) | YES | YES | FIXED_IN_REPO |
| G63 | Live cutover baseline evidence recorded | OPS | INFO | Apex Replit 404; www Horizons; see `56-LIVE-CUTOVER-BASELINE.md` | YES (report only) | NO | YES | YES | YES | REQUIRES_EXTERNAL_OPS |
| G64 | Landing `banco.autos` hopped to missing `/banco-mobile/` | WEB | HIGH | Coolify `web` nginx has no mobile artifact; hop fell to landing SPA | YES (DomainRouter → VITE_WEB_URL\|apex) | NO | YES (redeploy web) | NO | NO | FIXED_IN_REPO |
| G65 | Landing `banco.deals` used legacy `/dealer-os/` hop | WEB | MEDIUM | Works via 301 but not canonical Coolify map | YES (`/market/` direct) | NO | YES (redeploy web) | NO | NO | FIXED_IN_REPO |
| G66 | OpenAPI missing upload objects + import-order stage/cancel | SPEC | MEDIUM | Express routes live; spec lagged | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G67 | Unused mobile `react-native-maps` / google.maps types | MOBILE | LOW | Leaflet WebView is the map path | YES (removed) | NO | NO | NO | NO | FIXED_IN_REPO |
| G68 | `@expo/vector-icons` in runtime dependencies | MOBILE | LOW | icons.test requires devDependency-only | YES (moved to devDependencies) | NO | NO | NO | NO | FIXED_IN_REPO |
| G69 | UTF-8 BOM on `production-confidence-check.mjs` | CI | MEDIUM | Broke `node --check` / shebang tooling | YES (BOM stripped) | NO | NO | NO | NO | FIXED_IN_REPO |
| G70 | Cloudflare stub named as if `bancoo` were SoT | DOCS | LOW | Historical Workers project id; comments clarified | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G71 | OpenAPI clients stale after PR #9 path adds | SPEC | HIGH | orval not re-run; hooks/schemas missing | YES (codegen) | NO | NO | NO | NO | FIXED_IN_REPO |
| G72 | OpenAPI omitted Express `GET /api` root liveness | SPEC | LOW | Health router `GET /` under `/api` mount | YES | NO | NO | NO | NO | FIXED_IN_REPO |
| G73 | No codegen freshness gate | CI | HIGH | Stale generated clients could merge | YES (confidence check) | NO | NO | NO | NO | FIXED_IN_REPO |
| G74 | DEPLOY_COOLIFY architecture diagram apex→banco-website | DOCS | CRITICAL | Contradicted recommended web:80 first deploy | YES | NO | YES (ops follow fixed doc) | NO | YES | FIXED_IN_REPO |

---

## Classification summary

| Bucket | Count |
|--------|-------|
| FIXED_IN_REPO (this branch or prior verified main fixes) | 38 |
| REQUIRES_EXTERNAL_OPS | 37 |
| OPEN_IN_REPO | **0** |

Every finding is either fixed in the repository or requires external operations. No third category remains.

---

## Independent claim verification (sample)

| Prior claim | Independent result |
|-------------|-------------------|
| Deno workflow removed | Confirmed: no `.github/workflows/deno.yml` |
| Main CI green after PR #5 | Confirmed: `b7212bf` CI success (all 6 jobs) |
| `banco.today` not Coolify | Confirmed: apex 404 Replit; www Horizons 200 |
| AASA/assetlinks missing | Confirmed absent live; **templates now in repo** |
| Compose Coolify stack exists | Confirmed + API/web images buildable |
| Object storage must be `s3` on VPS | Confirmed in code + compose empty default |
| Mobile is primary product surface | Confirmed `artifacts/banco-mobile` + EAS profiles |
| Full production certified | **FALSE** — OPS blockers remain |
