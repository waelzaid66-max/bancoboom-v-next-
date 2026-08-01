# 56 — Live cutover baseline (pre-OPS)

**SoT tip:** `250d655` (`main` after PR #7)  
**Date (UTC):** 2026-07-30  
**Machine check:** `node scripts/ops-live-cutover-check.mjs`  
**Honest stamp:** Repository Ready · Live Production **Not** Certified

---

## DNS snapshot (this probe)

| Name | Value |
|------|--------|
| `banco.today` A | `34.111.179.208` (Google / Replit-class front) |
| `banco.today` NS | `hyperion.dns-parking.com.` · `atlas.dns-parking.com.` |
| `www.banco.today` CNAME | `www.banco.today.cdn.hstgr.net.` (Hostinger Horizons CDN) |
| `www.banco.today` A (via CDN) | `212.1.212.38` · `195.35.60.192` |

---

## HTTP snapshot

| URL | Result |
|-----|--------|
| `https://banco.today/` | **404** Replit “This app isn't live yet” |
| `https://www.banco.today/` | **200** Hostinger Horizons Vite SPA |
| `https://banco.today/api/readyz` | **404** Replit HTML (not API JSON) |
| `https://banco.today/.well-known/*` | **404** Replit HTML |
| `https://banco.today/nginx-health` | Not Coolify `ok` (wrong origin) |

---

## What this means

In-repo Coolify artifacts on `main` are certified. **Public DNS still points at the wrong origins.**  
No amount of Git merges will make `/api/readyz` healthy until:

1. Coolify resource = `waelzaid66-max/banco-with-wael` + `docker-compose.coolify.yml` + branch `main`
2. Apex domain → compose service **`web`** port **`80`**
3. Required secrets + migrate
4. DNS: apex off Replit; www off `cdn.hstgr.net`
5. Re-run: `pnpm ops:live-cutover` (or `node scripts/ops-live-cutover-check.mjs`)

Until exit 0 from that script, do **not** stamp Live Production Ready.
