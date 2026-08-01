# 05 — Production Gap Analysis & Readiness

**Tip:** `06c709a` · **Live probe time:** 2026-07-31T11:40:57Z UTC

---

## 1. Live probe results (this session)

| Target | HTTP / TLS | Body signal | Verdict |
|--------|------------|-------------|---------|
| `https://banco.today/nginx-health` | 404 | Replit “This app isn't live yet” HTML | **FAIL** |
| `https://banco.today/api/readyz` | 404 | Same Replit HTML | **FAIL** |
| `https://banco.today/.well-known/assetlinks.json` | 404 | Same Replit HTML | **FAIL** |
| `https://www.banco.today/` | 200 | `generator: Hostinger Horizons` | **FAIL** (wrong origin) |
| `https://banco.deals/` | 404 | Replit placeholder HTML | **FAIL** |
| `https://banco.autos/` | TLS error (self-signed) | curl exit 60 | **FAIL** |

**Conclusion:** Public DNS / fronts are **not** serving Coolify nginx + API from this tip. Prior gap IDs G04–G09 remain **OPEN externally**.

Well-known placeholders still in repo:

- `deploy/coolify/well-known/apple-app-site-association` → `REPLACE_APPLE_TEAM_ID`
- `deploy/coolify/well-known/assetlinks.json` → `REPLACE_PLAY_APP_SIGNING_SHA256`

---

## 2. Expected vs actual (Architect view)

| Expected (docs / architecture) | Actual (evidence) |
|--------------------------------|-------------------|
| Coolify compose on `banco-with-wael` main | Artifacts present; live attach **UNVERIFIED** / DNS wrong |
| `/api/readyz` JSON 200 on apex | Replit HTML 404 |
| Universal Links well-known JSON | Unreachable / wrong host |
| EAS production builds against live API | Env bake not evidenced |
| Device journeys green | Not run |
| Paymob live | Deferred / external |
| Clerk live keys consistent | External |

---

## 3. Module completeness (code presence vs production proof)

| Module | In-repo | Production proof |
|--------|---------|------------------|
| Auth (Clerk) | Present | Live keys / SSO dashboard **UNVERIFIED** |
| Search + facets | Present + tests | Live API unreachable |
| Maps (Leaflet clusters) | Present; pin picker present | CDN dependency; live UNVERIFIED |
| Messenger | Present; poll-only by design | Live UNVERIFIED |
| Notifications + push token | Present | Device push UNVERIFIED |
| Wallet / plans / Paymob | Present + tests | Live money FAIL/deferred |
| Localization EN/AR | Present | Runtime UNVERIFIED |
| Mini-apps / sections | Guards present | Product depth varies (Banks brochure, Stay scoped) |
| Car Import | Code present | Live E2E UNVERIFIED |
| Admin / Dealer OS | Present | Deploy path via Coolify nginx bases |
| Monitoring | pino + admin metrics | No Sentry; multi-instance metrics limited |
| Tests | Broad static + API vitest | CI green; local UNVERIFIED; device E2E missing |

---

## 4. Gap matrix refresh vs `PRODUCTION_GAP_MATRIX.md`

Prior matrix (2026-07-30) claimed **0 OPEN_IN_REPO** and many **REQUIRES_EXTERNAL_OPS**.

### Independently re-confirmed OPEN externally (P0/P1)

| ID | Item | 2026-07-31 evidence |
|----|------|---------------------|
| G03 | REPLACE_* well-known | Still in tree |
| G04 | Apex Replit | Probe FAIL |
| G05 | www Horizons | Probe FAIL |
| G06 | readyz unreachable | Probe FAIL |
| G07 | well-known unreachable | Probe FAIL |
| G08/G09 | autos/deals unhealthy | Probe FAIL / TLS fail |
| G10–G14 | Coolify secrets, S3, migrate, smoke, EAS | External — **UNVERIFIED** presence |
| G16–G17 | Device smoke / Paymob live | Not done |
| G45 | unpkg maps CDN | Still in `mapHtml.ts` |
| G46 | No Sentry | Still true |
| G47 | Chat poll-only | Still true (by design) |

### Stale claims to stop repeating

| Claim | Why stale |
|-------|-----------|
| No in-app map pin picker | `MapPinPicker.tsx` + create listing usage present |
| Apple auth package missing | `expo-apple-authentication` in mobile deps |
| Primary repo `-BANCO-CA-OOM-` | origin is `banco-with-wael` |
| July 21 fingerprint as current | Wrong SHA/repo; `productionAccepted: false` |

### New / emphasized drift (this audit)

| ID | Severity | Item |
|----|----------|------|
| VA-01 | P1 | Root docs SoT naming drift |
| VA-02 | P2 | AWS deploy omits `banco-website` image vs Coolify SoT |
| VA-03 | P2 | `docker-compose.prod.yml` still defaults `banco-web` while frozen |
| VA-04 | P1 | Concurrent draft certification PRs risk contradictory stamps |
| VA-05 | P2 | No versioned DB migrations |
| VA-06 | P3 | Admin financing CSV uses raw `fetch` bypass |

---

## 5. Production readiness score

See Executive Brief total **70/100**. Live domains alone cap certification.

**Gate to raise stamp to Live Certified:**

1. `pnpm ops:live-cutover` exit 0 (no placeholder allow)
2. Device smoke checklist complete
3. Architect sign-off recorded with tip SHA

Until then any “FULL LIVE PRODUCTION CERTIFIED” claim is **falsified** by probes.
