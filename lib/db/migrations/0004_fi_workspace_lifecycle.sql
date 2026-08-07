CREATE TYPE "public"."fi_workspace_status" AS ENUM('draft', 'pending_review', 'active', 'suspended');--> statement-breakpoint
CREATE TABLE "fi_lifecycle_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intermediary_id" uuid NOT NULL,
	"from_status" "fi_workspace_status",
	"to_status" "fi_workspace_status" NOT NULL,
	"actor_user_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "financing_intermediaries" ADD COLUMN "workspace_status" "fi_workspace_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "financing_intermediaries" ADD COLUMN "workspace_owner_user_id" uuid;--> statement-breakpoint
ALTER TABLE "fi_lifecycle_events" ADD CONSTRAINT "fi_lifecycle_events_intermediary_id_financing_intermediaries_id_fk" FOREIGN KEY ("intermediary_id") REFERENCES "public"."financing_intermediaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_lifecycle_events" ADD CONSTRAINT "fi_lifecycle_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fi_lifecycle_events_intermediary" ON "fi_lifecycle_events" USING btree ("intermediary_id");--> statement-breakpoint
CREATE INDEX "idx_fi_lifecycle_events_created_at" ON "fi_lifecycle_events" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "financing_intermediaries" ADD CONSTRAINT "financing_intermediaries_workspace_owner_user_id_users_id_fk" FOREIGN KEY ("workspace_owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Data reconciliation (BEFORE unique index): align workspace_status with is_active
-- for LEGACY rows only (workspace_owner_user_id IS NULL = admin-only CRM rows).
-- Lifecycle-managed drafts (workspace_owner_user_id IS NOT NULL, is_active=false)
-- are intentionally excluded so they remain draft and can transition normally.
UPDATE "financing_intermediaries" SET "workspace_status" = 'active'
  WHERE "is_active" = true  AND "workspace_status" = 'draft' AND "workspace_owner_user_id" IS NULL;
UPDATE "financing_intermediaries" SET "workspace_status" = 'suspended'
  WHERE "is_active" = false AND "workspace_status" = 'draft' AND "workspace_owner_user_id" IS NULL;

-- Backfill workspace_owner_user_id from owner_user_id BEFORE the unique index.
-- Only backfill for users who own exactly ONE intermediary. Users with multiple
-- legacy intermediaries keep workspace_owner_user_id NULL and need admin
-- reconciliation — leaving them NULL prevents unique-index violations.
UPDATE "financing_intermediaries" fi
  SET "workspace_owner_user_id" = fi."owner_user_id"
  WHERE fi."owner_user_id" IS NOT NULL
    AND fi."workspace_owner_user_id" IS NULL
    AND (
      SELECT COUNT(*) FROM "financing_intermediaries" fi2
      WHERE fi2."owner_user_id" = fi."owner_user_id"
    ) = 1;

-- Unique ownership constraint: one active workspace per FI owner.
-- Partial (WHERE IS NOT NULL) so legacy admin-only rows remain unconstrained.
CREATE UNIQUE INDEX "financing_intermediaries_workspace_owner_uniq"
  ON "financing_intermediaries" USING btree ("workspace_owner_user_id")
  WHERE workspace_owner_user_id IS NOT NULL;
