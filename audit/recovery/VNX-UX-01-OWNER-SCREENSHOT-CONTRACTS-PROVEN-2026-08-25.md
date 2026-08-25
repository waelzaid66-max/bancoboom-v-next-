# VNX-UX-01 — The Owner's Screenshot Complaints, Mutation-Proven

## Decision

`audit/handoff/OWNER-SCREENSHOT-FORENSIC-DISCOVER-ENTER-AR.md` (2026-07-19)
records four complaints the owner raised from his own screenshots, and the four
commitments made in response. Five weeks later this batch asks one question of
each: **not "is it implemented" but "can it silently come back".**

Three are genuinely protected. **One was not, and it is the first complaint on
his list.**

| Field | Evidence |
| --- | --- |
| Base | `9fcf44c` on `main` |
| Product commit | The commit containing this report — guard only, no product delta |
| Prior authority | `OWNER-SCREENSHOT-FORENSIC-DISCOVER-ENTER-AR.md`, MOB-05 |
| Classification | 3 × `ALREADY_PRESERVED` and load-bearing · 1 × decoration, now closed |

## Reproduced defect

`test("Search catalogue chrome is gated off Discover (MOB-05)")` carried three
assertions. All three searched for `viewState !== "discover"` **anywhere** in
`app/(tabs)/search.tsx`, two of them through loose `[\s\S]*` pairings.

The file carries that gate **twice** — once on the shared filter button, once on
`CategoryTabs`/engines. So any single occurrence satisfied all three assertions,
and opening either gate on its own left everything green:

```
open the filter-button gate alone   →  43/43 packs PASS   ← the strip returns
open the CategoryTabs gate alone    →  43/43 packs PASS   ← the strip returns
open BOTH at once                   →  caught
```

**That is the owner's first screenshot complaint verbatim** — *«الضغط على قسم لا
يدخل الميني-آب — يظهر شريط اختيارات وسط الأيقونات»* — and it could return
without a single pack going red.

A guard that fires only when every instance is removed simultaneously is
counting presence, not placement.

## Candidate change

Each gate is now bound to the control it protects, and the count is pinned:

1. the filter button's gate must be immediately followed by `<Pressable`;
2. the `CategoryTabs` gate must be immediately followed by `<>` then
   `<CategoryTabs`;
3. exactly two gates must exist — a third, or one fewer, means the chrome moved
   and the contract must be re-read against the screen rather than quietly
   passing.

## RED → GREEN evidence

| Mutation | Before | After |
| --- | --- | --- |
| Open the filter-button gate alone | **PASS** — regression invisible | **FAIL** |
| Open the `CategoryTabs` gate alone | **PASS** — regression invisible | **FAIL** |
| Open both at once | FAIL | FAIL |
| Unmodified source | PASS | PASS — 93/93 |

## Verification ledger — the other three complaints

Each was mutation-tested rather than read:

| Owner's complaint (2026-07-19) | Guard | Mutation | Result |
| --- | --- | --- | --- |
| «مربعات 2×2 تبدو غير مصلحة» → restored as cinematic section cards | `Discover keeps photo section cards` | replace `sectionGrid` with `sectionPortal` (the ENTER-row redesign) | **HOLDS** |
| «الضغط على قسم لا يدخل» → `router.push(SECTION_ROUTE)` | same | break `router.push(SECTION_ROUTE[cat])` | **HOLDS** |
| «هيدر BOOM STAY يأخذ نصف الشاشة» | `BookingStaysApp mounts owner-approved black StaysHomeHeader` | replace `<StaysHomeHeader` with a legacy hero | **HOLDS** |

| Gate | Result |
| --- | --- |
| `test:section-guard` | 93/93 PASS |
| Chain integrity | 247/247 PASS |
| Root TypeScript | exit 0 |
| Mobile guard packs | 43/43 PASS, 43 discovered |

## Review notes — two corrections to this batch's own reasoning

- **I mutated the wrong line first.** My initial probe changed
  `if (viewState === "loading" || viewState === "discover")` in
  `SectionSearchApp.tsx` and read `[DECORATION]`. That line gates the loading
  **skeleton**, not the chrome. The result was true and meaningless. Reading the
  surrounding code before writing any contract is what caught it; the real gate
  lives in `app/(tabs)/search.tsx`, which is what the guard actually reads.
- **I reported `StaysHomeHeader` as deleted.** It is at
  `components/search/stays/` — plural — and I checked `stay/`. It exists and is
  mounted. The 2026-07-19 forensic did record it as deleted, and that record is
  simply superseded: `CODEX-RECOVERY-BACKLOG.md` traces
  `80b1a17` split → `fdbb4ff` revert → `e66a561` rebuild, and the current guard
  states the newer decision in its own name — *"owner-approved black
  StaysHomeHeader"*, which is the **opposite** of the July note that the owner
  rejected the black header.

> The second correction matters beyond this batch: **an owner decision reversed
> between 2026-07-19 and today, and the stale document still reads as
> authoritative.** Anyone acting on that handoff file without checking the guard
> would rebuild a header the owner has since approved away.

## Explicitly unproven

- These are source contracts, not pixels. They prove the gate exists and is
  bound to its control; they do not prove the rendered result looks right at
  320–430, in RTL, or on a device.
- The other four section headers (Property, Facilities, Materials, Cars beyond
  its icon contract) were not swept for the same presence-vs-placement defect.
  This batch is bounded to the complaints the owner's screenshots raised.
- No CI evidence. Per `VNX-CI-02`, Actions has not executed a step since
  2026-08-14.

## Carry-forward findings

- **The presence-vs-placement defect is a class, not an instance.** Any guard
  asserting a token that appears more than once in its target is satisfiable by
  the survivors. `section-miniapp-guard` alone carries 93 assertions; only this
  one was audited for it.
- `OWNER-SCREENSHOT-FORENSIC-DISCOVER-ENTER-AR.md` is one of the handoff records
  that survived the re-import. Its Stay section is now wrong. A dated forensic
  should not outrank a live guard, and today nothing marks it as superseded.

## Release boundary

This batch tightens a guard and changes no product source.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale, Clerk, storage, Paymob, push/email delivery,
Docker/Coolify runtime, backup/restore, rollback, EAS signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.
