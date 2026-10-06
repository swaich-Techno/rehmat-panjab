-- Complete the approved 3 ml, 6 ml and 12 ml size range for the five catalogue products
-- that previously retained their 3 ml variants in draft. Existing 6 ml and 12 ml rows are untouched.
begin;

do $$
declare
  target_count integer;
  variant_count integer;
  bottle_count integer;
  invalid_count integer;
  reserved_too_high integer;
begin
  with approved(slug,sku,price_paise) as (values
    ('amber-veil','RP-AV-03',29900),
    ('velvet-oud','RP-VO-03',37900),
    ('purple-oud','RP-PO-03',32900),
    ('golden-dream','RP-GD-03',29900),
    ('dubai-chocolate','RP-DC-03',24900)
  )
  select count(*) into target_count
  from approved join public.products product on product.slug=approved.slug;
  if target_count<>5 then raise exception 'Expected five target products; found %',target_count; end if;

  select count(*) into bottle_count from public.bottles
  where internal_code='RP-TESTER-03' and volume_ml=3 and status='active' and archived_at is null;
  if bottle_count<>1 then raise exception 'Expected one active RP-TESTER-03 bottle; found %',bottle_count; end if;

  with approved(slug,sku,price_paise) as (values
    ('amber-veil','RP-AV-03',29900),('velvet-oud','RP-VO-03',37900),
    ('purple-oud','RP-PO-03',32900),('golden-dream','RP-GD-03',29900),
    ('dubai-chocolate','RP-DC-03',24900)
  )
  select count(*),count(*) filter (where variant.sku<>approved.sku or variant.price_paise<>approved.price_paise)
  into variant_count,invalid_count
  from approved
  join public.products product on product.slug=approved.slug
  join public.product_variants variant on variant.product_id=product.id and variant.size_ml=3;
  if variant_count<>5 or invalid_count<>0 then
    raise exception 'The five approved 3 ml variants are missing or do not match their approved SKU/price';
  end if;

  with approved(sku) as (values
    ('RP-AV-03'),('RP-VO-03'),('RP-PO-03'),('RP-GD-03'),('RP-DC-03')
  )
  select count(*) into reserved_too_high
  from approved
  join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
  join public.inventory inventory on inventory.variant_id=variant.id
  where inventory.reserved>10;
  if reserved_too_high<>0 then raise exception 'A target 3 ml variant has more than 10 reserved units'; end if;
end $$;

with approved(sku,price_paise) as (values
  ('RP-AV-03',29900),('RP-VO-03',37900),('RP-PO-03',32900),
  ('RP-GD-03',29900),('RP-DC-03',24900)
), tester_bottle as (
  select id from public.bottles
  where internal_code='RP-TESTER-03' and volume_ml=3 and status='active' and archived_at is null
)
update public.product_variants variant set
  bottle_id=tester_bottle.id,
  enabled=true,
  status='active',
  tester_pack_eligible=true,
  margin_review_required=false,
  updated_at=now()
from approved,tester_bottle
where variant.sku=approved.sku and variant.size_ml=3 and variant.price_paise=approved.price_paise;

with approved(sku) as (values
  ('RP-AV-03'),('RP-VO-03'),('RP-PO-03'),('RP-GD-03'),('RP-DC-03')
)
insert into public.inventory (variant_id,quantity,reserved,low_stock_threshold)
select variant.id,10,0,2
from approved join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
on conflict (variant_id) do update set quantity=10,low_stock_threshold=2,updated_at=now();

with approved(sku,price_paise) as (values
  ('RP-AV-03',29900),('RP-VO-03',37900),('RP-PO-03',32900),
  ('RP-GD-03',29900),('RP-DC-03',24900)
)
update public.tester_variant_costs cost set
  selling_price_paise=approved.price_paise,
  margin_approved=true,
  packaging_approved=true,
  margin_reviewed_at=coalesce(cost.margin_reviewed_at,now()),
  admin_notes='Owner-approved 3 ml catalogue price and packaging.',
  updated_at=now()
from approved
join public.product_variants variant on variant.sku=approved.sku and variant.size_ml=3
where cost.variant_id=variant.id;

with approved(slug) as (values
  ('amber-veil'),('velvet-oud'),('purple-oud'),('golden-dream'),('dubai-chocolate')
)
update public.tester_product_intake intake set
  content_approved=true,
  image_approved=true,
  approved_at=coalesce(intake.approved_at,now()),
  updated_at=now()
from approved
join public.products product on product.slug=approved.slug
where intake.product_id=product.id
  and product.notes_verified
  and nullif(product.description,'') is not null
  and product.image_path is not null
  and product.image_path not like '%product-image-pending%';

do $$
declare invalid_count integer;
begin
  with approved(slug,sku,price_paise) as (values
    ('amber-veil','RP-AV-03',29900),('velvet-oud','RP-VO-03',37900),
    ('purple-oud','RP-PO-03',32900),('golden-dream','RP-GD-03',29900),
    ('dubai-chocolate','RP-DC-03',24900)
  )
  select count(*) into invalid_count
  from approved
  join public.products product on product.slug=approved.slug
  left join public.product_variants variant on variant.product_id=product.id and variant.size_ml=3
  left join public.inventory inventory on inventory.variant_id=variant.id
  left join public.bottles bottle on bottle.id=variant.bottle_id
  left join public.tester_variant_costs cost on cost.variant_id=variant.id
  left join public.tester_product_intake intake on intake.product_id=product.id
  where variant.sku is distinct from approved.sku or variant.price_paise is distinct from approved.price_paise
    or variant.enabled is distinct from true or variant.status is distinct from 'active'
    or variant.tester_pack_eligible is distinct from true or variant.margin_review_required is distinct from false
    or bottle.status is distinct from 'active'
    or inventory.quantity is distinct from 10 or inventory.low_stock_threshold is distinct from 2
    or inventory.reserved is null or inventory.reserved>inventory.quantity
    or cost.margin_approved is distinct from true or cost.packaging_approved is distinct from true
    or intake.content_approved is distinct from true or intake.image_approved is distinct from true
    or (select count(*) from public.product_variants all_sizes
        where all_sizes.product_id=product.id and all_sizes.enabled and all_sizes.status='active'
          and all_sizes.size_ml in (3,6,12))<>3;
  if invalid_count<>0 then raise exception 'Three-size catalogue verification failed for % target products',invalid_count; end if;
end $$;

commit;
