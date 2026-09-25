-- Additive customer-account readiness. Safe to apply after the core and tester migrations.

alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists dispatched_at timestamptz,
  add column if not exists delivered_at timestamptz;

create table if not exists public.customer_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.uuid_array_is_distinct(values_to_check uuid[]) returns boolean
language sql immutable set search_path=public as $$
  select cardinality(values_to_check)=cardinality(array(select distinct unnest(values_to_check)));
$$;

create table if not exists public.customer_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.customer_carts(id) on delete cascade,
  line_key text not null,
  kind text not null default 'product' check(kind in ('product','tester-pack')),
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity integer not null check(quantity between 1 and 10),
  tester_pack_size integer check(tester_pack_size is null or tester_pack_size in (2,3,5)),
  tester_variant_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id,line_key),
  check(
    (kind='product' and variant_id is not null and tester_pack_size is null and cardinality(tester_variant_ids)=0)
    or
    (kind='tester-pack' and variant_id is null and tester_pack_size in (2,3,5)
      and cardinality(tester_variant_ids)=tester_pack_size
      and public.uuid_array_is_distinct(tester_variant_ids))
  )
);

alter table public.customer_carts enable row level security;
alter table public.customer_cart_items enable row level security;

create policy "customers manage own cart" on public.customer_carts for all
  using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "customers manage own cart items" on public.customer_cart_items for all
  using(exists(select 1 from public.customer_carts cart where cart.id=cart_id and cart.user_id=auth.uid()))
  with check(exists(select 1 from public.customer_carts cart where cart.id=cart_id and cart.user_id=auth.uid()));

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update
  using(id=auth.uid()) with check(id=auth.uid());
revoke update on public.profiles from authenticated;
grant update(display_name) on public.profiles to authenticated;

create or replace function public.claim_guest_order(p_order_id uuid) returns boolean
language plpgsql security definer set search_path=public as $$
declare
  claimed_id uuid;
  verified_email text:=lower(coalesce(auth.jwt()->>'email',''));
begin
  if auth.uid() is null or verified_email='' then return false; end if;
  update public.orders
     set user_id=auth.uid(),updated_at=now()
   where id=p_order_id
     and user_id is null
     and lower(coalesce(delivery_snapshot->>'email',''))=verified_email
  returning id into claimed_id;
  return claimed_id is not null;
end; $$;

revoke all on function public.claim_guest_order(uuid) from public;
grant execute on function public.claim_guest_order(uuid) to authenticated;
