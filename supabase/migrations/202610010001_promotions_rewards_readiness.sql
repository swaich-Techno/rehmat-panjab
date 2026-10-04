-- Additive promotion, rewards and checkout-readiness release.
-- Does not enable Razorpay or alter existing approved prices/inventory.
begin;

alter table public.orders
  add column if not exists promotion_kind text,
  add column if not exists promotion_label text,
  add column if not exists reward_variant_id uuid references public.product_variants(id),
  add column if not exists reward_quantity integer check(reward_quantity is null or reward_quantity > 0),
  add column if not exists payment_confirmed_at timestamptz;

alter table public.order_items
  add column if not exists list_price_paise integer check(list_price_paise is null or list_price_paise >= 0),
  add column if not exists promotion_kind text,
  add column if not exists promotion_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.promotion_campaigns(
  id text primary key,
  internal_name text not null,
  public_label text not null,
  timezone text not null default 'Asia/Kolkata',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  tiers jsonb not null check(jsonb_typeof(tiers)='array'),
  max_discount_paise integer not null check(max_discount_paise > 0),
  active boolean not null default false,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(ends_at > starts_at)
);

insert into public.promotion_campaigns(id,internal_name,public_label,timezone,starts_at,ends_at,tiers,max_discount_paise,active)
values(
  'navratri-dussehra-2026',
  'Navratri & Dussehra Festival Offer',
  'Save up to 30% during our Navratri & Dussehra celebration.',
  'Asia/Kolkata',
  '2026-10-09 00:00:00+05:30',
  '2026-10-23 23:59:59+05:30',
  '[{"minimumPaise":99900,"maximumPaise":149899,"percent":10},{"minimumPaise":149900,"maximumPaise":249899,"percent":20},{"minimumPaise":249900,"maximumPaise":null,"percent":30}]'::jsonb,
  90000,
  true
)
on conflict(id) do nothing;

create table if not exists public.reward_settings(
  id boolean primary key default true check(id),
  stamps_required integer not null default 10 check(stamps_required=10),
  hamper_sku text,
  hamper_description text,
  hamper_image_path text,
  hamper_inventory integer check(hamper_inventory is null or hamper_inventory >= 0),
  validity_days integer check(validity_days is null or validity_days > 0),
  shipping_rule text,
  redemption_enabled boolean not null default false,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  check(not redemption_enabled or (hamper_sku is not null and hamper_description is not null and hamper_image_path is not null and hamper_inventory > 0 and validity_days > 0 and shipping_rule is not null))
);
insert into public.reward_settings(id) values(true) on conflict(id) do nothing;

create table if not exists public.reward_stamp_ledger(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete restrict,
  whatsapp_confirmation_id uuid references public.whatsapp_order_confirmations(id) on delete restrict,
  entry_kind text not null check(entry_kind in ('earned','reversal','admin_adjustment')),
  stamps integer not null check(stamps between -9 and 9 and stamps <> 0),
  reason text not null,
  actor_id uuid references public.profiles(id),
  reversal_of uuid references public.reward_stamp_ledger(id),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  check((order_id is not null)::integer + (whatsapp_confirmation_id is not null)::integer <= 1)
);
create index if not exists reward_stamp_ledger_user_idx on public.reward_stamp_ledger(user_id,created_at desc);

create table if not exists public.reward_entitlements(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_number integer not null check(cycle_number > 0),
  reward_name text not null default 'Complimentary Rehmat Gift Hamper',
  status text not null default 'available' check(status in ('available','claimed','fulfilled','expired','reversed')),
  trigger_ledger_id uuid not null unique references public.reward_stamp_ledger(id),
  settings_snapshot jsonb not null default '{}'::jsonb,
  earned_at timestamptz not null default now(),
  expires_at timestamptz,
  claimed_at timestamptz,
  fulfilled_at timestamptz,
  reversed_at timestamptz,
  fulfilled_by uuid references public.profiles(id),
  unique(user_id,cycle_number)
);

create table if not exists public.reward_adjustment_reviews(
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  reason text not null,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  refund_amount_paise integer not null check(refund_amount_paise > 0),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id,refund_amount_paise)
);

alter table public.whatsapp_order_confirmations
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists delivered_at timestamptz;

create table if not exists public.checkout_rate_limits(
  bucket_key text primary key,
  attempt_count integer not null default 1,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.register_checkout_attempt(p_bucket_key text,p_limit integer default 8,p_window_seconds integer default 600)
returns boolean language plpgsql security definer set search_path=public as $$
declare allowed boolean;
begin
  insert into public.checkout_rate_limits(bucket_key,attempt_count,window_started_at,updated_at)
  values(p_bucket_key,1,now(),now())
  on conflict(bucket_key) do update set
    attempt_count=case when public.checkout_rate_limits.window_started_at < now()-make_interval(secs=>p_window_seconds) then 1 else public.checkout_rate_limits.attempt_count+1 end,
    window_started_at=case when public.checkout_rate_limits.window_started_at < now()-make_interval(secs=>p_window_seconds) then now() else public.checkout_rate_limits.window_started_at end,
    updated_at=now();
  select attempt_count<=p_limit into allowed from public.checkout_rate_limits where bucket_key=p_bucket_key;
  return coalesce(allowed,false);
end; $$;
revoke all on function public.register_checkout_attempt(text,integer,integer) from public,anon,authenticated;
grant execute on function public.register_checkout_attempt(text,integer,integer) to service_role;

create or replace function public.reward_create_entitlement(p_user_id uuid,p_trigger_ledger_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare stamp_total integer; cycle integer; settings_row public.reward_settings%rowtype;
begin
  select coalesce(sum(stamps),0) into stamp_total from public.reward_stamp_ledger where user_id=p_user_id;
  if stamp_total < 10 or stamp_total % 10 <> 0 then return; end if;
  cycle:=stamp_total/10;
  select * into settings_row from public.reward_settings where id=true;
  insert into public.reward_entitlements(user_id,cycle_number,trigger_ledger_id,settings_snapshot,expires_at)
  values(p_user_id,cycle,p_trigger_ledger_id,jsonb_build_object(
    'hamper_sku',settings_row.hamper_sku,'description',settings_row.hamper_description,'image_path',settings_row.hamper_image_path,
    'shipping_rule',settings_row.shipping_rule,'redemption_enabled',settings_row.redemption_enabled
  ),case when settings_row.validity_days is null then null else now()+make_interval(days=>settings_row.validity_days) end)
  on conflict(user_id,cycle_number) do nothing;
end; $$;

create or replace function public.award_reward_stamp_for_order(p_order_id uuid,p_actor_id uuid default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare target public.orders%rowtype; ledger_id uuid;
begin
  select * into target from public.orders where id=p_order_id for update;
  if target.id is null or target.user_id is null or target.status<>'delivered' or target.razorpay_payment_id is null or target.refunded_paise>0 then return false; end if;
  insert into public.reward_stamp_ledger(user_id,order_id,entry_kind,stamps,reason,actor_id,idempotency_key)
  values(target.user_id,target.id,'earned',1,'Verified paid and delivered online order',p_actor_id,'order:'||target.id::text||':earned')
  on conflict(idempotency_key) do nothing returning id into ledger_id;
  if ledger_id is null then return false; end if;
  perform public.reward_create_entitlement(target.user_id,ledger_id);
  return true;
end; $$;

create or replace function public.reverse_reward_stamp_for_order(p_order_id uuid,p_reason text,p_actor_id uuid default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare earned public.reward_stamp_ledger%rowtype; reversal_id uuid;
begin
  select * into earned from public.reward_stamp_ledger where order_id=p_order_id and entry_kind='earned' order by created_at limit 1;
  if earned.id is null then return false; end if;
  insert into public.reward_stamp_ledger(user_id,order_id,entry_kind,stamps,reason,actor_id,reversal_of,idempotency_key)
  values(earned.user_id,p_order_id,'reversal',-1,p_reason,p_actor_id,earned.id,'order:'||p_order_id::text||':reversal')
  on conflict(idempotency_key) do nothing returning id into reversal_id;
  if reversal_id is null then return false; end if;
  update public.reward_entitlements set status='reversed',reversed_at=now()
  where trigger_ledger_id=earned.id and status in ('available','claimed');
  return true;
end; $$;

create or replace function public.award_reward_stamp_for_whatsapp(p_confirmation_id uuid,p_actor_id uuid default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare target public.whatsapp_order_confirmations%rowtype; ledger_id uuid;
begin
  select * into target from public.whatsapp_order_confirmations where id=p_confirmation_id for update;
  if target.id is null or target.user_id is null or target.status<>'confirmed' or target.payment_confirmed_at is null or target.delivered_at is null then return false; end if;
  insert into public.reward_stamp_ledger(user_id,whatsapp_confirmation_id,entry_kind,stamps,reason,actor_id,idempotency_key)
  values(target.user_id,target.id,'earned',1,'Admin-verified paid and delivered WhatsApp order',p_actor_id,'whatsapp:'||target.id::text||':earned')
  on conflict(idempotency_key) do nothing returning id into ledger_id;
  if ledger_id is null then return false; end if;
  perform public.reward_create_entitlement(target.user_id,ledger_id);
  return true;
end; $$;

create or replace function public.reward_order_status_trigger() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.status='delivered' and old.status is distinct from new.status then perform public.award_reward_stamp_for_order(new.id,null); end if;
  if new.status in ('cancelled','refunded') and old.status is distinct from new.status then perform public.reverse_reward_stamp_for_order(new.id,'Order '||new.status,null); end if;
  return new;
end; $$;
drop trigger if exists reward_order_status on public.orders;
create trigger reward_order_status after update of status on public.orders for each row execute function public.reward_order_status_trigger();

revoke all on function public.reward_create_entitlement(uuid,uuid) from public,anon,authenticated;
revoke all on function public.award_reward_stamp_for_order(uuid,uuid) from public,anon,authenticated;
revoke all on function public.reverse_reward_stamp_for_order(uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.award_reward_stamp_for_whatsapp(uuid,uuid) from public,anon,authenticated;
grant execute on function public.award_reward_stamp_for_order(uuid,uuid) to service_role;
grant execute on function public.reverse_reward_stamp_for_order(uuid,text,uuid) to service_role;
grant execute on function public.award_reward_stamp_for_whatsapp(uuid,uuid) to service_role;

create or replace function public.complete_razorpay_order(p_razorpay_order_id text,p_razorpay_payment_id text)
returns integer language plpgsql security definer set search_path=public as $$
declare target_order public.orders%rowtype; item record; remaining integer:=null; item_remaining integer;
begin
  select * into target_order from public.orders where razorpay_order_id=p_razorpay_order_id for update;
  if target_order.id is null then raise exception 'order_not_found'; end if;
  if target_order.status='paid' then
    if target_order.razorpay_payment_id is distinct from p_razorpay_payment_id then raise exception 'payment_mismatch'; end if;
    select min(stock.quantity-stock.reserved) into remaining from public.order_items oi join public.inventory stock on stock.variant_id=oi.variant_id where oi.order_id=target_order.id;
    return remaining;
  end if;
  for item in select variant_id,quantity from public.order_items where order_id=target_order.id loop
    update public.inventory set quantity=quantity-item.quantity,updated_at=now()
    where variant_id=item.variant_id and quantity-reserved>=item.quantity returning quantity-reserved into item_remaining;
    if not found then raise exception 'insufficient_stock'; end if;
    remaining:=least(coalesce(remaining,item_remaining),item_remaining);
  end loop;
  update public.orders set status='paid',razorpay_payment_id=p_razorpay_payment_id,payment_confirmed_at=coalesce(payment_confirmed_at,now()),updated_at=now() where id=target_order.id;
  return remaining;
end; $$;
revoke all on function public.complete_razorpay_order(text,text) from public,anon,authenticated;
grant execute on function public.complete_razorpay_order(text,text) to service_role;

create or replace function public.reward_ledger_immutable() returns trigger language plpgsql as $$
begin raise exception 'Reward stamp ledger entries are immutable'; end; $$;
drop trigger if exists reward_stamp_ledger_immutable on public.reward_stamp_ledger;
create trigger reward_stamp_ledger_immutable before update or delete on public.reward_stamp_ledger for each row execute function public.reward_ledger_immutable();

create or replace function public.enforce_distinct_three_ml_tester_cart() returns trigger
language plpgsql set search_path=public as $$
declare valid_count integer;
begin
  if new.kind<>'tester-pack' then return new; end if;
  select count(*) into valid_count from public.product_variants
  where id=any(new.tester_variant_ids) and size_ml=3 and enabled and status='active' and tester_pack_eligible;
  if valid_count<>new.tester_pack_size then raise exception 'tester_pack_requires_distinct_active_three_ml_variants'; end if;
  return new;
end; $$;
drop trigger if exists enforce_distinct_three_ml_tester_cart on public.customer_cart_items;
create trigger enforce_distinct_three_ml_tester_cart before insert or update on public.customer_cart_items for each row execute function public.enforce_distinct_three_ml_tester_cart();

alter table public.promotion_campaigns enable row level security;
alter table public.reward_settings enable row level security;
alter table public.reward_stamp_ledger enable row level security;
alter table public.reward_entitlements enable row level security;
alter table public.reward_adjustment_reviews enable row level security;
alter table public.checkout_rate_limits enable row level security;

create policy "super admins manage promotion campaigns" on public.promotion_campaigns for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "customers read own reward stamps" on public.reward_stamp_ledger for select using(user_id=auth.uid() or public.is_admin());
create policy "customers read own reward entitlements" on public.reward_entitlements for select using(user_id=auth.uid() or public.is_admin());
create policy "super admins manage reward entitlements" on public.reward_entitlements for update using(public.is_super_admin()) with check(public.is_super_admin());
create policy "super admins manage reward settings" on public.reward_settings for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "super admins read reward reviews" on public.reward_adjustment_reviews for select using(public.is_super_admin());
create policy "super admins update reward reviews" on public.reward_adjustment_reviews for update using(public.is_super_admin()) with check(public.is_super_admin());

do $$
declare missing_count integer;
begin
  select count(*) into missing_count from public.products product
  where product.status='active' and exists(
    -- Every published fragrance must retain its approved core bottle sizes.
    -- A 3 ml tester is optional until its separate content, packaging and margin
    -- approvals are complete, so it must not block this additive release.
    select 1 from (values(6),(12)) required(size_ml)
    where not exists(
      select 1 from public.product_variants variant join public.inventory stock on stock.variant_id=variant.id
      where variant.product_id=product.id and variant.size_ml=required.size_ml and variant.enabled and variant.status='active'
        and variant.price_paise is not null and stock.quantity>=stock.reserved
    )
  );
  if missing_count<>0 then raise exception '% published products are missing an approved 6 ml or 12 ml variant',missing_count; end if;
end $$;

commit;
