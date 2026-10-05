-- Restore owner-approved reference fragrance names without changing product identity or commerce data.
begin;

with approved(slug, display_name, former_name) as (values
  ('junoon','Oud Maracuja','JUNOON'),
  ('nazakat','Delina','NAZAKAT'),
  ('gulnaar','Zara Candy','GULNAAR'),
  ('afsoon','Vampire Blood','AFSOON'),
  ('amber-veil','BR540','Amber Veil'),
  ('velvet-oud','Oud Satin Mood','Velvet Oud'),
  ('purple-oud','Purple Oud','Purple Oud'),
  ('golden-dream','Golden Dream','Golden Dream'),
  ('dubai-chocolate','Dubai Chocolate','Dubai Chocolate'),
  ('mahnoor','Moon Paris','MAHNOOR'),
  ('milaap','Wisal','MILAAP'),
  ('sukoon-oud','Oud Mood','SUKOON OUD'),
  ('shaan-oud','Oud for Glory','SHAAN OUD'),
  ('samandar','Acqua di Giò','SAMANDAR'),
  ('neel','Light Blue','NEEL'),
  ('ishq','Love Spell','ISHQ'),
  ('siyah-oud','Black Oud','SIYAH OUD'),
  ('safaa-musk','Musk Al Tahara','SAFAA MUSK'),
  ('adaa','Bombshell','ADAA')
)
update public.products product
set name = approved.display_name,
    description = regexp_replace(product.description, approved.former_name, approved.display_name, 'gi'),
    short_description = regexp_replace(product.short_description, approved.former_name, approved.display_name, 'gi'),
    micro_description = regexp_replace(coalesce(product.micro_description, ''), approved.former_name, approved.display_name, 'gi'),
    card_line = regexp_replace(coalesce(product.card_line, ''), approved.former_name, approved.display_name, 'gi'),
    inspiration_line = null,
    search_aliases = array(
      select distinct alias
      from unnest(coalesce(product.search_aliases, '{}'::text[]) || array[approved.former_name]) alias
      where nullif(btrim(alias), '') is not null and alias <> approved.display_name
    ),
    image_alt_text = approved.display_name || ' concentrated perfume oil in the Rehmat Panjab rose-gold bottle',
    seo_title = approved.display_name || ' perfume oil',
    seo_description = regexp_replace(coalesce(product.seo_description, product.short_description), approved.former_name, approved.display_name, 'gi'),
    updated_at = now()
from approved
where product.slug = approved.slug;

with approved(slug, display_name, former_name) as (values
  ('junoon','Oud Maracuja','JUNOON'),('nazakat','Delina','NAZAKAT'),
  ('gulnaar','Zara Candy','GULNAAR'),('afsoon','Vampire Blood','AFSOON'),
  ('amber-veil','BR540','Amber Veil'),('velvet-oud','Oud Satin Mood','Velvet Oud'),
  ('mahnoor','Moon Paris','MAHNOOR'),('milaap','Wisal','MILAAP'),
  ('sukoon-oud','Oud Mood','SUKOON OUD'),('shaan-oud','Oud for Glory','SHAAN OUD'),
  ('samandar','Acqua di Giò','SAMANDAR'),('neel','Light Blue','NEEL'),
  ('ishq','Love Spell','ISHQ'),('siyah-oud','Black Oud','SIYAH OUD'),
  ('safaa-musk','Musk Al Tahara','SAFAA MUSK'),('adaa','Bombshell','ADAA')
)
update public.product_media media
set alt_text = regexp_replace(media.alt_text, approved.former_name, approved.display_name, 'gi')
from public.products product, approved
where media.product_id = product.id and product.slug = approved.slug;

do $$
declare invalid_count integer;
begin
  with approved(slug, display_name) as (values
    ('junoon','Oud Maracuja'),('nazakat','Delina'),('gulnaar','Zara Candy'),
    ('afsoon','Vampire Blood'),('amber-veil','BR540'),('velvet-oud','Oud Satin Mood'),
    ('purple-oud','Purple Oud'),('golden-dream','Golden Dream'),('dubai-chocolate','Dubai Chocolate'),
    ('mahnoor','Moon Paris'),('milaap','Wisal'),('sukoon-oud','Oud Mood'),
    ('shaan-oud','Oud for Glory'),('samandar','Acqua di Giò'),('neel','Light Blue'),
    ('ishq','Love Spell'),('siyah-oud','Black Oud'),('safaa-musk','Musk Al Tahara'),('adaa','Bombshell')
  )
  select count(*) into invalid_count
  from approved
  left join public.products product on product.slug=approved.slug
  where product.id is null or product.name<>approved.display_name or product.inspiration_line is not null;
  if invalid_count<>0 then raise exception 'Public product-name verification failed for % products',invalid_count; end if;
end $$;

commit;
