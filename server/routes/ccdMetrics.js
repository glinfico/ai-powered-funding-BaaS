import express from 'express';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

/**
 * Lazy client. Creating it at module scope crashed boot when env vars were
 * absent, which took down every route including the healthy ones.
 * `ws` is supplied as the realtime transport because supabase-js v2.109
 * has no native WebSocket on Node < 22.
 */
let _supabase = null;
function db() {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY).');
    }
    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      realtime: { transport: ws },
    });
  }
  return _supabase;
}

/**
 * Derive live counts directly from the source tables.
 * Used when the aggregate telemetry row has not been written yet, so the
 * dashboard can still show something true rather than something invented.
 */
async function deriveCounts(client) {
  const countOf = async (table) => {
    const { count, error } = await client
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  };

  const [total_leads, total_lenders, total_investors, total_deals] = await Promise.all([
    countOf('leads'),
    countOf('lenders'),
    countOf('investors'),
    countOf('deals'),
  ]);

  const { count: ide_verified } = await client
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('ide_verified', true);

  return {
    total_leads,
    total_lenders,
    total_investors,
    total_deals,
    ide_verified: ide_verified ?? 0,
    source: 'derived',
  };
}

/**
 * GET /api/ccd/metrics
 *
 * Returns live telemetry, or an explicit unavailable state.
 *
 * This route previously answered every failure — bad credentials, missing
 * table, network error, missing row — with a hardcoded block:
 *
 *     total_leads: 8503, ace_approved: 6064, total_lenders: 22450,
 *     platform_volume: 2011750683, updated_at: new Date()
 *
 * sent as `success: true` with a fresh timestamp. A completely
 * disconnected backend rendered as a healthy $2.01bn dashboard. Those
 * figures are never fabricated now; if the data cannot be read the caller
 * is told so and the UI can render an unavailable state.
 */
router.get('/api/ccd/metrics', async (req, res) => {
  let client;
  try {
    client = db();
  } catch (err) {
    return res.status(503).json({
      success: false,
      status: 'unconfigured',
      error: err.message,
      metrics: null,
    });
  }

  try {
    const { data, error } = await client
      .from('ccd_metrics')
      .select('*')
      .eq('id', 'ccd_global_telemetry')
      .single();

    if (!error && data) {
      return res.status(200).json({
        success: true,
        status: 'live',
        metrics: { ...data, source: 'telemetry_table' },
      });
    }

    // Telemetry row missing — count the real tables instead of inventing.
    try {
      const derived = await deriveCounts(client);
      return res.status(200).json({
        success: true,
        status: 'derived',
        note: 'ccd_metrics row not found; counts derived live from source tables.',
        metrics: { ...derived, updated_at: new Date().toISOString() },
      });
    } catch (deriveErr) {
      return res.status(503).json({
        success: false,
        status: 'unavailable',
        error: `Telemetry row missing and live counts failed: ${deriveErr.message}`,
        metrics: null,
      });
    }
  } catch (err) {
    console.error('[CCD] metrics read failed:', err.message);
    return res.status(503).json({
      success: false,
      status: 'unavailable',
      error: err.message,
      metrics: null,
    });
  }
});

export default router;
