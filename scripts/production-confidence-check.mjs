#!/usr/bin/env node
/**
 * Local production-confidence gate â€” runs checks that do NOT need staging secrets.
 *
 * Usage (from repo root):
 *   node scripts/production-confidence-check.mjs
 *   node scripts/production-confidence-check.mjs --skip-typecheck
 *
 * Exit codes:
 *   0 â€” all executed checks passed
 *   1 â€” one or more checks failed
 *   2 â€” invalid invocation / missing repo layout
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MOBILE = path.join(ROOT, "artifacts", "banco-mobile");
const OPENAPI = path.join(ROOT, "lib", "api-spec", "openapi.yaml");

const skipTypecheck = process.argv.includes("--skip-typecheck");
const results = [];

function pass(name, detail = "ok") {
  results.push({ name, ok: true, detail });
  console.log(`[PASS] ${name}${detail !== "ok" ? `: ${detail}` : ""}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`[FAIL] ${name}: ${detail}`);
}

function run(cmd, args, cwd = ROOT) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    ok: r.status === 0,
    status: r.status ?? 1,
    stdout: (r.stdout ?? "").trim(),
    stderr: (r.stderr ?? "").trim(),
  };
}

function gitGrepFileNames(pattern, pathspecs = []) {
  const r = spawnSync(
    "git",
    ["grep", "-I", "-l", "-E", pattern, "--", ...pathspecs],
    {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (r.status === 1) return { ok: true, files: [] };
  if (r.status === 0) {
    return {
      ok: true,
      files: (r.stdout ?? "").trim().split("\n").filter(Boolean),
    };
  }
  return {
    ok: false,
    files: [],
    error: (r.stderr ?? `git grep exited ${r.status ?? 1}`).trim(),
  };
}

function checkTrackedSourceHygiene() {
  const secrets = gitGrepFileNames("sk_(test|live)_[-[:alnum:]_$]{20,}");
  if (!secrets.ok) {
    fail("tracked source hygiene", `secret scan failed: ${secrets.error}`);
    return;
  }
  if (secrets.files.length) {
    fail(
      "tracked source hygiene",
      `high-entropy Clerk secret found in: ${secrets.files.join(", ")}`,
    );
    return;
  }

  const replitConfig = fs.readFileSync(path.join(ROOT, ".replit"), "utf8");
  if (
    /^\s*(?:CLERK|NEXT_PUBLIC_CLERK|VITE_CLERK|EXPO_PUBLIC_CLERK)_(?:SECRET|PUBLISHABLE)_KEY\s*=/m.test(
      replitConfig,
    )
  ) {
    fail(
      "tracked source hygiene",
      "Clerk keys must be injected together by the environment, not pinned in .replit",
    );
    return;
  }

  const sourcePathspecs = [
    "*.ts",
    "*.tsx",
    "*.js",
    "*.jsx",
    "*.mjs",
    "*.cjs",
    "*.json",
    "*.yaml",
    "*.yml",
    "*.toml",
    "*.sh",
    "*.ps1",
  ];
  const conflicts = gitGrepFileNames(
    "^(<<<<<<< .+|=======|>>>>>>> .+)$",
    sourcePathspecs,
  );
  if (!conflicts.ok) {
    fail("tracked source hygiene", `conflict-marker scan failed: ${conflicts.error}`);
    return;
  }
  if (conflicts.files.length) {
    fail(
      "tracked source hygiene",
      `unresolved merge markers found in: ${conflicts.files.join(", ")}`,
    );
    return;
  }

  pass(
    "tracked source hygiene",
    "no pinned Clerk keys or unresolved merge markers",
  );
}

function readJson(relPath) {
  const full = path.join(ROOT, relPath);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function checkRepoLayout() {
  for (const p of ["pnpm-workspace.yaml", "artifacts/banco-mobile/package.json", "artifacts/banco-mobile/eas.json"]) {
    if (!fs.existsSync(path.join(ROOT, p))) {
      fail("repo layout", `missing ${p}`);
      return false;
    }
  }
  pass("repo layout");
  return true;
}

function checkEasConfig() {
  try {
    const eas = readJson("artifacts/banco-mobile/eas.json");
    if (!eas.build?.preview || !eas.build?.production) {
      fail("eas.json profiles", "preview and production profiles required");
      return;
    }
    if (!eas.cli?.appVersionSource) {
      fail("eas.json cli", "appVersionSource should be set");
      return;
    }
    pass("eas.json profiles", `preview + production (${eas.cli.appVersionSource})`);
  } catch (e) {
    fail("eas.json parse", e instanceof Error ? e.message : String(e));
  }
}

function checkExpoConfig() {
  const appJson = path.join(MOBILE, "app.json");
  const appConfig = path.join(MOBILE, "app.config.ts");
  const metro = path.join(MOBILE, "metro.config.js");
  try {
    const json = JSON.parse(fs.readFileSync(appJson, "utf8"));
    if (!json.expo?.extra?.eas?.projectId) {
      fail("app.json eas projectId", "extra.eas.projectId missing");
    } else {
      pass("app.json eas projectId");
    }
    const androidPkg = json.expo?.android?.package;
    const iosBundle = json.expo?.ios?.bundleIdentifier;
    const scheme = json.expo?.scheme;
    const name = json.expo?.name;
    if (!androidPkg || !iosBundle) {
      fail("app identifiers", "android.package / ios.bundleIdentifier required");
    } else if (
      androidPkg !== "com.bancooom.app" ||
      iosBundle !== "com.bancooom.app" ||
      scheme !== "bancooom" ||
      name !== "BANCO"
    ) {
      fail(
        "app identifiers",
        `canonical SoT identity required (BANCO / bancooom / com.bancooom.app); got name=${name} scheme=${scheme} android=${androidPkg} ios=${iosBundle}`,
      );
    } else {
      pass("app identifiers", "BANCO / bancooom / com.bancooom.app");
    }
    if (!fs.existsSync(appConfig)) {
      fail("app.config.ts", "missing â€” expo-router origin should be dynamic");
    } else {
      pass("app.config.ts present");
    }
    if (!fs.existsSync(metro)) {
      fail("metro.config.js", "missing");
    } else {
      const metroSrc = fs.readFileSync(metro, "utf8");
      if (!metroSrc.includes("watchFolders")) {
        fail("metro monorepo", "watchFolders not configured");
      } else if (!metroSrc.includes("blockList") || !metroSrc.includes(".old-")) {
        fail("metro monorepo", "Replit .local/skills/.old-* exclusion missing");
      } else {
        pass("metro monorepo", "workspace roots + Replit ephemeral-path exclusion");
      }
    }
  } catch (e) {
    fail("expo config", e instanceof Error ? e.message : String(e));
  }
}

function checkExpoSdkAlignment() {
  try {
    const mobile = readJson("artifacts/banco-mobile/package.json");
    const expoMobile =
      mobile.devDependencies?.expo ?? mobile.dependencies?.expo ?? "";
    const root = readJson("package.json");
    const expoRoot = root.dependencies?.expo ?? root.devDependencies?.expo ?? "";
    const mobileMajor = String(expoMobile).match(/~?(\d+)/)?.[1];
    const rootMajor = String(expoRoot).match(/~?(\d+)/)?.[1];
    if (mobileMajor && rootMajor && mobileMajor !== rootMajor) {
      fail("expo SDK alignment", `mobile SDK ${mobileMajor} vs root ${rootMajor}`);
      return;
    }
    pass("expo SDK alignment", mobileMajor ? `SDK ${mobileMajor}` : "mobile expo pinned");
  } catch (e) {
    fail("expo SDK alignment", e instanceof Error ? e.message : String(e));
  }
}

function checkReplitWorkflowSafety() {
  const replitPath = path.join(ROOT, ".replit");
  const source = fs.readFileSync(replitPath, "utf8");
  const names = [...source.matchAll(/^name = "([^"]+)"$/gm)].map(
    (match) => match[1],
  );
  const duplicates = [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
  if (duplicates.length) {
    fail("Replit workflows", `duplicate workflow names: ${duplicates.join(", ")}`);
    return;
  }

  const freshServe =
    'args = "pnpm --filter @workspace/banco-mobile run build:web && ' +
    'PORT=3000 BASE_PATH=/banco-mobile node artifacts/banco-mobile/server/serve.js"';
  const buildOnly =
    'args = "pnpm --filter @workspace/banco-mobile run build:web"';
  const serveInvocations =
    source.match(/node artifacts\/banco-mobile\/server\/serve\.js/g) ?? [];
  if (!source.includes(freshServe) || !source.includes(buildOnly)) {
    fail(
      "Replit workflows",
      "Mobile Serve must build fresh; Mobile Web Build must remain build-only",
    );
    return;
  }
  if (serveInvocations.length !== 1) {
    fail(
      "Replit workflows",
      `expected one mobile serve invocation, found ${serveInvocations.length}`,
    );
    return;
  }

  pass("Replit workflows", "unique names; fresh mobile build then one server");
}

function checkWorkspaceRefs() {
  try {
    const mobile = readJson("artifacts/banco-mobile/package.json");
    const deps = { ...mobile.dependencies, ...mobile.devDependencies };
    for (const [name, ver] of Object.entries(deps)) {
      if (String(ver).startsWith("workspace:")) {
        const pkgPath = path.join(ROOT, "lib", name.replace("@workspace/", ""), "package.json");
        const alt = path.join(ROOT, "artifacts", name.replace("@workspace/", ""), "package.json");
        if (!fs.existsSync(pkgPath) && !fs.existsSync(alt)) {
          fail("workspace ref", `${name} â†’ ${ver} (package not found)`);
          return;
        }
      }
    }
    pass("workspace refs");
  } catch (e) {
    fail("workspace refs", e instanceof Error ? e.message : String(e));
  }
}

function checkPackageManagerContract() {
  try {
    const packageManager = readJson("package.json").packageManager;
    const expectedVersion = String(packageManager).match(/^pnpm@(.+)$/)?.[1];
    if (!expectedVersion) {
      fail("package manager contract", "package.json must pin pnpm@<exact-version>");
      return;
    }

    const version = run("pnpm", ["--version"], ROOT);
    if (!version.ok) {
      fail("package manager contract", version.stderr || version.stdout);
      return;
    }
    if (version.stdout !== expectedVersion) {
      fail(
        "package manager contract",
        `expected pnpm ${expectedVersion}; received ${version.stdout}`,
      );
      return;
    }
    pass("package manager contract", `pnpm ${expectedVersion}`);
  } catch (error) {
    fail(
      "package manager contract",
      error instanceof Error ? error.message : String(error),
    );
  }
}

function checkDependencyPeerPolicy() {
  const peerCheck = run("pnpm", ["peers", "check"], ROOT);
  if (!peerCheck.ok) {
    fail(
      "dependency peer policy",
      (peerCheck.stderr || peerCheck.stdout || `exit ${peerCheck.status}`)
        .split("\n")
        .slice(-20)
        .join(" "),
    );
    return;
  }

  const sourceRoots = ["artifacts", "lib", "scripts"];
  const sourceExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
  const forbiddenImport = /(?:from\s+|require\s*\(|import\s*\()\s*["'](?:@solana\/|bs58["'])/;
  const violations = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["dist", "node_modules", ".next"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (sourceExtensions.has(path.extname(entry.name))) {
        const source = fs.readFileSync(full, "utf8");
        if (forbiddenImport.test(source)) violations.push(path.relative(ROOT, full));
      }
    }
  }

  for (const rel of sourceRoots) walk(path.join(ROOT, rel));
  if (violations.length) {
    fail(
      "dependency peer policy",
      `Solana/bs58 became a direct product dependency; review optional-peer policy: ${violations.join(", ")}`,
    );
    return;
  }

  pass("dependency peer policy", "pnpm peers check clean; no direct Solana/bs58 product imports");
}

function checkGcpDockerConfig() {
  const r = run("node", ["scripts/verify-gcp-docker-build-config.mjs"], ROOT);
  if (r.ok) pass("gcp docker/cloudbuild config");
  else fail("gcp docker/cloudbuild config", (r.stderr || r.stdout).split("\n").slice(-6).join(" "));
}

function checkOpenApi() {
  if (!fs.existsSync(OPENAPI)) {
    fail("openapi.yaml", "missing");
    return;
  }
  const text = fs.readFileSync(OPENAPI, "utf8");
  if (!text.includes("openapi:")) {
    fail("openapi.yaml", "missing openapi: header");
    return;
  }
  if (!text.includes("/v1/")) {
    fail("openapi.yaml", "no /v1/ paths found");
    return;
  }
  const requiredPaths = [
    "/v1/uploads/objects/{path}",
    "/v1/import-orders/{id}/stage",
    "/v1/import-orders/{id}/cancel",
    "operationId: apiRootLiveness",
  ];
  const missing = requiredPaths.filter((p) => !text.includes(p));
  if (missing.length) {
    fail("openapi.yaml route parity", `missing Express-live paths: ${missing.join(", ")}`);
    return;
  }
  pass("openapi.yaml structure", "includes upload objects + import-order stage/cancel + GET /api");
}

function checkOpenApiCodegenFreshness() {
  const openapi = path.join(ROOT, "lib/api-spec/openapi.yaml");
  const clientApi = path.join(ROOT, "lib/api-client-react/src/generated/api.ts");
  const zodApi = path.join(ROOT, "lib/api-zod/src/generated/api.ts");
  if (!fs.existsSync(openapi) || !fs.existsSync(clientApi) || !fs.existsSync(zodApi)) {
    fail("openapi codegen freshness", "openapi or generated client/zod missing");
    return;
  }
  const spec = fs.readFileSync(openapi, "utf8");
  const client = fs.readFileSync(clientApi, "utf8");
  const zod = fs.readFileSync(zodApi, "utf8");
  const ids = [...spec.matchAll(/^\s*operationId:\s*([A-Za-z0-9_]+)\s*$/gm)].map((m) => m[1]);
  if (ids.length < 50) {
    fail("openapi codegen freshness", `too few operationIds parsed (${ids.length})`);
    return;
  }
  const missingClient = ids.filter((id) => !client.includes(id));
  // Orval zod schemas are PascalCase(operationId) + Response/Params/Body…
  const toPascal = (id) => id.charAt(0).toUpperCase() + id.slice(1);
  const missingZod = ids.filter((id) => !zod.includes(toPascal(id)));
  if (missingClient.length || missingZod.length) {
    fail(
      "openapi codegen freshness",
      `stale generated packages — run: pnpm --filter @workspace/api-spec run codegen` +
        (missingClient.length ? `; client missing: ${missingClient.slice(0, 8).join(", ")}` : "") +
        (missingZod.length ? `; zod missing: ${missingZod.slice(0, 8).join(", ")}` : ""),
    );
    return;
  }
  pass("openapi codegen freshness", `${ids.length} operationIds present in api-client-react + api-zod`);
}

function checkCoolifyDocsApex() {
  const deploy = path.join(ROOT, "docs/DEPLOY_COOLIFY.md");
  const now = path.join(ROOT, "COOLIFY_DEPLOY_NOW.md");
  if (!fs.existsSync(deploy) || !fs.existsSync(now)) {
    fail("coolify apex docs", "DEPLOY_COOLIFY.md or COOLIFY_DEPLOY_NOW.md missing");
    return;
  }
  const deployText = fs.readFileSync(deploy, "utf8");
  const nowText = fs.readFileSync(now, "utf8");
  // Forbid apex (bare yourdomain.com) → banco-website. marketing.yourdomain.com is OK.
  if (/(?:^|[^.\w])yourdomain\.com\s+→\s+banco-website/.test(deployText)) {
    fail(
      "coolify apex docs",
      "DEPLOY_COOLIFY.md must not map apex yourdomain.com → banco-website (use web:80)",
    );
    return;
  }
  if (!/→\s+web:80/.test(deployText) && !/service \*\*`web`\*\* port \*\*`80`\*\*/.test(deployText)) {
    fail("coolify apex docs", "DEPLOY_COOLIFY.md must recommend apex → web:80");
    return;
  }
  if (!/`web`/.test(nowText) || !(/port \*\*`?80`?\*\*/.test(nowText) || /:80/.test(nowText))) {
    fail("coolify apex docs", "COOLIFY_DEPLOY_NOW.md must keep apex → web:80 guidance");
    return;
  }
  pass("coolify apex docs", "apex → web:80; no apex→banco-website diagram");
}

function checkCoolifyProductionLocks() {
  const compose = path.join(ROOT, "docker-compose.coolify.yml");
  const seo = path.join(ROOT, "artifacts/api-server/src/seoRoutes.ts");
  const siteEnv = path.join(ROOT, "artifacts/banco-website/lib/site-env.ts");
  const appTs = path.join(ROOT, "artifacts/api-server/src/app.ts");
  if (!fs.existsSync(compose) || !fs.existsSync(seo) || !fs.existsSync(siteEnv) || !fs.existsSync(appTs)) {
    fail("coolify production locks", "compose/seo/site-env/app.ts missing");
    return;
  }
  const composeText = fs.readFileSync(compose, "utf8");
  const seoText = fs.readFileSync(seo, "utf8");
  const siteText = fs.readFileSync(siteEnv, "utf8");
  const appText = fs.readFileSync(appTs, "utf8");

  for (const needle of [
    "OBJECT_STORAGE_PROVIDER:?OBJECT_STORAGE_PROVIDER is required",
    "profiles: [\"legacy-banco-web\"]",
    "TRUST_PROXY_HOPS",
    "VITE_WEB_URL",
    "BANCO_WEBSITE_URL:?BANCO_WEBSITE_URL is required",
    "VITE_CLERK_PUBLISHABLE_KEY:?VITE_CLERK_PUBLISHABLE_KEY is required",
  ]) {
    if (!composeText.includes(needle)) {
      fail("coolify production locks", `docker-compose.coolify.yml missing ${needle}`);
      return;
    }
  }
  if (!/DEEP_LINK_SCHEME\s*=\s*"bancooom"/.test(seoText)) {
    fail("coolify production locks", 'seoRoutes DEEP_LINK_SCHEME must be "bancooom"');
    return;
  }
  if (!siteText.includes('sameOriginSurfacePath("/market")') || !siteText.includes('sameOriginSurfacePath("/admin")')) {
    fail("coolify production locks", "banco-website site-env defaults must be /market and /admin");
    return;
  }
  if (!appText.includes("TRUST_PROXY_HOPS")) {
    fail("coolify production locks", "api app.ts must honor TRUST_PROXY_HOPS");
    return;
  }
  pass(
    "coolify production locks",
    "S3 required · legacy banco-web profile · SEO scheme bancooom · /market|/admin · trust hops",
  );
}

function checkMigrationAuthority() {
  const ciFiles = [
    ".github/workflows/ci.yml",
    ".github/workflows/deploy.yml",
  ];
  const runtimeFiles = [
    "docker-compose.coolify.yml",
    "docker-compose.prod.yml",
    "deploy/aws/scripts/db-migrate.sh",
    "scripts/post-merge.sh",
    "scripts/run-api-tests-local.mjs",
  ];

  for (const relPath of [...ciFiles, ...runtimeFiles]) {
    const fullPath = path.join(ROOT, relPath);
    if (!fs.existsSync(fullPath)) {
      fail("database migration authority", `missing ${relPath}`);
      return;
    }
    const executableLines = fs
      .readFileSync(fullPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => !line.trimStart().startsWith("#"));
    const executableSource = executableLines.join("\n");
    const executes = (scriptName) =>
      new RegExp(`\\brun\\s+${scriptName}\\b`).test(executableSource) ||
      new RegExp(`["']run["']\\s*,\\s*["']${scriptName}["']`).test(
        executableSource,
      );
    if (executes("push-force")) {
      fail(
        "database migration authority",
        `${relPath} executes push-force instead of committed migrations`,
      );
      return;
    }
    if (!executes("migrate")) {
      fail(
        "database migration authority",
        `${relPath} does not execute the committed migration runner`,
      );
      return;
    }
  }

  for (const relPath of ciFiles) {
    const source = fs.readFileSync(path.join(ROOT, relPath), "utf8");
    if (!/\brun\s+check\b/.test(source)) {
      fail(
        "database migration authority",
        `${relPath} does not validate migration history before connecting`,
      );
      return;
    }
    if ((source.match(/\brun\s+migrate\b/g) ?? []).length < 2) {
      fail(
        "database migration authority",
        `${relPath} must replay migrate to prove idempotency on PostgreSQL 16`,
      );
      return;
    }
  }

  pass(
    "database migration authority",
    "CI/deploy use check + committed migrate replay; push-force is non-authoritative",
  );
}

function checkLandingDomainHops() {
  const landing = path.join(ROOT, "artifacts/landing/src/App.tsx");
  if (!fs.existsSync(landing)) {
    fail("landing DomainRouter", "artifacts/landing/src/App.tsx missing");
    return;
  }
  const src = fs.readFileSync(landing, "utf8");
  if (/banco\.today\/banco-mobile\//.test(src)) {
    fail(
      "landing DomainRouter",
      "must not hop to /banco-mobile/ — Coolify web has no such artifact (Expo=EAS)",
    );
    return;
  }
  if (!/banco\.today\/market\//.test(src)) {
    fail("landing DomainRouter", "banco.deals hop must target /market/ Coolify map");
    return;
  }
  if (!/VITE_WEB_URL/.test(src)) {
    fail("landing DomainRouter", "banco.autos hop must prefer VITE_WEB_URL when absolute HTTPS");
    return;
  }
  pass("landing DomainRouter", "deals→/market/ · autos→VITE_WEB_URL|apex (no /banco-mobile/)");
}

/** Anti-93b650b pollution: touch-trap menus + opaque upload 500 for missing storage. */
function checkReplitWipePollution() {
  const profile = path.join(MOBILE, "app", "(tabs)", "profile.tsx");
  const promote = path.join(MOBILE, "components", "PromoteButton.tsx");
  const home = path.join(MOBILE, "app", "(tabs)", "index.tsx");
  const upload = path.join(ROOT, "artifacts", "api-server", "src", "controllers", "uploadController.ts");

  for (const [label, file] of [
    ["profile.tsx", profile],
    ["PromoteButton.tsx", promote],
    ["index.tsx", home],
  ]) {
    if (!fs.existsSync(file)) {
      fail("anti-wipe menus", `missing ${label}`);
      return;
    }
    const src = fs.readFileSync(file, "utf8");
    if (/onStartShouldSetResponder/.test(src)) {
      fail("anti-wipe menus", `${label} still contains onStartShouldSetResponder (93b650b pollution)`);
      return;
    }
  }

  const profileSrc = fs.readFileSync(profile, "utf8");
  if (!/maxHeight:\s*["']85%["']/.test(profileSrc)) {
    fail("anti-wipe menus", "profile menuSheet missing maxHeight 85%");
    return;
  }

  if (!fs.existsSync(upload)) {
    fail("anti-wipe upload 503", "uploadController.ts missing");
    return;
  }
  const uploadSrc = fs.readFileSync(upload, "utf8");
  if (!/Image upload is not available yet — object storage is not configured/.test(uploadSrc)) {
    fail("anti-wipe upload 503", "request-url must map missing storage config to clear 503 (0afef07)");
    return;
  }
  pass("anti-wipe pollution guards", "menus touch-safe + upload 503 restored");
}

function checkWellKnownTemplates() {
  const aasa = path.join(ROOT, "deploy/coolify/well-known/apple-app-site-association");
  const assetlinks = path.join(ROOT, "deploy/coolify/well-known/assetlinks.json");
  const nginx = path.join(ROOT, "deploy/coolify/nginx.conf");
  const dockerfile = path.join(ROOT, "deploy/coolify/Dockerfile.web");
  if (!fs.existsSync(aasa) || !fs.existsSync(assetlinks)) {
    fail("well-known templates", "AASA or assetlinks.json missing under deploy/coolify/well-known/");
    return;
  }
  const aasaText = fs.readFileSync(aasa, "utf8");
  const assetText = fs.readFileSync(assetlinks, "utf8");
  if (aasaText.includes("com.bancoboom.app") || assetText.includes("com.bancoboom.app")) {
    fail("well-known identity", "forbidden sister package com.bancoboom.app present");
    return;
  }
  if (!aasaText.includes("com.bancooom.app")) {
    fail("well-known AASA", "must target com.bancooom.app");
    return;
  }
  if (!assetText.includes("com.bancooom.app")) {
    fail("well-known assetlinks", "must target com.bancooom.app");
    return;
  }
  try {
    const assetJson = JSON.parse(assetText);
    const pkg = assetJson?.[0]?.target?.package_name;
    if (pkg !== "com.bancooom.app") {
      fail("well-known assetlinks JSON", `package_name must be com.bancooom.app (got ${pkg})`);
      return;
    }
  } catch (e) {
    fail("well-known assetlinks JSON", e instanceof Error ? e.message : String(e));
    return;
  }
  try {
    const aasaJson = JSON.parse(aasaText);
    const appId = aasaJson?.applinks?.details?.[0]?.appID ?? "";
    if (!String(appId).endsWith(".com.bancooom.app")) {
      fail("well-known AASA JSON", `appID must end with .com.bancooom.app (got ${appId})`);
      return;
    }
    if (String(appId).includes("bancoboom")) {
      fail("well-known AASA JSON", "forbidden bancoboom in appID");
      return;
    }
  } catch (e) {
    fail("well-known AASA JSON", e instanceof Error ? e.message : String(e));
    return;
  }
  const nginxText = fs.readFileSync(nginx, "utf8");
  const dfText = fs.readFileSync(dockerfile, "utf8");
  if (!nginxText.includes(".well-known") || !nginxText.includes("default_type application/json")) {
    fail("well-known nginx", "nginx.conf must serve /.well-known/ with default_type application/json");
    return;
  }
  // Apex→web SEO must hit the API — never SPA index.html (OG/sitemap blind).
  for (const needle of [
    "location ^~ /l/",
    "location ^~ /listing/",
    "location = /sitemap.xml",
    "location = /robots.txt",
    "$banco_forwarded_proto",
  ]) {
    if (!nginxText.includes(needle)) {
      fail(
        "coolify nginx SEO/proxy",
        `nginx.conf missing ${needle} (required for Coolify single-origin publish)`,
      );
      return;
    }
  }
  if (!dfText.includes("well-known/apple-app-site-association")) {
    fail("well-known Dockerfile.web", "must COPY AASA into the nginx image");
    return;
  }
  if (!dfText.includes("well-known/assetlinks.json")) {
    fail("well-known Dockerfile.web", "must COPY assetlinks.json into the nginx image");
    return;
  }
  // The nginx stage must take these two files from the renderer's output. When
  // it copied them straight from the build context, an unfilled template shipped
  // as a parseable HTTP 200 whose fingerprint field read REPLACE_* — nothing
  // failed anywhere, Apple and Google simply never verified.
  if (!fs.existsSync(path.join(ROOT, "deploy/coolify/well-known/render-well-known.mjs"))) {
    fail("well-known renderer", "deploy/coolify/well-known/render-well-known.mjs is missing");
    return;
  }
  for (const name of ["apple-app-site-association", "assetlinks.json"]) {
    if (!dfText.includes(`COPY --from=builder /well-known/${name}`)) {
      fail(
        "well-known Dockerfile.web",
        `${name} must be copied from the renderer output (/well-known), not from the build context`,
      );
      return;
    }
  }
  if (!dfText.includes("WELL_KNOWN_STRICT")) {
    fail("well-known Dockerfile.web", "WELL_KNOWN_STRICT build arg missing — a store build could not refuse");
    return;
  }
  const placeholdersPresent =
    aasaText.includes("REPLACE_APPLE_TEAM_ID") ||
    assetText.includes("REPLACE_PLAY_APP_SIGNING_SHA256");
  pass(
    "well-known templates",
    placeholdersPresent
      ? "templates carry REPLACE_* (correct — owner-only credentials stay out of Git); " +
        "build with --build-arg APPLE_TEAM_ID/PLAY_APP_SIGNING_SHA256 + WELL_KNOWN_STRICT=1 to verify"
      : "shipped with filled values",
  );
}

function checkMobileRuntimeDeps() {
  try {
    const pkg = readJson("artifacts/banco-mobile/package.json");
    const deps = pkg.dependencies ?? {};
    const devDeps = pkg.devDependencies ?? {};
    const required = ["expo", "react", "react-native", "@clerk/expo", "expo-router"];
    const missing = required.filter((name) => !deps[name]);
    if (missing.length) {
      fail(
        "mobile runtime dependencies",
        `must be in dependencies (not only devDependencies): ${missing.join(", ")}`,
      );
      return;
    }
    if (deps["react-native-maps"] || deps["@types/google.maps"]) {
      fail(
        "mobile unused map deps",
        "maps use Leaflet WebView — react-native-maps / @types/google.maps must not be runtime deps",
      );
      return;
    }
    if (deps["@expo/vector-icons"]) {
      fail(
        "mobile icon dep placement",
        "@expo/vector-icons must be in devDependencies only (SVG registry; icons.test contract)",
      );
      return;
    }
    if (!devDeps["@expo/vector-icons"]) {
      fail(
        "mobile icon dep placement",
        "@expo/vector-icons missing from devDependencies (glyph-map authority for icons.test)",
      );
      return;
    }
    pass(
      "mobile runtime dependencies",
      "expo/react-native/clerk in dependencies; maps/icons placement clean",
    );
  } catch (e) {
    fail("mobile runtime dependencies", e instanceof Error ? e.message : String(e));
  }
}

function checkMobileTests() {
  const r = run("pnpm", ["run", "test"], MOBILE);
  if (r.ok) pass("mobile regression tests", "full pack exit 0");
  else fail("mobile regression tests", r.stderr || r.stdout || `exit ${r.status}`);
}

function checkMobileTypecheck() {
  const buildClient = run("pnpm", ["exec", "tsc", "-b", "../../lib/api-client-react", "--force"], MOBILE);
  if (!buildClient.ok) {
    fail("mobile typecheck (api-client-react)", (buildClient.stderr || buildClient.stdout).split("\n").slice(-5).join(" "));
    return;
  }
  const r = run("pnpm", ["exec", "tsc", "-p", "tsconfig.json", "--noEmit"], MOBILE);
  if (r.ok) pass("mobile typecheck");
  else fail("mobile typecheck", (r.stderr || r.stdout).split("\n").slice(-5).join(" "));
}

function checkLibsTypecheck() {
  const r = run("pnpm", ["exec", "tsc", "--build"], ROOT);
  if (r.ok) pass("libs typecheck");
  else fail("libs typecheck", (r.stderr || r.stdout).split("\n").slice(-5).join(" "));
}

function summarize() {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n--- ${results.length - failed.length}/${results.length} passed ---`);
  if (failed.length) {
    console.error("\nFailed:");
    for (const f of failed) console.error(`  • ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

function main() {
  console.log("BANCO production-confidence (local, no secrets)\n");

  if (!checkRepoLayout()) {
    process.exit(2);
  }

  checkTrackedSourceHygiene();
  checkEasConfig();
  checkExpoConfig();
  checkExpoSdkAlignment();
  checkReplitWorkflowSafety();
  checkWorkspaceRefs();
  checkPackageManagerContract();
  checkDependencyPeerPolicy();
  checkOpenApi();
  checkOpenApiCodegenFreshness();
  checkCoolifyDocsApex();
  checkCoolifyProductionLocks();
  checkMigrationAuthority();
  checkLandingDomainHops();
  checkReplitWipePollution();
  checkWellKnownTemplates();
  checkMobileRuntimeDeps();
  checkGcpDockerConfig();

  if (!skipTypecheck) {
    checkLibsTypecheck();
    checkMobileTypecheck();
  } else {
    console.log("[SKIP] typecheck (--skip-typecheck)");
  }

  checkMobileTests();
  summarize();
}

main();
