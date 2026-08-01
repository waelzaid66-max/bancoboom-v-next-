# 01 — Repository Intelligence Report

**Tip:** `06c709a` · **Date:** 2026-07-31 · **Method:** `git` + `gh` (read-only)

---

## 1. Canonical remote

| Item | Value | Evidence |
|------|-------|----------|
| `origin` | `github.com/waelzaid66-max/banco-with-wael` | `git remote -v` |
| Default branch | `main` | `remotes/origin/HEAD -> origin/main` |
| Audited commit | `06c709a1fe18ceaa19a20e47cd01bac2a1d6aca3` | `git rev-parse HEAD` / main tip |
| Message | Merge PR #33 messenger contact honesty + publish phone SoT | `git log` |

**Contradiction:** Root `README.md` still lists primary as `waelzaid66-max/-BANCO-CA-OOM-` and AWS deploy as `aws-virgen`. OPS checklist correctly names `banco-with-wael` only.  
**Severity:** P1 documentation SoT drift.

---

## 2. Branch analysis

Local: `main`, `cursor/qa-verification-audit-c8f0` (this pack).

Remote feature/hot branches observed (sample; full list via `git branch -a`): many `cursor/*` agent branches for car-import, materials, messenger, maps, production acceptance, handover audit, Coolify, etc.

| Pattern | Observation |
|---------|-------------|
| High parallel agent branch density | Multiple overlapping production/messenger/maps/acceptance drafts |
| Risk | Merge conflicts / duplicate docs / contradictory certifications |
| Mitigation already in culture | Production stabilize PR #29 absorbed wiring; Architect should serialize merges |

**Tags:** At least `w.4.1` present. Full historical release tag inventory: **partially enumerated** (`git tag -l`); treat detailed release archaeology as secondary to tip audit.

---

## 3. Pull request intelligence (open at audit time)

| PR | Title | State | Note |
|----|-------|-------|------|
| #34 | Final knowledge extraction & production audit | DRAFT | Concurrent docs agent; CI had failures on early runs |
| #32 | CTO acceptance — absorb #30 + eliminate contract risks | DRAFT | CI later success on follow-up runs |
| #30 | Wave 3–6 messenger, maps & notifications wiring | DRAFT | May overlap merged #26/#28/#33 themes |
| #12 | Phase Zero master engineering audit | DRAFT | Historical audit PR |

**Merged recently (main):** #33, #31, #29, #28 (+ earlier production waves).

---

## 4. CI health (main)

| Workflow | Tip | Result | Evidence |
|----------|-----|--------|----------|
| `CI` | push `06c709a` (PR #33 merge) | **success** (~2m14s) | `gh run list --branch main` |
| `CI` | PR #31 merge | success | same |
| `CI Website` / `CI Website Docker` | PR #31 merge | success | same |

**This session did not re-run CI locally.** Local `node_modules` absent → install/typecheck **UNVERIFIED** here.

---

## 5. Historical / dual-repo drift

| Doc / artifact | Claim | Current evidence | Severity |
|----------------|-------|------------------|----------|
| `README.md` | Primary `-BANCO-CA-OOM-` | origin is `banco-with-wael` | P1 |
| `DUAL_REPO_STATUS.md`, `SYNC_REPORT.md`, `REPO_SYNC_STATUS.md` | Multi-remote sync narrative | Useful historically; not live SoT | P2 |
| `reports/ProductionFingerprint.json` | repo `-BANCO-CA-OOM-`, SHA `fe2c53f`, 2026-07-21 | Stale; `productionAccepted: false` | P1 |
| `reports/laptop-validation-results.json` | July 21 blocked install | Superseded by later CI greens; not revalidated here | P1 |
| `FINAL_RELEASE_CERTIFICATION.md` | Tip `250d655` / 2026-07-30 | Still correct on **live not certified**; tip SHA outdated | P2 |
| Sister repos (`bancoo`, `aws-virgen`, `bancooom`) | Mentioned in restitution notes | Out of scope for this tip; do not treat as SoT | P1 policy |

---

## 6. Architecture drift signals

1. **Web twin:** `artifacts/banco-web` marked `FROZEN.md`; canonical website is `banco-website`. Coolify profile-gates legacy web; generic `docker-compose.prod.yml` still includes `banco-web` as normal service → deploy drift.
2. **AWS CD vs Coolify SoT:** `.github/workflows/deploy.yml` builds AWS API + Vite nginx web images — not Coolify `Dockerfile.banco-website`. Coolify is documented operator path for Hostinger VPS.
3. **GCP:** API-oriented Cloud Run path; not full surface parity with Coolify.
4. **Migration model:** Drizzle `push` + runtime `ensureSchema` patches — no versioned `migrations/` tree found → operational drift risk across environments.

---

## 7. Repository health summary

| Check | Status |
|-------|--------|
| Single GitHub SoT remote for this workspace | PASS (`banco-with-wael`) |
| Main CI green on tip | PASS |
| Root docs name correct SoT everywhere | FAIL |
| Live public deployment matches tip | FAIL |
| Abandoned parallel certifications reconciled | FAIL (open draft PRs + dated reports) |
