# Why the Cars section in Replit is stale — the build reports success and serves yesterday's bundle

**The owner reports that the Cars section is damaged in Replit and that no update or improvement has arrived. I traced it. He is right, the cause is mechanical, and it has nothing to do with the quality of the Cars work.**

**The Replit production build compiles the Cars UI, and if that step fails it says `warn` and exits 0. The deploy is reported successful. The browser is served the previous export.**

`canonical @ 4f2c81c` — the commit Replit builds — **frozen 42 hours**. **2026-08-23.**

---

# §1 · THE MECHANISM — four lines of shell

`scripts/replit-prod-build.sh`, on canonical today:

```bash
pnpm --filter @workspace/db        build 2>/dev/null || true
pnpm --filter @workspace/taxonomy  build 2>/dev/null || true
pnpm --filter @workspace/api-client build 2>/dev/null || true
…
node node_modules/expo/bin/cli export --output-dir static-build/web --platform web \
  && ok "Expo web export ready" \
  || warn "Expo web export failed — mobile surface will serve the Expo Go QR page (non-fatal)"
```

**The Expo web export IS the Cars section in the browser.** *Every screen the owner is looking at comes out of that one command.*

**Four build steps cannot fail the build.** The first three also send their errors to `/dev/null`, so **a shared library can fail to build and leave no trace at all** — and `listingCreateTaxonomy` imports from `@workspace/taxonomy`.

## What is served afterwards

`artifacts/banco-mobile/server/serve.js`:
```js
const hasWebBuild = fs.existsSync(WEB_INDEX);   // static-build/web/index.html
// missing → warn, serve the Expo Go QR page
```

**`static-build/` is never committed.** *It exists only on the Replit disk, left there by the last export that succeeded.*

## The chain, end to end

```
1  push / redeploy
2  replit-prod-build.sh runs
3  the Expo web export fails — any cause
4  || warn  →  build exits 0  →  Replit reports a successful deploy
5  static-build/web/ still holds the PREVIOUS export
6  serve.js finds index.html and serves it
7  the owner opens the Cars section and sees an older build
```

> **A green deploy, an old screen, and no error anywhere.** *That is exactly "لا أرى أي تحديث" — and it would be true no matter how good the Cars work is.*

---

# §2 · 🔴 AND YOU CANNOT TELL WHICH BUILD YOU ARE LOOKING AT

**Measured yesterday against a running API:**
```json
/api/readyz → {"status":"ok", …, "gitSha":null, "buildId":null}
```

`health.ts` reads `GIT_SHA` / `BUILD_ID` from the environment. **Those are injected by the Docker, AWS, GCP, Coolify and CI paths — and by none of the Replit ones.** `.replit` sets neither.

> **So the deploy cannot fail, the bundle can be days old, and the running service will not tell you which commit it is.** *Three properties that combine into "nothing is changing and I cannot prove why."*

---

# §3 · ✅ THE FIX ALREADY EXISTS, IS CORRECT, AND IS UNMERGED

**`fix/replit-build-integrity-p0-20260822` — 6 commits. Measured in my matrix: chain 245/245 · typecheck ok · mobile ok.**

```diff
+ log "Verifying authoritative workspace..."
+ pnpm run workspace:verify
+ log "Typechecking canonical workspace..."
+ pnpm run typecheck
- pnpm --filter @workspace/db build 2>/dev/null || true
- pnpm --filter @workspace/taxonomy build 2>/dev/null || true
- pnpm --filter @workspace/api-client build 2>/dev/null || true
+ pnpm -r --filter "./lib/**" --if-present run build
```

**And on the export, in the branch's own words:**
> *"replit-prod-start advertises and serves `/banco-mobile/`. Therefore its export is required. If it cannot be produced, fail this build instead of reporting a misleading partial deployment success."*

**Another agent diagnosed precisely what the owner is experiencing and wrote the right fix.** *It has been sitting unmerged, behind the same freeze as everything else.*

---

# §4 · THE TWO BLOCKERS, AND THEY MUST BE FIXED IN THIS ORDER

| | Blocker | Evidence | Effect |
|---|---|---|---|
| **A** | **The Replit build cannot fail** | 4 non-fatal steps; the export is one of them | **nothing the team ships can reach the screen** |
| **B** | **Canonical is frozen** | 42 hours · 28 individually verified green branches unmerged | nothing reaches canonical either |

> **Order matters and it is counter-intuitive: fixing B alone changes nothing the owner can see.** *Merge all 28 branches today and the very next deploy can still silently serve the old bundle.* **A must land first, or the improvement is invisible and everyone concludes the work did not help.**

**That is very likely what has already happened at least once.**

---

# §5 · WHAT IS ACTUALLY IN THE CARS SECTION ON CANONICAL — measured, not assumed

**Before blaming the Cars code, I checked what canonical contains:**

```
CarsHomeHeader.tsx            1193 lines   (the largest section header — Property 915, Facilities 669, Materials 592)
VehicleGlyph.tsx              present
section-primary-strip         x1   ← no duplicate seat
section-engine-strip          x1
car-brand-origin-strip        x1
section-sort-cycle            x1
CarsHomeHeader.render.test    PASSES on canonical
```

**No duplicated control rows. The header mounts. Its render test passes.**

**And one thing I nearly filed as a defect and did not:** the quick sort-cycle button offers 4 of the contract's 6 values, omitting `popular` and `nearest`. **`FilterSheet` offers all six**, and it correctly gates `nearest` behind location permission with its own explanatory alert. **The cycle is a deliberate subset, not a loss.** *Recording the check because "the sort is missing options" is exactly the kind of thing that looks like damage and is not.*

> **So the Cars section on canonical is not obviously broken. What the owner is looking at is very probably not canonical.**

---

# §6 · THE ONE COMMAND THAT SETTLES IT

**I cannot see the screen. This tells us which of the two situations it is, in ten seconds, from the Replit shell:**

```bash
ls -la artifacts/banco-mobile/static-build/web/index.html
```

- **A timestamp older than the last deploy** → the export failed and the stale bundle is being served. **Blocker A, confirmed.**
- **A fresh timestamp** → the export ran and the defect is in the Cars code itself, and I will take it from there with a real reproduction.

**And to see the failure that is currently being swallowed:**
```bash
cd artifacts/banco-mobile && node node_modules/expo/bin/cli export --output-dir /tmp/probe --platform web
```
**Run it directly and it prints the error the build script throws away.**

---

# §7 · THE SIZE OF THE PROBLEM, STATED PLAINLY

**The owner asked to understand how big this is from the audits. Honestly:**

**The engineering is good.** 245 chain assertions · 527 API tests · 127 render tests · eight gates green on the trunk candidate · a payments lock that genuinely prevents double-crediting · a readiness endpoint that fails closed and recovers, verified by pulling the database out from under it.

**The delivery is broken at every stage, and each stage hides the previous one:**

| Stage | State |
|---|---|
| **write** | ✅ good — 28 branches individually verified green |
| **guard** | 🔴 14 guards shipped dead; no gate declares its own size |
| **CI** | 🔴 dead at platform level; `ci.yml:36` would have caught yesterday's regression |
| **merge** | 🔴 canonical frozen 42h |
| **build** | 🔴 cannot fail; the Cars UI is a non-fatal step |
| **serve** | 🔴 serves the last successful export, with no version stamp |

> **Six stages. One is healthy. The owner is standing at the end of the pipe and correctly reporting that nothing comes out.**

**Nine P0s, every one a line or two, all open since 2026-08-01.** *That is not a hard problem. It is an unenforced one.*

---

# §8 · THE POSITION TO TAKE

**① Merge `fix/replit-build-integrity-p0-20260822` first, before anything else.** Verified green. **Until it lands, no improvement can be seen, so no improvement can be judged.**
**② Then merge the 28 green branches** in the order in `MASTER-PLAN-REGISTER-2026-08-23.md`, full battery between each.
**③ Inject `GIT_SHA` into the Replit run** so `/api/readyz` tells you what you are looking at. One environment variable.
**④ Then, and only then, judge the Cars section.** *With a build that cannot lie and a version you can read, a real defect becomes reportable in one screenshot with a SHA beside it.*

**And the standing rule this proves:** *a build step that produces a surface the runtime advertises must never be non-fatal.* **`replit-prod-start.sh` advertises `/banco-mobile/`. The build must therefore refuse to succeed without it — which is precisely what the unmerged branch already says.**

---
*Build script, serve.js, `.replit`, and the health route read on canonical directly. The four non-fatal steps enumerated by pattern rather than by recollection. `gitSha: null` measured against a running API server yesterday. The Cars section's composition on canonical counted (strip seats, header size, render-test result) before attributing any damage to it, and one apparent defect — the four-value sort cycle — checked against `FilterSheet` and withdrawn. The fix branch's diff read in full and its gate results taken from the 36-branch matrix. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
