-- Final approved catalogue, moderated reviews, and owner-managed layering drafts.
-- The seed marker makes the opening inventory assignment safe to rerun without
-- restoring stock after a sale.
create table if not exists public.catalogue_seed_versions (
  version text primary key,
  applied_at timestamptz not null default now()
);

alter table public.products add column if not exists reviews_enabled boolean not null default true;
alter table public.inventory add column if not exists low_stock_threshold integer not null default 2 check (low_stock_threshold >= 0);

do $$
begin
  if not exists (select 1 from public.catalogue_seed_versions where version = 'final-catalogue-2026-09') then
    update public.products as product
    set status = 'active',
        short_description = approved.short_description,
        description = approved.description,
        scent_profile = jsonb_build_object('character', approved.character),
        occasions = approved.occasions,
        reviews_enabled = true,
        updated_at = now()
    from (values
      ('musk-rizali',
       'A soft and elegant musk fragrance with a warm, comforting character designed for effortless everyday wear.',
       E'Musk Rizali opens with a gentle sense of freshness before settling into a soft, warm and comforting musky character. Its smooth composition feels clean and composed, creating a fragrance that remains elegant without becoming overpowering.\n\nAs it develops on the skin, the fragrance becomes warmer and more intimate. The soft musky character is supported by a refined sense of depth, giving Musk Rizali a balanced presence suitable for both everyday routines and meaningful occasions.\n\nDesigned for effortless wear, Musk Rizali works well during the day or evening. It can accompany work, social gatherings, celebrations, prayer or quiet personal moments. Its understated personality makes it a versatile choice for anyone who appreciates fragrances that feel graceful, comforting and quietly confident.',
       array['Clean','Warm','Soft','Refined','Comforting','Intimate','Unisex'],
       array['Everyday wear','Work and professional settings','Evening gatherings','Weddings and celebrations','Personal reflection','Gifting']),
      ('vanilla-musk',
       'A smooth and comforting fragrance that brings creamy vanilla together with soft musk for a warm and inviting experience.',
       E'Vanilla Musk is a warm and comforting fragrance built around the familiar sweetness of vanilla and the softness of musk. The opening feels smooth and inviting, introducing a creamy sweetness that is noticeable without feeling sharp or excessively heavy.\n\nAs the fragrance settles, the vanilla becomes softer and blends into a clean musky character. This creates a cosy and balanced impression that stays close to the wearer while maintaining enough warmth to feel distinctive.\n\nVanilla Musk is designed for relaxed everyday wear, quiet evenings and cooler weather. Its approachable sweetness also makes it suitable for gifting or for anyone beginning to explore concentrated fragrance oils.',
       array['Creamy','Sweet','Warm','Musky','Cosy','Inviting','Unisex'],
       array['Everyday wear','Relaxed evenings','Cooler weather','Casual gatherings','Layering','Gifting']),
      ('saffron-amber-oud',
       'A rich and expressive fragrance combining the warmth of saffron and amber with the depth and presence of oud.',
       E'Saffron Amber Oud is a rich fragrance created for those who enjoy warmth, depth and a more expressive presence. Its opening introduces the distinctive warmth of saffron, setting a refined and luxurious tone from the first application.\n\nThe fragrance develops into a deep amber character that brings smoothness and warmth to the composition. Oud gives the fragrance its darker woody foundation, creating contrast and helping the scent feel structured and confident.\n\nDesigned for evenings, celebrations and special occasions, Saffron Amber Oud has a bold personality without losing its sense of balance. It is especially suited to cooler weather and moments when a richer fragrance feels appropriate.',
       array['Warm','Woody','Rich','Bold','Luxurious','Expressive','Unisex'],
       array['Evening wear','Special occasions','Weddings and celebrations','Formal gatherings','Cooler weather','Gifting']),
      ('white-oud',
       'A refined interpretation of oud with a smoother, cleaner and more approachable woody character.',
       E'White Oud offers a smoother and cleaner interpretation of the depth traditionally associated with oud. It begins with a composed woody impression that feels refined, balanced and approachable.\n\nAs it settles, the fragrance develops a soft depth while maintaining its clean character. The result is sophisticated without feeling excessively dark or heavy, making White Oud easier to wear throughout the day.\n\nIts balanced profile makes it suitable for professional settings, formal occasions, evening gatherings and everyday use. White Oud is intended for customers who appreciate woody fragrances but prefer a softer and more restrained presentation.',
       array['Clean','Woody','Smooth','Balanced','Sophisticated','Refined','Unisex'],
       array['Everyday wear','Work and professional settings','Formal occasions','Evening gatherings','Layering','Gifting']),
      ('oud-rose',
       'A graceful meeting of expressive rose and deep oud, creating a warm floral-woody fragrance with elegance and presence.',
       E'Oud Rose brings together the expressive character of rose and the depth of oud. The fragrance opens with a noticeable floral presence that feels graceful and confident rather than overly delicate.\n\nAs it develops, the deeper woody character of oud begins to support the rose. This creates a balanced contrast between floral brightness and warm depth, giving the fragrance an elegant and memorable personality.\n\nOud Rose is well suited to evenings, weddings, celebrations and special occasions. Its floral-woody character also makes it a thoughtful gift for customers looking for something expressive, warm and refined.',
       array['Floral','Woody','Warm','Elegant','Expressive','Refined','Unisex'],
       array['Evening wear','Weddings','Celebrations','Special occasions','Layering','Gifting'])
    ) as approved(slug, short_description, description, character, occasions)
    where product.slug = approved.slug;

    update public.product_variants as variant
    set price_paise = approved.price_paise,
        sku = approved.sku,
        enabled = true,
        updated_at = now()
    from public.products product,
      (values
        ('musk-rizali',6,49900,'RP-MR-06'), ('musk-rizali',12,79900,'RP-MR-12'),
        ('vanilla-musk',6,59900,'RP-VM-06'), ('vanilla-musk',12,85000,'RP-VM-12'),
        ('saffron-amber-oud',6,79900,'RP-SAO-06'), ('saffron-amber-oud',12,119900,'RP-SAO-12'),
        ('white-oud',6,59900,'RP-WO-06'), ('white-oud',12,85000,'RP-WO-12'),
        ('oud-rose',6,69900,'RP-OR-06'), ('oud-rose',12,109900,'RP-OR-12')
      ) as approved(slug,size_ml,price_paise,sku)
    where variant.product_id = product.id and product.slug = approved.slug and variant.size_ml = approved.size_ml;

    update public.inventory as stock
    set quantity = 10, low_stock_threshold = 2, updated_at = now()
    from public.product_variants variant join public.products product on product.id = variant.product_id
    where stock.variant_id = variant.id and product.slug in ('musk-rizali','vanilla-musk','saffron-amber-oud','white-oud','oud-rose');

    insert into public.catalogue_seed_versions(version) values ('final-catalogue-2026-09');
  end if;
end $$;

create table if not exists public.review_settings (
  id boolean primary key default true check (id),
  submissions_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.review_settings(id,submissions_enabled) values (true,true) on conflict (id) do nothing;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  email text not null,
  rating smallint not null check (rating between 1 and 5),
  title text not null check (char_length(title) between 2 and 120),
  body text not null check (char_length(body) between 20 and 2000),
  image_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  verified_purchase boolean not null default false,
  helpful_count integer not null default 0 check (helpful_count >= 0),
  admin_response text,
  reported boolean not null default false,
  original_content jsonb not null default '{}'::jsonb,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_reviews_public_idx on public.product_reviews(product_id,status,created_at desc);
create index if not exists product_reviews_moderation_idx on public.product_reviews(status,reported,created_at desc);

create table if not exists public.review_submission_attempts (
  id bigint generated always as identity primary key,
  fingerprint text not null,
  created_at timestamptz not null default now()
);
create index if not exists review_submission_attempts_lookup_idx on public.review_submission_attempts(fingerprint,created_at desc);

create table if not exists public.layering_presets (
  id uuid primary key default gen_random_uuid(),
  first_product_id uuid not null references public.products(id) on delete cascade,
  second_product_id uuid not null references public.products(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  application_order text,
  application_ratio text,
  combined_character text,
  mood_or_occasion text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (first_product_id <> second_product_id),
  unique(first_product_id,second_product_id)
);
insert into public.layering_presets(first_product_id,second_product_id,status,sort_order)
select first.id, second.id, 'draft', pairing.sort_order
from (values
  ('musk-rizali','vanilla-musk',1), ('musk-rizali','oud-rose',2),
  ('vanilla-musk','saffron-amber-oud',3), ('white-oud','oud-rose',4),
  ('saffron-amber-oud','white-oud',5)
) pairing(first_slug,second_slug,sort_order)
join public.products first on first.slug=pairing.first_slug
join public.products second on second.slug=pairing.second_slug
on conflict (first_product_id,second_product_id) do nothing;

alter table public.catalogue_seed_versions enable row level security;
alter table public.review_settings enable row level security;
alter table public.product_reviews enable row level security;
alter table public.review_submission_attempts enable row level security;
alter table public.layering_presets enable row level security;

drop policy if exists "review settings public read" on public.review_settings;
create policy "review settings public read" on public.review_settings for select using (true);
drop policy if exists "review settings super admin write" on public.review_settings;
create policy "review settings super admin write" on public.review_settings for all using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "reviews admin read" on public.product_reviews;
create policy "reviews admin read" on public.product_reviews for select using (public.is_admin());
drop policy if exists "reviews super admin write" on public.product_reviews;
create policy "reviews super admin write" on public.product_reviews for all using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "layering published read" on public.layering_presets;
create policy "layering published read" on public.layering_presets for select using (status='published' or public.is_admin());
drop policy if exists "layering super admin write" on public.layering_presets;
create policy "layering super admin write" on public.layering_presets for all using (public.is_super_admin()) with check (public.is_super_admin());

revoke all on public.product_reviews from anon, authenticated;
grant select, update on public.product_reviews to authenticated;
create or replace view public.public_product_reviews as
select id,product_id,display_name,rating,title,body,image_path,verified_purchase,helpful_count,admin_response,created_at
from public.product_reviews where status='approved';
grant select on public.public_product_reviews to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('review-images','review-images',false,4194304,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
