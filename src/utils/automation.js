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