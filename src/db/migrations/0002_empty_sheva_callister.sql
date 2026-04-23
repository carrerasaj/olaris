CREATE TYPE "public"."supplier_kind" AS ENUM('dealer', 'broker', 'oem_partner', 'importer', 'funder');--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier.created';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier.updated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier.deactivated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier.reactivated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.vehicle_supplier_set';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.finance_provider_set';--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "supplier_kind" NOT NULL,
	"legal_name" text NOT NULL,
	"trading_name" text,
	"primary_contact_name" text NOT NULL,
	"primary_contact_email" text NOT NULL,
	"primary_contact_phone" text,
	"website" text,
	"address_line_1" text,
	"address_line_2" text,
	"address_city" text,
	"address_postcode" text,
	"address_country" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "vehicle_supplier_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "finance_provider_id" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suppliers_kind_idx" ON "suppliers" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "suppliers_legal_name_idx" ON "suppliers" USING btree ("legal_name");--> statement-breakpoint
CREATE INDEX "suppliers_active_idx" ON "suppliers" USING btree ("active");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vehicle_supplier_id_suppliers_id_fk" FOREIGN KEY ("vehicle_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_finance_provider_id_suppliers_id_fk" FOREIGN KEY ("finance_provider_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_vehicle_supplier_idx" ON "orders" USING btree ("vehicle_supplier_id");--> statement-breakpoint
CREATE INDEX "orders_finance_provider_idx" ON "orders" USING btree ("finance_provider_id");