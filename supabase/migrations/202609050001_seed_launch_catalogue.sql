-- Safe launch catalogue. Idempotent and intentionally non-transactional.
insert into public.products (
  product_number, name, slug, subtitle, description, short_description,
  status, scent_profile, image_path, featured
)
values
  ('01', 'Musk Rizali', 'musk-rizali', 'Luminous musk / quiet woods', 'Clear light, softened edges, the warmth of skin after dusk.', 'Clear light, softened edges, the warmth of skin after dusk.', 'coming_soon', '{"character":["Clean","Soft","Intimate"]}'::jsonb, '/images/products/musk-rizali.webp', true),
  ('02', 'Vanilla Musk', 'vanilla-musk', 'Creamy warmth / velvet musk', 'A slow amber glow with a soft, comforting finish.', 'A slow amber glow with a soft, comforting finish.', 'coming_soon', '{"character":["Warm","Creamy","Close"]}'::jsonb, '/images/products/vanilla-musk.webp', true),
  ('03', 'Saffron Amber Oud', 'saffron-amber-oud', 'Spiced amber / resinous woods', 'Dense golden warmth moving through a dark, polished room.', 'Dense golden warmth moving through a dark, polished room.', 'coming_soon', '{"character":["Golden","Deep","Evening"]}'::jsonb, '/images/products/saffron-amber-oud.webp', true),
  ('04', 'White Oud', 'white-oud', 'Bright glass / quiet woods', 'Cool light passing through pale wood and clean glass.', 'Cool light passing through pale wood and clean glass.', 'coming_soon', '{"character":["Bright","Dry","Grounded"]}'::jsonb, '/images/products/white-oud.webp', false),
  ('05', 'Oud Rose', 'oud-rose', 'Rose haze / amber woods', 'A deep rose diffusion settling into shadowed warmth.', 'A deep rose diffusion settling into shadowed warmth.', 'coming_soon', '{"character":["Floral","Velvety","Deep"]}'::jsonb, '/images/products/oud-rose.webp', false)
on conflict do nothing;

insert into public.product_variants (product_id, size_ml, sku, price_paise, enabled)
select product.id, format.size_ml, 'DRAFT-RP-' || product.product_number || '-' || lpad(format.size_ml::text, 2, '0'), null, true
from public.products as product
cross join (values (6), (12)) as format(size_ml)
where product.slug in ('musk-rizali', 'vanilla-musk', 'saffron-amber-oud', 'white-oud', 'oud-rose')
on conflict do nothing;

insert into public.inventory (variant_id, quantity, reserved)
select variant.id, 0, 0
from public.product_variants as variant
where variant.sku like 'DRAFT-RP-%'
on conflict (variant_id) do nothing;
