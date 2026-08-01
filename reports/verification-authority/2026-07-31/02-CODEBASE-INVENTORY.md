# 02 — Codebase Inventory

**Tip:** `06c709a` · Counts from filesystem enumeration 2026-07-31

---

## 1. Workspace packages

**Workspace:** `pnpm-workspace.yaml` → `artifacts/*`, `lib/*`, `scripts`  
**Package manager:** `pnpm@11.9.0` (root `package.json`)  
**Catalog pins:** React `19.1.0`, Next `^15.3.4` (lock `15.5.20`), Vite `^7.3.2` (lock `7.3.5`), Zod `3.25.76`, Drizzle catalog

### Applications (`artifacts/`)

| Package | Path | Stack | Role |
|---------|------|-------|------|
| `@workspace/api-server` | `artifacts/api-server` | Node 24 · Express 5 · Vitest | Backend |
| `@workspace/banco-mobile` | `artifacts/banco-mobile` | Expo 54 · RN 0.81.5 · expo-router | Consumer mobile |
| `@workspace/banco-website` | `artifacts/banco-website` | Next 15 | Canonical website |
| `@workspace/banco-web` | `artifacts/banco-web` | Next 15 | **Frozen** consumer web |
| `@workspace/admin-os` | `artifacts/admin-os` | Vite 7 · React 19 | Admin control |
| `@workspace/dealer-os` | `artifacts/dealer-os` | Vite 7 · React 19 | Dealer/market OS |
| `@workspace/landing` | `artifacts/landing` | Vite 7 · React 19 | Public landing |
| `@workspace/mockup-sandbox` | `artifacts/mockup-sandbox` | Vite | Non-production mockups |

### Libraries (`lib/`)

| Package | Role |
|---------|------|
| `@workspace/db` | Drizzle schema (`src/schema/index.ts`, 2750 lines) |
| `@workspace/api-spec` | OpenAPI 3.1 + orval |
| `@workspace/api-client-react` | Generated react-query client |
| `@workspace/api-zod` | Generated zod schemas |
| `@workspace/design-tokens` | Shared tokens |
| `@workspace/search-contract` | Search contract + tests |
| `@workspace/taxonomy` | Taxonomy helpers |
| `@workspace/integrations-openai-ai-server` | OpenAI server integration |

### Tooling

- `scripts/` — confidence, chain integrity, website audits, live cutover, deploy verifies
- `.github/workflows/` — `ci.yml`, `ci-website.yml`, `ci-website-docker.yml`, `deploy.yml`, sync workflows
- `deploy/coolify|aws|gcp/` — Dockerfiles, nginx, compose, env examples
- `audit/`, `reports/`, `release/`, `docs/` — large documentation corpus

---

## 2. Database tables (Drizzle)

**Source:** `lib/db/src/schema/index.ts` — **69** `pgTable` declarations:

`brands`, `models`, `car_variants`, `locations`, `property_types`, `finishing_types`, `ownership_types`, `industrial_types`, `industries`, `users`, `upload_claims`, `listings`, `listing_attributes`, `candidate_attributes`, `candidate_attribute_seen`, `listing_media`, `payment_options`, `interactions`, `ads`, `audit_log`, `rate_events`, `dedup_keys`, `lead_history`, `lead_tokens`, `saved_listings`, `listing_comments`, `seller_reviews`, `conversations`, `messages`, `notifications`, `push_tokens`, `user_social_links`, `notification_preferences`, `saved_searches`, `stories`, `story_views`, `user_behavior`, `plans`, `transactions`, `subscriptions`, `lead_billing`, `payment_intents`, `payment_provider_config`, `email_provider_config`, `promo_ad_campaign_config`, `promo_ad_transactions`, `promo_ad_grants`, `invoices`, `reports`, `support_tickets`, `support_ticket_messages`, `listing_links`, `company_profiles`, `rfqs`, `rfq_offers`, `investment_opportunities`, `investment_interests`, `company_follows`, `global_supply_requests`, `global_supply_responses`, `financing_intermediaries`, `financing_branches`, `financing_seats`, `financing_requests`, `import_orders`, `import_order_documents`, `reference_developers`, `reference_places`, `pending_locations`, `price_observations`, `bookings`

**Relations:** ~102 `.references()` · heavy index usage (~250 index/unique/check occurrences)  
**Soft delete:** `users.deleted_at`; conversation buyer/seller deleted timestamps  
**Migrations:** `drizzle-kit push` + `ensureSchema.ts` boot patches — **no versioned migrations directory found**

---

## 3. API surface

| Metric | Count | Evidence |
|--------|------:|----------|
| OpenAPI path entries | 146 | `lib/api-spec/openapi.yaml` |
| OpenAPI operations | 173 | same |
| Express route verb regs (`src/routes`) | 173 | static scan |
| v1 route modules | 30 (+ index) | `src/routes/v1/*.ts` |
| Controllers | 33 | `src/controllers` |
| Vitest test files | 79 | `**/*.test.ts` |
| Approx vitest `it(`/`test(` blocks | ~402 | static |
| Extra node test | 1 | `tests/seed-production-guard.test.mjs` |

**Mount:** `/api` + `/api/v1/*`; health under `/api`; Clerk proxy `/api/__clerk`; SEO `/l/:id`, sitemap, robots.

---

## 4. Mobile inventory highlights

| Item | Evidence |
|------|----------|
| Expo `~54.0.36`, RN `0.81.5`, React `19.1.0` | `package.json` / lock |
| Identity `com.bancooom.app`, scheme `bancooom`, version `1.0.0` | `app.json` |
| EAS project id present | `app.json` extra |
| Plugins | router, font, web-browser, image-picker, notifications, location, apple-auth, build-properties |
| Maps | Leaflet in WebView (`SearchResultsMap.tsx` + `mapHtml.ts`) — **not** `react-native-maps` |
| i18n | `constants/i18n.ts` EN + `ar: typeof en`; Inter/Cairo fonts |
| Tests | 18 `tests/*.test.mjs` in default script |
| Native dirs | **absent** (prebuild/EAS managed) |

---

## 5. Environment variable inventory (names)

Documented in root `.env.example` and `OPS_GO_LIVE_CHECKLIST.md`. Categories: Postgres, Clerk, session, payment encryption, S3 object storage, CORS/public URLs, Resend, OpenAI, Paymob, EAS `EXPO_PUBLIC_*`, CDN optional.

**No secret values audited** (correctly absent from Git).

---

## 6. Assets / localization / icons

- Mobile splash/icon/favicon under `artifacts/banco-mobile/assets/images/`
- Icon contract: lucide SVG path; `@expo/vector-icons` pinned exact `15.0.3` as **devDependency** (workspace override)
- Localization: compile-time EN/AR parity on mobile; website localization depth **not fully enumerated this session** → partial **UNVERIFIED**

---

## 7. Inventory completeness note

Full enumeration of every hook/context/SVG across all surfaces exceeds a single static pass. Counts above are **verified**. Exhaustive per-file asset catalogs remain available via prior `audit/ARCHITECTURE-FILE-INDEX.md` / production-verification series — treat those as aids, re-verify before acting.
