#!/usr/bin/env node
/**
 * Phase 3 — seller workspace parity audit.
 * Static checks for create/edit/manage/leads/messages wiring.
 *
 * Usage: node scripts/website-seller-workspace-parity-audit.mjs
 * Exit: 0 pass, 1 fail
 *
 * SCOPE — 2026-08-23. This audit ran against `banco-web` only, while
 * `banco-website` ships the same seller workspace from byte-identical copies of
 * the same components. Eighteen paths were audited on one surface and zero on
 * the other, so any drift in the shipped twin was invisible here. Every check
 * now runs for BOTH surfaces, and the twin files are compared byte for byte.
 *
 * LIMIT — `mustInclude` is a substring test over file text, so a comment
 * mentioning a token satisfies it, and no amount of it can tell whether a
 * payload the form builds is one the API accepts. It did not: measured
 * 2026-08-23, this audit printed "[PASS] listing create/edit form" while the
 * form could create 0 of 3 categories. The executable control for that lives in
 * api-server/src/services/ListingService.clientContract.test.ts, which fills
 * every rendered field and hands the result to the real validator. Keep the
 * static checks for wiring; do not mistake them for behaviour.
 */

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Both surfaces ship the seller workspace. Auditing one is auditing half. */
const SURFACES = ["banco-web", "banco-website"];

let failed = 0;
let checks = 0;

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  failed += 1;
}

function pass(msg) {
  console.log(`[PASS] ${msg}`);
}

function read(rel) {
  const full = path.join(ROOT, rel);
  if (!existsSync(full)) {
    fail(`missing file ${rel}`);
    return "";
  }
  return readFileSync(full, "utf8");
}

function mustInclude(rel, snippets, label) {
  checks += 1;
  const src = read(rel);
  if (!src) return;
  for (const snippet of snippets) {
    if (!src.includes(snippet)) {
      fail(`${label}: missing \`${snippet}\` in ${rel}`);
      return;
    }
  }
  pass(label);
}

function mustExist(rel) {
  checks += 1;
  if (!existsSync(path.join(ROOT, rel))) fail(`missing route ${rel}`);
  else pass(`route ${rel}`);
}

function mustBeIdenticalAcrossSurfaces(rel, label) {
  checks += 1;
  const digests = SURFACES.map((surface) => {
    const full = path.join(ROOT, "artifacts", surface, rel);
    if (!existsSync(full)) return null;
    return createHash("sha256").update(readFileSync(full)).digest("hex");
  });
  if (digests.some((d) => d === null)) {
    fail(`${label}: ${rel} is missing from one surface`);
    return;
  }
  if (digests[0] !== digests[1]) {
    fail(
      `${label}: ${rel} differs between ${SURFACES[0]} and ${SURFACES[1]} ` +
        `(${digests[0].slice(0, 12)} vs ${digests[1].slice(0, 12)}). ` +
        `A fix applied to one seller workspace and not the other ships broken to half the sellers.`,
    );
    return;
  }
  pass(`${label} (identical on both surfaces)`);
}

console.log("BANCO Phase 3 seller workspace parity audit\n");

const ROUTES = [
  "app/workspace/page.tsx",
  "app/workspace/listings/page.tsx",
  "app/workspace/listings/new/page.tsx",
  "app/workspace/listings/[id]/edit/page.tsx",
  "app/workspace/leads/page.tsx",
  "app/workspace/messages/page.tsx",
  "app/en/workspace/page.tsx",
  "app/en/workspace/listings/page.tsx",
  "app/en/workspace/listings/new/page.tsx",
  "app/en/workspace/leads/page.tsx",
  "app/en/workspace/messages/page.tsx",
];

const COMPONENT_CHECKS = [
  {
    rel: "components/workspace/WorkspaceShell.tsx",
    snippets: ['data-banco-journey="workspace"', "isClerkConfigured", "authDisabled"],
    label: "workspace shell auth gate",
  },
  {
    rel: "components/workspace/ManagedListingsPanel.tsx",
    snippets: [
      'data-banco-journey="workspace-listings"',
      "useGetMyManagedListings",
      "useBumpListing",
      "useDeleteListing",
      "getGetMyManagedListingsQueryKey",
      "copy.retry",
    ],
    label: "managed listings panel",
  },
  {
    rel: "components/workspace/ListingCreateForm.tsx",
    snippets: [
      "workspace-create-listing",
      "workspace-edit-listing",
      "useCreateListing",
      "useUpdateListing",
      "getGetMyMetricsQueryKey",
      "uploadError",
      "photosUploading",
      // The price input must hydrate from the raw stored value. Hydrating from
      // price_display wrote a compacted number ("58.04M EGP" → 58.04) back as
      // the asking price — measured 2026-08-23.
      "detail.price_cash",
      // A failed save must say what the API said, not a generic message.
      "apiErrorMessage",
    ],
    label: "listing create/edit form",
  },
  {
    rel: "lib/workspace-listing-form.ts",
    snippets: [
      // The four keys the API gates on that this form never used to render, so
      // no value for them could ever be submitted. See clientContract.test.ts.
      '"condition"',
      '"offer_type"',
      '"rental_term"',
      '"capacity"',
      // Required-ness is derived from the shared contract, never hand-listed.
      "requiredSpecKeys",
    ],
    label: "listing spec fields cover the API floor",
  },
  {
    rel: "components/workspace/LeadsPanel.tsx",
    snippets: [
      'data-banco-journey="workspace-leads"',
      "useGetDealerLeads",
      "leadsEmptyHint",
      "copy.retry",
    ],
    label: "leads panel",
  },
  {
    rel: "components/workspace/MessagesInboxPanel.tsx",
    snippets: ['data-banco-journey="workspace-messages"', "useListConversations"],
    label: "messages inbox",
  },
  {
    rel: "components/workspace/MessageThreadPanel.tsx",
    snippets: ['data-banco-journey="workspace-message-thread"', "useSendMessage"],
    label: "message thread",
  },
  {
    rel: "middleware.ts",
    snippets: ["/workspace", "CLERK_PUBLISHABLE_KEY"],
    label: "middleware protects workspace",
  },
];

/** Files that must not drift between the two seller workspaces. */
const TWIN_FILES = [
  "components/workspace/ListingCreateForm.tsx",
  "lib/workspace-listing-form.ts",
];

for (const surface of SURFACES) {
  console.log(`\n── ${surface} ──`);
  for (const route of ROUTES) mustExist(`artifacts/${surface}/${route}`);
  for (const { rel, snippets, label } of COMPONENT_CHECKS) {
    mustInclude(`artifacts/${surface}/${rel}`, snippets, `${surface}: ${label}`);
  }
}

console.log(`\n── twin integrity ──`);
for (const rel of TWIN_FILES) mustBeIdenticalAcrossSurfaces(rel, "seller workspace twin");

/**
 * A gate that does not declare its own size cannot report its own shrinkage:
 * deleting a check leaves it printing "all passed". Adding or removing a check
 * must update this number in the same commit.
 */
const EXPECTED_CHECKS = 40;
if (checks !== EXPECTED_CHECKS) {
  console.error(
    `\n[FAIL] parity audit declares ${EXPECTED_CHECKS} checks but ran ${checks}. ` +
      `Adding or removing a check must update EXPECTED_CHECKS in the same commit.`,
  );
  process.exit(1);
}

if (failed > 0) {
  console.error(`\nSeller workspace parity audit failed (${failed} of ${checks})`);
  process.exit(1);
}

console.log(`\nSeller workspace parity audit passed (${checks} checks).`);
process.exit(0);
