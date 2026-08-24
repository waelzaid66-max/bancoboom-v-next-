# Canonical moved for the first time in three days — and the tree is byte-identical

**Two commits landed. The first adds a file containing the word `# test`. The second deletes it twelve seconds later. Net change to the product: zero.**

**The real overnight work is on branches, and it is good: a Replit Nix router `P0`, a serious six-repository maps forensic ledger, and a RED test proving the web map never fails closed. I closed that one — it was true, and it was true on my green assembly too.**

`origin/canonical/vnext-assembly` `4f2c81c` → `6d83cb5` · union at 181 commits, 99 files, pushed. **2026-08-24.**

---

# §1 · The freeze did not break

```
tree 4f2c81c   0353df69c09ed5279fa4d763a2e884751f9364f7
tree 6d83cb5   0353df69c09ed5279fa4d763a2e884751f9364f7
identical      YES          files differing: 0
```

```
d8659e4  audit(maps): establish six-repo reunion ledger      → + "# test"   (1 line)
6d83cb5  revert(audit): remove accidental placeholder file   → − "# test"
```

> **Canonical has now moved twice in three days and shipped nothing either time.** *The 150-line ledger that commit was meant to carry is real and excellent — it lives on `fix/miniapp-web-viewport-shell-20260823`. What reached canonical was the placeholder.*

**Consequence for the assembly: none.** *`local/audit-union-20260823` needed no rebase — it is built on the same tree.*

---

# §2 · `fix/replit-nix-router-p0-20260824` — the strongest thing in this wave

**9 commits, 5 files, and it is exactly the owner's blind spot:**
```
fix(replit): make production build fail closed
fix(replit): align library stage with root build semantics
fix(replit): run canonical full typecheck before preview builds
fix(replit): declare nginx Nix runtime dependency
fix(replit): resolve Nix nginx router runtime
```

**It strictly contains `fix/replit-build-integrity-p0-20260822`** — verified by ancestry, and by content: `replit-prod-build.sh` is byte-identical on both (`9b471b747f`, 99 lines). What it adds is the runtime that actually serves the preview:

| file | canonical | union now |
|---|---|---|
| `replit-prod-start.sh` | 286 lines | **304** — the nginx Nix router |
| `.replit` | 238 lines | **242** — the Nix dependency declared |
| `replit-router-integrity.test.mjs` | — | **new** |

```
$ pnpm --filter ./scripts run test        # pass 21   # fail 0
```
**Merged clean. Both integrity guards green.**

*And they only run at all because of the `"test"` script I added to the `scripts` package yesterday — that package had a guard file on disk and no runner. **The colleagues' new guard was wired the moment it arrived, by a fix made before it existed.***

---

# §3 · The maps ledger — their diagnosis, and mine, are the same diagnosis

**Their executive finding, verbatim:**
> *"a large part of the allegedly missing Maps work is **not absent from canonical source**. It is present in current source but **has not been certified as mounted/runtime-visible on one exact integrated SHA**."*

**That is structurally identical to what I measured on Cars:** *eight branches carrying a byte-identical header rewrite, contained in zero of six assemblies.* **Source-present, integration-absent, runtime-uncertified.** *Two independent investigations, different subsystems, same shape.*

**Their reunion law is sound and I am adopting it as written for maps work:** no whole-branch legacy merges · no old full-file replacement · trace `historical source → current canonical → current integration → mounted runtime` · only `UNIQUE_MISSING` or proven `PARTIAL` may create Product repair.

**Their explicit ask is "prove on ONE exact integrated SHA".** *`local/audit-union-20260823` is one exact integrated SHA with a green render suite — that is what §4 begins to do.*

---

# §4 · 🔴 `test/maps-web-bootstrap-failclose-red-20260824` — true, and true on my assembly

**Their new RED test, run unmodified against the union:**
```
not ok 1 - web map host explicitly consumes bootstrap error messages
  error: 'web SearchResultsMap must explicitly handle the map bootstrap error bridge message'
# pass 3  # fail 1
```

**Confirmed by reading the host:** `SearchResultsMap.web.tsx` handled `tile_error`, `viewport`, `area`, `draw_mode`, `select`, `locate_error` — **and neither `ready` nor `error`.** `MapOverlayChrome` rendered **unconditionally**.

> **On the website, a dead Leaflet showed the full control surface floating over a grey void, and said nothing.** *The native host has shown a localized "map unavailable" panel since the fail-closed branch landed. The parity was never done.*

**And the host was discarding signals it already receives — verified in the generator, not assumed:**
```js
mapHtml.ts:363   if (!window.L) { post({ type: "error" }); return; }
mapHtml.ts:678   post({ type: "ready" });
mapHtml.ts:353   window.parent.postMessage(s, "*");     ← the web path
```

## The fix — native parity, one shared type

**`MapBootstrapState` is now exported from the native module and imported by the web one, so there is one definition.** *Web mirrors native exactly: loading indicator · terminal failed panel with `testID="search-map-bootstrap-failed"` and the same i18n keys · chrome gated on `ready` · `tile_error` can never revive a failed bootstrap.*

## The four render tests that broke, and why editing them was not weakening them

**They mounted the map and asserted on chrome without ever delivering `ready`** — a host state the browser never sits in, because the srcDoc posts `ready` on every successful boot. **`mountMap` now posts it, as the real iframe does**, and a **new** test proves the path the fix adds: `error` hides the chrome and shows the panel, and a following `tile_error` does not revive it.

```
team guard        4/4          render   18 suites · 130/130   (was 129)
mobile typecheck  exit 0
MUTATION — fix reverted:   guard 3/4 · render 129/130
```
**Both directions are protected: a source guard and a mounted render assertion, each proven to fail without the fix.**

---

# §5 · The other four RED branches, run against the union

| branch | result on the union |
|---|---|
| `test/financing-offer-money-red-20260823` | 🔴 **9 failed / 2 passed** — genuinely RED, two assertions already met |
| `test/notification-recipient-language-red-20260823` | 🔴 **5 failed / 2 passed**, 2 files |
| `test/eas-native-distribution-provenance-red-20260823` | 🔴 0/1 |
| `test/messenger-offer-client-red-20260823` | 🔴 0/1 |
| `test/native-distribution-provenance-red-20260823` · `test/metro-build-ownership-red-20260823` | 🔴 0/1 each |

**All correctly RED, all correctly excluded from the assembly (condition ⑬).**

**⚠️ And a near-miss of my own:** *my first probe of the financing test reported `Cannot find module './PaymentService'` and I was one step from recording "the service does not exist". **It does** — `src/services/PaymentService.ts`, 
right where the test expects it. I had copied the probe to `src/` instead of `src/services/`, so the relative import did not resolve. **My probe's placement, not the code.** Re-run in the correct location it gives the real answer: 9 of 11.*

---

# §6 · The battery, on the updated assembly

```
chain-integrity-gate                    247/247 passed
production-confidence (CI mode)          24/24 passed
root  pnpm run typecheck                 exit 0
api-server suite (disposable child DB)  518 passed | 3 skipped | 0 failed
baseline adoption matrix                 14/14
mobile guard pack                        42 green scripts, all 42 invoked
mobile render                            18 suites · 130/130
scripts (Replit build + router)          21/21
guard-reachability                      168 of 169 — the 1 is the declared RED guard
```

**181 commits · 99 files · 14 branches merged · pushed to `origin/local/audit-union-20260823`.**

---

# §7 · What this wave changes about the standing picture

**Nothing about the sequencing.** *`fix/replit-nix-router-p0-20260824` now supersedes `fix/replit-build-integrity-p0-20260822` as the item that must land before the freeze lifts — it is the same fix plus the router runtime that serves the preview. Ship the Cars header without it and the owner still sees nothing.*

**One thing about the diagnosis.** *Two independent investigations — mine on Cars, theirs on Maps — have now converged on the same failure mode from opposite ends: **the work is written, and nobody assembles it or certifies it mounted.** That is no longer a hypothesis about one subsystem.*

**Register: 34 classes · 9 at P0 · 1 at P2 · 45 corrections published.**

> **The most useful thing anyone did overnight was write a test that says "this is broken" about code that was already merged.** *It was right, it was right about my green assembly too, and it cost four lines of bridge handling to close. That is the whole method working.*

---
*Canonical's two commits read in full and its tree compared by hash rather than by log. The Replit branch's containment of its predecessor established by ancestry AND by file hash. The maps RED test run unmodified before anything was changed. The bridge messages confirmed in `mapHtml.ts` — that the web path posts both `ready` and `error` to the parent — before the host was made to consume them. The four broken render tests diagnosed as exercising an impossible host state, and a new test added rather than an assertion relaxed. The fix mutation-tested from both the source guard and the render suite. Every RED branch run against the assembly, and the one probe that gave a false answer re-run in the correct location and reported as my error. Nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
