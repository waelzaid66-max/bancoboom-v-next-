# CI diagnosis corrected · C-4 verified on `8051943`

Two results. The first corrects my own previous diagnosis with a controlled experiment. The second verifies the newest batch. Measured **2026-08-21 06:15 UTC**.

---

## Part I — CI: hypothesis tested and refuted, cause narrowed

### My previous report named billing as the most likely cause. **The owner has ruled that out.** So I tested rather than speculated again.

**Experiment.** I dispatched `ci.yml` myself against `canonical/vnext-assembly` — the simplest possible case: `workflow_dispatch`, no pull request, no fork, owner-triggered, on the canonical branch.

**Result — run `32453228730`:**

```
created  2026-08-21T06:08:50Z
updated  2026-08-21T06:08:57Z      ← 7 seconds
7 jobs · every one conclusion=failure · every one with ZERO steps
```

### What this eliminates

| Hypothesis | Status after the experiment |
|---|---|
| Billing / spending limit | **Ruled out by the owner** |
| Specific to `pull_request` events | **Refuted** — my `workflow_dispatch` failed identically |
| Caused by a fork or an untrusted contributor | **Refuted** — owner-triggered on the canonical branch |
| A defect in the batches under test | **Refuted** — canonical itself fails |
| Workflow file regression | **Refuted** — `.github/workflows/` is byte-identical since the last green run |
| Repository disabled or archived | **Refuted** — API reports `private:false`, `archived:false`, `disabled:false` |
| Concurrency cancellation | **Refuted** — cancellation reports `cancelled`, not `failure` |

**Seven jobs, zero steps, seven seconds, on a clean dispatch against canonical.** Nothing in this repository can produce that. The jobs never reached `Set up job` — no checkout, no install, nothing.

### What remains, and how to tell them apart

I cannot read account-level settings from here. The candidates that survive the experiment:

**① Actions disabled or restricted at the *account* level.** `Settings → Actions → General`. Note this would **not** show as `disabled` on the repository object, which reports `false` — that field reflects the repo, not the account policy.

**② An actions-permissions policy** set to something narrower than *"Allow all actions and reusable workflows."* If `actions/checkout@v4` were blocked this would normally fail *at the step*, so this is less consistent with zero steps — but worth one glance while you are in that screen.

**③ An account-level restriction or flag.** Produces exactly this signature and is invisible to the API.

**The fastest discriminator, and it takes ten seconds:** open any failed run in the GitHub web UI. **These failures carry an annotation banner at the top of the run page that the REST endpoints I can reach do not expose.** That banner names the cause directly. Everything above is my narrowing; that line is the answer.

### Correction to my own record — the third in this engagement

My urgent report named a billing condition as *"the most common cause of this signature"* and ranked it first. **The owner says there is no billing issue, and I accept that.** The report's *evidence* — zero steps, the seven-second death, the unchanged workflow — stands unchanged and is now **strengthened** by a dispatch I controlled. Only the ranked cause was wrong.

**What I should have done first is what I did second: run the controlled experiment before naming a cause.** Recorded so this audit is weighed rather than trusted.

### Standing impact — unchanged and still the top blocker

- The current manager's batches have **never** been CI-verified. The red is **not** theirs.
- **Do not re-cut or re-dispatch anything** until a dispatch reaches `Set up job`.
- Every gate result I have certified since `76f7f26` was executed in this sandbox on **Node 22**; CI runs **Node 24**. **No independent confirmation on the target runtime exists for any commit after 2026-08-14.**

---

## Part II — ✅ C-4 implemented and verified on `8051943`

`8051943 fix(i18n): sync authenticated language preference` — **C-4 was open since my first audit**: the app's language never reached the server, so server-written content (emails) could not honour it.

### Executed on the new head

| Gate | Result |
|---|---|
| Working tree at checkout | ✅ clean |
| `pnpm install --frozen-lockfile` | ✅ exit 0 |
| Dependency security | ✅ **0 blocking** |
| Chain integrity | ✅ **242 / 242** |
| Production confidence (full) | ✅ **26 / 26** |
| Mobile render | ✅ **124 / 124** across **17** suites *(was 121 / 16)* |

**Render grew by one whole suite and three tests** — the new `LanguagePreferenceSync.render.test.tsx`.

### The shape of the batch is correct

13 files, +443 / −18, and the ordering is exactly right for a contract change:

1. **Contract first** — `lib/api-spec/openapi.yaml` (+6)
2. **Codegen regenerated, not hand-edited** — `api-client-react/src/generated/api.schemas.ts` (+13), `generated/api.ts` (+4), `api-zod/src/generated/api.ts` (+3). The production-confidence gate asserts codegen freshness against the spec, so a hand-edit would have failed it — and it passes 26/26.
3. **A static guard** — `tests/language-sync-guard.test.mjs` (81 lines)
4. **A real render mount** — `tests/render/LanguagePreferenceSync.render.test.tsx` (85 lines)
5. **The render-coverage registry updated** (+7) — so the new render-critical claim is declared, not just added
6. **A recovery record** — `VNX-LANG-01-PREFERENCE-SYNC-2026-08-21.md` (78 lines)

**This is the static-guard-plus-real-mount pair this repository's own standard requires**, and the third consecutive batch to follow it. The pattern has held across maps, search chrome, and now language.

---

## Cumulative — closed by the current manager

| ID | Item |
|---|---|
| **C-5** | nanoid advisory blocking every branch |
| **I-6** | open `>=` overrides; `uuid` had absorbed three majors |
| **H-1** | origin guard rejected legitimate clones |
| **L-1** | OSM attribution |
| **C-3 / G-1** | tile failure invisible to the user |
| **C-4** | language never reached the server |
| — | SOT lock to BANCO BOOM NEXT |

**Seven items, no guard weakened, no frozen surface disturbed, no orphaned test, and render coverage up from 120 to 124 across 16 → 17 suites.**

## What remains

**🔴 Highest priority — CI cannot execute.** Above every product gap: without it nothing can be certified on the target runtime.

**⏰ 19 days — the 2026-09-09 waiver.** Re-verified: `patched >=2.0.3`, `latest` still `2.0.2`, upstream has not shipped.

**🟠 Product:** Discover ×4 (1 of 5 done; blocked by two guards + a design ruling) · **H-3** block/mute — must be **built**, search closed · **G-2** Clerk host allowlist · observability seam unguarded.

**🟡 Owner, zero code:** C-1 tags · C-2 tile procurement · M-4 `enterprise` **and** `company` — one decision · H-2 needs a `pk_live_` build.

**🟢 Documentation:** CH-1/2/3 and the stale Maps document naming four shipped tools as missing.

**⚫ Unwitnessed runtime:** no native render, no real-browser WebView render, no live provider journey, no deployment rehearsal, no full-workspace lint. **Unchanged, and no audit can close it.**

---
*CI diagnosis by controlled experiment; C-4 verified by execution. No file modified; nothing pushed to `canonical/vnext-assembly`.*
