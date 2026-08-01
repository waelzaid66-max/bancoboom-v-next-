#!/usr/bin/env node
/**
 * Live Coolify cutover gate — proves public DNS serves BANCO nginx + API JSON,
 * not Replit / Hostinger Horizons placeholders.
 *
 * Usage (from repo root):
 *   node scripts/ops-live-cutover-check.mjs
 *   node scripts/ops-live-cutover-check.mjs --base https://banco.today
 *   node scripts/ops-live-cutover-check.mjs --www https://www.banco.today
 *   node scripts/ops-live-cutover-check.mjs --allow-placeholders   # well-known may still have REPLACE_*
 *   node scripts/ops-live-cutover-check.mjs --json
 *
 * Exit codes:
 *   0 — Coolify cutover looks healthy (see Definition of Live in OPS_GO_LIVE_CHECKLIST.md)
 *   1 — one or more checks failed (still Replit/Horizons/wrong content-type/unhealthy API)
 *   2 — invalid invocation
 *
 * Does NOT invent secrets. Does NOT mark store deep-links done if REPLACE_* remain
 * (unless --allow-placeholders).
 */

const args = process.argv.slice(2);

function flagValue(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const v = args[i + 1];
  if (!v || v.startsWith("--")) {
    console.error(`Missing value after ${name}`);
    process.exit(2);
  }
  return v;
}

const base = (flagValue("--base", "https://banco.today")).replace(/\/$/, "");
const www = (flagValue("--www", "https://www.banco.today")).replace(/\/$/, "");
const allowPlaceholders = args.includes("--allow-placeholders");
const asJson = args.includes("--json");
const timeoutMs = Number(flagValue("--timeout-ms", "15000")) || 15000;

const results = [];

function pass(name, detail = "ok") {
  results.push({ name, ok: true, detail });
  if (!asJson) console.log(`[PASS] ${name}: ${detail}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  if (!asJson) console.error(`[FAIL] ${name}: ${detail}`);
}

function snip(text, n = 160) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
}

function looksLikeReplit(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("this app isn't live yet") ||
    t.includes("this app isn&#39;t live yet") ||
    t.includes("replit") ||
    t.includes("ibm plex sans")
  );
}

function looksLikeHorizons(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("hostinger horizons") ||
    t.includes("generator\" content=\"hostinger") ||
    t.includes("cdn.hstgr.net")
  );
}

function contentType(headers) {
  return (headers.get("content-type") || "").toLowerCase();
}

async function fetchOnce(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { Accept: "*/*", "User-Agent": "banco-ops-live-cutover-check/1.0" },
    });
    const text = await res.text();
    return {
      url,
      status: res.status,
      finalUrl: res.url,
      contentType: contentType(res.headers),
      text,
      okHttp: res.ok,
    };
  } catch (e) {
    return {
      url,
      status: 0,
      finalUrl: url,
      contentType: "",
      text: "",
      okHttp: false,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

function rejectWrongOrigin(name, probe, { expectJson = false } = {}) {
  if (probe.error) {
    fail(name, `network error: ${probe.error}`);
    return false;
  }
  if (looksLikeReplit(probe.text)) {
    fail(
      name,
      `Replit placeholder HTML (HTTP ${probe.status}) — point apex DNS at Coolify Traefik, not Replit`,
    );
    return false;
  }
  if (looksLikeHorizons(probe.text)) {
    fail(
      name,
      `Hostinger Horizons HTML (HTTP ${probe.status}) — point www/apex at Coolify, not Horizons`,
    );
    return false;
  }
  if (expectJson) {
    const ct = probe.contentType;
    const startsJson = /^\s*[{[]/.test(probe.text);
    if (!ct.includes("json") && !startsJson) {
      fail(
        name,
        `expected JSON, got content-type=${ct || "(none)"} body=${snip(probe.text)}`,
      );
      return false;
    }
  }
  return true;
}

async function main() {
  if (!asJson) {
    console.log(`ops-live-cutover-check base=${base} www=${www}`);
  }

  // --- Apex nginx liveness ---
  const nginx = await fetchOnce(`${base}/nginx-health`);
  if (!rejectWrongOrigin("apex /nginx-health origin", nginx)) {
    // already failed
  } else if (nginx.status !== 200 || !/^\s*ok\s*$/i.test(nginx.text.trim())) {
    fail(
      "apex /nginx-health",
      `want HTTP 200 body "ok"; got ${nginx.status} ${snip(nginx.text)}`,
    );
  } else {
    pass("apex /nginx-health", "ok");
  }

  // --- API readyz via nginx proxy ---
  const readyz = await fetchOnce(`${base}/api/readyz`);
  if (rejectWrongOrigin("apex /api/readyz origin", readyz, { expectJson: true })) {
    let body;
    try {
      body = JSON.parse(readyz.text);
    } catch {
      fail("apex /api/readyz JSON", snip(readyz.text));
      body = null;
    }
    if (body) {
      if (readyz.status !== 200) {
        fail(
          "apex /api/readyz",
          `HTTP ${readyz.status} checks=${JSON.stringify(body.checks || body)} — migrate / secrets / postgres?`,
        );
      } else if (
        body.checks?.database !== "ok" ||
        body.checks?.money_schema !== "ok" ||
        body.checks?.upload_claims !== "ok"
      ) {
        fail(
          "apex /api/readyz checks",
          `database=${body.checks?.database} money_schema=${body.checks?.money_schema} upload_claims=${body.checks?.upload_claims}`,
        );
      } else {
        pass(
          "apex /api/readyz",
          `200 database=ok money_schema=ok upload_claims=ok${body.gitSha ? ` gitSha=${body.gitSha}` : ""}`,
        );
      }
    }
  }

  // --- Well-known ---
  const assetlinks = await fetchOnce(`${base}/.well-known/assetlinks.json`);
  if (rejectWrongOrigin("assetlinks origin", assetlinks, { expectJson: true })) {
    if (assetlinks.status !== 200) {
      fail("assetlinks", `HTTP ${assetlinks.status}`);
    } else {
      let parsed;
      try {
        parsed = JSON.parse(assetlinks.text);
      } catch (e) {
        fail("assetlinks JSON", e instanceof Error ? e.message : String(e));
        parsed = null;
      }
      if (parsed) {
        const pkg =
          parsed?.[0]?.target?.package_name ||
          parsed?.[0]?.target?.packageName ||
          "";
        if (pkg && pkg !== "com.bancooom.app") {
          fail("assetlinks package", `got ${pkg}, want com.bancooom.app`);
        } else if (
          !allowPlaceholders &&
          /REPLACE_PLAY_APP_SIGNING_SHA256/i.test(assetlinks.text)
        ) {
          fail(
            "assetlinks placeholders",
            "REPLACE_PLAY_APP_SIGNING_SHA256 still present — fill Play signing SHA-256 then redeploy web (or pass --allow-placeholders)",
          );
        } else {
          pass(
            "assetlinks",
            allowPlaceholders && /REPLACE_/i.test(assetlinks.text)
              ? "JSON 200 (placeholders allowed)"
              : `JSON 200 package=${pkg || "com.bancooom.app"}`,
          );
        }
      }
    }
  }

  const aasa = await fetchOnce(`${base}/.well-known/apple-app-site-association`);
  if (rejectWrongOrigin("AASA origin", aasa, { expectJson: true })) {
    if (aasa.status !== 200) {
      fail("AASA", `HTTP ${aasa.status}`);
    } else {
      let parsed;
      try {
        parsed = JSON.parse(aasa.text);
      } catch (e) {
        fail("AASA JSON", e instanceof Error ? e.message : String(e));
        parsed = null;
      }
      if (parsed) {
        if (!allowPlaceholders && /REPLACE_APPLE_TEAM_ID/i.test(aasa.text)) {
          fail(
            "AASA placeholders",
            "REPLACE_APPLE_TEAM_ID still present — fill Apple Team ID then redeploy web (or pass --allow-placeholders)",
          );
        } else {
          pass(
            "AASA",
            allowPlaceholders && /REPLACE_/i.test(aasa.text)
              ? "JSON 200 (placeholders allowed)"
              : "JSON 200",
          );
        }
      }
    }
  }

  // --- www must not stay on Horizons ---
  const wwwHome = await fetchOnce(`${www}/`);
  if (wwwHome.error) {
    fail("www home", `network error: ${wwwHome.error}`);
  } else if (looksLikeHorizons(wwwHome.text)) {
    fail(
      "www home",
      "still Hostinger Horizons — CNAME/A must leave cdn.hstgr.net and point at Coolify (or HTTPS redirect to apex on Coolify)",
    );
  } else if (looksLikeReplit(wwwHome.text)) {
    fail("www home", "Replit placeholder on www");
  } else if (wwwHome.status >= 400) {
    fail("www home", `HTTP ${wwwHome.status} ${snip(wwwHome.text)}`);
  } else {
    pass("www home", `HTTP ${wwwHome.status} not Horizons/Replit`);
  }

  // --- Apex home should not be Replit ---
  const apexHome = await fetchOnce(`${base}/`);
  if (apexHome.error) {
    fail("apex home", `network error: ${apexHome.error}`);
  } else if (looksLikeReplit(apexHome.text)) {
    fail("apex home", "Replit “isn't live yet” — DNS still on Replit (A≈34.111.x historically)");
  } else if (looksLikeHorizons(apexHome.text)) {
    fail("apex home", "Horizons on apex — map apex to Coolify service web:80");
  } else if (apexHome.status >= 400) {
    fail("apex home", `HTTP ${apexHome.status} ${snip(apexHome.text)}`);
  } else {
    pass("apex home", `HTTP ${apexHome.status} not Replit/Horizons`);
  }

  const failed = results.filter((r) => !r.ok);
  const summary = {
    base,
    www,
    allowPlaceholders,
    passed: results.filter((r) => r.ok).length,
    failed: failed.length,
    total: results.length,
    verdict:
      failed.length === 0
        ? "COOLIFY_CUTOVER_OK"
        : "NOT_CUTOVER — follow OPS_GO_LIVE_CHECKLIST.md + COOLIFY_DEPLOY_NOW.md",
    results,
  };

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(
      `\nSummary: ${summary.passed}/${summary.total} passed · verdict=${summary.verdict}`,
    );
    if (failed.length) {
      console.error("Next: Coolify compose from waelzaid66-max/banco-with-wael main → apex→web:80 → secrets → migrate → DNS off Replit/Horizons → re-run this script.");
    }
  }

  process.exit(failed.length === 0 ? 0 : 1);
}

await main();
