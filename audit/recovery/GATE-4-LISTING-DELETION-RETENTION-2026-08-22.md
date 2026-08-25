# GATE 4 — LISTING DELETION RETENTION CONTRACT

Date: 2026-08-22
Base: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
Branch: `test/listing-deletion-retention-red-20260822`
Mode: RED-contract / forensic only. No Product code, DB schema, migration, generated-client, Mobile UI, Maps, Messenger implementation, or deployment changes.

## Scope

This gate isolates the cross-domain consequences of ordinary seller listing deletion:

`Listing delete -> persistence/FK graph -> Media -> Messenger -> Booking -> Reports -> Leads -> public/detail consumer`

The purpose is to define the retention boundary before any repair. It does **not** authorize a blanket `CASCADE -> SET NULL` migration and does **not** choose a storage-transaction design by test convenience.

## Source facts proven before writing the matrix

1. `ListingService.deleteListing()` owner-checks the listing and performs a hard `db.delete(listings)`.
2. `conversations.listing_id` is non-null and `ON DELETE CASCADE`.
3. `messages.conversation_id` is non-null and `ON DELETE CASCADE`.
4. Messenger otherwise has participant-local soft-hide (`buyerDeletedAt` / `sellerDeletedAt`), so listing deletion currently has a much stronger consequence than user thread deletion.
5. `bookings.listing_id`, `reports.listing_id`, and `lead_history.listing_id` are current hard-retention dependencies that cascade with the listing.
6. Other historical references in the same schema deliberately use `ON DELETE SET NULL`, proving that current persistence already distinguishes ephemeral rows from retained historical facts.
7. `listing_media` rows cascade with the listing, while the object-storage abstraction separately exposes first-party serving-object deletion. The current listing delete path has no proven durable storage-reclamation handoff.
8. Existing `MarketplaceLifecycle.e2e.test.ts` creates a conversation/message before deleting the listing but only asserts listing/attributes/search disappearance after delete; it does not assert post-delete Messenger retention.

## RED matrix

| ID | Domain | Precondition | Delete action | Required postcondition | Current-source expectation |
|---|---|---|---|---|---|
| G4-R1 | Messenger | seller listing + buyer/seller conversation + message | seller hard-deletes listing | conversation remains; listing reference detached; message body/history remains | **RED** — conversation cascades, therefore message cascades |
| G4-R2 | Booking | seller furnished-daily listing + guest booking | seller hard-deletes listing | booking transaction/history remains; listing reference detached | **RED** — booking cascades |
| G4-R3 | Reports/Admin evidence | seller listing + reporter open report | seller hard-deletes listing | report evidence remains; listing reference detached | **RED** — report cascades |
| G4-R4 | Lead history | seller listing + captured buyer lead | seller hard-deletes listing | captured lead remains; listing reference detached | **RED** — lead_history cascades |
| G4-G1 | Public/detail + media DB refs | listing + listing_media row | seller hard-deletes listing | listing gone, listing_media DB reference gone, detail consumer returns null | **GREEN invariant** under current hard-delete model |
| G4-R5 | Physical media | first-party listing media exists | seller hard-deletes listing | deletion path hands unreferenced first-party media to a durable/idempotent reclamation mechanism | **RED/source gap** — no proven handoff in `deleteListing` |

## Test artifact

`artifacts/api-server/src/services/ListingDeletionRetention.gate4.test.ts`

The tests are independent fixtures so one cascade failure cannot mask the other domains. Cleanup is future-safe: if later retention changes make rows survive with `listing_id = NULL`, the test teardown explicitly deletes the retained child rows before deleting users.

### Expected current result

The intended current state is mixed RED/GREEN:

- `G4-R1` RED
- `G4-R2` RED
- `G4-R3` RED
- `G4-R4` RED
- `G4-G1` GREEN
- `G4-R5` RED

No claim of executable PASS/FAIL is made until this exact branch SHA is run against the repository's PostgreSQL test environment.

## Explicit architecture constraints for the later repair

A later Product repair must not be inferred from these tests as permission to rewrite every FK. The final retention decision must remain domain-specific.

Preserve at minimum these design constraints during repair review:

- public inventory must disappear immediately after owner deletion;
- a seller must not acquire authority to destroy buyer-created message history merely by deleting a listing;
- transactional/audit records must have an explicit retention policy rather than accidental FK behavior;
- physical object deletion must be idempotent and must occur only when the object is genuinely unreferenced;
- do not pretend PostgreSQL + S3 are one atomic transaction; use a durable post-commit cleanup authority if physical deletion is required;
- admin moderation authority remains independent from seller authority;
- no change from this gate may be folded into PR #14 without separate reconciliation.

## Relationship to PR #14

PR #14 (`fix/gate3-listing-moderation-authority-20260821`) is a separate moderation-authority RED lane. Gate 4 intentionally does not modify its branch, tests, Product code, schemas, generated contracts, or package/test-chain wiring.

Gate 3 asks **who may change moderation-held listing state**.
Gate 4 asks **what historical data a seller is allowed to destroy when deleting their listing**.

They share the Listing domain but have different authorities and different blast radii. They must remain separate until final RC reconciliation.

## Verification command

From the repository test environment with PostgreSQL configured:

`pnpm --filter @workspace/api-server exec vitest run src/services/ListingDeletionRetention.gate4.test.ts`

Then run the existing delete/lifecycle tests unchanged to prove no accidental test mutation:

`pnpm --filter @workspace/api-server exec vitest run src/services/ListingService.delete.test.ts src/services/MarketplaceLifecycle.e2e.test.ts`

Finally run the repository build gate after any later Product repair:

`npm run build`

## Gate verdict

`LISTING-DELETION-RETENTION = RED CONTRACT ESTABLISHED / PRODUCT UNCHANGED / EXECUTION UNPROVEN`

Release impact: deletion semantics remain a release-review blocker until the retention policy is explicitly resolved and the final exact-SHA matrix is executable GREEN without weakening public deletion or ownership rules.
