import { normalizeLoanType, getFundingCategory } from './leadNormalization.js';

const isFiniteNumber = (value) =>
  value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

/**
 * ACE orchestration around the existing Smart Router RPC.
 * The matching algorithm itself remains in Supabase's get_smart_funding_matches function.
 */
export async function runSmartFundingMatch(supabase, fundingRequestId) {
  if (!fundingRequestId) throw new Error('fundingRequestId is required');

  const { data, error } = await supabase.rpc(
    'get_smart_funding_matches',
    { p_funding_request_id: fundingRequestId }
  );

  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

/**
 * Re-sync only supplied, supported matching inputs to the lead's existing funding requests,
 * then rerun the existing Smart Router. It never creates duplicate funding requests or
 * changes application/status fields.
 */
export async function runLeadSmartRouting(supabase, leadId, changedFields = {}) {
  if (!leadId) throw new Error('leadId is required');

  const { data: requests, error: readError } = await supabase
    .from('funding_requests')
    .select('id, lead_id, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (readError) throw readError;

  if (!requests?.length) {
    return {
      status: 'skipped',
      lead_id: leadId,
      request_count: 0,
      match_count: 0,
      reason: 'No existing funding request is linked to this lead; ACE did not create a duplicate.'
    };
  }

  const patch = {};
  if (changedFields.loan_type !== undefined && changedFields.loan_type !== null && String(changedFields.loan_type).trim()) {
    const normalizedType = normalizeLoanType(changedFields.loan_type);
    patch.funding_product = normalizedType;
    patch.funding_category = getFundingCategory(normalizedType);
  }
  if (changedFields.loan_amount !== undefined && isFiniteNumber(changedFields.loan_amount) && Number(changedFields.loan_amount) > 0) {
    patch.requested_amount = Number(changedFields.loan_amount);
  }
  if (changedFields.annual_revenue !== undefined && isFiniteNumber(changedFields.annual_revenue)) {
    patch.annual_revenue = Number(changedFields.annual_revenue);
  } else if (changedFields.estimated_revenue !== undefined && isFiniteNumber(changedFields.estimated_revenue)) {
    patch.annual_revenue = Number(changedFields.estimated_revenue);
  }
  if (changedFields.years_in_business !== undefined && isFiniteNumber(changedFields.years_in_business) && Number(changedFields.years_in_business) >= 0) {
    patch.time_in_business_months = Math.round(Number(changedFields.years_in_business) * 12);
  }
  for (const field of ['state', 'industry']) {
    if (changedFields[field] !== undefined && changedFields[field] !== null && String(changedFields[field]).trim()) {
      patch[field] = String(changedFields[field]).trim();
    }
  }

  const results = [];
  for (const request of requests) {
    if (Object.keys(patch).length) {
      const { error: updateError } = await supabase
        .from('funding_requests')
        .update(patch)
        .eq('id', request.id);
      if (updateError) throw updateError;
    }

    const matches = await runSmartFundingMatch(supabase, request.id);
    results.push({ request_id: request.id, match_count: matches.length, matches });
  }

  return {
    status: 'completed',
    lead_id: leadId,
    request_count: results.length,
    match_count: results.reduce((total, result) => total + result.match_count, 0),
    synchronized_fields: Object.keys(patch),
    results
  };
}

export const DEFAULT_AUTOMATION_RULES = [
  {
    id: 'ace-new-lead-smart-routing',
    name: 'New lead → Smart Router',
    trigger: 'new_lead',
    action: 'run_existing_smart_funding_matcher',
    enabled: true,
    description: 'A submitted lead creates its funding request and invokes get_smart_funding_matches.'
  },
  {
    id: 'ace-matching-input-updated',
    name: 'Matching inputs updated → Re-route',
    trigger: 'lead_matching_fields_updated',
    action: 'sync_existing_funding_request_and_rerun_matcher',
    enabled: true,
    description: 'Changes to loan type, amount, revenue, time in business, state, or industry refresh linked requests and rerun the existing matcher.'
  }
];
