-- Rehmat Panjab core schema. Run in a fresh Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'customer' check (role in ('customer','admin','super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, display_name) values (new.id, new.raw_user_meta_data->>'display_name') on conflict (id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'));
$$;
create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_number text not null unique,
  name text not null,
  slug text not null unique,
  subtitle text not null default '',
  description text not null default '',
  short_description text not null default '',
  scent_family text,
  status text not null default 'draft' check (status in ('draft','coming_soon','active','sold_out','archived')),
  notes jsonb not null default '{}'::jsonb,
  notes_verified boolean not null default false,
  scent_profile jsonb not null default '{}'::jsonb,
  occasions text[] not null default '{}',
  seasons text[] not null default '{}',
  image_path text,
  campaign_image_path text,
  featured boolean not null default false,
  launch_date timestamptz,
  seo_title text,
  seo_description text,
  og_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_featured_idx on public.products(featured) where featured = true;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  size_ml numeric(6,2) not null check (size_ml > 0), sku text not null unique, price_paise integer check (price_paise is null or price_paise >= 0),
  enabled boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(product_id,size_ml)
);
create table if not exists public.inventory (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0), reserved integer not null default 0 check (reserved >= 0 and reserved <= quantity), updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  status text not null default 'request' check (status in ('request','pending','paid','fulfilled','cancelled','refunded')),
  currency text not null default 'INR', subtotal_paise integer, shipping_paise integer, discount_paise integer, total_paise integer,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id,created_at desc);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id), quantity integer not null check (quantity > 0), unit_price_paise integer not null check (unit_price_paise >= 0), created_at timestamptz not null default now()
);

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  consented_to_save boolean not null default false, answers jsonb not null default '[]'::jsonb, completed_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists quiz_sessions_user_idx on public.quiz_sessions(user_id,created_at desc);
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(), session_id uuid not null unique references public.quiz_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, primary_product_id uuid references public.products(id), secondary_product_id uuid references public.products(id),
  profile jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.custom_fragrance_profiles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  opening text not null, heart text not null, base text not null, mood text[] not null default '{}', character text[] not null default '{}', closest_product_id uuid references public.products(id),
  created_at timestamptz not null default now()
);
create table if not exists public.next_drop_campaigns (
  id text primary key, title text not null, stage text not null default 'concept' check (stage in ('concept','community_vote','testing','bottle','arrival')), active boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.next_drop_campaigns(id,title,stage,active) values ('next-rehmat-2026','The next Rehmat','community_vote',true) on conflict (id) do nothing;
create table if not exists public.next_drop_votes (
  id uuid primary key default gen_random_uuid(), campaign_id text not null references public.next_drop_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, answers jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(campaign_id,user_id)
);
create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, email text not null,
  channel text not null check (channel in ('email','sms','whatsapp')), category text not null check (category in ('product_launch','restock','next_drop','reward','order_update')),
  product_slug text not null default '', consented_at timestamptz not null, unsubscribed_at timestamptz, created_at timestamptz not null default now(),
  unique(email,channel,category,product_slug)
);
create index if not exists notification_user_idx on public.notification_subscriptions(user_id);
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, email text not null, product_id uuid references public.products(id), consented_at timestamptz not null, created_at timestamptz not null default now(), unique(email,product_id)
);
create table if not exists public.saved_products (
  user_id uuid not null references auth.users(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id,product_id)
);
create table if not exists public.scent_passports (
  user_id uuid primary key references auth.users(id) on delete cascade, profile jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists public.layering_combinations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  first_product_id uuid not null references public.products(id), second_product_id uuid not null references public.products(id), character text not null, sequence_note text not null, created_at timestamptz not null default now(),
  check (first_product_id <> second_product_id)
);
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, campaign_id text not null references public.next_drop_campaigns(id),
  reward_code text not null unique, percent_off integer check (percent_off between 1 and 100), expires_at timestamptz, usage_limit integer not null default 1 check (usage_limit > 0), used_count integer not null default 0 check (used_count between 0 and usage_limit),
  created_at timestamptz not null default now(), unique(user_id,campaign_id)
);
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references auth.users(id) on delete set null,
  action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key, user_id uuid references auth.users(id) on delete set null,
  event_name text not null, properties jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_results enable row level security;
alter table public.custom_fragrance_profiles enable row level security;
alter table public.next_drop_campaigns enable row level security;
alter table public.next_drop_votes enable row level security;
alter table public.notification_subscriptions enable row level security;
alter table public.waitlist enable row level security;
alter table public.saved_products enable row level security;
alter table public.scent_passports enable row level security;
alter table public.layering_combinations enable row level security;
alter table public.rewards enable row level security;
alter table public.audit_logs enable row level security;
alter table public.analytics_events enable row level security;

create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "products public verified read" on public.products for select using (status in ('coming_soon','active','sold_out') or public.is_admin());
create policy "products super admin write" on public.products for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "variants public enabled read" on public.product_variants for select using (enabled = true or public.is_admin());
create policy "variants super admin write" on public.product_variants for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "inventory public enabled read" on public.inventory for select using (exists(select 1 from public.product_variants v where v.id = variant_id and v.enabled) or public.is_admin());
create policy "inventory admin write" on public.inventory for all using (public.is_admin()) with check (public.is_admin());
create policy "orders own read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders own request" on public.orders for insert with check (user_id = auth.uid() and status = 'request');
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "order items own read" on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "quiz own" on public.quiz_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "quiz results own" on public.quiz_results for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "portraits own" on public.custom_fragrance_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "campaigns public read" on public.next_drop_campaigns for select using (true);
create policy "campaigns admin write" on public.next_drop_campaigns for all using (public.is_admin()) with check (public.is_admin());
create policy "votes own" on public.next_drop_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subscriptions consented insert" on public.notification_subscriptions for insert with check (channel = 'email' and consented_at is not null and (user_id is null or user_id = auth.uid()));
create policy "subscriptions own read" on public.notification_subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "subscriptions own unsubscribe" on public.notification_subscriptions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "waitlist consented insert" on public.waitlist for insert with check (consented_at is not null and (user_id is null or user_id = auth.uid()));
create policy "saved products own" on public.saved_products for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "passport own" on public.scent_passports for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "layers own" on public.layering_combinations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "rewards own read" on public.rewards for select using (user_id = auth.uid() or public.is_admin());
create policy "rewards admin write" on public.rewards for all using (public.is_admin()) with check (public.is_admin());
create policy "audit admin read" on public.audit_logs for select using (public.is_admin());
create policy "audit admin insert" on public.audit_logs for insert with check (public.is_admin() and actor_id = auth.uid());
create policy "analytics insert" on public.analytics_events for insert with check (user_id is null or user_id = auth.uid());
create policy "analytics admin read" on public.analytics_events for select using (public.is_admin());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
create policy "product images public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product images super admin insert" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_super_admin());
create policy "product images super admin update" on storage.objects for update using (bucket_id = 'product-images' and public.is_super_admin()) with check (bucket_id = 'product-images' and public.is_super_admin());
create policy "product images super admin delete" on storage.objects for delete using (bucket_id = 'product-images' and public.is_super_admin());
