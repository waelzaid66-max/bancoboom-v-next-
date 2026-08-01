# W2-SUP-01 — Migrations / Dual Next peer-review

**Seat:** Idle / Support (Owner-activated Wave 2 §D)  
**Tip:** `cursor/final-production-acceptance-e37c` @ `34aef42`  
**Date:** 2026-07-31  
**Mode:** Docs only — no code

## Verdict

Prod schema path is intentional **`drizzle-kit push --force`**, not versioned SQL migrations. No `migrations/` journal. Boot `ensureSchemaPatches` is a narrow safety net. Coolify Next SoT is **`banco-website`**; `banco-web` is frozen/profile-gated.

---

## 1. How schema is applied

| Mechanism | Behavior | Severity | Evidence | Owner |
|-----------|----------|----------|----------|-------|
| Coolify `migrate` profile | `pnpm --filter @workspace/db run push -- --force` | Info | `docker-compose.coolify.yml` migrate service | OPS |
| Package scripts | `push` / `push-force` only — no generate/migrate | High | `lib/db/package.json` | Architect |
| Drizzle config | No `out` migrations dir | High | `lib/db/drizzle.config.ts` | Architect |
| `ensureSchemaPatches` | `upload_claims` + notification enums only | Critical if mistaken for full migrate | `lib/db/src/ensureSchema.ts` | Architect |
| Boot on patch fail | Logs; continues | High | `api-server/.../bootstrap.ts` | Reliability |
| `/readyz` | Fail-closed on missing `upload_claims` only | High | `routes/health.ts` | Reliability |
| Import tables | Need push; missing → 503 | Critical if migrate skipped | schema + `importOrderController` | OPS |
| CTO ledger | Versioned migrations OPEN | High | `61-ACTING-CTO-AUTHORITY-AND-RISK-LEDGER.md` | Chair |

## 2. Push-force risks

| Risk | Severity | Owner |
|------|----------|-------|
| No journal / replay | High | Architect |
| `--force` destructive on rename/drop | Critical | OPS + Architect |
| API “ready” while import tables missing | Critical | OPS + Reliability |
| No rollback | High | Architect / OPS |
| W1 “versioned migrations strategy doc” still owed (W2 REL-04 was reassigned to i18n) | Medium | Chair → Architect |

## 3. Dual Next

| Item | Finding | Severity | Evidence |
|------|---------|----------|----------|
| Coolify Next SoT | **`banco-website`** always on | Info | `COOLIFY_DEPLOY_NOW.md`, compose |
| `banco-web` | Frozen · `profiles: ["legacy-banco-web"]` | Info | `FROZEN.md`, compose |
| Settings route | Website has `/workspace/settings`; web twin does not | Medium | page inventory |
| Soft-hide copy | Website Hide; frozen web still Delete | Medium | `workspace-ui-copy.ts` twins |

## 4. Recommendations (Chair)

1. Keep push-force as Coolify SoT until Architect designs versioned migrations.  
2. Require **OPS written proof** migrate ran (esp. import tables) before import prod claims.  
3. Commission Architect versioned-migrations design doc.  
4. Affirm `banco-website` SoT; schedule twin archive.  
5. Do not expand `ensureSchemaPatches` to full schema this wave (W2 rejected boot-fatal expansion).

## Finding rollup

| ID | Severity | Recommended owner |
|----|----------|-------------------|
| M-01 No migrations journal | High | Architect |
| M-03 ensureSchema ≠ import tables; readyz gap | Critical | OPS + Reliability |
| M-04 push-force data-loss risk | High | Architect |
| N-02 settings missing on frozen twin | Medium | Architect |
| N-03 Delete copy on frozen twin | Medium | Architect |

**Grade:** CONDITIONAL ACCEPT of current ops model for Wave 2 Idle scope; OPEN strategy debt on versioned migrations; OPEN OPS migrate attestation.
