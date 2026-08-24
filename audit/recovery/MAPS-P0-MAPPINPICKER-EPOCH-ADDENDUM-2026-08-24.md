# MAPS P0 RECONCILIATION ADDENDUM — MAPPINPICKER WEBVIEW EPOCH FENCE

Date: 2026-08-24

Authority snapshot: `5c919cd32347abddd8d6157d1d63cf1f4915b6f3`

This addendum supersedes the MapPinPicker classification in `MAPS-P0-TEAM-RECONCILIATION-2026-08-24.md` where PR #107 was described as expected GREEN from source comparison.

## Corrected finding

The mounted packet originally proved:

- loading/ready/failed bootstrap behavior;
- stale seeded-coordinate confirmation is closed after failure;
- late ready cannot revive failed inside one unchanged WebView epoch;
- malformed bridge data is safe;
- current ready -> center -> confirm works;
- market reframe and close/reopen reset React state.

That contract did not prove that callbacks from the old WebView instance are rejected after a new picker epoch begins.

Current Product changes the WebView key and resets state, but `onMessage` has no epoch identity fence. A callback captured before reframe or close retains the same component state setters. If a queued old-instance `ready`, `error`, or `center` event arrives after the new epoch starts, it can mutate the new epoch.

## Strengthened PR #107 contract

The same single mounted test file now must prove:

1. save the current bridge callback;
2. reframe the picker to a new market/source;
3. observe the new epoch in loading state;
4. send old pre-reframe `ready` and `error` callbacks;
5. require the new epoch to remain loading and not failed;
6. allow a current-epoch error to fail normally;
7. save that callback and close/reopen;
8. send old pre-close `ready` and `error` callbacks;
9. require the reopened epoch to remain loading and not failed;
10. prove fresh current-epoch ready+center still enables confirmation.

## Corrected classification

`ONE-FILE MOUNTED RED CONTRACT / SOURCE EPOCH FENCE ABSENT / EXECUTION REQUIRED / PRODUCT WRITE HOLD`

Source inspection predicts intentional RED when the saved old callback is invoked. This must still be executed in the repository Jest harness before a Product hunk is authorized.

## Eventual Product boundary

Any repair must be bounded to the real `MapPinPicker` bridge authority and must:

- assign identity to each mounted/reframed/opened WebView epoch;
- ignore messages from any non-current epoch;
- preserve current `ready`, `error`, and `center` handling inside the current epoch;
- preserve error terminality inside one epoch;
- preserve `visible`, `initial`, and `marketCountry` reset behavior;
- preserve localized unavailable UI;
- preserve `ready && center` confirmation gating;
- avoid provider, browse-map, API, package/config, CAR, Release or Replit changes.

Do not treat a React key change as an event-authority fence without mounted proof.

Production remains NO-GO.

Run npm run build only on the exact final integrated candidate after focused acceptance.