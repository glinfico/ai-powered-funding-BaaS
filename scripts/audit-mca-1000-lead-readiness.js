import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) and server-side SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const [{ data: leads, error: leadsError, count: leadCount }, { data: requests, error: requestsError }, { data: applications, error: applicationsError }] = await Promise.all([
    supabase.from('leads')
      .select('id, industry, estimated_revenue, status, source, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase.from('funding_requests')
      .select('id, lead_id, funding_product, funding_category, requested_amount, annual_revenue, time_in_business_months, router_status, match_count, top_match_score')
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase.from('mca_applications')
      .select('id, status, mca_score, mca_tier, requested_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)
  ]);

  if (leadsError) throw new Error('leads query failed: ' + leadsError.message);
  if (requestsError) throw new Error('funding_requests query failed: ' + requestsError.message);
  if (applicationsError) throw new Error('mca_applications query failed: ' + applicationsError.message);

  const leadIds = new Set((leads || []).map((lead) => lead.id));
  const linkedRequests = (requests || []).filter((request) => leadIds.has(request.lead_id));
  const productCounts = {};
  for (const request of linkedRequests) {
    const product = String(request.funding_product || 'missing').toLowerCase();
    productCounts[product] = (productCounts[product] || 0) + 1;
  }

  const isMCA = (request) => /mca|merchant.*cash.*advance|cash_advance/.test(String(request.funding_product || '').toLowerCase());
  const mcaRequests = linkedRequests.filter(isMCA);
  const missingMcaFields = {
    requested_amount: mcaRequests.filter((r) => !(Number(r.requested_amount) > 0)).length,
    annual_revenue: mcaRequests.filter((r) => !(Number(r.annual_revenue) > 0)).length,
    time_in_business_months: mcaRequests.filter((r) => !(Number(r.time_in_business_months) > 0)).length,
    match_count: mcaRequests.filter((r) => r.match_count == null).length
  };
  const linkedLeadCount = new Set(linkedRequests.map((request) => request.lead_id).filter(Boolean)).size;
  const routedMcaCount = mcaRequests.filter((request) => String(request.router_status || '').toUpperCase() === 'ROUTED').length;
  const matchedMcaCount = mcaRequests.filter((request) => Number(request.match_count) > 0).length;

  console.log(JSON.stringify({
    mode: 'READ_ONLY_AUDIT',
    privacy: 'No names, emails, phone numbers, or raw lead records are printed.',
    lead_table_total: leadCount ?? null,
    leads_sampled: (leads || []).length,
    funding_requests_total_read: (requests || []).length,
    sampled_leads_with_funding_requests: linkedLeadCount,
    sampled_leads_without_funding_requests: Math.max(0, (leads || []).length - linkedLeadCount),
    funding_products_in_sample: productCounts,
    mca_funding_requests: mcaRequests.length,
    mca_requests_with_matches: matchedMcaCount,
    mca_requests_marked_routed: routedMcaCount,
    mca_missing_data_counts: missingMcaFields,
    mca_applications_total_read: (applications || []).length,
    mca_applications_scored: (applications || []).filter((app) => Number.isFinite(Number(app.mca_score))).length,
    mca_applications_with_tier: (applications || []).filter((app) => Boolean(app.mca_tier)).length,
    next_step: 'Use these aggregate counts to choose a safe MCA backfill/routing test. This script does not write data or run underwriting.'
  }, null, 2));
}

main().catch((error) => {
  console.error('MCA readiness audit failed:', error.message);
  process.exit(1);
});
