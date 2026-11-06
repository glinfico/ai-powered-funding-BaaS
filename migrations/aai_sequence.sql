-- Durable AAI sequence allocation.
--
-- Replaces the in-memory counters in src/lib/idEngineRunner.js, which reset on
-- every cold start and are not shared across instances. An AAI is a permanent
-- external reference, so it must come from one authoritative counter.
--
-- Apply in Supabase: SQL Editor -> paste -> Run.

create table if not exists aai_sequences (
  key         text primary key,          -- e.g. 'SL_1126'
  current_val bigint not null default 0,
  updated_at  timestamptz not null default now()
);

-- Atomic allocate-and-return. The upsert runs as a single statement, so
-- concurrent callers are serialised by the primary key lock and can never
-- receive the same value.
create or replace function next_aai_sequence(p_key text)
returns bigint
language plpgsql
as $$
declare
  v_next bigint;
begin
  insert into aai_sequences as s (key, current_val, updated_at)
  values (p_key, 1, now())
  on conflict (key) do update
    set current_val = s.current_val + 1,
        updated_at  = now()
  returning s.current_val into v_next;

  return v_next;
end;
$$;

-- Seed the live cohorts so new codes continue past the existing indexed sets
-- rather than colliding with them. Adjust the month suffix to the current
-- cohort (MMYY) before running.
insert into aai_sequences (key, current_val) values
  ('SL_1126', 8000),   -- single leads
  ('BL_1126', 1200),   -- bulk lead batches
  ('L_1126',  22450),  -- lenders / capital partners
  ('I_1126',  3000),   -- LP investors
  ('P_1126',  1500)    -- pro brokers
on conflict (key) do nothing;

-- Only the service role should allocate sequences.
alter table aai_sequences enable row level security;

revoke all on function next_aai_sequence(text) from public, anon, authenticated;
grant execute on function next_aai_sequence(text) to service_role;
