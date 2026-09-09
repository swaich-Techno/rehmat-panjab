-- Additive media roles and deterministic Rehmat Guide settings.
-- Existing products, variants, inventory, reviews, orders and saved experiences are untouched.
create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  role text not null check (role in ('product','card','hero','mood','social')),
  storage_path text not null,
  alt_text text not null check (char_length(alt_text) between 3 and 240),
  is_generated boolean not null default false,
  status text not null default 'active' check (status in ('active','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create unique index if not exists product_media_active_role_idx on public.product_media(product_id,role) where status='active';
create index if not exists product_media_product_idx on public.product_media(product_id,sort_order,created_at);
alter table public.product_media enable row level security;
drop policy if exists "public reads active product media" on public.product_media;
create policy "public reads active product media" on public.product_media for select using (
  status='active' and exists(select 1 from public.products p where p.id=product_id and p.status in ('active','coming_soon','sold_out'))
);
drop policy if exists "admins manage product media" on public.product_media;
create policy "admins manage product media" on public.product_media for all using (public.is_admin()) with check (public.is_admin());
grant select on public.product_media to anon,authenticated;

with media(slug,role,path,alt,sort_order) as (values
  ('musk-rizali','card','/images/products/campaign/musk-rizali-card.webp','Musk Rizali campaign artwork by Rehmat Panjab',10),('musk-rizali','hero','/images/products/campaign/musk-rizali-hero.webp','Musk Rizali campaign artwork by Rehmat Panjab',20),('musk-rizali','mood','/images/products/campaign/musk-rizali-mood.webp','Musk Rizali campaign artwork by Rehmat Panjab',30),('musk-rizali','social','/images/products/campaign/musk-rizali-social.webp','Musk Rizali campaign artwork by Rehmat Panjab',40),
  ('vanilla-musk','card','/images/products/campaign/vanilla-musk-card.webp','Vanilla Musk campaign artwork by Rehmat Panjab',10),('vanilla-musk','hero','/images/products/campaign/vanilla-musk-hero.webp','Vanilla Musk campaign artwork by Rehmat Panjab',20),('vanilla-musk','mood','/images/products/campaign/vanilla-musk-mood.webp','Vanilla Musk campaign artwork by Rehmat Panjab',30),('vanilla-musk','social','/images/products/campaign/vanilla-musk-social.webp','Vanilla Musk campaign artwork by Rehmat Panjab',40),
  ('white-oud','card','/images/products/campaign/white-oud-card.webp','White Oud campaign artwork by Rehmat Panjab',10),('white-oud','hero','/images/products/campaign/white-oud-hero.webp','White Oud campaign artwork by Rehmat Panjab',20),('white-oud','mood','/images/products/campaign/white-oud-mood.webp','White Oud campaign artwork by Rehmat Panjab',30),('white-oud','social','/images/products/campaign/white-oud-social.webp','White Oud campaign artwork by Rehmat Panjab',40),
  ('oud-rose','card','/images/products/campaign/oud-rose-card.webp','Oud Rose campaign artwork by Rehmat Panjab',10),('oud-rose','hero','/images/products/campaign/oud-rose-hero.webp','Oud Rose campaign artwork by Rehmat Panjab',20),('oud-rose','mood','/images/products/campaign/oud-rose-mood.webp','Oud Rose campaign artwork by Rehmat Panjab',30),('oud-rose','social','/images/products/campaign/oud-rose-social.webp','Oud Rose campaign artwork by Rehmat Panjab',40),
  ('junoon','card','/images/products/campaign/junoon-card.webp','JUNOON campaign artwork by Rehmat Panjab',10),('junoon','hero','/images/products/campaign/junoon-hero.webp','JUNOON campaign artwork by Rehmat Panjab',20),('junoon','mood','/images/products/campaign/junoon-mood.webp','JUNOON campaign artwork by Rehmat Panjab',30),('junoon','social','/images/products/campaign/junoon-social.webp','JUNOON campaign artwork by Rehmat Panjab',40),
  ('red-musk','card','/images/products/campaign/red-musk-card.webp','Red Musk campaign artwork by Rehmat Panjab',10),('red-musk','hero','/images/products/campaign/red-musk-hero.webp','Red Musk campaign artwork by Rehmat Panjab',20),('red-musk','mood','/images/products/campaign/red-musk-mood.webp','Red Musk campaign artwork by Rehmat Panjab',30),('red-musk','social','/images/products/campaign/red-musk-social.webp','Red Musk campaign artwork by Rehmat Panjab',40),
  ('nazakat','card','/images/products/campaign/nazakat-card.webp','NAZAKAT campaign artwork by Rehmat Panjab',10),('nazakat','hero','/images/products/campaign/nazakat-hero.webp','NAZAKAT campaign artwork by Rehmat Panjab',20),('nazakat','mood','/images/products/campaign/nazakat-mood.webp','NAZAKAT campaign artwork by Rehmat Panjab',30),('nazakat','social','/images/products/campaign/nazakat-social.webp','NAZAKAT campaign artwork by Rehmat Panjab',40),
  ('zara-candy','card','/images/products/campaign/zara-candy-card.webp','Zara Candy campaign artwork by Rehmat Panjab',10),('zara-candy','hero','/images/products/campaign/zara-candy-hero.webp','Zara Candy campaign artwork by Rehmat Panjab',20),('zara-candy','mood','/images/products/campaign/zara-candy-mood.webp','Zara Candy campaign artwork by Rehmat Panjab',30),('zara-candy','social','/images/products/campaign/zara-candy-social.webp','Zara Candy campaign artwork by Rehmat Panjab',40),
  ('deer-musk','card','/images/products/campaign/deer-musk-card.webp','Deer Musk campaign artwork by Rehmat Panjab',10),('deer-musk','hero','/images/products/campaign/deer-musk-hero.webp','Deer Musk campaign artwork by Rehmat Panjab',20),('deer-musk','mood','/images/products/campaign/deer-musk-mood.webp','Deer Musk campaign artwork by Rehmat Panjab',30),('deer-musk','social','/images/products/campaign/deer-musk-social.webp','Deer Musk campaign artwork by Rehmat Panjab',40),
  ('afsoon','card','/images/products/campaign/afsoon-card.webp','AFSOON campaign artwork by Rehmat Panjab',10),('afsoon','hero','/images/products/campaign/afsoon-hero.webp','AFSOON campaign artwork by Rehmat Panjab',20),('afsoon','mood','/images/products/campaign/afsoon-mood.webp','AFSOON campaign artwork by Rehmat Panjab',30),('afsoon','social','/images/products/campaign/afsoon-social.webp','AFSOON campaign artwork by Rehmat Panjab',40)
)
insert into public.product_media(product_id,role,storage_path,alt_text,is_generated,sort_order)
select p.id,m.role,m.path,m.alt,true,m.sort_order from media m join public.products p on p.slug=m.slug
on conflict (product_id,role) where status='active' do update set storage_path=excluded.storage_path,alt_text=excluded.alt_text,is_generated=true,sort_order=excluded.sort_order,updated_at=now();

with media(slug,card,hero,social,alt) as (values
  ('musk-rizali','/images/products/campaign/musk-rizali-card.webp','/images/products/campaign/musk-rizali-hero.webp','/images/products/campaign/musk-rizali-social.webp','Musk Rizali campaign artwork by Rehmat Panjab'),
  ('vanilla-musk','/images/products/campaign/vanilla-musk-card.webp','/images/products/campaign/vanilla-musk-hero.webp','/images/products/campaign/vanilla-musk-social.webp','Vanilla Musk campaign artwork by Rehmat Panjab'),
  ('white-oud','/images/products/campaign/white-oud-card.webp','/images/products/campaign/white-oud-hero.webp','/images/products/campaign/white-oud-social.webp','White Oud campaign artwork by Rehmat Panjab'),
  ('oud-rose','/images/products/campaign/oud-rose-card.webp','/images/products/campaign/oud-rose-hero.webp','/images/products/campaign/oud-rose-social.webp','Oud Rose campaign artwork by Rehmat Panjab'),
  ('junoon','/images/products/campaign/junoon-card.webp','/images/products/campaign/junoon-hero.webp','/images/products/campaign/junoon-social.webp','JUNOON campaign artwork by Rehmat Panjab'),
  ('red-musk','/images/products/campaign/red-musk-card.webp','/images/products/campaign/red-musk-hero.webp','/images/products/campaign/red-musk-social.webp','Red Musk campaign artwork by Rehmat Panjab'),
  ('nazakat','/images/products/campaign/nazakat-card.webp','/images/products/campaign/nazakat-hero.webp','/images/products/campaign/nazakat-social.webp','NAZAKAT campaign artwork by Rehmat Panjab'),
  ('zara-candy','/images/products/campaign/zara-candy-card.webp','/images/products/campaign/zara-candy-hero.webp','/images/products/campaign/zara-candy-social.webp','Zara Candy campaign artwork by Rehmat Panjab'),
  ('deer-musk','/images/products/campaign/deer-musk-card.webp','/images/products/campaign/deer-musk-hero.webp','/images/products/campaign/deer-musk-social.webp','Deer Musk campaign artwork by Rehmat Panjab'),
  ('afsoon','/images/products/campaign/afsoon-card.webp','/images/products/campaign/afsoon-hero.webp','/images/products/campaign/afsoon-social.webp','AFSOON campaign artwork by Rehmat Panjab')
)
update public.products p set image_path=m.card,campaign_image_path=m.hero,og_image_path=m.social,image_alt_text=m.alt,updated_at=now() from media m where p.slug=m.slug;

alter table public.experience_settings add column if not exists guide_enabled boolean not null default true;
alter table public.experience_settings add column if not exists guide_greeting text not null default 'Sat Sri Akal. I''m your Rehmat Guide. Tell me what you would like your fragrance to feel like.';
alter table public.experience_settings add column if not exists guide_prompts text[] not null default array['I want something soft for work.','Show me something under ₹700.','What can I layer with Musk Rizali?','Compare JUNOON and AFSOON.'];
alter table public.experience_settings add column if not exists guide_allowed_products text[] not null default '{}';
alter table public.experience_settings add column if not exists guide_excluded_products text[] not null default array['saffron-amber-oud'];
alter table public.experience_settings add column if not exists guide_approved_facts text not null default '';
alter table public.experience_settings add column if not exists guide_layering_guidance text not null default '';
alter table public.experience_settings add column if not exists guide_safety_response text not null default 'I can offer fragrance guidance, but not medical or allergy guarantees.';
alter table public.experience_settings add column if not exists guide_escalation_message text not null default 'For help with an order, please continue on WhatsApp.';
alter table public.experience_settings add column if not exists guide_max_recommendations integer not null default 3 check (guide_max_recommendations between 1 and 5);
alter table public.experience_settings add column if not exists guide_provider text not null default 'deterministic';
alter table public.experience_settings add column if not exists guide_deterministic_fallback boolean not null default true;
alter table public.experience_settings add column if not exists guide_rate_limit integer not null default 12 check (guide_rate_limit between 1 and 60);

alter table public.experience_request_attempts drop constraint if exists experience_request_attempts_feature_check;
alter table public.experience_request_attempts add constraint experience_request_attempts_feature_check check (feature in ('layering','quiz-save','guide'));
create or replace function public.register_experience_attempt(p_fingerprint text,p_feature text,p_limit integer default 12,p_window_seconds integer default 600)
returns boolean language plpgsql security definer set search_path=public as $$
declare recent_count integer;
begin
  if p_feature not in ('layering','quiz-save','guide') or char_length(p_fingerprint) < 32 then return false; end if;
  delete from public.experience_request_attempts where created_at < now() - interval '24 hours';
  select count(*) into recent_count from public.experience_request_attempts where fingerprint=p_fingerprint and feature=p_feature and created_at > now() - make_interval(secs=>p_window_seconds);
  if recent_count >= p_limit then return false; end if;
  insert into public.experience_request_attempts(fingerprint,feature) values(p_fingerprint,p_feature); return true;
end $$;
revoke all on function public.register_experience_attempt(text,text,integer,integer) from public;
grant execute on function public.register_experience_attempt(text,text,integer,integer) to anon,authenticated;

drop view if exists public.public_experience_settings;
create view public.public_experience_settings as
select id,layering_enabled,layering_max_fragrances,featured_prompts,suggested_moods,suggested_occasions,safety_notice,product_exclusions,example_combinations,quiz_enabled,quiz_questions,portrait_words,portrait_descriptions,whatsapp_enabled,whatsapp_number,whatsapp_default_message,whatsapp_notice,
  guide_enabled,guide_greeting,guide_prompts,guide_allowed_products,guide_excluded_products,guide_safety_response,guide_escalation_message,guide_max_recommendations,guide_provider,guide_deterministic_fallback,guide_rate_limit,updated_at
from public.experience_settings where id=true;
grant select on public.public_experience_settings to anon,authenticated;
