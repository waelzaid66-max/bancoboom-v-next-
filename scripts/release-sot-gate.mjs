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

if (failures.length > 0) {
  console.error("RELEASE_SOT_GATE_FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("RELEASE_SOT_GATE_PASS");
console.log(`repository=${expectedRepo}`);
console.log(`branch=${expectedBranch}`);
console.log(`assemblyBaseSha=${manifest.assemblyBaseSha}`);
