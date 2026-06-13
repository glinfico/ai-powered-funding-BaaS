/**
 * onDealUnderReview — AI-Powered Underwriting Engine
 * 
 * When a deal moves to under_review:
 * 1. AI analyzes the deal profile and generates a TAILORED document checklist
 * 2. AI drafts a personalized, professional email to the borrower
 * 3. Email is sent automatically — no human intervention needed
 * 4. Creates a high-priority task for the team
 * 5. Sends lender match notification if lender is already assigned
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data: deal } = await req.json();

    if (!deal || deal.stage !== 'under_review') {
      return Response.json({ skipped: true });
    }

    const loanTypeLabel = (deal.loan_type || 'business loan').replace(/_/g, ' ');
    const amount = (deal.loan_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    // ── 1. AI: Generate tailored doc checklist + borrower email ──────────────
    const aiPrompt = `
You are an expert commercial lending underwriter and client communication specialist for an AI-Powered Funding Platform.

A deal has just entered underwriting. Generate:
1. A tailored document checklist specific to this loan type and borrower profile
2. A professional, warm, and urgent but not pushy email to the borrower requesting documents

Deal Profile:
- Borrower: ${deal.borrower_name}
- Email: ${deal.borrower_email || 'N/A'}
- Loan Type: ${loanTypeLabel}
- Amount: ${amount}
- Industry: ${deal.industry || 'Not specified'}
- State: ${deal.state || 'Not specified'}
- Credit Score: ${deal.credit_score || 'Not provided'}
- Annual Revenue: ${deal.annual_revenue ? '$' + deal.annual_revenue.toLocaleString() : 'Not provided'}
- Years in Business: ${deal.years_in_business || 'Not provided'}
- Broker: ${deal.broker_name || 'Direct'}
- Notes: ${deal.notes || 'None'}

Instructions:
- The document checklist should be specific to the loan type (${loanTypeLabel}) and industry
- For SBA loans: include SBA-specific forms and 2-year projections
- For CRE: include property docs, rent rolls, environmental assessments
- For Equipment: include equipment quotes/invoices, useful life analysis
- For MCA/Business Loan: focus on bank statements and AR aging
- The email should be friendly, professional, mention the specific loan amount, and create urgency without pressure
- Sign the email as "The Funding Team" from the AI-Powered Funding Platform
- Keep the email under 200 words but impactful
- Include a specific deadline of 48 hours for document submission
`;

    const aiSchema = {
      type: 'object',
      properties: {
        document_checklist: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tailored list of required documents'
        },
        priority_docs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 3 most critical documents to get first'
        },
        email_subject: { type: 'string' },
        email_body: { type: 'string' },
        estimated_processing_days: { type: 'number' },
        risk_notes: { type: 'string' }
      }
    };

    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      response_json_schema: aiSchema,
      model: 'claude_sonnet_4_6'
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const docList = (aiResult.document_checklist || []).map(d => `• ${d}`).join('\n');

    // ── 2. Auto-send email to borrower ───────────────────────────────────────
    let emailSent = false;
    if (deal.borrower_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: deal.borrower_email,
        from_name: 'AI-Powered Funding Platform',
        subject: aiResult.email_subject || `Action Required: Documents Needed for Your ${loanTypeLabel} Application`,
        body: aiResult.email_body || `Dear ${deal.borrower_name},\n\nYour application for ${amount} is under review. Please submit the required documents within 48 hours to avoid delays.\n\nThank you,\nThe Funding Team`
      });
      emailSent = true;
    }

    // ── 3. Notify broker if applicable ──────────────────────────────────────
    if (deal.broker_name && deal.borrower_email) {
      // Broker notification (if broker email is stored in deal — future field)
      // For now, log in task notes
    }

    // ── 4. Create AI-generated task for team ────────────────────────────────
    await base44.asServiceRole.entities.Task.create({
      lead_id: deal.lead_id || null,
      lead_name: deal.borrower_name,
      title: `🤖 AI Underwriting Started — ${deal.borrower_name}`,
      description: [
        `Deal entered AI-powered underwriting. Documents auto-requested from borrower.`,
        ``,
        `📧 Email Auto-Sent: ${emailSent ? '✅ YES' : '⚠️ No email on file — contact manually'}`,
        ``,
        `🎯 Priority Documents (get these first):`,
        (aiResult.priority_docs || []).map(d => `• ${d}`).join('\n'),
        ``,
        `📋 Full Document Checklist:`,
        docList,
        ``,
        `⏱️ Estimated Processing: ${aiResult.estimated_processing_days || 3} business days`,
        aiResult.risk_notes ? `\n⚠️ AI Risk Notes: ${aiResult.risk_notes}` : '',
        ``,
        `Loan: ${loanTypeLabel} · ${amount} · ${deal.industry || ''} · ${deal.state || ''}`
      ].filter(Boolean).join('\n'),
      type: 'document_request',
      status: 'in_progress',
      priority: 'high',
      due_date: dueDateStr,
      assigned_to: deal.assigned_admin || deal.broker_name || '',
      auto_generated: true,
      trigger_event: 'AI Underwriting — Deal moved to under_review',
    });

    // ── 5. Log communication activity ────────────────────────────────────────
    if (deal.lead_id) {
      await base44.asServiceRole.entities.Activity.create({
        lead_id: deal.lead_id,
        type: 'email',
        description: `🤖 AI auto-sent underwriting document request to ${deal.borrower_name} (${deal.borrower_email || 'no email'})`,
        outcome: emailSent
          ? `Email delivered: "${aiResult.email_subject}"`
          : 'No email address on file — manual outreach required'
      });
    }

    return Response.json({
      success: true,
      deal_id: deal.id,
      borrower: deal.borrower_name,
      email_sent: emailSent,
      docs_requested: (aiResult.document_checklist || []).length,
      estimated_days: aiResult.estimated_processing_days
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});