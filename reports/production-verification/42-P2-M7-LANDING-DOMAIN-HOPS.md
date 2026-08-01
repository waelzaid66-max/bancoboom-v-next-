# 42 — P2-M7 Landing DomainRouter hops (evidence decision)

**Finding ID:** P2-M7 (split **M7a** / **M7b**)  
**Tip audited:** `bcede12` → closed on inventory tip (see §5)  
**Policy:** SoT · HIGH confidence · no invent · no Clerk allowlist guess  

---

## 1. Verdict

| Sub-ID | Hop | Classification | Code now? |
|--------|-----|----------------|-----------|
| **M7a** | `banco.deals` → `https://banco.today/market/` | Coolify nginx map direct (was `/dealer-os/` 301) | **YES — FIXED_IN_REPO** |
| **M7b** | `banco.autos` → `VITE_WEB_URL` (https) or `https://banco.today/` | Removed dead `/banco-mobile/` hop | **YES — FIXED_IN_REPO** |

**Closeout (2026-07-30 inventory):** Option A from §4 — no invented `/banco-mobile/` Next basePath. Expo remains EAS; optional Next consumer stays on compose services / baked `VITE_WEB_URL`. Gate: `scripts/production-confidence-check.mjs` → `checkLandingDomainHops`.

---

## 2. Evidence (historical)

### 2.1 Landing source (`artifacts/landing/src/App.tsx`)

- Same-origin **PATHS** Coolify-aligned: `/market/`, `/admin/`, app via `VITE_*`.
- **DomainRouter (current):**
  - `banco.deals` → absolute `https://banco.today/market/`
  - `banco.autos` → absolute `VITE_WEB_URL` when `https://…`, else `https://banco.today/`
  - Relative redirects on deals/autos explicitly rejected (SSO / white-screen).

### 2.2 Coolify + AWS `nginx.conf` (identical relevant map)

| Path | Behavior |
|------|----------|
| `/market/` | dealer-os SPA |
| `/admin/` | admin-os SPA |
| `/dealer-os/` | **301 → `/market/`** |
| `/admin-os/` | **301 → `/admin/`** |
| `/banco-mobile/` | **absent** (must not be hop target) |
| `/` | landing SPA `try_files … /index.html` |

Therefore `GET /banco-mobile/` on the `web` container is **not** a consumer app: it falls through to **landing** `index.html`. Hostname becomes `banco.today` → DomainRouter does not re-hop → user sees landing, not Next consumer, not Expo.

### 2.3 Consumer Next is **not** on this nginx

- `banco-website` / frozen `banco-web`: separate Coolify services (host **3001** / **3000**).
- `banco-website` has **no** Next `basePath=/banco-mobile`.
- Deploy docs: Expo mobile = EAS, not a Coolify path.

Proxying `/banco-mobile/` → `banco-website:3000` without basePath + Clerk path allowlist = **topology invent** → rejected this turn.

### 2.4 Why M7a is not a code bug

`dealer-os` → 301 `/market/` is committed on Coolify + AWS. Double hop is legacy naming for Clerk-origin absolute URL; market SPA still loads when `banco.today` is this nginx. Direct change to `/market/` is optional cleanup **only after** Clerk Dashboard allowed redirects cover `/market/*` (no in-repo proof).

---

## 3. Owner options (pick before code)

| Option | Action | Closes |
|--------|--------|--------|
| **A** | Coolify/edge: map `banco.autos` (or `banco.today` consumer host) → `banco-website`; update DomainRouter absolute URL to that Clerk-allowed origin/path; update Clerk allowlist | M7b |
| **B** | Keep DomainRouter; add **documented** edge route so `/banco-mobile/` reaches consumer (requires Next basePath or host-root consumer — design) | M7b |
| **C** | Accept M7b residual: `banco.autos` users land on landing until cutover; rely on PATHS/`VITE_*` CTAs on `banco.today` | ship CONDITIONAL |
| **D** (optional) | After Clerk allowlist proof: DomainRouter `banco.deals` → `https://banco.today/market/` (drop legacy name) | M7a cleanup |

**This tip chooses: no code; M7a = mitigated; M7b = proven residual / OPS.**

---

## 4. Smoke additions (owner live)

| ID | Action | Expect on tip `web` nginx |
|----|--------|---------------------------|
| S10 | `GET /dealer-os/` | 301 → `/market/` (existing) |
| **S10b** | `GET /banco-mobile/` | Landing SPA HTML (fallback) — **not** Next consumer — until A/B |

---

## 5. Release posture

| Question | Answer |
|----------|--------|
| Blocks merge `w.4.1`? | **No** |
| Blocks FULL CERT? | **M7b** yes until A/B or owner accepts C |
| Agent invent DomainRouter/nginx proxy now? | **No** |

---

## STOP

Evidence package complete. Reply **A / B / C** (and optional **D**) to authorize a repair wave.
