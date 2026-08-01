# 54 — Full effort report: Coolify confusion, mobile/accounts, SoT recovery

**Date:** 2026-07-30
**SoT:** `waelzaid66-max/banco-with-wael` only
**Mobile:** `BANCO` / `bancooom` / `com.bancooom.app`
**PR:** https://github.com/waelzaid66-max/banco-with-wael/pull/6

---

## 1. What the owner was right to complain about

| Pain | Root cause (measured) |
|------|------------------------|
| Hours lost on Coolify | Docs mixed **service `web`** (Nginx / `banco-web-static`) with **`banco-web`** (Next.js) and sometimes put apex on `banco-website` |
| “Which repo?” | Agent environment was bound to sister **`bancoo`**; Cursor App install lacked SoT write until owner PAT |
| “Wrong package / identity” | Sister clones use `com.bancoboom.app`; SoT is **`com.bancooom.app`** |
| “Is production ready?” | Repo artifacts can be green while live DNS still points Replit/Horizons — that is OPS, not a green CI lie |

**Apology in engineering terms:** shipping certification to the wrong GitHub remote wasted operator time. That is corrected: SoT PR #6 is the authority.

---

## 2. How to deploy Coolify now (no guessing)

**Open root file first:** [`COOLIFY_DEPLOY_NOW.md`](../../COOLIFY_DEPLOY_NOW.md)

Exact:

1. Coolify → Docker Compose
2. Repo **`banco-with-wael`**
3. File **`docker-compose.coolify.yml`**
4. Map apex → service **`web:80`**
5. Fill required env **before** Deploy
6. After healthy: `docker compose --profile migrate run --rm migrate`

Do **not** rename compose services (would break Coolify links). Docs + name map fixed instead.

---

## 3. Mobile / accounts status (re-audited)

### Identity

Verified in `app.json` + gates: **`com.bancooom.app`**, scheme **`bancooom`**, name **`BANCO`**.

### Account journeys gated by static tests

- Email / MFA / reset / delete-account password check / social fail-closed
- ClerkLoadGate / tokenCache / biometric hydration / AuthGate order
- Account-type Skip / FI `intent=fi` / profile role prefers `/me`
- Universal links H2 merge (executable)

### Real in-repo bug fixed this pass

**Delete-account KYC purge** ignored mobile `documents: string[]` and only walked object maps → KYC blobs could remain in object storage after delete.
Fixed in `UserService.ts` + regression test.

### Still OPS (not inventable in-repo)

| Item | Owner action |
|------|----------------|
| EAS env bake | `EXPO_PUBLIC_DOMAIN` or `EXPO_PUBLIC_API_BASE_URL`, Clerk publishable, public app URL, router origin |
| Clerk live tenant | keys, OTP, SSO enablement |
| DNS → Coolify | apex/www off Replit/Horizons |
| well-known `REPLACE_*` | Apple Team ID + Play SHA-256 |
| Device E2E | auth → feed → listing → upload → chat → delete |

---

## 4. Docker / compose truth (name map)

| Service | Image | Role |
|---------|-------|------|
| `api` | `banco-api` | Compose health **`/api/readyz`** (Dockerfile image healthz is secondary) |
| `web` | `banco-web-static` | Nginx front — **recommended apex** |
| `banco-web` | `banco-web` | Next.js |
| `banco-website` | `banco-website` | Next.js twin |
| `postgres` | `postgres:16` | DB |
| `migrate` | profile only | Manual schema push |

---

## 5. Verification this pass

| Check | Result |
|-------|--------|
| SoT PR #6 CI (prior tip) | 11/11 SUCCESS |
| chain-integrity | re-run after fixes |
| production-confidence | re-run after fixes |
| mobile accounts/session/universal/lib packs | re-run |
| deleteAccount KYC string[] test | new |
| Live production | **still not certified** (DNS/secrets) |

---

## 6. What success looks like for the owner

1. Merge PR #6 into `main` on **banco-with-wael**.
2. Coolify points **only** at that repo + `docker-compose.coolify.yml`.
3. Follow `COOLIFY_DEPLOY_NOW.md` env + apex→`web:80`.
4. Migrate once; smoke `/nginx-health` + `/api/readyz`.
5. EAS bake env for `com.bancooom.app`; device smoke.

Until steps 2–5 are done by humans with real secrets/DNS, no honest engineer can stamp **Live Production Ready**.
