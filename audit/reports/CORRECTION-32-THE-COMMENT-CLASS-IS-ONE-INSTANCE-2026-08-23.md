# Correction #32 — I said the comment-satisfiable class was 1,400 lines wide. I measured it. It is one instance.

**Correction #31 found a guard satisfied by a documentation comment and I wrote that "every `assert.match(fileContents, /…/)` has this property — 1,400 lines of them."**

**That was an inference from a single case. I built a census, validated it against the case I already knew, and ran it over all 31 mobile guard files. Six assertions are comment-only. Five of them are deliberate. One is the defect I already found.**

`canonical @ 4f2c81c` · `audit/tools/comment-satisfiable-census.mjs`. **2026-08-23.**

---

# §1 · The census

**For every positive `assert.match(<file contents>, /…/)`, extract the literal runs the regex requires, then ask of the target file: does every occurrence of this token lie inside a comment?**

```
guard files                        : 31
positive assert.match sites        : 1071
RESOLVED and analysed              : 630   (59% coverage)
unresolved (target not derivable)  : 283
non-JS target (masker cannot read) :  12
token not present at all           :   7

code-only  (sound)                 : 573
🟡 prose-backstopped               :  51
🔴 COMMENT-ONLY                    :   6
```

**Coverage is stated, not hidden. 59% is what the resolver can bind to a file with confidence; the remaining 41% is unanalysed, never counted as sound.**

## ✅ It rediscovers the known case on its own

```
🔴 section-miniapp-guard.test.mjs   car/CarsHomeHeader.tsx   "testID="cars-home-header""
```

**That is Correction #31, found independently by a tool that was not told about it.** *That is the validation that makes the other five worth reading.*

---

# §2 · The six — classified by reading each one, not by counting

| # | Guard → file | Token | Verdict |
|---|---|---|---|
| 1 | `section-miniapp-guard` → `CarsHomeHeader.tsx` | `testID="cars-home-header"` | 🔴 **DEFECT** |
| 2 | `mobile-resilience` → `SessionContext.tsx` | `offline` | ✅ deliberate |
| 3 | `messenger-wiring-guard` → `messageTextOutbox.ts` | `serialized array order is the durable FIFO authority` | ✅ deliberate |
| 4 | `production-wiring-guard` → `messages/[id].tsx` | `Do NOT arm readyForOlder here` | ✅ deliberate |
| 5 | `production-wiring-guard` → `MessageThreadPanel.tsx` | `Soft refresh only` | ✅ deliberate |
| 6 | `section-miniapp-guard` → `business/banks.tsx` | `explanatory brochure only` | ✅ deliberate |

**The distinguishing test is the assertion's own intent, read in context:**

**#2 says so out loud:**
```js
assert.match(src, /offline/i, "session layer must mention offline behavior");
```
**"must mention".** *It is pinning documentation and it says it is.*

**#3, #4, #5 sit among real code assertions and pin the warning next to them:**
```js
assert.match(thread, /readyForOlderRef/);        // code
assert.match(thread, /nearBottomRef/);           // code
assert.match(thread, /Do NOT arm readyForOlder here/);   // the reasoning, pinned
assert.match(thread, /unique\.length === 0/);    // code
```
**That is a legitimate and rather good pattern** — it stops a future editor from deleting the reason a subtle line exists. *It protects prose on purpose, alongside assertions that protect code.*

**#1 is the only one whose neighbours are about emitted identity:**
```js
assert.match(header, /testID="cars-home-header"/);
assert.match(header, /carBrand|BOOM_LOGO/);
assert.doesNotMatch(header, /testID="section-sort-cycle"/);
```
**Nothing here is about documentation. The intent is the component's rendered testIDs — and a comment satisfies it.**

---

# §3 · ⚠️ And a false positive I caught before publishing

**The first run reported eight, including two on `deploy/coolify/Dockerfile.web`:**
```
🔴 universal-links-config → Dockerfile.web  ".well-known/apple-app-site-association"
🔴 universal-links-config → Dockerfile.web  ".well-known/assetlinks.json"
```

**I checked the file before writing it up. Lines 120–121:**
```dockerfile
COPY --from=builder /well-known/apple-app-site-association /usr/share/nginx/html/.well-known/apple-app-site-association
COPY --from=builder /well-known/assetlinks.json            /usr/share/nginx/html/.well-known/assetlinks.json
```

**Real `COPY` directives. My comment masker implements JavaScript comment syntax and a Dockerfile has none of it.** *Universal links are correctly shipped; the finding was my tool's, not the repository's.*

**Fixed by refusing to analyse non-JS targets and reporting them as a separate, explicitly unanalysed count.** *Twelve assertions fall in that bucket and are honestly unknown rather than quietly "sound".*

---

# §4 · The 51 that are weaker than they look

**"Prose-backstopped" means the token appears in code **and** in a comment. The assertion passes today for the right reason — and would keep passing if the code were deleted and the comment survived.**

**Not one is a defect today. Three are worth knowing about:**

```
production-wiring-guard  →  app/_layout.tsx            "ACCOUNT_DELETED"
mobile-resilience        →  ErrorBoundary.tsx          "getDerivedStateFromError" · "componentDidCatch"
lib-hardening            →  SearchResultsMap.web.tsx   "BANCO_MAP" · "setClusters"
```

**The first is the account-teardown invariant — the exact subject of the branch that is red right now.** *If that handling were removed while a comment mentioning it survived, the guard would stay green.*

**No order is issued for these.** *Fifty-one low-severity theoretical weaknesses are not worth fifty-one changes; the general repair in §5 covers them.*

---

# §5 · What I got wrong, and the repair that is actually proportionate

**Correction #31 said:**
> *"Every `assert.match(fileContents, /…/)` in `section-miniapp-guard.test.mjs` has this property — 1,400 lines of them. Space D: audit them."*

**Measured: 573 of 630 are sound, 51 are theoretically weak, 6 are comment-only and 5 of those are on purpose.** *I generalised a real single defect into a class-wide alarm and issued an order sized to the alarm rather than to the evidence.*

**The proportionate repair is not an audit of 1,400 lines. It is one line in the census and one habit:**

### D-0a (final) · fix the one real instance
```js
assert.match(
  header,
  /testID=\{slot === "scroll" \? "cars-hero-band" : "cars-home-header"\}/,
  "the header's identity must be the two-slot expression, not a string anywhere in the file",
);
```

### A-7 · run the census in CI, threshold zero *(Space A, one line)*
```
node audit/tools/comment-satisfiable-census.mjs HEAD    # fail if COMMENT-ONLY > 5
```
**Five is the count of the deliberate pins.** *A sixth means someone wrote a code contract that prose can satisfy, and it fails the moment it appears rather than three weeks later.*

---

# §6 · Standing

**Thirty-two corrections. This one is a retraction of the *scope* of the previous one, and the previous one still stands on its facts.**

> **A single verified defect is evidence of a defect. It is not evidence of a class.** *I have spent this engagement demanding that every claim be measured, and then extrapolated from n=1 in the same report where I proved n=1.*

**Register: 30 classes, 9 at P0. `P-30` narrowed from "static guards cannot distinguish code from prose, 1,400 lines wide" to "one assertion does, five more do so deliberately, and the census now runs in two seconds."**

---
*Census tool written, then validated against the one case already proven true before any new finding was reported; the first version missed that case because it bound every assertion to the last `readFileSync` in the file, and the scope fix is recorded in the tool's own comments. Coverage stated as a percentage with the unanalysed remainder counted separately. Every one of the six findings read in its source context and classified by the assertion's stated intent rather than by its shape. The Dockerfile false positive verified against the real file and the tool corrected rather than the finding published. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
