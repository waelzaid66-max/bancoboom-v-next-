// Scale infrastructure guards — prove multi-market / high-user readiness is wired.
// Run: node --test tests/scale-readiness.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

test("DB pool is sized for multi-replica Coolify (env-driven, not unbounded)", () => {
  const src = fs.readFileSync(path.join(ROOT, "lib/db/src/index.ts"), "utf8");
  assert.match(src, /DB_POOL_MAX/);
  assert.match(src, /max:/);
  assert.match(src, /idleTimeoutMillis/);
  assert.match(src, /connectionTimeoutMillis/);
});

test("boot creates market_country expression index for 21-market filters", () => {
  const src = fs.readFileSync(
    path.join(ROOT, "artifacts/api-server/src/lib/bootstrap.ts"),
    "utf8",
  );
  assert.match(src, /idx_listing_attrs_market_country/);
  assert.match(
    src,
    /COALESCE\(specs->>'market_country',\s*'EG'\)/,
    "index expression must match SearchService COALESCE contract",
  );
});

test("boot creates geo + feed scale indexes", () => {
  const src = fs.readFileSync(
    path.join(ROOT, "artifacts/api-server/src/lib/bootstrap.ts"),
    "utf8",
  );
  assert.match(src, /idx_listings_geo/);
  assert.match(src, /idx_listings_status_category_created/);
  assert.match(src, /idx_import_orders_stage_created/);
});

test("SearchService market filter uses the same COALESCE contract as the index", () => {
  const src = fs.readFileSync(
    path.join(ROOT, "artifacts/api-server/src/services/SearchService.ts"),
    "utf8",
  );
  assert.match(
    src,
    /COALESCE\(\$\{listingAttributes\.specs\}->>'market_country', 'EG'\)/,
  );
});

test("API trusts proxy once (Coolify/nginx) so rate limits see real client IP", () => {
  const src = fs.readFileSync(
    path.join(ROOT, "artifacts/api-server/src/app.ts"),
    "utf8",
  );
  assert.match(src, /trust proxy/);
});

test("Coolify compose exposes api + web + website + nginx with healthchecks", () => {
  const compose = fs.readFileSync(
    path.join(ROOT, "docker-compose.coolify.yml"),
    "utf8",
  );
  for (const svc of ["postgres", "api", "banco-web", "banco-website", "web"]) {
    assert.match(compose, new RegExp(`^\\s+${svc}:`, "m"), `missing service ${svc}`);
  }
  assert.match(compose, /healthcheck:/);
  assert.match(compose, /healthz/);
});

test("Import-order lifecycle is closed (create + stage + cancel)", () => {
  const routes = fs.readFileSync(
    path.join(ROOT, "artifacts/api-server/src/routes/v1/import-orders.ts"),
    "utf8",
  );
  assert.match(routes, /updateImportOrderStageHandler/);
  assert.match(routes, /cancelImportOrderHandler/);
  assert.match(routes, /\/:id\/stage/);
  assert.match(routes, /\/:id\/cancel/);
});

test("Auth surface includes Google + Apple + Facebook + MFA", () => {
  const profile = fs.readFileSync(
    path.join(ROOT, "artifacts/banco-mobile/app/(tabs)/profile.tsx"),
    "utf8",
  );
  assert.match(profile, /oauth_facebook/);
  assert.match(profile, /oauth_google/);
  assert.match(profile, /oauth_apple/);
  assert.match(profile, /needs_second_factor|mfa\./i);
});
