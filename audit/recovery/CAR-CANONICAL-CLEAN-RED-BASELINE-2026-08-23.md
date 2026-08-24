# CAR canonical-clean RED baseline — 2026-08-23

Branch head after RED contract: `dfe0611044b648b1e41d7d55563a1ab6e662dc76`.

This commit is intentionally TEST/AUDIT ONLY. Product files remain byte-identical to canonical `4f2c81cc553938e808a98adb84d00ecfc76732c5` on this branch at this checkpoint.

Added only:
- `audit/recovery/CAR-CANONICAL-CLEAN-REBUILD-CONTRACT-2026-08-23.md`;
- `artifacts/banco-mobile/tests/car-canonical-clean-layout-red.test.mjs`.

Expected RED on current canonical Product source:
- no `controlsSlot={carControlsSlot}` host splice yet;
- CarsHomeHeader has no mounted `controlsSlot` contract yet;
- generic axis seat is not yet explicitly CAR-excluded because CAR still renders the original bands below the header;
- map/list toggle remains duplicated through the generic floating map chrome.

The RED contract also rejects the already-reproduced bad RC shape that compresses CAR strips with zero-basis sibling flex lanes.

No package/test-chain wiring is added yet by design. Execute this focused test directly first. Product patch is authorized only on this branch and only through true hunk tooling, within the two Product files named by the rebuild contract. After the first Product candidate commit, stop for independent review.

Run npm run build
