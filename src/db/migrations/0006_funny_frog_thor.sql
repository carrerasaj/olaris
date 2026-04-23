ALTER TYPE "public"."audit_event_type" ADD VALUE 'supplier_po.invoice_received';--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD COLUMN "supplier_invoice_date" text;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD COLUMN "supplier_invoice_net_pence" integer;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD COLUMN "supplier_invoice_vat_pence" integer;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD COLUMN "supplier_invoice_total_pence" integer;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD COLUMN "supplier_invoice_variance_net_pence" integer;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD COLUMN "supplier_invoice_variance_total_pence" integer;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD COLUMN "supplier_invoice_received_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD COLUMN "supplier_invoice_notes" text;