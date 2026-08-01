# 04 — Expo · Build · Dependency Audit

**Tip:** `06c709a`

---

## 1. Expo configuration

| Item | Value | Evidence |
|------|-------|----------|
| SDK | 54.0.36 | `artifacts/banco-mobile/package.json` |
| RN | 0.81.5 | same |
| React | 19.1.0 (catalog) | lock |
| New Architecture | enabled | `app.json` |
| typedRoutes + reactCompiler | enabled | `app.json` experiments |
| iOS deploy target | 15.1 | build-properties plugin |
| Android compile/target SDK | 35 | same |
| Bundle ID / package | `com.bancooom.app` | `app.json` |
| Scheme | `bancooom` | `app.json` |
| Splash / icons | Present on disk | `assets/images/*` |
| Privacy manifests | Present | `app.json` iOS |
| Apple Sign-In flag | `usesAppleSignIn: true` + `expo-apple-authentication` plugin/dep | `app.json` / package.json |
| Native `android/` `ios/` | Absent | managed/prebuild |
| Maps | Leaflet WebView + unpkg CDN | `mapHtml.ts` |
| Push | `expo-notifications` + bridge in `_layout` | hooks |

### EAS

| Item | Finding |
|------|---------|
| `eas.json` profiles | development / preview / production |
| Node for EAS | 24.18.0 |
| Production Android | app-bundle + autoIncrement |
| env in `eas.json` | Intentionally empty — must bake in EAS dashboard |
| Store submit block | Empty placeholder |

**Store readiness:** FAIL until env bake + well-known real IDs + device smoke (`OPS_GO_LIVE_CHECKLIST` §E–G).

---

## 2. Build system (monorepo)

| Path | Purpose |
|------|---------|
| Root `pnpm` scripts | typecheck, lint, confidence, ops:* |
| `turbo.sh` / `turbo.ps1` | Dev orchestration |
| API `build.mjs` | Bundle to `dist/index.mjs` |
| Vite apps | `dist/public` |
| Next apps | optional `NEXT_STANDALONE=true` for Docker |

### Docker matrix (verified by file presence)

| Image | Path |
|-------|------|
| Root API (EB/GCP path) | `Dockerfile` |
| Coolify API / web / banco-web / banco-website | `deploy/coolify/Dockerfile.*` |
| AWS API / web / banco-web | `deploy/aws/Dockerfile.*` |
| GCP API | `deploy/gcp/Dockerfile.api` |

**Compose SoT for Hostinger:** `docker-compose.coolify.yml` (self-declared definitive).

### Drift

1. Coolify profile-gates `banco-web`; `docker-compose.prod.yml` still runs it normally.
2. AWS `deploy.yml` does not build `banco-website` image.
3. Coolify nginx serves `.well-known` + SEO; AWS nginx does not (parity gap).
4. Older EB docs claim mobile excluded from Docker context; current `.dockerignore` **keeps** `banco-mobile` for pnpm workspace validation.

---

## 3. CI / CD

| Workflow | Role | Tip evidence |
|----------|------|--------------|
| `ci.yml` | Typecheck, builds, API Postgres tests, eslint, mobile static, production gates | success on `06c709a` |
| `ci-website.yml` | Website audits, builds, SEO, Lighthouse | success on recent main merges |
| `ci-website-docker.yml` | Docker builds for web/API images | success on PR #31 merge |
| `deploy.yml` | AWS ECR + SSM | not re-validated this session |
| sync-aws-virgen / sync-bancooom | Manual mirror sync | present |

Local re-execution: **UNVERIFIED** (`node_modules` missing).

---

## 4. Dependency audit

| Topic | Finding |
|-------|---------|
| React 18 residual | None found in active app manifests — React 19.1.0 |
| Catalog vs lock | Next catalog `^15.3.4` → lock `15.5.20`; Vite override `7.3.5` |
| Clerk | `@clerk/expo` 3.3.1; `@clerk/nextjs` lock 6.39.5; `@clerk/react` lock 6.10.0 |
| Icon tofu mitigation | Exact `@expo/vector-icons@15.0.3` override + icons test |
| Maps native module ban | Confidence gate forbids `react-native-maps` in mobile |
| CVE / `pnpm audit` | **UNVERIFIED** |
| Deprecated packages | No strong in-code deprecation markers in API; docs warn about frozen `banco-web` |

---

## 5. Localization audit (mobile)

| Check | Status |
|-------|--------|
| EN/AR key parity type | PASS pattern (`const ar: typeof en`) |
| Usage guard test | Present (`i18n-usage.test.mjs`) |
| RTL / Cairo font | Present in `LanguageContext` |
| Exhaustive UI string freedom from hardcoding | Guard exists; full pass **UNVERIFIED** this session |
| Website AR/EN parity | Not deeply audited this session → **UNVERIFIED** |

---

## 6. Expo / build scorecard

| Area | /10 |
|------|----:|
| Expo config completeness | 8 |
| EAS production bake | 2 |
| Docker Coolify artifacts | 8 |
| Multi-cloud parity | 5 |
| CI coverage | 9 |
| Dependency hygiene | 7 |
| Localization (mobile) | 8 |
