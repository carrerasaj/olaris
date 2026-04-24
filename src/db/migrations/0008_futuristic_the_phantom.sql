CREATE TYPE "public"."lead_event_type" AS ENUM('lead.created', 'gated_resource.sent', 'gated_resource.failed', 'drip.enrolled', 'drip.sent', 'drip.suppressed', 'drip.failed', 'lead.unsubscribed', 'lead.converted_to_customer');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('excess-mileage', 'company-car-tax', 'ev-transition', 'fleet-compliance', 'contact', 'newsletter', 'pillar-download', 'exit-intent', 'sticky-bar', 'case-study', 'fleet-scorecard', 'other');--> statement-breakpoint
CREATE TABLE "drip_enrolments" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"sequence_id" text NOT NULL,
	"step" integer NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"event_type" "lead_event_type" NOT NULL,
	"payload" jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"company" text,
	"source" "lead_source" NOT NULL,
	"source_context" jsonb,
	"marketing_opt_out" boolean DEFAULT false NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"unsubscribe_token" text NOT NULL,
	"converted_customer_id" text,
	"converted_at" timestamp with time zone,
	"ip" text,
	"user_agent" text,
	"geo_city" text,
	"geo_country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drip_enrolments" ADD CONSTRAINT "drip_enrolments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_customer_id_customers_id_fk" FOREIGN KEY ("converted_customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "drip_enrolments_lead_sequence_step_idx" ON "drip_enrolments" USING btree ("lead_id","sequence_id","step");--> statement-breakpoint
CREATE INDEX "drip_enrolments_scheduled_idx" ON "drip_enrolments" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "drip_enrolments_lead_idx" ON "drip_enrolments" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_events_lead_idx" ON "lead_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_events_type_idx" ON "lead_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "lead_events_created_at_idx" ON "lead_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_email_source_idx" ON "leads" USING btree ("email","source");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_source_idx" ON "leads" USING btree ("source");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_unsubscribe_token_idx" ON "leads" USING btree ("unsubscribe_token");