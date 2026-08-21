# ⚠️ STOP — two orders in my master directive were wrong. Corrected before you build.

**I am the acceptance authority for this work, which means my orders have to be right before you spend effort on them, not after. I reviewed my own prescriptions and found two that would have produced work you'd have to redo.**

Both are in **Wave 0 and Wave 1** — the ones I told you to start with. **2026-08-22.**

---

## ① `DEPLOY-01` — my prescribed fix does not work, and my framing was unfair to you

### What I told you

> *"Add `CREATE EXTENSION IF NOT EXISTS pg_trgm;` as a forward migration ordered before any `gin_trgm_ops` index."*

### Why that fails

Migrations run in journal order. `lib/db/migrations/meta/_journal.json`:

```
idx 0 → 0000_fantastic_warbird     ← this is the one that fails
idx 1 → 0001_minor_stingray
…
idx 7 → 0007_early_tiger_shark
```

**A new `0008` runs *after* `0000`. The run dies at `0000` and never reaches it.** My order would have had you write a migration that can never execute on the database that needs it.

**And editing `0000` is not the answer either** — `lib/db/src/baseline.ts:75-83` stores a **hash** per applied migration in `__drizzle_migrations`. Editing a committed migration changes its hash and breaks baseline adoption and drift detection on every existing database. **The repository is right to treat committed migrations as immutable.**

### The correct fix — one line, in the migrator

`lib/db/src/migrate.ts`, after `await client.connect()` and **before** `await migrate(...)`:

```ts
// pg_trgm must exist before 0000 creates its gin_trgm_ops indexes. Idempotent,
// so it is safe on every deploy, and it keeps committed migrations immutable.
await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
```

**Why this is the right layer:** it runs before any migration file, it is idempotent, it touches no committed migration and no hash, and **every caller of `migrate` gets it** — production deploy, `docker compose run`, a developer's fresh database.

**One caveat, stated honestly:** `pg_trgm` is a *trusted* extension in PostgreSQL 13+, so a database owner can create it without superuser. On some managed providers it must still be allow-listed. **If your provider refuses, the fallback is provisioning it in infrastructure — not in a migration.**

### 🔴 And a correction I owe you on the framing

**I wrote that `pg_trgm` exists "only as an unchecked box in two readiness checklists." That was wrong.** `.github/workflows/ci.yml:85`:

```yaml
- run: psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

**CI creates it explicitly, as a deliberate step before migrate.** Whoever wrote that knew exactly about this dependency and handled it.

**So the defect is narrower and more precise than I described:** the prerequisite is encoded in **CI**, but not in the **migrator**. Any path that runs `migrate` outside CI's harness — every production deployment — fails.

**The finding stands. My characterisation implied nobody had thought about it. They had. The line simply lives in the wrong layer, and the fix is to move it one level down so every caller inherits it.** I should have read the CI workflow before writing that sentence.

---

## ② Web create — "add three fields" would have produced junk data

### What I told you

> *"Add `condition` (car) · `offer_type` + `rental_term`-when-renting (real estate) · `capacity` (industrial)."*

**Technically that closes the validator. It would also have been rework**, because I did not say *what kind* of fields, and the web form has only free-text and numeric inputs.

### What actually exists — and it is already built

`artifacts/banco-mobile/constants/listingCreateTaxonomy.ts` is a **complete, typed taxonomy**:

```ts
car: [
  { key: "year",        type: "number", required: true },
  { key: "mileage",     type: "number", required: true },
  { key: "condition",   type: "select", required: true, options: enumOptions(CONDITIONS) },
  { key: "fuel_type",   type: "select", required: true, options: enumOptions(FUEL_TYPES) },
  { key: "transmission", type: "select", options: enumOptions(TRANSMISSIONS) },
  { key: "body_type",   type: "select", options: enumOptions(BODY_TYPES) },
  …
],
real_estate: [
  { key: "offer_type", type: "select", required: true,
    options: [{ value: "sale" }, { value: "rent" }] },
  { key: "rental_term", … },   // shown ONLY when offer_type=rent, via visibleSpecFieldsFor
  …
]
```

**`condition` and `offer_type` are enumerated selects, not text.** `rental_term` is **conditional** and country-aware. And `requiredSpecKeysFor()` already computes the required set dynamically.

**Had you followed my order literally, you would have added free-text inputs.** The validator only checks *presence*, so `condition: "kwyes"` passes — and then the listing is invisible to every filter strip that matches on the enumerated value. **A green create and a listing nobody can find is worse than a rejected create.**

### The correct order

**Extract mobile's taxonomy into a shared package and have the web workspaces consume it.** Not "add three fields" — **delete the web's parallel `workspaceSpecFields` and replace it with the canonical one.**

**This is what the server has been asking for all along.** `ListingService.ts:200`:

> *"KEEP IN SYNC with mobile `requiredSpecKeysFor`."*

**Mobile is named. Web is not. That comment is the drift, written down.** A shared source removes the class permanently — and it also fixes the `banco-web`/`banco-website` duplication for this surface in the same move.

**Scope note so this does not balloon:** you do not need every mobile field on web. You need the **required** set to be canonical and typed. Optional fields can follow later.

---

## ③ Three orders I re-checked and confirmed correct

I re-verified the rest of Wave 0 and Wave 1 rather than assuming:

| Order | Status |
|---|---|
| `GUARD-01` — enumerate `test:*` keys, assert each appears in the aggregate `test` script | ✅ sound, self-maintaining, no hidden dependency |
| **Gitignore the Play key** — `git check-ignore` returns 1 today | ✅ correct, three lines, no side effects |
| **`toBeSelected()`** for `car-header-v2` | ✅ confirmed exported by the installed `@testing-library/react-native@13.3.3`; `toHaveAccessibilityState` is not |
| **`deleteServingUrls`** for media retirement | ✅ confirmed on the `ObjectStorage` interface and used in three lifecycles |

**One precision note on the price fix:** `Number(listing.base_price_cash)` is safe for the value range this marketplace holds — but `numeric` is arbitrary-precision and `Number` is not. **If you ever expect a value above 2^53, keep the string and declare it a string in the contract.** For EGP listing prices, `Number` is fine. **Decide it explicitly rather than inheriting it.**

---

## ④ What this episode says about my own process

**Two of my three Wave-0/1 orders were wrong in a way that would have cost you real work:**

- One prescribed a fix that **cannot execute** — I reasoned about migration ordering instead of reading `_journal.json`.
- One prescribed a fix that **executes and produces bad data** — I named the missing keys without checking their types, when a canonical typed definition already existed two directories away.

**Both were caught the same way every one of my earlier corrections was: by re-reading the source instead of trusting my own conclusion.** The pattern is now consistent enough to state as a rule for myself: **a finding is verified when I have executed it; an order is verified when I have traced the thing it tells you to change.** I had done the first and not the second.

**This is the eleventh and twelfth correction I have published against my own record.** I would rather send twelve corrections than have you build against one wrong order.

---

## ⑤ Wave 0 and Wave 1 — corrected

**Wave 0 — today**
1. **`GUARD-01`** — one self-maintaining chain assertion. Unchanged, still first.
2. **Gitignore the Play credential set.** Unchanged.
3. **`DEPLOY-01` — one line in `lib/db/src/migrate.ts`, not a migration.** Add a chain assertion that the migrator creates the extension before calling `migrate`. *(Also add it to `run-api-tests-local.mjs`, which does not create it either — only CI does.)*

**Wave 1 — the uncovered zone**
4. **Web create — extract mobile's `listingCreateTaxonomy` into a shared package**, delete the web's parallel definition, and let both clients consume one canonical required-set. **Typed selects, not text.**
5. **Price** — honest `price_cash`, raw-value-only hydration, guard, **both surfaces**. Unchanged.
6. **Deduplicate `banco-web` / `banco-website`.** Item 4 does part of this; finish it.
7. **A CI job for those workspaces that runs something other than `docker build`.**

**Everything from Wave 2 onward in the master directive stands as written.**

---

*Corrections to my own orders, found by tracing what each one would change before you act on it. `_journal.json` and `baseline.ts` read for ①; `listingCreateTaxonomy.ts` and `ci.yml:85` read for ①–②. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
