# Three-Layer Self-Audit — everything the auditor produced

The owner asked for the auditor's own work to be audited as hard as the manager's. This applies three deliberately different layers to it, because the failure this session already produced was invisible to the first two.

**Subject:** branch `fix/nanoid-override` @ `76f7f26`, cut from `canonical/vnext-assembly` @ `f45c32c`.
**Scope:** 2 files, dependency-resolution metadata only.

| Layer | Question | Method |
|---|---|---|
| 1 · Claims | Does it do what it says? | assert each written claim against a command |
| 2 · Regression | Does it break anything? | full gate battery + blast-radius diff |
| 3 · Adversarial | Does it plant a **new** trap? | attack the change itself |

---

## Layer 1 — every claim tested

| Claim | Command result |
|---|---|
| exactly one nanoid copy | 1 unique symlink target |
| that copy is patched | `nanoid@3.3.18` |
| the **runtime** consumer is on it | `@react-navigation/core → nanoid@3.3.18` |
| zero blocking advisories | `2 moderate/high/critical; 2 narrowly waived; 0 blocking` |
| the dated waivers are untouched | both still `WAIVED UNTIL 2026-09-09` |
| bounds change no resolution | tar `7.5.22`, qs `6.15.2`, uuid `14.0.0` — identical to canonical |

## Layer 2 — regression and blast radius

| Gate | Result |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0, in sync |
| Chain integrity | **242 / 242** |
| Production confidence (full, no `--skip-typecheck`) | **26 / 26** |
| Mobile render suite | **120 / 120**, 16 suites |
| Mobile full regression pack | exit 0 |
| Root `npm run build` | exit 0 |

**Blast radius.** Two files versus canonical: `pnpm-workspace.yaml`, `pnpm-lock.yaml`. No source, schema, migration, OpenAPI, controller, mobile component, or workflow file. Every added or removed lockfile line belongs to `nanoid`, `tar`, `qs`, or `uuid` — the only lines that do not literally contain a package name are the `resolution` / `engines` / `hasBin` members of the two deleted nanoid blocks.

**No overlap with the other open branch.** `maint/safe-batch-01` touches `scripts/workspace-verify.mjs` and `components/search/mapHtml.ts`; the intersection with this branch is empty, so the two can be taken in either order.

## Layer 3 — attacking the change

Layer 3 exists because of what happened earlier in this session: an unbounded `nanoid: '>=3.3.18'` was written, and it **passed everything** — including a full CI run (`31825603049`, 7/7 green on `71c9173`). Layers 1 and 2 cannot see this class of defect. That commit was reverted and the branch reduced to a tree byte-identical to canonical before the corrected fix was applied.

**Attack 1 — can the new bounds starve a consumer?** Only if something declares a range above the bound.

| package | ranges consumers actually declare | bound | verdict |
|---|---|---|---|
| `tar` | `7.5.19`, `>7.5.6`, `^6.1.11` | `<8` | nothing wants 8+ |
| `qs` | `^6.14.0`, `^6.15.2` | `<7` | all 6.x |
| `uuid` | `9.0.1`, `^9.0.1`, `^9.0.0`, `^7.0.3`, `^2.0.3` | `<15` | highest ask is 9 |
| `nanoid` | `^3.3.16`, `^3.3.8`, `3.3.6`, **`^5.1.6`** | `<4` | **one genuine conflict** |

**Attack 2 — the one real conflict, resolved by execution.** `vite` declares `nanoid ^5.1.6` and the bound forces it to 3.3.18. This is not new behaviour — canonical already had vite on `3.3.17` — but "already true" is not proof. `vite build` was therefore run directly in `artifacts/landing`: **30 modules transformed, exit 0**, bundle emitted. The typecheck of all six web apps also passes. Compatibility is demonstrated, not assumed.

**Attack 3 — do the bounds block a future security fix?** Yes, by construction: if a future advisory is patched only in a higher major, the bound prevents it. That is the intended trade, and it is safe because the audit gate is the backstop — it reports any vulnerable installed version regardless of overrides, so the block surfaces as a CI failure demanding a deliberate widening. The alternative, an open range, is strictly worse: it admits a breaking major *silently*, since a newer major is not "vulnerable" and nothing flags it.

**Attack 4 — is the fix reachable at all?** The gate's waiver list is hardcoded to image-size (`dependency-security-gate.mjs:13-18`), so nothing here suppresses an advisory; the change resolves it.

## Errors this auditor made, and where they were caught

Recorded because a self-audit that finds nothing is not a self-audit.

| Error | Caught by | State |
|---|---|---|
| Unbounded `>=3.3.18` — would resolve to ESM-only 6.0.1 on a clean re-resolve | own probe, **after** CI was already 7/7 green | reverted; branch restored to a canonical-identical tree, then re-fixed with the bound |
| Claimed `uuid@14` has no CommonJS entry | own `require()` test | retracted in place in the trap audit; `exports["."]` carries a `node` condition and the full v9 API is present |
| Measured production confidence as 24/24 | own re-run without the flag | caused by passing `--skip-typecheck`; the real figure is 26/26, matching the manager's record |
| Claimed `headers-dynamic-polish` carried stranded hardening | own `git diff` | false; files byte-identical to main; retracted publicly |
| Claimed a per-conversation read cursor exists | own schema re-read | imprecise; only `read_at` + side counters exist. The manager's classification was right |

**Pattern worth stating plainly:** every one of these was a *claim* error, and none reached `canonical/vnext-assembly`. The single error that became code was caught by the author before promotion and removed. Layers 1 and 2 caught none of them; Layer 3 and re-execution caught all of them.

## Standing constraints — verified, not asserted

- `canonical/vnext-assembly` is still `f45c32c`, unmoved, with 238 commits and `e4b8f29` still an ancestor.
- 20 manager branches intact. **0 tags**, so the tag-triggered deploy has never fired.
- No file deleted, nothing restructured, nothing force-pushed.
- All auditor work lives on side branches; the manager decides what, if anything, is merged.

---
*Self-audit — three layers, executed. Findings against the auditor's own work are recorded above with the same weight as findings against anyone else's.*
