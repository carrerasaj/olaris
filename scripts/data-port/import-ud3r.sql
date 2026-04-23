-- Selective port of order OL-2026-04-UD3R (id=t1RfCNXumpH3NRugyMPEL) from local dev → Neon prod.
-- Generated 2026-04-23T08:02:30.123Z
--
-- User ID remap applied (local → neon):
--   nt4WMY35MB2ThJ3t63NcW (alan@olaris.co.uk) → 0aRomlJtwd-gJw2sMB6Ap
--
-- NOTE: customer + company rows OMITTED (--skip-customer-company flag).
--
-- Run inside a transaction; any error rolls the whole thing back.

BEGIN;

-- ═══ companies (SKIPPED) ═══

-- ═══ customers (SKIPPED) ═══

-- ═══ orders ═══
INSERT INTO public.orders ("id", "ref", "customer_id", "company_id", "status", "customer_type", "finance_type", "vehicle", "options", "delivery", "pricing", "finance", "addons", "part_exchange", "consent", "notes", "total_amount_pence", "monthly_amount_pence", "created_by", "sent_at", "signed_at", "delivered_at", "cancelled_at", "created_at", "updated_at") VALUES ('t1RfCNXumpH3NRugyMPEL', 'OL-2026-04-UD3R', 'zKYsuJiYtl5NXG70ur4x9', '6oUo3JvR66R7BC--RAv4a', 'sent', 'business', 'HP', '{"co2":0,"fuel":"Diesel","make":"Renault","trim":"matching","model":"Traffic","colour":"Slate Grey","category":"Commercial Van","derivative":"LL30 Blue dCi 170 Auto Graphite Edition LWB Panel Van","registration":"Pre-registered","transmission":"Automatic"}'::jsonb, '[]'::jsonb, '{"city":"Oxfodshire","notes":"","method":"Driven to address","address":"5 Bear Close, Woodstock","contact":"","postcode":"OX20 1JS","contactPhone":"07880 757081","preferredDate":"2026-07-31"}'::jsonb, '{"vatRate":20,"vedPence":36000,"discountPence":0,"vehicleNetPence":2973000,"deliveryFeePence":0,"firstRegFeePence":5500,"numberPlatesPence":0}'::jsonb, '{"term":48,"balloonPence":0,"annualMileage":10000,"initialRental":6,"monthlyNetPence":0}'::jsonb, '{"gap":false,"breakdown":false,"tyreCover":false,"maintenance":false,"gapTotalPence":0,"tyreMonthlyPence":0,"breakdownMonthlyPence":0,"maintenanceMonthlyPence":0}'::jsonb, NULL, NULL, '', 3609100, 0, '0aRomlJtwd-gJw2sMB6Ap', '2026-04-22T21:07:27.407Z'::timestamptz, NULL, NULL, NULL, '2026-04-22T21:06:05.094Z'::timestamptz, '2026-04-22T21:07:27.407Z'::timestamptz);

-- ═══ signing_tokens ═══
INSERT INTO public.signing_tokens ("id", "order_id", "token", "signer_role", "expires_at", "consumed_at", "created_at") VALUES ('lGJU6bwI-y9rzV2DLY3ns', 't1RfCNXumpH3NRugyMPEL', 'daD8rGfRTD6Tqmvu2GAkuawt5FUampNU', 'customer', '2026-04-29T21:07:27.387Z'::timestamptz, NULL, '2026-04-22T21:07:27.388Z'::timestamptz);

-- ═══ otp_codes ═══
-- (no rows in otp_codes)

-- ═══ signatures ═══
-- (no rows in signatures)

-- ═══ documents ═══
-- (no rows in documents)

-- ═══ audit_events ═══
INSERT INTO public.audit_events ("id", "order_id", "customer_id", "actor_type", "actor_id", "event_type", "payload", "ip", "user_agent", "geo_city", "geo_country", "created_at") VALUES ('7avTrPivNu3U8SmhmPX9_', 't1RfCNXumpH3NRugyMPEL', 'zKYsuJiYtl5NXG70ur4x9', 'rep', '0aRomlJtwd-gJw2sMB6Ap', 'order.created', '{"ref":"OL-2026-04-UD3R","duplicatedFrom":{"id":"Y7z6fDhPkn73jUP6-A37S","ref":"OL-2026-04-YJT7"}}'::jsonb, NULL, NULL, NULL, NULL, '2026-04-22T21:06:05.098Z'::timestamptz);
INSERT INTO public.audit_events ("id", "order_id", "customer_id", "actor_type", "actor_id", "event_type", "payload", "ip", "user_agent", "geo_city", "geo_country", "created_at") VALUES ('cZIlFe7kCE0jiFrXHTGA0', 't1RfCNXumpH3NRugyMPEL', 'zKYsuJiYtl5NXG70ur4x9', 'rep', '0aRomlJtwd-gJw2sMB6Ap', 'order.sent', '{"to":"oconnor.tony@aol.com","tokenExpiresAt":"2026-04-29T21:07:27.387Z"}'::jsonb, NULL, NULL, NULL, NULL, '2026-04-22T21:07:27.412Z'::timestamptz);
INSERT INTO public.audit_events ("id", "order_id", "customer_id", "actor_type", "actor_id", "event_type", "payload", "ip", "user_agent", "geo_city", "geo_country", "created_at") VALUES ('fqMEKAMFVZZw6yyu_xNBZ', 't1RfCNXumpH3NRugyMPEL', 'zKYsuJiYtl5NXG70ur4x9', 'system', NULL, 'email.sent', '{"to":"oconnor.tony@aol.com","template":"order.sent","messageId":"cd50b3bc-02a8-4b6b-b967-b41165bc1514"}'::jsonb, NULL, NULL, NULL, NULL, '2026-04-22T21:07:27.747Z'::timestamptz);

-- ═══ reminder_schedule ═══
INSERT INTO public.reminder_schedule ("id", "order_id", "scheduled_for", "kind", "sent_at", "cancelled_at", "created_at") VALUES ('IQuhPGdLVppqeaES7moNS', 't1RfCNXumpH3NRugyMPEL', '2026-04-25T21:07:27.407Z'::timestamptz, 'day_3', NULL, NULL, '2026-04-22T21:07:27.408Z'::timestamptz);
INSERT INTO public.reminder_schedule ("id", "order_id", "scheduled_for", "kind", "sent_at", "cancelled_at", "created_at") VALUES ('CJt_HIEHOW442Np8mp-QF', 't1RfCNXumpH3NRugyMPEL', '2026-04-28T21:07:27.407Z'::timestamptz, 'day_6', NULL, NULL, '2026-04-22T21:07:27.408Z'::timestamptz);

-- ═══ post-import cleanup ═══
--
-- The UD3R signing email (Resend messageId cd50b3bc) pointed at
-- http://localhost:3000/sign/daD8rGfRTD6Tqmvu2GAkuawt5FUampNU — NEXTAUTH_URL
-- at send time was dev. Tony cannot reach that URL from his machine. Mark
-- the token consumed so even if he clicks the stale link it dies cleanly;
-- admin will then "Resend link" from prod to mint a fresh one.
UPDATE public.signing_tokens
SET consumed_at = now()
WHERE id = 'lGJU6bwI-y9rzV2DLY3ns';

INSERT INTO public.audit_events (
  "id", "order_id", "customer_id",
  "actor_type", "actor_id",
  "event_type", "payload",
  "created_at"
) VALUES (
  gen_random_uuid()::text,
  't1RfCNXumpH3NRugyMPEL',
  'zKYsuJiYtl5NXG70ur4x9',
  'system', NULL,
  'order.updated',
  '{
    "kind": "token_invalidated_by_migration",
    "reason": "Original signing email pointed at http://localhost:3000 (dev NEXTAUTH_URL). Token invalidated to force a fresh send from prod.",
    "original_token_id": "lGJU6bwI-y9rzV2DLY3ns",
    "original_email_message_id": "cd50b3bc-02a8-4b6b-b967-b41165bc1514"
  }'::jsonb,
  now()
);

-- Rename the original test order so it's unambiguous in the admin list.
-- The ref is human-facing; the DB id stays the same so FK refs don't
-- break. The signature was never a legitimate customer sig anyway (the
-- migration note from the earlier import already documents that) — a ref
-- change here is cosmetic and audit-logged below.
UPDATE public.orders
SET ref = 'OL-2026-04-YJT7-TEST', updated_at = now()
WHERE id = 'Y7z6fDhPkn73jUP6-A37S';

INSERT INTO public.audit_events (
  "id", "order_id", "customer_id",
  "actor_type", "actor_id",
  "event_type", "payload",
  "created_at"
) VALUES (
  gen_random_uuid()::text,
  'Y7z6fDhPkn73jUP6-A37S',
  'zKYsuJiYtl5NXG70ur4x9',
  'system', NULL,
  'order.updated',
  '{
    "kind": "renamed",
    "old_ref": "OL-2026-04-YJT7",
    "new_ref": "OL-2026-04-YJT7-TEST",
    "reason": "Marked as system-test record post-migration."
  }'::jsonb,
  now()
);

COMMIT;

