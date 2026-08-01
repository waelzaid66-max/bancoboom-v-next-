# BANCO — Google Play Data Safety (Copy-In Reference)

This document is the source of truth for completing the **Data Safety** form in
Google Play Console (Policy → App content → Data safety). Copy each answer into
the matching Console field. Keep this file updated whenever data collection
changes.

---

## 1. Summary answers

| Console question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS/TLS for all API traffic) |
| Do you provide a way for users to request that their data be deleted? | **Yes** — in-app: Profile → Delete Account, plus email to privacy@banco.today |

---

## 2. Data types collected

### Personal info
| Data type | Collected | Shared | Processing | Purpose | Optional? |
| --- | --- | --- | --- | --- | --- |
| Name | Yes | No | Required for account | Account management | Required |
| Email address | Yes | No | Required for account | Account management, authentication | Required |
| Phone number | Yes | No | Collected only when user shares it to contact a seller | App functionality (connect buyer & seller) | Optional |

### Photos
| Data type | Collected | Shared | Processing | Purpose | Optional? |
| --- | --- | --- | --- | --- | --- |
| Photos | Yes | No | Photos the user explicitly selects (profile picture, listing/chat media) and the business verification documents & identity photo they capture or choose during account verification | App functionality (profile picture, listings, business verification/KYC) | Optional |

### Location
| Data type | Collected | Shared | Processing | Purpose | Optional? |
| --- | --- | --- | --- | --- | --- |
| Approximate / precise location | Yes | No | Only when the user taps “use my location” for a listing place or near-me search | App functionality | Optional |

### App activity
| Data type | Collected | Shared | Processing | Purpose | Optional? |
| --- | --- | --- | --- | --- | --- |
| App interactions | Yes | No | Listings viewed, searches, taps | Analytics, personalization (feed recommendations) | Optional |
| Other user-generated content | Yes | No | Inquiry actions (call / WhatsApp / chat) on listings | App functionality | Optional |

### App info and performance
| Data type | Collected | Shared | Processing | Purpose | Optional? |
| --- | --- | --- | --- | --- | --- |
| Crash logs / diagnostics | Yes | No | Standard diagnostics | App functionality, analytics | Optional |

> Approximate/precise location is collected **only** when the user taps “use my
> location” (listing place or near-me search). We do **not** collect contacts,
> calendar, SMS, call logs, health, or browsing history. We do **not** use any
> data for third-party advertising and we do **not** sell user data.

---

## 3. Security practices

- **Encryption in transit:** Yes — all client↔server traffic uses HTTPS/TLS.
- **Encryption at rest:** Provided by the database/storage infrastructure.
- **Account deletion:** Users can delete their account in-app (Profile → Delete
  Account). Deletion runs an atomic backend pipeline that anonymizes the account
  record (soft delete), erases saved listings and behavioral activity, strips
  personal contact details from prior inquiries, and removes the user from the
  authentication provider (Clerk).
- **Data deletion request URL:** the public Privacy Policy page (see §5) plus the in-app flow (Profile → Delete Account).
- **Committed to Play Families policy:** App is not directed at children.

---

## 4. Permissions declared

| Permission | When requested | Rationale shown first? |
| --- | --- | --- |
| Photo library (READ_MEDIA_IMAGES) | When the user taps their avatar to set a profile picture, attaches media to a listing/chat, or chooses an existing file in the business verification flow | Yes — the avatar flow shows the in-app `PermissionRationaleModal`; the other flows request the permission only after an explicit user tap on a "choose"/"attach" action |
| Camera (CAMERA) | When the user explicitly taps “Take photo” for a listing, or to capture a verification document / identity photo | Yes — OS prompt only after that explicit in-app action; on permanent denial we deep-link to system Settings |
| Location (ACCESS_COARSE/FINE_LOCATION) | Only when the user taps “use my location” for a listing place or near-me search | Yes — permission is requested after that explicit action |
| Notifications (POST_NOTIFICATIONS) | When the user enables push / the OS prompts on first notification registration | Yes — optional; push degrades silently if denied |

No background access to camera, photos, or location is requested.

---

## 5. Required policy links

The Privacy Policy and Terms are hosted publicly on the dealer/market web
surface (no sign-in). They mirror the in-app legal screens, including the
**Financial Transparency** disclosure. Each page has an English ⇄ العربية toggle.

| Document | Coolify path (current nginx map) | Play Console field |
| --- | --- | --- |
| **Privacy Policy** | `/market/privacy` | Paste the full URL into Policy → App content → **Privacy policy** |
| **Terms of Service** | `/market/terms` | (best practice — link in store listing / app) |

**Full URL = `https://<DOMAIN>/market/privacy`**, where `<DOMAIN>` is the
Coolify public host (typically `banco.today` after DNS cutover).

Legacy path `/dealer-os/privacy` is redirected by Coolify nginx to `/market/`
(path not preserved) — do **not** use `/dealer-os/*` for Play Console.

- **Production (after Coolify + DNS):** `https://banco.today/market/privacy`
- **Do not** paste ephemeral Replit preview URLs into Play Console.

- **In-app:** also available at Profile → Privacy Policy and Profile → Terms of
  Service (the source copy these pages mirror).

> Action item before submission: confirm Coolify `web` serves `/market/privacy`
> publicly, then paste that URL into the Play Console Privacy policy field.
