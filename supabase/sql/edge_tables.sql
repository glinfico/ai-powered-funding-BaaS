-- Orchestrator + Hyper-Processor tables (CCD project kpoqglkyvfaztaemhtsa).
-- Only ADDS two tables. RLS on with no policies = only the service role (Edge Functions) can read/write.
create table if not exists intake_register (
  id bigserial primary key,
  entity_type text not null,              -- lead | lender | investor | broker | deal | vendor | partner | sponsor
  entity_table text,                      -- leads | lenders | investors | null (queued: no table yet)
  entity_id bigint,
  source text not null default 'api',     -- dropbox | fei | api | admin ...
  status text not null default 'received',-- received | waiting_aai | aai_ok | enriched | handed_to_engines | queued | error
  aai text,
  payload jsonb,
  ai_profile jsonb,                       -- what Gemini filled (fields + confidence)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists intake_register_status_idx on intake_register (status);

create table if not exists hp_jobs (
  id bigserial primary key,
  register_id bigint references intake_register(id) on delete cascade,
  step text not null,                     -- ide | gemini | engines
  status text not null,                   -- ok | skipped | waiting | error
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists hp_jobs_register_idx on hp_jobs (register_id);

alter table intake_register enable row level security;
alter table hp_jobs enable row level security;

select 'edge tables ready' as status;
