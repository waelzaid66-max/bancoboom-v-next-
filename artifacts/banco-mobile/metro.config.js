const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Resolve @workspace/* packages from the monorepo root during EAS + local dev.
// Root .npmrc uses node-linker=hoisted + shamefully-hoist + public-hoist for
// Expo/react-navigation. Hierarchical lookup stays ENABLED so package-local
// and .pnpm nested installs still resolve (required on Windows when the root
// node_modules tree is incomplete after a partial clean).
// APPEND the monorepo root to Expo's default watchFolders instead of replacing
// them — replacement drops entries the SDK relies on (expo-doctor flags it and
// virtual modules/HMR can miss updates in EAS builds).
config.watchFolders = [...(config.watchFolders ?? []), monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = false;

// Replit rotates temporary skill backups under .local/skills/.old-*. Because
// this repository root is watched, Metro can otherwise retain a watcher for a
// directory that Replit removes and crash with ENOENT. Preserve Expo's default
// block list and hide only those ephemeral backup paths from Metro's file map.
const replitEphemeralSkillBackup =
  /[\\/]\.local[\\/]skills[\\/]\.old-[^\\/]+(?:[\\/]|$)/;
const defaultBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(defaultBlockList)
    ? defaultBlockList
    : defaultBlockList
      ? [defaultBlockList]
      : []),
  replitEphemeralSkillBackup,
];

module.exports = config;
