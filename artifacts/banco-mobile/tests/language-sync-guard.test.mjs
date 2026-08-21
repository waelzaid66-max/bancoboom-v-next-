import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = join(mobileRoot, "..", "..");
const readMobile = (path) => readFileSync(join(mobileRoot, path), "utf8");
const readWorkspace = (path) => readFileSync(join(workspaceRoot, path), "utf8");

test("PATCH /v1/me carries the bounded language contract through codegen", () => {
  const spec = readWorkspace("lib/api-spec/openapi.yaml");
  const patchMe = spec.slice(
    spec.indexOf("  /v1/me:"),
    spec.indexOf("  /v1/feed:"),
  );
  assert.match(patchMe, /language:\n\s+type: string\n\s+enum: \[ar, en\]/);

  const schemas = readWorkspace(
    "lib/api-client-react/src/generated/api.schemas.ts",
  );
  assert.match(schemas, /export type UpdateMeBodyLanguage/);
  assert.match(schemas, /language\?: UpdateMeBodyLanguage/);

  const zod = readWorkspace("lib/api-zod/src/generated/api.ts");
  assert.match(zod, /"language": zod\.enum\(\['ar', 'en'\]\)\.optional\(\)/);

  const serverSchemas = readWorkspace(
    "artifacts/api-server/src/validators/schemas.ts",
  );
  assert.match(
    serverSchemas,
    /language: z\.enum\(\["ar", "en"\]\)\.optional\(\)/,
  );

  const userService = readWorkspace(
    "artifacts/api-server/src/services/UserService.ts",
  );
  assert.match(
    userService,
    /if \(input\.language\) patch\.language = input\.language/,
  );

  const emailService = readWorkspace(
    "artifacts/api-server/src/services/EmailService.ts",
  );
  assert.match(emailService, /select\(\{ language: users\.language \}\)/);
});

test("the authenticated bridge serializes and explicitly authorizes language writes", () => {
  const sync = readMobile("context/LanguagePreferenceSync.tsx");
  assert.match(sync, /!isSignedIn \|\| !userId/);
  assert.match(sync, /runningRef/);
  assert.match(sync, /desiredRef/);
  assert.match(sync, /await updateMe\(/);
  assert.match(sync, /\{ language: desired\.lang \}/);
  assert.match(sync, /Authorization: `Bearer \$\{token\}`/);
  assert.match(sync, /RETRY_DELAYS_MS/);

  const layout = readMobile("app/_layout.tsx");
  const authBridge = layout.indexOf("<AuthTokenBridge />");
  const languageBridge = layout.indexOf("<LanguagePreferenceSync />");
  assert.ok(authBridge >= 0, "AuthTokenBridge is not mounted");
  assert.ok(
    languageBridge > authBridge,
    "language sync must mount after auth bridge",
  );

  const context = readMobile("context/LanguageContext.tsx");
  assert.doesNotMatch(context, /TODO\(lang-sync\)/);
});

test("language sync static and render gates are chained into the mobile suite", () => {
  const pkg = JSON.parse(readMobile("package.json"));
  assert.equal(
    pkg.scripts?.["test:language-sync"],
    "node --test tests/language-sync-guard.test.mjs",
  );
  assert.match(pkg.scripts?.test ?? "", /pnpm run test:language-sync(?:\s|$)/);
});
