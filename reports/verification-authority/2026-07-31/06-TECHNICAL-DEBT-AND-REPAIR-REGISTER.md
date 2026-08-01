# 06 — Technical Debt Register & Repair Recommendations

**Authority:** Verification only — recommendations for Chief Production Architect assignment  
**Complexity scale:** S (hours) · M (multi-day engineering) · L (cross-team / multi-system)

---

## Repair Recommendation Register

### RR-01 — DNS + Coolify cutover (P0)

| Field | Content |
|-------|---------|
| Problem | Apex/www/associated domains do not serve Coolify API/nginx |
| Evidence | Live probes 2026-07-31 (§05); Replit + Horizons HTML |
| Priority | **P0** |
| Root cause | DNS / hosting still on placeholder platforms |
| Required changes | Ops only: Coolify resource, secrets, migrate, DNS, smoke |
| Dependencies | Secrets inventory; S3; Clerk live keys |
| Regression risk | Low in Git; high if cutover without migrate/secrets |
| Validation | `pnpm ops:live-cutover` exit 0; curls in OPS checklist §C |
| Complexity | M (ops) |
| Owner | Ops / Production Architect |
| Production impact | Unblocks mobile API, well-known, SEO, website |

### RR-02 — Well-known real store IDs (P0)

| Field | Content |
|-------|---------|
| Problem | AASA/assetlinks contain REPLACE_* placeholders |
| Evidence | `deploy/coolify/well-known/*` |
| Priority | **P0** (for store links; after DNS) |
| Root cause | Apple Team ID / Play SHA cannot be invented in Git |
| Required changes | Replace placeholders; redeploy `web` |
| Dependencies | Apple + Play consoles |
| Regression risk | Low |
| Validation | JSON responses; device Universal/App Links |
| Complexity | S |
| Owner | Mobile release owner |
| Production impact | Deep links / verified app links |

### RR-03 — EAS production env + device smoke (P0)

| Field | Content |
|-------|---------|
| Problem | Mobile cannot be store/live certified without baked env + device proof |
| Evidence | Empty `eas.json` env; OPS §F; no device run this session |
| Priority | **P0** |
| Root cause | Secrets/config live in EAS dashboard by design |
| Required changes | Set EXPO_PUBLIC_*; production builds; smoke journeys |
| Dependencies | RR-01 live API |
| Regression risk | Medium (wrong origin bake) |
| Validation | Sign-in → feed → create → upload → chat → delete account |
| Complexity | M |
| Owner | Mobile release owner |
| Production impact | Store readiness |

### RR-04 — Root documentation SoT hygiene (P1)

| Field | Content |
|-------|---------|
| Problem | README / STATUS / dual-repo docs name wrong primary remotes |
| Evidence | README lines 9–12 vs `git remote`; OPS checklist correct |
| Priority | **P1** |
| Root cause | Multi-fork history; docs not rewritten after SoT lock |
| Required changes | Rewrite primary remote to `banco-with-wael`; mark mirrors as secondary; stamp fingerprint JSON outdated |
| Dependencies | Architect confirmation of mirror policy |
| Regression risk | Low |
| Validation | Grep for `-BANCO-CA-OOM-` as “primary” returns zero |
| Complexity | S |
| Owner | Docs / Architect |
| Production impact | Prevents agents deploying/syncing wrong repo |

### RR-05 — Serialize concurrent certification PRs (P1)

| Field | Content |
|-------|---------|
| Problem | Multiple draft audit/acceptance PRs can contradict stamps |
| Evidence | Open #12, #30, #32, #34 at audit time |
| Priority | **P1** |
| Root cause | Parallel agents without single certification owner |
| Required changes | Architect merge order; single living stamp doc; close superseded drafts |
| Dependencies | None |
| Regression risk | Medium (doc thrash) |
| Validation | One authoritative readiness doc points to tip SHA |
| Complexity | S–M |
| Owner | Chief Production Architect |
| Production impact | Decision clarity |

### RR-06 — Align non-Coolify compose / AWS website image (P2)

| Field | Content |
|-------|---------|
| Problem | `docker-compose.prod.yml` still runs frozen `banco-web`; AWS CD omits `banco-website` |
| Evidence | compose files; `.github/workflows/deploy.yml` |
| Priority | **P2** |
| Root cause | Topology evolved to Coolify + canonical website |
| Required changes | Profile-gate or remove default `banco-web`; decide AWS website strategy |
| Dependencies | Architect cloud strategy |
| Regression risk | Medium for AWS path |
| Validation | Compose profiles documented; CD builds intended images |
| Complexity | M |
| Owner | Platform / Deploy |
| Production impact | Prevents wrong surface in non-Coolify deploys |

### RR-07 — Versioned database migrations (P2)

| Field | Content |
|-------|---------|
| Problem | Schema evolution via push + ensureSchema risks environment skew |
| Evidence | No `migrations/` tree; drizzle push scripts; ensureSchema |
| Priority | **P2** |
| Root cause | Speed-oriented schema workflow |
| Required changes | Introduce drizzle migrate workflow; freeze push for prod |
| Dependencies | RR-01 migrate discipline short-term |
| Regression risk | High if botched mid-flight |
| Validation | Fresh DB from migrations only; CI migrate check |
| Complexity | L |
| Owner | Backend platform |
| Production impact | Safer multi-env schema |

### RR-08 — Observability upgrade (P2)

| Field | Content |
|-------|---------|
| Problem | No Sentry/Crashlytics/APM; metrics in-memory per instance |
| Evidence | `errorReporter.ts`, `metrics.ts`, mobile `crashLog.ts` |
| Priority | **P2** |
| Root cause | Product choice / deferred |
| Required changes | Choose vendor; wire mobile+API; alert routes |
| Dependencies | Privacy review |
| Regression risk | Low–medium |
| Validation | Forced error appears in vendor UI |
| Complexity | M |
| Owner | Platform |
| Production impact | Faster incident response |

### RR-09 — Maps CDN hardening (P3)

| Field | Content |
|-------|---------|
| Problem | Leaflet/markercluster loaded from unpkg |
| Evidence | `mapHtml.ts` CDN URLs; gap G45 |
| Priority | **P3** |
| Root cause | Expo Go friendly WebView design |
| Required changes | Vendor assets self-host or pin integrity hashes |
| Dependencies | None |
| Regression risk | Low |
| Validation | Map loads with CDN blocked |
| Complexity | S–M |
| Owner | Mobile |
| Production impact | Offline/CDN outage resilience |

### RR-10 — Messenger realtime (P3 product)

| Field | Content |
|-------|---------|
| Problem | Poll-only chat vs “Messenger-like realtime” expectation |
| Evidence | messenger wiring guard; messages screens |
| Priority | **P3** (product), not deploy blocker |
| Root cause | Architecture choice |
| Required changes | Only if Architect requires websockets/SSE |
| Dependencies | Infra capacity |
| Regression risk | High |
| Validation | Latency SLOs on message delivery |
| Complexity | L |
| Owner | Product + Backend |
| Production impact | UX only |

### RR-11 — Admin financing export typed client (P3)

| Field | Content |
|-------|---------|
| Problem | Raw `fetch` bypasses generated client for CSV export |
| Evidence | `admin-os/src/pages/financing.tsx` |
| Priority | **P3** |
| Root cause | Blob download convenience |
| Required changes | Shared download helper using auth mutator or documented exception |
| Dependencies | None |
| Regression risk | Low |
| Validation | Export still works authenticated |
| Complexity | S |
| Owner | Admin web |
| Production impact | Contract consistency |

---

## Technical Debt Register (condensed)

| ID | Debt | Severity | Trend |
|----|------|----------|-------|
| TD-01 | Dual/frozen web surfaces | P1 | Managed but incomplete cutover |
| TD-02 | Multi-cloud deploy parity | P2 | Coolify ahead of AWS/GCP web |
| TD-03 | Push-mode schema | P2 | Stable short-term, risky long-term |
| TD-04 | Doc corpus sprawl / contradictory stamps | P1 | Worsening with parallel agents |
| TD-05 | External OPS blockers dominate readiness | P0 | Unchanged by code merges |
| TD-06 | Poll chat / CDN maps / no APM | P2–P3 | Accepted soft gaps |

---

## Explicit non-actions (Verification Authority)

- Will **not** invent Apple Team ID / Play SHA / Clerk secrets / Paymob live keys.
- Will **not** independently redesign messenger/maps architecture.
- Will **not** declare Live Production Ready without probe + cutover gate evidence.
