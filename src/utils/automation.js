import { supabase } from "@/lib/supabase";

async function runLeadAutomation(leadId, changedFields = {}) {
  if (!leadId) throw new Error("A lead ID is required to run ACE automation.");
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (sessionError || !token) throw new Error("Sign in to the Command Center before running ACE.");

  const response = await fetch(`/api/automation/leads/${encodeURIComponent(leadId)}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ changedFields }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success !== true) {
    throw new Error(payload.error || `ACE automation failed (HTTP ${response.status}).`);
  }
  return payload.automation;
}

// Enrichment requires an authorized external data provider. Do not fabricate enriched fields.
export async function runLeadEnrichment() {
  return {
    status: "not_configured",
    reason: "No live enrichment provider is connected. ACE will not invent borrower or credit data.",
  };
}

export async function triggerStatusAutomation(leadId, changedFields = {}) {
  return runLeadAutomation(leadId, changedFields);
}

export async function triggerNewLeadAutomation(leadId) {
  return runLeadAutomation(leadId);
}

export async function matchLeadToLender(leadId, changedFields = {}) {
  return runLeadAutomation(leadId, changedFields);
}

// Deal-to-lead synchronization needs a confirmed deal schema and relationship before it can safely run.
export async function triggerNewDealLeadSync() {
  return {
    status: "not_configured",
    reason: "Deal-to-lead synchronization is disabled until the production deal/lead relationship is confirmed.",
  };
}

export const DEFAULT_AUTOMATION_RULES = [
  {
    name: "Route new lead through Smart Router",
    description: "Use the existing funding request and Supabase get_smart_funding_matches RPC.",
    trigger: "new_lead",
    trigger_status: "new",
    task_title: "Review Smart Router matches",
    task_description: "Review the lender matches returned by the existing Smart Router.",
    task_type: "review",
    task_priority: "high",
    due_days_offset: 1,
    is_active: true,
  },
  {
    name: "Re-route when matching inputs change",
    description: "Synchronize supported matching inputs to existing funding requests and rerun the existing matcher.",
    trigger: "status_change",
    trigger_status: "qualified",
    task_title: "Review refreshed lender matches",
    task_description: "Review the refreshed Smart Router results before advancing the deal.",
    task_type: "review",
    task_priority: "high",
    due_days_offset: 1,
    is_active: true,
  },
];
