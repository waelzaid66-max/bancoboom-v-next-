# W2-REL — Senior briefing for Chief Production Architect

**From:** Production Reliability Engineer (seat) · `System presence check` · `bc-019fb4d1…53de`  
**To:** Chair · `Production readiness validation` · `bc-019fb7dd…e37c`  
**Date:** 2026-07-31T12:15Z  
**Tip under review:** `cursor/final-production-acceptance-e37c` @ **`865e94c`** · [PR #32](https://github.com/waelzaid66-max/banco-with-wael/pull/32)  
**Method:** tip fetch · local gates · GitHub Actions logs · live HTTP against `banco.today` / Clerk FAPI · council artifacts · fleet metadata  
**Rule:** evidence only — no invented defects, no Live Certified stamp

---

## 0. One-screen picture (what is true right now)

| Layer | Verdict | Evidence |
|-------|---------|----------|
| **Governing tip code** | **TIP_HEALTHY** for Wave 1b + Wave 2 REL landings | Local: wiring **47/47**, chain **167/167**, confidence **18/18**, api + dealer typecheck PASS @ `865e94c` |
| **PR #32 mergeability** | **MERGEABLE** (draft) | `gh pr view 32` |
| **GitHub CI on latest tip** | **Mixed** — core CI green; **one Docker job red** | Website Docker fail = Docker Hub `i/o timeout` (infra). Prior tip SHA `b9d5f13` had **all Docker jobs SUCCESS** |
| **Public apex** | **NOT_CUTOVER** | `pnpm ops:live-cutover` → **0/6**; Replit placeholder + Hostinger Horizons on www |
| **Clerk production** | Instance live; **social providers empty** | `GET https://clerk.banco.today/v1/environment` → `user_settings.social = {}`; first factors = email/password only |
| **Auditor Wave 2** | **Not started on tip** | No `W2-AUD-*` packets under `council/auditor/`; Wave 1 rollup exists; PR **#36** still draft / superseded for Wave 1 evidence |
| **Idle / support** | **Active docs seat** (Owner-activated) | PR **#38** draft: migrations + dual-Next peer-review; must not fight #32 |
| **Reliability Wave 2** | **ACK complete** | `W2-REL-04-05-VERIFY.md` + `W2-REL-00-tip-reverify.md` (D-10). Did **not** re-implement Chair force-exec |

**Bottom line for Chair:** The **application tip is ready to merge as engineering SoT**. Public GO is **blocked only by OPS/DNS + secrets + migrate + store well-known + Clerk social Dashboard** — not by missing Wave 2 REL code. Do not confuse a flaky Docker Hub pull with a product regression.

---

## 1. What Chair already did well (keep)

1. **Single tip discipline** (D-01) — #32 as sole SoT; #30 superseded for features.
2. **Honest OPS boundary** — NOT_CUTOVER while cutover script fails; no fake Certified.
3. **Wave 2 markets SoT (D-08)** — correct architecture; one catalog.
4. **Force-exec clock (D-09) + coordination protocol** — right response when seats lag on stale branches.
5. **Currency write policy (D-07)** — same allowlist listings ↔ B2B; prevents pricing garbage.

These are senior-correct calls. Reliability endorses them.

---

## 2. Hard findings (re-verified this hour)

### F1 — Docker `banco-website` red on `865e94c` is **infra flake**, not tip defect

**Failed job** ([run 30629628748](https://github.com/waelzaid66-max/banco-with-wael/actions/runs/30629628748)):

```text
Head "https://registry-1.docker.io/v2/docker/dockerfile/manifests/1.7":
dial tcp 18.206.80.79:443: i/o timeout
```

**Control:** same tip family @ `b9d5f13` ([run 30629495505](https://github.com/waelzaid66-max/banco-with-wael/actions/runs/30629495505)) — **all five Coolify/AWS docker jobs SUCCESS**, including `banco-website`.

**Reliability opinion:** Re-run the failed workflow (Owner/Chair via GitHub UI — this seat’s `gh` is read-only). Do **not** open a “fix website Dockerfile” branch for a registry timeout. If flake repeats ≥3× with different errors, then investigate Dockerfile syntax line / mirror — not before.

### F2 — Live cutover still **0/6** (OPS CRITICAL for public GO)

Re-ran `pnpm ops:live-cutover` @ 12:13Z:

| Check | Result |
|-------|--------|
| apex `/nginx-health`, `/api/readyz`, assetlinks, AASA | Replit placeholder HTML |
| www home | Hostinger Horizons |
| apex home | Replit “isn't live yet” (HTTP 404) |

**Owner path:** `OPS_GO_LIVE_CHECKLIST.md` A→G + `COOLIFY_DEPLOY_NOW.md`. Agents cannot DNS-cut.

### F3 — Clerk social still empty (OPS / Dashboard)

Live FAPI:

- `user_settings.social = {}`
- `first_factors`: email_code, email_link, password, reset_password_email_code, ticket  
- App display name still **“My Application”** (cosmetic OPS)

Mobile already fail-closes social buttons (chain gate `P-no-facebook-oauth` + resilience tests). Enabling Google/Apple is **Clerk Dashboard + redirect URLs**, not tip code.

### F4 — Auditor Wave 2 gap (process)

Standing Orders §B require AUD-20→25 + rollup confirming markets SoT + REL-04/05 on **current tip SHA**.  
**On tip today:** zero `W2-AUD-*` files. Auditor agent returned to activity but evidence pack not on tip yet. Wave 1 rollup still lists AUD-02/09 as OPEN — **stale relative to D-08/D-07/REL landings**; needs AUD-21/23 flips.

### F5 — Tip-health debt Chair left; Reliability closed (D-10)

D-08 re-export pattern `export { X } from` without local import broke `rentalTermsForCountry` (TS2304) and create-market guard. Fixed on tip @ `865e94c`. **Lesson for Chair force-exec:** run mobile typecheck + confidence after taxonomy moves before declaring landing complete.

### F6 — Draft PR sprawl (governance noise)

Open drafts still visible: **#30** (superseded), **#36** (Wave 1 absorb done), **#34** handover docs, **#38** support, **#12** phase-zero. None should merge as competing SoT. Recommend Chair comment + close-after-#32-merge plan for #30/#36.

---

## 3. Residual engineering risk map (honest)

| Risk | Severity | Owner | Code on tip? | Notes |
|------|----------|-------|--------------|-------|
| Apex DNS still Replit/Horizons | **CRITICAL** public GO | OPS | N/A | Blocks Certified |
| Secrets / migrate / well-known REPLACE_* | **HIGH** go-live | OPS | Templates shipped | Checklist E–F |
| Clerk social `{}` | **MEDIUM** UX | OPS Dashboard | Fail-closed OK | Not architecture bug |
| Exhaustive notification enum matrix (REL-06) | LOW | Reliability optional | Partial | Document + guard rows only; do not invent routes |
| AUD-08/24 visual | UNVERIFIED | Owner device | N/A | Keep UNVERIFIED |
| Dual Next (`banco-web` vs `banco-website`) | MEDIUM long-term | Architect | Both Coolify-built | Idle #38 peer-review only; no cutover without Architect plan |
| Zod listing `specs` looseness | LOW | later | REL-01 write enforce covers currency | Only reopen with exploit path |

No evidence on tip of messenger melt, Discover anti-melt regression, or currency display rewrite of BHD→EGP.

---

## 4. Recommended decision tree for Chair (senior opinion)

### Option A — **Merge #32 now as engineering SoT** (recommended)

**When:** After Docker website job re-run is green (or Chair documents flake + accepts prior SUCCESS @ `b9d5f13` + local confidence 18/18).

**Why best:** Tip already carries Coolify locks, REL-01..05, markets SoT, messenger phone SoT absorb, council orders. Keeping a long-lived draft tip invites sister-branch drift (exactly what D-09 punished).

**After merge:**

1. Close **#30** and mark **#36** superseded/closed.  
2. `main` becomes tip; Coolify rebuild from `main`.  
3. Owner executes OPS checklist until `ops:live-cutover` exits 0.  
4. Only then: Live Certified language.

**Reject:** Waiting for Auditor Wave 2 rollup before merge — discovery can continue on `main`; code risk already closed for approved Wave 2 REL.

### Option B — Hold merge until Auditor AUD-20→25 on tip

Safer for paper trail; slower; **does not change DNS**. Acceptable if Owner wants audit theater before merge, but it is not the highest-leverage path for production.

### Option C — More feature waves (CAR IMPORT W4/5, MSG-05 WS)

**Reject** until cutover exit 0 + Owner explicit go. Expanding surface while apex is Replit increases blast radius with zero user benefit.

**Reliability recommendation: Option A.**

---

## 5. Proposed Chair orders (paste-ready)

### To Auditor (`Engineering intelligence audit`)

```text
Fetch tip origin/cursor/final-production-acceptance-e37c @ 865e94c (or main if #32 merged).
Read 64-WAVE2 + 65-COORD + COUNCIL D-06…D-10 + W2-REL-04-05-VERIFY.md.
Execute AUD-20→25 ONLY. Flip AUD-02/09 to ALREADY_FIXED_ON_TIP if tip evidence holds.
Peer-review REL-04/05 as AUD-22/23. Rollup W2-AUD-WAVE2-ROLLUP.md on tip.
Do not repair. Do not reopen #36 as SoT. Challenge bar §2 Auditor.
```

### To Idle / support (`Expensive variable work`)

```text
Stay on docs peer-review only (migrations + dual Next) per #38.
No CAR IMPORT W4/5. No tip fights. After #32 merges, retarget docs PRs to main.
If capacity: close or retitle #34 so it cannot be mistaken for governing tip.
```

### To Reliability (this seat) — next assignable work

| Priority | Packet | Condition |
|----------|--------|-----------|
| P0 | Re-verify after Chair re-runs Docker / after merge absorb | Automatic |
| P1 | **REL-06** notification enum→route matrix doc + guard rows | Chair Approve one-liner |
| P2 | Assist OPS with staging-p0-smoke interpretation (exit 2 = incomplete) | When Coolify staging URL + Clerk bearer available |
| — | Anything else | Wait named Approve Plan |

### To Owner (OPS — not agent fiction)

1. Coolify stack from tip/`main` → `web:80` apex.  
2. Secrets + `migrate` profile.  
3. DNS off Replit / Horizons.  
4. Replace `REPLACE_*` well-known.  
5. Clerk: enable Google/Apple if product wants social; rename app from “My Application”.  
6. Re-run `pnpm ops:live-cutover` until 0.

---

## 6. Merge gate checklist Chair should use (objective)

- [x] REL-01/02/03 landed + guards  
- [x] REL-04/05 on tip + Reliability ACK  
- [x] Markets SoT + consumer import binding  
- [x] Local confidence 18/18 · wiring 47 · chain 167  
- [ ] GitHub Docker website green on **current** SHA (re-run flake) **or** explicit Chair waiver citing prior SUCCESS + flake log  
- [ ] Mark #32 Ready for review / undraft when Owner timing allows  
- [ ] After merge: close #30; absorb/close #36 noise  

**Public GO gate (separate):** `ops:live-cutover` exit 0 + checklist G.

---

## 7. Senior opinion (not clerk language)

Chair’s architecture direction is sound. The bottleneck is no longer “agents inventing features” — it is **(1) merge the tip before it rots, (2) wake Auditor to close the paper trail, (3) Owner DNS/Clerk/EAS**. Force-exec was justified once; do not make it the default — seats must stay on tip SHA. Reliability will verify and harden; will not freelance Wave 4 or WebSocket.

If Chair assigns **one** next engineering packet, assign **REL-06** (notification matrix honesty) or **post-merge tip re-verify** — not more currency/markets work.

---

## 8. Commands reproduced for audit

```bash
git rev-parse HEAD   # 865e94c…
node --test artifacts/banco-mobile/tests/production-wiring-guard.test.mjs  # 47/47
node scripts/chain-integrity-gate.mjs                                       # 167/167
node scripts/production-confidence-check.mjs --skip-typecheck               # 18/18
pnpm ops:live-cutover                                                       # 0/6 NOT_CUTOVER
curl -sS https://clerk.banco.today/v1/environment | jq '.user_settings.social'  # {}
gh run view 30629628748 --log-failed   # docker.io timeout
gh run view 30629495505                # prior docker SUCCESS @ b9d5f13
```

**Seat status:** Standing by for Chair Accept on #32 and/or named Approve Plan (REL-06 / post-merge verify). Will not self-merge.

---

## Addendum — Wave 3 (same hour, tip `31fbbc0`+)

Chair absorbed Auditor Wave 2, flipped AUD-22/23 FIXED, executed **REL-07** (section empty CTA category), issued `66-…WAVE3.md` + Accept criteria §E, and independently classified website Docker red as **Docker Hub timeout** — same conclusion as this briefing §F1.

| Item | Reliability action |
|------|--------------------|
| REL-07 | **ACK** — `W3-REL-07-VERIFY.md` (no re-implement) |
| REL-00 | **TIP_HEALTHY** — `W3-REL-00-tip-reverify.md` (47 wiring · 71 section · 167 chain · 18 confidence) |
| FI brochure (D-11) | Endorsed — not a merge blocker |
| Accept criteria §E | Engineering items met; CI flake needs re-run/waiver; OPS cutover still blocks **public** GO only |

**Updated recommendation:** Still **Option A** — Chair Accept / merge #32 as SoT when Docker re-run green or waived. Wave 3 does not change OPS DNS reality.
