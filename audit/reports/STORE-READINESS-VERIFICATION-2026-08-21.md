# Store readiness — their claims verified independently

Continuation of the deep audit into the areas not yet examined: mobile/EAS/store readiness, and the five-headers verdict. **I verified each claim against the source myself rather than accepting the report.** Executed **2026-08-21 22:20 UTC** at `canonical @ 4f2c81c`.

**Result: their store-readiness audit is accurate on every point I could test. One of its findings is more serious than they classified it — and one item is on a shorter clock than anything else I have been tracking.**

---

## 1 · 🔴 A Play service-account key would be committed to a public repository

**They classified this P1 operational/security. On the evidence it is straightforwardly a security finding, and the reason is that this repository is public.**

`eas.json` submit profile:

```json
"submit": { "production": { "android": {
  "serviceAccountKeyPath": "./google-service-account.json",
  "track": "internal"
} } }
```

That path is `artifacts/banco-mobile/google-service-account.json` — a **Google Play service account private key**, the credential that can publish releases to your Play listing.

**I tested whether git would ignore it, rather than reading `.gitignore` and inferring:**

```
$ touch artifacts/banco-mobile/google-service-account.json
$ git check-ignore -v google-service-account.json
$ echo $?
1          ← NOT ignored
```

**Exit 1. No ignore rule covers it, in either `.gitignore`.** I searched both for `service-account`, `google-service`, and a blanket `*.json` — **none exists.**

**And I confirmed earlier in this engagement, from the GitHub API, that this repository is `private: false`.**

So: the release path instructs an operator to place a Play publishing key at a location git tracks, in a public repo. **One `git add -A` publishes it.** Nothing in the repository prevents it, warns about it, or detects it afterwards.

**Order — three lines, and it costs nothing:**
1. Add `google-service-account.json` (and `*.p8`, `*.p12`, `*.keystore`, `*.mobileprovision`) to `.gitignore`.
2. Prefer the EAS-hosted credential path or an env-var indirection over a repo-relative file path.
3. **Pin it with a chain assertion** — the ignore rule must not be removable silently.

**Done means:** `git check-ignore` returns 0 for that path, and a guard fails if the rule disappears.

---

## 2 · ⏰ Android target API 35 — on a shorter clock than the waiver

**Verified in source.** `artifacts/banco-mobile/app.json:140-144`:

```json
"expo-build-properties", { "android": {
  "compileSdkVersion": 35,
  "targetSdkVersion": 35
} }
```

On `expo: ~54.0.36`. **The pin below the SDK's Android capability is confirmed.**

**Their policy claim — that Google Play requires API 36 for new apps and updates from 2026-08-31 — I cannot verify from this sandbox, and I will not assert a policy date I have not checked.** I classify it **`UNKNOWN — owner to confirm`**, with this note: an annual target-API deadline at end of August is Play's long-standing cadence, so the claim is consistent with the known pattern rather than surprising.

**If it holds, it is a 10-day clock — tighter than the 2026-09-09 waiver I have been reporting as the nearest deadline, and I should have surfaced it sooner.** The two must now be tracked together:

| Clock | Days | Verified by me |
|---|---|---|
| Play API 36 | **~10** | config ✅ · policy date `UNKNOWN` |
| Image-size waiver | 19 | ✅ fully |

**Order:** confirm the Play date from the console, and if it holds, move compile/target to 36 **now** — then re-run Android device regression. **Do not claim compatibility from config alone**; that is their own wording and it is right.

---

## 3 · ✅ iOS submit profile — verified empty, will fail non-interactively

```json
"ios": { "appleId": "", "ascAppId": "", "appleTeamId": "" }
```

**Three empty strings.** A non-interactive `eas submit` cannot resolve an App Store target. Confirmed exactly as reported. Owner-supplied values — not an engineering task.

---

## 4 · ✅ `EAS_NO_VCS=1` on every profile, including production

```json
"build": { "base": { "node": "24.18.0", "env": { "EAS_NO_VCS": "1" } } }
```

Every profile extends `base`, so **production builds do not use git as the source archive.** Combined with `"appVersionSource": "local"`, `versionCode: 1` in `app.json`, and `autoIncrement: true` in the production profile, **a produced binary cannot be traced back to a commit by the build system itself.**

That matters here more than usual: **CI cannot execute**, so a build artifact's provenance would rest entirely on manual record-keeping. Their "release traceability risk" classification is correct.

*One thing worth noting in their favour:* `"node": "24.18.0"` in `base` means **EAS builds on Node 24 — matching CI, not my sandbox's Node 22.** That is the right pin, and it is another reminder that my figures are Node 22 figures.

---

## 5 · ✅ Five headers — I agree with their verdict, and it is the right call

> *"No CURRENT source defect was reproduced in the five header components or their host placement during this pass. Do not rebuild or redesign them."*

**I concur.** My own sweep of `CarsHomeHeader` found no capability loss — testIDs, handlers and i18n keys all preserved or grown; the only failure is a **source-text guard** disagreeing with a ternary, which is a contract decision, not a defect.

**Their "do not overclaim" section is the most professionally honest passage I have read in these reports.** It names exactly what remains unproven — safe-area, font metrics, 320/360/390/430 pressure, keyboard, RTL/LTR, map overlay collision — and refuses to call historical web screenshots native proof.

**Their hard regression rules should be preserved verbatim and pinned.** Every one encodes a defect that was already fixed once:

- never move actionable controls into `SearchResultsSurface.listHeader`
- never restore a second Cars market/sort seat
- never restore a second Materials origin seat
- never share one scroll SharedValue across section worlds
- never remove map handlers, testIDs, category lock or bottom-nav clearance to simplify tests

**These are `why` clauses without guards.** Five rules stated in a document that nothing enforces — exactly the `GUARD-01` pattern. **Order: pin each one with a chain assertion, or accept that the next refactor re-breaks them.**

---

## 6 · Where this leaves the clocks

| | Item | Days | Owner action |
|---|---|---|---|
| 🔴 | **Play API 36** | **~10** | confirm date, then move to 36 |
| ⏰ | Image-size waiver | 19 | wait · extend · accept red |
| 🔴 | CI cannot execute | — | account/platform level |
| 🔴 | `DEPLOY-01` | — | one migration line |
| 🔴 | Play key not gitignored | — | three lines, do it today |

**The store path has more short-clock items than the codebase does.** Three of the five above need nothing but a decision or a few lines — and two of them are cheaper than the reports describing them.

---

## 7 · Assessment of their audit quality

**Verified accurate on every testable point.** The service-account path, the API 35 pin, the empty iOS profile, `EAS_NO_VCS` inheritance, the version-source ambiguity — all confirmed by independent execution.

**Two refinements from my pass:**
1. The service-account finding is **more serious than P1-operational** — public repo, no ignore rule, tested not inferred.
2. The Play deadline needs owner confirmation before it drives a schedule; I will not pass on a policy date I cannot check.

**No overclaiming found in this batch.** The report states its own coverage gaps before anyone asks, which is the behaviour I have been asking for across this engagement.

---
*Verified at `canonical @ 4f2c81c` by reading `app.json`, `eas.json` and both `.gitignore` files, and by executing `git check-ignore` rather than inferring from rules. The Play policy date is classified `UNKNOWN` because I cannot check it from here. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
