ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.confirmed';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.on_order';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.ready_for_handover';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.cancelled_post_sign';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.eta_updated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.chassis_recorded';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.reg_recorded';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.logistics_updated';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.status_override';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'confirmed' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'on_order' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'ready_for_handover' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'cancelled_post_sign';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "on_order_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ready_for_handover_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancelled_post_sign_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "supplier_po_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "supplier_order_ref" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "chassis_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "registration_plate" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_delivery_date" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "actual_delivery_date" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "handover_location" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "handover_notes" text;