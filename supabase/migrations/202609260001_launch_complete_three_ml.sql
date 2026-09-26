-- Owner-approved launch of exactly twenty 3 ml fragrances.
-- Additive and idempotent: the historical tester migration remains unchanged.
begin;

do $$
declare
  target_count integer;
  reserved_too_high integer;
  incomplete_notes integer;
  unapproved_images integer;
begin
  with approved(slug,sku,price_paise) as (values
    ('musk-rizali','RP-MR-03',24900),('vanilla-musk','RP-VM-03',29900),
    ('white-oud','RP-WO-03',29900),('oud-rose','RP-OR-03',34900),
    ('junoon','RP-JN-03',34900),('red-musk','RP-RM-03',29900),
    ('nazakat','RP-NZ-03',29900),('gulnaar','RP-GL-03',29900),
    ('deer-musk','RP-DM-03',34900),('afsoon','RP-AF-03',29900),
    ('mahnoor','RP-MN-03',24900),('milaap','RP-ML-03',24900),
    ('sukoon-oud','RP-SO-03',29900),('shaan-oud','RP-SH-03',34900),
    ('samandar','RP-SD-03',24900),('neel','RP-NL-03',24900),
    ('ishq','RP-IQ-03',24900),('siyah-oud','RP-SY-03',24900),
    ('safaa-musk','RP-SF-03',24900),('adaa','RP-AD-03',24900)
  )
  select count(*) into target_count
  from approved
  join public.products product on product.slug=approved.slug
  join public.product_variants variant on variant.product_id=product.id
    and variant.size_ml=3 and variant.sku=approved.sku;
  if target_count<>20 then
    raise exception 'Expected all 20 existing approved 3 ml SKU mappings; found %',target_count;
  end if;

  with approved(sku) as (values
    ('RP-MR-03'),('RP-VM-03'),('RP-WO-03'),('RP-OR-03'),('RP-JN-03'),
    ('RP-RM-03'),('RP-NZ-03'),('RP-GL-03'),('RP-DM-03'),('RP-AF-03'),
    ('RP-MN-03'),('RP-ML-03'),('RP-SO-03'),('RP-SH-03'),('RP-SD-03'),
    ('RP-NL-03'),('RP-IQ-03'),('RP-SY-03'),('RP-SF-03'),('RP-AD-03')
  )
  select count(*) into reserved_too_high
  from approved
  join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
  join public.inventory inventory on inventory.variant_id=variant.id
  where inventory.reserved>10;
  if reserved_too_high<>0 then
    raise exception 'A target 3 ml SKU has more than 10 reserved units';
  end if;

  with approved(sku) as (values
    ('RP-MR-03'),('RP-VM-03'),('RP-WO-03'),('RP-OR-03'),('RP-JN-03'),
    ('RP-RM-03'),('RP-NZ-03'),('RP-GL-03'),('RP-DM-03'),('RP-AF-03'),
    ('RP-MN-03'),('RP-ML-03'),('RP-SO-03'),('RP-SH-03'),('RP-SD-03'),
    ('RP-NL-03'),('RP-IQ-03'),('RP-SY-03'),('RP-SF-03'),('RP-AD-03')
  )
  select count(*) into incomplete_notes
  from approved
  join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
  join public.products product on product.id=variant.product_id
  where not product.notes_verified
    or jsonb_array_length(coalesce(product.notes->'top','[]'::jsonb))=0
    or jsonb_array_length(coalesce(product.notes->'heart','[]'::jsonb))=0
    or jsonb_array_length(coalesce(product.notes->'base','[]'::jsonb))=0;
  if incomplete_notes<>0 then
    raise exception 'A target 3 ml product is missing verified Top, Heart or Base notes';
  end if;

  with approved(sku) as (values
    ('RP-MR-03'),('RP-VM-03'),('RP-WO-03'),('RP-OR-03'),('RP-JN-03'),
    ('RP-RM-03'),('RP-NZ-03'),('RP-GL-03'),('RP-DM-03'),('RP-AF-03'),
    ('RP-MN-03'),('RP-ML-03'),('RP-SO-03'),('RP-SH-03'),('RP-SD-03'),
    ('RP-NL-03'),('RP-IQ-03'),('RP-SY-03'),('RP-SF-03'),('RP-AD-03')
  )
  select count(*) into unapproved_images
  from approved
  join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
  join public.products product on product.id=variant.product_id
  where product.image_path is null or product.image_path like '%product-image-pending%';
  if unapproved_images<>0 then
    raise exception 'A target 3 ml product is missing an approved image';
  end if;
end $$;

with approved(slug,name,inspiration_line,supplier_reference,sku,price_paise) as (values
  ('musk-rizali','Musk Rizali',null::text,'','RP-MR-03',24900),
  ('vanilla-musk','Vanilla Musk',null,'','RP-VM-03',29900),
  ('white-oud','White Oud',null,'','RP-WO-03',29900),
  ('oud-rose','Oud Rose',null,'','RP-OR-03',34900),
  ('junoon','Junoon','Inspired by Oud Maracujá','Oud Maracujá','RP-JN-03',34900),
  ('red-musk','Red Musk',null,'','RP-RM-03',29900),
  ('nazakat','Nazakat','Inspired by Delina','Delina','RP-NZ-03',29900),
  ('gulnaar','Gulnaar','Inspired by Zara Candy','Zara Candy','RP-GL-03',29900),
  ('deer-musk','Deer Musk',null,'','RP-DM-03',34900),
  ('afsoon','Afsoon','Inspired by Vampire Blood','Vampire Blood','RP-AF-03',29900),
  ('mahnoor','Mon Paris–Inspired Perfume Oil','Inspired by Mon Paris by YSL','Mon Paris by YSL','RP-MN-03',24900),
  ('milaap','Wisal–Inspired Perfume Oil','Inspired by Ajmal Wisal','Ajmal Wisal','RP-ML-03',24900),
  ('sukoon-oud','Oud Mood–Inspired Perfume Oil','Inspired by Oud Mood','Oud Mood','RP-SO-03',29900),
  ('shaan-oud','Oud for Glory–Inspired Perfume Oil','Inspired by Oud for Glory','Oud for Glory','RP-SH-03',34900),
  ('samandar','Acqua di Giò–Inspired Perfume Oil','Inspired by Acqua di Giò','Acqua di Giò','RP-SD-03',24900),
  ('neel','Light Blue–Inspired Perfume Oil','Inspired by Light Blue','Light Blue','RP-NL-03',24900),
  ('ishq','Love Spell–Inspired Perfume Oil','Inspired by Love Spell','Love Spell','RP-IQ-03',24900),
  ('siyah-oud','Black Oud',null,'','RP-SY-03',24900),
  ('safaa-musk','Musk Al Tahara',null,'','RP-SF-03',24900),
  ('adaa','Bombshell–Inspired Perfume Oil','Inspired by Bombshell','Bombshell','RP-AD-03',24900)
)
update public.products product set
  name=approved.name,
  inspiration_line=approved.inspiration_line,
  seo_title=approved.name || ' 3 ml Tester | Rehmat Panjab',
  image_alt_text=approved.name || ' concentrated perfume oil by Rehmat Panjab',
  status='active',
  updated_at=now()
from approved where product.slug=approved.slug;

with approved(slug,supplier_reference) as (values
  ('musk-rizali',''),('vanilla-musk',''),('white-oud',''),('oud-rose',''),
  ('junoon','Oud Maracujá'),('red-musk',''),('nazakat','Delina'),
  ('gulnaar','Zara Candy'),('deer-musk',''),('afsoon','Vampire Blood'),
  ('mahnoor','Mon Paris by YSL'),('milaap','Ajmal Wisal'),('sukoon-oud','Oud Mood'),
  ('shaan-oud','Oud for Glory'),('samandar','Acqua di Giò'),('neel','Light Blue'),
  ('ishq','Love Spell'),('siyah-oud',''),('safaa-musk',''),('adaa','Bombshell')
)
update public.tester_product_intake intake set
  supplier_reference=approved.supplier_reference,
  opening_notes=array(select jsonb_array_elements_text(product.notes->'top')),
  heart_notes=array(select jsonb_array_elements_text(product.notes->'heart')),
  base_notes=array(select jsonb_array_elements_text(product.notes->'base')),
  description=product.description,
  image_path=product.image_path,
  content_approved=true,
  image_approved=true,
  approved_at=coalesce(intake.approved_at,now()),
  updated_at=now()
from approved
join public.products product on product.slug=approved.slug
where intake.product_id=product.id;

with approved(sku,price_paise) as (values
  ('RP-MR-03',24900),('RP-VM-03',29900),('RP-WO-03',29900),('RP-OR-03',34900),
  ('RP-JN-03',34900),('RP-RM-03',29900),('RP-NZ-03',29900),('RP-GL-03',29900),
  ('RP-DM-03',34900),('RP-AF-03',29900),('RP-MN-03',24900),('RP-ML-03',24900),
  ('RP-SO-03',29900),('RP-SH-03',34900),('RP-SD-03',24900),('RP-NL-03',24900),
  ('RP-IQ-03',24900),('RP-SY-03',24900),('RP-SF-03',24900),('RP-AD-03',24900)
)
update public.product_variants variant set
  price_paise=approved.price_paise,
  enabled=true,
  status='active',
  tester_pack_eligible=true,
  margin_review_required=false,
  updated_at=now()
from approved where variant.sku=approved.sku and variant.size_ml=3;

-- Keep the five non-approved legacy testers stored but unavailable.
update public.product_variants set
  enabled=false,status='draft',tester_pack_eligible=false,margin_review_required=true,updated_at=now()
where size_ml=3 and sku in ('RP-AV-03','RP-VO-03','RP-PO-03','RP-GD-03','RP-DC-03');

with approved(sku) as (values
  ('RP-MR-03'),('RP-VM-03'),('RP-WO-03'),('RP-OR-03'),('RP-JN-03'),
  ('RP-RM-03'),('RP-NZ-03'),('RP-GL-03'),('RP-DM-03'),('RP-AF-03'),
  ('RP-MN-03'),('RP-ML-03'),('RP-SO-03'),('RP-SH-03'),('RP-SD-03'),
  ('RP-NL-03'),('RP-IQ-03'),('RP-SY-03'),('RP-SF-03'),('RP-AD-03')
)
update public.inventory inventory set quantity=10,low_stock_threshold=2,updated_at=now()
from approved
join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
where inventory.variant_id=variant.id;

with approved(sku,price_paise) as (values
  ('RP-MR-03',24900),('RP-VM-03',29900),('RP-WO-03',29900),('RP-OR-03',34900),
  ('RP-JN-03',34900),('RP-RM-03',29900),('RP-NZ-03',29900),('RP-GL-03',29900),
  ('RP-DM-03',34900),('RP-AF-03',29900),('RP-MN-03',24900),('RP-ML-03',24900),
  ('RP-SO-03',29900),('RP-SH-03',34900),('RP-SD-03',24900),('RP-NL-03',24900),
  ('RP-IQ-03',24900),('RP-SY-03',24900),('RP-SF-03',24900),('RP-AD-03',24900)
)
insert into public.tester_variant_costs (
  variant_id,selling_price_paise,margin_approved,packaging_approved,margin_reviewed_at,admin_notes
)
select variant.id,approved.price_paise,true,true,now(),
  'Owner-approved 3 ml launch price and packaging. Private COGS values remain protected and may be completed separately.'
from approved
join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
on conflict (variant_id) do update set
  selling_price_paise=excluded.selling_price_paise,
  margin_approved=true,
  packaging_approved=true,
  margin_reviewed_at=coalesce(public.tester_variant_costs.margin_reviewed_at,now()),
  admin_notes=excluded.admin_notes,
  updated_at=now();

update public.bottles set
  status='active',
  photo_path='/images/bottles/rose-gold-bottle-oil.webp',
  thumbnail_path='/images/bottles/rose-gold-bottle-oil.webp',
  alt_text='Rehmat Panjab 3 ml concentrated perfume oil bottle',
  short_description='Compact glass tester bottle for concentrated perfume oil.',
  updated_at=now()
where internal_code='RP-TESTER-03';

update public.tester_pack_rules set status='active',updated_at=now()
where pack_size in (2,3,5);

do $$
declare live_count integer; invalid_count integer;
begin
  select count(*) into live_count from public.product_variants
  where size_ml=3 and enabled and status='active';
  if live_count<>20 then raise exception 'Expected exactly 20 live 3 ml variants; found %',live_count; end if;

  with approved(sku,price_paise) as (values
    ('RP-MR-03',24900),('RP-VM-03',29900),('RP-WO-03',29900),('RP-OR-03',34900),
    ('RP-JN-03',34900),('RP-RM-03',29900),('RP-NZ-03',29900),('RP-GL-03',29900),
    ('RP-DM-03',34900),('RP-AF-03',29900),('RP-MN-03',24900),('RP-ML-03',24900),
    ('RP-SO-03',29900),('RP-SH-03',34900),('RP-SD-03',24900),('RP-NL-03',24900),
    ('RP-IQ-03',24900),('RP-SY-03',24900),('RP-SF-03',24900),('RP-AD-03',24900)
  )
  select count(*) into invalid_count
  from approved
  left join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
  left join public.inventory inventory on inventory.variant_id=variant.id
  where variant.id is null or variant.price_paise<>approved.price_paise
    or not variant.enabled or variant.status<>'active' or not variant.tester_pack_eligible
    or inventory.quantity<>10 or inventory.low_stock_threshold<>2;
  if invalid_count<>0 then raise exception 'One or more approved 3 ml variants failed launch verification'; end if;
end $$;

commit;
