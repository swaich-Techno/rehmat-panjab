-- Additive 3 ml tester-pack readiness. Nothing in this migration changes 6 ml or 12 ml data.
-- Tester variants and packaging remain draft until real packaging photography, complete costs,
-- stock and an administrator margin review are approved.

alter table public.product_variants
  add column if not exists status text not null default 'active'
    check (status in ('draft','active','archived')),
  add column if not exists tester_pack_eligible boolean not null default false,
  add column if not exists margin_review_required boolean not null default false;

alter table public.packaging_boxes add column if not exists admin_notes text;

alter table public.order_items
  add column if not exists tester_pack_group_id uuid,
  add column if not exists tester_pack_size integer
    check (tester_pack_size is null or tester_pack_size in (2,3,5));

alter table public.order_items drop constraint if exists order_items_tester_pack_pair_check;
alter table public.order_items add constraint order_items_tester_pack_pair_check check (
  (tester_pack_group_id is null and tester_pack_size is null)
  or (tester_pack_group_id is not null and tester_pack_size in (2,3,5))
);

create or replace function public.validate_tester_pack_group() returns trigger
language plpgsql set search_path=public as $$
declare
  target_group uuid:=coalesce(new.tester_pack_group_id,old.tester_pack_group_id);
  row_count integer;
  distinct_count integer;
  required_count integer;
begin
  if target_group is null then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  select count(*),count(distinct variant_id),min(tester_pack_size)
    into row_count,distinct_count,required_count
    from public.order_items where tester_pack_group_id=target_group;
  if row_count>0 and (row_count<>required_count or distinct_count<>required_count) then
    raise exception 'Tester pack % must contain exactly % distinct variants',target_group,required_count;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end; $$;

drop trigger if exists order_items_validate_tester_pack on public.order_items;
create constraint trigger order_items_validate_tester_pack
after insert or update or delete on public.order_items
deferrable initially deferred for each row execute function public.validate_tester_pack_group();

create table if not exists public.tester_pack_rules (
  pack_size integer primary key check (pack_size in (2,3,5)),
  discount_percent integer not null check (discount_percent between 0 and 100),
  bottle_cost_paise integer not null check (bottle_cost_paise >= 0),
  corrugated_box_cost_paise integer not null check (corrugated_box_cost_paise >= 0),
  packaging_cost_paise integer not null check (packaging_cost_paise >= 0),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  admin_notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.tester_variant_costs (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  total_oil_purchase_cost_paise integer check (total_oil_purchase_cost_paise is null or total_oil_purchase_cost_paise >= 0),
  total_purchased_ml numeric(12,2) check (total_purchased_ml is null or total_purchased_ml > 0),
  bottle_cost_paise integer check (bottle_cost_paise is null or bottle_cost_paise >= 0),
  individual_box_cost_paise integer check (individual_box_cost_paise is null or individual_box_cost_paise >= 0),
  label_cost_paise integer check (label_cost_paise is null or label_cost_paise >= 0),
  filling_sealing_cost_paise integer check (filling_sealing_cost_paise is null or filling_sealing_cost_paise >= 0),
  labour_cost_paise integer check (labour_cost_paise is null or labour_cost_paise >= 0),
  pack_insert_cost_paise integer check (pack_insert_cost_paise is null or pack_insert_cost_paise >= 0),
  selling_price_paise integer not null check (selling_price_paise >= 0),
  minimum_margin_percent numeric(5,2) check (minimum_margin_percent is null or minimum_margin_percent between 0 and 100),
  margin_approved boolean not null default false,
  packaging_approved boolean not null default false,
  margin_reviewed_by uuid references auth.users(id) on delete set null,
  margin_reviewed_at timestamptz,
  admin_notes text,
  updated_at timestamptz not null default now()
);

-- Supplier references and pre-publication content stay private even after a product is activated.
create table if not exists public.tester_product_intake (
  product_id uuid primary key references public.products(id) on delete cascade,
  supplier_reference text not null default '',
  opening_notes text[] not null default '{}',
  heart_notes text[] not null default '{}',
  base_notes text[] not null default '{}',
  description text,
  audience text,
  image_path text,
  content_approved boolean not null default false,
  image_approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_tester_idx
  on public.product_variants(tester_pack_eligible,status,enabled) where tester_pack_eligible;

alter table public.tester_pack_rules enable row level security;
alter table public.tester_variant_costs enable row level security;
alter table public.tester_product_intake enable row level security;
create policy "super admins manage tester pack rules" on public.tester_pack_rules
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super admins manage tester costs" on public.tester_variant_costs
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super admins manage tester intake" on public.tester_product_intake
  for all using (public.is_super_admin()) with check (public.is_super_admin());

insert into public.packaging_boxes (
  name, internal_code, cost_paise, available_quantity, low_stock_threshold, active, admin_notes
)
values (
  'Corrugated 3 ml tester-pack box', 'RP-TESTER-CORRUGATED', 1170, 20, 2, false,
  'Owner supplied: 20 boxes cost Rs 234. One box holds a Pack of 2, 3 or 5. Draft until final packaging is approved.'
)
on conflict (internal_code) do update set
  cost_paise=excluded.cost_paise,
  admin_notes=excluded.admin_notes,
  updated_at=now();

insert into public.bottles (
  name, internal_code, volume_ml, public_label, short_description, photo_path, thumbnail_path,
  alt_text, material, applicator_type, packaging_cost_paise, bottle_cost_paise,
  available_packaging_quantity, low_stock_threshold, status, display_order, admin_notes
)
values (
  '3 ml tester bottle', 'RP-TESTER-03', 3, '3 ml Tester',
  'Compact glass tester bottle; final colour and insert remain subject to owner approval.',
  '/images/testers/3ml-bottle-draft-reference.jpeg', '/images/testers/3ml-bottle-draft-reference.jpeg',
  'Draft supplier reference showing assorted 3 ml glass tester bottles', 'Glass', 'Roll-on',
  null, 1175, 24, 2, 'inactive', 3,
  'Draft packaging reference only. Owner supplied: 24 empty bottles cost Rs 282 (Rs 11.75 each). Uses the existing 6 ml-style individual box; real packaging photos required before activation.'
)
on conflict (internal_code) do update set
  bottle_cost_paise=excluded.bottle_cost_paise,
  packaging_cost_paise=excluded.packaging_cost_paise,
  photo_path=excluded.photo_path,
  thumbnail_path=excluded.thumbnail_path,
  admin_notes=excluded.admin_notes,
  updated_at=now();

insert into public.tester_pack_rules (
  pack_size, discount_percent, bottle_cost_paise, corrugated_box_cost_paise,
  packaging_cost_paise, status, admin_notes
)
values
  (2, 5, 1175, 1170, 3520, 'draft', 'One corrugated box; two protected bottle positions.'),
  (3, 8, 1175, 1170, 4695, 'draft', 'One corrugated box; three protected bottle positions.'),
  (5, 12, 1175, 1170, 7045, 'draft', 'One corrugated box; five protected bottle positions.')
on conflict (pack_size) do update set
  discount_percent=excluded.discount_percent,
  bottle_cost_paise=excluded.bottle_cost_paise,
  corrugated_box_cost_paise=excluded.corrugated_box_cost_paise,
  packaging_cost_paise=excluded.packaging_cost_paise,
  admin_notes=excluded.admin_notes,
  updated_at=now();

-- Owner-approved public fragrance copy. Physical tester inventory remains independently locked at zero.
insert into public.products (
  product_number,name,slug,subtitle,description,short_description,inspiration_line,scent_family,status,notes,notes_verified,
  scent_profile,occasions,seasons,image_path,campaign_image_path,image_alt_text,featured,
  seo_title,seo_description,og_image_path,reviews_enabled
)
select seed.product_number,seed.name,seed.slug,
  array_to_string(seed.top_notes,' / ') || ' / ' || seed.heart_notes[1] || ' / ' || seed.base_notes[1],
  seed.description,seed.description,seed.inspiration_line,seed.scent_family,'active',
  jsonb_build_object('top',to_jsonb(seed.top_notes),'heart',to_jsonb(seed.heart_notes),'base',to_jsonb(seed.base_notes)),true,
  '{"character":[]}'::jsonb,'{}','{}','/images/bottles/rose-gold-bottle-oil.webp',null,
  seed.name || ' concentrated perfume oil in approved Rehmat Panjab bottle artwork',false,
  seed.name || ' 3 ml Tester | Rehmat Panjab',seed.description,'/images/bottles/rose-gold-bottle-social.webp',true
from (values
  ('16','MAHNOOR','mahnoor',array['Strawberry','Raspberry','Bergamot'],array['Peony','Jasmine','Datura'],array['Patchouli','White Musk','Vanilla'],'Fruity · Floral · Musky','A bright berry-and-citrus opening moves into luminous florals before settling into soft musk, vanilla and patchouli. An expressive choice for evenings and special occasions.','Mon Paris scent direction'),
  ('17','MILAAP','milaap',array['Citrus','Gentle Spices'],array['Rose','Floral Notes'],array['Musk','Sandalwood'],'Floral · Spicy · Musky','A refined floral-spicy profile centred on rose and softened by smooth musk and sandalwood. Elegant for occasions and comfortable for everyday wear.','Wisal scent direction'),
  ('18','SUKOON OUD','sukoon-oud',array['Rose','Saffron','Pimento'],array['Oud','Caramel','Patchouli'],array['Amber','Incense','Resins','Musk'],'Oud · Amber · Spicy','Rose and saffron introduce a warm oud composition with subtle sweetness, earthy patchouli and a deep amber-incense finish.','Oud Mood scent direction'),
  ('19','SHAAN OUD','shaan-oud',array['Saffron','Nutmeg','Lavender'],array['Oud','Patchouli'],array['Oud','Musk','Woods'],'Oud · Woody · Spicy','A dark woody-spiced profile with an aromatic opening, a rich oud-and-patchouli centre and a smooth musky finish.','Oud for Glory scent direction'),
  ('20','SAMANDAR','samandar',array['Bergamot','Citrus Notes'],array['Marine Notes','Jasmine'],array['Cedar','White Musk','Patchouli'],'Fresh · Marine · Woody','Fresh citrus and marine notes create an airy opening, followed by jasmine and a clean cedar, musk and patchouli finish.','Acqua di Giò scent direction'),
  ('21','NEEL','neel',array['Sicilian Lemon','Apple','Cedar'],array['Bamboo','Jasmine','White Rose'],array['Cedar','Musk','Amber'],'Citrus · Fresh · Woody','Crisp lemon and apple meet airy florals and bamboo before settling into clean cedar, musk and amber.','Light Blue scent direction'),
  ('22','ISHQ','ishq',array['Peach','Apple'],array['Cherry Blossom','Soft Florals'],array['Musk','Soft Woods'],'Fruity · Floral · Soft Musk','A juicy peach-and-apple opening flows into delicate cherry blossom and soft florals, finishing with gentle musk and woods.','Love Spell scent direction'),
  ('23','SIYAH OUD','siyah-oud',array['Saffron','Spices'],array['Oud','Rose'],array['Amber','Musk','Woods'],'Oud · Spicy · Amber','A deep spiced-oud profile with a rose accent and a warm foundation of amber, musk and woods.','Black Oud scent direction'),
  ('24','SAFAA MUSK','safaa-musk',array['Clean Notes'],array['White Florals'],array['White Musk','Powdery Notes'],'Clean · Floral · White Musk','A clean and comforting white-musk profile with airy florals and a soft powdery finish.','Musk Al Tahara scent direction'),
  ('25','ADAA','adaa',array['Passionfruit','Grapefruit','Pineapple'],array['Peony','Red Berries','Jasmine'],array['Musk','Soft Woods'],'Fruity · Floral · Musky','A vivid tropical-fruity opening leads into bright florals and red berries, finishing with smooth musk and soft woods.','Bombshell scent direction')
) as seed(product_number,name,slug,top_notes,heart_notes,base_notes,scent_family,description,inspiration_line)
on conflict (slug) do update set
  name=excluded.name,subtitle=excluded.subtitle,description=excluded.description,short_description=excluded.short_description,
  inspiration_line=excluded.inspiration_line,scent_family=excluded.scent_family,status='active',notes=excluded.notes,notes_verified=true,
  image_path=excluded.image_path,campaign_image_path=null,image_alt_text=excluded.image_alt_text,featured=false,reviews_enabled=true,
  seo_title=excluded.seo_title,seo_description=excluded.seo_description,og_image_path=excluded.og_image_path,updated_at=now();

insert into public.tester_product_intake (product_id,supplier_reference)
select product.id,seed.supplier_reference
from (values
  ('mahnoor','Moon Paris by YSL'),
  ('milaap','Ajmal Wisal'),
  ('sukoon-oud','Oud Mood'),
  ('shaan-oud','Oud for Glory'),
  ('samandar','Aqua Di Gio'),
  ('neel','Light Blue'),
  ('ishq','Loverspell'),
  ('siyah-oud','Black Oud'),
  ('safaa-musk','Musk Al Tahara'),
  ('adaa','Bombshell')
) as seed(slug,supplier_reference)
join public.products product on product.slug=seed.slug
on conflict (product_id) do update set supplier_reference=excluded.supplier_reference,updated_at=now();

with approved(slug,sku,price_paise) as (values
  ('musk-rizali','RP-MR-03',29900),
  ('vanilla-musk','RP-VM-03',34900),
  ('white-oud','RP-WO-03',34900),
  ('oud-rose','RP-OR-03',39900),
  ('junoon','RP-JN-03',39900),
  ('red-musk','RP-RM-03',34900),
  ('nazakat','RP-NZ-03',34900),
  ('gulnaar','RP-GL-03',34900),
  ('deer-musk','RP-DM-03',37900),
  ('afsoon','RP-AF-03',29900),
  ('amber-veil','RP-AV-03',29900),
  ('velvet-oud','RP-VO-03',37900),
  ('purple-oud','RP-PO-03',32900),
  ('golden-dream','RP-GD-03',29900),
  ('dubai-chocolate','RP-DC-03',24900),
  ('mahnoor','RP-MN-03',24900),
  ('milaap','RP-ML-03',24900),
  ('sukoon-oud','RP-SO-03',29900),
  ('shaan-oud','RP-SH-03',34900),
  ('samandar','RP-SD-03',24900),
  ('neel','RP-NL-03',24900),
  ('ishq','RP-IQ-03',24900),
  ('siyah-oud','RP-SY-03',24900),
  ('safaa-musk','RP-SF-03',24900),
  ('adaa','RP-AD-03',24900)
), tester_bottle as (
  select id from public.bottles where internal_code='RP-TESTER-03' limit 1
)
insert into public.product_variants (
  product_id,size_ml,sku,price_paise,bottle_id,enabled,status,tester_pack_eligible,margin_review_required
)
select product.id,3,approved.sku,approved.price_paise,tester_bottle.id,false,'draft',true,true
from approved
join public.products product on product.slug=approved.slug
cross join tester_bottle
on conflict (product_id,size_ml) do update set
  sku=excluded.sku,
  price_paise=excluded.price_paise,
  bottle_id=excluded.bottle_id,
  enabled=false,
  status='draft',
  tester_pack_eligible=true,
  margin_review_required=true,
  updated_at=now();

-- Preserve approved catalogue content in private intake while variants remain unavailable pending counted stock.
insert into public.tester_product_intake (
  product_id,opening_notes,heart_notes,base_notes,description,audience,image_path,content_approved,image_approved
)
select product.id,
  array(select jsonb_array_elements_text(coalesce(product.notes->'top','[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(product.notes->'heart','[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(product.notes->'base','[]'::jsonb))),
  nullif(product.description,''),coalesce(product.suitability_note,product.suitability),product.image_path,
  product.notes_verified and product.description<>'',
  product.image_path is not null and product.image_path not like '%product-image-pending%'
from public.products product
join public.product_variants variant on variant.product_id=product.id
where variant.size_ml=3 and variant.tester_pack_eligible
on conflict (product_id) do update set
  opening_notes=excluded.opening_notes,heart_notes=excluded.heart_notes,base_notes=excluded.base_notes,
  description=excluded.description,audience=excluded.audience,image_path=excluded.image_path,
  content_approved=excluded.content_approved,image_approved=excluded.image_approved,updated_at=now();

-- Independent tester inventory begins at zero; an administrator must enter counted stock.
insert into public.inventory (variant_id,quantity,reserved,low_stock_threshold)
select variant.id,0,0,2
from public.product_variants variant
where variant.size_ml=3 and variant.tester_pack_eligible
on conflict (variant_id) do nothing;

insert into public.tester_variant_costs (
  variant_id,bottle_cost_paise,individual_box_cost_paise,selling_price_paise,
  margin_approved,packaging_approved,admin_notes
)
select variant.id,1175,null,variant.price_paise,false,false,
  'Missing actual oil purchase, quantity, individual-box, label, filling/sealing, labour and insert costs. Margin approval required.'
from public.product_variants variant
where variant.size_ml=3 and variant.tester_pack_eligible and variant.price_paise is not null
on conflict (variant_id) do update set
  bottle_cost_paise=excluded.bottle_cost_paise,
  individual_box_cost_paise=excluded.individual_box_cost_paise,
  selling_price_paise=excluded.selling_price_paise,
  margin_approved=false,
  packaging_approved=false,
  admin_notes=excluded.admin_notes,
  updated_at=now();

-- Owner-supplied private oil purchase inputs. Per-ml and 3 ml values are calculated by the COGS code.
with costs(slug,total_cost_paise,purchased_ml) as (values
  ('musk-rizali',154000,50::numeric),
  ('mahnoor',30500,50::numeric),
  ('milaap',21000,25::numeric),
  ('sukoon-oud',44000,25::numeric),
  ('shaan-oud',55500,25::numeric),
  ('samandar',17000,25::numeric),
  ('neel',17000,25::numeric),
  ('ishq',16000,25::numeric),
  ('siyah-oud',16500,25::numeric),
  ('safaa-musk',51000,50::numeric),
  ('adaa',17000,25::numeric)
)
update public.tester_variant_costs cost set
  total_oil_purchase_cost_paise=costs.total_cost_paise,
  total_purchased_ml=costs.purchased_ml,
  updated_at=now()
from costs
join public.products product on product.slug=costs.slug
join public.product_variants variant on variant.product_id=product.id and variant.size_ml=3
where cost.variant_id=variant.id;
