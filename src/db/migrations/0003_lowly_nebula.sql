CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.created';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.updated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.sent';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.viewed';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.accepted';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.declined';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.expired';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.converted';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'quote.cancelled';--> statement-breakpoint
CREATE TABLE "quote_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"customer_id" text NOT NULL,
	"company_id" text,
	"vehicle_supplier_id" text,
	"finance_provider_id" text,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"customer_type" "customer_type" DEFAULT 'business' NOT NULL,
	"finance_type" "finance_type" DEFAULT 'BCH' NOT NULL,
	"vehicle" jsonb NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"delivery" jsonb NOT NULL,
	"pricing" jsonb NOT NULL,
	"finance" jsonb NOT NULL,
	"addons" jsonb NOT NULL,
	"part_exchange" jsonb,
	"notes" text,
	"customer_notes" text,
	"total_amount_pence" integer DEFAULT 0 NOT NULL,
	"monthly_amount_pence" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" text,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"declined_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"converted_order_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "quote_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source_quote_id" text;--> statement-breakpoint
ALTER TABLE "quote_tokens" ADD CONSTRAINT "quote_tokens_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vehicle_supplier_id_suppliers_id_fk" FOREIGN KEY ("vehicle_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_finance_provider_id_suppliers_id_fk" FOREIGN KEY ("finance_provider_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_converted_order_id_orders_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quote_tokens_token_idx" ON "quote_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "quote_tokens_quote_idx" ON "quote_tokens" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotes_customer_idx" ON "quotes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "quotes_created_at_idx" ON "quotes" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_ref_idx" ON "quotes" USING btree ("ref");--> statement-breakpoint
CREATE INDEX "quotes_expires_at_idx" ON "quotes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "quotes_converted_order_idx" ON "quotes" USING btree ("converted_order_id");--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_quote_id_quotes_id_fk" FOREIGN KEY ("source_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_quote_idx" ON "audit_events" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "orders_source_quote_idx" ON "orders" USING btree ("source_quote_id");