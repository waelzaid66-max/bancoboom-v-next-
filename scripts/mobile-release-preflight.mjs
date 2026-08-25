import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const mobile = resolve(root, "artifacts/banco-mobile");

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`cannot parse ${path}: ${error.message}`);
  }
}

function fail(message) {
  console.error(`BANCO_MOBILE_PREFLIGHT_INVALID: ${message}`);
  process.exitCode = 1;
}

function requireValue(condition, message) {
  if (!condition) fail(message);
}

function profileHasEnv(config, profileName, key, visited = new Set()) {
  if (visited.has(profileName)) {
    fail(`circular EAS profile inheritance at ${profileName}`);
    return false;
  }
  visited.add(profileName);
  const profile = config?.build?.[profileName];
  if (!profile) return false;
  if (Object.prototype.hasOwnProperty.call(profile.env ?? {}, key)) return true;
  return typeof profile.extends === "string"
    ? profileHasEnv(config, profile.extends, key, visited)
    : false;
}

const rootPackage = readJson(resolve(root, "package.json"));
const mobilePackage = readJson(resolve(mobile, "package.json"));
const appConfig = readJson(resolve(mobile, "app.json"));
const easConfig = readJson(resolve(mobile, "eas.json"));
const expo = appConfig.expo ?? {};

requireValue(rootPackage.packageManager === "pnpm@11.9.0", "root packageManager must be pnpm@11.9.0");
requireValue(mobilePackage.main === "expo-router/entry", "mobile entry must remain expo-router/entry");
requireValue(String(mobilePackage.dependencies?.expo ?? "").startsWith("~54."), "Expo SDK 54 must remain pinned");
requireValue(mobilePackage.dependencies?.["react-native"] === "0.81.5", "React Native must remain 0.81.5 for Expo SDK 54");
requireValue(expo.android?.package === "com.bancooom.app", "unexpected Android applicationId");
requireValue(expo.ios?.bundleIdentifier === "com.bancooom.app", "unexpected iOS bundleIdentifier");
requireValue(Number.isInteger(expo.android?.versionCode) && expo.android.versionCode > 0, "Android versionCode must be a positive integer");
requireValue(typeof expo.ios?.buildNumber === "string" && expo.ios.buildNumber.trim() !== "", "iOS buildNumber must be present");
requireValue(expo.extra?.eas?.projectId === "45f092c8-52f9-4272-880f-48e6b721126f", "unexpected EAS projectId");
requireValue(easConfig.cli?.requireCommit === true, "EAS cli.requireCommit must be true");
requireValue(easConfig.cli?.appVersionSource === "local", "EAS appVersionSource must be local");
requireValue(easConfig.build?.production?.android?.buildType === "app-bundle", "production Android build must be an app-bundle");
requireValue(easConfig.build?.production?.android?.autoIncrement === true, "production Android version must auto-increment");
requireValue(easConfig.build?.production?.ios?.autoIncrement === true, "production iOS build number must auto-increment");
requireValue(!profileHasEnv(easConfig, "production", "EAS_NO_VCS"), "production must not inherit EAS_NO_VCS");
requireValue(!easConfig.submit?.production?.android?.serviceAccountKeyPath, "Android submit credentials must not be coupled to a repo-local file path");

for (const [key, value] of Object.entries(easConfig.submit?.production?.ios ?? {})) {
  requireValue(typeof value !== "string" || value.trim() !== "", `submit.production.ios.${key} must not be an empty placeholder`);
}

const buildProperties = (expo.plugins ?? []).find(
  (entry) => Array.isArray(entry) && entry[0] === "expo-build-properties",
)?.[1];
requireValue(buildProperties?.android?.compileSdkVersion === 36, "Android compileSdkVersion must be 36");
requireValue(buildProperties?.android?.targetSdkVersion === 36, "Android targetSdkVersion must be 36");

const notifications = (expo.plugins ?? []).find(
  (entry) => Array.isArray(entry) && entry[0] === "expo-notifications",
)?.[1];
const notificationIcon = notifications?.icon;
requireValue(typeof notificationIcon === "string" && notificationIcon.length > 0, "expo-notifications icon path is missing");
if (typeof notificationIcon === "string") {
  const iconPath = resolve(mobile, notificationIcon);
  requireValue(extname(iconPath).toLowerCase() === ".png", "notification icon must be a PNG");
  requireValue(existsSync(iconPath), `notification icon does not exist: ${notificationIcon}`);
  if (existsSync(iconPath)) {
    const png = readFileSync(iconPath);
    const signature = png.subarray(0, 8).toString("hex");
    requireValue(signature === "89504e470d0a1a0a", "notification icon is not a valid PNG");
    if (signature === "89504e470d0a1a0a" && png.length >= 26) {
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      const bitDepth = png[24];
      const colorType = png[25];
      requireValue(width === 96 && height === 96, `notification icon must be 96x96; received ${width}x${height}`);
      requireValue(bitDepth === 8, `notification icon must use 8-bit channels; received ${bitDepth}`);
      requireValue(colorType === 4 || colorType === 6, `notification icon must carry alpha transparency; PNG color type=${colorType}`);
    }
  }
}

const forbiddenRuntimePaths = [
  resolve(root, "scripts/eas-build.sh"),
  resolve(mobile, "eas.json"),
];
for (const path of forbiddenRuntimePaths) {
  const source = readFileSync(path, "utf8");
  requireValue(!source.includes("/home/runner/workspace"), `${path} contains a Replit-specific absolute path`);
  requireValue(!source.includes("Replit Secrets"), `${path} contains Replit-specific credential instructions`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log("BANCO_MOBILE_PREFLIGHT_OK");
console.log(`mobile=${mobile}`);
console.log(`expo=${mobilePackage.dependencies.expo}`);
console.log(`react_native=${mobilePackage.dependencies["react-native"]}`);
console.log(`android_package=${expo.android.package}`);
console.log(`ios_bundle=${expo.ios.bundleIdentifier}`);
console.log(`eas_project=${expo.extra.eas.projectId}`);
