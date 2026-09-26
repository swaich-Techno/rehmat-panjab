-- Add owner-approved 6 ml and 12 ml variants to the ten newest fragrances.
-- Existing prices are preflighted before any write; inventory is set absolutely.
begin;

do $$
declare
  target_products integer;
  existing_three_count integer;
  conflicting_variants integer;
  conflicting_skus integer;
  reserved_too_high integer;
  bottle_count integer;
begin
  with expected(slug,size_ml,sku,price_paise) as (values
    ('mahnoor',3,'RP-MN-03',24900),('mahnoor',6,'RP-MN-06',49900),('mahnoor',12,'RP-MN-12',79900),
    ('milaap',3,'RP-ML-03',24900),('milaap',6,'RP-ML-06',49900),('milaap',12,'RP-ML-12',79900),
    ('sukoon-oud',3,'RP-SO-03',29900),('sukoon-oud',6,'RP-SO-06',59900),('sukoon-oud',12,'RP-SO-12',89900),
    ('shaan-oud',3,'RP-SH-03',34900),('shaan-oud',6,'RP-SH-06',69900),('shaan-oud',12,'RP-SH-12',109900),
    ('samandar',3,'RP-SD-03',24900),('samandar',6,'RP-SD-06',49900),('samandar',12,'RP-SD-12',79900),
    ('neel',3,'RP-NL-03',24900),('neel',6,'RP-NL-06',49900),('neel',12,'RP-NL-12',79900),
    ('ishq',3,'RP-IQ-03',24900),('ishq',6,'RP-IQ-06',49900),('ishq',12,'RP-IQ-12',79900),
    ('siyah-oud',3,'RP-SY-03',24900),('siyah-oud',6,'RP-SY-06',49900),('siyah-oud',12,'RP-SY-12',79900),
    ('safaa-musk',3,'RP-SF-03',24900),('safaa-musk',6,'RP-SF-06',49900),('safaa-musk',12,'RP-SF-12',79900),
    ('adaa',3,'RP-AD-03',24900),('adaa',6,'RP-AD-06',49900),('adaa',12,'RP-AD-12',79900)
  )
  select count(distinct product.id) into target_products
  from expected join public.products product on product.slug=expected.slug;
  if target_products<>10 then
    raise exception 'Expected exactly 10 target products; found %',target_products;
  end if;

  with expected(slug,sku,price_paise) as (values
    ('mahnoor','RP-MN-03',24900),('milaap','RP-ML-03',24900),
    ('sukoon-oud','RP-SO-03',29900),('shaan-oud','RP-SH-03',34900),
    ('samandar','RP-SD-03',24900),('neel','RP-NL-03',24900),
    ('ishq','RP-IQ-03',24900),('siyah-oud','RP-SY-03',24900),
    ('safaa-musk','RP-SF-03',24900),('adaa','RP-AD-03',24900)
  )
  select count(*) into existing_three_count
  from expected
  join public.products product on product.slug=expected.slug
  join public.product_variants variant on variant.product_id=product.id
    and variant.size_ml=3 and variant.sku=expected.sku and variant.price_paise=expected.price_paise;
  if existing_three_count<>10 then
    raise exception 'Expected all 10 approved 3 ml variants before adding bottle sizes; found %',existing_three_count;
  end if;

  with expected(slug,size_ml,sku,price_paise) as (values
    ('mahnoor',3,'RP-MN-03',24900),('mahnoor',6,'RP-MN-06',49900),('mahnoor',12,'RP-MN-12',79900),
    ('milaap',3,'RP-ML-03',24900),('milaap',6,'RP-ML-06',49900),('milaap',12,'RP-ML-12',79900),
    ('sukoon-oud',3,'RP-SO-03',29900),('sukoon-oud',6,'RP-SO-06',59900),('sukoon-oud',12,'RP-SO-12',89900),
    ('shaan-oud',3,'RP-SH-03',34900),('shaan-oud',6,'RP-SH-06',69900),('shaan-oud',12,'RP-SH-12',109900),
    ('samandar',3,'RP-SD-03',24900),('samandar',6,'RP-SD-06',49900),('samandar',12,'RP-SD-12',79900),
    ('neel',3,'RP-NL-03',24900),('neel',6,'RP-NL-06',49900),('neel',12,'RP-NL-12',79900),
    ('ishq',3,'RP-IQ-03',24900),('ishq',6,'RP-IQ-06',49900),('ishq',12,'RP-IQ-12',79900),
    ('siyah-oud',3,'RP-SY-03',24900),('siyah-oud',6,'RP-SY-06',49900),('siyah-oud',12,'RP-SY-12',79900),
    ('safaa-musk',3,'RP-SF-03',24900),('safaa-musk',6,'RP-SF-06',49900),('safaa-musk',12,'RP-SF-12',79900),
    ('adaa',3,'RP-AD-03',24900),('adaa',6,'RP-AD-06',49900),('adaa',12,'RP-AD-12',79900)
  )
  select count(*) into conflicting_variants
  from expected
  join public.products product on product.slug=expected.slug
  join public.product_variants variant on variant.product_id=product.id and variant.size_ml=expected.size_ml
  where variant.sku<>expected.sku or variant.price_paise is distinct from expected.price_paise;
  if conflicting_variants<>0 then
    raise exception 'Existing target product/size has a conflicting SKU or price';
  end if;

  with expected(slug,size_ml,sku,price_paise) as (values
    ('mahnoor',3,'RP-MN-03',24900),('mahnoor',6,'RP-MN-06',49900),('mahnoor',12,'RP-MN-12',79900),
    ('milaap',3,'RP-ML-03',24900),('milaap',6,'RP-ML-06',49900),('milaap',12,'RP-ML-12',79900),
    ('sukoon-oud',3,'RP-SO-03',29900),('sukoon-oud',6,'RP-SO-06',59900),('sukoon-oud',12,'RP-SO-12',89900),
    ('shaan-oud',3,'RP-SH-03',34900),('shaan-oud',6,'RP-SH-06',69900),('shaan-oud',12,'RP-SH-12',109900),
    ('samandar',3,'RP-SD-03',24900),('samandar',6,'RP-SD-06',49900),('samandar',12,'RP-SD-12',79900),
    ('neel',3,'RP-NL-03',24900),('neel',6,'RP-NL-06',49900),('neel',12,'RP-NL-12',79900),
    ('ishq',3,'RP-IQ-03',24900),('ishq',6,'RP-IQ-06',49900),('ishq',12,'RP-IQ-12',79900),
    ('siyah-oud',3,'RP-SY-03',24900),('siyah-oud',6,'RP-SY-06',49900),('siyah-oud',12,'RP-SY-12',79900),
    ('safaa-musk',3,'RP-SF-03',24900),('safaa-musk',6,'RP-SF-06',49900),('safaa-musk',12,'RP-SF-12',79900),
    ('adaa',3,'RP-AD-03',24900),('adaa',6,'RP-AD-06',49900),('adaa',12,'RP-AD-12',79900)
  )
  select count(*) into conflicting_skus
  from expected
  join public.product_variants variant on variant.sku=expected.sku
  join public.products product on product.id=variant.product_id
  where product.slug<>expected.slug or variant.size_ml<>expected.size_ml
    or variant.price_paise is distinct from expected.price_paise;
  if conflicting_skus<>0 then
    raise exception 'An approved SKU already exists with a conflicting product, size or price';
  end if;

  select count(*) into bottle_count from public.bottles
  where volume_ml in (6,12) and status='active' and archived_at is null;
  if bottle_count<>2 then raise exception 'Expected exactly one active bottle for each of 6 ml and 12 ml'; end if;

  with target_slugs(slug) as (values ('mahnoor'),('milaap'),('sukoon-oud'),('shaan-oud'),('samandar'),('neel'),('ishq'),('siyah-oud'),('safaa-musk'),('adaa'))
  select count(*) into reserved_too_high
  from target_slugs
  join public.products product on product.slug=target_slugs.slug
  join public.product_variants variant on variant.product_id=product.id and variant.size_ml in (3,6,12)
  join public.inventory inventory on inventory.variant_id=variant.id
  where inventory.reserved>10;
  if reserved_too_high<>0 then raise exception 'A target variant has more than 10 reserved units'; end if;
end $$;

with expected(slug,size_ml,sku,price_paise) as (values
  ('mahnoor',3,'RP-MN-03',24900),('mahnoor',6,'RP-MN-06',49900),('mahnoor',12,'RP-MN-12',79900),
  ('milaap',3,'RP-ML-03',24900),('milaap',6,'RP-ML-06',49900),('milaap',12,'RP-ML-12',79900),
  ('sukoon-oud',3,'RP-SO-03',29900),('sukoon-oud',6,'RP-SO-06',59900),('sukoon-oud',12,'RP-SO-12',89900),
  ('shaan-oud',3,'RP-SH-03',34900),('shaan-oud',6,'RP-SH-06',69900),('shaan-oud',12,'RP-SH-12',109900),
  ('samandar',3,'RP-SD-03',24900),('samandar',6,'RP-SD-06',49900),('samandar',12,'RP-SD-12',79900),
  ('neel',3,'RP-NL-03',24900),('neel',6,'RP-NL-06',49900),('neel',12,'RP-NL-12',79900),
  ('ishq',3,'RP-IQ-03',24900),('ishq',6,'RP-IQ-06',49900),('ishq',12,'RP-IQ-12',79900),
  ('siyah-oud',3,'RP-SY-03',24900),('siyah-oud',6,'RP-SY-06',49900),('siyah-oud',12,'RP-SY-12',79900),
  ('safaa-musk',3,'RP-SF-03',24900),('safaa-musk',6,'RP-SF-06',49900),('safaa-musk',12,'RP-SF-12',79900),
  ('adaa',3,'RP-AD-03',24900),('adaa',6,'RP-AD-06',49900),('adaa',12,'RP-AD-12',79900)
), bottle as (
  select id,volume_ml from public.bottles where volume_ml in (6,12) and status='active' and archived_at is null
)
insert into public.product_variants (product_id,size_ml,sku,price_paise,bottle_id,enabled,status,tester_pack_eligible,margin_review_required)
select product.id,expected.size_ml,expected.sku,expected.price_paise,
  case when expected.size_ml=3 then existing.bottle_id else bottle.id end,
  true,'active',expected.size_ml=3,false
from expected
join public.products product on product.slug=expected.slug
left join public.product_variants existing on existing.product_id=product.id and existing.size_ml=expected.size_ml
left join bottle on bottle.volume_ml=expected.size_ml
on conflict (product_id,size_ml) do update set
  enabled=true,status='active',tester_pack_eligible=(excluded.size_ml=3),margin_review_required=false,updated_at=now();

with target_slugs(slug) as (values ('mahnoor'),('milaap'),('sukoon-oud'),('shaan-oud'),('samandar'),('neel'),('ishq'),('siyah-oud'),('safaa-musk'),('adaa'))
update public.products product set status='active',updated_at=now()
from target_slugs where product.slug=target_slugs.slug;

with target_slugs(slug) as (values ('mahnoor'),('milaap'),('sukoon-oud'),('shaan-oud'),('samandar'),('neel'),('ishq'),('siyah-oud'),('safaa-musk'),('adaa'))
insert into public.inventory (variant_id,quantity,reserved,low_stock_threshold)
select variant.id,10,0,2
from target_slugs
join public.products product on product.slug=target_slugs.slug
join public.product_variants variant on variant.product_id=product.id and variant.size_ml in (3,6,12)
on conflict (variant_id) do update set quantity=10,low_stock_threshold=2,updated_at=now();

do $$
declare invalid_count integer; target_count integer; unique_skus integer;
begin
  with expected(slug,size_ml,sku,price_paise) as (values
    ('mahnoor',3,'RP-MN-03',24900),('mahnoor',6,'RP-MN-06',49900),('mahnoor',12,'RP-MN-12',79900),
    ('milaap',3,'RP-ML-03',24900),('milaap',6,'RP-ML-06',49900),('milaap',12,'RP-ML-12',79900),
    ('sukoon-oud',3,'RP-SO-03',29900),('sukoon-oud',6,'RP-SO-06',59900),('sukoon-oud',12,'RP-SO-12',89900),
    ('shaan-oud',3,'RP-SH-03',34900),('shaan-oud',6,'RP-SH-06',69900),('shaan-oud',12,'RP-SH-12',109900),
    ('samandar',3,'RP-SD-03',24900),('samandar',6,'RP-SD-06',49900),('samandar',12,'RP-SD-12',79900),
    ('neel',3,'RP-NL-03',24900),('neel',6,'RP-NL-06',49900),('neel',12,'RP-NL-12',79900),
    ('ishq',3,'RP-IQ-03',24900),('ishq',6,'RP-IQ-06',49900),('ishq',12,'RP-IQ-12',79900),
    ('siyah-oud',3,'RP-SY-03',24900),('siyah-oud',6,'RP-SY-06',49900),('siyah-oud',12,'RP-SY-12',79900),
    ('safaa-musk',3,'RP-SF-03',24900),('safaa-musk',6,'RP-SF-06',49900),('safaa-musk',12,'RP-SF-12',79900),
    ('adaa',3,'RP-AD-03',24900),('adaa',6,'RP-AD-06',49900),('adaa',12,'RP-AD-12',79900)
  )
  select count(*),count(distinct variant.sku),count(*) filter (where
    variant.id is null or variant.sku<>expected.sku or variant.price_paise<>expected.price_paise
    or not variant.enabled or variant.status<>'active'
    or variant.tester_pack_eligible<>(expected.size_ml=3)
    or inventory.variant_id is null or inventory.quantity<>10 or inventory.low_stock_threshold<>2
    or inventory.reserved>inventory.quantity or product.status<>'active'
    or variant.bottle_id is null
  ) into target_count,unique_skus,invalid_count
  from expected
  left join public.products product on product.slug=expected.slug
  left join public.product_variants variant on variant.product_id=product.id and variant.size_ml=expected.size_ml
  left join public.inventory inventory on inventory.variant_id=variant.id;
  if target_count<>30 or unique_skus<>30 or invalid_count<>0 then
    raise exception 'Final 30-variant verification failed';
  end if;
end $$;

commit;
