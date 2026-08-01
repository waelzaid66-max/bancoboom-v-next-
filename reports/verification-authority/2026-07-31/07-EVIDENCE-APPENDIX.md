# 07 — Evidence Appendix

**Collected:** 2026-07-31T11:40Z UTC (±)  
**Workspace tip:** `06c709a1fe18ceaa19a20e47cd01bac2a1d6aca3`

---

## A. Git identity

```
origin  https://github.com/waelzaid66-max/banco-with-wael
HEAD    06c709a1fe18ceaa19a20e47cd01bac2a1d6aca3
message Merge pull request #33 from waelzaid66-max/cursor/prod-messenger-publish-53de
```

Recent main lineage (abbrev):

```
06c709a Merge PR #33 prod-messenger-publish
f42c1e5 fix(prod): messenger contact honesty + publish phone SoT
aca65ef Merge PR #31 coolify-docker-prod
5765234 fix(coolify): nginx SEO, S3 fail-closed, trust hops
726c572 Merge PR #29 production-stabilize
```

---

## B. Live HTTPS probes

Commands:

```bash
curl -sS -m 10 -w '%{http_code}' https://banco.today/nginx-health
curl -sS -m 10 -w '%{http_code}' https://banco.today/api/readyz
curl -sS -m 10 -w '%{http_code}' https://banco.today/.well-known/assetlinks.json
curl -sS -m 10 -w '%{http_code}' https://www.banco.today/
curl -sS -m 10 -w '%{http_code}' https://banco.deals/
curl -sS -m 10 -w '%{http_code}' https://banco.autos/
```

Results (summary):

| URL | Code | Snippet |
|-----|------|---------|
| banco.today/nginx-health | 404 | `<title>This app isn't live yet</title>` (Replit) |
| banco.today/api/readyz | 404 | same |
| banco.today/.well-known/assetlinks.json | 404 | same |
| www.banco.today/ | 200 | `meta name="generator" content="Hostinger Horizons"` |
| banco.deals/ | 404 | Replit placeholder |
| banco.autos/ | 000 | `SSL certificate problem: self-signed certificate` |

---

## C. Inventory counts (commands)

```bash
wc -l lib/db/src/schema/index.ts lib/api-spec/openapi.yaml
# 2750 schema · 10696 openapi

ls artifacts/api-server/src/routes/v1/*.ts | wc -l   # 31
find artifacts/api-server -name '*.test.ts' | wc -l  # 79
ls artifacts/banco-mobile/tests/*.test.mjs | wc -l   # 18
```

Static analyses (subagent / ripgrep style; not re-pasted in full):

- OpenAPI operations ≈ 173; Express route verbs ≈ 173
- Drizzle tables = 69
- Soft-delete columns on users + conversations

---

## D. CI evidence (`gh run list --branch main`)

```
success  Merge PR #33 …  CI  main  push  30626686283  2m14s  2026-07-31T11:20:30Z
success  Merge PR #31 …  CI / CI Website / CI Website Docker
```

---

## E. Well-known placeholders

```
deploy/coolify/well-known/apple-app-site-association
  appID: REPLACE_APPLE_TEAM_ID.com.bancooom.app

deploy/coolify/well-known/assetlinks.json
  sha256_cert_fingerprints: ["REPLACE_PLAY_APP_SIGNING_SHA256"]
```

---

## F. Environment / tooling limits this session

| Check | Result |
|-------|--------|
| `node_modules` | Absent |
| Local typecheck / vitest / mobile tests | **UNVERIFIED** |
| Docker build | **UNVERIFIED** |
| EAS build | **UNVERIFIED** |
| Coolify UI secrets | **UNVERIFIED** |
| `pnpm audit` | **UNVERIFIED** |

Rely on GitHub Actions success for tip CI claims; do not confuse with live production.

---

## G. Prior authoritative ops docs (claims cross-checked)

| Doc | Still valid claim |
|-----|-------------------|
| `OPS_GO_LIVE_CHECKLIST.md` | SoT repo + stamp “Live Production Not Certified” — **YES** |
| `reports/production-verification/PRODUCTION_GAP_MATRIX.md` | External OPS blockers — **YES** (re-probed) |
| `reports/production-verification/FINAL_RELEASE_CERTIFICATION.md` | Live not certified — **YES**; tip SHA outdated |
| `reports/ProductionFingerprint.json` | Current readiness — **NO** (stale SHA/repo) |
| Root `README.md` primary remote list | **NO** (names old primary) |

---

## H. Method integrity statement

Every PASS/FAIL in this pack is either:

1. Directly observed (probe, `gh`, filesystem count, file read), or  
2. Explicitly marked **UNVERIFIED**, or  
3. Cited as a prior claim with tip/date caveats.

No production architecture was modified by Verification Authority.
