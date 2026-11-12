-- Add portal type to staff for PPG routing (Borrower/Broker/Lender/Investor).
-- Paste in Supabase project kpoqglkyvfaztaemhtsa -> SQL Editor -> Run.
ALTER TABLE staff ADD COLUMN IF NOT EXISTS portal text NOT NULL DEFAULT 'borrower';
-- Map existing staff by hand if needed, e.g.:
-- UPDATE staff SET portal='broker' WHERE email IN ('...');
SELECT id, email, role, portal FROM staff ORDER BY id;
