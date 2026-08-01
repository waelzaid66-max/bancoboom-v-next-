# 47 — w.4.1 ultra-precision local cert (Coolify images)

**Tag:** `w.4.1` → `6c6dec4534831aadd304737700cb0d961cad9743`  
**Images:** `banco-api-coolify:w41` · `banco-website:w41` · `banco-web-static:w41`  
**Runtime:** agent host `--network=host` (API `:8081`, website `:3001`, nginx `:8088`→API `:8081`)  
**Gates this turn:** chain **167/167** · confidence **14/14** · facets vitest **10/10**  
**OpenAPI tip:** **140 paths / 166 ops** (`market_country` on `/v1/search/facets`)

---

## 1. Verdict

| Claim | Result |
|-------|--------|
| Coolify Dockerfiles for tag produce correct health/identity/money_schema | **PROVEN locally** |
| P2-M1 facets `market_country` live on rebuilt API | **PROVEN** (EG total **25** ≠ SA total **0**) |
| Paymob webhook rejects unsigned body | **PROVEN** (`401 {"ok":false}`) |
| nginx Coolify aliases + M7b `/banco-mobile` landing fallback | **PROVEN** |
| Public `banco.today` is this stack | **FALSE** — Replit placeholder |
| FULL PRODUCTION CERTIFIED | **NO** |

---

## 2. Matrix (local)

### API (`:8081`)

| ID | Request | Expect | Result |
|----|---------|--------|--------|
| S1 | `GET /api/healthz` | 200 ok | **PASS** |
| S2 | `GET /api/livez` | pin `6c6dec4` + `w.4.1` | **PASS** |
| S3 | `GET /api/readyz` | `database`+`money_schema` ok + pin | **PASS** |
| S3b | `GET /api/v1/payments/return` | 200 HTML BANCO Payment | **PASS** |
| S3c | `POST /api/v1/payments/webhook` no HMAC | **401** `ok:false` | **PASS** |
| S3d′ | `GET /api/v1/search/facets?category=car&market_country=EG` | 200 total>0 | **PASS** total=**25** |
| S3e′ | same `market_country=SA` | 200 total≠EG | **PASS** total=**0** |
| S3f | `GET /api/v1/search?q=toyota&market_country=EG&limit=1` | 200 | **PASS** |
| S3t | `GET /api/v1/search/trending?market_country=EG&limit=2` | 200 | **PASS** |
| S3r | `GET /api/v1/search/recommendations?market_country=EG&limit=2` | 200 | **PASS** |
| S3g/h | `GET/DELETE /api/v1/me` | 401 UNAUTHORIZED | **PASS** |

**Note:** Wrong path `/api/v1/facets` → 404 (correct is `/api/v1/search/facets`). Wrong enum `cars` → 400 (`car`).

### Website (`:3001`)

| ID | Request | Result |
|----|---------|--------|
| W1 | `/api/healthz` | **200** `surface=banco-website` `wave=w4.1` |
| W2 | `/` | **200** RTL AR HTML |
| W3/W4 | `/workspace/settings` (+en) | **503** `Authentication is not configured` (fail-closed; no Clerk pk in smoke) |
| W5/W6 | `/sign-in` (+en) | **200** (Clerk-absent safe page) |

### Nginx (`:8088`, upstream patched to `127.0.0.1:8081` for host-net only)

| ID | Path | Result |
|----|------|--------|
| N1 | `/nginx-health` | **200** `ok` |
| N2–N4 | `/` `/market/` `/admin/` | **200** (BANCO titles) |
| N5–N6 | `/dealer-os` `/dealer-os/` | **301 → /market/** |
| N7 | `/admin-os/` | **301 → /admin/** |
| N8 | `/banco-mobile/` | **200** landing HTML (**M7b**) |
| N9–N10 | `/api/readyz` `/api/livez` | **200** pin + money_schema |

Stock image without patch fails host-net: `host not found in upstream "api:8080"` — **compose DNS**; Coolify compose keeps `api:8080`. Container may show Docker HEALTHCHECK unhealthy when listen≠80 — **probe artifact**, not product defect.

### Public control

| ID | URL | Result |
|----|-----|--------|
| P1/P2 | `https://banco.today[/api/readyz]` | **404** Replit “isn't live yet” |

---

## 3. Contrast: stale `agent-proof` vs `w41`

| | agent-proof (11h) | w41 rebuild |
|--|-------------------|-------------|
| money_schema | missing | **ok** |
| gitSha/buildId | null | **6c6dec4 / w.4.1** |
| web surface/wave | `banco-web` / `phase8-soft-launch` | **banco-website / w4.1** |

---

## 4. Artifacts

| File | Content |
|------|---------|
| `/opt/cursor/artifacts/w41-ultra-smoke.jsonl` | raw probe log (first matrix) |
| `/opt/cursor/artifacts/w41-facets-eg-sa.json` | EG/SA facet totals |
| `/opt/cursor/artifacts/w41-docs-ahead-of-eeb87ec.bundle` | docs commits not on origin (push blocked) |

---

## 5. Git / push

| Item | Status |
|------|--------|
| `origin` tag `w.4.1` | **present** @ `6c6dec4` |
| `origin/main` | `eeb87ec` (+ `45-*`) |
| Local ahead | docs `2f4bd50` + `bfd0b31` + this `47-*` |
| Push | **blocked** — cursor[bot] no write on SoT |

---

## 6. FULL CERT checklist (remaining — only OPS)

1. Coolify VPS deploy **tag `w.4.1`** images (same Dockerfiles proven here).  
2. DNS: `banco.today` → Coolify nginx (replace Replit).  
3. Secrets: Clerk pk/sk, S3 keys, Paymob, session, payment encryption.  
4. Migrate profile once.  
5. Public `GET /api/readyz` → JSON with `money_schema=ok` + pin.  
6. Run `37-*` on public URL (auth/device items still need Clerk/EAS).

---

## STOP

Local Coolify stack for `w.4.1` is **ultra-precision certified**.  
Public delivery still **blocked on DNS/VPS**. Reply with live base URL to continue public smoke.
