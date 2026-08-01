// Accounts + Clerk journey guards — prove auth/account-type paths are not stuck.
// Run: node --test tests/accounts-clerk-journey.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const MOBILE = path.join(ROOT, "artifacts/banco-mobile");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

test("email / MFA / reset finalize set authJustHappenedRef (not OAuth-only)", () => {
  const src = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  // OAuth path
  assert.match(src, /authJustHappenedRef\.current = true;\s*\n\s*await ssoSetActive/);
  // Email password complete
  assert.match(
    src,
    /if \(signIn\.status === "complete"\) \{\s*\n\s*authJustHappenedRef\.current = true;\s*\n\s*await signIn\.finalize/,
  );
  // At least 3 non-OAuth assignments (sign-in, MFA, reset)
  const assigns = src.match(/authJustHappenedRef\.current = true;/g) || [];
  assert.ok(
    assigns.length >= 4,
    `expected ≥4 authJustHappenedRef assignments (oauth+email+mfa+reset), got ${assigns.length}`,
  );
});

test("account-type heal covers stuck sessions without racing email signup", () => {
  const src = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  assert.match(src, /signupInFlightRef/);
  assert.match(src, /consentPendingRef\.current \|\| signupInFlightRef\.current/);
  assert.match(src, /accountTypeChosen/);
  assert.match(src, /setNeedsAccountType\(true\)/);
  // Heal must not reopen picker when /me already has a business role.
  assert.match(src, /role !== "individual"/);
  // Consent must not stamp accountTypeChosen before updateMe.
  const terms = src.indexOf("termsAcceptedAt: new Date().toISOString()");
  const post = src.indexOf("post-signup account_type save failed");
  assert.ok(terms >= 0 && post > terms);
  assert.equal(
    src.slice(terms, post).includes("accountTypeChosen: true"),
    false,
    "consent metadata must not set accountTypeChosen before /me",
  );
});

test("verify Go Back is locked while signup finalize is in flight", () => {
  const src = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  assert.match(src, /testID="verify-go-back"/);
  assert.match(src, /disabled=\{isSigningUp\}/);
});

test("FI onboarding keeps intent=fi (never demotes to dealer path)", () => {
  const profile = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  const onboarding = read("artifacts/banco-mobile/app/business/onboarding.tsx");
  const banks = read("artifacts/banco-mobile/app/business/banks.tsx");
  assert.match(profile, /\/business\/onboarding\?intent=fi/);
  assert.match(onboarding, /params\.intent === ["']fi["']/);
  assert.match(banks, /\/business\/onboarding\?intent=fi/);
});

test("S4 demote guard exists client + server", () => {
  const profile = read("artifacts/banco-mobile/app/(tabs)/profile.tsx");
  const service = read("artifacts/api-server/src/services/UserService.ts");
  assert.match(profile, /demoteBlockedTitle/);
  assert.match(service, /DEMOTE_BLOCKED/);
  assert.match(service, /financial_institution/);
});

test("MFA delete-account accepts needs_second_factor as password-verified", () => {
  const src = read("artifacts/banco-mobile/app/settings.tsx");
  assert.match(src, /needs_second_factor/);
  assert.match(src, /signIn\.status !== "complete"/);
});

test("business banks + verification registered in Stack", () => {
  const layout = read("artifacts/banco-mobile/app/_layout.tsx");
  assert.match(layout, /name="business\/banks"/);
  assert.match(layout, /name="business\/verification"/);
});

test("i18n has accountSetupRetry keys in en + ar", () => {
  const i18n = read("artifacts/banco-mobile/constants/i18n.ts");
  const titleHits = i18n.match(/accountSetupRetryTitle:/g) || [];
  const msgHits = i18n.match(/accountSetupRetryMessage:/g) || [];
  assert.equal(titleHits.length, 2, "en+ar accountSetupRetryTitle");
  assert.equal(msgHits.length, 2, "en+ar accountSetupRetryMessage");
});

test("social providers fail closed (empty list on error)", () => {
  const src = read("artifacts/banco-mobile/hooks/useSocialProviders.ts");
  assert.match(src, /return \[\]/);
  assert.match(src, /social/);
});

test("object storage warns when provider unset (Replit default trap)", () => {
  const src = read("artifacts/api-server/src/lib/objectStorageProvider.ts");
  assert.match(src, /OBJECT_STORAGE_PROVIDER is unset/);
  assert.match(src, /OBJECT_STORAGE_PROVIDER=s3/);
  assert.match(src, /unset in production/);
  assert.match(src, /forbidden on Coolify/);
});

test("routerOrigin prefers PUBLIC_APP_URL over bare replit.com", () => {
  const src = read("artifacts/banco-mobile/app.config.ts");
  assert.match(src, /EXPO_PUBLIC_PUBLIC_APP_URL/);
  assert.ok(
    src.indexOf("EXPO_PUBLIC_PUBLIC_APP_URL") < src.indexOf('"https://replit.com/"'),
    "PUBLIC_APP_URL must be preferred before replit.com fallback",
  );
});

test("Clerk proxy middleware does not claim Replit Auth pane is SoT", () => {
  const src = read(
    "artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts",
  );
  assert.doesNotMatch(src, /There is no external Clerk\s*\n\s*dashboard/);
  assert.match(src, /dashboard\.clerk\.com|clerk\.banco\.today/);
});

test("Auth provider tree: AuthGate wraps SessionProvider", () => {
  const layout = read("artifacts/banco-mobile/app/_layout.tsx");
  const gateIdx = layout.indexOf("<AuthGateProvider>");
  const sessionIdx = layout.indexOf("<SessionProvider>");
  assert.ok(gateIdx > 0 && sessionIdx > gateIdx, "AuthGate must wrap Session");
});
