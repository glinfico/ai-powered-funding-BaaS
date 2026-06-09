/**
 * onDealUnderReview — fires when a Deal moves to "under_review" stage.
 * Creates a document request task for the assigned team member.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REQUIRED_DOCS = [
  '3 months business bank statements',
  '2 years business tax returns',
  'Business license / formation docs',
  'Voided check (for ACH)',
  'Government-issued ID (owner)',
  'Accounts receivable aging report (if applicable)',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data: deal, event } = await req.json();

    // Only act on stage moving to under_review
    if (!deal || deal.stage !== 'under_review') {
      return Response.json({ skipped: true });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    await base44.asServiceRole.entities.Task.create({
      lead_id: deal.lead_id || null,
      lead_name: deal.borrower_name,
      title: `📋 Request Underwriting Documents — ${deal.borrower_name}`,
      description: `Deal entered underwriting. Request the following documents from ${deal.borrower_name}:\n\n${REQUIRED_DOCS.map(d => `• ${d}`).join('\n')}\n\nLoan Type: ${(deal.loan_type || '').replace(/_/g, ' ')}\nRequested Amount: $${(deal.loan_amount || 0).toLocaleString()}`,
      type: 'document_request',
      status: 'pending',
      priority: 'high',
      due_date: dueDateStr,
      assigned_to: deal.assigned_admin || deal.broker_name || '',
      auto_generated: true,
      trigger_event: 'Deal moved to under_review',
    });

    return Response.json({ success: true, deal_id: deal.id, borrower: deal.borrower_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});