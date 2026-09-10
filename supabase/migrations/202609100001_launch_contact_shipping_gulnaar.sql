-- Focused launch corrections. Additive schema only; existing variants, inventory, reviews and order rows are not rewritten.

create table if not exists public.product_slug_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  old_slug text not null unique,
  new_slug text not null,
  changed_at timestamptz not null default now()
);
alter table public.product_slug_history enable row level security;
drop policy if exists "public reads product redirects" on public.product_slug_history;
create policy "public reads product redirects" on public.product_slug_history for select using(true);
drop policy if exists "super admins manage product redirects" on public.product_slug_history;
create policy "super admins manage product redirects" on public.product_slug_history for all using(public.is_super_admin()) with check(public.is_super_admin());
grant select on public.product_slug_history to anon,authenticated;

insert into public.product_slug_history(product_id,old_slug,new_slug)
select id,'zara-candy','gulnaar' from public.products where slug='zara-candy'
on conflict(old_slug) do update set product_id=excluded.product_id,new_slug=excluded.new_slug;

update public.products set
  name='GULNAAR',slug='gulnaar',
  short_description='Sweet memories, bottled.',
  description='GULNAAR is a bright, sweet perfume oil with a playful blend of candied pear, strawberry and soft vanilla. Inspired by the scent direction of Zara Candy, it balances fruity sweetness with a smooth, comforting finish.',
  inspiration_line='Inspired by Zara Candy',search_aliases=array['Zara Candy'],
  image_path='/images/bottles/rose-gold-bottle-oil.webp',campaign_image_path='/images/bottles/rose-gold-bottle-oil.webp',
  og_image_path='/images/bottles/rose-gold-bottle-social.webp',image_alt_text='GULNAAR perfume oil by Rehmat Panjab',
  seo_title='GULNAAR perfume oil',seo_description='GULNAAR concentrated perfume oil by Rehmat Panjab, inspired by the scent direction of Zara Candy.',updated_at=now()
where slug='zara-candy';

-- Archive obsolete public media relationships without deleting them, then assign the controlled clean bottle composition.
update public.product_media set status='archived',archived_at=now(),updated_at=now()
where product_id=(select id from public.products where slug='gulnaar') and status='active'
  and (alt_text ilike '%Zara Candy%' or storage_path ilike '%zara-candy%');

with media(role,path,sort_order) as (values
  ('product','/images/bottles/rose-gold-bottle-oil.webp',0),
  ('card','/images/bottles/rose-gold-bottle-oil.webp',10),
  ('hero','/images/bottles/rose-gold-bottle-oil.webp',20),
  ('mood','/images/bottles/rose-gold-bottle-oil.webp',30),
  ('social','/images/bottles/rose-gold-bottle-social.webp',40)
)
insert into public.product_media(product_id,role,storage_path,alt_text,is_generated,status,sort_order)
select p.id,m.role,m.path,'GULNAAR perfume oil by Rehmat Panjab',true,'active',m.sort_order from media m cross join public.products p where p.slug='gulnaar'
on conflict(product_id,role) where status='active' do update set storage_path=excluded.storage_path,alt_text=excluded.alt_text,is_generated=true,sort_order=excluded.sort_order,updated_at=now();

alter table public.order_items add column if not exists product_name_snapshot text;
create or replace function public.snapshot_order_item_product_name() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.product_name_snapshot is null then select p.name into new.product_name_snapshot from public.product_variants v join public.products p on p.id=v.product_id where v.id=new.variant_id; end if;
  return new;
end; $$;
drop trigger if exists order_item_product_name_snapshot on public.order_items;
create trigger order_item_product_name_snapshot before insert on public.order_items for each row execute function public.snapshot_order_item_product_name();

create table if not exists public.local_delivery_settings (
  id boolean primary key default true check(id),
  auto_eligibility_enabled boolean not null default false,
  manual_confirmation_enabled boolean not null default true,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.local_delivery_settings(id,auto_eligibility_enabled,manual_confirmation_enabled) values(true,false,true) on conflict(id) do nothing;
create table if not exists public.local_delivery_pincodes (
  id uuid primary key default gen_random_uuid(),
  pin_code text not null unique check(pin_code ~ '^[0-9]{6}$'),
  active boolean not null default true,
  label text,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.local_delivery_settings enable row level security;
alter table public.local_delivery_pincodes enable row level security;
drop policy if exists "super admins manage local delivery settings" on public.local_delivery_settings;
create policy "super admins manage local delivery settings" on public.local_delivery_settings for all using(public.is_super_admin()) with check(public.is_super_admin());
drop policy if exists "super admins manage local delivery pincodes" on public.local_delivery_pincodes;
create policy "super admins manage local delivery pincodes" on public.local_delivery_pincodes for all using(public.is_super_admin()) with check(public.is_super_admin());

alter table public.orders add column if not exists delivery_method text;
alter table public.orders add column if not exists delivery_snapshot jsonb;

create table if not exists public.provider_readiness (
  provider text primary key check(provider in ('razorpay','shiprocket')),
  status text not null default 'pending' check(status in ('pending','verified','blocked')),
  checklist jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
alter table public.provider_readiness enable row level security;
drop policy if exists "super admins manage provider readiness" on public.provider_readiness;
create policy "super admins manage provider readiness" on public.provider_readiness for all using(public.is_super_admin()) with check(public.is_super_admin());
insert into public.provider_readiness(provider,status,checklist) values
  ('razorpay','pending','{"razorpay_kyc_approved":false,"razorpay_live_credentials":false,"razorpay_webhook_configured":false,"razorpay_webhook_verified":false,"razorpay_live_payment":false,"razorpay_order_recorded":false,"razorpay_inventory_verified":false,"razorpay_refund_reviewed":false,"order_email_tested":false}'::jsonb),
  ('shiprocket','pending','{"shiprocket_kyc_approved":false,"shiprocket_pickup_approved":false,"shiprocket_rates_verified":false,"shiprocket_shipment_tested":false,"shiprocket_tracking_tested":false}'::jsonb)
on conflict(provider) do update set status='pending',checklist=excluded.checklist,updated_at=now();

update public.experience_settings set whatsapp_number='917009466475',updated_at=now() where id=true;

update public.store_policy_settings set
  merchant=jsonb_set(jsonb_set(merchant,'{supportPhone}','"+91 70094 66475"'::jsonb),'{supportEmail}','"support@rehmatpanjab.com"'::jsonb),
  shipping=shipping || jsonb_build_object(
    'shippingRegions','India only','dispatchTime','1–2 business days','estimatedDeliveryTime','3–7 business days after dispatch',
    'shippingCharge','Calculated and disclosed before payment or manual order confirmation for eligible merchandise subtotals below ₹1,500',
    'freeShippingThreshold','Eligible merchandise subtotal after product discounts and coupons of ₹1,500 or more, excluding shipping',
    'courierMethod','Courier delivery is arranged manually while shipping-platform onboarding remains incomplete',
    'addressChangeRules','Within 12 hours of ordering and before dispatch',
    'localDelivery','Free local delivery may be available for eligible addresses in and around Khanna and Samrala after exact approved PIN-code or manual confirmation'
  ),
  privacy=jsonb_set(privacy,'{razorpayInvolvement}','"Online payment processing is not currently active"'::jsonb),
  terms=terms || jsonb_build_object(
    'paymentConfirmation','Online checkout is inactive; Cash on Delivery is unavailable; WhatsApp order requests require manual confirmation',
    'couponsDiscounts','NEW gives eligible first-time customers 15% off eligible merchandise, excludes shipping, and is consumed only after a successfully completed purchase',
    'inspirationDisclaimer','References to inspiration fragrances describe scent direction only. Rehmat Panjab is independent and is not affiliated with, endorsed by or licensed by the owners of those fragrances.',
    'contactDetails','support@rehmatpanjab.com · +91 70094 66475 · 10:00 AM–7:00 PM IST, Monday–Sunday',
    'lastUpdatedDate','2026-09-10'
  ),
  policy_version='2026-09-10.1',policy_effective_date='2026-09-10',publish_status='draft',owner_approved_at=null,publish_confirmed_at=null,
  support_phone_confirmed_at=now(),support_email_verified_at=null,shipping_calculation_verified_at=now(),courier_configuration_verified_at=null,
  admin_notes='Contact, shipping, local delivery and provider-status corrections loaded. Mailbox send-and-receive test and visual policy approval remain required before publication.',updated_at=now()
where id=true;

insert into public.store_policy_versions(version,effective_date,settings_snapshot,status)
select '2026-09-10.1','2026-09-10',jsonb_build_object('merchant',merchant,'shipping',shipping,'cancellation',cancellation,'returns',returns,'privacy',privacy,'terms',terms),'draft'
from public.store_policy_settings where id=true
on conflict(version) do update set effective_date=excluded.effective_date,settings_snapshot=excluded.settings_snapshot,status='draft',published_by=null,published_at=null;

update public.coupons set internal_name='NEW customer welcome',public_description='15% off eligible merchandise on the first successfully completed purchase',discount_type='percentage',value=15,minimum_subtotal_paise=0,max_discount_paise=null,per_customer_limit=1,first_order_only=true,minimum_quantity=1,active=true,combinable=false,free_shipping=false,revoked_at=null,archived_at=null,updated_at=now()
where upper(trim(code))='NEW';
insert into public.coupons(code,internal_name,public_description,discount_type,value,per_customer_limit,first_order_only,active,combinable,free_shipping,admin_notes)
select 'NEW','NEW customer welcome','15% off eligible merchandise on the first successfully completed purchase','percentage',15,1,true,true,false,false,'Server validated. Consume only after successful payment or confirmed manual order.'
where not exists(select 1 from public.coupons where upper(trim(code))='NEW');

create or replace view public.public_store_policy_settings with (security_invoker=false) as
select id,merchant,shipping,cancellation,returns,privacy,terms,updated_at,policy_version,policy_effective_date
from public.store_policy_settings
where publish_status='published' and owner_approved_at is not null and publish_confirmed_at is not null
  and support_email_verified_at is not null and support_phone_confirmed_at is not null
  and shipping_calculation_verified_at is not null;
revoke all on public.public_store_policy_settings from public;
grant select on public.public_store_policy_settings to anon,authenticated;
