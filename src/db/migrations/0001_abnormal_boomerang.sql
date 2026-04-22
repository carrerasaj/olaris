ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer.created' BEFORE 'order.created';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'customer.updated' BEFORE 'order.created';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'order.delivered' BEFORE 'link.viewed';