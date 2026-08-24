// RED contract for Issue #114 — Financial Institution account creation must
// remain owned by the Banks & Funders mini-app, while the general account
// surface owns only Individual / Dealer / Company.
//
// Run from artifacts/banco-mobile:
//   node --test tests/accounts-fi-miniapp-boundary.red.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end + endMarker.length);
}

function accountOptionTypes(profileSource) {
  const options = sliceBetween(
    profileSource,
    "const ACCOUNT_FAMILY_OPTIONS = [",
    "] as const satisfies",
  );
  return [...options.matchAll(/\btype:\s*["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

function windowAroundTestId(source, testId, before = 1800, after = 400) {
  const marker = `testID="${testId}"`;
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `missing testID: ${testId}`);
  return source.slice(Math.max(0, index - before), index + marker.length + after);
}

test("general account picker exposes exactly Individual, Dealer, Company", () => {
  const profile = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  assert.deepEqual(
    accountOptionTypes(profile),
    ["individual", "dealer", "company"],
    "the public account picker must not collapse Dealer+Company or expose FI subtypes",
  );
});

test("general account picker contains no FI or synthetic business family", () => {
  const profile = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  const options = sliceBetween(
    profile,
    "const ACCOUNT_FAMILY_OPTIONS = [",
    "] as const satisfies",
  );

  for (const forbidden of ["business", "bank", "funder", "financial_institution"]) {
    assert.doesNotMatch(
      options,
      new RegExp(`\\btype:\\s*["']${forbidden}["']`),
      `${forbidden} must not be selectable from the general account picker`,
    );
  }
});

test("signed-out Banks CTA enters auth with FI intent instead of generic Profile", () => {
  const banks = read("artifacts/banco-mobile/app/business/banks.tsx");
  const cta = windowAroundTestId(banks, "banks-register-cta");

  assert.doesNotMatch(
    cta,
    /router\.push\(\s*["']\/\(tabs\)\/profile["']\s*\)/,
    "the Banks mini-app must not drop an FI applicant into generic Profile",
  );

  const authEntryIndex = cta.search(
    /\/sign-up|\/business\/(?:fi-auth|banks\/register|financial-institution\/register)/,
  );
  assert.notEqual(
    authEntryIndex,
    -1,
    "the signed-out branch must enter a dedicated or parameterized FI auth route",
  );

  const authEntry = cta.slice(
    Math.max(0, authEntryIndex - 300),
    authEntryIndex + 1000,
  );
  assert.match(
    authEntry,
    /intent\s*[:=]\s*["']fi["']|intent=fi/,
    "the auth entry must preserve immutable FI intent",
  );
});

test("/sign-up forwards FI context into the shared Clerk flow", () => {
  const signUp = read("artifacts/banco-mobile/app/sign-up.tsx");

  assert.match(signUp, /useLocalSearchParams/);
  assert.match(signUp, /\bintent\b/);
  assert.match(signUp, /\bfiType\b|\breturnTo\b/);
  assert.match(signUp, /authMode\s*:\s*["']signup["']/);
});

test("Profile consumes FI auth intent and bypasses the generic account picker", () => {
  const profile = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  const paramIndex = profile.indexOf("useLocalSearchParams");
  assert.notEqual(paramIndex, -1, "Profile must read route-owned auth context");
  const paramWindow = profile.slice(paramIndex, paramIndex + 1200);

  assert.match(paramWindow, /authMode/);
  assert.match(paramWindow, /\bintent\b/);
  assert.match(paramWindow, /\bfiType\b|\breturnTo\b/);
  assert.match(
    profile,
    /(?:fiIntent|accountIntent|authIntent)[\s\S]{0,160}["']fi["']/,
    "Profile must derive a fail-closed FI journey authority from route context",
  );

  const healStart = profile.indexOf("// After in-session auth");
  const healEnd = profile.indexOf("// Step 3", healStart);
  assert.ok(healStart >= 0 && healEnd > healStart, "account-type heal block not found");
  const heal = profile.slice(healStart, healEnd);
  assert.match(
    heal,
    /fiIntent|accountIntent|authIntent/,
    "post-auth healing must not reopen the generic picker during an FI journey",
  );
});

test("FI onboarding preserves one role with regulated bank/funder subtypes", () => {
  const onboarding = read("artifacts/banco-mobile/app/business/onboarding.tsx");
  const service = read("artifacts/api-server/src/services/UserService.ts");

  assert.match(onboarding, /params\.intent === ["']fi["']/);
  assert.match(onboarding, /["']bank["']/);
  assert.match(onboarding, /["']financing_company["']/);
  assert.match(
    onboarding,
    /account_type:\s*UpdateMeBodyAccountType\.financial_institution/,
  );
  assert.match(
    service,
    /input\.account_type === ["']financial_institution["'][\s\S]{0,180}["']financial_institution["']/,
  );
});

test("FI separation does not create a duplicate BANCO identity", () => {
  const service = read("artifacts/api-server/src/services/UserService.ts");

  assert.match(service, /\.values\(\{[\s\S]{0,240}\bclerkId,/);
  assert.match(
    service,
    /\.onConflictDoNothing\(\{\s*target:\s*users\.clerkId\s*\}\)/,
    "one Clerk principal must continue mapping to one BANCO user row",
  );
});
