# 46 — w.4.1 local Coolify image smoke (higher precision)

**Authority:** Owner delegated full delivery.  
**Tag under test:** `w.4.1` → `6c6dec4534831aadd304737700cb0d961cad9743`  
**Date:** 2026-07-29  
**Scope:** Rebuild + run Coolify Dockerfiles **in agent host** — not public DNS / Coolify VPS.

---

## 1. Verdict

| Layer | Result |
|-------|--------|
| Coolify **images from tag** (API + website + nginx SPA) | **PASS** — built as `*:w41` |
| Local runtime smoke (API pin + money_schema + website identity + nginx aliases) | **PASS** |
| Stale prior `agent-proof` containers | **NOT** equivalent to `w.4.1` (see §4) |
| Public `banco.today` Coolify | **still FAIL** — Replit placeholder (unchanged) |
| FULL PRODUCTION CERT | **still NO** |

---

## 2. Images built from tag `6c6dec4`

| Image | Dockerfile | Tag |
|-------|------------|-----|
| `banco-api-coolify:w41` | `deploy/coolify/Dockerfile.api` | `GIT_SHA=6c6dec4…` `BUILD_ID=w.4.1` |
| `banco-website:w41` | `deploy/coolify/Dockerfile.banco-website` | bake MARKET/ADMIN `/market/` `/admin/` |
| `banco-web-static:w41` | `deploy/coolify/Dockerfile.web` | tip `nginx.conf` |

---

## 3. Local runtime probes (PASS)

### 3.1 API `banco-api-w41` (`PORT=8081`, `--network=host`)

| Probe | HTTP | Body (abbrev) |
|-------|------|----------------|
| `GET /api/healthz` | **200** | `{"status":"ok"}` |
| `GET /api/livez` | **200** | `gitSha=6c6dec4…` `buildId=w.4.1` |
| `GET /api/readyz` | **200** | `checks.database=ok` **`checks.money_schema=ok`** + same pin |

DB: host Postgres `banco_test` with `payment_intents` / `transactions` / `promo_ad_transactions` present.

### 3.2 Website `banco-website-w41` (`PORT=3001`)

| Probe | HTTP | Notes |
|-------|------|-------|
| `GET /api/healthz` | **200** | `surface=banco-website` `wave=w4.1` `plug=on` |
| `GET /workspace/settings` | **503** | Expected fail-closed without Clerk publishable key in this smoke |

### 3.3 Nginx SPA `banco-web-static-w41` (listen **8088**, upstream patched to `127.0.0.1:8081` for host-net)

Stock image fails on host-net with `host not found in upstream "api:8080"` — **compose DNS name**. Local patch only for agent host; Coolify compose keeps `api:8080`.

| Path | HTTP | Notes |
|------|------|-------|
| `/nginx-health` | **200** | |
| `/` | **200** | landing |
| `/market/` | **200** | dealer-os |
| `/admin/` | **200** | admin-os |
| `/dealer-os` `/dealer-os/` | **301 → /market/** | M7a alias |
| `/admin-os/` | **301 → /admin/** | |
| `/banco-mobile/` | **200** | landing fallback — **M7b confirmed** |
| `/api/readyz` via nginx | **200** | money_schema ok + pin |

---

## 4. Stale `agent-proof` contrast (why rebuild was required)

| Probe | Old `banco-api/web:agent-proof` | `w41` rebuild |
|-------|--------------------------------|---------------|
| API `readyz` money_schema | **absent** (only `database`) | **`ok`** |
| API deploy pin | `gitSha/buildId` null | **`6c6dec4` / `w.4.1`** |
| Web health | `surface=banco-web` `wave=phase8-soft-launch` | `banco-website` / `w4.1` |

Do **not** treat 11h-old agent-proof containers as `w.4.1` proof.

---

## 5. Public DNS (re-checked — still not Coolify)

| Host | IP / org | Result |
|------|----------|--------|
| `banco.today` / `banco.deals` | `34.111.179.208` Google / Replit | **"This app isn't live yet"** |
| `www.banco.today` | Hostinger Horizons | Vite HTML ≠ BANCO API |
| `api.banco.today` | NXDOMAIN / fail | |

---

## 6. Push gap (docs)

Local commits after remote `eeb87ec` may include GO/NO-GO alignment + this report.  
Agent `gh`/cursor[bot] **cannot push** to `waelzaid66-max/banco-with-wael` after write PAT scrub.  
**Tag `w.4.1` and delivery `45-*` remain on `origin/main`.** Owner: `git pull` then cherry-pick/push remaining docs if needed.

---

## 7. Official posture (updated)

| Question | Answer |
|----------|--------|
| Git tag `w.4.1` released? | **YES** |
| Coolify Dockerfiles produce healthy local stack for tag? | **YES** (this report) |
| Public Coolify live? | **NO** |
| FULL CERT? | **NO** until DNS → this stack + smoke `37-*` on public URL |

---

## STOP / RESUME

Resume public smoke when `https://<host>/api/readyz` returns JSON with `money_schema=ok` and `buildId`/`gitSha` for `w.4.1`.
