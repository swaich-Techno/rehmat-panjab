-- Additive customer-address and hybrid Rehmat Guide readiness.
-- Products, variants, inventory, reviews and historical order values are untouched.

create table if not exists public.customer_addresses(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null check(char_length(recipient_name) between 1 and 100),
  mobile text not null check(mobile ~ '^\+91[6-9][0-9]{9}$'),
  alternate_mobile text check(alternate_mobile is null or alternate_mobile ~ '^\+91[6-9][0-9]{9}$'),
  email text not null check(char_length(email) between 3 and 160),
  house text not null check(char_length(house) between 1 and 160),
  street_village text not null check(char_length(street_village) between 1 and 160),
  locality text not null check(char_length(locality) between 1 and 120),
  landmark text check(landmark is null or char_length(landmark)<=120),
  city text not null check(char_length(city) between 1 and 100),
  district text not null check(char_length(district) between 1 and 100),
  state text not null check(char_length(state) between 1 and 100),
  pin_code text not null check(pin_code ~ '^[0-9]{6}$'),
  country text not null default 'India' check(country='India'),
  address_type text not null default 'Home' check(address_type in ('Home','Work','Other')),
  instructions text check(instructions is null or char_length(instructions)<=240),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses(user_id,created_at desc);
create unique index if not exists customer_addresses_one_default_idx on public.customer_addresses(user_id) where is_default;
alter table public.customer_addresses enable row level security;
drop policy if exists "customers manage own addresses" on public.customer_addresses;
create policy "customers manage own addresses" on public.customer_addresses for all using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "admins read customer addresses" on public.customer_addresses;
create policy "admins read customer addresses" on public.customer_addresses for select using(public.is_admin());
grant select,insert,update,delete on public.customer_addresses to authenticated;

alter table public.orders add column if not exists billing_snapshot jsonb;
alter table public.whatsapp_order_confirmations add column if not exists delivery_address_snapshot jsonb;

create table if not exists public.fragrance_knowledge(
  id uuid primary key default gen_random_uuid(),topic text not null,aliases text[] not null default '{}',explanation text not null,
  source_title text not null,source_url text not null,source_license text not null,last_reviewed date not null,
  approval_status text not null default 'draft' check(approval_status in ('draft','approved','archived')),active boolean not null default true,version integer not null default 1,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(topic,version)
);
alter table public.fragrance_knowledge enable row level security;
create policy "public reads approved fragrance knowledge" on public.fragrance_knowledge for select using(active and approval_status='approved');
create policy "admins manage fragrance knowledge" on public.fragrance_knowledge for all using(public.is_admin()) with check(public.is_admin());
grant select on public.fragrance_knowledge to anon,authenticated;

with knowledge(topic,aliases,explanation,source_title,source_url) as (values
('Attar',array['ittar'],'Attar commonly refers to a concentrated fragrance material traditionally worn in small amounts.','Ittar','https://en.wikipedia.org/wiki/Ittar'),
('Perfume oil',array['oil perfume'],'Perfume oil is a fragrance format carried in oil rather than an alcohol-led spray base.','Perfume','https://en.wikipedia.org/wiki/Perfume'),
('Oud',array['agarwood','oudh'],'Oud is the aromatic resinous wood associated with agarwood, often described as deep, woody and complex.','Agarwood','https://en.wikipedia.org/wiki/Agarwood'),
('Musk',array['musky'],'Musk describes a fragrance character that may feel soft, warm, clean or animalic depending on the composition.','Musk','https://en.wikipedia.org/wiki/Musk'),
('Amber',array['ambery'],'Amber in perfumery is an accord: a warm, resinous impression rather than the fossilised gemstone.','Ambergris','https://en.wikipedia.org/wiki/Ambergris'),
('Fragrance families',array['scent families'],'Fragrance families group scents by their dominant character, such as floral, woody, amber or fresh.','Fragrance wheel','https://en.wikipedia.org/wiki/Fragrance_wheel'),
('Top notes',array['opening notes'],'Top notes are the first aromatic impressions perceived after application and usually lead into the heart.','Note (perfumery)','https://en.wikipedia.org/wiki/Note_(perfumery)'),
('Heart notes',array['middle notes'],'Heart notes form the central character of a fragrance after the opening begins to soften.','Note (perfumery)','https://en.wikipedia.org/wiki/Note_(perfumery)'),
('Base notes',array['dry down','drydown'],'Base notes support the fragrance and become more apparent as the opening and heart evolve.','Note (perfumery)','https://en.wikipedia.org/wiki/Note_(perfumery)'),
('Floral',array['flowers'],'Floral describes fragrance profiles centred on impressions of flowers or floral accords.','Floral scent','https://en.wikipedia.org/wiki/Floral_scent'),
('Woody',array['wood'],'Woody profiles emphasise impressions such as dry woods, resinous woods or earthy warmth.','Fragrance wheel','https://en.wikipedia.org/wiki/Fragrance_wheel'),
('Fruity',array['fruit'],'Fruity profiles evoke fresh, tart, juicy or sweet fruit impressions.','Fragrance wheel','https://en.wikipedia.org/wiki/Fragrance_wheel'),
('Gourmand',array['edible sweet'],'Gourmand fragrances use edible-seeming impressions such as vanilla, caramel or cocoa.','Gourmand (fragrance)','https://en.wikipedia.org/wiki/Gourmand_(fragrance)'),
('Layering',array['combine fragrances'],'Layering means wearing more than one fragrance to create a personal combined impression; start lightly and evaluate on skin.','Perfume','https://en.wikipedia.org/wiki/Perfume'),
('Pulse points',array['where to apply'],'Pulse points are warm areas such as wrists or the neck where fragrance is often applied sparingly.','Perfume','https://en.wikipedia.org/wiki/Perfume')
)
insert into public.fragrance_knowledge(topic,aliases,explanation,source_title,source_url,source_license,last_reviewed,approval_status,active,version)
select topic,aliases,explanation,source_title,source_url,'CC BY-SA 4.0','2026-09-10','approved',true,1 from knowledge on conflict(topic,version) do nothing;

alter table public.experience_settings add column if not exists guide_general_knowledge boolean not null default true;
alter table public.experience_settings add column if not exists guide_product_grounding boolean not null default true;
alter table public.experience_settings add column if not exists guide_emergency_disable boolean not null default false;
alter table public.experience_settings add column if not exists guide_model text not null default '';
alter table public.experience_settings add column if not exists guide_daily_limit integer not null default 100 check(guide_daily_limit between 1 and 10000);
alter table public.experience_settings add column if not exists guide_timeout_ms integer not null default 8000 check(guide_timeout_ms between 1000 and 20000);
alter table public.experience_settings add column if not exists guide_max_tokens integer not null default 240 check(guide_max_tokens between 64 and 1000);
alter table public.experience_settings add column if not exists guide_usage_count integer not null default 0;
update public.experience_settings set guide_provider='deterministic',guide_emergency_disable=false where id=true;

drop view if exists public.public_experience_settings;
create view public.public_experience_settings as
select id,layering_enabled,layering_max_fragrances,featured_prompts,suggested_moods,suggested_occasions,safety_notice,product_exclusions,example_combinations,quiz_enabled,quiz_questions,portrait_words,portrait_descriptions,whatsapp_enabled,whatsapp_number,whatsapp_default_message,whatsapp_notice,
  guide_enabled,guide_greeting,guide_prompts,guide_allowed_products,guide_excluded_products,guide_safety_response,guide_escalation_message,guide_max_recommendations,guide_provider,guide_deterministic_fallback,guide_rate_limit,guide_general_knowledge,guide_product_grounding,guide_emergency_disable,guide_model,guide_daily_limit,guide_timeout_ms,guide_max_tokens,updated_at
from public.experience_settings where id=true;
grant select on public.public_experience_settings to anon,authenticated;
