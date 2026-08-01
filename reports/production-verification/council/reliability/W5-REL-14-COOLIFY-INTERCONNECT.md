# W5-REL-14 — Coolify compose ↔ Dockerfile ↔ readyz interconnect inventory

**Seat:** Production Reliability Engineer · `bc-019fb4d1…53de`  
**Tip:** `a9f5c35`  
**Mode:** Evidence inventory only — **no CI wiring / no compose renames** without Chair Approve

## Interconnect map (tip)

| Layer | SoT on tip | Status |
|-------|------------|--------|
| Compose | `docker-compose.coolify.yml` — apex → service **`web:80`**; `migrate` profile one-off; `api` health = `/api/readyz` | DOCUMENTED |
| Dockerfiles | `deploy/coolify/Dockerfile.{api,web,banco-web,banco-website}` | PRESENT |
| Deploy order | `deploy/coolify/COOLIFY-DEPLOY-ORDER.md` §4 banco-web profile (D-21) | PRESENT |
| Ops click path | `COOLIFY_DEPLOY_NOW.md` (repo root) | PRESENT |
| Readyz | `health.ts` requires `database` + `money_schema` + **`upload_claims`** | PASS (code) |
| Cutover script | `ops-live-cutover-check.mjs` mirrors readyz trio incl. upload_claims | PASS (REL-13) |
| S3 fail-closed | Coolify requires OBJECT_STORAGE/S3 vars; API refuses start without (deploy-order §0) | DOCUMENTED |
| CI Website Docker | Workflow builds Coolify Dockerfiles | CI watching tip |

## Proposed Approve Plans (NOT implemented)

| ID | Proposal | Why |
|----|----------|-----|
| **AP-CI-01** | Ensure CI path-filters always exercise Coolify Dockerfiles when `deploy/coolify/**` or compose changes | Avoid silent Dockerfile drift |
| **AP-CI-02** | Optional staging-p0 root alias / smoke job post-DNS (not before cutover) | After OPS DNS only |

**Ask Chair:** Approve AP-CI-01 / AP-CI-02? Reliability will not wire CI until yes.

**Forbidden observed:** no service renames · no Dockerfile product rewrites this seat.
