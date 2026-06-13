/**
 * aiCommunication — AI-Powered Communication Hub
 * 
 * Handles AI-generated, context-aware messages between:
 * - Platform → Borrowers (status updates, doc requests, approvals, declines)
 * - Platform → Lenders (deal summaries, term sheet follow-ups, match notifications)
 * - Platform → Brokers (deal status, commission updates, pipeline summaries)
 * - Internal team briefings
 *
 * Payload:
 *   action: 'draft' | 'send' | 'broadcast'
 *   recipient_type: 'borrower' | 'lender' | 'broker' | 'team'
 *   context_type: 'deal_update' | 'doc_request' | 'approval' | 'decline' | 'term_sheet' | 'lender_match' | 'status_update' | 'pipeline_summary' | 'custom'
 *   deal_id?: string
 *   lead_id?: string
 *   recipient_email?: string
 *   recipient_name?: string
 *   custom_context?: string
 *   send_immediately?: boolean
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      action = 'draft',
      recipient_type,
      context_type,
      deal_id,
      lead_id,
      recipient_email,
      recipient_name,
      custom_context,
      send_immediately = false,
      tone = 'professional' // professional | urgent | friendly | formal
    } = await req.json();

    // Fetch deal/lead context if provided
    let deal = null;
    let lead = null;
    if (deal_id) deal = await base44.asServiceRole.entities.Deal.get(deal_id);
    if (lead_id) lead = await base44.asServiceRole.entities.Lead.get(lead_id);

    const dealContext = deal ? `
Deal Information:
- Borrower: ${deal.borrower_name}
- Loan Type: ${(deal.loan_type || '').replace(/_/g, ' ')}
- Amount: $${(deal.loan_amount || 0).toLocaleString()}
- Stage: ${(deal.stage || '').replace(/_/g, ' ')}
- Lender: ${deal.lender_name || 'Not yet assigned'}
- Broker: ${deal.broker_name || 'Direct'}
- Industry: ${deal.industry || 'N/A'}
- State: ${deal.state || 'N/A'}
- Credit Score: ${deal.credit_score || 'N/A'}
- Notes: ${deal.notes ? deal.notes.substring(0, 300) : 'None'}
` : '';

    const leadContext = lead ? `
Lead Information:
- Name: ${lead.first_name} ${lead.last_name}
- Company: ${lead.company || 'N/A'}
- Loan Type: ${(lead.loan_type || '').replace(/_/g, ' ')}
- Amount: $${(lead.loan_amount || 0).toLocaleString()}
- Status: ${lead.status || 'N/A'}
- Credit Range: ${lead.credit_score_range || 'N/A'}
- Due Diligence Score: ${lead.due_diligence_score ? `${lead.due_diligence_score}/100` : 'N/A'}
` : '';

    // Context-specific instructions
    const contextInstructions = {
      deal_update: 'Write a deal status update informing the recipient of the current stage and next steps.',
      doc_request: 'Write a document request message that is firm but professional, emphasizing the 48-hour deadline and the impact of delays on the deal.',
      approval: 'Write an exciting congratulatory approval message with next steps and funding timeline.',
      decline: 'Write a compassionate decline message with specific reasons (based on context) and suggestions for alternative options or improvements.',
      term_sheet: 'Write a professional term sheet delivery message summarizing key terms and requesting signature.',
      lender_match: 'Write a notification to the lender about a new matched deal opportunity with the borrower profile summary.',
      status_update: 'Write a brief, clear status update message.',
      pipeline_summary: 'Write a concise pipeline summary suitable for a broker or internal team.',
      custom: custom_context || 'Write a professional communication message based on the context provided.'
    };

    const recipientInstructions = {
      borrower: 'The recipient is the borrower/business owner. Be warm, encouraging, and explain things clearly without jargon.',
      lender: 'The recipient is a lender/financial institution. Be concise, data-driven, and highlight key financial metrics and risk factors.',
      broker: 'The recipient is a referring broker. Be professional, mention deal status, and include commission-relevant updates.',
      team: 'This is an internal team message. Be direct, include all relevant data, flag risks, and specify action items.'
    };

    const aiPrompt = `
You are the AI communication engine for an AI-Powered Funding Platform — a sophisticated commercial lending technology company.

Generate a professional communication message with the following specifications:

Recipient Type: ${recipient_type || 'unknown'}
${recipientInstructions[recipient_type] || ''}

Communication Purpose: ${context_type || 'general update'}
${contextInstructions[context_type] || ''}

Tone: ${tone}
Recipient Name: ${recipient_name || 'Valued Partner'}
Sender: AI-Powered Funding Platform

${dealContext}
${leadContext}
${custom_context ? `Additional Context: ${custom_context}` : ''}

Requirements:
- Subject line should be specific and action-oriented
- Body should be 150-300 words unless it's a pipeline summary (which can be longer)
- Include a clear call-to-action
- Professional signature as "The Funding Team | AI-Powered Funding Platform"
- For borrowers: include a support contact prompt
- For lenders: include deal reference number if available
- Make it feel like it was written by a senior loan officer, not a bot
`;

    const msgSchema = {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        body: { type: 'string' },
        call_to_action: { type: 'string' },
        urgency_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        recommended_follow_up_days: { type: 'number' },
        key_points: { type: 'array', items: { type: 'string' } }
      }
    };

    const aiMsg = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      response_json_schema: msgSchema,
      model: 'claude_sonnet_4_6'
    });

    // Send immediately if requested and email is available
    let sent = false;
    const targetEmail = recipient_email ||
      (recipient_type === 'borrower' && deal?.borrower_email) ||
      (recipient_type === 'borrower' && lead?.email);

    if ((action === 'send' || send_immediately) && targetEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: targetEmail,
        from_name: 'AI-Powered Funding Platform',
        subject: aiMsg.subject,
        body: aiMsg.body
      });
      sent = true;

      // Log activity
      if (lead_id || deal?.lead_id) {
        await base44.asServiceRole.entities.Activity.create({
          lead_id: lead_id || deal.lead_id,
          type: 'email',
          description: `🤖 AI-generated ${context_type} email sent to ${recipient_type}: ${recipient_name || targetEmail}`,
          outcome: `Subject: "${aiMsg.subject}" | Urgency: ${aiMsg.urgency_level}`
        });
      }
    }

    return Response.json({
      success: true,
      message: aiMsg,
      sent,
      target_email: targetEmail || null
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});