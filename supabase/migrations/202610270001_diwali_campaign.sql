begin;

-- 1 November 2026 00:00 IST through 10 November 2026 23:59:59.999 IST.
-- ends_at is stored as the exclusive UTC boundary used by the quote query.
insert into public.automatic_discounts(
  id,internal_name,public_label,discount_type,value,max_discount_paise,
  minimum_quantity,minimum_subtotal_paise,starts_at,ends_at,active,priority,
  combinable,admin_notes,archived_at,updated_at
) values (
  'd1a1a160-2026-4d1a-8600-000000000060',
  'Diwali 2026 — automatic 60%',
  'Diwali — 60% off eligible fragrance merchandise, applied automatically.',
  'percentage',60,null,1,0,
  '2026-10-31 18:30:00+00','2026-11-10 18:30:00+00',
  true,100,false,
  'All live fragrance bottles and tester packs. Shipping and the separate ₹99 sample claim are excluded. Non-stacking; the quote service selects the highest-value eligible promotion.',
  null,now()
)
on conflict(id) do update set
  internal_name=excluded.internal_name,
  public_label=excluded.public_label,
  discount_type=excluded.discount_type,
  value=excluded.value,
  max_discount_paise=excluded.max_discount_paise,
  minimum_quantity=excluded.minimum_quantity,
  minimum_subtotal_paise=excluded.minimum_subtotal_paise,
  starts_at=excluded.starts_at,
  ends_at=excluded.ends_at,
  active=excluded.active,
  priority=excluded.priority,
  combinable=excluded.combinable,
  admin_notes=excluded.admin_notes,
  archived_at=null,
  updated_at=now();

delete from public.discount_products where discount_id='d1a1a160-2026-4d1a-8600-000000000060';
delete from public.discount_variants where discount_id='d1a1a160-2026-4d1a-8600-000000000060';

create table if not exists public.sample_campaigns(
  id text primary key,
  public_label text not null,
  price_paise integer not null check(price_paise>=0),
  total_stock integer not null check(total_stock>0),
  confirmed_claim_count integer not null default 0,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(ends_at>starts_at),
  check(confirmed_claim_count between 0 and total_stock)
);

create table if not exists public.sample_campaign_variants(
  campaign_id text not null references public.sample_campaigns(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  primary key(campaign_id,variant_id)
);

create table if not exists public.sample_campaign_claims(
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.sample_campaigns(id) on delete restrict,
  whatsapp_confirmation_id uuid not null unique references public.whatsapp_order_confirmations(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  customer_identifier text not null,
  customer_identifier_normalized text not null,
  price_paise integer not null check(price_paise>=0),
  status text not null default 'confirmed' check(status in ('confirmed','cancelled','refunded')),
  confirmed_by uuid not null references public.profiles(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists sample_campaign_one_confirmed_customer
  on public.sample_campaign_claims(campaign_id,customer_identifier_normalized)
  where status='confirmed';
create index if not exists sample_campaign_claims_status_idx
  on public.sample_campaign_claims(campaign_id,status,confirmed_at);

insert into public.sample_campaigns(id,public_label,price_paise,total_stock,starts_at,ends_at,active,updated_at)
values(
  'diwali-sample-2026',
  'Share Rehmat. Try one eligible 3 ml tester for ₹99.',
  9900,99,'2026-10-31 18:30:00+00','2026-11-10 18:30:00+00',true,now()
)
on conflict(id) do update set
  public_label=excluded.public_label,
  price_paise=excluded.price_paise,
  total_stock=excluded.total_stock,
  starts_at=excluded.starts_at,
  ends_at=excluded.ends_at,
  active=excluded.active,
  updated_at=now();

insert into public.sample_campaign_variants(campaign_id,variant_id)
select 'diwali-sample-2026',variant.id
from public.product_variants variant
join public.products product on product.id=variant.product_id
where variant.size_ml=3
  and variant.enabled
  and variant.status='active'
  and variant.tester_pack_eligible
  and product.status='active'
on conflict(campaign_id,variant_id) do nothing;

alter table public.sample_campaigns enable row level security;
alter table public.sample_campaign_variants enable row level security;
alter table public.sample_campaign_claims enable row level security;

create policy "sample campaigns super admin" on public.sample_campaigns
  for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "sample campaign variants super admin" on public.sample_campaign_variants
  for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "sample campaign claims super admin" on public.sample_campaign_claims
  for all using(public.is_super_admin()) with check(public.is_super_admin());

create or replace function public.confirm_sample_campaign_claim(
  p_campaign_id text,
  p_whatsapp_confirmation_id uuid,
  p_customer_identifier text,
  p_variant_id uuid,
  p_actor_id uuid
) returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  target_campaign public.sample_campaigns%rowtype;
  target_confirmation public.whatsapp_order_confirmations%rowtype;
  normalized_identifier text;
  identifier_digits text;
  confirmed_count integer;
  affected integer;
begin
  if position('@' in p_customer_identifier)>0 then
    normalized_identifier:=lower(regexp_replace(trim(p_customer_identifier),'\s+','','g'));
  else
    identifier_digits:=regexp_replace(p_customer_identifier,'\D','','g');
    normalized_identifier:=case when length(identifier_digits)>10 then right(identifier_digits,10) else identifier_digits end;
  end if;
  if coalesce(normalized_identifier,'')='' then raise exception 'sample_customer_required'; end if;

  select * into target_campaign from public.sample_campaigns where id=p_campaign_id for update;
  if not found or not target_campaign.active then raise exception 'sample_campaign_unavailable'; end if;
  if now()<target_campaign.starts_at or now()>=target_campaign.ends_at then raise exception 'sample_campaign_outside_window'; end if;

  select * into target_confirmation from public.whatsapp_order_confirmations where id=p_whatsapp_confirmation_id for update;
  if not found or target_confirmation.status<>'confirmed' or target_confirmation.payment_confirmed_at is null then
    raise exception 'sample_payment_not_confirmed';
  end if;

  if exists(select 1 from public.sample_campaign_claims where campaign_id=p_campaign_id and customer_identifier_normalized=normalized_identifier and status='confirmed') then
    raise exception 'sample_customer_duplicate';
  end if;

  confirmed_count:=target_campaign.confirmed_claim_count;
  if confirmed_count>=target_campaign.total_stock then raise exception 'sample_campaign_exhausted'; end if;

  if not exists(
    select 1 from public.sample_campaign_variants eligible
    join public.product_variants variant on variant.id=eligible.variant_id
    join public.products product on product.id=variant.product_id
    where eligible.campaign_id=p_campaign_id and eligible.variant_id=p_variant_id
      and variant.size_ml=3 and variant.enabled and variant.status='active'
      and variant.tester_pack_eligible and product.status='active'
  ) then raise exception 'sample_variant_unavailable'; end if;

  update public.inventory set quantity=quantity-1,updated_at=now()
  where variant_id=p_variant_id and quantity-reserved>=1;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'sample_variant_out_of_stock'; end if;

  insert into public.sample_campaign_claims(
    campaign_id,whatsapp_confirmation_id,variant_id,customer_identifier,
    customer_identifier_normalized,price_paise,status,confirmed_by
  ) values (
    p_campaign_id,p_whatsapp_confirmation_id,p_variant_id,trim(p_customer_identifier),
    normalized_identifier,target_campaign.price_paise,'confirmed',p_actor_id
  );

  update public.sample_campaigns set confirmed_claim_count=confirmed_claim_count+1,updated_at=now() where id=p_campaign_id;

  return target_campaign.total_stock-confirmed_count-1;
end;
$$;

revoke all on function public.confirm_sample_campaign_claim(text,uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.confirm_sample_campaign_claim(text,uuid,text,uuid,uuid) to service_role;

-- Publish a new immutable policy version for the owner-approved campaign terms.
-- Existing operational readiness timestamps are preserved; the public policy view
-- continues to enforce its established publication gates.
update public.store_policy_settings set
  terms=coalesce(terms,'{}'::jsonb) || jsonb_build_object(
    'diwali2026','1–10 November 2026 IST; 60% off eligible live fragrance bottles and tester packs automatically; no cap; shipping excluded; no stacking; highest-value eligible promotion only',
    'diwaliSample2026','1–10 November 2026 IST or 99 verified claims; one eligible in-stock 3 ml tester for ₹99 per normalized customer; shipping extra; manual share, payment and stock verification; enquiries do not reserve inventory',
    'lastUpdatedDate','2026-10-27'
  ),
  policy_version='2026-10-27.1',
  policy_effective_date='2026-10-27',
  publish_status='published',
  owner_approved_at=coalesce(owner_approved_at,now()),
  publish_confirmed_at=now(),
  admin_notes='Owner-approved Diwali 2026 offer and limited ₹99 sample terms. Existing operational publication gates remain authoritative.',
  updated_at=now()
where id=true;

insert into public.store_policy_versions(version,effective_date,settings_snapshot,status,published_at)
select
  '2026-10-27.1','2026-10-27',
  jsonb_build_object('merchant',merchant,'shipping',shipping,'cancellation',cancellation,'returns',returns,'privacy',privacy,'terms',terms),
  'published',now()
from public.store_policy_settings where id=true
on conflict(version) do nothing;

commit;
