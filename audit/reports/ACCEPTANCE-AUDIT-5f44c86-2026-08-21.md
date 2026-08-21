# Acceptance audit — `canonical/vnext-assembly @ 5f44c86`

Owner-directed acceptance review: the program is to be received at professional standard, and no defect is to pass. Every figure below was **executed** against the head on **2026-08-21 05:41 UTC**, not carried forward.

**Verdict: the source is acceptable. The runtime is unwitnessed. Those are different statements, and only the first can be signed off from here.**

---

## 1 · Acceptance battery — executed on `5f44c86`

| Gate | Result |
|---|---|
| Working tree at checkout | ✅ clean |
| `pnpm install --frozen-lockfile` | ✅ exit 0 |
| Dependency security | ✅ **0 blocking** (2 waived, dated) |
| Chain integrity | ✅ **242 / 242** |
| Production confidence (full run) | ✅ **26 / 26** |
| Mobile render | ✅ **121 / 121** across 16 suites *(was 120)* |
| Mobile full regression pack | ✅ exit 0 |
| Root `npm run build` | ✅ exit 0 |
| `eslint scripts --max-warnings 0` | ✅ exit 0 |

**Eight of eight gates pass.** Render grew by one test — the new tile-failure mount, see §2.

## 2 · ✅ G-1 closed — and implemented better than I recommended

`5f44c86 fix(maps): surface OSM tile failures`, 9 files, +191 / −9.

**The manager rejected the wrapper-module approach on the branch and took a stronger one.** My M-1 finding on that branch was that the guard hardcoded `tile.openstreetmap.org`, so it would silently stop matching the day C-2 moves the provider. **The landed implementation makes that failure structurally impossible:**

```js
var tileFailureReported = false;
var tileLayer = L.tileLayer("${OSM_TILES}", { … });
tileLayer.on("tileerror", function () {
  if (tileFailureReported) return;
  tileFailureReported = true;
  post({ type: "tile_error" });
});
tileLayer.addTo(map);
```

Four details, each correct:

1. **Leaflet's native `tileerror`** on the layer object — no DOM sniffing, no host string anywhere. The layer is built from the canonical `OSM_TILES` constant, so **a provider change carries the handler with it**. M-1 cannot recur.
2. **Listener attached before `addTo(map)`** — no tile can fail before the handler exists.
3. **A latch** — one signal per session, not one per failed tile.
4. Uses the existing `post()` bridge helper rather than a parallel channel.

**And the user-visible half is real**, which is the entire point of G-1:

```
EN  "Map temporarily unavailable" / "Map tiles couldn't load. You can keep using
     the results and listings, then reopen the map to try again."
AR  "الخريطة غير متاحة مؤقتًا" / "تعذّر تحميل صور الخريطة. تقدر تكمّل في النتائج
     والإعلانات، وبعدها افتح الخريطة تاني للمحاولة."
```

Bilingual, in the app's own register, **honest and actionable** — it states what failed, that the rest of the app still works, and what to do. Both hosts show it once per mount via a ref latch, and `setReady(true)` is still called so the loader never hangs.

**My M-2 was also addressed**, and properly: a **real render test** was added — `it("surfaces a trusted tile failure once without blocking listing results")` — plus 25 lines of new `map-chrome-guard` assertions and a `render-coverage-guard` registry update. That is the static-plus-mount pair this repository's own standard requires, not a source-text assertion alone.

**This is the correct pattern and it should be the template for the remaining product gaps.**

## 3 · ⚠️ Correction to my own record — the map bridge was never unguarded

In two earlier reports I noted that the web host's `message` listener carried **no origin validation**, framing it as an inherited weakness.

**That was wrong.** The control exists, and in a stronger form than the one I searched for:

```js
if (event.source !== iframeRef.current?.contentWindow) return;
```

Validating `event.source` against that specific iframe's `contentWindow` is **stricter than an origin check** — it accepts messages only from that exact frame, not from any window at an allowed origin. For a `srcdoc` iframe this is the correct control.

Verified present on **`f45c32c`, `1ccdbac` and `5f44c86`** — it was always there. My grep searched for `origin` and missed `event.source`.

**This is the second time in this session a grep of mine was narrower than the property it claimed to measure** (the first: searching `reportError(` and missing `reportErrorAsync`). Both were caught by re-searching rather than by reasoning about the first result. **Recorded so this audit is weighed, not trusted.**

## 4 · Cumulative record — what the current manager has closed

| ID | Item | State |
|---|---|---|
| **C-5** | nanoid advisory blocking every branch | ✅ closed — 0 blocking |
| **I-6** | open `>=` overrides; `uuid` had absorbed 3 majors | ✅ closed — all four bounded, verified intact |
| **H-1** | origin guard rejected legitimate clones | ✅ closed — tested five ways |
| **L-1** | OSM attribution | ✅ closed — ODbL-correct, `rel=noopener`, tile source untouched |
| **C-3 / G-1** | tile failure invisible to the user | ✅ **closed** — §2 |
| — | SOT lock to BANCO BOOM NEXT | ✅ added, with reasoning recorded |

**Six items closed in roughly eight hours, with no guard weakened, no frozen surface disturbed, and no orphaned test introduced.** The deviation check in the previous audit returned clean and remains clean on this head.

## 5 · What remains — and who can close each

### 🔴 On a clock — 19 days

**G-3 · `IMAGE_SIZE_WAIVER_EXPIRES_AT = 2026-09-09`.** Re-verified today: `patched >=2.0.3`, `latest` is still **`2.0.2`**. **Upstream has not shipped.** On expiry the gate fails with two blocking advisories and **nothing to apply**. The literal is pinned in **two** files — `dependency-security-gate.mjs:13` and asserted at `chain-integrity-gate.mjs:2110`.

Three options, all the manager's: wait for `2.0.3` · extend the date (a recorded, deliberate weakening) · accept red CI from that date. **Doing nothing selects the third.**

### 🟠 Product gaps — engineering, ready to start

| Item | Note |
|---|---|
| **Discover ×4** — popular brands, saved searches, trending, recently viewed | 1 of 5 done. Peak source preserved (935 lines), JSX extracted (146), i18n complete EN+AR, styles orphaned in place, handlers live. **Blocked by two guards + one design ruling**, not by code |
| **H-3** block/mute | **Must be built** — full-history search of both source-of-truth repos returned zero. Also a store-review risk: a marketplace with DMs and no block/report path |
| **C-4** language never reaches the server | contract + codegen |
| **G-2** Clerk host allowlist | Mandated by Clerk's own docs. Bypass **refuted**; availability/session only. Exploitability depends on the Traefik hop — **`UNKNOWN`**, only the manager can check |
| Observability seam | Correct and wired, but **no chain assertion and no redaction test** — the only production-critical seam here without a guard |

### 🟡 Owner decisions — zero code

**C-1** the tag decision (0 tags, deploy has never fired) · **C-2** tile provider procurement · **M-4** `enterprise` **and** `company` — two enum values no shipped client can reach, **one decision** · **H-2** social sign-in — reported enabled, needs a `pk_live_` build to verify.

### 🟢 Documentation

**CH-1** a status table marks Discover `COMPLETE` · **CH-2** RC report claims no `deploy/gcp` (it exists, with a CI gate) · **CH-3** an overclaiming filename · **NEW** `MAPS-ACCOUNTS-COMPLETE-MISSING-2026-07-21` names four Maps tools as missing — **all four shipped**. Zero risk, and it stops finished work being re-litigated.

### ⚫ The real remaining distance — no audit can close it

**Not one native render and not one real-browser WebView render has been performed in any investigation to date.** Neither has: the device matrix (320–430, AR/EN, RTL/LTR) · live Clerk journeys and two-account switching · live providers (Paymob, S3, push, email) · Docker/Compose/Coolify runtime · production DB adoption, backup, restore, rollback · **full-workspace lint** (the CI job covers `scripts` only — the ledger says so explicitly).

**This is the honest shape of the project: the source is strong and the runtime is unwitnessed.** It moves only with a device, a browser, and live credentials.

## 6 · Acceptance criteria for production sign-off

Stated so the standard is explicit rather than implied.

**Already satisfied**

1. ✅ All static gates green on one SHA — verified above on `5f44c86`
2. ✅ No blocking security advisory
3. ✅ No guard weakened, no frozen surface disturbed, no orphaned test
4. ✅ Every recovery claim carries SHA + CI evidence

**Not yet satisfied — and each is a hard gate, not a preference**

5. ❌ **Exact-SHA CI on the current head.** The RC branches target `f45c32c` and `26b1fc0`; canonical is `5f44c86`. **No CI artifact exists for the head.** Two RCs in a row were cut before the head settled — **cut the RC last.**
6. ❌ **One native render on a physical Android and iOS device.**
7. ❌ **One real-browser WebView render.**
8. ❌ **Live provider journeys** with real credentials.
9. ❌ **A deployment rehearsal** — Docker/Compose/Coolify, plus a restore drill.
10. ❌ **Full-workspace lint**, not the `scripts`-only job.
11. ❌ **The 2026-09-09 decision**, taken deliberately rather than by default.

**Verdict: source `ACCEPTED`. Production `NO-GO` until 5–11 are closed** — which is consistent with the previous manager's own recorded position and unchanged by anything in this batch.

## 7 · Directions to the working agents

1. **Cut the RC last.** Re-point at `5f44c86` and run exact-SHA CI. Until that artifact exists, nothing here is release-certified — only gate-verified by me.
2. **Use §2 as the template.** The tile-failure batch is the standard: native platform event over DOM sniffing · constant-derived rather than literal · listener before activation · one signal per session · bilingual honest copy · **and a static guard paired with a real mount.**
3. **Do not fight a guard — read its `why`.** The recent-search batch put the feature in the search chrome because that is what the blocking guard's own rationale prescribed. Apply the same reading to the remaining four Discover capabilities.
4. **Guard the observability seam** — three chain assertions and one redaction test. It is the only production-critical wiring here with nothing pinning it.
5. **Retire the stale branches** — `fix/nanoid-override` (merged), `maint/safe-batch-01` (superseded by `26b1fc0`), both `fix/maps-tile-failure-state*` (superseded by `5f44c86`), `fix/sot-lock-vnext-only` (merged), and both stale `ci/final-rc-*`.
6. **Correct the four stale documents** before anyone else reads them as current.
7. **Escalate items 6–9 of §6 to the owner.** They need hardware, credentials and a deployment window — they are not engineering tasks and no amount of further auditing will close them.

---
*Acceptance audit executed against `5f44c86`: gates run, diffs read, implementations traced to source. One correction to this auditor's own prior record is carried in §3. No file modified; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
