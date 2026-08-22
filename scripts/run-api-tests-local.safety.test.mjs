import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  commandExecutable,
  createCleanupController,
  databaseNameFromUrl,
  databaseUrlForChild,
  makeChildDatabaseName,
  validateExternalAdminConfig,
} from "./run-api-tests-local.mjs";

const ARM = "CREATE_DROP_RANDOM_CHILD_DB";

test("rejects an inherited arbitrary DATABASE_URL before any destructive test path", () => {
  assert.throws(
    () =>
      validateExternalAdminConfig({
        DATABASE_URL: "postgresql://user:secret@db.example.com:5432/banco",
      }),
    /Refusing inherited DATABASE_URL/,
  );
});

test("external server mode requires the explicit destructive-test arming phrase", () => {
  assert.throws(
    () =>
      validateExternalAdminConfig({
        BANCO_API_TEST_ADMIN_URL:
          "postgresql://tester:secret@127.0.0.1:5433/postgres",
        BANCO_API_TEST_EXPECT_HOST: "127.0.0.1",
        BANCO_API_TEST_EXPECT_PORT: "5433",
        BANCO_API_TEST_EXPECT_DATABASE: "postgres",
      }),
    /not armed/,
  );
});

test("external server mode rejects query-bearing admin URLs before connection semantics can drift", () => {
  assert.throws(
    () =>
      validateExternalAdminConfig({
        BANCO_API_TEST_ADMIN_URL:
          "postgresql://tester:secret@db.test.internal:5544/postgres?sslmode=require",
        BANCO_API_TEST_DISPOSABLE_CONFIRM: ARM,
        BANCO_API_TEST_EXPECT_HOST: "db.test.internal",
        BANCO_API_TEST_EXPECT_PORT: "5544",
        BANCO_API_TEST_EXPECT_DATABASE: "postgres",
      }),
    /query parameters are unsupported/,
  );
});

test("external server mode fails closed on host, port, or database identity mismatch", () => {
  const base = {
    BANCO_API_TEST_ADMIN_URL:
      "postgresql://tester:secret@db.test.internal:5544/postgres",
    BANCO_API_TEST_DISPOSABLE_CONFIRM: ARM,
    BANCO_API_TEST_EXPECT_HOST: "db.test.internal",
    BANCO_API_TEST_EXPECT_PORT: "5544",
    BANCO_API_TEST_EXPECT_DATABASE: "postgres",
  };

  assert.throws(
    () => validateExternalAdminConfig({ ...base, BANCO_API_TEST_EXPECT_HOST: "other" }),
    /identity does not match/,
  );
  assert.throws(
    () => validateExternalAdminConfig({ ...base, BANCO_API_TEST_EXPECT_PORT: "5432" }),
    /identity does not match/,
  );
  assert.throws(
    () =>
      validateExternalAdminConfig({
        ...base,
        BANCO_API_TEST_EXPECT_DATABASE: "banco_prod",
      }),
    /identity does not match/,
  );
});

test("exact external server identity contract is accepted as admin-only input", () => {
  const result = validateExternalAdminConfig({
    BANCO_API_TEST_ADMIN_URL:
      "postgresql://tester:secret@db.test.internal:5544/postgres",
    BANCO_API_TEST_DISPOSABLE_CONFIRM: ARM,
    BANCO_API_TEST_EXPECT_HOST: "db.test.internal",
    BANCO_API_TEST_EXPECT_PORT: "5544",
    BANCO_API_TEST_EXPECT_DATABASE: "postgres",
  });

  assert.deepEqual(result, {
    adminUrl: "postgresql://tester:secret@db.test.internal:5544/postgres",
    host: "db.test.internal",
    port: "5544",
    database: "postgres",
  });
});

test("generated child database names are bounded to banco_api_test_<16 hex>", () => {
  const child = makeChildDatabaseName(() => Buffer.from("0011223344556677", "hex"));
  assert.equal(child, "banco_api_test_0011223344556677");
  assert.match(child, /^banco_api_test_[a-f0-9]{16}$/);
});

test("child URL can only target a generated child name and preserves credentials/host", () => {
  const admin = "postgresql://tester:secret@127.0.0.1:5433/postgres";
  const child = "banco_api_test_0011223344556677";
  const childUrl = databaseUrlForChild(admin, child);
  const parsed = new URL(childUrl);

  assert.equal(databaseNameFromUrl(childUrl), child);
  assert.equal(parsed.hostname, "127.0.0.1");
  assert.equal(parsed.port, "5433");
  assert.equal(decodeURIComponent(parsed.username), "tester");
  assert.equal(decodeURIComponent(parsed.password), "secret");
  assert.throws(() => databaseUrlForChild(admin, "banco_test"), /unsafe child database name/);
});

test("cleanup failure remains retryable against the same target until cleanup succeeds", () => {
  let attempts = 0;
  const targets = [];
  const cleanup = createCleanupController(() => {
    targets.push("banco_api_test_0011223344556677");
    attempts += 1;
    if (attempts === 1) throw new Error("simulated drop failure");
  });

  assert.throws(() => cleanup.run(), /simulated drop failure/);
  assert.equal(cleanup.isCleaned(), false);
  cleanup.run();
  assert.equal(cleanup.isCleaned(), true);
  cleanup.run();

  assert.equal(attempts, 2);
  assert.deepEqual(targets, [
    "banco_api_test_0011223344556677",
    "banco_api_test_0011223344556677",
  ]);
});

test("DB admin commands remain direct argv and Windows pnpm resolution is isolated", () => {
  assert.equal(commandExecutable("docker", "win32"), "docker");
  assert.equal(commandExecutable("psql", "win32"), "psql");
  assert.equal(commandExecutable("pnpm", "win32"), "pnpm.cmd");
  assert.equal(commandExecutable("pnpm", "linux"), "pnpm");

  const source = readFileSync(
    new URL("./run-api-tests-local.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /\bshell\s*:/);
});

test("Docker Postgres transport avoids exec/setns and compose health wait", () => {
  const source = readFileSync(
    new URL("./run-api-tests-local.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /"exec"\s*,/);
  assert.doesNotMatch(source, /"--wait"/);
  assert.match(source, /"run"\s*,\s*"--rm"/s);
  assert.match(source, /dockerClientArgs\("pg_isready",\s*"postgres"\)/);
});
