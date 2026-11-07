import express from 'express';
import { requireAdmin, supabaseAdmin } from '../middleware/requireAdmin.js';

/**
 * Real CRM data endpoints.
 *
 * WorkspaceDashboard.jsx already calls /api/leads, /api/deals,
 * /api/commissions and /api/funders — all four returned 404, so it fell back
 * to generated arrays:
 *
 *     const MOCK_LEADS   = Array.from({ length: 2002 }, …)
 *     const MOCK_FUNDERS = Array.from({ length: 22450 }, …)
 *
 * and Deals.jsx built its entire screen from generate1000Leads(), which
 * invents businesses called "Enterprise Deal #1 Retail Corp".
 *
 * These endpoints serve the actual Supabase tables. They run with the
 * service_role key so row-level security does not block legitimate staff
 * reads, and they are gated behind an authenticated staff session instead.
 */

const STAFF = new Set(['admin', 'staff', 'broker']);

/** requireAdmin restricted to admin; this variant allows any staff role. */
async function requireStaff(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });

  try {
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'invalid_token' });

    const role = data.user.app_metadata?.role || data.user.user_metadata?.role || 'contact';
    if (!STAFF.has(role)) {
      return res.status(403).json({ error: 'forbidden', message: `Role '${role}' cannot read CRM data.` });
    }
    req.staffUser = { id: data.user.id, email: data.user.email, role };
    next();
  } catch (err) {
    return res.status(503).json({ error: 'unavailable', message: err.message });
  }
}

/** Clamp pagination so one request cannot pull the whole lender table. */
const clamp = (v, def, max) => {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, max);
};

export function createCrmDataRouter() {
  const router = express.Router();

  /** Shared list handler: paginated, counted, honest about failure. */
  function listRoute(path, table, defaultSelect, orderBy) {
    router.get(path, requireStaff, async (req, res) => {
      const limit = clamp(req.query.limit, 100, 1000);
      const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);

      try {
        let q = supabaseAdmin()
          .from(table)
          .select(req.query.select || defaultSelect, { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (orderBy) q = q.order(orderBy, { ascending: false });
        if (req.query.status) q = q.eq('status', req.query.status);
        if (req.query.broker_id) q = q.eq('broker_id', req.query.broker_id);

        const { data, error, count } = await q;

        if (error) {
          // Never substitute invented rows for a failed read.
          return res.status(503).json({
            success: false,
            error: 'query_failed',
            message: error.message,
            table,
          });
        }

        res.json({
          success: true,
          table,
          count: count ?? data?.length ?? 0,
          limit,
          offset,
          data: data || [],
        });
      } catch (err) {
        console.error(`[crmData ${table}]`, err.message);
        res.status(500).json({ success: false, error: 'internal_error' });
      }
    });
  }

  listRoute('/leads',       'leads',       '*', 'created_at');
  listRoute('/deals',       'deals',       '*', 'created_at');
  listRoute('/commissions', 'commissions', '*', 'created_at');
  listRoute('/investors',   'investors',   '*', 'created_at');

  // Funders / lenders. buy_box is large, so the default projection stays lean
  // and the full object is available via ?select=*.
  listRoute(
    '/funders',
    'lenders',
    'id,name,is_active,buy_box,created_at',
    'created_at'
  );
  listRoute(
    '/lenders',
    'lenders',
    'id,name,is_active,buy_box,created_at',
    'created_at'
  );

  /**
   * GET /api/crm/summary
   * Counts straight from the source tables, for the dashboard header.
   * Deliberately not read from ccd_metrics: that table currently reports
   * 8,503 leads while the leads table holds 0, so it is a seeded figure
   * rather than a derived one.
   */
  router.get('/crm/summary', requireStaff, async (req, res) => {
    const tables = ['leads', 'deals', 'lenders', 'investors', 'commissions'];
    const out = {};
    const failed = [];

    await Promise.all(
      tables.map(async (t) => {
        try {
          const { count, error } = await supabaseAdmin()
            .from(t)
            .select('*', { count: 'exact', head: true });
          if (error) { failed.push(t); out[t] = null; }
          else out[t] = count ?? 0;
        } catch {
          failed.push(t);
          out[t] = null;
        }
      })
    );

    res.json({
      success: failed.length === 0,
      counts: out,
      unavailable: failed,
      source: 'source_tables',
      generated_at: new Date().toISOString(),
    });
  });

  return router;
}
