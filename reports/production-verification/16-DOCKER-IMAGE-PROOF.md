# Docker / Coolify image proof — agent environment

**Date:** 2026-07-29  
**Branch:** `cursor/production-hardening-5cf0`  
**Host notes:** Nested container; dockerd started with static binary + `vfs` storage; builds used `--network=host` for registry DNS; BuildKit via `docker-buildx` v0.21.2.

## Images built (PASS)

| Image | Dockerfile | Tag | Size | Evidence |
|-------|------------|-----|------|----------|
| API root (EB/GCP) | `Dockerfile` | `banco-api:agent-proof` | 638MB | Tagged; container → healthz/readyz **200** |
| API Coolify | `deploy/coolify/Dockerfile.api` | `banco-api-coolify:agent-proof` | 667MB | Tagged |
| Consumer web Coolify | `deploy/coolify/Dockerfile.banco-web` | `banco-web:agent-proof` | 297MB | Tagged; container smoke **all PASS** |
| Marketing website Coolify | `deploy/coolify/Dockerfile.banco-website` | `banco-website:agent-proof` | 297MB | Tagged |
| Vite SPA nginx Coolify | `deploy/coolify/Dockerfile.web` | `banco-web-static:agent-proof` | 52.1MB | Tagged (landing+dealer+admin) |

## Runtime probes (API + consumer web)

```text
# banco-api:agent-proof --network=host
GET /api/healthz → {"status":"ok"} HTTP 200
GET /api/readyz  → {"status":"ok","checks":{"database":"ok"}} HTTP 200

# banco-web:agent-proof --network=host :3000
BANCO_WEB_URL=http://127.0.0.1:3000 node scripts/website-staging-smoke.mjs
→ all routes PASS (incl. sign-in ar/en 200)
```

## Also verified (non-Docker)

| Gate | Result |
|------|--------|
| `website-ci-local.mjs` | 11/11 PASS |
| Mobile `tests/*.mjs` | 136/136 PASS |
| API vitest | 346 passed / 3 skipped |
| Chain / confidence | 58/58 · 14/14 |

## Environment caveats (not product defects)

1. `--bridge=none` → `-p` publish ineffective; host network used for probes.
2. Without `--network=host`, nested DNS failed (`EAI_AGAIN registry.npmjs.org`).
3. Coolify Dockerfiles require BuildKit (`docker-buildx`).

## Still not claimed

- Coolify live VPS deploy / SSL / domain cutover  
- EAS Android/iOS store builds  
- Live Clerk OAuth with production tenant keys  
- Paymob webhook + push on device  
- Load test at multi-million scale  
