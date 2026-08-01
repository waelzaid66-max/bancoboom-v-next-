# 39 — Release execution GO / NO-GO (`w.4.1`)

**Engineering order:** Code tip verified → **owner merge** → **tag** → **Coolify** → **smoke matrix** → FULL CERT only if smoke passes.  
**Tip under test:** living tip on `cursor/w41-production-release-5cf0` (code @ `aee476c` + docs through Phase 2 closeout)  
**Policy:** No new product invent in this gate. OPS cannot be faked from CI.

---

## A. Code gate (agent — DONE this turn)

| Check | Result @ `0b7c418` (+ closeout docs tip) |
|-------|---------------------|
| chain-integrity | **167/167 PASS** (re-verified) |
| API vitest | **386 passed / 3 skipped** (post P2-M1; no API diff since) |
| production-confidence | **14/14 PASS** (re-verified) |
| Phase 2 register | **Closed for agent reconnect** — `43-*` |
| Ahead of `main` | **0** at tag; post-tag delivery log may follow |
| PR on GitHub | **MERGED** — [#1](https://github.com/waelzaid66-max/banco-with-wael/pull/1) + [#2](https://github.com/waelzaid66-max/banco-with-wael/pull/2) + push `6c6dec4` |
| Tag `w.4.1` | **DONE** @ `6c6dec4` — see `45-*` |
| Coolify live smoke | **public BLOCKED** (`45-*`); **local Coolify images PASS** (`46-*`) |

### Closed on tip (code)

| ID | Item |
|----|------|
| P2-M2 | Tombstone auto-signOut web/SPA |
| P2-M3 | Website `/workspace/settings` delete UI |
| P2-M4 | OpenAPI livez/readyz/payments |
| P2-M9 | dealer-os NotFound catch-all |
| P2-M1 | Facets honor `market_country` (API + mobile/web) |
| w.4.1 reconnects | Coolify bake/paths/pin/S3 env/plug/notif scrub/CI |

### Still open (do not block merge; block FULL CERT)

| ID | Item | Next owner |
|----|------|------------|
| — | Coolify deploy + smoke | **OPS** — merge+tag done (`45-*`) |
| P2-H2/H3 | S3 keys + migrate → readyz 200 | OPS |
| P2-H1 | Paymob TOFU | Deferred — evidence `41-*`; owner picks A/B/C |
| P2-M5/M6 | Dual web / search LIVE false | Cutover / bake flags |
| P2-M7 | Landing hops | M7a OK via 301; M7b `/banco-mobile` — see `42-*` |
| Live Clerk/EAS/Paymob/device | UNVERIFIED | Smoke `37-*` |

**Code verdict:** **GO to merge** (CONDITIONAL — not FULL CERT).

---

## B. Owner sequence (strict order)

### B1 — GitHub (required)

1. Open PR:  
   https://github.com/waelzaid66-max/banco-with-wael/compare/main...cursor/w41-production-release-5cf0?expand=1  
2. Title suggestion: `w.4.1 — production release (recovery + P2-M2/M3/M4/M9)`  
3. Merge to `main`  
4. Tag merge SHA:
   ```bash
   git checkout main && git pull origin main
   git tag -a w.4.1 -m "w.4.1 production release"
   git push origin w.4.1
   ```

### B2 — Coolify (required for live ship)

Follow `deploy/coolify/COOLIFY-DEPLOY-ORDER.md`:

1. Secrets (Clerk, session, payment encryption, **S3 static keys**, Paymob)  
2. Postgres healthy  
3. `docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate`  
4. Up `api` → **`GET /api/readyz` = 200**  
5. Up `banco-website` (+ frozen `banco-web` until cutover)  
6. Up `web` nginx  

### B3 — Live smoke (required for FULL CERT)

Execute `37-COOLIFY-LIVE-SMOKE-MATRIX.md` at minimum: **S1–S3, S5–S9, S12–S15, S17–S19, S22–S25**.

---

## C. Post-ship backlog (engineering priority after Coolify green)

| Priority | Work | Why later |
|----------|------|-----------|
| 1 | Paymob TOFU (P2-H1) | See `41-*`: A fail-closed checkout / B order-fetch / C accept residual |
| 2 | Landing hops (P2-M7) | See `42-*`: M7b A edge→website / B path design / C accept |
| 3 | Owner cutover drop `banco-web` | Domain ownership |
| 4 | Flip `WEB_SEARCH_LIVE/MAP=true` | Soft-launch product choice |
| 5 | Product waves M2–N* | After ship unless ordered |

---

## D. GO / NO-GO summary

| Question | Answer |
|----------|--------|
| Merge this tip to `main`? | **DONE** (`44-*`) |
| Tag `w.4.1` after merge? | **DONE** @ `6c6dec4` |
| Claim production fully certified now? | **NO-GO** — Coolify not live (`45-*`) |
| Merge again / more invent? | **NO-GO** — Phase 2 exhausted (`43-*`) |

---

## STOP

Git delivery **complete** (merge + tag `w.4.1`). Phase 2 closed — `43-*`.  
Live Coolify **blocked** in agent env — `45-W41-FULL-DELIVERY-STATUS.md`.  
**Unblock:** Coolify secrets + compose + DNS so `banco.today/api/readyz` is BANCO JSON; then agent resumes smoke.
