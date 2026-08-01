# 57 — Production inventory & harmony (SoT tip)

**SoT:** `waelzaid66-max/banco-with-wael` **ONLY**  
**Tip at inventory start:** `0109c2f` (main after PR #8)  
**Date (UTC):** 2026-07-30  
**Method:** Independent static inventory of API · mobile · Coolify web · gates · live probes. Claims require file evidence.  
**Identity:** `BANCO` / scheme `bancooom` / package `com.bancooom.app`  
**Honest stamp:** ✅ Repository Ready · ❌ Live Production Not Certified

---

## 1. Monorepo surface (complete)

| Package | Role | Coolify / EAS |
|---------|------|----------------|
| `artifacts/api-server` | Express API `@workspace/api-server` | compose `api:8080` |
| `artifacts/banco-mobile` | Expo SDK 54 primary product | **EAS only** |
| `artifacts/landing` | Apex Vite SPA | compose `web` `/` |
| `artifacts/dealer-os` | Market / dealer Vite SPA | `web` `/market/` |
| `artifacts/admin-os` | Admin Vite SPA | `web` `/admin/` |
| `artifacts/banco-web` | Next.js consumer | compose `banco-web:3000` |
| `artifacts/banco-website` | Next.js twin | compose `banco-website:3001` |
| `artifacts/mockup-sandbox` | Design sandbox | **not** Coolify production |
| `lib/db` | Drizzle schema + push | migrate profile |
| `lib/api-spec` | OpenAPI SoT | codegen → client/zod |
| `lib/api-client-react` | Generated client | mobile + webs |
| `lib/api-zod` | Generated zod | server/client |
| `lib/search-contract` | Search DTO contract | mobile + API |
| `lib/taxonomy` | Listing taxonomy | mobile |
| `lib/design-tokens` | Tokens | website |
| `lib/integrations-openai-ai-server` | OpenAI server helper | API |

Sister repos (`bancoo`, `bancoboom`, …) are **not** Coolify SoT.

---

## 2. Coolify compose map (do not rename services)

| Service | Image | Public | Health |
|---------|-------|--------|--------|
| `postgres` | postgres:16 | internal | `pg_isready` |
| `migrate` | API builder | one-shot profile | — |
| `api` | `banco-api` | 8080 | compose **`/api/readyz`** |
| `banco-web` | `banco-web` | 3000 | `/api/healthz` |
| `banco-website` | `banco-website` | 3001 | `/api/healthz` |
| `web` | `banco-web-static` (nginx) | **80** | `/nginx-health` |

**Recommended apex:** service **`web:80`** → `/` + `/market/` + `/admin/` + `/api/` proxy + `/.well-known/`.

---

## 3. API inventory (harmony)

- Mounts: `/` · `/api` (health) · `/api/v1/*` · `/api/__clerk` · SEO `/l/:id` `/sitemap.xml` `/robots.txt`
- Health: `GET /api/healthz` · `/api/livez` · `/api/readyz` (DB + money tables)
- Auth: Clerk middleware + `requireAuth` / `requireDbUser`; tombstone → `ACCOUNT_DELETED`
- Delete account: `DELETE /api/v1/users/me` purges KYC `documents: string[]` + blobs
- Money: wallet + Paymob webhook/return **live** (credentials OPS); ledger via `WalletService.applyTransaction`
- Storage: production Coolify **must** `OBJECT_STORAGE_PROVIDER=s3` (replit refused)
- OpenAPI parity (this PR): added `GET /v1/uploads/objects/{path}`, `PATCH /v1/import-orders/{id}/stage`, `POST /v1/import-orders/{id}/cancel`

---

## 4. Mobile inventory (harmony)

- Identity exact: BANCO / bancooom / `com.bancooom.app`
- Links: H2 merge (`lib/link-host-merge.mjs`) + well-known templates for `/l` + `/listing`
- Maps: **Leaflet WebView** (`mapHtml.ts` / unpkg) — not Google native maps
- Deps cleaned this PR: removed unused `react-native-maps` + `@types/google.maps`; `@expo/vector-icons` → **devDependencies** (icons.test contract)
- EAS: profiles present; production env bake = dashboard only
- Feature screens live: search, listings, chat, upload, wallet, plans, business/B2B, import tracking, etc.

---

## 5. Landing domain hops (P2-M7 close)

| Host | Before | After (this PR) |
|------|--------|-----------------|
| `banco.deals` | `/dealer-os/` (301→market) | **`https://banco.today/market/`** direct |
| `banco.autos` | `/banco-mobile/` (**dead** on nginx) | **`VITE_WEB_URL` if https, else `https://banco.today/`** |

Confidence gate now forbids `/banco-mobile/` hops.

---

## 6. Gates re-run (this branch)

Recorded after fixes (commands from repo root):

| Gate | Expect |
|------|--------|
| `node --check scripts/production-confidence-check.mjs` | PASS (BOM removed) |
| `node scripts/production-confidence-check.mjs --skip-typecheck` | PASS |
| `node scripts/chain-integrity-gate.mjs` | 167/167 |
| `node scripts/verify-deploy-artifacts.mjs` | 37/37 |
| `pnpm --filter @workspace/banco-mobile test` | PASS |
| `pnpm ops:live-cutover` | exit 1 `NOT_CUTOVER` until DNS |

---

## 7. Classification

| Bucket | Count note |
|--------|------------|
| **OPEN_IN_REPO** after this PR | **0** (inventory defects closed) |
| **REQUIRES_EXTERNAL_OPS** | Coolify secrets, migrate, DNS off Replit/Horizons, REPLACE_*, EAS bake, device smoke, Paymob live, store accounts |

Operator path: `COOLIFY_DEPLOY_NOW.md` → `OPS_GO_LIVE_CHECKLIST.md` → `pnpm ops:live-cutover`.

---

## 8. Live baseline (unchanged until OPS)

| Probe | Result |
|-------|--------|
| `banco.today` | Replit “isn't live yet” 404 |
| `www.banco.today` | Hostinger Horizons 200 |
| `/api/readyz` | Replit HTML 404 |
| well-known | Replit HTML 404 |

See also `56-LIVE-CUTOVER-BASELINE.md`.
