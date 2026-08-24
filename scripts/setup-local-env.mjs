#!/usr/bin/env node
// setup-local-env — make a fresh clone runnable in one step.
//
// Owner instruction 2026-08-24: "عاوز انزل البرنامج من ريبو واحد بملفات تشغيلية".
// Clone, `pnpm run setup`, fill the secrets, `pnpm start`. Nothing else.
//
// This copies .env.example to .env when .env is absent, then reports exactly
// which values still need a real secret. It NEVER overwrites an existing .env —
// that file holds live credentials.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = path.join(root, ".env.example");
const target = path.join(root, ".env");

if (!existsSync(example)) {
  console.error("[setup] .env.example is missing — cannot derive a local environment.");
  process.exit(1);
}

if (existsSync(target)) {
  console.log("[setup] .env already exists — left untouched (it may hold live credentials).");
} else {
  writeFileSync(target, readFileSync(example, "utf8"));
  console.log("[setup] created .env from .env.example");
}

// A value is "unfilled" when it is empty or still carries a placeholder. Report
// them by name so nobody has to diff two files by eye to find what is missing.
const PLACEHOLDER = /^(|change[_-]?me|your[_-].*|xxx+|<.*>|\.\.\.|TODO)$/i;
const unfilled = [];
for (const line of readFileSync(target, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const value = m[2].replace(/^["']|["']$/g, "").trim();
  if (PLACEHOLDER.test(value)) unfilled.push(m[1]);
}

if (unfilled.length === 0) {
  console.log("[setup] every variable has a value.\n\n  next:  pnpm start\n");
  process.exit(0);
}

console.log(
  `\n[setup] ${unfilled.length} variable(s) still need a real value in .env:\n` +
    unfilled.map((k) => `          ${k}`).join("\n") +
    `\n\n  then:  pnpm start        (full stack via docker compose)\n` +
    `         pnpm run dev     (api + web + website, no docker)\n`,
);
