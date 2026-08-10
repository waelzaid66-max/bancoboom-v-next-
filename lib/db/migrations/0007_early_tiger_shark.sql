CREATE TABLE "message_notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"listing_id" uuid,
	"recipient_role" text NOT NULL,
	"sender_name" text NOT NULL,
	"preview" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"in_app_processed_at" timestamp,
	"email_processed_at" timestamp,
	"completed_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_notification_outbox_message_id_unique" UNIQUE("message_id"),
	CONSTRAINT "message_notification_outbox_recipient_role" CHECK ("message_notification_outbox"."recipient_role" IN ('buyer', 'seller'))
);
--> statement-breakpoint
ALTER TABLE "message_notification_outbox" ADD CONSTRAINT "message_notification_outbox_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_notification_outbox" ADD CONSTRAINT "message_notification_outbox_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_notification_outbox" ADD CONSTRAINT "message_notification_outbox_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_notification_outbox" ADD CONSTRAINT "message_notification_outbox_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_message_notification_outbox_due" ON "message_notification_outbox" USING btree ("completed_at","available_at","created_at");--> statement-breakpoint
CREATE INDEX "idx_message_notification_outbox_thread" ON "message_notification_outbox" USING btree ("recipient_id","conversation_id","created_at");