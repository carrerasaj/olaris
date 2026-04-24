CREATE TYPE "public"."feedback_category" AS ENUM('promoter', 'passive', 'detractor');--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'email.suppressed';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'feedback.requested';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'feedback.submitted';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'feedback.detractor_flagged';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'handover_pack.generated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'handover_pack.superseded';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer.marketing_opt_out_changed';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'handover_pack' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"score" integer NOT NULL,
	"category" "feedback_category" NOT NULL,
	"comment" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"token_id" text,
	"ip" text,
	"user_agent" text,
	"geo_city" text,
	"geo_country" text
);
--> statement-breakpoint
CREATE TABLE "feedback_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "marketing_opt_out" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "last_communicated_eta_date" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_token_id_feedback_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."feedback_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_tokens" ADD CONSTRAINT "feedback_tokens_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_tokens" ADD CONSTRAINT "feedback_tokens_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_order_idx" ON "feedback" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "feedback_customer_idx" ON "feedback" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "feedback_submitted_at_idx" ON "feedback" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "feedback_category_idx" ON "feedback" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_tokens_token_idx" ON "feedback_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "feedback_tokens_order_idx" ON "feedback_tokens" USING btree ("order_id");