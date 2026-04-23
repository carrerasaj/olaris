CREATE TYPE "public"."supplier_po_status" AS ENUM('draft', 'sent', 'acknowledged', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier_po.created';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier_po.updated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier_po.sent';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier_po.acknowledged';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier_po.cancelled';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier_po.snapshot_refreshed';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier_po.superseded_by';--> statement-breakpoint
CREATE TABLE "supplier_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"order_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"status" "supplier_po_status" DEFAULT 'draft' NOT NULL,
	"vehicle" jsonb NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"delivery" jsonb NOT NULL,
	"purchase_net_pence" integer DEFAULT 0 NOT NULL,
	"purchase_vat_rate" integer DEFAULT 20 NOT NULL,
	"purchase_vat_pence" integer DEFAULT 0 NOT NULL,
	"purchase_gross_pence" integer DEFAULT 0 NOT NULL,
	"delivery_fee_pence" integer DEFAULT 0 NOT NULL,
	"on_road_pence" integer DEFAULT 0 NOT NULL,
	"purchase_total_pence" integer DEFAULT 0 NOT NULL,
	"customer_total_snapshot_pence" integer,
	"margin_adjustment_pence" integer DEFAULT 0 NOT NULL,
	"margin_adjustment_note" text,
	"margin_pence" integer,
	"margin_bps" integer,
	"supplier_po_ref_received" text,
	"supplier_eta_date" text,
	"supplier_invoice_ref" text,
	"notes_to_supplier" text,
	"internal_notes" text,
	"pdf_blob_url" text,
	"pdf_sha256" text,
	"sent_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_orders_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_orders_ref_idx" ON "supplier_orders" USING btree ("ref");--> statement-breakpoint
CREATE INDEX "supplier_orders_order_idx" ON "supplier_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "supplier_orders_supplier_idx" ON "supplier_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_orders_status_idx" ON "supplier_orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_orders_one_active_per_order" ON "supplier_orders" USING btree ("order_id") WHERE status <> 'cancelled';