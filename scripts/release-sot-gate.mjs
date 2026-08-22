import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "release", "production", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const expectedRepo = "waelzaid66-max/bancoboom-v-next-";
const expectedBranch = "canonical/vnext-assembly";

const failures = [];

if (manifest.repository !== expectedRepo) {
  failures.push(`manifest.repository must be ${expectedRepo}`);
}
if (manifest.canonicalBranch !== expectedBranch) {
  failures.push(`manifest.canonicalBranch must be ${expectedBranch}`);
}
if (manifest.coolify?.sourceRepository !== expectedRepo) {
  failures.push(`manifest.coolify.sourceRepository must be ${expectedRepo}`);
}
if (manifest.coolify?.sourceBranch !== expectedBranch) {
  failures.push(`manifest.coolify.sourceBranch must be ${expectedBranch}`);
}
if (manifest.coolify?.composeFile !== "docker-compose.coolify.yml") {
  failures.push("manifest.coolify.composeFile must be docker-compose.coolify.yml");
}

const requiredPaths = [
  "docker-compose.coolify.yml",
  "deploy/coolify/Dockerfile.api",
  "deploy/coolify/Dockerfile.banco-website",
  "deploy/coolify/Dockerfile.banco-web",
  "deploy/coolify/Dockerfile.web",
  "artifacts/api-server/package.json",
  "artifacts/banco-mobile/package.json",
  "artifacts/banco-website/package.json",
  "artifacts/banco-web/package.json",
  "artifacts/landing/package.json",
  "artifacts/dealer-os/package.json",
  "artifacts/admin-os/package.json",
  "release/production/IMAGE_ROLLBACK_TEMPLATE.md",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
];

for (const relativePath of requiredPaths) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    failures.push(`required production input missing: ${relativePath}`);
  }
}

// Only files that an operator can reasonably use as CURRENT deployment authority
// belong here. Historical audit/recovery/legacy planning documents are preserved
// as provenance and intentionally excluded from this gate.
const operatorFiles = [
  "docker-compose.coolify.yml",
  "COOLIFY_DEPLOY_NOW.md",
  "OPS_GO_LIVE_CHECKLIST.md",
  "docs/DEPLOYMENT_SOURCE_OF_TRUTH.md",
  "docs/DEPLOY_COOLIFY.md",
  "release/production/README.md",
  "release/production/COOLIFY_RUNBOOK.md",
  "release/production/ENVIRONMENT_CONTRACT.md",
];

// Fail only when the historical repository is presented as an ACTIVE source.
// Negative statements such as "do not deploy bancoboomstor" and historical
// provenance are intentionally allowed. Broad raw-name matching caused correct
// stop conditions to fail the gate.
const forbiddenAuthorityPatterns = [
  /ONLY\s+GitHub\s+repo[^\n]*bancoboomstor/gi,
  /ONLY\s+deploy\s+SoT\s+repository[^\n]*bancoboomstor/gi,
  /SoT\s+repo(?:\s+only)?[^\n]*bancoboomstor/gi,
  /Git\s+repo\s*=\s*[^\n]*bancoboomstor/gi,
  /Repository\s+URL\s*\|[^\n]*bancoboomstor/gi,
  /Connect\s+Git[^\n]*bancoboomstor/gi,
  /Select\s+the\s+[`'\"]?(?:waelzaid66-max\/)?bancoboomstor\b/gi,
  /\brepo\s+[`'\"]?(?:waelzaid66-max\/)?bancoboomstor\b/gi,
];

for (const relativePath of operatorFiles) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) continue;
  const text = fs.readFileSync(fullPath, "utf8");
  for (const pattern of forbiddenAuthorityPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      failures.push(
        `historical deploy source is still presented as live authority in ${relativePath}: ${pattern}`,
      );
    }
  }
}

// Current operator-facing deployment documents must describe the same immutable
// first-party image identity as Compose. Keep historical/audit documents outside
// this list so prohibition/provenance text cannot create a false release failure.
const immutableImageOperatorFiles = [
  "COOLIFY_DEPLOY_NOW.md",
  "OPS_GO_LIVE_CHECKLIST.md",
  "docs/DEPLOYMENT_SOURCE_OF_TRUTH.md",
  "docs/DEPLOY_COOLIFY.md",
  "release/production/ENVIRONMENT_CONTRACT.md",
];
const mutableFirstPartyImagePattern =
  /\bbanco-(?:api|web|website|web-static):latest\b/i;

for (const relativePath of immutableImageOperatorFiles) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`operator release contract missing: ${relativePath}`);
    continue;
  }
  const text = fs.readFileSync(fullPath, "utf8");
  if (!text.includes("RELEASE_SHA")) {
    failures.push(`operator release contract must require RELEASE_SHA: ${relativePath}`);
  }
  if (mutableFirstPartyImagePattern.test(text)) {
    failures.push(`mutable first-party :latest image remains in operator contract: ${relativePath}`);
  }
}

// First-party application images must use one explicit release identity. External
// infrastructure images (for example postgres:16) are intentionally outside
// this check. RELEASE_SHA has no default: Coolify must supply the approved exact
// source SHA and the release procedure separately records content IDs/digests.
const composePath = path.join(root, "docker-compose.coolify.yml");
if (fs.existsSync(composePath)) {
  const compose = fs.readFileSync(composePath, "utf8");
  const firstPartyImageLines = compose
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^image:\s*banco-[^\s]+/i.test(line));

  const expectedImageNames = new Set([
    "banco-api",
    "banco-web",
    "banco-website",
    "banco-web-static",
  ]);
  const seenImageNames = new Set();

  if (firstPartyImageLines.length === 0) {
    failures.push("docker-compose.coolify.yml must declare first-party BANCO application images");
  }

  for (const line of firstPartyImageLines) {
    const imageRef = line.replace(/^image:\s*/i, "").trim();
    if (/:latest(?:\s|$)/i.test(imageRef)) {
      failures.push(
        `mutable first-party image tag is forbidden in docker-compose.coolify.yml: ${imageRef}`,
      );
    }

    const match = imageRef.match(
      /^(banco-api|banco-web|banco-website|banco-web-static):\$\{RELEASE_SHA:\?[^}]+\}$/,
    );
    if (!match) {
      failures.push(
        `first-party image must require RELEASE_SHA with no fallback/default: ${imageRef}`,
      );
      continue;
    }
    seenImageNames.add(match[1]);
  }

  for (const imageName of expectedImageNames) {
    if (!seenImageNames.has(imageName)) {
      failures.push(`required first-party image missing immutable RELEASE_SHA identity: ${imageName}`);
    }
  }
  if (seenImageNames.size !== expectedImageNames.size) {
    failures.push("first-party image set must contain exactly the four approved BANCO application images");
  }

  // P0 release identity: API image tag, API build metadata, API runtime pin and
  // the one-off migrate builder must all derive from mandatory RELEASE_SHA.
  const mandatoryRelease =
    "${RELEASE_SHA:?RELEASE_SHA is required and must equal the approved exact source SHA}";
  const releaseBindingLines = compose
    .split(/\r?\n/)
    .map((line) => line.trim());

  const countExact = (line) => releaseBindingLines.filter((entry) => entry === line).length;
  if (countExact(`RELEASE_SHA: ${mandatoryRelease}`) < 3) {
    failures.push(
      "compose must bind RELEASE_SHA to migrate build, API build and API runtime with no fallback",
    );
  }
  if (countExact(`GIT_SHA: ${mandatoryRelease}`) !== 1) {
    failures.push("API runtime GIT_SHA must derive exactly once from mandatory RELEASE_SHA");
  }
  if (countExact(`BUILD_ID: ${mandatoryRelease}`) !== 1) {
    failures.push("API runtime BUILD_ID must derive exactly once from mandatory RELEASE_SHA");
  }
  if (/GIT_SHA:\s*\$\{GIT_SHA|BUILD_ID:\s*\$\{BUILD_ID|SOURCE_COMMIT:-/.test(compose)) {
    failures.push(
      "compose must not retain independent GIT_SHA/BUILD_ID/SOURCE_COMMIT fallbacks for release identity",
    );
  }
}

const apiDockerfilePath = path.join(root, "deploy", "coolify", "Dockerfile.api");
if (fs.existsSync(apiDockerfilePath)) {
  const dockerfile = fs.readFileSync(apiDockerfilePath, "utf8");
  for (const required of [
    "ARG RELEASE_SHA=",
    "LABEL org.opencontainers.image.revision=$RELEASE_SHA",
    "ENV RELEASE_SHA=$RELEASE_SHA",
    "GIT_SHA=$RELEASE_SHA",
    "BUILD_ID=$RELEASE_SHA",
  ]) {
    if (!dockerfile.includes(required)) {
      failures.push(`API Dockerfile release identity binding missing: ${required}`);
    }
  }
  if (/ARG\s+GIT_SHA|ARG\s+BUILD_ID/.test(dockerfile)) {
    failures.push("API Dockerfile must not expose competing GIT_SHA/BUILD_ID build authorities");
  }
}

const healthPath = path.join(root, "artifacts", "api-server", "src", "routes", "health.ts");
if (fs.existsSync(healthPath)) {
  const health = fs.readFileSync(healthPath, "utf8");
  for (const required of [
    "const FULL_GIT_SHA = /^[0-9a-f]{40}$/i;",
    'cleanEnv("RELEASE_SHA")',
    "explicitGitSha === releaseSha",
    "explicitBuildId === releaseSha",
    'checks.release_identity = identity.valid ? "ok" : "down"',
  ]) {
    if (!health.includes(required)) {
      failures.push(`API readiness release-identity fail-closed contract missing: ${required}`);
    }
  }
}

if (failures.length > 0) {
  console.error("RELEASE_SOT_GATE_FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("RELEASE_SOT_GATE_PASS");
console.log(`repository=${expectedRepo}`);
console.log(`branch=${expectedBranch}`);
console.log(`assemblyBaseSha=${manifest.assemblyBaseSha}`);
