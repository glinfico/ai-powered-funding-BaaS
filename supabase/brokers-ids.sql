-- Seed the simulated broker list (from the old CCD's BrokerAssignment.jsx) into CCD-V2
-- and assign AAI IDs (P = Pro/Platinum for Senior VP, G = Growth/Gold otherwise).
-- Paste in: Supabase project kpoqglkyvfaztaemhtsa -> SQL Editor -> Run. Idempotent.

CREATE TABLE IF NOT EXISTS public.brokers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  tier text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  assigned_count integer NOT NULL DEFAULT 0,
  self_sourced_count integer NOT NULL DEFAULT 0,
  performance_rate text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now()
);

-- simulated brokers from the old CCD (src/pages/crm/BrokerAssignment.jsx on main)
INSERT INTO public.brokers (name, phone, tier, code, assigned_count, self_sourced_count, performance_rate)
VALUES
  ('Sarah Jenkins',   '(555) 234-8901', 'Senior VP',              'P-1026-O100001', 142, 28, '34.2%'),
  ('Elena Rostova',   '(555) 456-0123', 'Senior VP',              'P-1026-O100002', 145, 42, '38.1%'),
  ('Marcus Vance',    '(555) 345-9012', 'Capital Advisor',        'G-1026-O100001', 138, 31, '31.8%'),
  ('David Chen',      '(555) 567-1234', 'Underwriting Specialist','G-1026-O100002', 139, 19, '29.5%'),
  ('Aisha Patel',     '(555) 678-2345', 'Capital Advisor',        'G-1026-O100003', 141, 25, '35.6%')
ON CONFLICT DO NOTHING;

-- id_ledger entries (entity_type Broker, action assign) — only if not already logged
INSERT INTO public.id_ledger (entity_type, entity_id, from_code, to_code, action, note)
SELECT 'Broker', b.id, '', b.code, 'assign',
       CASE b.code
         WHEN 'P-1026-O100001' THEN 'Pro / Platinum • Oct 2026 Cohort • Account #1'
         WHEN 'P-1026-O100002' THEN 'Pro / Platinum • Oct 2026 Cohort • Account #2'
         WHEN 'G-1026-O100001' THEN 'Growth / Gold • Oct 2026 Cohort • Account #1'
         WHEN 'G-1026-O100002' THEN 'Growth / Gold • Oct 2026 Cohort • Account #2'
         WHEN 'G-1026-O100003' THEN 'Growth / Gold • Oct 2026 Cohort • Account #3'
       END
FROM public.brokers b
WHERE b.code LIKE 'P-1026-%' OR b.code LIKE 'G-1026-%'
  AND NOT EXISTS (SELECT 1 FROM public.id_ledger l WHERE l.entity_type='Broker' AND l.entity_id=b.id AND l.action='assign');

-- verify
SELECT id, name, tier, code FROM public.brokers ORDER BY code;
SELECT entity_type, entity_id, action, to_code FROM public.id_ledger WHERE entity_type='Broker' ORDER BY id;
