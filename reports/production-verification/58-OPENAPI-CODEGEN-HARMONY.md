# 58 — OpenAPI codegen harmony + Coolify apex doc lock

**SoT tip base:** `238e34a`  
**Branch:** `cursor/openapi-codegen-harmony-5cf0`  
**Date (UTC):** 2026-07-30  
**Honest stamp:** Repository Ready · Live Production Not Certified

---

## Defects closed this turn (evidence)

| ID | Finding | Fix |
|----|---------|-----|
| G71 | OpenAPI PR #9 paths present but **orval clients stale** (`serveUploadObject`, `updateImportOrderStage`, `cancelImportOrder` absent from generated packages) | `pnpm --filter @workspace/api-spec run codegen` committed |
| G72 | OpenAPI omitted Express `GET /api` root liveness | `operationId: apiRootLiveness` + regen |
| G73 | No CI/confidence gate for codegen freshness | `checkOpenApiCodegenFreshness` — all OpenAPI `operationId`s must appear in `api-client-react` and PascalCase in `api-zod` |
| G74 | `docs/DEPLOY_COOLIFY.md` architecture diagram mapped apex → `banco-website` | Diagram rewritten: apex → **`web:80`**; Next twins optional split hosts only |
| G75 | Confidence lacked Coolify apex doc lock | `checkCoolifyDocsApex` |

---

## Route ↔ OpenAPI ↔ client (post-fix)

- Express-live vs OpenAPI: **parity** (only historical note: wildcard upload path documented as `{path}`)
- Generated: `serveUploadObject`, `updateImportOrderStage`, `cancelImportOrder`, `apiRootLiveness` present
- Gate: `node scripts/production-confidence-check.mjs` fails closed if codegen drifts

---

## Not claimed

Live DNS still Replit/Horizons. Run `pnpm ops:live-cutover` after Coolify + DNS.

**OPEN_IN_REPO: 0** after this PR merges.
