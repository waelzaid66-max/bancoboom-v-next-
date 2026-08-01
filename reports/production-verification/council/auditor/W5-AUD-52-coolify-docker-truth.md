# W5-AUD-52 — Coolify / Docker truth audit (docs + compose)

- Tip SHA: **`a9f5c358149c473019a0c07fcbaea087d143422a`**
- Seat: Production Auditor · Truth map `70` §1–2 · **D-21**
- Scope: evidence only · **NO Dockerfile / compose product rewrites**

## Strong (matches `70` — do not “improve”)

| Claim (`70`) | Tip evidence | Verdict |
|--------------|--------------|---------|
| Compose SoT = `docker-compose.coolify.yml` | file present; services `postgres` · `migrate` · `api` · `banco-website` · `web` · `banco-web` | **CONFIRMED** |
| Apex = service **`web:80`** (nginx) | compose `web.ports: "${WEB_HOST_PORT:-80}:80"` · deploy-order §5 | **CONFIRMED** |
| Default stack ≠ map apex to `banco-website` | `banco-website` is Next twin on 3001; apex is `web` | **CONFIRMED** |
| `migrate` profile explicit | `migrate.profiles: ["migrate"]` · deploy-order §2 `--profile migrate` | **CONFIRMED** |
| `banco-web` legacy profile only | `banco-web.profiles: ["legacy-banco-web"]` · deploy-order §4 corrected | **CONFIRMED** |
| API HC `/api/readyz` | compose api healthcheck fetch `…/api/readyz` | **CONFIRMED** |
| S3 fail-closed on Coolify | compose `${OBJECT_STORAGE_PROVIDER:?…}` + AWS/S3 required vars; `objectStorageProvider.ts` forbids `replit` when `COOLIFY_*` / Cloud Run / AWS markers; production unset fail-closes | **CONFIRMED** |
| Operator bible order | `COOLIFY_DEPLOY_NOW.md` → `COOLIFY-DEPLOY-ORDER.md` | **CONFIRMED** (doc path; OPS execution = Owner) |

## Weak / unbound / cheap (inventory — no fix this seat)

| Gap | Class | Evidence |
|-----|-------|----------|
| Live DNS still Replit apex + Horizons www | OPS | AUD-55 cutover 0/6 |
| Well-known `REPLACE_*` | OPS ASB | cutover assetlinks/AASA fail on Replit HTML |
| Migrate manual forever if skipped | OPS process | profile-gated by design |
| `ci-website-docker.yml` builds images only | **CI hole** | jobs = `docker build` ×5; **no** `compose up`; path-filtered |
| No Coolify CD workflow | Missing | only `deploy.yml` AWS-class present |
| `confidence` static ≠ live VPS | Epistemic | `70` §7 L0≠L4 |
| EAS preview `environment: production` | Bake landmine | document only (`70` §2) — no eas.json rewrite |

## Name map (landmine)

| Service | Role | Host default |
|---------|------|--------------|
| `web` | nginx apex SPA | **80** |
| `banco-website` | canonical Next | 3001 |
| `banco-web` | legacy Next (profile) | 3000 |
| `api` | API | 8080 |

**Do not rename.** Confusing these is an interconnect break (`70` §6.7).

## Auditor JUDGMENT

Compose + deploy-order + S3 fail-closed + apex `web:80` = **TRUTH_ALIGNED** with `70` on tip.  
CI compose-up + public DNS = **UNBOUND** (Owner OPS / future Approve Plans — Reliability REL-14 inventory seat).  
**No Dockerfile/compose edits from Auditor.**
