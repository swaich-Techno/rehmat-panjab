-- Razorpay readiness only. Public checkout remains disabled until controlled production verification passes.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check(status in ('request','pending','payment_pending','paid','payment_failed','fulfilment_pending','fulfilled','dispatched','delivered','cancellation_requested','cancelled','refund_pending','refunded','refund_failed'));
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists razorpay_refund_id text;
alter table public.orders add column if not exists refunded_paise integer not null default 0 check(refunded_paise>=0);
create unique index if not exists orders_order_number_idx on public.orders(order_number) where order_number is not null;

create table if not exists public.razorpay_webhook_events(
  event_id text primary key,
  event_type text not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text not null check(status in ('processing','completed','failed','ignored')),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.razorpay_webhook_events enable row level security;
drop policy if exists "super admins read razorpay webhook events" on public.razorpay_webhook_events;
create policy "super admins read razorpay webhook events" on public.razorpay_webhook_events for select using(public.is_super_admin());

create table if not exists public.razorpay_refunds(
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  payment_id text not null,
  provider_refund_id text unique,
  amount_paise integer not null check(amount_paise>0),
  idempotency_key text not null unique,
  status text not null check(status in ('pending','processed','failed')),
  approved_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.razorpay_refunds enable row level security;
drop policy if exists "super admins read razorpay refunds" on public.razorpay_refunds;
create policy "super admins read razorpay refunds" on public.razorpay_refunds for select using(public.is_super_admin());

update public.provider_readiness set status='pending',checklist=checklist || jsonb_build_object(
  'razorpay_account_activated',true,
  'razorpay_live_mode_available',true,
  'razorpay_verified_account_name','Harkirat Singh',
  'razorpay_public_brand','Rehmat Panjab',
  'razorpay_settlements_enabled',true,
  'razorpay_international_payments',false,
  'razorpay_cod',false,
  'razorpay_live_credentials',false,
  'razorpay_webhook_configured',false,
  'razorpay_webhook_verified',false,
  'razorpay_live_payment',false,
  'razorpay_refund_reviewed',false
),updated_at=now() where provider='razorpay';

update public.store_policy_settings set
  merchant=merchant || jsonb_build_object('businessName','Rehmat Panjab','legalEntityName','Harkirat Singh','businessAddress','Village Bagli Khurd, Tehsil Samrala, District Ludhiana, Punjab 141412, India','supportPhone','+91 70094 64475','supportEmail','support@rehmatpanjab.com'),
  shipping=shipping || jsonb_build_object('shippingRegions','India only','shippingCharge','Shipping charges apply below ₹1,500. Share your order request on WhatsApp and Rehmat Panjab will confirm the courier charge before payment.','freeShippingThreshold','Eligible merchandise subtotal after product discounts and coupons of ₹1,500 or more, excluding shipping','courierMethod','Manual dispatch through an available courier or local shipping vendor'),
  privacy=privacy || jsonb_build_object('razorpayInvolvement','Razorpay receives payment and transaction information necessary to process enabled online payments'),
  terms=terms || jsonb_build_object('merchantIdentity','Rehmat Panjab, operated by Harkirat Singh','paymentConfirmation','Online payments use Razorpay only after production verification; Cash on Delivery, international payments, EMI and Pay Later are unavailable','shipping','India only; free standard shipping at ₹1,500 or more after discounts; WhatsApp courier quote below ₹1,500','lastUpdatedDate','2026-09-10'),
  policy_version='2026-09-10.2',policy_effective_date='2026-09-10',publish_status='draft',owner_approved_at=null,publish_confirmed_at=null,
  admin_notes='Razorpay readiness wording prepared. Policies remain draft until mailbox and controlled payment, webhook, idempotency, order, email and refund checks pass.',updated_at=now()
where id=true;

insert into public.store_policy_versions(version,effective_date,settings_snapshot,status)
select '2026-09-10.2','2026-09-10',jsonb_build_object('merchant',merchant,'shipping',shipping,'cancellation',cancellation,'returns',returns,'privacy',privacy,'terms',terms),'draft'
from public.store_policy_settings where id=true
on conflict(version) do update set effective_date=excluded.effective_date,settings_snapshot=excluded.settings_snapshot,status='draft',published_by=null,published_at=null;
