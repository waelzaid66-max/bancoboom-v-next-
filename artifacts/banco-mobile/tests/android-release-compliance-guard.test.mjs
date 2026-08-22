import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appConfig = JSON.parse(
  fs.readFileSync(path.join(mobileRoot, "app.json"), "utf8"),
).expo;
const packageJson = JSON.parse(
  fs.readFileSync(path.join(mobileRoot, "package.json"), "utf8"),
);

function expoBuildPropertiesAndroid() {
  const plugin = appConfig.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === "expo-build-properties",
  );
  assert.ok(plugin, "expo-build-properties plugin must remain configured");
  return plugin[1]?.android ?? {};
}

test("Expo SDK 54 mobile release explicitly targets Android 16 / API 36", () => {
  assert.match(
    packageJson.dependencies.expo,
    /^~54\./,
    "this guard is scoped to the current Expo SDK 54 release line",
  );

  const android = expoBuildPropertiesAndroid();
  assert.equal(android.compileSdkVersion, 36);
  assert.equal(android.targetSdkVersion, 36);
});

test("Android package identity and existing native capability config are preserved", () => {
  assert.equal(appConfig.android.package, "com.bancooom.app");
  assert.ok(appConfig.android.adaptiveIcon?.foregroundImage);

  const notificationsPlugin = appConfig.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === "expo-notifications",
  );
  assert.ok(notificationsPlugin, "expo-notifications plugin must remain configured");
  assert.ok(notificationsPlugin[1]?.icon, "Android notification icon path must remain configured");
});
