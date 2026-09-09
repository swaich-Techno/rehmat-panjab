-- Additive bottle catalogue and owner-approved policy settings. Existing inventory is never updated.
create table if not exists public.packaging_boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  internal_code text unique,
  cost_paise integer check (cost_paise is null or cost_paise >= 0),
  available_quantity integer check (available_quantity is null or available_quantity >= 0),
  low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0),
  active boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bottles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  internal_code text unique,
  volume_ml numeric(6,2) not null check (volume_ml > 0),
  public_label text,
  short_description text,
  photo_path text,
  thumbnail_path text,
  alt_text text,
  material text,
  applicator_type text,
  colour text,
  dimensions text,
  empty_weight_grams numeric(8,2) check (empty_weight_grams is null or empty_weight_grams >= 0),
  packaging_box_id uuid references public.packaging_boxes(id) on delete restrict,
  packaging_cost_paise integer check (packaging_cost_paise is null or packaging_cost_paise >= 0),
  bottle_cost_paise integer check (bottle_cost_paise is null or bottle_cost_paise >= 0),
  available_packaging_quantity integer check (available_packaging_quantity is null or available_packaging_quantity >= 0),
  low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0),
  status text not null default 'inactive' check (status in ('active','inactive','archived')),
  display_order integer not null default 0,
  admin_notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_variants add column if not exists bottle_id uuid references public.bottles(id) on delete restrict;
alter table public.order_items add column if not exists bottle_snapshot jsonb;
create index if not exists product_variants_bottle_idx on public.product_variants(bottle_id);

insert into public.bottles(name,volume_ml,public_label,status,display_order)
select distinct size_ml::text || ' ml', size_ml, size_ml::text || ' ml', 'active', size_ml::integer
from public.product_variants
where size_ml in (6,12)
  and not exists(select 1 from public.bottles b where b.volume_ml=product_variants.size_ml and b.archived_at is null);

update public.product_variants v set bottle_id=b.id
from public.bottles b
where v.bottle_id is null and v.size_ml=b.volume_ml and b.status='active' and b.archived_at is null;

create or replace function public.snapshot_order_item_bottle() returns trigger language plpgsql security definer set search_path=public as $$
declare bottle_row public.bottles;
begin
  if new.bottle_snapshot is null then
    select b.* into bottle_row from public.product_variants v join public.bottles b on b.id=v.bottle_id where v.id=new.variant_id;
    if found then new.bottle_snapshot=jsonb_build_object('id',bottle_row.id,'name',bottle_row.name,'volume_ml',bottle_row.volume_ml,'public_label',bottle_row.public_label,'applicator_type',bottle_row.applicator_type); end if;
  end if;
  return new;
end; $$;
drop trigger if exists order_item_bottle_snapshot on public.order_items;
create trigger order_item_bottle_snapshot before insert on public.order_items for each row execute function public.snapshot_order_item_bottle();

create or replace function public.prevent_bottle_delete() returns trigger language plpgsql as $$
begin raise exception 'Bottle records must be archived, not deleted'; end; $$;
drop trigger if exists bottles_archive_only on public.bottles;
create trigger bottles_archive_only before delete on public.bottles for each row execute function public.prevent_bottle_delete();

alter table public.packaging_boxes enable row level security;
alter table public.bottles enable row level security;
create policy "public reads active bottles" on public.bottles for select using (status='active' and archived_at is null or public.is_admin());
create policy "super admins insert bottles" on public.bottles for insert with check (public.is_super_admin());
create policy "super admins update bottles" on public.bottles for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super admins manage packaging boxes" on public.packaging_boxes for all using (public.is_super_admin()) with check (public.is_super_admin());

create table if not exists public.store_policy_settings (
  id boolean primary key default true check (id),
  merchant jsonb not null default '{}'::jsonb,
  shipping jsonb not null default '{}'::jsonb,
  cancellation jsonb not null default '{}'::jsonb,
  returns jsonb not null default '{}'::jsonb,
  privacy jsonb not null default '{}'::jsonb,
  terms jsonb not null default '{}'::jsonb,
  publish_status text not null default 'draft' check (publish_status in ('draft','published')),
  owner_approved_at timestamptz,
  admin_notes text,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.store_policy_settings(id,merchant) values(true,'{"businessName":"Rehmat Panjab","supportPhone":"+91 70094 64475"}'::jsonb) on conflict(id) do nothing;
alter table public.store_policy_settings enable row level security;
create policy "super admins read policy settings" on public.store_policy_settings for select using (public.is_super_admin());
create policy "super admins update policy settings" on public.store_policy_settings for update using (public.is_super_admin()) with check (public.is_super_admin());

create or replace view public.public_store_policy_settings with (security_invoker=false) as
select id,merchant,shipping,cancellation,returns,privacy,terms,updated_at
from public.store_policy_settings where publish_status='published' and owner_approved_at is not null;
revoke all on public.public_store_policy_settings from public;
grant select on public.public_store_policy_settings to anon,authenticated;

