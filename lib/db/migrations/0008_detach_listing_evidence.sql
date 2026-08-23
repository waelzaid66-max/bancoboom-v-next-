-- Gate 4 — listing deletion must not erase the evidence around a listing.
--
-- Deleting a listing used to cascade away the buyer/seller conversation, the
-- booking, the moderation report filed against it and the captured lead
-- history. A seller reported for a scam could erase the report by deleting the
-- listing. The listing row and its listing_media still go — what survives is
-- the record, detached.
--
-- listing_media deliberately keeps ON DELETE CASCADE: the DB rows go with the
-- listing and the stored objects are handed to a reclamation path in
-- deleteListing.

ALTER TABLE "conversations" ALTER COLUMN "listing_id" DROP NOT NULL;
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_listing_id_listings_id_fk";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "listing_id" DROP NOT NULL;
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_listing_id_listings_id_fk";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "listing_id" DROP NOT NULL;
ALTER TABLE "reports" DROP CONSTRAINT "reports_listing_id_listings_id_fk";
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "lead_history" ALTER COLUMN "listing_id" DROP NOT NULL;
ALTER TABLE "lead_history" DROP CONSTRAINT "lead_history_listing_id_listings_id_fk";
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
