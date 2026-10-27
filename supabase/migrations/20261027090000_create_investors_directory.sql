-- GLINFICO investor directory table.
-- This creates storage only; it does not fabricate or import investor records.
create table if not exists public.investors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  investor_type text,
  check_size_min numeric,
  check_size_max numeric,
  asset_focus text,
  contact_name text,
  email text,
  phone text,
  status text not null default 'prospect',
  rating text,
  source text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists investors_name_search_idx
  on public.investors using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(asset_focus, '') || ' ' || coalesce(contact_name, '') || ' ' || coalesce(email, '')));
create index if not exists investors_type_idx on public.investors (investor_type);
create index if not exists investors_created_at_idx on public.investors (created_at desc);

alter table public.investors enable row level security;
-- Access is through the authenticated, server-side CCD API using the service role.
-- No anon/authenticated direct-table policies are added.
