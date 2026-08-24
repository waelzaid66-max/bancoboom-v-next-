# VNX-MAPS-02 — Pin Picker Bootstrap Authority

## Decision

`MAPS-P0-MAPPINPICKER-EPOCH-ADDENDUM-2026-08-24.md` predicted this defect from
source inspection and explicitly withheld authorization for a product hunk:

> Source inspection predicts intentional RED when the saved old callback is
> invoked. This must still be executed in the repository Jest harness before a
> Product hunk is authorized.

This batch is that execution. The prediction is confirmed, the defect is wider
than the addendum described, and the repair is the addendum author's own code
taken from their snapshot without modification.

| Field | Evidence |
| --- | --- |
| Base | `c04e4d4` on `main` |
| Product commit | `1c18f08` |
| Repair provenance | `5c919cd32347abddd8d6157d1d63cf1f4915b6f3`, unmodified |
| Prior authority | `MAPS-P0-MAPPINPICKER-EPOCH-ADDENDUM-2026-08-24.md` |
| Base capability | No `error` branch, no bootstrap state, no failure surface, confirm gated on `center` alone |
| Classification | `RECOVER` — proven behavior entering the target through a bounded batch |

## Reproduced defect

On `main`, `components/MapPinPicker.tsx` seeded its coordinate before the
WebView loaded anything and gated confirmation on that seed alone:

```
const [center, setCenter] = useState<Pin | null>(initial ?? null);
...
if (msg.type === "ready")  setReady(true);
if (msg.type === "center") setCenter({ lat: msg.lat, lng: msg.lng });
...
disabled={!center}
```

Three facts compound:

1. `center` is non-null on the first frame whenever `initial` is supplied, so
   the confirm control is live before the map exists.
2. `BridgeMsg` declares `{ type: "error" }` and the generated page posts it in
   two places — when `window.L` is absent and from the bootstrap `catch` — but
   `onMessage` has no `error` branch. The signal is parsed and dropped.
3. `ready` is computed and never gates anything.

The consequence is data integrity, not cosmetics. Leaflet fails, the user sees
an empty sheet carrying a live accent-coloured confirm button, presses it, and
`onConfirm(center)` records the **seeded** coordinate as a deliberate choice.
The listing carries a location nobody picked and nothing reports a failure.

The addendum located the missing epoch fence. It did not record that the control
was never disabled in the first place, which is the reachable half.

## Candidate change

1. Adopt the addendum author's `bootstrapState: "loading" | "ready" | "failed"`
   from `5c919cd`, unmodified.
2. Handle `msg.type === "error"` as terminal; a later `ready` cannot revive a
   failed epoch.
3. Gate confirmation on `bootstrapState === "ready" && center !== null`.
4. Render the localized failure panel using `search.mapUnavailableTitle` and
   `search.mapUnavailableBody` — the same two keys the browse maps use, so the
   copy cannot drift between the two surfaces.
5. Add a mounted render suite and register it in the render-coverage registry.

The fail-closed shape is deliberately identical to `SearchResultsMap`, so the
pin picker and the browse maps cannot diverge under future edits.

## RED → GREEN evidence

Executed against `main` before any repair — four of five red, and the honest
path green, which is what proves the harness itself sound:

| Contract | Before repair | After repair |
| --- | --- | --- |
| No confirm after bridge `error` | Expected 0 calls, **received 1** | PASS |
| No confirm on the first frame | Expected 0 calls, **received 1** | PASS |
| Localized failure surface present | **received null** | PASS |
| Late `ready` cannot revive a failure | Expected 0 calls, **received 1** | PASS |
| Honest `ready` → `center` → confirm | PASS | PASS |

## Verification ledger

| Gate | Result |
| --- | --- |
| Mounted pin-picker suite | 5/5 PASS |
| Render coverage meta-guard | PASS — it caught the unregistered suite on its own |
| Mobile guard packs | 42/42 PASS, each executed independently |
| Chain integrity | 247/247 PASS |
| Production confidence | 26/26 PASS |
| Root TypeScript | PASS, exit 0 |
| API tests | 97 files, 533 passed, 0 failed |
| Dependency security | 0 blocking |

## Review notes

- The repair is not this agent's design. It is the addendum author's code,
  adopted whole. The contribution here is execution, the wider reachable half,
  and the mounted contract that keeps both closed.
- One instrument error occurred and is recorded rather than hidden: the first
  run of the new suite failed on a mock naming `useLanguage` where the component
  imports `useI18n`. That was a fault in the test harness, not the product, and
  it was corrected before any conclusion was drawn from the run.
- The render-coverage meta-guard rejected the batch until the new suite was
  registered. That guard is load-bearing and behaved correctly.

## Explicitly unproven

- Device behavior. This is a mounted React contract, not an Android or iOS run.
  Real WebView bootstrap timing, provider failures, and slow-network partial
  loads remain unproven.
- The epoch fence the addendum specified in its ten-step contract is **not**
  claimed closed here. This batch closes bootstrap authority and the reachable
  confirm-before-ready path. Cross-epoch callback rejection after reframe or
  close/reopen remains open and is the addendum's own next slice.
- No CI evidence exists for this batch. Per `VNX-CI-02`, Actions has not
  executed a step since 2026-08-14, so every gate above is a local execution.

## Release boundary

This batch closes the bounded source defect in source at the commit containing
this report.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale, Clerk, storage, Paymob, push/email delivery,
Docker/Coolify runtime, backup/restore, rollback, EAS signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.
