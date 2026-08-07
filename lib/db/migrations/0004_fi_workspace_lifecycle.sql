-- Task 5: FI Workspace Lifecycle — additive migration
-- Adds workspace lifecycle state machine to financing_intermediaries

-- 1. New enum for workspace lifecycle status
CREATE TYPE "fi_workspace_status" AS ENUM ('draft', 'pending_review', 'active', 'suspended');
--> statement-breakpoint

-- 2. New columns on financing_intermediaries
ALTER TABLE "financing_intermediaries" ADD COLUMN "workspace_status" "fi_workspace_status" DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
ALTER TABLE "financing_intermediaries" ADD COLUMN "workspace_owner_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- 3. Reconcile existing data: active→active, inactive→suspended
UPDATE "financing_intermediaries" SET "workspace_status" = 'active' WHERE "is_active" = true;
--> statement-breakpoint
UPDATE "financing_intermediaries" SET "workspace_status" = 'suspended' WHERE "is_active" = false;
--> statement-breakpoint

-- 4. Backfill workspace_owner_user_id from owner_user_id
UPDATE "financing_intermediaries" SET "workspace_owner_user_id" = "owner_user_id" WHERE "owner_user_id" IS NOT NULL;
--> statement-breakpoint

-- 5. fi_lifecycle_events table
CREATE TABLE "fi_lifecycle_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intermediary_id" uuid NOT NULL REFERENCES "financing_intermediaries"("id") ON DELETE CASCADE,
  "from_status" "fi_workspace_status",
  "to_status" "fi_workspace_status" NOT NULL,
  "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "reason" text,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- 6. Indexes
CREATE INDEX "idx_fi_lifecycle_events_intermediary" ON "fi_lifecycle_events" ("intermediary_id");
--> statement-breakpoint
CREATE INDEX "idx_fi_lifecycle_events_created_at" ON "fi_lifecycle_events" ("created_at");
