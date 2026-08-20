# CODEX INVESTIGATION HANDOFF — 05 · Maps

The owner reports that significant Maps work *"is still missing."* Maps is also the **only `P0 active`** row in `CODEX-RECOVERY-BACKLOG.md`, so this is the highest-value question open right now.

**The headline answer, verified independently rather than quoted: the Maps work is not missing from the source. It is unproven at runtime.** Those two states feel identical from the outside — a capability you built, cannot see working, and cannot point to a passing device test — but they need opposite responses. One needs recovery. The other needs a device.

Everything below was measured against `canonical/vnext-assembly @ f45c32c`.

---

## 1 · The prior forensic verdict, and my independent corroboration

`audit/reports/MAPS-MESSENGER-FORENSIC-RECOVERY-LEDGER-2026-08-10.md` separates the two domains sharply, and the distinction is the whole answer:

| Domain | Source result | Classification |
|---|---|---|
| **Maps** | *"Latest known committed Maps hub and all later map capabilities are **present and wired**"* | `UNPROVEN` — **preserved source, runtime not certified** |
| Messenger | *"the claimed advanced realtime/integrity wave is **absent from source**"* | `UNPROVEN` — no recoverable Git object |

**Messenger is where work is genuinely gone. Maps is where work exists but has never been watched running.** Corroborated by an independent capability sweep of `artifacts/banco-mobile`:

| Capability | Files carrying it |
|---|---|
| locate-me / near-me | **18** |
| bookable pin (📅) | **14** |
| clustering | **12** |
| draw-area / geo polygon | **5** |
| `MapOverlayChrome` | **5** |
| `marketCountryMapCenter` | **5** |
| `MapPinPicker` | **3** |

This is not the footprint of a stripped feature.

## 2 · ✅ The 2026-07-21 "deferred" list is fully stale — all four shipped

`audit/MAPS-ACCOUNTS-COMPLETE-MISSING-2026-07-21-AR.md` deferred four Maps tools as *"not shipped as complete products."* **Every one of them is in the tree today.** Verified individually:

| Deferred 2026-07-21 | Status on `f45c32c` | Evidence |
|---|---|---|
| Adjustable radius UI — *"crowds the compact FilterSheet"* | ✅ **shipped** | `FilterSheet.tsx:883-887` — chip selector, `const active = criteria.nearRadiusKm === km`, `onPress={() => onUpdate({ nearRadiusKm: km })}` |
| `sort=nearest` — *"Wave-5 deferred"* | ✅ **shipped, with an honesty guard** | `FilterSheet.tsx:56` in the sort list; `:291-295` MAP-08 refuses `nearest` without coordinates and tells the user, instead of silently falling back |
| Full web viewport clusters — *"separate wave"* | ✅ **shipped, at parity** | `SearchResultsMap.web.tsx` carries **22** `cluster` references against **21** in the native host |
| near-me on web — *"`Platform.OS === "web"` → null by design"* | ✅ **shipped** | web host consumes `criteria.nearMeEnabled` at `:106` and `:138`; no web platform-gate remains |

**Recommendation:** mark that document `SUPERSEDED`. Read today it says four Maps tools are missing when none of them is — and it is the kind of file an owner or a new agent would open first when asking exactly this question.

## 3 · ✅ The one confirmed wipe was recovered, and is now guarded

The same document records one proven loss: **map centre by market**, original `b68c8af`, wiped by `93b650b`.

**Recovered and protected.** `marketCountryMapCenter` is imported and applied in **both** hosts — `SearchResultsMap.tsx:24,115` and `SearchResultsMap.web.tsx:22,105` — and locked by **two** chain-integrity guards: `P-map-market-center` (`:122`) and `P-map-market-center-wired` (`:151`). It cannot silently regress again.

## 4 · 🔍 New forensic link — one commit damaged two sections

`93b650b`, the commit that wiped the map centre, is **also listed among the Discover shrink commits** in `CODEX-RECOVERY-BACKLOG.md`. It is a single incident with two victims.

And it is **not recoverable**: `git cat-file -t 93b650b` fails in **both** `bancoboom-v-next-` and `bancoboomstor`. It belongs to the older `-BANCO-CA-OOM-` repo and is among the 17 unresolved anchors.

**This matters for how you read the ledger.** The two damage events were adjudicated separately — Maps under Maps, Discover under Discover — but they share a cause. The Maps half was recovered and guarded; **the Discover half was not** (Handoff 02: the restore is written, and two guards forbid it). Same commit, two outcomes.

## 5 · 🔴 The Maps gap that is real, and is smaller than I first reported

Handoff 01 recorded G-1: no `tileerror` handling. **Further investigation strengthens it and shrinks the fix.**

The bundled Leaflet build **already emits the event** — `tileerror` appears in `components/search/mapVendorInline.ts` (the vendored minified library). **The project subscribes to nothing.** Verified: zero `tileerror` references anywhere in `artifacts/banco-mobile` outside the vendor file, and no `.on("error")` on the tile layer in `mapHtml.ts`.

So the capability is **already in the bundle**. What is missing is one listener and one message.

Recap of the consequence, unchanged: the bridge already declares `| { type: "error" }` (`mapHtml.ts:62`) but emits it only when Leaflet itself fails to load (`:361`, `if (!window.L)`). The native host treats `error` identically to `ready` — `SearchResultsMap.tsx:327` calls `setReady(true)` — so a failed map **hides its loader and presents a blank grey canvas with pins and no message**. The web host handles `error` not at all. No test covers any of it.

**And the project already knows the right pattern, one branch below.** `locate_error` at `SearchResultsMap.tsx:331` raises a real alert with a settings deep-link, justified in its own comment as *"never leave Android/iOS users with a dead locate button."* Map load failure gets no such honesty.

**Why this is the correct next Maps unit, once C-5 lands:**

- It is the visible face of **C-2**. The basemap runs on OSM public tiles whose policy does not cover commercial or heavy use, and **that policy is enforced by blocking**. The day it is enforced, this handler is the difference between "the map is unavailable, retry" and a silent grey rectangle.
- It is the only Maps item where **source is missing**, not merely uncertified. Everything else in §1–3 needs a device; this needs a listener.

## 6 · What Maps actually needs — and it is not code

Per §1, the Maps distance is **runtime certification**. Nothing in this handoff discharges any of it:

- Real browser and real WebView render — **never performed** in any investigation to date
- Android and iOS device matrix, 320–430, AR/EN and RTL/LTR
- Large-result and latency behaviour; rapid category churn against the VNX-06C debounce
- `MapPinPicker`, accessibility, and the five-domain map/list journey
- Live tile provider behaviour under real load — which is also the C-2 decision

**`UNKNOWN — requires verification`** on every row above. None can be closed from this sandbox: it has no device, no browser, and the network policy here blocks external hosts.

## 7 · Evidence record

| Field | Value |
|---|---|
| **Feature** | Maps mini-app, full surface |
| **Current state** | Source preserved and wired; four previously-deferred tools all shipped; one historical wipe recovered and double-guarded; one real source gap (`tileerror`); runtime uncertified across the board |
| **Expected state** | Same source, plus a tile-failure state, plus device/browser certification |
| **Repository / branch / commit** | `bancoboom-v-next-` · `canonical/vnext-assembly` · `f45c32c` |
| **Files** | `components/search/mapHtml.ts:62,361` · `SearchResultsMap.tsx:24,115,327,331` · `SearchResultsMap.web.tsx:22,105,106,138` · `FilterSheet.tsx:56,291-295,883-887` · `mapVendorInline.ts:752` · `scripts/chain-integrity-gate.mjs:122,151` |
| **Tests** | VNX-06A/B/C frozen with CI evidence. **Zero** coverage for tile failure |
| **Historical context** | `85cfe7f` Maps hub → `e4d36b6` red identity → `89d28d3` migration snapshot. Wipe `93b650b` (absent from both repos) hit the map centre **and** Discover; original `b68c8af` recovered |
| **Confidence** | **HIGH** on every source claim — each re-measured today. **UNKNOWN** on all runtime rows |
| **Regression risk** | `mapHtml.ts` is shared by both hosts. `map-chrome-guard.test.mjs:409` pins `/tile\.openstreetmap\.org/` — **the tile source must not change**; that is C-2, a procurement decision. VNX-06A owns `areaCount`, the single clipped publish path, and the sequence-before-cache guard — an added listener must not touch them |
| **Classification** | Maps source **`VERIFIED PRESENT`** · deferred list **`SUPERSEDED`** · map centre **`RECOVERED` + guarded** · `tileerror` **`VERIFIED MISSING`** · Maps runtime **`UNPROVEN`** |
| **Recommended action** | Mark the 2026-07-21 document `SUPERSEDED`; keep `tileerror` as the next Maps unit after C-5; escalate device/browser certification as the real remaining distance |

---
*Handoff 05 — investigation only. Nothing in `artifacts/` modified, no guard amended, `canonical/vnext-assembly` untouched at `f45c32c`. The owner's Maps work was searched for as potentially lost and found preserved; the finding is reported that way rather than dressed as a recovery.*
