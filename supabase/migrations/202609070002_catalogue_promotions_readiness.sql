-- Safe catalogue expansion and private promotion model. No existing stock is reset.
alter table public.products add column if not exists inspiration_line text;
alter table public.products add column if not exists search_aliases text[] not null default '{}';

update public.products set status='archived', featured=false, product_number='A03', updated_at=now()
where slug='saffron-amber-oud';

do $$ begin
  if exists(select 1 from public.products where slug='oud-maracuja') and not exists(select 1 from public.products where slug='junoon') then
    update public.products set slug='junoon' where slug='oud-maracuja';
  end if;
  if exists(select 1 from public.products where slug='delina') and not exists(select 1 from public.products where slug='nazakat') then
    update public.products set slug='nazakat' where slug='delina';
  end if;
end $$;

-- Free final numbers before reordering, avoiding unique-key collisions.
update public.products set product_number='legacy-' || product_number where slug in
  ('musk-rizali','vanilla-musk','white-oud','oud-rose','junoon','red-musk','nazakat','zara-candy','deer-musk')
  and product_number not like 'legacy-%';

insert into public.products
  (product_number,name,slug,subtitle,short_description,description,inspiration_line,search_aliases,status,scent_profile,occasions,image_path,campaign_image_path,featured,seo_title,seo_description)
values
  ('01','Musk Rizali','musk-rizali','Bergamot / saffron / white musk','Pure tradition. Modern soul.','Top notes: bergamot, saffron and white musk.',null,'{}','active','{"character":["Pure","Traditional","Modern","Musky"]}','{}','/images/products/musk-rizali.webp','/images/products/musk-rizali.webp',true,'Musk Rizali perfume oil','Musk Rizali concentrated perfume oil by Rehmat Panjab.'),
  ('02','Vanilla Musk','vanilla-musk','Vanilla bean / almond / white musk','Warm vanilla. Soft musk. Pure comfort.','Top notes: vanilla bean, almond and white musk.',null,'{}','active','{"character":["Warm","Soft","Comforting","Musky"]}','{}','/images/products/vanilla-musk.webp','/images/products/vanilla-musk.webp',true,'Vanilla Musk perfume oil','Vanilla Musk concentrated perfume oil by Rehmat Panjab.'),
  ('03','White Oud','white-oud','White pepper / bergamot / soft woods','Oud, refined to its cleanest expression.','Top notes: white pepper, bergamot and soft woods.',null,'{}','active','{"character":["Clean","Woody","Refined","Timeless"]}','{}','/images/products/white-oud.webp','/images/products/white-oud.webp',true,'White Oud perfume oil','White Oud concentrated perfume oil by Rehmat Panjab.'),
  ('04','Oud Rose','oud-rose','Rose petals / pink pepper / raspberry','Where velvet rose meets the darkness of oud.','Top notes: rose petals, pink pepper and raspberry.',null,'{}','active','{"character":["Floral","Woody","Velvet","Expressive"]}','{}','/images/products/oud-rose.webp','/images/products/oud-rose.webp',true,'Oud Rose perfume oil','Oud Rose concentrated perfume oil by Rehmat Panjab.'),
  ('05','JUNOON','junoon','Passionfruit / Turkish rose / saffron','Tropical temptation wrapped in precious oud.','Top notes: passionfruit, Turkish rose and saffron.','Inspired by Oud Maracujá',array['Oud Maracuja','Oud Maracujá'],'active','{"character":["Tropical","Oud","Rose","Saffron"]}','{}','/images/products/junoon.webp','/images/products/junoon.webp',true,'JUNOON perfume oil','JUNOON concentrated perfume oil by Rehmat Panjab, inspired by Oud Maracujá.'),
  ('06','Red Musk','red-musk','Red berries / saffron / white musk','A deeper, warmer side of musk.','Top notes: red berries, saffron and white musk.',null,'{}','active','{"character":["Deep","Warm","Musky","Modern"]}','{}','/images/products/red-musk.webp','/images/products/red-musk.webp',true,'Red Musk perfume oil','Red Musk concentrated perfume oil by Rehmat Panjab.'),
  ('07','NAZAKAT','nazakat','Lychee / rhubarb / bergamot','Radiant fruit. Luxurious rose. Effortless femininity.','Top notes: lychee, rhubarb and bergamot.','Inspired by Delina',array['Delina'],'active','{"character":["Radiant","Fruity","Rose","Feminine"]}','{}','/images/products/nazakat.webp','/images/products/nazakat.webp',true,'NAZAKAT perfume oil','NAZAKAT concentrated perfume oil by Rehmat Panjab, inspired by Delina.'),
  ('08','Zara Candy','zara-candy','Candied pear / strawberry / vanilla','Sweet memories, bottled.','Top notes: candied pear, strawberry and vanilla.',null,'{}','active','{"character":["Sweet","Fruity","Vanilla","Bright"]}','{}','/images/products/zara-candy.webp','/images/products/zara-candy.webp',true,'Zara Candy perfume oil','Zara Candy concentrated perfume oil by Rehmat Panjab.'),
  ('09','Deer Musk','deer-musk','Cardamom / bergamot / velvet musk','Nature. Instinct. Elegance.','Top notes: cardamom, bergamot and velvet musk.',null,'{}','active','{"character":["Natural","Instinctive","Elegant","Musky"]}','{}','/images/products/deer-musk.webp','/images/products/deer-musk.webp',true,'Deer Musk perfume oil','Deer Musk concentrated perfume oil by Rehmat Panjab.')
on conflict (slug) do update set
  product_number=excluded.product_number,name=excluded.name,subtitle=excluded.subtitle,
  short_description=excluded.short_description,description=excluded.description,
  inspiration_line=excluded.inspiration_line,search_aliases=excluded.search_aliases,status='active',
  scent_profile=excluded.scent_profile,image_path=excluded.image_path,campaign_image_path=excluded.campaign_image_path,
  featured=excluded.featured,seo_title=excluded.seo_title,seo_description=excluded.seo_description,updated_at=now();

insert into public.product_variants(product_id,size_ml,sku,price_paise,enabled)
select p.id,v.size_ml,'RP-' || upper(replace(p.slug,'-','')) || '-' || lpad(v.size_ml::text,2,'0'),v.price_paise,true
from public.products p join (values
  ('musk-rizali',6,49900),('musk-rizali',12,79900),('vanilla-musk',6,59900),('vanilla-musk',12,84900),
  ('white-oud',6,59900),('white-oud',12,89900),('oud-rose',6,69900),('oud-rose',12,109900),
  ('junoon',6,69900),('junoon',12,109900),('red-musk',6,59900),('red-musk',12,89900),
  ('nazakat',6,59900),('nazakat',12,84900),('zara-candy',6,59900),('zara-candy',12,84900),
  ('deer-musk',6,64900),('deer-musk',12,94900)
) as v(slug,size_ml,price_paise) on p.slug=v.slug
on conflict(product_id,size_ml) do update set price_paise=excluded.price_paise,enabled=true,updated_at=now();

insert into public.inventory(variant_id,quantity,reserved,low_stock_threshold)
select id,0,0,2 from public.product_variants v
where exists(select 1 from public.products p where p.id=v.product_id and p.slug in ('junoon','red-musk','nazakat','zara-candy','deer-musk'))
on conflict(variant_id) do nothing;

create table if not exists public.automatic_discounts (
  id uuid primary key default gen_random_uuid(), internal_name text not null, public_label text,
  discount_type text not null check(discount_type in ('percentage','fixed')),
  value integer not null check(value>0), max_discount_paise integer check(max_discount_paise is null or max_discount_paise>0),
  minimum_quantity integer not null default 1 check(minimum_quantity>0), minimum_subtotal_paise integer not null default 0 check(minimum_subtotal_paise>=0),
  starts_at timestamptz, ends_at timestamptz, active boolean not null default false, priority integer not null default 0,
  combinable boolean not null default false, admin_notes text, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(discount_type<>'percentage' or value between 1 and 10000), check(ends_at is null or starts_at is null or ends_at>starts_at)
);
create table if not exists public.discount_products(discount_id uuid references public.automatic_discounts(id) on delete cascade,product_id uuid references public.products(id),primary key(discount_id,product_id));
create table if not exists public.discount_variants(discount_id uuid references public.automatic_discounts(id) on delete cascade,variant_id uuid references public.product_variants(id),primary key(discount_id,variant_id));

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(), code text not null, internal_name text not null, public_description text,
  discount_type text not null check(discount_type in ('percentage','fixed')), value integer not null check(value>0),
  minimum_subtotal_paise integer not null default 0 check(minimum_subtotal_paise>=0), max_discount_paise integer check(max_discount_paise is null or max_discount_paise>0),
  starts_at timestamptz, expires_at timestamptz, total_usage_limit integer check(total_usage_limit is null or total_usage_limit>0),
  per_customer_limit integer check(per_customer_limit is null or per_customer_limit>0), first_order_only boolean not null default false,
  minimum_quantity integer not null default 1 check(minimum_quantity>0), active boolean not null default false, combinable boolean not null default false,
  free_shipping boolean not null default false, admin_notes text, revoked_at timestamptz, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(discount_type<>'percentage' or value between 1 and 10000), check(expires_at is null or starts_at is null or expires_at>starts_at)
);
create unique index if not exists coupons_code_ci_unique on public.coupons(upper(trim(code)));
create table if not exists public.coupon_products(coupon_id uuid references public.coupons(id) on delete cascade,product_id uuid references public.products(id),primary key(coupon_id,product_id));
create table if not exists public.coupon_variants(coupon_id uuid references public.coupons(id) on delete cascade,variant_id uuid references public.product_variants(id),primary key(coupon_id,variant_id));
create table if not exists public.coupon_redemptions(
  id uuid primary key default gen_random_uuid(), coupon_id uuid not null references public.coupons(id), order_id uuid references public.orders(id),
  manual_order_reference text, customer_identifier text, eligible_subtotal_paise integer not null check(eligible_subtotal_paise>=0),
  discount_paise integer not null check(discount_paise>=0), confirmation_status text not null check(confirmation_status in ('pending','confirmed','cancelled')),
  payment_status text not null check(payment_status in ('unpaid','paid','refunded')), idempotency_reference text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.whatsapp_order_confirmations(
  id uuid primary key default gen_random_uuid(), reference text not null unique, coupon_id uuid references public.coupons(id),
  customer_identifier text, subtotal_paise integer not null check(subtotal_paise>=0), discount_paise integer not null default 0 check(discount_paise>=0),
  total_paise integer not null check(total_paise>=0), status text not null default 'confirmed' check(status in ('confirmed','cancelled')),
  confirmed_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
alter table public.orders add column if not exists coupon_id uuid references public.coupons(id);
alter table public.orders add column if not exists coupon_code text;

alter table public.automatic_discounts enable row level security; alter table public.discount_products enable row level security; alter table public.discount_variants enable row level security;
alter table public.coupons enable row level security; alter table public.coupon_products enable row level security; alter table public.coupon_variants enable row level security;
alter table public.coupon_redemptions enable row level security; alter table public.whatsapp_order_confirmations enable row level security;
create policy "discounts super admin" on public.automatic_discounts for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "discount products super admin" on public.discount_products for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "discount variants super admin" on public.discount_variants for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "coupons super admin" on public.coupons for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "coupon products super admin" on public.coupon_products for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "coupon variants super admin" on public.coupon_variants for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "coupon redemptions super admin" on public.coupon_redemptions for all using(public.is_super_admin()) with check(public.is_super_admin());
create policy "whatsapp confirmations super admin" on public.whatsapp_order_confirmations for all using(public.is_super_admin()) with check(public.is_super_admin());
