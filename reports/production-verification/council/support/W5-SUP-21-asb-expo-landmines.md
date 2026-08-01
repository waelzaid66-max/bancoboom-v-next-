# W5-SUP-21 — ASB / Expo / EAS landmine inventory

**Seat:** Idle / Support  
**Orders:** `71` §D SUP-21 · truth map `70` §2/§6–7  
**Tip SHA:** `a9f5c358149c473019a0c07fcbaea087d143422a`  
**Date:** 2026-07-31  
**Mode:** Docs inventory only · **no `eas.json` edits** · no product code  

---

## 1. EAS bake landmines (FACT)

| Landmine | Evidence | Class | Owner |
|----------|----------|-------|-------|
| **`preview` profile uses `environment: "production"`** | `artifacts/banco-mobile/eas.json:18–20` | Bake / secret-class risk — preview builds pull **production** EAS env | Owner + Chair Approve before any eas.json change |
| Production profile also `environment: "production"` | `eas.json:29–31` | Expected for store | — |
| Node pin `24.18.0` on base | `eas.json:7–8` | Do not casually change | Architect |
| Preview = internal APK; production = AAB + autoIncrement | `eas.json:22–38` | Correct split | — |
| Submit only `production` | `eas.json:41–43` | OK | — |

**Idle recommendation:** Document only this wave. **Do not rewrite eas.json** without Owner (orders §F).

---

## 2. Well-known / universal links (ASB store truth)

| Item | Evidence | Status |
|------|----------|--------|
| Templates ship in image | `deploy/coolify/well-known/{apple-app-site-association,assetlinks.json}` · `Dockerfile.web` COPY | Present |
| Placeholders | `REPLACE_APPLE_TEAM_ID` · `REPLACE_PLAY_APP_SIGNING_SHA256` | **OPS must replace** before store verify |
| Guard | `universal-links-config.test.mjs` asserts REPLACE_* still in templates | L0 only |
| Live apex | `ops:live-cutover` — assetlinks/AASA = Replit placeholder HTML | **NOT_CUTOVER** — DNS before ASB verify |

---

## 3. Push / Expo Go vs ASB (from `70` + product posture)

| Claim | Idle stamp |
|-------|------------|
| L5 Device ASB = EAS production build · push · deep link | `70` §7 — **UNPROVEN OPS** this tip |
| L0–L1 green ≠ L4–L5 | **CONFIRMED** epistemic rule |
| Push on Expo Go | Treat as **non-SoT** for production claims — production push requires ASB/dev-client (align with Chair truth map; no device pack here) |
| Clerk social | Live `social={}` — OPS Dashboard; mobile fail-closed elsewhere | Outside Idle code |

---

## 4. Interconnect landmines Idle must not touch (`70` §6)

Idle **will not** edit: taxonomy/markets · search-contract · create remaps · upload_claims · AuthGate/`/me` · notificationRouting · Coolify service names · EAS `EXPO_PUBLIC_*` / replit origin refuse.

Wave 5 soft-auth (import Start / wallet) = **REL-15 ask** / SUP-12 backlog — **inventory only**.

---

## 5. Rollup for Chair

| ID | Severity for Accept | Action |
|----|---------------------|--------|
| EAS preview→production env | MEDIUM bake risk | Owner Approve before change; not Accept blocker |
| Well-known REPLACE_* | HIGH for **store** | OPS after DNS |
| Live cutover 0/6 | CRITICAL for **public** | OPS DNS |
| Zone F soft-auth | LOW UX | Optional Approve post-Accept |

**No eas.json / no Dockerfile / no product commits from Idle.**

End of W5-SUP-21.
