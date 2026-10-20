const SUPPORTED_FIELDS = [
  'email', 'phone', 'industry', 'state', 'source', 'status',
  'assigned_to', 'notes', 'idiq_monitoring', 'loan_type',
  'loan_amount', 'credit_score_range', 'years_in_business',
  'priority', 'next_follow_up', 'approved_amount',
  'enrichment_status', 'due_diligence_status',
  'verified_annual_revenue', 'credit_idq_score',
  'credit_idq_summary', 'business_owner_found', 'property_ltv'
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildLeadUpdates(body = {}) {
  const updates = {};

  for (const field of SUPPORTED_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (body.company !== undefined || body.business_name !== undefined) {
    updates.business_name = body.company ?? body.business_name;
  }

  if (body.annual_revenue !== undefined ||
      body.estimated_revenue !== undefined) {
    updates.estimated_revenue =
      body.annual_revenue ?? body.estimated_revenue;
  }

  if (body.contact_name !== undefined) {
    updates.contact_name = String(body.contact_name).trim();
  }

  if (body.assigned_to !== undefined) {
    if (body.assigned_to === null || body.assigned_to === '') {
      updates.assigned_to = null;
    } else if (!UUID_PATTERN.test(String(body.assigned_to))) {
      return {
        updates: {},
        error: 'assigned_to must be a valid broker UUID or null.'
      };
    } else {
      updates.assigned_to = body.assigned_to;
    }
  }

  if (Object.keys(updates).length === 0) {
    return {
      updates,
      error: 'No supported lead fields were provided.'
    };
  }

  return { updates, error: null };
}

export function buildContactName(body, currentContactName = '') {
  if (body.contact_name !== undefined) {
    return String(body.contact_name).trim();
  }

  const parts = String(currentContactName || '')
    .trim().split(/\s+/).filter(Boolean);

  const firstName = body.first_name !== undefined
    ? String(body.first_name || '').trim()
    : parts[0] || '';

  const lastName = body.last_name !== undefined
    ? String(body.last_name || '').trim()
    : parts.slice(1).join(' ');

  return [firstName, lastName].filter(Boolean).join(' ');
}
