# W4-SUP-01 — Senior engineer review of the Chair (honest)

**To:** Chief Production Architect — PR [#32](https://github.com/waelzaid66-max/banco-with-wael/pull/32)  
**From:** Idle / support seat (`Expensive variable work`) — Owner ordered: higher-grade reports, research, full honesty, senior opinion, **no diagrams**  
**Tip under review:** `cursor/final-production-acceptance-e37c` @ **`3a234ef`**  
**Date:** 2026-07-31T12:28Z  
**Method:** tip fetch · local gates · live cutover script · Clerk FAPI · GitHub Actions · council packets on tip · prior Idle W2/W3 packets  
**Labels:** **FACT** = measured. **OPINION** = judgment. Nothing unmarked is a score or invention.

---

## 0. One-screen truth (FACT)

| Layer | State now |
|-------|-----------|
| Tip HEAD | `3a234ef` — Wave 4 mobile success audit + **REL-09** wait-for-`/me` + Zone A adjudication |
| Last product code | `d3c255d` — REL-09 in `profile.tsx` (Skip→individual must not race elevated role before `/me`) |
| Prior product | `31fbbc0` — REL-07 empty CTA |
| Local gates @ tip `3a234ef` (this session) | wiring **47/47** · lib-hardening **32/32** · chain **167/167** · confidence **18/18** (`--skip-typecheck`) |
| Live public apex | `ops-live-cutover-check.mjs` → **0/6 NOT_CUTOVER** (apex Replit placeholder; www Hostinger Horizons) |
| Clerk prod | `user_settings.social = {}`; app display name still **“My Application”** |
| CI pattern last hours | Rapid tip commits **cancelled** prior runs (`f216425`, `e764700`, `bd50e81` Website, `d3c255d`). Self-inflicted CI thrash — not product failure. Mid-sample: `bd50e81` had CI + Website Docker **SUCCESS** before next push cancelled Website |
| Support PR #38 | **Not absorbed** into tip |
| Open draft noise | #30 #32 #34 #36 #38 #12 still open |
| Wave 4 mandate | Chair commit message cites **Owner mandate**: screen/button audit under anti-reckless law — Zones are Owner-driven, not idle freelancing |

**Bottom line (OPINION):** Tip **application readiness for Coolify staging merge is real**. Public GO is **still OPS/DNS**. Chair’s architecture and REL-09 are right. Process risk remains: **do not Accept on a moving HEAD** — freeze SHA, full CI + REL-00, then merge; continue Zone C–F discovery after or on a docs-only absorb cadence that does not thrash CI.

---

## 1. What the Chair got right (OPINION grounded in FACT)

1. **Single tip (#32)** after multi-agent chaos — correct. Sister tips (#30 features, #36 VA) must not compete.  
2. **Force-exec + verify-not-reimplement (D-09)** when Reliability lagged — correct for a release train.  
3. **Honest NOT_CUTOVER / no Live Certified** while cutover ≠ 0 — correct and Owner-honest.  
4. **Markets SoT + currency write allowlist + REL-07 empty CTA category** — correct anti-melt engineering; I re-confirmed `emptyPostRequestCreateCategory` on tip.  
5. **D-11 banks brochure honesty** — correct product honesty over fake directory.  
6. **Wave 4 Zone A/B + REL-09** — Owner mandated screen/button audit; Chair answered with static Zones + a **narrow real fix** (REL-09). Adjudicating MOB-A-06 as MEDIUM (server `DEMOTE_BLOCKED` backstop) is senior-correct — not panic-HIGH. Zone B REL-07 confirmation matches Reliability ACK.

---

## 2. Where the Chair is wrong or drifting (FACT + OPINION)

### 2.1 Merge train vs moving tip (OPINION — primary criticism)

Wave 3 Accept criteria (`66-…WAVE3.md` §E) still apply, extended by Wave 4 product (REL-09). Owner wants Zone audits — fine. The mistake is **Accepting language while HEAD keeps moving** and CI keeps cancelling.

Every tip push:

- cancels in-flight CI (FACT: multiple cancelled SHAs this hour),
- forces REL-00 / TIP_HEALTHY re-stamp,
- blurs “RC ready” vs “still discovering.”

**Best practice (industry, not invention):** pick a freeze SHA after REL-09 · wait full CI · Accept/merge · continue Zones C–F on `main` (or batch docs absorbs). Do not treat every Zone packet as a reason to delay Coolify staging SoT.

**My call:** Finish the Owner Zone matrix **without** blocking Path A merge once gates+CI green on a frozen SHA. Parallelize: Auditor/Idle write Zone packs; Chair merges when §E(+REL-09) met.

### 2.2 TIP_HEALTHY / REL-00 SHA drift (FACT)

Reliability’s senior briefing and REL-00 packets have repeatedly cited older SHAs than HEAD. Wave 3 stamp trailed `31fbbc0`; HEAD is now `bd50e81` (docs-only delta). A stamp that does not name **current HEAD** is noise for Accept.

**OPINION:** Chair should require REL-00 to cite `git rev-parse HEAD` of the SHA being Accepted — or explicitly say “docs-only delta since `31fbbc0`; product gates unchanged.”

### 2.3 Draft PR sprawl (FACT)

Six drafts still open. Owner cannot tell which is SoT. Chair already knows #30/#36 are superseded. **Not closing them** after Accept keeps burning trust.

### 2.4 Dual Next + push-force schema (FACT from W2-SUP-01; still true on tip)

- Coolify SoT consumer = **`banco-website`**; `banco-web` profile-gated frozen.  
- Schema path = **`drizzle-kit push --force`** — no migrations journal.  
- `ensureSchemaPatches` ≠ import tables; `/readyz` only fails closed on `upload_claims`.  

**OPINION (senior):** This is acceptable **only** for staging go-live with written migrate attestation. It is **not** a mature production schema story. Best next design (after cutover exit 0): versioned SQL migrations (Drizzle `generate` + migrate), keep push-force as emergency only. Do **not** expand `ensureSchemaPatches` into a fake migrator.

### 2.5 What Chair must not confuse (OPINION)

| Confusion | Reality |
|-----------|---------|
| “More Zone audits → closer to production” | No. DNS/Coolify/secrets/migrate do. |
| “Docker red = app broken” | Often Docker Hub timeout (proven). Re-run; don’t fork Dockerfiles for flakes. |
| “Auditor paper trail blocks merge” | Discovery can continue on `main`. Code risk for approved REL is closed. |
| “Idle idle = waste” | Named packets only (SUP-01 pattern). Owner activation overrides STANDBY. |

---

## 3. Research: what “best” looks like from here (OPINION)

### Path A — Accept #32 as engineering SoT on a frozen SHA (recommended)

**When:** Freeze HEAD after REL-09 (`3a234ef` or later if only docs). Full CI green (or sole failures = proven Docker Hub timeout). Local gates re-run on **that** SHA. REL-07 + REL-09 present. Explicit NOT_CUTOVER in Accept note. Zone matrix may remain PARTIAL — Owner audit can continue post-merge.

**Why best:** Tip holds Coolify locks, REL-01..05, markets SoT, messenger absorb, REL-07/09, council orders. Long-lived draft tips invite sister-branch drift. Industry practice: merge RC → deploy staging → DNS cut when ready. Zone discovery does not need to finish before Coolify staging SoT exists.

**After merge (ordered):**

1. Close #30 as superseded. Close or absorb #34/#36/#38 docs.  
2. Coolify rebuild from `main` (Owner — secrets only in Coolify UI).  
3. Run migrate profile once; **attest** `import_orders` / `import_order_documents` exist (not only `/readyz`).  
4. DNS off Replit/Horizons per `OPS_GO_LIVE_CHECKLIST.md`.  
5. Replace `REPLACE_*` well-known.  
6. Clerk: rename app; enable Google/Apple only if product wants social.  
7. Re-run `ops:live-cutover` until 6/6 — **only then** public Certified language.  
8. Continue Zone C–F on `main` under Owner mandate.

### Path B — Hold merge for more Zone audits / Auditor theater

Safer paper trail. **Does not change DNS.** Acceptable only if Owner explicitly wants audit theater before merge. Not highest leverage.

### Path C — New feature waves (CAR IMPORT W4/5, MSG-05 WS)

**Reject** until cutover exit 0 + Owner explicit go. Expanding surface while apex is Replit increases blast radius with zero user benefit.

**Recommendation: Path A.**

---

## 4. Residual risk map (honest — FACT severity)

| Risk | Severity for public GO | Owner | Code on tip? |
|------|------------------------|-------|--------------|
| Apex/www DNS still Replit/Horizons | **CRITICAL** | OPS | N/A |
| Secrets + migrate + well-known REPLACE_* | **HIGH** | OPS | Templates yes |
| Clerk social empty / “My Application” | MEDIUM UX | OPS Dashboard | Fail-closed OK |
| Push-force / no migration journal | HIGH long-term | Architect | Intentional |
| Dual Next twin drift if someone enables legacy profile | MEDIUM | Architect | Frozen by default |
| Zone visual paint / map latch timing | UNVERIFIED | Owner device | Static HEALTHY |
| Notification enum matrix (REL-06) | LOW | Reliability optional | Partial |
| FI directory / safe-transfer | Product epic | Owner brief first | D-11 brochure |

No evidence this session of Discover anti-melt regression, currency display rewrite, or messenger melt on tip.

---

## 5. Idle seat status vs Chair orders (FACT)

| Packet | Status |
|--------|--------|
| W3 SUP-01 HISTORICAL stamp | Done on #38 — **not yet absorbed** |
| W3 SUP-02 senior brief | Done — superseded by this packet for HEAD `3a234ef` |
| W2 migrations / msgmap peer-review | Done on #38 |
| Wave3 non-goals | Honored: no CAR IMPORT W4/5 · no MSG-05 · no Certified · no #30 revival |

**Ask to Chair:** Absorb #38 support packets into tip (or close after cherry-pick). Keep Idle on **named** packets only.

---

## 6. Commands reproduced (FACT — for audit)

```bash
git fetch origin cursor/final-production-acceptance-e37c
git rev-parse origin/cursor/final-production-acceptance-e37c
# 3a234ef…

node --test artifacts/banco-mobile/tests/production-wiring-guard.test.mjs   # 47/47
node scripts/chain-integrity-gate.mjs                                        # 167/167
node scripts/production-confidence-check.mjs --skip-typecheck                # 18/18
node scripts/ops-live-cutover-check.mjs                                      # 0/6 NOT_CUTOVER

curl -sS https://clerk.banco.today/v1/environment \
  | jq '{social:.user_settings.social, app:.display_config.application_name}'
# social: {} · app: "My Application"

gh pr checks 32
gh run list --branch cursor/final-production-acceptance-e37c --limit 6
```

---

## 7. Senior opinion (not clerk language)

Chair’s **engineering direction is sound**. REL-09 is the right kind of repair (narrow, evidenced, guarded). The product tip is not the public-GO bottleneck. The bottleneck is:

1. **Freeze a tip SHA (post-REL-09), full CI + REL-00, Accept/merge #32.**  
2. **Owner OPS** (Coolify + secrets + migrate attestation + DNS + Clerk cosmetic/social).  
3. **Close draft noise** so Owner sees one SoT.  
4. Keep Owner Zone audits **in parallel** — do not make Zone completion an Accept gate unless a CRITICAL/HIGH defect without server backstop appears.  
5. Commission **versioned migrations design** after staging is real — do not pretend push-force is forever.

If Chair asks Idle for one next named packet: **post-merge OPS migrate attestation checklist** (docs-only), **Zone peer-review of a named zone** if assigned, or **`banco-web` archive plan** — not invented diagrams, not competing tips.

I will not rubber-stamp Live Certified. I will not invent defects. I will not fight #32.

End of W4-SUP-01.
