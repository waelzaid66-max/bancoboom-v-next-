# W6-AUD-61 — Maps stack dual-end inventory (World Maps / #11)

- Seat: Production Auditor · World: **Maps (#11)** only  
- **CURRENT tip:** `4afdf839ad998cc4e9be251b2e40b576ab24dab9` (product land `85cfe7f`)  
- Historical SoT at first write: `main` @ `6ad7a48` (pre-land)  
- Orders: `74` AUD-61 · **`76` AUD-67 retract** · `68` tip-rebind  
- Mode: evidence · **DO NOT DELETE** listed assets

> **TIP-REBIND (`76` AUD-67):** Rows that said Discover→RE **DEFECT** or `/section/maps` **MISSING** were true **before** `85cfe7f`. Against tip `4afdf83` they are **SUPERSEDED**. Current verdict = **AUD-63 PASS**.

## A. Stack present (do not gut) — CONFIRMED @ tip

| Asset | Path | Role | @ `4afdf83` |
|-------|------|------|-------------|
| Leaflet + CSS | `assets/map-vendor/leaflet.js` · `leaflet.css` | Offline vendor | **PRESENT** |
| MarkerCluster | `leaflet.markercluster.js` · `MarkerCluster*.css` | Clusters | **PRESENT** |
| Vendor inline | `mapVendorInline.ts` | Bridge | **PRESENT** |
| HTML bridge | `mapHtml.ts` | WebView HTML | **PRESENT** |
| Results map | `SearchResultsMap.tsx` / `.web.tsx` | Map UI | **PRESENT** (hub + sections) |
| Overlay | `MapOverlayChrome.tsx` | Count + pin preview | **PRESENT** |
| Latch helpers | `lib/mapLatch.ts` | `?map=1` | **PRESENT** |
| Maps hub | `MapsHubApp.tsx` · `app/section/maps.tsx` | Mini-app #11 | **PRESENT** (post-land) |
| Seller pin | `MapPinPicker.tsx` | Create/edit | **PRESENT** |

## B. Producers (Discover → Maps) — CURRENT tip

| Control | Destination @ `4afdf83` | Dual-end | Verdict |
|---------|-------------------------|----------|---------|
| Primary `exploreOnMap` | **`/section/maps`** (`search.tsx:491`) | CTA `discover-explore-map` | **PASS** |
| FAB `discover-map-toggle` | same `exploreOnMap()` | `:1087` | **PASS** |
| Portal car | `/section/car?map=1` | intentional feed | **OK** |
| Portal properties | `/section/real-estate?map=1` | intentional feed (not primary) | **OK** |
| Portal materials/factories/stays | `?map=1` each | intentional | **OK** |
| Copy `exploreMapSub` | BANCO Maps / كل الكتالوجات | i18n post-land | **PASS** (not property-only) |
| Route `/section/maps` | `maps.tsx` → `MapsHubApp` | Stack + `_layout` | **PASS** |

## C. Consumers per section (`?map=1`) — unchanged OK

Car · RE · Materials · Factories · Stay latch consumers **OK** (intentional duplication law).

## D. Judgment @ current tip

Maps stack intact · Maps identity **landed** as mini-app #11 · Discover primary **≠ RE**.  
Cite **AUD-63** for peer VERIFY. Historical pre-land DEFECT rows = archive only.
