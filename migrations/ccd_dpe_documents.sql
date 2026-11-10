-- PRIVATE CCD/DPE documents. Review in a non-production Supabase project first.
-- Apply once through the existing Supabase SQL migration process, not on a live database blindly.
-- No consumer document is made public and authenticated clients have no direct table access.

CREATE TABLE IF NOT EXISTS public.ccd_document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('bank_statement','tax_return','business_license','voided_check','government_id','other')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','received')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  received_at timestamptz,
  UNIQUE (lead_id, document_type)
);

CREATE TABLE IF NOT EXISTS public.ccd_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('bank_statement','tax_return','business_license','voided_check','government_id','other')),
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf','image/png','image/jpeg')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 8388608),
  storage_path text NOT NULL UNIQUE,
  sha256 text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ccd_documents_by_lead ON public.ccd_documents (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ccd_document_requests_by_lead ON public.ccd_document_requests (lead_id);
ALTER TABLE public.ccd_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccd_document_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ccd_documents, public.ccd_document_requests FROM anon, authenticated;

-- The backend service role alone reads/writes metadata; Supabase Storage serves
-- files only via a short-lived URL minted after staff authorization.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ccd-client-documents', 'ccd-client-documents', false, 8388608,
  ARRAY['application/pdf','image/png','image/jpeg']::text[])
ON CONFLICT (id) DO NOTHING;
UPDATE storage.buckets SET public = false WHERE id = 'ccd-client-documents';
