-- Correct the public-facing inspiration spelling without changing product identity or commerce data.
update public.products
set
  name = replace(name, 'Mon Paris', 'Moon Paris'),
  subtitle = replace(subtitle, 'Mon Paris', 'Moon Paris'),
  description = replace(description, 'Mon Paris', 'Moon Paris'),
  short_description = replace(short_description, 'Mon Paris', 'Moon Paris'),
  micro_description = replace(micro_description, 'Mon Paris', 'Moon Paris'),
  card_line = replace(card_line, 'Mon Paris', 'Moon Paris'),
  inspiration_line = replace(inspiration_line, 'Mon Paris', 'Moon Paris'),
  search_aliases = array_replace(search_aliases, 'Mon Paris', 'Moon Paris'),
  image_alt_text = replace(image_alt_text, 'Mon Paris', 'Moon Paris'),
  seo_title = replace(seo_title, 'Mon Paris', 'Moon Paris'),
  seo_description = replace(seo_description, 'Mon Paris', 'Moon Paris'),
  updated_at = now()
where slug = 'mahnoor';

update public.tester_product_intake intake
set
  supplier_reference = replace(intake.supplier_reference, 'Mon Paris', 'Moon Paris'),
  updated_at = now()
from public.products product
where product.id = intake.product_id and product.slug = 'mahnoor';

do $$
declare
  product_row public.products%rowtype;
begin
  select * into product_row from public.products where slug = 'mahnoor';
  if product_row.slug is null then
    raise exception 'Moon Paris correction target mahnoor was not found';
  end if;
  if product_row.name like '%Mon Paris%' or coalesce(product_row.inspiration_line, '') like '%Mon Paris%' then
    raise exception 'Moon Paris correction did not complete';
  end if;
end $$;
