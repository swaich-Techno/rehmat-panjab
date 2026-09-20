-- Owner-approved catalogue and internal cost update, 2026-09-19.
-- Scent notes remain unverified until the owner supplies them.
alter table public.product_variants
  add column if not exists oil_cost_paise integer
  check (oil_cost_paise is null or oil_cost_paise >= 0);

update public.bottles
set bottle_cost_paise = case volume_ml when 6 then 2300 when 12 then 2400 end,
    packaging_cost_paise = 5000,
    admin_notes = 'Owner-confirmed costs on 2026-09-19: bottle ₹23 (6 ml) / ₹24 (12 ml); box ₹50.',
    updated_at = now()
where volume_ml in (6, 12) and status = 'active' and archived_at is null;

insert into public.products (
  product_number, name, slug, subtitle, card_line, micro_description,
  short_description, description, status, notes, notes_verified,
  scent_profile, occasions, seasons, suitability, reviews_enabled,
  image_path, campaign_image_path, image_alt_text, featured,
  seo_title, seo_description, og_image_path
)
select seed.product_number, seed.name, seed.slug,
  'Fragrance profile pending owner verification',
  'A concentrated perfume oil in 6 ml and 12 ml.',
  'Concentrated perfume oil available in 6 ml and 12 ml formats.',
  'A concentrated perfume oil available in 6 ml and 12 ml formats.',
  seed.name || ' is available in 6 ml and 12 ml concentrated perfume-oil formats. Its detailed scent profile will be published after owner verification.',
  'active', '{}'::jsonb, false, '{"character":[]}'::jsonb, '{}', '{}', 'unisex', true,
  '/images/bottles/rose-gold-bottle-oil.webp',
  '/images/bottles/rose-gold-bottle-social.webp',
  seed.name || ' concentrated perfume oil in the Rehmat Panjab rose-gold bottle',
  false, seed.name || ' perfume oil',
  seed.name || ' concentrated perfume oil by Rehmat Panjab in 6 ml and 12 ml formats.',
  '/images/bottles/rose-gold-bottle-social.webp'
from (values
  ('11', 'BR540', 'br540'),
  ('12', 'Oud Satin Mood', 'oud-satin-mood'),
  ('13', 'Purple Oud', 'purple-oud'),
  ('14', 'Golden Dream', 'golden-dream'),
  ('15', 'Dubai Chocolate', 'dubai-chocolate')
) as seed(product_number, name, slug)
on conflict (slug) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  card_line = excluded.card_line,
  micro_description = excluded.micro_description,
  short_description = excluded.short_description,
  description = excluded.description,
  status = 'active',
  notes = excluded.notes,
  notes_verified = false,
  scent_profile = excluded.scent_profile,
  occasions = excluded.occasions,
  seasons = excluded.seasons,
  suitability = excluded.suitability,
  reviews_enabled = true,
  image_path = excluded.image_path,
  campaign_image_path = excluded.campaign_image_path,
  image_alt_text = excluded.image_alt_text,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  og_image_path = excluded.og_image_path,
  updated_at = now();

insert into public.product_variants (
  product_id, size_ml, sku, price_paise, oil_cost_paise, bottle_id, enabled
)
select product.id, variant.size_ml, variant.sku, variant.price_paise,
       variant.oil_cost_paise, bottle.id, true
from public.products product
join (values
  ('br540', 6::numeric, 'RP-BR540-06', 29900, 8400),
  ('br540', 12::numeric, 'RP-BR540-12', 54900, 16800),
  ('oud-satin-mood', 6::numeric, 'RP-OSM-06', 32900, 9000),
  ('oud-satin-mood', 12::numeric, 'RP-OSM-12', 59900, 18000),
  ('purple-oud', 6::numeric, 'RP-PO-06', 34900, 9600),
  ('purple-oud', 12::numeric, 'RP-PO-12', 64900, 19200),
  ('golden-dream', 6::numeric, 'RP-GD-06', 49900, null::integer),
  ('golden-dream', 12::numeric, 'RP-GD-12', 89900, null::integer),
  ('dubai-chocolate', 6::numeric, 'RP-DC-06', 39900, null::integer),
  ('dubai-chocolate', 12::numeric, 'RP-DC-12', 69900, null::integer)
) as variant(slug, size_ml, sku, price_paise, oil_cost_paise)
  on product.slug = variant.slug
join lateral (
  select id from public.bottles
  where volume_ml = variant.size_ml and status = 'active' and archived_at is null
  order by display_order, created_at limit 1
) bottle on true
on conflict (product_id, size_ml) do update set
  sku = excluded.sku,
  price_paise = excluded.price_paise,
  oil_cost_paise = excluded.oil_cost_paise,
  bottle_id = excluded.bottle_id,
  enabled = true,
  updated_at = now();

insert into public.inventory (variant_id, quantity, reserved, low_stock_threshold)
select variant.id, 10, 0, 2
from public.product_variants variant
join public.products product on product.id = variant.product_id
where product.slug in ('br540', 'oud-satin-mood', 'purple-oud', 'golden-dream', 'dubai-chocolate')
on conflict (variant_id) do update set
  quantity = greatest(10, public.inventory.reserved),
  low_stock_threshold = 2,
  updated_at = now();
