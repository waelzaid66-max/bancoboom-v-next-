CREATE TYPE "public"."ad_type" AS ENUM('featured', 'native_feed', 'top_search');--> statement-breakpoint
CREATE TYPE "public"."audit_event_type" AS ENUM('blocked_lead', 'suspicious_click', 'invalid_impression', 'flagged_listing', 'price_outlier', 'spam_content', 'rate_limit_exceeded', 'shadow_ban', 'admin_action');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."body_type" AS ENUM('sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'van', 'crossover', 'minivan', 'convertible');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('new', 'used');--> statement-breakpoint
CREATE TYPE "public"."figures_source" AS ENUM('seller_provided', 'estimate');--> statement-breakpoint
CREATE TYPE "public"."financing_status" AS ENUM('new', 'forwarded', 'contacted', 'closed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."finishing_type" AS ENUM('finished', 'semi_finished', 'core_shell', 'super_lux');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'electric', 'natural_gas');--> statement-breakpoint
CREATE TYPE "public"."global_supply_response_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."global_supply_status" AS ENUM('open', 'fulfilled', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."import_order_stage" AS ENUM('order', 'review', 'confirm', 'shipping', 'customs', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."incoterms" AS ENUM('exw', 'fca', 'fob', 'cfr', 'cif', 'dap', 'ddp');--> statement-breakpoint
CREATE TYPE "public"."industrial_type" AS ENUM('factory', 'warehouse', 'machine', 'production_line', 'land', 'raw_material');--> statement-breakpoint
CREATE TYPE "public"."industry" AS ENUM('food', 'beverage', 'plastic', 'textile', 'pharmaceutical', 'chemical', 'engineering', 'other');--> statement-breakpoint
CREATE TYPE "public"."investment_interest_kind" AS ENUM('interest', 'request_details', 'contact');--> statement-breakpoint
CREATE TYPE "public"."investment_status" AS ENUM('draft', 'active', 'under_offer', 'closed');--> statement-breakpoint
CREATE TYPE "public"."investment_type" AS ENUM('factory_sale', 'business_sale', 'production_line_investment', 'franchise', 'partnership');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."lead_action" AS ENUM('whatsapp', 'call', 'chat', 'finance_request');--> statement-breakpoint
CREATE TYPE "public"."lead_billing_status" AS ENUM('charged', 'failed', 'not_billable');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."listing_category" AS ENUM('car', 'real_estate', 'industrial');--> statement-breakpoint
CREATE TYPE "public"."listing_link_type" AS ENUM('feeds_into', 'part_of', 'compatible_with');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'sold', 'archived', 'draft', 'pending_approval', 'pending_review', 'approved', 'rejected', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('message', 'lead', 'system', 'rfq', 'new_match', 'price_drop', 'comment', 'review', 'investment', 'global_supply', 'booking', 'payment_success', 'payment_failed', 'subscription_expiring', 'car_import');--> statement-breakpoint
CREATE TYPE "public"."origin_type" AS ENUM('local', 'imported');--> statement-breakpoint
CREATE TYPE "public"."ownership_type" AS ENUM('resale', 'primary', 'installment_ready');--> statement-breakpoint
CREATE TYPE "public"."payment_intent_purpose" AS ENUM('wallet_topup', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."payment_intent_status" AS ENUM('pending', 'completed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('vodafone_cash', 'fawry', 'instapay', 'bank_transfer', 'wallet');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('cash', 'seller_installment', 'bank_finance');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('seller', 'bank', 'dealer', 'supplier');--> statement-breakpoint
CREATE TYPE "public"."promo_ad_transaction_type" AS ENUM('grant', 'consume', 'expire', 'reset');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'villa', 'townhouse', 'twinhouse', 'penthouse', 'duplex', 'studio', 'chalet', 'office', 'clinic', 'shop', 'land');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('fake_price', 'wrong_data', 'scam', 'duplicate', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."rfq_offer_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('open', 'awarded', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shipping_method" AS ENUM('container', 'bulk', 'air');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('instagram', 'linkedin', 'website', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('owner', 'admin', 'moderator', 'support', 'user');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled', 'pending');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('wallet_topup', 'boost_charge', 'subscription_charge', 'lead_charge', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."transmission" AS ENUM('manual', 'automatic', 'cvt');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('individual', 'dealer', 'company', 'enterprise', 'financial_institution');--> statement-breakpoint
CREATE TYPE "public"."zone_type" AS ENUM('urban', 'suburb', 'coastal', 'industrial', 'new_city');--> statement-breakpoint
CREATE TABLE "ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"ad_type" "ad_type" DEFAULT 'native_feed' NOT NULL,
	"is_active" boolean DEFAULT true,
	"starts_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"budget_total" numeric,
	"budget_spent" numeric DEFAULT '0' NOT NULL,
	"cost_per_impression" numeric DEFAULT '0' NOT NULL,
	"ranking_weight" numeric DEFAULT '1' NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"billable_impressions" integer DEFAULT 0 NOT NULL,
	"boost_idempotency_key" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ads_boost_idempotency_key_unique" UNIQUE("boost_idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "audit_event_type" NOT NULL,
	"severity" "audit_severity" DEFAULT 'warning' NOT NULL,
	"actor_user_id" uuid,
	"subject_user_id" uuid,
	"listing_id" uuid,
	"ad_id" uuid,
	"ip" text,
	"device_id" text,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"guest_id" uuid,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"nights" integer NOT NULL,
	"price_per_night" numeric(14, 2),
	"total_price" numeric(14, 2),
	"currency" text DEFAULT 'EGP' NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"note" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" "listing_category" DEFAULT 'car' NOT NULL,
	"name_ar" text,
	"country" text,
	"parent_company" text,
	"founded_year" integer,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"is_electric" boolean DEFAULT false NOT NULL,
	"is_commercial" boolean DEFAULT false NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"search_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "candidate_attribute_seen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candidate_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "listing_category" NOT NULL,
	"attr_key" text NOT NULL,
	"sample_value" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"user_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'candidate' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "car_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "car_variants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"company_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chk_company_follow_no_self" CHECK ("company_follows"."follower_id" <> "company_follows"."company_user_id")
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"about" text,
	"year_established" integer,
	"countries_import_from" jsonb,
	"countries_export_to" jsonb,
	"min_order_value" numeric,
	"min_order_unit" text,
	"monthly_capacity" text,
	"lead_time_days" integer,
	"certifications" jsonb,
	"website_url" text,
	"logo_url" text,
	"cover_url" text,
	"industry" "industry",
	"hq_country" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "company_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"last_message_text" text,
	"last_message_at" timestamp,
	"buyer_unread" integer DEFAULT 0 NOT NULL,
	"seller_unread" integer DEFAULT 0 NOT NULL,
	"buyer_deleted_at" timestamp,
	"seller_deleted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dedup_keys" (
	"store_name" text NOT NULL,
	"dedup_key" text NOT NULL,
	"seen_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dedup_keys_store_name_dedup_key_pk" PRIMARY KEY("store_name","dedup_key")
);
--> statement-breakpoint
CREATE TABLE "email_provider_config" (
	"provider" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"from_name" text,
	"from_email" text,
	"sending_domain" text,
	"reply_to" text,
	"public_app_url" text,
	"enc_api_key" text,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financing_branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intermediary_id" uuid NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financing_intermediaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"notes" text,
	"owner_user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financing_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"status" "financing_status" DEFAULT 'new' NOT NULL,
	"intermediary_id" uuid,
	"branch_id" uuid,
	"assigned_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "financing_requests_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "financing_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intermediary_id" uuid NOT NULL,
	"branch_id" uuid,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'agent' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finishing_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "finishing_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "global_supply_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"product_text" text NOT NULL,
	"category" "listing_category",
	"industry" "industry",
	"quantity" numeric,
	"unit" text,
	"destination_country" text NOT NULL,
	"budget_max" numeric,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"incoterms" "incoterms",
	"notes" text,
	"status" "global_supply_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "global_supply_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"country_of_origin" text,
	"moq" numeric,
	"shipping_time_days" integer,
	"incoterms" "incoterms",
	"delivery_estimate" text,
	"price_quote" numeric,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"message" text,
	"status" "global_supply_response_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_order_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid,
	"stage" "import_order_stage" DEFAULT 'order' NOT NULL,
	"origin_country" text,
	"destination_country" text,
	"details" jsonb,
	"budget_amount" numeric,
	"quote_amount" numeric,
	"currency" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "industrial_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "industrial_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "industries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"listing_id" uuid PRIMARY KEY NOT NULL,
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"whatsapp_clicks" integer DEFAULT 0,
	"call_clicks" integer DEFAULT 0,
	"finance_requests" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investment_interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "investment_interest_kind" DEFAULT 'interest' NOT NULL,
	"message" text,
	"contact_phone" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investment_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"investment_type" "investment_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"industry" "industry",
	"location" text NOT NULL,
	"location_id" uuid,
	"total_value_amount" numeric NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"expected_roi_pct" numeric,
	"payback_years" numeric,
	"revenue_range_min" numeric,
	"revenue_range_max" numeric,
	"cost_structure_note" text,
	"growth_potential_note" text,
	"figures_source" "figures_source" DEFAULT 'seller_provided' NOT NULL,
	"cover_url" text,
	"status" "investment_status" DEFAULT 'active' NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"status" "invoice_status" DEFAULT 'paid' NOT NULL,
	"line_items" jsonb,
	"issued_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "invoices_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "lead_billing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"buyer_id" uuid,
	"listing_id" uuid,
	"action_type" "lead_action" NOT NULL,
	"status" "lead_billing_status" NOT NULL,
	"amount_charged" numeric DEFAULT '0' NOT NULL,
	"transaction_id" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "lead_billing_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "lead_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"buyer_id" uuid,
	"seller_id" uuid NOT NULL,
	"action_type" "lead_action" NOT NULL,
	"status" "lead_status" DEFAULT 'new',
	"buyer_name" text,
	"buyer_phone" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"viewer_clerk_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listing_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"specs" jsonb NOT NULL,
	"brand_id" uuid,
	"model_id" uuid,
	"variant_id" uuid,
	"fuel_type" "fuel_type",
	"condition" "condition",
	"body_type" "body_type",
	"transmission" "transmission",
	"property_type" "property_type",
	"finishing_type" "finishing_type",
	"ownership_type" "ownership_type",
	"industrial_type" "industrial_type",
	"industry" "industry",
	"property_type_id" uuid,
	"finishing_type_id" uuid,
	"ownership_type_id" uuid,
	"industrial_type_id" uuid,
	"industry_id" uuid,
	"delivery_time_days" integer,
	"origin_type" "origin_type",
	"country_of_origin" text,
	"shipping_method" "shipping_method",
	CONSTRAINT "listing_attributes_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE "listing_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listing_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_listing_id" uuid NOT NULL,
	"to_listing_id" uuid NOT NULL,
	"relation" "listing_link_type" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chk_listing_link_no_self" CHECK ("listing_links"."from_listing_id" <> "listing_links"."to_listing_id")
);
--> statement-breakpoint
CREATE TABLE "listing_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"is_thumbnail" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" "listing_category" NOT NULL,
	"base_price_cash" numeric NOT NULL,
	"location" text NOT NULL,
	"location_id" uuid,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"status" "listing_status" DEFAULT 'active',
	"trust_score" integer DEFAULT 0,
	"is_duplicate" boolean DEFAULT false,
	"duplicate_of_id" uuid,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"bumped_at" timestamp,
	"is_request" boolean DEFAULT false NOT NULL,
	"saves_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" text NOT NULL,
	"area" text NOT NULL,
	"slug" text NOT NULL,
	"zone_type" "zone_type" DEFAULT 'urban' NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "locations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"media_url" text,
	"media_kind" text,
	"reactions" jsonb,
	"reply_to_id" uuid,
	"listing_ref_id" uuid,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"body_type" "body_type",
	"year_start" integer,
	"year_end" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ownership_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ownership_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"method" "payment_method" NOT NULL,
	"purpose" "payment_intent_purpose" NOT NULL,
	"status" "payment_intent_status" DEFAULT 'pending' NOT NULL,
	"provider_ref" text,
	"plan_id" uuid,
	"completed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"mode" "payment_mode" NOT NULL,
	"down_payment" numeric,
	"monthly_payment" numeric,
	"duration_months" integer,
	"is_islamic_compliant" boolean DEFAULT false,
	"provider" "payment_provider" DEFAULT 'seller' NOT NULL,
	"provider_name" text,
	"annual_rate_pct" numeric,
	"profit_rate_pct" numeric
);
--> statement-breakpoint
CREATE TABLE "payment_provider_config" (
	"provider" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"mode" text DEFAULT 'test' NOT NULL,
	"public_key" text,
	"integration_ids" text,
	"api_base" text,
	"enc_secret_key" text,
	"enc_hmac_secret" text,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pending_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_name" text NOT NULL,
	"normalized" text NOT NULL,
	"iso_country_code" text,
	"suggested_parent_id" uuid,
	"suggested_type" text,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"confidence_score" numeric(4, 3),
	"source" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"merged_into_id" uuid,
	"first_seen_at" timestamp DEFAULT now(),
	"last_seen_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"audience" "user_role" DEFAULT 'dealer' NOT NULL,
	"is_baseline" boolean DEFAULT false NOT NULL,
	"monthly_price" numeric DEFAULT '0' NOT NULL,
	"listing_quota" integer,
	"active_listing_cap" integer,
	"boost_price" numeric DEFAULT '0' NOT NULL,
	"cpl_whatsapp" numeric DEFAULT '0' NOT NULL,
	"cpl_call" numeric DEFAULT '0' NOT NULL,
	"cpl_chat" numeric DEFAULT '0' NOT NULL,
	"cpl_finance_request" numeric DEFAULT '0' NOT NULL,
	"ranking_weight" numeric DEFAULT '1' NOT NULL,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"category" "listing_category" NOT NULL,
	"segment_key" text NOT NULL,
	"location_key" text,
	"price" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text DEFAULT 'listing_publish' NOT NULL,
	"observed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promo_ad_campaign_config" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"verified_monthly_amount" numeric(12, 2) DEFAULT '10000' NOT NULL,
	"unverified_monthly_amount" numeric(12, 2) DEFAULT '5000' NOT NULL,
	"duration_months" integer DEFAULT 4 NOT NULL,
	"campaign_version" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "promo_cfg_singleton" CHECK ("promo_ad_campaign_config"."id" = 'singleton'),
	CONSTRAINT "promo_cfg_amounts_nonneg" CHECK ("promo_ad_campaign_config"."verified_monthly_amount" >= 0 AND "promo_ad_campaign_config"."unverified_monthly_amount" >= 0),
	CONSTRAINT "promo_cfg_duration_range" CHECK ("promo_ad_campaign_config"."duration_months" >= 1 AND "promo_ad_campaign_config"."duration_months" <= 24)
);
--> statement-breakpoint
CREATE TABLE "promo_ad_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"campaign_version" integer NOT NULL,
	"month_index" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promo_ad_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "promo_ad_transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"balance_after" numeric(12, 2) NOT NULL,
	"campaign_version" integer NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"description" text,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "promo_ad_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "property_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "property_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"counter_name" text NOT NULL,
	"bucket_key" text NOT NULL,
	"event_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference_developers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text,
	"local_name" text,
	"iso_country_code" text DEFAULT 'EG' NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_blob" text DEFAULT '' NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "reference_developers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reference_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_id" text NOT NULL,
	"parent_id" uuid,
	"place_type" text NOT NULL,
	"iso_country_code" text,
	"name_en" text NOT NULL,
	"name_ar" text,
	"local_name" text,
	"slug" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_blob" text DEFAULT '' NOT NULL,
	"developer_id" uuid,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"geohash" text,
	"postal_code" text,
	"timezone" text,
	"currency" text,
	"language" text,
	"popularity" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"source" text,
	"source_url" text,
	"confidence_score" numeric(4, 3),
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "reference_places_global_id_unique" UNIQUE("global_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reporter_user_id" uuid,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"resolved_by_user_id" uuid,
	"resolution_note" text,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rfq_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"price_quote" numeric NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"lead_time_days" integer,
	"moq" numeric,
	"message" text,
	"status" "rfq_offer_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"category" "listing_category" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"quantity" numeric,
	"unit" text,
	"target_price_max" numeric,
	"destination_country" text,
	"industry" "industry",
	"industrial_type" "industrial_type",
	"status" "rfq_status" DEFAULT 'open' NOT NULL,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"query" text,
	"category" "listing_category",
	"filters" jsonb,
	"price_min" numeric,
	"price_max" numeric,
	"alerts_enabled" boolean DEFAULT true NOT NULL,
	"last_notified_listing_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seller_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rating_range" CHECK ("seller_reviews"."rating" >= 1 AND "seller_reviews"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid,
	"media_url" text NOT NULL,
	"caption" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"viewer_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"price_paid" numeric DEFAULT '0' NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"transaction_id" uuid,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_user_id" uuid,
	"is_admin" boolean DEFAULT false NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"subject" text NOT NULL,
	"category" text,
	"status" "support_ticket_status" DEFAULT 'open' NOT NULL,
	"last_reply_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric NOT NULL,
	"balance_after" numeric NOT NULL,
	"payment_method" "payment_method",
	"reference_type" text,
	"reference_id" uuid,
	"description" text,
	"idempotency_key" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "upload_claims" (
	"object_path" text PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_behavior" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"listing_id" uuid,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "social_platform" NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_number" text GENERATED ALWAYS AS ('BNC-' || upper(substring(replace(id::text, '-', '') from 1 for 12))) STORED,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" "user_role" DEFAULT 'individual' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"staff_role" "staff_role" DEFAULT 'user' NOT NULL,
	"is_verified" boolean DEFAULT false,
	"wallet_balance" numeric DEFAULT '0' NOT NULL,
	"promo_ad_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"promo_ad_balance_expires_at" timestamp,
	"is_shadow_banned" boolean DEFAULT false NOT NULL,
	"quality_score" integer,
	"company_details" jsonb,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "users_account_number_unique" UNIQUE("account_number"),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_attribute_seen" ADD CONSTRAINT "candidate_attribute_seen_candidate_id_candidate_attributes_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_attribute_seen" ADD CONSTRAINT "candidate_attribute_seen_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_variants" ADD CONSTRAINT "car_variants_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_follows" ADD CONSTRAINT "company_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_follows" ADD CONSTRAINT "company_follows_company_user_id_users_id_fk" FOREIGN KEY ("company_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_provider_config" ADD CONSTRAINT "email_provider_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_branches" ADD CONSTRAINT "financing_branches_intermediary_id_financing_intermediaries_id_fk" FOREIGN KEY ("intermediary_id") REFERENCES "public"."financing_intermediaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_intermediaries" ADD CONSTRAINT "financing_intermediaries_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_requests" ADD CONSTRAINT "financing_requests_lead_id_lead_history_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_requests" ADD CONSTRAINT "financing_requests_intermediary_id_financing_intermediaries_id_fk" FOREIGN KEY ("intermediary_id") REFERENCES "public"."financing_intermediaries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_requests" ADD CONSTRAINT "financing_requests_branch_id_financing_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."financing_branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_seats" ADD CONSTRAINT "financing_seats_intermediary_id_financing_intermediaries_id_fk" FOREIGN KEY ("intermediary_id") REFERENCES "public"."financing_intermediaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_seats" ADD CONSTRAINT "financing_seats_branch_id_financing_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."financing_branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_seats" ADD CONSTRAINT "financing_seats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_supply_requests" ADD CONSTRAINT "global_supply_requests_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_supply_responses" ADD CONSTRAINT "global_supply_responses_request_id_global_supply_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."global_supply_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_supply_responses" ADD CONSTRAINT "global_supply_responses_supplier_id_users_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_order_documents" ADD CONSTRAINT "import_order_documents_order_id_import_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."import_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_interests" ADD CONSTRAINT "investment_interests_investment_id_investment_opportunities_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investment_opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_interests" ADD CONSTRAINT "investment_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_opportunities" ADD CONSTRAINT "investment_opportunities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_opportunities" ADD CONSTRAINT "investment_opportunities_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_billing" ADD CONSTRAINT "lead_billing_lead_id_lead_history_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_billing" ADD CONSTRAINT "lead_billing_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_billing" ADD CONSTRAINT "lead_billing_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_billing" ADD CONSTRAINT "lead_billing_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tokens" ADD CONSTRAINT "lead_tokens_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_variant_id_car_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."car_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_property_type_id_property_types_id_fk" FOREIGN KEY ("property_type_id") REFERENCES "public"."property_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_finishing_type_id_finishing_types_id_fk" FOREIGN KEY ("finishing_type_id") REFERENCES "public"."finishing_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_ownership_type_id_ownership_types_id_fk" FOREIGN KEY ("ownership_type_id") REFERENCES "public"."ownership_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_industrial_type_id_industrial_types_id_fk" FOREIGN KEY ("industrial_type_id") REFERENCES "public"."industrial_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attributes" ADD CONSTRAINT "listing_attributes_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_comments" ADD CONSTRAINT "listing_comments_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_comments" ADD CONSTRAINT "listing_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_comments" ADD CONSTRAINT "listing_comments_parent_id_listing_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."listing_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_links" ADD CONSTRAINT "listing_links_from_listing_id_listings_id_fk" FOREIGN KEY ("from_listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_links" ADD CONSTRAINT "listing_links_to_listing_id_listings_id_fk" FOREIGN KEY ("to_listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_messages_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_listing_ref_id_listings_id_fk" FOREIGN KEY ("listing_ref_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_options" ADD CONSTRAINT "payment_options_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_provider_config" ADD CONSTRAINT "payment_provider_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_locations" ADD CONSTRAINT "pending_locations_suggested_parent_id_reference_places_id_fk" FOREIGN KEY ("suggested_parent_id") REFERENCES "public"."reference_places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_locations" ADD CONSTRAINT "pending_locations_merged_into_id_reference_places_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "public"."reference_places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_ad_campaign_config" ADD CONSTRAINT "promo_ad_campaign_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_ad_grants" ADD CONSTRAINT "promo_ad_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_ad_transactions" ADD CONSTRAINT "promo_ad_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_places" ADD CONSTRAINT "reference_places_parent_id_reference_places_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reference_places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_places" ADD CONSTRAINT "reference_places_developer_id_reference_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."reference_developers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_offers" ADD CONSTRAINT "rfq_offers_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_offers" ADD CONSTRAINT "rfq_offers_supplier_id_users_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_behavior" ADD CONSTRAINT "user_behavior_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_behavior" ADD CONSTRAINT "user_behavior_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_social_links" ADD CONSTRAINT "user_social_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ads_active" ON "ads" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_ads_expires" ON "ads" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_ads_seller" ON "ads" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_audit_event" ON "audit_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_subject_user" ON "audit_log" USING btree ("subject_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_actor_user" ON "audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_listing" ON "audit_log" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_listing_status" ON "bookings" USING btree ("listing_id","status");--> statement-breakpoint
CREATE INDEX "idx_bookings_guest" ON "bookings" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_dates" ON "bookings" USING btree ("check_in","check_out");--> statement-breakpoint
CREATE INDEX "idx_brands_slug" ON "brands" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_brands_category" ON "brands" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_brands_active" ON "brands" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_brands_popularity" ON "brands" USING btree ("popularity");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_candidate_seen" ON "candidate_attribute_seen" USING btree ("candidate_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_candidate_attr" ON "candidate_attributes" USING btree ("category","attr_key");--> statement-breakpoint
CREATE INDEX "idx_candidate_attr_status" ON "candidate_attributes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_variants_model" ON "car_variants" USING btree ("model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_company_follow" ON "company_follows" USING btree ("follower_id","company_user_id");--> statement-breakpoint
CREATE INDEX "idx_company_follow_follower" ON "company_follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_company_follow_company" ON "company_follows" USING btree ("company_user_id");--> statement-breakpoint
CREATE INDEX "idx_company_profiles_user" ON "company_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_company_profiles_industry" ON "company_profiles" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_company_profiles_country" ON "company_profiles" USING btree ("hq_country");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_conversation_tuple" ON "conversations" USING btree ("listing_id","buyer_id","seller_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_buyer" ON "conversations" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_seller" ON "conversations" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_last_msg" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "idx_dedup_keys_seen_at" ON "dedup_keys" USING btree ("seen_at");--> statement-breakpoint
CREATE INDEX "idx_financing_branches_intermediary" ON "financing_branches" USING btree ("intermediary_id");--> statement-breakpoint
CREATE INDEX "idx_financing_intermediaries_active" ON "financing_intermediaries" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_financing_intermediaries_owner" ON "financing_intermediaries" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "idx_financing_requests_status" ON "financing_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_financing_requests_intermediary" ON "financing_requests" USING btree ("intermediary_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_financing_seats_member" ON "financing_seats" USING btree ("intermediary_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_financing_seats_user" ON "financing_seats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_global_supply_buyer" ON "global_supply_requests" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_global_supply_status" ON "global_supply_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_global_supply_created" ON "global_supply_requests" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_global_supply_response_supplier" ON "global_supply_responses" USING btree ("request_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_global_supply_response_request" ON "global_supply_responses" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_global_supply_response_supplier" ON "global_supply_responses" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_global_supply_response_status" ON "global_supply_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_import_order_documents_order" ON "import_order_documents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_import_orders_user" ON "import_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_import_orders_stage" ON "import_orders" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_import_orders_listing" ON "import_orders" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_interactions_listing" ON "interactions" USING btree ("listing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_investment_interest" ON "investment_interests" USING btree ("investment_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_investment_interest_investment" ON "investment_interests" USING btree ("investment_id");--> statement-breakpoint
CREATE INDEX "idx_investment_interest_user" ON "investment_interests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_investments_owner" ON "investment_opportunities" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_investments_type" ON "investment_opportunities" USING btree ("investment_type");--> statement-breakpoint
CREATE INDEX "idx_investments_status" ON "investment_opportunities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_investments_industry" ON "investment_opportunities" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_investments_created" ON "investment_opportunities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_investments_flagged" ON "investment_opportunities" USING btree ("is_flagged");--> statement-breakpoint
CREATE INDEX "idx_invoices_user" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_created" ON "invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_lead_billing_seller" ON "lead_billing" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_lead_billing_status" ON "lead_billing" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_lead_billing_created" ON "lead_billing" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_lead_listing" ON "lead_history" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_lead_seller" ON "lead_history" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_lead_created" ON "lead_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_lead_tokens_viewer" ON "lead_tokens" USING btree ("viewer_clerk_id","listing_id");--> statement-breakpoint
CREATE INDEX "idx_lead_tokens_expires" ON "lead_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_listing_attributes_specs" ON "listing_attributes" USING gin ("specs");--> statement-breakpoint
CREATE INDEX "idx_listing_attributes_brand" ON "listing_attributes" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_listing_attributes_model" ON "listing_attributes" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_listing_attributes_property_type" ON "listing_attributes" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "idx_comment_listing" ON "listing_comments" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_comment_parent" ON "listing_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_comment_created" ON "listing_comments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_listing_link" ON "listing_links" USING btree ("from_listing_id","to_listing_id","relation");--> statement-breakpoint
CREATE INDEX "idx_listing_link_from" ON "listing_links" USING btree ("from_listing_id");--> statement-breakpoint
CREATE INDEX "idx_listing_link_to" ON "listing_links" USING btree ("to_listing_id");--> statement-breakpoint
CREATE INDEX "idx_media_listing" ON "listing_media" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_listings_created_at" ON "listings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_listings_price" ON "listings" USING btree ("base_price_cash");--> statement-breakpoint
CREATE INDEX "idx_listings_status" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_listings_category" ON "listings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_listings_user" ON "listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_listings_location" ON "listings" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_listings_trust" ON "listings" USING btree ("trust_score");--> statement-breakpoint
CREATE INDEX "idx_listings_duplicate" ON "listings" USING btree ("is_duplicate");--> statement-breakpoint
CREATE INDEX "idx_listings_flagged" ON "listings" USING btree ("is_flagged");--> statement-breakpoint
CREATE INDEX "idx_listings_is_request" ON "listings" USING btree ("is_request");--> statement-breakpoint
CREATE INDEX "idx_listings_saves" ON "listings" USING btree ("saves_count");--> statement-breakpoint
CREATE INDEX "idx_listings_title_trgm" ON "listings" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_listings_description_trgm" ON "listings" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_listings_recency" ON "listings" USING btree ("status","bumped_at","created_at");--> statement-breakpoint
CREATE INDEX "idx_listings_feed_filter" ON "listings" USING btree ("status","category","base_price_cash");--> statement-breakpoint
CREATE INDEX "idx_locations_slug" ON "locations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_locations_city" ON "locations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_message_conversation" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_message_created" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_models_brand" ON "models" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_models_slug" ON "models" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_notif_pref" ON "notification_preferences" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "idx_notif_pref_user" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notification_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notification_created" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_user" ON "payment_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_status" ON "payment_intents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_listing" ON "payment_options" USING btree ("listing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pending_locations_norm" ON "pending_locations" USING btree ("normalized","iso_country_code");--> statement-breakpoint
CREATE INDEX "idx_pending_locations_status" ON "pending_locations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plans_slug" ON "plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_plans_audience" ON "plans" USING btree ("audience");--> statement-breakpoint
CREATE INDEX "idx_price_observations_segment" ON "price_observations" USING btree ("segment_key");--> statement-breakpoint
CREATE INDEX "idx_price_observations_category" ON "price_observations" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_price_observations_observed" ON "price_observations" USING btree ("observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_price_observations_listing_source" ON "price_observations" USING btree ("listing_id","source");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_promo_grant" ON "promo_ad_grants" USING btree ("user_id","campaign_version","month_index");--> statement-breakpoint
CREATE INDEX "idx_promo_ad_tx_user_created" ON "promo_ad_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_promo_ad_tx_campaign" ON "promo_ad_transactions" USING btree ("campaign_version","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_push_token" ON "push_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_push_token_user" ON "push_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_rate_events_lookup" ON "rate_events" USING btree ("counter_name","bucket_key","event_at");--> statement-breakpoint
CREATE INDEX "idx_rate_events_at" ON "rate_events" USING btree ("event_at");--> statement-breakpoint
CREATE INDEX "idx_reference_developers_country" ON "reference_developers" USING btree ("iso_country_code");--> statement-breakpoint
CREATE INDEX "idx_reference_developers_status" ON "reference_developers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reference_places_parent" ON "reference_places" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_reference_places_country" ON "reference_places" USING btree ("iso_country_code");--> statement-breakpoint
CREATE INDEX "idx_reference_places_type" ON "reference_places" USING btree ("place_type");--> statement-breakpoint
CREATE INDEX "idx_reference_places_status" ON "reference_places" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reference_places_developer" ON "reference_places" USING btree ("developer_id");--> statement-breakpoint
CREATE INDEX "idx_reports_listing" ON "reports" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reports_created" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_reports_reporter" ON "reports" USING btree ("reporter_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reports_open_reporter_listing" ON "reports" USING btree ("listing_id","reporter_user_id") WHERE status = 'open';--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_rfq_offer_supplier" ON "rfq_offers" USING btree ("rfq_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_rfq_offers_rfq" ON "rfq_offers" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "idx_rfq_offers_supplier" ON "rfq_offers" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_rfq_offers_status" ON "rfq_offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rfqs_buyer" ON "rfqs" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_rfqs_status" ON "rfqs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rfqs_category" ON "rfqs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_rfqs_created" ON "rfqs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_saved_user_listing" ON "saved_listings" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "idx_saved_listing" ON "saved_listings" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_saved_search_user" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_search_alerts" ON "saved_searches" USING btree ("alerts_enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_seller_review_author" ON "seller_reviews" USING btree ("seller_id","author_id");--> statement-breakpoint
CREATE INDEX "idx_review_seller" ON "seller_reviews" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_review_created" ON "seller_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_story_user" ON "stories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_story_expires" ON "stories" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_story_created" ON "stories" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_story_view" ON "story_views" USING btree ("story_id","viewer_id");--> statement-breakpoint
CREATE INDEX "idx_story_view_story" ON "story_views" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_expires" ON "subscriptions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_subscriptions_active_user" ON "subscriptions" USING btree ("user_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_ticket_messages_ticket" ON "support_ticket_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_messages_created" ON "support_ticket_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tickets_status" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tickets_user" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_last_reply" ON "support_tickets" USING btree ("last_reply_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_created" ON "transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_type" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_transactions_reference" ON "transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "upload_claims_clerk_id_idx" ON "upload_claims" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "upload_claims_expires_at_idx" ON "upload_claims" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_behavior_user" ON "user_behavior" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_behavior_listing" ON "user_behavior" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_behavior_created" ON "user_behavior" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_social_platform" ON "user_social_links" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "idx_user_social_user" ON "user_social_links" USING btree ("user_id");