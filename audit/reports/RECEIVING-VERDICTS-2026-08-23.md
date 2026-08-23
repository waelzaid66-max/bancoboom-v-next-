# Receiving verdicts — what is accepted, what is rejected, and exactly why

**The owner asked for the highest wave of scrutiny: receive what is sound, reject what is broken. Every verdict below is a measurement, and every rejection names the one change that reverses it.**

`canonical @ 4f2c81c` — **frozen 43 hours**. **2026-08-23.**

---

# §1 · ✅ ACCEPTED — `release/reconciled-rc-20260823`

**This is the strongest single piece of work I have received in this engagement, and it answers order `E-3` directly.**

**`scripts/replit-prod-route-smoke.mjs` (201 lines)** boots the whole production router stack on isolated ports and asserts real HTTP:

```
surfaces asserted:   "/"   "/admin/"   "/market/"   "/banco-mobile/"   "/api/healthz"
health assertions:   json.status === "ok"   (three separate checks)
failure mode:        throw new Error(`${route} returned HTTP ${response.status}: …`)
process ownership:   "smoke owns the whole process group so an interrupted or failed
                      run cannot orphan" — its own comment
```

**And `replit-prod-start.sh` is made fail-closed and testable:**
```bash
+ ROUTER_PORT="${ROUTER_PORT:-5000}"   API_PORT="${API_PORT:-8080}"   MOBILE_PORT="${MOBILE_PORT:-3000}"
+ require_command()   → exits 1 if a runtime binary is missing
+ require_free_port() → exits 1 if the port is already taken
+ NGINX_MIME_TYPES derived from the resolved nginx prefix instead of a hard-coded path
```

> **`/banco-mobile/` is in the asserted set. That is the Cars UI. This smoke would have caught the exact staleness the owner is reporting** — a surface that returns something other than 200 fails the run.

**⚠️ ACCEPTED WITH ONE REJECTION: the wiring.**
```
package.json  "ops:prod-route-smoke": "node scripts/replit-prod-route-smoke.mjs"   ✅
ci.yml        files changed: 0        invocations: 0                              🔴
```
**A smoke test nothing invokes is a smoke test that does not exist.** *This is the fourteenth time in this engagement — and it is the smallest fix of all of them.*

**REVERSES ON:** one line in `ci.yml`. **DONE:** the run appears in a CI job list.

---

# §2 · ✅ ACCEPTED — `test/notification-recipient-language-red-20260823`

```
2 commits · NotificationRecipientLanguage.gate.test.ts (143 lines)
reachability: UNREACHABLE 5   ← the canonical baseline only; adds ZERO dead guards
```
**An `api-server` `src/**/*.test.ts`, which vitest auto-discovers.** *Correctly wired with no `package.json` edit needed, because the author put it where the runner already looks.* **The right instinct.**

---

# §3 · 🔴 REJECTED — `test/metro-build-ownership-red-20260823`

```
7 commits · 3 test files · 492 lines
reachability: UNREACHABLE 8   ← 5 baseline + THREE new dead guards
```
```
artifacts/banco-mobile/tests/metro-build-ownership-red.test.mjs
artifacts/banco-mobile/tests/metro-build-ownership.behavior-red.test.mjs
artifacts/banco-mobile/tests/metro-build-ownership.process-red.test.mjs
```

**The branch grew from 1 file to 3 across seven commits — "strengthen", "make self-contained", "prove Metro timeout leaves no owned process orphan" — and none of the three can be executed by any runner in this repository.**

> **Four hundred and ninety-two lines of careful work that will never run once.** *The content may well be excellent; I cannot tell, because nothing executes it.*

**REVERSES ON:** three `test:*` entries in `artifacts/banco-mobile/package.json` plus the aggregate, resolved with `audit/tools/union-mobile-package-json.mjs`. **DONE:** `node audit/tools/guard-reachability.mjs <branch>` returns **UNREACHABLE 5**.

---

# §4 · 🔴 REJECTED — `fix/auth-account-deleted-retry-20260822`

```
22 commits · chain 245/245 · typecheck RED
sessionId ?? null   :  0 · 0 · 0 · 0        (banco-web, banco-website, admin-os, dealer-os)
unguarded sites     :  8
```
**Filed with the exact one-line fix on 2026-08-22. Since then the branch has gained three commits — `bind dealer`, `bind mobile`, `preserve in-flight teardown` — and extended the same defect to two more surfaces.**

> **The fix is `sessionId ?? null`, and the function it calls already does exactly that internally.** *It has been specified for over a day.*

**REVERSES ON:** eight characters at each of eight sites. **DONE:** `pnpm run typecheck` exits 0 from the repository root.

---

# §5 · 🔴 REJECTED — the whole car-header family, on measurement

**Eight branches, four distinct trees, zero green.** *Full table in `CAR-HEADER-FAMILY-ALL-EIGHT-ARE-RED-2026-08-23.md`.*

**And the strongest of them is one assertion from green — an assertion I have since proven is satisfied by a documentation comment.** `fix/car-header-unified-dock-v2` carries the **byte-identical ternary** to canonical at line 267 and fails only because it reworded a doc block.

**REVERSES ON:** replace the assertion with the two-slot expression (`D-0a` final), remove `toHaveAccessibilityState` (it throws `TypeError` — it is not registered), and import `SearchSort` instead of re-declaring a five-value `SortKey`.

---

# §6 · 🔴 REJECTED — branch hygiene. **Thirteen branches carry four states.**

```
1d88550  ×3   car-header-clean-rebuild · car-header-clean-splice · staging/car-clean-semantic-splice
3ee1f12  ×2   car-header-unified-dock-v2 · tmp/car-guard-byte-preserve
8505850  ×3   profile-visible-role-authority-clean · profile-visible-role-clean · staging/profile-role-one-hunk
4f2c81c  ×4   maps-bootstrap-error · profile-visible-role-authority · replit-runtime-integrity-p0 · polish/native-mobile-uiux-wave
              ← these four are EXACTLY canonical. Zero commits. Zero work.
```

**Six scratch namespaces on the shared remote:** `probe/` ×1 · `staging/` ×4 · `tmp/` ×1.
**And one branch literally named `noop-do-not-create`.**

> **Nine branches are pure duplication of four states, and four of those "branches" are canonical itself under a different name.** *A reader counting branches to judge progress is being told a number three times larger than the work.*

**REVERSES ON:** delete them. **Combined with the 28 fully-merged branches, the remote drops from 78 to roughly 40, and every remaining name means something.**

---

# §7 · The pattern, named

**Across everything received today:**

| Branch | work quality | wiring |
|---|---|---|
| `release/reconciled-rc` | **excellent** | 🔴 not in CI |
| `notification-recipient-language-red` | good | ✅ correct |
| `metro-build-ownership-red` | unknown — 492 lines | 🔴 3 dead |
| `auth-account-deleted-retry` | 22 commits of real work | 🔴 red on a one-line defect |
| car-header ×8 | four real attempts | 🔴 red on three known defects |

> **The engineering is not the problem in a single one of these. Every rejection is wiring, hygiene, or a one-line fix that has been specified and not applied.**

**Fourteen guards have now shipped dead. The tool that detects it takes two seconds and has been in the repository since yesterday:**
```
node audit/tools/guard-reachability.mjs origin/<branch>
```

---

# §8 · What I am running now

**A five-gate receiving matrix — install · chain · typecheck · mobile · *and the API suite against a real PostgreSQL* — across seventeen un-received branches.** *The four-gate version could not run the API suite, and that gap let two RED-by-design branches read as green. This closes it.*

**Results will be published as measurements, not predictions.**

---

# §9 · Standing

**Register: 31 classes · 9 at P0 · 1 at P2 · 34 corrections published.**
**Trunk candidate `local/owner-assembly-20260822-r2`: eight gates green, and it already contains the Replit build fix.**
**Canonical: frozen 43 hours.**

> **Two branches accepted today, five rejected, and every rejection is reversible by a change smaller than the work already in the branch.**

---
*Every verdict measured: reachability by the committed tool, duplicate tips by comparing `%(objectname)` across all remote refs, the route smoke read in full including which surfaces it asserts, and the auth branch's unguarded sites counted per file. The `ci.yml` absence confirmed by both a diff and a grep rather than one of them. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
