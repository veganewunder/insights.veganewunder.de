create extension if not exists "pgcrypto";

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram', 'facebook', 'youtube')),
  account_name text not null,
  platform_account_id text not null unique,
  external_channel_or_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_account_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  unique (client_id, account_id)
);

create table if not exists public.insight_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  metric_key text not null,
  metric_label text not null,
  period_key text not null check (period_key in ('7d', '30d', 'daily')),
  value_numeric numeric,
  value_json jsonb,
  start_date date not null,
  end_date date not null,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audience_breakdowns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  breakdown_type text not null check (breakdown_type in ('country', 'city', 'age', 'gender', 'age_gender')),
  dimension_key text not null,
  dimension_label text not null,
  value_numeric numeric not null,
  start_date date not null,
  end_date date not null,
  fetched_at timestamptz not null
);

create table if not exists public.content_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  period_key text not null check (period_key in ('7d', '30d')),
  content_id text not null,
  title text not null,
  platform_label text not null,
  secondary_label text not null,
  primary_value text not null,
  change_label text not null,
  sort_order integer not null default 0,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.media_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  media_id text not null,
  media_kind text not null check (media_kind in ('reel', 'story')),
  title text not null,
  caption text,
  platform_label text not null,
  media_type_label text not null,
  media_url text,
  permalink text,
  published_at timestamptz,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  sort_order integer not null default 0,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  token text not null unique,
  visible_sections_json jsonb not null default '[]'::jsonb,
  password_hash_nullable text,
  expires_at_nullable timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_insight_snapshots_account_period_dates
  on public.insight_snapshots (account_id, period_key, start_date, end_date);

create index if not exists idx_audience_breakdowns_account_type_dates
  on public.audience_breakdowns (account_id, breakdown_type, start_date, end_date);

create index if not exists idx_content_snapshots_account_period
  on public.content_snapshots (account_id, period_key, sort_order);

create index if not exists idx_media_snapshots_account_kind
  on public.media_snapshots (account_id, media_kind, sort_order);

create index if not exists idx_share_links_client_active
  on public.share_links (client_id, is_active);
