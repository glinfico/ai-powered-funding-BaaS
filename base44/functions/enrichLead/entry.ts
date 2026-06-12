import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * enrichLead — AI-powered lead enrichment:
 *   1. Business credit soft-pull analysis (via LLM with web context)
 *   2. Revenue verification / analysis
 *   3. Property valuation + LTV (for CRE leads)
 *   4. Due diligence risk scoring
 *
 * Called from the frontend after a lead is created/updated.
 * Payload: { lead_id: string }
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lead_id } = await req.json();
  if (!lead_id) {
    return Response.json({ error: 'lead_id is required' }, { status: 400 });
  }

  const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Mark as pending
  await base44.asServiceRole.entities.Lead.update(lead_id, {
    enrichment_status: 'pending',
    due_diligence_status: 'pending',
  });

  const isCRE = ['commercial_real_estate'].includes(lead.loan_type);

  // ── 1. Business Credit & Revenue Analysis ────────────────────────────────
  const creditRevenuePrompt = `
You are a commercial lending underwriter performing a business due diligence analysis.

Analyze the following business/lead profile and provide a structured assessment:

Business Name: ${lead.company || 'Unknown'}
Owner: ${lead.first_name} ${lead.last_name}
Email: ${lead.email || 'N/A'}
Phone: ${lead.phone || 'N/A'}
Loan Type Requested: ${lead.loan_type?.replace(/_/g, ' ') || 'N/A'}
Loan Amount: $${(lead.loan_amount || 0).toLocaleString()}
Self-Reported Annual Revenue: $${(lead.annual_revenue || 0).toLocaleString()}
Self-Reported Credit Score Range: ${lead.credit_score_range || 'unknown'}
Years in Business: ${lead.years_in_business || 'unknown'}

Based on public business data, typical industry benchmarks, and the provided profile:

1. Estimate a plausible business credit score (0-100 Paydex/FICO SBSS equivalent) and explain your reasoning.
2. Map that score to a credit tier: "excellent_750+" (score>=80), "good_700-749" (score 65-79), "fair_650-699" (score 50-64), "poor_below_650" (score<50).
3. Analyze if the self-reported annual revenue of $${(lead.annual_revenue || 0).toLocaleString()} is plausible for "${lead.company}" in their apparent industry. Provide an estimated realistic revenue range.
4. Estimate how many years this business has likely been operating based on web research — search for the company's founding date, registration, or any public records. Return a number.
5. Assess the debt service coverage ratio risk if they borrow $${(lead.loan_amount || 0).toLocaleString()}.
6. Identify any red flags or risk factors in this profile.
7. Provide an overall due diligence risk score from 0 to 100 (100 = lowest risk / cleanest file) with specific reasoning.

Be specific, professional, and base analysis on industry standards for commercial lending.
`;

  const creditSchema = {
    type: 'object',
    properties: {
      estimated_credit_score: { type: 'number' },
      credit_score_tier: { type: 'string' },
      credit_score_summary: { type: 'string' },
      revenue_plausible: { type: 'boolean' },
      estimated_revenue_min: { type: 'number' },
      estimated_revenue_max: { type: 'number' },
      revenue_analysis: { type: 'string' },
      estimated_years_in_business: { type: 'number' },
      years_in_business_source: { type: 'string' },
      dscr_risk: { type: 'string' },
      risk_flags: { type: 'array', items: { type: 'string' } },
      due_diligence_score: { type: 'number' },
      due_diligence_summary: { type: 'string' },
      owner_likely_identified: { type: 'boolean' },
    },
  };

  const creditResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: creditRevenuePrompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: creditSchema,
  });

  // ── 2. Property Valuation (CRE only) ─────────────────────────────────────
  let propertyResult = null;
  if (isCRE && lead.property_address) {
    const propertyPrompt = `
You are a commercial real estate appraiser. Provide a market value estimate for the following property:

Property Address: ${lead.property_address}
Loan Amount Requested: $${(lead.loan_amount || 0).toLocaleString()}
Borrower Business: ${lead.company || 'Unknown'}

Based on publicly available real estate market data:
1. Estimate the current market value of this property.
2. Calculate the loan-to-value (LTV) ratio if they borrow $${(lead.loan_amount || 0).toLocaleString()}.
3. Assess if the LTV is within acceptable commercial lending standards (typically <80%).
4. Note any due diligence items specific to this property/location.
`;
    const propSchema = {
      type: 'object',
      properties: {
        estimated_value: { type: 'number' },
        value_range_low: { type: 'number' },
        value_range_high: { type: 'number' },
        ltv_percent: { type: 'number' },
        ltv_acceptable: { type: 'boolean' },
        property_notes: { type: 'string' },
        valuation_source: { type: 'string' },
      },
    };

    propertyResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: propertyPrompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: propSchema,
    });
  }

  // ── 3. Derive missing fields ──────────────────────────────────────────────
  const verifiedRevenue = creditResult.estimated_revenue_min && creditResult.estimated_revenue_max
    ? Math.round((creditResult.estimated_revenue_min + creditResult.estimated_revenue_max) / 2)
    : lead.annual_revenue || 0;

  // If loan_amount is missing, estimate from monthly revenue
  const computedLoanAmount = (!lead.loan_amount && verifiedRevenue)
    ? Math.round(verifiedRevenue / 12)
    : lead.loan_amount;

  // If credit_score_range is unknown/missing, use AI tier
  const computedCreditRange = (!lead.credit_score_range || lead.credit_score_range === 'unknown')
    ? (creditResult.credit_score_tier || 'unknown')
    : lead.credit_score_range;

  // If years_in_business missing, use AI estimate
  const computedYears = (!lead.years_in_business && creditResult.estimated_years_in_business)
    ? creditResult.estimated_years_in_business
    : lead.years_in_business;

  // ── 4. Compile enrichment note ────────────────────────────────────────────
  const date = new Date().toLocaleDateString('en-US');
  const enrichNote = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 AI DUE DILIGENCE REPORT — ${date}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🏦 BUSINESS CREDIT ANALYSIS`,
    `• Estimated Credit Score: ${creditResult.estimated_credit_score ?? 'N/A'}/100`,
    `• Credit Tier: ${computedCreditRange.replace(/_/g, ' ')}`,
    `• ${creditResult.credit_score_summary || ''}`,
    ``,
    `💰 REVENUE VERIFICATION`,
    `• Self-Reported: $${(lead.annual_revenue || 0).toLocaleString()}`,
    `• AI-Estimated Range: $${(creditResult.estimated_revenue_min || 0).toLocaleString()} – $${(creditResult.estimated_revenue_max || 0).toLocaleString()}`,
    `• Plausible: ${creditResult.revenue_plausible ? '✅ Yes' : '⚠️ Questionable'}`,
    `• ${creditResult.revenue_analysis || ''}`,
    ``,
    `📅 YEARS IN BUSINESS`,
    `• Estimated: ${computedYears ?? 'N/A'} years`,
    creditResult.years_in_business_source ? `• Source: ${creditResult.years_in_business_source}` : '',
    ``,
    `💵 LOAN AMOUNT`,
    `• Requested: ${lead.loan_amount ? '$' + lead.loan_amount.toLocaleString() : 'Not provided'}`,
    !lead.loan_amount ? `• AI Estimated (monthly revenue): $${(computedLoanAmount || 0).toLocaleString()}` : '',
    ``,
    `📊 DEBT SERVICE COVERAGE`,
    `• ${creditResult.dscr_risk || 'N/A'}`,
    ``,
    isCRE && propertyResult ? [
      `🏢 PROPERTY VALUATION`,
      `• Address: ${lead.property_address}`,
      `• Estimated Value: $${(propertyResult.estimated_value || 0).toLocaleString()} (Range: $${(propertyResult.value_range_low || 0).toLocaleString()} – $${(propertyResult.value_range_high || 0).toLocaleString()})`,
      `• LTV: ${propertyResult.ltv_percent?.toFixed(1) || 'N/A'}% (${propertyResult.ltv_acceptable ? '✅ Acceptable' : '⚠️ High LTV'})`,
      `• ${propertyResult.property_notes || ''}`,
      ``,
    ].join('\n') : '',
    `🚩 RISK FLAGS`,
    ...(creditResult.risk_flags || []).map(f => `• ⚠️ ${f}`),
    ``,
    `✅ DUE DILIGENCE SCORE: ${creditResult.due_diligence_score ?? 'N/A'}/100`,
    `${creditResult.due_diligence_summary || ''}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].filter(Boolean).join('\n');

  const updatedNotes = lead.notes ? `${lead.notes}\n\n${enrichNote}` : enrichNote;

  const updatePayload = {
    enrichment_status: 'completed',
    due_diligence_status: 'completed',
    credit_idq_score: creditResult.estimated_credit_score ?? undefined,
    credit_idq_summary: creditResult.credit_score_summary || '',
    credit_score_range: computedCreditRange,
    business_owner_found: creditResult.owner_likely_identified ?? false,
    verified_annual_revenue: verifiedRevenue || undefined,
    revenue_verified_source: 'AI Analysis (Web Context)',
    property_estimated_value: propertyResult?.estimated_value ?? undefined,
    property_value_source: propertyResult ? (propertyResult.valuation_source || 'AI Estimate') : undefined,
    property_ltv: propertyResult?.ltv_percent ?? undefined,
    due_diligence_score: creditResult.due_diligence_score ?? undefined,
    due_diligence_summary: creditResult.due_diligence_summary || '',
    due_diligence_flags: creditResult.risk_flags || [],
    notes: updatedNotes,
  };

  // Fill in missing fields sourced by AI
  if (computedLoanAmount && !lead.loan_amount) updatePayload.loan_amount = computedLoanAmount;
  if (computedYears && !lead.years_in_business) updatePayload.years_in_business = computedYears;

  await base44.asServiceRole.entities.Lead.update(lead_id, updatePayload);

  return Response.json({
    success: true,
    due_diligence_score: creditResult.due_diligence_score,
    credit_score: creditResult.estimated_credit_score,
    property_value: propertyResult?.estimated_value,
  });
});