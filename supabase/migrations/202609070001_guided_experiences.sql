-- Owner-managed experience settings and privacy-safe saved layering results.
-- Additive only: existing quiz sessions, results, votes, reviews and orders remain untouched.
create table if not exists public.experience_settings (
  id boolean primary key default true check (id),
  layering_enabled boolean not null default true,
  layering_max_fragrances integer not null default 5 check (layering_max_fragrances between 2 and 5),
  featured_prompts text[] not null default array[
    'What can I layer with Musk Rizali?',
    'Create a warm and elegant combination.',
    'Create a three-fragrance combination for a wedding.',
    'Suggest something soft for everyday use.',
    'Can I combine Vanilla Musk, Oud Rose and White Oud?',
    'Which fragrance should I apply first?',
    'Make this combination lighter.',
    'Suggest an evening combination using available products.'
  ],
  suggested_moods text[] not null default array['Soft','Warm','Elegant','Confident','Calm','Romantic'],
  suggested_occasions text[] not null default array['Everyday','Work','Evening','Wedding','Celebration','Reflection'],
  safety_notice text not null default 'Layering suggestions are creative fragrance guidance. Apply lightly and patch-test products individually before combining them.',
  system_guidance text not null default 'Use only approved catalogue descriptions and character tags. Never infer ingredients, allergens, medical benefits, chemistry, alcohol status, longevity or projection.',
  product_exclusions text[] not null default '{}',
  incompatible_pairs jsonb not null default '[]'::jsonb,
  example_combinations jsonb not null default '[]'::jsonb,
  quiz_enabled boolean not null default true,
  quiz_questions jsonb not null default '[]'::jsonb,
  portrait_words text[] not null default array['Quiet','Golden','Velvet','Soft','Amber','Oud','Rose','Gentle','Saffron','White','Warmth','Radiance','Stillness','Devotion','Horizon','Evening'],
  portrait_descriptions jsonb not null default '{}'::jsonb,
  whatsapp_enabled boolean not null default true,
  whatsapp_number text not null default '917009464475',
  whatsapp_default_message text not null default 'Please confirm availability, delivery charges and payment instructions.',
  whatsapp_notice text not null default 'This opens a manually confirmed order request. It does not place, reserve or pay for an order.',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.experience_settings(id) values (true) on conflict (id) do nothing;

create or replace view public.public_experience_settings as
select id,layering_enabled,layering_max_fragrances,featured_prompts,suggested_moods,suggested_occasions,
  safety_notice,product_exclusions,example_combinations,quiz_enabled,quiz_questions,portrait_words,
  portrait_descriptions,whatsapp_enabled,whatsapp_number,whatsapp_default_message,whatsapp_notice,updated_at
from public.experience_settings where id=true;

create table if not exists public.saved_layering_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  product_slugs text[] not null check (cardinality(product_slugs) between 1 and 5),
  recommendation jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saved_layering_user_idx on public.saved_layering_recommendations(user_id,created_at desc);

create table if not exists public.experience_request_attempts (
  id bigint generated always as identity primary key,
  fingerprint text not null,
  feature text not null check (feature in ('layering','quiz-save')),
  created_at timestamptz not null default now()
);
create index if not exists experience_attempts_lookup_idx on public.experience_request_attempts(fingerprint,feature,created_at desc);

create or replace function public.register_experience_attempt(p_fingerprint text,p_feature text,p_limit integer default 12,p_window_seconds integer default 600)
returns boolean language plpgsql security definer set search_path=public as $$
declare recent_count integer;
begin
  if p_feature not in ('layering','quiz-save') or char_length(p_fingerprint) < 32 then return false; end if;
  delete from public.experience_request_attempts where created_at < now() - interval '24 hours';
  select count(*) into recent_count from public.experience_request_attempts
    where fingerprint=p_fingerprint and feature=p_feature and created_at > now() - make_interval(secs=>p_window_seconds);
  if recent_count >= p_limit then return false; end if;
  insert into public.experience_request_attempts(fingerprint,feature) values(p_fingerprint,p_feature);
  return true;
end $$;

alter table public.experience_settings enable row level security;
alter table public.saved_layering_recommendations enable row level security;
alter table public.experience_request_attempts enable row level security;

drop policy if exists "experience settings admin read" on public.experience_settings;
create policy "experience settings admin read" on public.experience_settings for select using (public.is_admin());
drop policy if exists "experience settings super admin write" on public.experience_settings;
create policy "experience settings super admin write" on public.experience_settings for all using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "saved layers own" on public.saved_layering_recommendations;
create policy "saved layers own" on public.saved_layering_recommendations for all using (user_id=auth.uid()) with check (user_id=auth.uid());

revoke all on public.experience_request_attempts from anon,authenticated;
revoke all on function public.register_experience_attempt(text,text,integer,integer) from public;
grant execute on function public.register_experience_attempt(text,text,integer,integer) to anon,authenticated;
grant select on public.public_experience_settings to anon,authenticated;
