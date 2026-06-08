import { base44 } from "@/api/base44Client";
import { addDays, format } from "date-fns";

export async function triggerStatusAutomation(lead, newStatus) {
  const rules = await base44.entities.AutomationRule.filter({ is_active: true });
  const matchingRules = rules.filter(r =>
    r.trigger === 'status_change' &&
    (r.trigger_status === newStatus || r.trigger_status === 'any')
  );
  for (const rule of matchingRules) {
    const dueDate = format(addDays(new Date(), rule.due_days_offset || 1), 'yyyy-MM-dd');
    await base44.entities.Task.create({
      lead_id: lead.id,
      lead_name: `${lead.first_name} ${lead.last_name}`,
      title: rule.task_title,
      description: rule.task_description || '',
      type: rule.task_type || 'follow_up',
      status: 'pending',
      priority: rule.task_priority || 'medium',
      due_date: dueDate,
      auto_generated: true,
      trigger_event: `Status changed to ${newStatus}`,
    });
  }
}

export async function triggerNewLeadAutomation(lead) {
  const rules = await base44.entities.AutomationRule.filter({ is_active: true });
  const matchingRules = rules.filter(r => r.trigger === 'new_lead');
  for (const rule of matchingRules) {
    const dueDate = format(addDays(new Date(), rule.due_days_offset || 1), 'yyyy-MM-dd');
    await base44.entities.Task.create({
      lead_id: lead.id,
      lead_name: `${lead.first_name} ${lead.last_name}`,
      title: rule.task_title,
      description: rule.task_description || '',
      type: rule.task_type || 'follow_up',
      status: 'pending',
      priority: rule.task_priority || 'medium',
      due_date: dueDate,
      auto_generated: true,
      trigger_event: 'New lead created',
    });
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LEAD ENRICHMENT — Credit IDQ soft pull + Business revenue lookup
 * ─────────────────────────────────────────────────────────────────────────────
 * Wire real credentials by replacing the two PLACEHOLDER blocks below.
 */
export async function runLeadEnrichment(lead) {
  // Mark enrichment as in-progress immediately
  await base44.entities.Lead.update(lead.id, { enrichment_status: 'pending' });

  let creditScore = null;
  let creditSummary = '';
  let ownerFound = false;
  let verifiedRevenue = null;
  let revenueSource = '';

  // ── PLACEHOLDER: Credit IDQ Soft Pull ────────────────────────────────────
  // TODO: Replace this block with a real Credit IDQ API call.
  // Endpoint: https://api.creditidq.com/v1/soft-pull  (confirm with IDQ docs)
  // Required fields: first_name, last_name, email, phone, company
  // Store your API key in a secret named CREDIT_IDQ_API_KEY (Builder+ → Secrets)
  //
  // Example (once on Builder+ with a backend function):
  //   const res = await fetch('https://api.creditidq.com/v1/soft-pull', {
  //     method: 'POST',
  //     headers: { Authorization: `Bearer ${process.env.CREDIT_IDQ_API_KEY}`, 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ first_name: lead.first_name, last_name: lead.last_name,
  //                            email: lead.email, phone: lead.phone, business: lead.company })
  //   });
  //   const data = await res.json();
  //   creditScore = data.score;
  //   ownerFound  = data.owner_identified;
  //   creditSummary = `Score: ${creditScore} | Owner verified: ${ownerFound} | ${data.summary}`;
  // ─────────────────────────────────────────────────────────────────────────
  creditSummary = `⏳ Credit IDQ placeholder — connect API credentials to activate soft pull for ${lead.first_name} ${lead.last_name}.`;
  ownerFound = false;

  // ── PLACEHOLDER: Business Revenue Lookup ─────────────────────────────────
  // TODO: Replace with D&B, Experian Business, or your preferred data provider.
  // Typically looks up by EIN, business name + state, or phone number.
  //
  // Example:
  //   const bizRes = await fetch(`https://api.dnb.com/v1/data/firmographics?name=${encodeURIComponent(lead.company)}`, {
  //     headers: { Authorization: `Bearer ${process.env.DNB_API_KEY}` }
  //   });
  //   const bizData = await bizRes.json();
  //   verifiedRevenue = bizData.annual_revenue;
  //   revenueSource   = 'D&B';
  // ─────────────────────────────────────────────────────────────────────────
  revenueSource = 'Pending — revenue provider not yet connected';

  const enrichmentNote = [
    `📋 Auto-Enrichment Report (${new Date().toLocaleDateString()})`,
    `• Credit IDQ: ${creditSummary}`,
    `• Business Owner Found: ${ownerFound ? 'Yes ✅' : 'Pending — API not yet connected'}`,
    `• Verified Revenue: ${verifiedRevenue ? `$${verifiedRevenue.toLocaleString()} (${revenueSource})` : revenueSource}`,
  ].join('\n');

  const updatedNotes = lead.notes ? `${lead.notes}\n\n${enrichmentNote}` : enrichmentNote;

  await base44.entities.Lead.update(lead.id, {
    enrichment_status: 'completed',
    credit_idq_score: creditScore ?? undefined,
    credit_idq_summary: creditSummary,
    business_owner_found: ownerFound,
    verified_annual_revenue: verifiedRevenue ?? undefined,
    revenue_verified_source: revenueSource,
    notes: updatedNotes,
  });
}

// Maps credit score range enum to a minimum numeric score
const CREDIT_SCORE_MAP = {
  'excellent_750+': 750,
  'good_700-749': 700,
  'fair_650-699': 650,
  'poor_below_650': 600,
  'unknown': 0,
};

/**
 * When a new lead is added, fetch active lenders and match based on
 * loan_type and credit_score_range. Updates the lead's notes with the result.
 */
export async function matchLeadToLender(lead) {
  const lenders = await base44.entities.Lender.filter({ status: 'active' });
  if (!lenders.length) return;

  const creditScore = CREDIT_SCORE_MAP[lead.credit_score_range] ?? 0;

  // Score each lender: loan_type match (+2), credit score eligible (+1), then sort by rating desc
  const scored = lenders
    .map(lender => {
      let score = 0;
      const lenderLoanTypes = Array.isArray(lender.loan_types) ? lender.loan_types : [];
      if (lead.loan_type && lenderLoanTypes.includes(lead.loan_type)) score += 2;
      if (!lender.min_credit_score || creditScore >= lender.min_credit_score) score += 1;
      return { lender, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.lender.rating || 0) - (a.lender.rating || 0);
    });

  if (!scored.length) return;

  const best = scored[0].lender;
  const matchNote = `🤖 Auto-matched lender: ${best.name} (${best.lender_type?.replace(/_/g, ' ')})`;
  const existingNotes = lead.notes ? `${lead.notes}\n\n${matchNote}` : matchNote;
  await base44.entities.Lead.update(lead.id, { notes: existingNotes });
}

/**
 * When a new Deal is created, find the matching Lead (by email or name)
 * and advance it to "qualified" (Application stage in the pipeline).
 */
export async function triggerNewDealLeadSync(deal) {
  // Try to match lead by borrower email first, then by name
  let leads = [];
  if (deal.borrower_email) {
    leads = await base44.entities.Lead.filter({ email: deal.borrower_email });
  }
  if (!leads.length && deal.borrower_name) {
    const allLeads = await base44.entities.Lead.list();
    leads = allLeads.filter(l =>
      `${l.first_name} ${l.last_name}`.toLowerCase() === deal.borrower_name.toLowerCase()
    );
  }
  for (const lead of leads) {
    // Only advance — don't move backwards if already further along
    const ORDER = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'approved', 'funded', 'lost'];
    const currentIdx = ORDER.indexOf(lead.status);
    const targetIdx = ORDER.indexOf('qualified');
    if (currentIdx < targetIdx) {
      await base44.entities.Lead.update(lead.id, { status: 'qualified' });
    }
  }
}

export const DEFAULT_AUTOMATION_RULES = [
  {
    name: "New Lead – Initial Outreach Call",
    description: "Create a high-priority call task when a new lead is added",
    trigger: "new_lead",
    trigger_status: null,
    task_title: "Initial Outreach Call",
    task_description: "Contact the lead to introduce GLINFICO services and understand their funding needs",
    task_type: "call",
    task_priority: "high",
    due_days_offset: 1,
    is_active: true,
  },
  {
    name: "Contacted → Send Loan Options",
    description: "After first contact, send tailored loan options",
    trigger: "status_change",
    trigger_status: "contacted",
    task_title: "Send Loan Options to Lead",
    task_description: "Prepare and email loan options tailored to the lead's profile and business needs",
    task_type: "email",
    task_priority: "high",
    due_days_offset: 1,
    is_active: true,
  },
  {
    name: "Qualified → Prepare Term Sheet",
    description: "Draft a term sheet once lead is qualified",
    trigger: "status_change",
    trigger_status: "qualified",
    task_title: "Prepare Term Sheet",
    task_description: "Draft a competitive term sheet based on the lead's financials and loan requirements",
    task_type: "review",
    task_priority: "high",
    due_days_offset: 2,
    is_active: true,
  },
  {
    name: "Proposal Sent → Follow Up",
    description: "Follow up 3 days after proposal is sent",
    trigger: "status_change",
    trigger_status: "proposal_sent",
    task_title: "Follow Up on Proposal",
    task_description: "Check in on the proposal, answer questions, and gauge interest",
    task_type: "follow_up",
    task_priority: "medium",
    due_days_offset: 3,
    is_active: true,
  },
  {
    name: "Negotiation → Schedule Closing",
    description: "Book closing call during negotiation phase",
    trigger: "status_change",
    trigger_status: "negotiation",
    task_title: "Schedule Closing Call",
    task_description: "Set up a closing call to finalize terms, pricing, and timeline",
    task_type: "meeting",
    task_priority: "urgent",
    due_days_offset: 2,
    is_active: true,
  },
  {
    name: "Approved → Request Final Documents",
    description: "Collect documents once deal is approved",
    trigger: "status_change",
    trigger_status: "approved",
    task_title: "Request Final Documents",
    task_description: "Collect all required documentation (bank statements, tax returns, ID) before funding",
    task_type: "document_request",
    task_priority: "urgent",
    due_days_offset: 1,
    is_active: true,
  },
  {
    name: "Funded → Request Referral",
    description: "Ask for a referral after successful funding",
    trigger: "status_change",
    trigger_status: "funded",
    task_title: "Send Congratulations & Request Referral",
    task_description: "Thank the client for their business and ask if they know others who need funding",
    task_type: "email",
    task_priority: "low",
    due_days_offset: 3,
    is_active: true,
  },
];