#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Dev Proxy — unified nginx gateway for local development (port 5000 → port 80)
#
# Mirrors the production topology so you can test all surfaces through one URL:
#   http://localhost:5000/            → banco-website dev  :5001
#   http://localhost:5000/market/     → dealer-os dev      :5002
#   http://localhost:5000/admin/      → admin-os dev       :5003
#   http://localhost:5000/api/        → api-server         :8080
#   http://localhost:5000/banco-mobile/ → mobile serve.js  :3000
#
# Prerequisites: start each artifact workflow first (or let them auto-start).
# Run via the "Dev Proxy" workflow in .replit.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NGINX_CONF="/tmp/banco-dev-nginx.conf"
NGINX_PID_FILE="/tmp/nginx-dev.pid"

cat > "$NGINX_CONF" << 'NGINX'
pid        /tmp/nginx-dev.pid;
error_log  /tmp/nginx-dev-error.log warn;
worker_processes 1;
events { worker_connections 256; }

http {
  access_log  /tmp/nginx-dev-access.log;
  include     /etc/nginx/mime.types;
  default_type application/octet-stream;
  client_max_body_size 60m;

  upstream dev_api    { server 127.0.0.1:8080; keepalive 8; }
  upstream dev_web    { server 127.0.0.1:5001; keepalive 8; }
  upstream dev_market { server 127.0.0.1:5002; keepalive 8; }
  upstream dev_admin  { server 127.0.0.1:5003; keepalive 8; }
  upstream dev_mobile { server 127.0.0.1:3000; keepalive 8; }

  map $http_upgrade $connection_upgrade {
    default upgrade;
    ""      close;
  }

  server {
    listen 5000;
    server_name _;

    location = /nginx-health { access_log off; return 200 "ok\n"; }

    location /api/ {
      proxy_pass         http://dev_api;
      proxy_http_version 1.1;
      proxy_set_header   Host             $host;
      proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto $scheme;
      proxy_set_header   Connection       "";
      proxy_buffering    off;
    }
    location ^~ /l/ {
      proxy_pass         http://dev_api;
      proxy_http_version 1.1;
      proxy_set_header   Host             $host;
      proxy_set_header   Connection       "";
    }
    location ^~ /listing/ {
      proxy_pass         http://dev_api;
      proxy_http_version 1.1;
      proxy_set_header   Host             $host;
      proxy_set_header   Connection       "";
    }

    location /banco-mobile/ {
      proxy_pass         http://dev_mobile/banco-mobile/;
      proxy_http_version 1.1;
      proxy_set_header   Host             $host;
      proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Host $host;
      proxy_set_header   Connection       "";
    }
    location = /banco-mobile { return 301 /banco-mobile/; }

    location /market/ {
      proxy_pass         http://dev_market/;
      proxy_http_version 1.1;
      proxy_set_header   Host             $host;
      proxy_set_header   Upgrade          $http_upgrade;
      proxy_set_header   Connection       $connection_upgrade;
      proxy_read_timeout 3600s;
    }
    location = /market { return 301 /market/; }

    location /admin/ {
      proxy_pass         http://dev_admin/;
      proxy_http_version 1.1;
      proxy_set_header   Host             $host;
      proxy_set_header   Upgrade          $http_upgrade;
      proxy_set_header   Connection       $connection_upgrade;
      proxy_read_timeout 3600s;
    }
    location = /admin { return 301 /admin/; }

    # Legacy aliases
    location = /dealer-os  { return 301 /market/; }
    location  /dealer-os/  { return 301 /market/; }
    location = /admin-os   { return 301 /admin/; }
    location  /admin-os/   { return 301 /admin/; }

    location / {
      proxy_pass         http://dev_web;
      proxy_http_version 1.1;
      proxy_set_header   Host             $host;
      proxy_set_header   Upgrade          $http_upgrade;
      proxy_set_header   Connection       $connection_upgrade;
      proxy_read_timeout 3600s;
      proxy_buffering    off;
    }
  }
}
NGINX

echo "▶ Dev proxy starting on :5000"
echo "  /              → banco-website dev :5001"
echo "  /market/       → dealer-os dev     :5002"
echo "  /admin/        → admin-os dev      :5003"
echo "  /api/          → api-server        :8080"
echo "  /banco-mobile/ → mobile serve.js   :3000"

exec nginx -c "$NGINX_CONF" -g "daemon off;"
