# 60 — Final Production Owner Acceptance

**Role:** Final Production Owner (replacing prior agents)  
**SoT tip base:** `main` @ `aca65ef` (#31 Coolify + #29 stabilize)  
**This branch:** `cursor/final-production-acceptance-e37c`  
**Date:** 2026-07-31  
**Standard:** Legal-signature — PASS only with re-run evidence. Prior agent claims treated as claims.

---

## Executive verdict

| Question | Answer |
|----------|--------|
| **Code SoT on `main` before this PR** | **CONDITIONAL GO** — CI green after #29/#31; OPS blockers unchanged |
| **PR #30 (waves 5–7) as-is** | **REJECT** — CI red (typecheck + icons + gates) |
| **Waves 5–7 after repair (this PR)** | **ACCEPT** — absorbed + CI blockers fixed; local gates green |
| **Unconditional public production** | **NO** — DNS / Coolify secrets / EAS / device / Paymob remain OPS |

**Decision: CONDITIONAL GO** for staging Coolify deploy from this tip after merge + secrets.  
**Not signed:** live public cutover until `pnpm ops:live-cutover` exits 0 without `--allow-placeholders`.

---

## What was independently verified (this run)

| Gate | Result |
|------|--------|
| `pnpm run typecheck` (full monorepo) | **PASS** |
| `pnpm --filter @workspace/banco-mobile run test` | **PASS** (full pack) |
| `node scripts/chain-integrity-gate.mjs` | **167/167 PASS** |
| `node scripts/production-confidence-check.mjs --skip-typecheck` | **18/18 PASS** |
| `pnpm run lint` | **PASS** |
| Main tip CI after #31 | **SUCCESS** (GitHub) |
| PR #30 CI before absorb | **FAILURE** (typecheck / mobile / gates / web docker) |
| This PR (#32) CI | **SUCCESS** — CI + CI Website + CI Website Docker (all jobs) |

---

## Prior work disposition

### Kept (already on `main`, re-verified healthy)

- Coolify nginx SEO, S3 fail-closed, trust hops (**#31**)
- Expo Apple plugin, privacy manifests, EAS origin guard (**#29**)
- Messenger/maps/notif waves 1–4 + maps clerk wiring (**#26–#28**, absorb)
- Materials B-CORE, B-PROPERTIES, CAR IMPORT W1–W3, honesty tracks

### Absorbed from failing **#30** (production value, incomplete)

| Item | Why keep |
|------|----------|
| Offline Leaflet vendor (`map-vendor` + `mapVendorInline`) | Removes CDN single point of failure (MAP-07) |
| `sort=nearest` + Haversine order | Real distance ranking when Near me is on |
| Conversation `before` cursor `(created_at, id)` | Stops older-page skip / stuck prepend |
| Chat video attach + website thread hardenings | Completes MSG-14b / MSG-11b honesty |
| Hide-copy + nearest gate UX | Prevents silent wrong sort / soft-hide confusion |

### Repaired (why #30 was not mergeable)

1. **`nearest` missing** from `Record<SearchSort, string>` in `banco-web` + `banco-website` search-labels → typecheck fail  
2. **`paperclip` unmapped** in mobile icon registry → icons regression fail → confidence/gates fail  

### Not rewritten / not deleted

- No product-file deletes  
- Poll-only messenger (MSG-05 / G47) left as Owner decision  
- Hard block-user / mute / durable push queue remain tracked gaps  
- Live DNS / secrets / EAS not faked  

---

## Remaining blockers (OPS — not code)

See `PRODUCTION_GAP_MATRIX.md` G03–G14, G17, G41–G44, G54–G57 and `OPS_GO_LIVE_CHECKLIST.md`.

Critical path:

1. Point `banco.today` / `www` at Coolify `web:80`  
2. Fill Coolify secrets (Clerk, session, payment encryption, S3)  
3. `compose --profile migrate run --rm migrate`  
4. Replace `REPLACE_*` in well-known; redeploy `web`  
5. EAS production env + device smoke  
6. `pnpm ops:live-cutover` exit 0  

---

## Merge guidance

1. Merge **this** PR after CI green  
2. Close or supersede open draft **#30** (content absorbed + fixed here)  
3. Leave docs-only **#12** for Owner intentional merge/close  
4. Do **not** start CAR IMPORT Wave 4/5 or Materials UI reopen without Owner go  

---

## Sign-off

**Code readiness:** HIGH (gates re-run this run).  
**Ops readiness:** MEDIUM — stack deployable; public hosts not Coolify yet.  
**Final Production Owner:** **CONDITIONAL GO**.
