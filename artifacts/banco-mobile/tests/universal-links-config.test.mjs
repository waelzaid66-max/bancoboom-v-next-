import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
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

test("EAS builds refuse replit.com router origin fallback", () => {
  const src = fs.readFileSync(APP_CONFIG, "utf8");
  assert.match(src, /EAS_BUILD/);
  assert.match(src, /replit\.com/i);
  assert.match(src, /EAS build refused/);
});
