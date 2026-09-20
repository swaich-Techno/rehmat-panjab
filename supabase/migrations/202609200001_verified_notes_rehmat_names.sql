-- Owner-approved public names, descriptions and verified note pyramids, 2026-09-20.
do $$
begin
  if exists(select 1 from public.products where slug='br540')
     and not exists(select 1 from public.products where slug='amber-veil') then
    update public.products set slug='amber-veil' where slug='br540';
  end if;
  if exists(select 1 from public.products where slug='oud-satin-mood')
     and not exists(select 1 from public.products where slug='velvet-oud') then
    update public.products set slug='velvet-oud' where slug='oud-satin-mood';
  end if;
end $$;

update public.products as product
set name = approved.name,
    subtitle = approved.subtitle,
    card_line = approved.tagline,
    micro_description = approved.short_description,
    short_description = approved.short_description,
    description = approved.short_description || E'\n\nFirst impression: ' || approved.first_impression,
    scent_family = approved.scent_family,
    scent_profile = jsonb_build_object(
      'character', approved.mood,
      'journey', jsonb_build_object(
        'opening', approved.first_impression,
        'heart', approved.heart_impression,
        'drydown', approved.base_impression
      )
    ),
    notes = approved.notes,
    notes_verified = true,
    occasions = approved.best_for,
    inspiration_line = null,
    search_aliases = approved.internal_references,
    positioning = null,
    image_alt_text = approved.name || ' concentrated perfume oil in the Rehmat Panjab rose-gold bottle',
    seo_title = approved.name || ' perfume oil',
    seo_description = approved.short_description,
    updated_at = now()
from (values
  (
    'amber-veil', 'Amber Veil', 'Saffron / jasmine / cedarwood', 'Luxury that leaves an impression.',
    'A rich amber fragrance with sweet saffron warmth and smooth woody depth. Designed for people who want a luxurious scent that gets noticed without being overpowering.',
    'Amber · Woody', array['Rich','Luxurious','Confident'],
    '{"top":["Saffron","Sweet Amber"],"heart":["Jasmine"],"base":["Cedarwood","Warm Amber","Soft Woods"]}'::jsonb,
    array['Weddings','Parties','Evening wear'], 'Sweet amber with a luxurious woody finish.', 'Jasmine', 'Cedarwood · Warm Amber · Soft Woods', array['BR540']
  ),
  (
    'velvet-oud', 'Velvet Oud', 'Soft rose / oud / vanilla', 'Soft elegance in every drop.',
    'A smooth blend of velvety rose, refined oud and creamy vanilla that feels elegant, romantic and effortlessly premium.',
    'Floral · Oud · Gourmand', array['Elegant','Romantic','Smooth'],
    '{"top":["Soft Rose"],"heart":["Oud"],"base":["Vanilla","White Musk"]}'::jsonb,
    array['Date nights','Celebrations','Special occasions'], 'Velvety rose wrapped in luxurious oud.', 'Oud', 'Vanilla · White Musk', array['Oud Satin Mood']
  ),
  (
    'purple-oud', 'Purple Oud', 'Warm spice / dark oud / smoky woods', 'Bold. Deep. Unforgettable.',
    'A powerful oud fragrance with smoky woods, warm amber and subtle spice. Crafted for those who prefer a strong, mysterious scent.',
    'Woody · Amber · Spicy', array['Bold','Powerful','Mysterious'],
    '{"top":["Warm Spice"],"heart":["Dark Oud"],"base":["Amber","Smoky Woods"]}'::jsonb,
    array['Evening wear','Winter','Formal events'], 'Deep oud with smoky amber richness.', 'Dark Oud', 'Amber · Smoky Woods', array[]::text[]
  ),
  (
    'golden-dream', 'Golden Dream', 'Vanilla / caramel / creamy musk', 'Comfort wrapped in luxury.',
    'A warm gourmand fragrance with creamy vanilla, caramel sweetness and soft amber that feels comforting while maintaining a premium character.',
    'Gourmand · Amber · Musky', array['Warm','Comforting','Premium'],
    '{"top":["Vanilla"],"heart":["Caramel"],"base":["Amber","Creamy Musk"]}'::jsonb,
    array['Everyday wear','Gifting','Casual luxury'], 'Sweet creamy warmth that feels luxurious.', 'Caramel', 'Amber · Creamy Musk', array[]::text[]
  ),
  (
    'dubai-chocolate', 'Dubai Chocolate', 'Chocolate / vanilla / hazelnut', 'Sweet luxury inspired by Dubai.',
    'A delicious gourmand fragrance combining rich chocolate, creamy vanilla, roasted hazelnut and warm amber for an addictive scent experience.',
    'Gourmand · Chocolate · Amber', array['Sweet','Addictive','Modern'],
    '{"top":["Chocolate"],"heart":["Vanilla"],"base":["Hazelnut","Warm Amber"]}'::jsonb,
    array['Winter','Cafés','Casual outings','Gifting'], 'Rich chocolate with warm vanilla sweetness.', 'Vanilla', 'Hazelnut · Warm Amber', array[]::text[]
  )
) as approved(
  slug, name, subtitle, tagline, short_description, scent_family, mood, notes,
  best_for, first_impression, heart_impression, base_impression, internal_references
)
where product.slug = approved.slug;
