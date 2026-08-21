# Accounts and social sign-in — full audit, Apple / Google / Facebook

Complete audit of the account model and every sign-in path, traced from the database enum to the button on screen. Executed at `canonical @ 4f2c81c`, **2026-08-21 23:15 UTC**.

**Headline: the account model is one of the best-built things in this codebase — server-enforced, chain-pinned, tested on both sides. Social sign-in has one real defect: the app declares an Apple Sign-In entitlement it never exercises, while the module that would exercise it sits installed and unimported.**

---

## 1 · The account model — five roles, and only three are reachable

`lib/db/src/schema` declares two **independent** axes, and keeping them separate is correct:

```ts
userRoleEnum  = ["individual", "dealer", "company", "enterprise", "financial_institution"]
staffRoleEnum = ["owner", "admin", "moderator", "support", "user"]
```

**Which roles a shipped client can actually produce** — from `apiAccountTypeForFamily`, `profile.tsx:109-123`:

```ts
function apiAccountTypeForFamily(family, currentRole = ""):
  "individual" | "dealer" | "company" | "financial_institution"
{
  if (family === "individual") return "individual";
  if (family === "business")
    return currentRole === "company" ? "company" : "dealer";   // preserve, never grant
  if (family === "bank" || family === "funder") return "financial_institution";
  return "individual";
}
```

| DB role | Reachable from a client? |
|---|---|
| `individual` | ✅ |
| `dealer` | ✅ |
| `financial_institution` | ✅ — via `bank` **and** `funder` families |
| `company` | ⚠️ **preserved only** — the ternary returns it when it is *already* the role. No client path grants it. |
| `enterprise` | ❌ **not in the return union at all** |

**This settles M-4, which I have carried as open since my first audit.** `enterprise` is unreachable by construction — not a missing button, a missing type. `company` can exist but only if something outside the client created it.

**The decision is the owner's and it is one decision, not two:** either these roles are admin-provisioned by design — in which case document that and the finding closes — or the client is missing a path, in which case it is a product gap. **What should not persist is a database enum with two values no shipped surface can create.**

The UI family layer (`"individual" | "business" | "bank" | "funder"`) is a sound abstraction: it keeps product language stable while the role enum evolves underneath. The comment explaining why `business` preserves `company` rather than collapsing it to `dealer` is exactly the kind of reasoning that should be in the code.

---

## 2 · ✅ The self-demote guard (S4) — this is the house standard, done completely

I went looking for a client-only guard to flag. **I found the opposite, and it deserves to be named as the model for every other control in this codebase.**

**Server-enforced** — `UserService.ts:224-243`:

```ts
if (input.account_type === "individual") {
  const elevatedNow = user.role === "financial_institution"
                   || user.role === "company"
                   || user.role === "enterprise";
  if (elevatedNow) {
    throw Object.assign(new Error(
      "Company and financial-institution accounts cannot switch to personal from the app"
    ), { code: "DEMOTE_BLOCKED" });
  }
}
```

**Client-enforced** — `profile.tsx:795-808`, with honest bilingual copy rather than a silent no-op.

**Chain-pinned** — `chain-integrity-gate.mjs:67`:

```js
id: "P-account-demote-guard",
test: (s) => /DEMOTE_BLOCKED/.test(s) && …,
why: "Elevated roles must not self-demote to individual via PATCH /me",
```

**Tested on both sides** — `lib-hardening.test.mjs:170`, `section-miniapp-guard.test.mjs:1857,1892`.

**Four layers: server authority, client UX, chain assertion, tests.** A direct `PATCH /me` bypassing the app still fails. **This is what I have been asking for across every other finding in this engagement — it already exists here.**

*(Note: `dealer` is deliberately not in the elevated set, so dealer → individual is allowed. That reads as a product decision, and the comment says so.)*

---

## 3 · Sign-in methods actually available

| Method | State |
|---|---|
| Email + password / email code | ✅ `signIn.create({ identifier: email })`, `profile.tsx:680` |
| Google | ⚠️ conditional — §4 |
| Apple | ⚠️ conditional — §4, **and** §5 |
| Facebook | ⚠️ conditional — §4 |
| **Phone / SMS** | ❌ **absent** — no `phoneCode` strategy anywhere. The only phone field is a profile `textContentType="telephoneNumber"`, not an auth path. |

**Phone sign-in being absent is worth a deliberate decision rather than silence, in a market where phone-first identity is the norm.** I record it as `VERIFIED MISSING`, not as a defect — no requirement in the repository asks for it.

---

## 4 · ✅ Social provider gating — excellent design, and it explains a lot

`hooks/useSocialProviders.ts` is genuinely good engineering and its own comment states the problem it solved:

> *"the auth sheet used to render Google / Facebook / Apple buttons unconditionally. The BANCO production tenant (clerk.banco.today) has an **EMPTY social provider dictionary** — email+password and email OTP only — so every tap on those buttons made `startSSOFlow` throw and the user saw a bare 'Sign-in failed. Please try again.' dialog with no way to succeed."*

Instead of deleting the buttons, it reads the tenant's own public environment document and renders only what the tenant reports enabled:

```ts
return SUPPORTED.filter((p) => social[`oauth_${p}`]?.enabled === true);
```

**Four things right:** fails **closed** on any error, offline or DNS failure · caches per session · 8-second `AbortController` timeout · a hand-rolled 30-line base64 decode rather than a dependency, because Hermes does not guarantee `atob`. And `handleOAuth` surfaces **Clerk's actual error text** instead of a generic retry — the comment notes a generic prompt on a misconfigured strategy is an infinite loop for the user.

### The live tenant state — `UNKNOWN`, and I could not close it

I tried to query `clerk.banco.today/v1/environment` directly to settle **H-2**, which I have carried as `UNKNOWN` all engagement. **The environment's network policy blocked it:**

```
curl: (56) CONNECT tunnel failed, response 403
  host: clerk.banco.today:443   →   policy denial
```

**So I cannot state which providers are live, and I will not infer it.** What I can state:

- **The code asserts** the production tenant dictionary is **empty** — email only.
- **If that still holds, the app today shows no social buttons at all.**

**You can settle this in ten seconds** — the Clerk Dashboard's social connections page, or this from any unrestricted machine:

```bash
curl -s "https://clerk.banco.today/v1/environment?__clerk_api_version=2024-10-01&_clerk_js_version=5.0.0" \
  | jq '.user_settings.social | to_entries[] | select(.value.enabled) | .key'
```

Empty output means no social sign-in is live, and the buttons are correctly hidden.

---

## 5 · 🟠 The real defect — an Apple entitlement with no implementation behind it

**`app.json` declares Sign in with Apple three times over:**

```
package.json:85   "expo-apple-authentication": "~8.0.8"
app.json:138      "expo-apple-authentication"          ← config plugin
app.json:20       "usesAppleSignIn": true              ← iOS capability
```

**And the module is never imported.** I searched the whole workspace for `expo-apple-authentication` and `AppleAuthentication` outside `package.json`: **zero results.**

The Apple flow that *does* exist goes through Clerk's **web** SSO — `profile.tsx:745-753`, `startSSOFlow({ strategy: "oauth_apple", redirectUrl: AuthSession.makeRedirectUri() })` — a browser redirect, **not** the native Apple sheet the installed module provides.

**Three consequences, in order of how early they bite:**

**① The build carries a capability the app never uses.** `usesAppleSignIn: true` is what makes Expo add the Apple Sign-In entitlement to the iOS build. That entitlement must be enabled on the App ID in the Apple Developer portal or **code-signing fails** — a build-time failure for a feature no code calls. Combined with the empty `appleId`/`ascAppId`/`appleTeamId` in `eas.json` (previous report), the iOS submission path has two independent unresolved items.

**② Apple's Guideline 4.8 exposure — direction depends on §4.** Apple requires an equivalent privacy-preserving login option where an app offers third-party sign-in. **If** Google or Facebook are enabled on the tenant, Apple must be too, and reviewers will exercise it. **If** the dictionary is genuinely empty, the app offers only email and 4.8 does not engage — **but it still declares an Apple entitlement it does not implement**, which invites a reviewer question you have no answer prepared for.

*I classify the guideline's precise current wording as `UNKNOWN` — I will not quote App Store policy text I cannot check from here, as with the Play deadline.* The structural exposure is what I am reporting.

**③ A user-visible inconsistency if Apple is ever enabled.** iOS users tapping "Apple" get a **web redirect**, not the native sheet — slower, and it leaves the app. The native module to fix that is already installed and paid for in bundle size.

### Order

1. **Decide** whether Apple sign-in is a shipped feature.
2. **If yes:** wire `expo-apple-authentication` natively on iOS and keep Clerk SSO as the Android/web path; ensure the App ID entitlement is enabled before the next build.
3. **If no:** remove `usesAppleSignIn`, the plugin entry, and the dependency — **do not ship an entitlement for a feature that does not exist.**
4. **Either way, pin the decision.** A chain assertion tying `usesAppleSignIn` to an actual import of the module would have caught this the day it appeared.

---

## 6 · Summary

| Area | State |
|---|---|
| Role model, two independent axes | ✅ well designed |
| `enterprise` | ❌ **unreachable by any client** — settles M-4 |
| `company` | ⚠️ preserve-only, never granted by a client |
| S4 self-demote guard | ✅ **server + client + chain-pinned + tested — the model** |
| Email sign-in | ✅ |
| Phone / SMS sign-in | ❌ `VERIFIED MISSING` — needs a decision, not a fix |
| Social provider gating | ✅ excellent, fails closed |
| Live tenant provider set | ❓ `UNKNOWN` — **network policy blocked me; ten seconds for you** |
| Apple entitlement vs implementation | 🟠 **declared three times, implemented zero times** |
| iOS submit credentials | 🔴 three empty strings *(previous report)* |

**Nothing here is invented and nothing here is design.** Whether `company`/`enterprise` are admin-provisioned, whether phone sign-in ships, whether Apple sign-in ships — all yours. My job was to establish what is true, and where I could not, to say so and hand you the exact command.

---
*Traced from `userRoleEnum` through `apiAccountTypeForFamily` to `startSSOFlow`, with the server guard read at `UserService.ts:224` and its chain assertion at `chain-integrity-gate.mjs:67`. The live Clerk tenant query was attempted and blocked by network policy; classified `UNKNOWN` rather than inferred. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
