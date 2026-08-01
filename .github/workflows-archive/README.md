# Archived workflows — kept, not deleted

These two workflows pushed a full copy of `main` into separate deploy repos
(`bancooom` for GCP Cloud Build, `aws-virgen` for AWS). They are the mechanism
that produced the multiple divergent repository copies found in the Phase 0
forensic audit.

`bancoboomstor` is the single source of truth and deploys via Coolify, so they
are archived here rather than removed: GitHub only executes workflows under
`.github/workflows/`, so nothing in this folder can run.

To reinstate one, move the file back into `.github/workflows/` and set the
matching PAT repository secret (`BANCOOOM_SYNC_TOKEN` / `AWS_VIRGEN_SYNC_TOKEN`).

Both were `workflow_dispatch` only — manual, never automatic on push.
