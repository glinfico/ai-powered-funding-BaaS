-- Server-side credential store.
-- Supabase -> SQL Editor -> paste -> Run.
--
-- Replaces browser localStorage as the home for PayPal, IDIQ and FinGoal
-- secrets. Only the service_role key can reach this table, and that key
-- never leaves the server.

create table if not exists platform_credentials (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

-- RLS on with no policy = no access for anon or authenticated.
-- service_role bypasses RLS, so only the backend can read or write.
alter table platform_credentials enable row level security;

revoke all on table platform_credentials from anon, authenticated;

-- Seed the expected keys so the settings screen renders a complete form.
insert into platform_credentials (key, value) values
  ('paypal_client_id', ''),
  ('paypal_secret',    ''),
  ('payout_email',     'closing@glinfico.com'),
  ('idiq_key',         ''),
  ('idiq_secret',      ''),
  ('fingoal_key',      ''),
  ('fingoal_secret',   '')
on conflict (key) do nothing;

-- Verify: this should return 0 rows when run as anon.
-- select * from platform_credentials;
