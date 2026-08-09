import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  hostsFromIntentFilters,
  mergeAndroidAppLinkFilters,
  mergeAssociatedDomains,
  normalizeAppLinkHost,
  resolveWebAppLinkHost,
} from "../lib/link-host-merge.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_CONFIG = path.join(APP_ROOT, "app.config.ts");
const CANONICAL_PACKAGE = "com.bancooom.app";
const FORBIDDEN_PACKAGE = "com.bancoboom.app";

test("app.config.ts wires Universal/App Links from shared merge module", () => {
  const src = fs.readFileSync(APP_CONFIG, "utf8");
  assert.match(src, /link-host-merge\.mjs/);
  assert.match(src, /resolveWebAppLinkHost/);
  assert.match(src, /mergeAssociatedDomains/);
  assert.match(src, /mergeAndroidAppLinkFilters/);
  assert.match(src, /EXPO_PUBLIC_ROUTER_ORIGIN/);
  assert.doesNotMatch(src, /applinks:banco\./i);
});

test("normalizeAppLinkHost rejects empty, whitespace, and replit hosts", () => {
  assert.equal(normalizeAppLinkHost(""), null);
  assert.equal(normalizeAppLinkHost("   "), null);
  assert.equal(normalizeAppLinkHost("replit.com"), null);
  assert.equal(normalizeAppLinkHost("foo.replit.dev"), null);
  assert.equal(normalizeAppLinkHost(" Banco.Today. "), "banco.today");
  assert.equal(normalizeAppLinkHost("BANCO.DEALS."), "banco.deals");
});

test("resolveWebAppLinkHost skips replit and blank env", () => {
  assert.equal(resolveWebAppLinkHost({}), null);
  assert.equal(
    resolveWebAppLinkHost({ EXPO_PUBLIC_PUBLIC_APP_URL: "https://replit.com/" }),
    null,
  );
  assert.equal(
    resolveWebAppLinkHost({
      EXPO_PUBLIC_PUBLIC_APP_URL: "https://www.banco.today/",
    }),
    "www.banco.today",
  );
  assert.equal(
    resolveWebAppLinkHost({
      EXPO_PUBLIC_PUBLIC_APP_URL: "   ",
      EXPO_PUBLIC_ROUTER_ORIGIN: "https://banco.autos",
    }),
    "banco.autos",
  );
});

test("H2 merge unions env host with app.json hosts (no wipe)", () => {
  const existingFilters = [
    {
      action: "VIEW",
      autoVerify: true,
      data: [
        { scheme: "https", host: "banco.today", pathPrefix: "/l" },
        { scheme: "https", host: "banco.deals", pathPrefix: "/l" },
        { scheme: "https", host: "banco.autos", pathPrefix: "/l" },
        { scheme: "https", host: "  Banco.Today  ", pathPrefix: "/listing" },
        { scheme: "https", host: "replit.com", pathPrefix: "/l" },
      ],
      category: ["BROWSABLE", "DEFAULT"],
    },
  ];
  const merged = mergeAndroidAppLinkFilters(existingFilters, "WWW.BANCO.TODAY");
  assert.equal(merged.length, 1);
  const hosts = hostsFromIntentFilters(merged);
  assert.deepEqual(
    [...new Set(hosts)].toSorted(),
    ["banco.autos", "banco.deals", "banco.today", "www.banco.today"],
  );
  assert.ok(!hosts.includes("replit.com"));
  for (const host of hosts) {
    const prefixes = merged[0].data
      .filter((d) => d.host === host)
      .map((d) => d.pathPrefix)
      .toSorted();
    assert.deepEqual(prefixes, ["/l", "/listing"]);
  }
});

test("H2 associatedDomains unions and normalizes", () => {
  const merged = mergeAssociatedDomains(
    [
      "applinks:banco.today",
      "applinks:BANCO.TODAY",
      "webcredentials:banco.deals",
      "applinks:replit.com",
      "  ",
      "applinks: banco.autos.",
    ],
    "www.banco.today",
  );
  assert.deepEqual(
    merged.toSorted(),
    [
      "applinks:banco.autos",
      "applinks:banco.today",
      "applinks:www.banco.today",
      "webcredentials:banco.deals",
      "webcredentials:www.banco.today",
    ],
  );
});

test("nginx + Dockerfile.web ship well-known AASA/assetlinks templates", () => {
  const root = path.resolve(APP_ROOT, "../..");
  const aasa = path.join(root, "deploy/coolify/well-known/apple-app-site-association");
  const assetlinks = path.join(root, "deploy/coolify/well-known/assetlinks.json");
  const nginx = fs.readFileSync(path.join(root, "deploy/coolify/nginx.conf"), "utf8");
  const dockerfile = fs.readFileSync(
    path.join(root, "deploy/coolify/Dockerfile.web"),
    "utf8",
  );
  assert.ok(fs.existsSync(aasa), "AASA template missing");
  assert.ok(fs.existsSync(assetlinks), "assetlinks template missing");
  const aasaText = fs.readFileSync(aasa, "utf8");
  const assetText = fs.readFileSync(assetlinks, "utf8");
  // The two placeholders MUST stay in Git. The Apple Team ID and the Play
  // signing fingerprint are owner-only credentials; committing a made-up value
  // would be worse than leaving the slot empty. What must never happen is that
  // slot reaching production — that is what the renderer tests below cover.
  assert.match(aasaText, /REPLACE_APPLE_TEAM_ID/);
  assert.match(aasaText, new RegExp(CANONICAL_PACKAGE.replace(/\./g, "\\.")));
  assert.doesNotMatch(aasaText, new RegExp(FORBIDDEN_PACKAGE.replace(/\./g, "\\.")));
  assert.match(assetText, /REPLACE_PLAY_APP_SIGNING_SHA256/);
  assert.match(assetText, new RegExp(CANONICAL_PACKAGE.replace(/\./g, "\\.")));
  assert.doesNotMatch(assetText, new RegExp(FORBIDDEN_PACKAGE.replace(/\./g, "\\.")));
  assert.match(nginx, /\.well-known/);
  assert.match(nginx, /default_type\s+application\/json/);
  assert.match(dockerfile, /well-known\/apple-app-site-association/);
  assert.match(dockerfile, /well-known\/assetlinks\.json/);
});

test("Dockerfile.web serves rendered well-known files, not the raw templates", () => {
  const root = path.resolve(APP_ROOT, "../..");
  const dockerfile = fs.readFileSync(
    path.join(root, "deploy/coolify/Dockerfile.web"),
    "utf8",
  );
  // The original defect: `COPY deploy/coolify/well-known/... /usr/share/nginx/`
  // baked the unfilled template straight into the image, so production served a
  // parseable HTTP 200 whose fingerprint field read REPLACE_PLAY_APP_SIGNING_SHA256.
  // Nothing failed — Apple and Google just never verified. The nginx stage must
  // take these two files from the renderer's output only.
  for (const name of ["apple-app-site-association", "assetlinks.json"]) {
    assert.match(
      dockerfile,
      new RegExp(`COPY --from=builder /well-known/${name.replace(/\./g, "\\.")}\\s`),
      `${name} must be copied from the renderer output (/well-known), never from the build context`,
    );
    assert.doesNotMatch(
      dockerfile,
      new RegExp(`^COPY deploy/coolify/well-known/${name.replace(/\./g, "\\.")}`, "m"),
      `${name} is being copied straight from the context again — that is the bug`,
    );
  }
  assert.match(dockerfile, /render-well-known\.mjs/, "the renderer must run in the build");
  assert.match(dockerfile, /WELL_KNOWN_STRICT/, "the strict switch must be a build arg");
});

test("the renderer refuses every way a placeholder could reach production", async () => {
  const root = path.resolve(APP_ROOT, "../..");
  const mod = await import(
    pathToFileURL(path.join(root, "deploy/coolify/well-known/render-well-known.mjs")).href
  );
  const GOOD_TEAM = "ABCDE12345";
  const GOOD_FP = Array(32).fill("AB").join(":");

  // Strict build with nothing supplied — the store-verification path. Must throw,
  // which in the Dockerfile is a non-zero RUN and a failed image.
  assert.throws(
    () => mod.resolveCredentials({}, { strict: true }),
    /APPLE_TEAM_ID and PLAY_APP_SIGNING_SHA256 not supplied/,
  );
  assert.throws(
    () => mod.resolveCredentials({ APPLE_TEAM_ID: GOOD_TEAM }, { strict: true }),
    /PLAY_APP_SIGNING_SHA256 not supplied/,
  );

  // A malformed value is rejected in BOTH modes. A wrong fingerprint does not
  // announce itself — it fails verification silently, days later, on a device.
  for (const strict of [false, true]) {
    assert.throws(
      () =>
        mod.resolveCredentials(
          { APPLE_TEAM_ID: "com.bancooom.app", PLAY_APP_SIGNING_SHA256: GOOD_FP },
          { strict },
        ),
      /not a Team ID/,
    );
    assert.throws(
      () =>
        mod.resolveCredentials(
          { APPLE_TEAM_ID: GOOD_TEAM, PLAY_APP_SIGNING_SHA256: "deadbeef" },
          { strict },
        ),
      /not a SHA-256 fingerprint/,
    );
  }

  // Non-strict with nothing supplied is the landing/market/admin build: allowed
  // through, but reported as unfilled so the warning banner prints.
  const relaxed = mod.resolveCredentials({}, { strict: false });
  assert.equal(relaxed.mode, "passthrough");
  assert.deepEqual(relaxed.missing, ["APPLE_TEAM_ID", "PLAY_APP_SIGNING_SHA256"]);

  // Both shapes a human actually pastes resolve to the same rendered file.
  for (const fp of [GOOD_FP, "ab".repeat(32)]) {
    const creds = mod.resolveCredentials(
      { APPLE_TEAM_ID: GOOD_TEAM.toLowerCase(), PLAY_APP_SIGNING_SHA256: fp },
      { strict: true },
    );
    assert.equal(creds.mode, "render");
    const out = mod.renderTemplate(
      "assetlinks.json",
      fs.readFileSync(path.join(root, "deploy/coolify/well-known/assetlinks.json"), "utf8"),
      creds,
    );
    assert.doesNotMatch(out, /REPLACE_/);
    assert.deepEqual(JSON.parse(out)[0].target.sha256_cert_fingerprints, [GOOD_FP]);
  }

  // And a template that grows an unknown placeholder must not render as if filled.
  assert.throws(
    () =>
      mod.renderTemplate(
        "assetlinks.json",
        '{"a":"REPLACE_SOMETHING_NEW","p":"com.bancooom.app"}',
        { teamId: GOOD_TEAM, fingerprint: GOOD_FP },
      ),
    /REPLACE_/,
  );
});

test("custom scheme bancooom remains in app.json", () => {
  const json = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "app.json"), "utf8"));
  assert.equal(json.expo.scheme, "bancooom");
});

test("Expo product identity stays canonical (BANCO / com.bancooom.app)", () => {
  const json = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "app.json"), "utf8"));
  assert.equal(json.expo.name, "BANCO");
  assert.equal(json.expo.ios?.bundleIdentifier, CANONICAL_PACKAGE);
  assert.equal(json.expo.android?.package, CANONICAL_PACKAGE);
  assert.notEqual(json.expo.ios?.bundleIdentifier, FORBIDDEN_PACKAGE);
  assert.notEqual(json.expo.android?.package, FORBIDDEN_PACKAGE);
  // Slug may stay bancoboom for EAS project continuity — scheme/package are SoT.
  assert.equal(json.expo.scheme, "bancooom");
});

test("usesAppleSignIn is backed by expo-apple-authentication plugin", () => {
  const json = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "app.json"), "utf8"));
  assert.equal(json.expo.ios?.usesAppleSignIn, true);
  const plugins = JSON.stringify(json.expo.plugins ?? []);
  assert.match(plugins, /expo-apple-authentication/);
  const pkg = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "package.json"), "utf8"));
  assert.ok(
    pkg.dependencies?.["expo-apple-authentication"],
    "expo-apple-authentication must be a runtime dependency",
  );
  const types = json.expo.ios?.privacyManifests?.NSPrivacyAccessedAPITypes ?? [];
  assert.ok(Array.isArray(types) && types.length > 0, "iOS privacy manifests must not be empty");
});

test("native production config keeps ATS and location scope least-privilege", () => {
  const json = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "app.json"), "utf8"));
  const ats = json.expo.ios?.infoPlist?.NSAppTransportSecurity;
  assert.equal(ats?.NSAllowsArbitraryLoads, false);
  assert.equal(ats?.NSAllowsLocalNetworking, true);
  assert.deepEqual(Object.keys(ats?.NSExceptionDomains ?? {}), ["localhost"]);
  assert.equal(
    ats.NSExceptionDomains.localhost.NSExceptionAllowsInsecureHTTPLoads,
    true,
  );

  const locationPlugin = (json.expo.plugins ?? []).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-location",
  );
  assert.ok(locationPlugin, "expo-location config plugin must remain installed");
  assert.equal(locationPlugin[1]?.locationAlwaysPermission, false);
  assert.equal(locationPlugin[1]?.locationAlwaysAndWhenInUsePermission, false);
  assert.match(locationPlugin[1]?.locationWhenInUsePermission ?? "", /BANCO/);
  assert.notEqual(locationPlugin[1]?.isIosBackgroundLocationEnabled, true);
  assert.notEqual(locationPlugin[1]?.isAndroidBackgroundLocationEnabled, true);
});

test("EAS builds refuse replit.com router origin fallback", () => {
  const src = fs.readFileSync(APP_CONFIG, "utf8");
  assert.match(src, /EAS_BUILD/);
  assert.match(src, /replit\.com/i);
  assert.match(src, /EAS build refused/);
});
