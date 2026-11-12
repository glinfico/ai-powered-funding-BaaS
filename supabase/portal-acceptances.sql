-- PPG rules acceptance ledger. Paste in Supabase kpoqglkyvfaztaemhtsa -> SQL Editor.
CREATE TABLE IF NOT EXISTS public.portal_acceptances (
  id serial PRIMARY KEY,
  email text NOT NULL,
  portal text NOT NULL,               -- borrower | broker | lender | investor
  accepted_at timestamp NOT NULL DEFAULT now(),
  UNIQUE (email, portal)
);
SELECT * FROM public.portal_acceptances ORDER BY id DESC LIMIT 10;
