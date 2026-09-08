-- Additive catalogue update: suitability, managed image metadata, and Afsoon.
alter table public.products add column if not exists suitability text not null default 'unisex';
alter table public.products add column if not exists suitability_note text;
alter table public.products add column if not exists positioning text;
alter table public.products add column if not exists micro_description text;
alter table public.products add column if not exists card_line text;
alter table public.products add column if not exists image_alt_text text;
alter table public.products add column if not exists image_display_order integer not null default 0;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_suitability_check'
  ) then
    alter table public.products add constraint products_suitability_check
      check (suitability in ('unisex','men','women'));
  end if;
end $$;

update public.products
set suitability = 'unisex',
    image_alt_text = coalesce(nullif(image_alt_text, ''), name || ' perfume oil in its campaign setting')
where suitability is null or image_alt_text is null or image_alt_text = '';

insert into public.products (
  product_number,name,slug,subtitle,card_line,micro_description,short_description,description,inspiration_line,search_aliases,
  status,scent_family,scent_profile,notes,notes_verified,occasions,suitability,suitability_note,positioning,
  image_path,campaign_image_path,image_alt_text,image_display_order,featured,seo_title,seo_description
)
values (
  '10','AFSOON','afsoon','Dark Cherry / Plum / Velvet Rose','Dark fruit. Velvet florals. After-dark enchantment.',
  'Dark cherry, ripe plum and velvet rose wrapped in warm amber and soft musk.',
  'Afsoon is a dark, seductive fragrance built around juicy dark cherry, rich plum and velvety rose. As it develops, warm amber, soft woods and musk create a smooth, addictive drydown with a mysterious after-dark character.',
  E'Afsoon means enchantment—and that is exactly the mood this fragrance is designed to create.\n\nThe opening is immediately rich and juicy, led by dark cherry and ripe plum. The fruit is deep rather than fresh, giving Afsoon a darker, almost wine-like sweetness. Velvet rose adds a luxurious floral layer and prevents the fragrance from becoming overly sugary.\n\nAs the scent settles, the fruity opening becomes warmer and smoother. A soft amber accord, subtle spice and dark florals begin to emerge, giving the composition more depth and sensuality.\n\nThe drydown is built around warm musk, smooth woods and amber, leaving behind a soft but noticeable trail. The overall effect is dark, sweet and mysterious rather than aggressive—ideal for evenings, dates and occasions where you want the fragrance to feel memorable.',
  'Inspired by Vampire Blood',array['Vampire Blood'],'active','Dark Fruity · Floral · Amber · Musky',
  '{"character":["Mysterious","Sweet","Seductive","Nocturnal"],"journey":{"opening":"Juicy · Dark-fruity · Sweet","heart":"Floral · Warm · Sensual","drydown":"Musky · Amber · Softly woody"}}'::jsonb,
  '{"top":["Dark Cherry","Plum","Velvet Rose"],"heart":["Red Berries","Dark Floral Accord","Warm Saffron","Amber"],"base":["Velvet Musk","Sandalwood","Vanilla","Warm Woods","Soft Amber"]}'::jsonb,
  true,array['Evening wear','Dates','Statement occasions'],'unisex','Slightly sensual-sweet leaning','Evening / statement attar',
  '/images/products/product-image-pending.svg','/images/products/product-image-pending.svg','Afsoon product photograph awaiting owner upload',0,false,
  'AFSOON perfume oil','AFSOON concentrated perfume oil by Rehmat Panjab, inspired by Vampire Blood.'
)
on conflict (slug) do update set
  product_number=excluded.product_number,name=excluded.name,subtitle=excluded.subtitle,
  card_line=excluded.card_line,micro_description=excluded.micro_description,
  short_description=excluded.short_description,description=excluded.description,
  inspiration_line=excluded.inspiration_line,search_aliases=excluded.search_aliases,status='active',
  scent_family=excluded.scent_family,scent_profile=excluded.scent_profile,notes=excluded.notes,notes_verified=true,
  occasions=excluded.occasions,suitability=excluded.suitability,suitability_note=excluded.suitability_note,
  positioning=excluded.positioning,image_path=excluded.image_path,campaign_image_path=excluded.campaign_image_path,
  image_alt_text=excluded.image_alt_text,image_display_order=excluded.image_display_order,
  seo_title=excluded.seo_title,seo_description=excluded.seo_description,updated_at=now();

insert into public.product_variants(product_id,size_ml,sku,price_paise,enabled)
select p.id,v.size_ml,v.sku,v.price_paise,true
from public.products p join (values
  (6,'RP-AFSOON-06',49900),(12,'RP-AFSOON-12',89900)
) as v(size_ml,sku,price_paise) on p.slug='afsoon'
on conflict(product_id,size_ml) do update set
  sku=excluded.sku,price_paise=excluded.price_paise,enabled=true,updated_at=now();

insert into public.inventory(variant_id,quantity,reserved,low_stock_threshold)
select v.id,0,0,2
from public.product_variants v join public.products p on p.id=v.product_id
where p.slug='afsoon'
on conflict(variant_id) do nothing;
