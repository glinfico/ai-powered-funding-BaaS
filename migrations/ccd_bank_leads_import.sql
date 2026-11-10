-- Private, auditable Bank Leads intake for the existing CCD.
-- Review/apply in staging Supabase first. Does not alter public FE or the
-- existing leads table. No synthetic consent, credit scores or loan decisions.

CREATE TABLE IF NOT EXISTS public.ccd_bank_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_file_name text NOT NULL,
  source_name text NOT NULL,
  expected_rows integer NOT NULL CHECK (expected_rows BETWEEN 1 AND 20000),
  imported_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.ccd_bank_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  batch_id uuid NOT NULL REFERENCES public.ccd_bank_import_batches(id),
  company_name text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  requested_amount text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Pending Review',
  consent_status text NOT NULL DEFAULT 'unverified',
  source_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ccd_bank_leads_by_created_at ON public.ccd_bank_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS ccd_bank_leads_by_batch ON public.ccd_bank_leads (batch_id);
CREATE INDEX IF NOT EXISTS ccd_bank_leads_by_email ON public.ccd_bank_leads (email);
ALTER TABLE public.ccd_bank_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccd_bank_import_batches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ccd_bank_leads, public.ccd_bank_import_batches FROM anon, authenticated;
-- All reads/writes go through the Render API after Supabase access-token
-- verification and a server-controlled admin/staff app_metadata role check.
