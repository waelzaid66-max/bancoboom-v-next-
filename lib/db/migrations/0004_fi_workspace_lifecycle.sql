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
CREATE UNIQUE INDEX "financing_intermediaries_workspace_owner_uniq" ON "financing_intermediaries" USING btree ("workspace_owner_user_id") WHERE workspace_owner_user_id IS NOT NULL;
--> statement-breakpoint

-- Data reconciliation: align workspace_status with the legacy is_active flag
-- for any pre-existing rows (safe to re-run: idempotent direction).
UPDATE "financing_intermediaries" SET "workspace_status" = 'active'    WHERE "is_active" = true  AND "workspace_status" = 'draft';
UPDATE "financing_intermediaries" SET "workspace_status" = 'suspended' WHERE "is_active" = false AND "workspace_status" = 'draft';
-- Backfill workspace_owner_user_id from owner_user_id where not already set.
UPDATE "financing_intermediaries"
  SET "workspace_owner_user_id" = "owner_user_id"
  WHERE "owner_user_id" IS NOT NULL AND "workspace_owner_user_id" IS NULL;