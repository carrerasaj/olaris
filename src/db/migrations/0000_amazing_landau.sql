CREATE TYPE "public"."activity_kind" AS ENUM('note', 'call', 'email', 'meeting', 'task');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('rep', 'customer', 'system');--> statement-breakpoint
CREATE TYPE "public"."audit_event_type" AS ENUM('order.created', 'order.updated', 'order.sent', 'order.cancelled', 'link.viewed', 'otp.requested', 'otp.verified', 'otp.failed', 'signed', 'sign.declined', 'pdf.generated', 'pdf.downloaded', 'reminder.sent', 'email.sent', 'email.failed');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('business', 'personal');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('id', 'proof_of_address', 'proof_of_income', 'signed_order_pdf', 'other');--> statement-breakpoint
CREATE TYPE "public"."finance_type" AS ENUM('BCH', 'PCH', 'FL', 'HP', 'CP', 'OP');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'sent', 'partially_signed', 'signed', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."otp_method" AS ENUM('email');--> statement-breakpoint
CREATE TYPE "public"."signature_type" AS ENUM('typed', 'drawn');--> statement-breakpoint
CREATE TYPE "public"."signer_role" AS ENUM('customer', 'rep');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"order_id" text,
	"kind" "activity_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"customer_id" text,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" text,
	"event_type" "audit_event_type" NOT NULL,
	"payload" jsonb,
	"ip" text,
	"user_agent" text,
	"geo_city" text,
	"geo_country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"companies_house_number" text,
	"vat_number" text,
	"billing_address" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "customer_type" DEFAULT 'business' NOT NULL,
	"salutation" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"dob" text,
	"position" text,
	"company_id" text,
	"billing_address" jsonb,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"customer_id" text,
	"kind" "document_kind" NOT NULL,
	"filename" text NOT NULL,
	"blob_url" text NOT NULL,
	"sha256" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"customer_id" text NOT NULL,
	"company_id" text,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"customer_type" "customer_type" DEFAULT 'business' NOT NULL,
	"finance_type" "finance_type" DEFAULT 'BCH' NOT NULL,
	"vehicle" jsonb NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"delivery" jsonb NOT NULL,
	"pricing" jsonb NOT NULL,
	"finance" jsonb NOT NULL,
	"addons" jsonb NOT NULL,
	"part_exchange" jsonb,
	"consent" jsonb,
	"notes" text,
	"total_amount_pence" integer DEFAULT 0 NOT NULL,
	"monthly_amount_pence" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"sent_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"signing_token_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"sent_to_email" text NOT NULL,
	"method" "otp_method" DEFAULT 'email' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"signer_role" "signer_role" NOT NULL,
	"signer_name" text NOT NULL,
	"signer_email" text NOT NULL,
	"signature_type" "signature_type" NOT NULL,
	"signature_data" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"user_agent" text,
	"geo_city" text,
	"geo_country" text,
	"otp_method" "otp_method",
	"otp_verified_at" timestamp with time zone,
	"document_sha256" text NOT NULL,
	"server_signature" text NOT NULL,
	"signing_key_fingerprint" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signing_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"token" text NOT NULL,
	"signer_role" "signer_role" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signing_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_signing_token_id_signing_tokens_id_fk" FOREIGN KEY ("signing_token_id") REFERENCES "public"."signing_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedule" ADD CONSTRAINT "reminder_schedule_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signing_tokens" ADD CONSTRAINT "signing_tokens_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_customer_idx" ON "activities" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "activities_order_idx" ON "activities" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "activities_due_date_idx" ON "activities" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "audit_events_order_idx" ON "audit_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "audit_events_customer_idx" ON "audit_events" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "audit_events_event_type_idx" ON "audit_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "companies_name_idx" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_last_name_idx" ON "customers" USING btree ("last_name");--> statement-breakpoint
CREATE INDEX "documents_order_idx" ON "documents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "documents_customer_idx" ON "documents" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "documents_kind_idx" ON "documents" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_ref_idx" ON "orders" USING btree ("ref");--> statement-breakpoint
CREATE INDEX "otp_codes_token_idx" ON "otp_codes" USING btree ("signing_token_id");--> statement-breakpoint
CREATE INDEX "reminder_schedule_scheduled_idx" ON "reminder_schedule" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "reminder_schedule_order_idx" ON "reminder_schedule" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "signatures_order_idx" ON "signatures" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "signatures_unique_role_per_order" ON "signatures" USING btree ("order_id","signer_role");--> statement-breakpoint
CREATE UNIQUE INDEX "signing_tokens_token_idx" ON "signing_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "signing_tokens_order_idx" ON "signing_tokens" USING btree ("order_id");