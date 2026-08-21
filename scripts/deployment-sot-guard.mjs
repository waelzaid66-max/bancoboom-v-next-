import fs from "node:fs";

const CURRENT_REPO = "waelzaid66-max/bancoboom-v-next-";
const CURRENT_BRANCH = "canonical/vnext-assembly";
const HISTORICAL_REPO = "waelzaid66-max/bancoboomstor";

const LIVE_AUTHORITIES = [
  "docker-compose.coolify.yml",
  "COOLIFY_DEPLOY_NOW.md",
  "OPS_GO_LIVE_CHECKLIST.md",
  "docs/DEPLOYMENT_SOURCE_OF_TRUTH.md",
  "docs/DEPLOY_COOLIFY.md",
  "docs/DEPLOYMENT_PLAN.md",
];

const failures = [];

for (const file of LIVE_AUTHORITIES) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}: missing live deployment authority`);
    continue;
  }

  const source = fs.readFileSync(file, "utf8");

  if (source.includes(HISTORICAL_REPO)) {
    failures.push(`${file}: still points operators at historical repo ${HISTORICAL_REPO}`);
  }

  const repoMentioned = source.includes(CURRENT_REPO);
  const branchMentioned = source.includes(CURRENT_BRANCH);
  if (!repoMentioned && !branchMentioned) {
    failures.push(`${file}: does not name current BANCO BOOM NEXT repo or canonical branch`);
  }
}

if (failures.length > 0) {
  console.error("Deployment SoT guard FAILED:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(
    "\nHistorical/audit records are intentionally out of scope. Fix only operator-facing live deployment authorities.",
  );
  process.exit(1);
}

console.log(
  `Deployment SoT guard PASS: live authorities point to ${CURRENT_REPO} / ${CURRENT_BRANCH}`,
);
