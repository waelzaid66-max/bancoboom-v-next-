CREATE TABLE "billing_receipt_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"in_app_processed_at" timestamp,
	"email_processed_at" timestamp,
	"completed_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_receipt_outbox_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "billing_receipt_outbox" ADD CONSTRAINT "billing_receipt_outbox_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_billing_receipt_outbox_due" ON "billing_receipt_outbox" USING btree ("completed_at","available_at","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_notification_dedupe" ON "notifications" USING btree ("dedupe_key");