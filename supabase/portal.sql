-- GLINFICO Admin portal — Supabase setup for the CCD-V2 project.
-- Paste into: Supabase dashboard → SQL Editor → Run. Idempotent (safe to re-run).
-- It does NOT drop/alter existing data or policies; it only makes sure signed-in
-- users can read the CCD tables the portal shows, and seeds the telemetry row if missing.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads','deals','investors','lenders','brokers','term_sheets','commissions',
    'ccd_metrics','tasks','documents','bank_leads','activities','ai_comms','subscribers'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = t
          AND p.cmd = 'SELECT' AND 'authenticated' = ANY(p.roles)
      ) THEN
        EXECUTE format(
          'CREATE POLICY "portal_select" ON public.%I FOR SELECT TO authenticated USING (true)',
          t
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- Telemetry row the dashboard reads (only if the table exists and the row is missing).
DO $$
BEGIN
  IF to_regclass('public.ccd_metrics') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.ccd_metrics (id, updated_at)
      VALUES ('ccd_global_telemetry', now())
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- different shape: the portal derives live counts anyway
    END;
  END IF;
END $$;

-- Sanity check: show what got set up.
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND policyname = 'portal_select'
ORDER BY tablename;
