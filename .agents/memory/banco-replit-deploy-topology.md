---
name: BANCO Replit deployment topology
description: How all 5 surfaces are routed in production (nginx) and dev; port assignments; Expo web build instructions.
---

## Production deployment (Replit Deploy button)

**Entry: nginx on :5000 (→ external :80)**

| Path | Backend | Port |
|------|---------|------|
| `/` (catch-all) | banco-website Next.js SSR | :3001 |
| `/market/` | dealer-os static SPA (assembled into /tmp/banco-static/market/) | static |
| `/admin/` | admin-os static SPA (assembled into /tmp/banco-static/admin/) | static |
| `/api/` | api-server | :8080 |
| `/l/*` `/listing/*` | api-server (SEO) | :8080 |
| `/banco-mobile/` | mobile serve.js (Expo web or QR) | :3000 |
| `/.well-known/` | static (deploy/coolify/well-known/) | static |

**Build script**: `scripts/replit-prod-build.sh`
- Builds: libs → api-server → banco-website (NEXT_STANDALONE=true) → landing → dealer-os (BASE_PATH=/market/) → admin-os (BASE_PATH=/admin/) → Expo web export

**Start script**: `scripts/replit-prod-start.sh`
- Copies SPAs into `/tmp/banco-static/` (single dir for nginx)
- Generates nginx config at `/tmp/banco-nginx.conf`
- Starts api-server:8080, banco-website:3001, mobile:3000, then nginx:5000 (foreground)

## Dev workflows (port per service)

| Workflow | Port | External |
|----------|------|---------|
| Web App (banco-website dev) | :5000 | :80 (main preview) |
| artifacts/api-server: API Server | :8080 | :8080 |
| Mobile Serve (serve.js) | :3000 | :6800 |
| Dealer OS Dev | :5002 | :5173 |
| Admin OS Dev | :5003 | :6000 |

## Expo web export (mobile browser surface)

**Why:** serve.js at /banco-mobile/ serves real Expo web app to browsers when `static-build/web/index.html` exists; falls back to Expo Go QR landing page otherwise.

**Build command:**
```bash
pnpm --filter @workspace/banco-mobile run build:web
# OR via script:
bash artifacts/banco-mobile/scripts/build-web.sh
```

**How to apply:** Run once before deploying or whenever mobile app changes. The production build script does this automatically (may fail gracefully = QR page shown instead).

**Why:** Expo web export is slow (~5-10 min) and requires Metro. Only runs at build time, not in serve.js startup.

## banco-website PORT

start script now uses `next start --hostname 0.0.0.0` (no -p flag) so PORT env var controls the port. In production: `PORT=3001`. In dev: `--port 5000` is passed explicitly via workflow command.
