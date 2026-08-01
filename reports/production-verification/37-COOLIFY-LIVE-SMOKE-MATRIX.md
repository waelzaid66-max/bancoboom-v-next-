# 37 — Coolify live smoke matrix (owner OPS)

**SoT tip (code):** branch `cursor/w41-production-release-5cf0`  
**Purpose:** Prove **live** publish readiness. Local gates ≠ Coolify.  
**Rule:** Record evidence (HTTP status, SHA, screenshot/note). Do not mark FULL CERT without this matrix.

---

## 0. Preconditions

| # | Check | Pass criteria |
|---|--------|----------------|
| 0.1 | PR merged to `main` | Compare closed / SHA on `main` |
| 0.2 | Tag `w.4.1` on merge SHA | `git ls-remote --tags origin w.4.1` |
| 0.3 | Coolify deploy that SHA | `readyz`/`livez` `gitSha` matches tag (when baked) |
| 0.4 | Secrets filled | Clerk, SESSION, PAYMENT_CONFIG_ENCRYPTION_KEY, Paymob, **S3 static keys** |
| 0.5 | Migrate one-shot run | `docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate` |

---

## 1. API / health

| ID | Action | Expect | Result |
|----|--------|--------|--------|
| S1 | `GET /api/healthz` | 200 `{ status: "ok" }` | ☐ |
| S2 | `GET /api/livez` | 200 + optional `gitSha`/`buildId` | ☐ |
| S3 | `GET /api/readyz` | **200** + `checks.database=ok` + `checks.money_schema=ok` | ☐ |
| S4 | Fresh DB without migrate then readyz | **503** until migrate (fail-closed) | ☐ N/A if already migrated |

---

## 2. Edge / paths (nginx `web`)

| ID | Action | Expect | Result |
|----|--------|--------|--------|
| S5 | `GET /nginx-health` | 200 | ☐ |
| S6 | `GET /` | Landing | ☐ |
| S7 | `GET /market/` | dealer-os | ☐ |
| S8 | `GET /admin/` | admin-os | ☐ |
| S9 | `GET /api/` or `/api/healthz` via nginx | Proxies to API | ☐ |
| S10 | `GET /dealer-os/` | **301/302 → `/market/`** (alias) | ☐ |
| S10b | `GET /banco-mobile/` | Landing SPA fallback (P2-M7b) — **not** Next consumer until owner A/B | ☐ noted |
| S11 | `GET /admin-os/` | **301/302 → `/admin/`** (alias) | ☐ |

---

## 3. Consumer website

| ID | Action | Expect | Result |
|----|--------|--------|--------|
| S12 | `banco-website` `/api/healthz` | surface `banco-website`, wave/identity w4.1-class | ☐ |
| S13 | Sign-in (Clerk) on website | Session established | ☐ |
| S14 | `/workspace` (AR) + `/en/workspace` | Shell loads signed-in | ☐ |
| S15 | `/workspace/settings` Danger zone | Delete account UI visible (P2-M3) | ☐ |
| S16 | Store/market/admin CTAs | Not stuck on “soon” when bake URLs set | ☐ |

---

## 4. Uploads (S3)

| ID | Action | Expect | Result |
|----|--------|--------|--------|
| S17 | Create listing / request upload URL | Success (not replit provider) | ☐ |
| S18 | `OBJECT_STORAGE_PROVIDER` | `s3` + region/bucket/keys present | ☐ |

---

## 5. Auth / account (Clerk + tombstone)

| ID | Action | Expect | Result |
|----|--------|--------|--------|
| S19 | Sign-in website + `/market` + `/admin` | Role gates work | ☐ |
| S20 | Clerk Dashboard social providers (if used) | Enabled + redirect URIs allowlisted | ☐ |
| S21 | Mobile delete account (existing) | Soft-delete + sign-out | ☐ |
| S22 | Web delete via `/workspace/settings` | `DELETE /api/v1/users/me` 200 → sign-out → home | ☐ |
| S23 | Revisit API with old session after delete | `401 ACCOUNT_DELETED` then client sign-out (P2-M2) | ☐ |

---

## 6. Payments

| ID | Action | Expect | Result |
|----|--------|--------|--------|
| S24 | Paymob webhook URL → `/api/v1/payments/webhook` | HMAC accepted on test/live event | ☐ |
| S25 | Wallet top-up happy path | Intent → webhook settle → balance | ☐ |
| S26 | Known residual P2-H1 TOFU | Document Intention payload; do not invent fix mid-smoke | ☐ noted |

---

## 7. Mobile (EAS) — optional for API cutover

| ID | Action | Expect | Result |
|----|--------|--------|--------|
| S27 | EAS production build | Completes | ☐ |
| S28 | Device push register | Token stored | ☐ |
| S29 | OAuth / MFA on device | Per tenant config | ☐ |

---

## 8. Verdict after matrix

| Claim | When allowed |
|-------|----------------|
| Coolify ship OK | S1–S3, S5–S9, S12–S14, S17–S18 pass |
| Auth/account OK | S19 + (S21 or S22) + S23 |
| Money OK | S24–S25 (S26 residual logged) |
| **FULL CERT** | All critical rows + device matrix owner-accepted |

**Local code gates alone never equal FULL CERT.**
