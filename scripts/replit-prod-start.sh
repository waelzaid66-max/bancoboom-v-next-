#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Replit Production Start
#
# Topology (all traffic enters through nginx on :5000 → external :80):
#
#   nginx :5000
#   ├── /                  → banco-website (Next.js SSR)  :3001
#   ├── /market/           → dealer-os static SPA
#   ├── /admin/            → admin-os static SPA
#   ├── /api/              → api-server                    :8080
#   ├── /l/* /listing/*    → api-server                    :8080  (SEO)
#   ├── /sitemap.xml       → api-server                    :8080
#   ├── /robots.txt        → api-server                    :8080
#   ├── /banco-mobile/     → mobile serve.js               :3000
#   └── /.well-known/      → static (deploy/coolify/well-known/)
#
# Run by: [deployment].run in .replit
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
STATIC_DIR="/tmp/banco-static"
NGINX_CONF="/tmp/banco-nginx.conf"
NGINX_PID_FILE="/tmp/nginx.pid"

log()  { echo "▶ $*"; }
ok()   { echo "✅ $*"; }
warn() { echo "⚠  $*"; }

# ── Guard: DATABASE_URL ───────────────────────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  warn "DATABASE_URL not set — api-server will refuse to start"
fi

# ── 1. Start api-server on :8080 ──────────────────────────────────────────────
log "Starting api-server on :8080..."
PORT=8080 pnpm --filter @workspace/api-server run start &
API_PID=$!

# ── 2. Start banco-website (Next.js) on :3001 ────────────────────────────────
log "Starting banco-website (Next.js) on :3001..."
PORT=3001 pnpm --filter @workspace/banco-website exec -- \
  next start --hostname 0.0.0.0 --port 3001 &
WEB_PID=$!

# ── 3. Start mobile serve.js on :3000 ────────────────────────────────────────
log "Starting banco-mobile server on :3000 (BASE_PATH=/banco-mobile)..."
PORT=3000 BASE_PATH=/banco-mobile \
  node "$WORKSPACE/artifacts/banco-mobile/server/serve.js" &
MOBILE_PID=$!

# ── 4. Assemble static SPA files into a single directory for nginx ─────────────
log "Assembling static files..."
rm -rf "$STATIC_DIR"
mkdir -p "$STATIC_DIR/.well-known"

# Landing → root
if [ -d "$WORKSPACE/artifacts/landing/dist/public" ]; then
  cp -r "$WORKSPACE/artifacts/landing/dist/public/." "$STATIC_DIR/"
  ok "landing → /"
else
  warn "landing dist not found — root will proxy to banco-website"
fi

# Dealer-os → /market/
if [ -d "$WORKSPACE/artifacts/dealer-os/dist/public" ]; then
  mkdir -p "$STATIC_DIR/market"
  cp -r "$WORKSPACE/artifacts/dealer-os/dist/public/." "$STATIC_DIR/market/"
  ok "dealer-os → /market/"
else
  warn "dealer-os dist not found"
fi

# Admin-os → /admin/
if [ -d "$WORKSPACE/artifacts/admin-os/dist/public" ]; then
  mkdir -p "$STATIC_DIR/admin"
  cp -r "$WORKSPACE/artifacts/admin-os/dist/public/." "$STATIC_DIR/admin/"
  ok "admin-os → /admin/"
else
  warn "admin-os dist not found"
fi

# Well-known (Apple AASA + Android assetlinks)
if [ -d "$WORKSPACE/deploy/coolify/well-known" ]; then
  cp -r "$WORKSPACE/deploy/coolify/well-known/." "$STATIC_DIR/.well-known/"
fi

# ── 5. Generate nginx config ──────────────────────────────────────────────────
log "Generating nginx config..."

cat > "$NGINX_CONF" << NGINX
pid        $NGINX_PID_FILE;
error_log  /tmp/nginx-error.log warn;
worker_processes auto;
events { worker_connections 1024; }

http {
  access_log  /tmp/nginx-access.log;
  include     /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile    on;
  tcp_nopush  on;
  gzip        on;
  gzip_comp_level 6;
  gzip_min_length 1024;
  gzip_types  text/plain text/css application/javascript application/json
              image/svg+xml font/woff2;
  client_max_body_size 60m;

  # ── Upstreams ────────────────────────────────────────────────────────────
  upstream banco_api    { server 127.0.0.1:8080; keepalive 16; }
  upstream banco_web    { server 127.0.0.1:3001; keepalive 16; }
  upstream banco_mobile { server 127.0.0.1:3000; keepalive 16; }

  server {
    listen 5000;
    server_name _;
    root $STATIC_DIR;

    # ── Security headers ─────────────────────────────────────────────────
    add_header X-Content-Type-Options  "nosniff"                       always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    # ── Liveness probe ───────────────────────────────────────────────────
    location = /nginx-health {
      access_log off;
      return 200 '{"status":"ok"}\n';
      default_type application/json;
    }

    # ── Apple AASA / Android assetlinks ──────────────────────────────────
    location ^~ /.well-known/ {
      root $STATIC_DIR;
      default_type application/json;
      try_files \$uri =404;
    }

    # ── API ───────────────────────────────────────────────────────────────
    location /api/ {
      proxy_pass         http://banco_api;
      proxy_http_version 1.1;
      proxy_set_header   Host              \$host;
      proxy_set_header   X-Real-IP         \$remote_addr;
      proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto \$scheme;
      proxy_set_header   Connection        "";
      proxy_read_timeout 60s;
      proxy_buffering    off;
    }

    # ── SEO / share links ────────────────────────────────────────────────
    location ^~ /l/ {
      proxy_pass         http://banco_api;
      proxy_http_version 1.1;
      proxy_set_header   Host              \$host;
      proxy_set_header   X-Real-IP         \$remote_addr;
      proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto \$scheme;
      proxy_set_header   Connection        "";
    }
    location ^~ /listing/ {
      proxy_pass         http://banco_api;
      proxy_http_version 1.1;
      proxy_set_header   Host              \$host;
      proxy_set_header   X-Real-IP         \$remote_addr;
      proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto \$scheme;
      proxy_set_header   Connection        "";
    }
    location = /sitemap.xml {
      proxy_pass http://banco_api;
      proxy_http_version 1.1;
      proxy_set_header Host \$host;
    }
    location = /robots.txt {
      proxy_pass http://banco_api;
      proxy_http_version 1.1;
      proxy_set_header Host \$host;
    }

    # ── Mobile (Expo web + QR page) ──────────────────────────────────────
    # Strips /banco-mobile prefix then proxies to serve.js which is also
    # configured with BASE_PATH=/banco-mobile, so it handles the strip itself.
    location /banco-mobile/ {
      proxy_pass         http://banco_mobile/banco-mobile/;
      proxy_http_version 1.1;
      proxy_set_header   Host              \$host;
      proxy_set_header   X-Real-IP         \$remote_addr;
      proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto \$scheme;
      proxy_set_header   X-Forwarded-Host  \$host;
      proxy_set_header   Connection        "";
      proxy_read_timeout 30s;
    }
    location = /banco-mobile {
      return 301 /banco-mobile/;
    }

    # ── Dealer-os (market SPA) ───────────────────────────────────────────
    location /market/assets/ {
      expires 1y;
      add_header Cache-Control "public, immutable";
      try_files \$uri =404;
    }
    location /market/ {
      try_files \$uri \$uri/ /market/index.html;
    }
    location = /market { return 301 /market/; }

    # ── Admin-os SPA ────────────────────────────────────────────────────
    location /admin/assets/ {
      expires 1y;
      add_header Cache-Control "public, immutable";
      try_files \$uri =404;
    }
    location /admin/ {
      try_files \$uri \$uri/ /admin/index.html;
    }
    location = /admin { return 301 /admin/; }

    # ── Legacy path aliases ──────────────────────────────────────────────
    location = /dealer-os  { return 301 /market/; }
    location  /dealer-os/  { return 301 /market/; }
    location = /admin-os   { return 301 /admin/; }
    location  /admin-os/   { return 301 /admin/; }

    # ── Landing static assets (hashed → long cache) ──────────────────────
    location /assets/ {
      expires 1y;
      add_header Cache-Control "public, immutable";
      try_files \$uri =404;
    }

    # ── Root: banco-website (Next.js consumer marketplace) ───────────────
    # Anything not matched above goes to the Next.js SSR app.
    # Next.js rewrites (/api/*) are bypassed — nginx handles /api/ directly.
    location / {
      proxy_pass         http://banco_web;
      proxy_http_version 1.1;
      proxy_set_header   Host              \$host;
      proxy_set_header   X-Real-IP         \$remote_addr;
      proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto \$scheme;
      proxy_set_header   Upgrade           \$http_upgrade;
      proxy_set_header   Connection        \$connection_upgrade;
      proxy_read_timeout 60s;
      proxy_buffering    off;
    }
  }

  # WebSocket upgrade map (for Next.js HMR in dev, harmless in prod)
  map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ""      close;
  }
}
NGINX

# ── 6. Wait for services to bind ─────────────────────────────────────────────
log "Waiting for services..."
sleep 4

# ── 7. Signal handling ───────────────────────────────────────────────────────
cleanup() {
  echo "Shutting down all services..."
  nginx -c "$NGINX_CONF" -s stop 2>/dev/null || true
  kill "$API_PID" "$WEB_PID" "$MOBILE_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGTERM SIGINT

# ── 8. Start nginx (foreground — this IS the main process) ───────────────────
log "Starting nginx on :5000..."
log "  /             → banco-website (Next.js) :3001"
log "  /market/      → dealer-os SPA"
log "  /admin/       → admin-os SPA"
log "  /api/         → api-server :8080"
log "  /banco-mobile/ → mobile (Expo web / QR) :3000"

nginx -c "$NGINX_CONF" -g "daemon off;"

# nginx exited — tear down everything
warn "nginx exited unexpectedly"
kill "$API_PID" "$WEB_PID" "$MOBILE_PID" 2>/dev/null || true
exit 1
