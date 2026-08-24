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

function fiAuthEntryFromCta(cta) {
  const match = cta.match(
    /["'](\/sign-up(?:\?[^"']*)?|\/business\/(?:fi-auth|banks\/register|financial-institution\/register)(?:\?[^"']*)?)["']/,
  );
  assert.ok(
    match,
    "the signed-out branch must enter parameterized shared auth or a dedicated FI auth wrapper",
  );
  return {
    href: match[1],
    pathname: match[1].split("?")[0],
  };
}

function routeSource(pathname) {
  const route = pathname.replace(/^\//, "");
  const candidates = [
    `artifacts/banco-mobile/app/${route}.tsx`,
    `artifacts/banco-mobile/app/${route}/index.tsx`,
  ];
  const candidate = candidates.find((rel) =>
    fs.existsSync(path.join(ROOT, rel)),
  );
  assert.ok(candidate, `missing auth entry route for ${pathname}`);
  return read(candidate);
}

function paramsObject(source, label) {
  const marker = source.search(/\bparams\s*:\s*\{/);
  assert.notEqual(marker, -1, `${label} must pass route params`);
  const start = source.indexOf("{", marker);
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] !== "}") continue;
    depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  assert.fail(`${label} has an unterminated route params object`);
}

function assertForwardsFiContext(source, label, { explicitFi = false } = {}) {
  const params = paramsObject(source, label);
  assert.match(params, /authMode\s*:\s*["']signup["']/);
  assert.match(
    params,
    /(?:\bintent\b|\bfiIntent\b|\baccountIntent\b|\bauthIntent\b)/,
    `${label} must carry FI intent into shared auth`,
  );
  assert.match(
    params,
    /\bfiType\b|\bfiSubtype\b|\breturnTo\b|\bonboardingTarget\b/,
    `${label} must preserve the FI subtype or a fail-closed return target`,
  );
  if (explicitFi) {
    assert.match(
      params,
      /(?:intent|fiIntent|accountIntent|authIntent)\s*:\s*["']fi["']/,
      `${label} must establish FI intent before entering shared auth`,
    );
  }
}

test("general account picker exposes exactly Individual, Dealer, Company", () => {
  const profile = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  assert.deepEqual(
    accountOptionTypes(profile).sort(),
    ["company", "dealer", "individual"],
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

  for (const forbidden of [
    "business",
    "bank",
    "funder",
    "financial_institution",
  ]) {
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

  const entry = fiAuthEntryFromCta(cta);
  if (entry.pathname === "/sign-up") {
    assert.match(
      `${entry.href}\n${cta}`,
      /intent\s*[:=]\s*["']fi["']|intent=fi/,
      "shared auth must receive immutable FI intent from the mini-app CTA",
    );
    assert.match(
      `${entry.href}\n${cta}`,
      /fiType\s*[:=]\s*["']bank["']|fiType=bank|\breturnTo\b/,
      "shared auth must receive the bank subtype or a fail-closed return target",
    );
  }
});

test("FI auth entry forwards context into the shared Clerk flow", () => {
  const banks = read("artifacts/banco-mobile/app/business/banks.tsx");
  const cta = windowAroundTestId(banks, "banks-register-cta");
  const entry = fiAuthEntryFromCta(cta);
  const entrySource = routeSource(entry.pathname);

  assert.doesNotMatch(
    entrySource,
    /\buseSignIn\s*\(|\buseSignUp\s*\(/,
    "an FI auth wrapper must reuse the shared Clerk flow, not create a second implementation",
  );
  assert.match(entrySource, /\/\(tabs\)\/profile|\/sign-up/);

  if (entry.pathname === "/sign-up") {
    assert.match(entrySource, /useLocalSearchParams/);
    assertForwardsFiContext(entrySource, "/sign-up");
    return;
  }

  assertForwardsFiContext(entrySource, entry.pathname, { explicitFi: true });
  if (/\/sign-up/.test(entrySource)) {
    const signUp = read("artifacts/banco-mobile/app/sign-up.tsx");
    assert.match(signUp, /useLocalSearchParams/);
    assertForwardsFiContext(signUp, "/sign-up");
  }
});

test("Profile consumes FI auth intent and bypasses the generic account picker", () => {
  const profile = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  const paramIndex = profile.search(
    /\bconst\s*\{[\s\S]{0,300}\bauthMode\b[\s\S]{0,300}\}\s*=\s*useLocalSearchParams/,
  );
  assert.notEqual(
    paramIndex,
    -1,
    "Profile must read route-owned auth context at the hook call",
  );
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
