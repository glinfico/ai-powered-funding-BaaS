-- Bulk-code a CSV-imported lead batch with AAI BL codes in a HISTORICAL cohort.
-- Usage: 1) import the CSV via the CCD-V2 (/crm/leads upload or POST /api/leads/import)
--        2) set @batch_id below to the new batch (SELECT max(id) FROM batches;)
--        3) pick the cohort: May 2026 -> '0526'/'M' , June 2026 -> '0626'/'J'
--        4) run in Supabase project kpoqglkyvfaztaemhtsa -> SQL Editor. Idempotent.

DO $$
DECLARE
  v_batch integer := NULL;          -- <<< set to the imported batch id, e.g. 12
  v_cohort text := '0526';          -- <<< '0526' (May) or '0626' (Jun)
  v_letter text := 'M';             -- <<< 'M' for 0526, 'J' for 0626
  v_prefix text := 'BL';            -- Bulk Leads
  v_head text;
  v_start integer := 100001;
  v_done integer;
BEGIN
  IF v_batch IS NULL THEN
    RAISE EXCEPTION 'set v_batch to the imported batch id first';
  END IF;
  v_head := v_prefix || '-' || v_cohort || '-' || v_letter;

  WITH todo AS (
    SELECT id, row_number() OVER (ORDER BY id) AS rn
    FROM leads
    WHERE batch_id = v_batch AND (code = '' OR code IS NULL)
  )
  UPDATE leads t
  SET code = v_head || (v_start + todo.rn - 1)::text,
      tier = 'Syndicated Batch'
  FROM todo
  WHERE t.id = todo.id
  RETURNING t.id INTO v_done;   -- note: RETURNING in DO needs care; count via GET DIAGNOSTICS below

  GET DIAGNOSTICS v_done = ROW_COUNT;

  IF v_done > 0 THEN
    INSERT INTO id_ledger (entity_type, entity_id, from_code, to_code, action, note)
    VALUES ('Bulk Leads', 0, '',
            v_head || v_start || ' … ' || v_head || (v_start + v_done - 1),
            'assign',
            'Backfill ' || v_done || ' leads (CSV batch #' || v_batch || ') with ' || v_prefix || ' codes, cohort ' || v_cohort);
  END IF;

  RAISE NOTICE 'coded % leads in batch % with %…', v_done, v_batch, v_head;
END $$;

-- verify: codes issued for the batch (expect BL-<cohort>-<letter>100001…)
SELECT count(*) AS coded, min(code) AS first_code, max(code) AS last_code
FROM leads WHERE batch_id = (SELECT max(id) FROM batches) AND code LIKE 'BL-%';

SELECT entity_type, action, to_code, note FROM id_ledger ORDER BY id DESC LIMIT 5;
