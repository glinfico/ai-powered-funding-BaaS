import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Scheduled job: checks all leads that are still in "new" status
 * and have not been updated in 48+ hours. For each stale lead,
 * creates a follow-up task assigned to the lead's assigned_to member
 * — unless a pending follow-up task already exists for that lead
 * (idempotency guard to prevent duplicate tasks).
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled invocations (no user auth) but block non-admin manual calls
  let isScheduled = false;
  try {
    const body = await req.clone().json().catch(() => ({}));
    isScheduled = body?.__scheduled === true;
  } catch { /* ignore */ }

  if (!isScheduled) {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

  // Fetch all leads still in "new" status
  const newLeads = await base44.asServiceRole.entities.Lead.filter({ status: 'new' });

  const staleLeads = newLeads.filter(lead => {
    const updatedAt = lead.updated_date ? new Date(lead.updated_date) : new Date(lead.created_date);
    return updatedAt <= cutoff;
  });

  if (staleLeads.length === 0) {
    return Response.json({ message: 'No stale leads found.', checked: newLeads.length, stale: 0 });
  }

  // Fetch existing pending tasks to avoid duplicates
  const existingTasks = await base44.asServiceRole.entities.Task.filter({ status: 'pending' });
  const existingFollowUpLeadIds = new Set(
    existingTasks
      .filter(t => t.auto_generated && t.trigger_event === 'stale_new_48h')
      .map(t => t.lead_id)
  );

  const created = [];
  const skipped = [];

  for (const lead of staleLeads) {
    if (existingFollowUpLeadIds.has(lead.id)) {
      skipped.push(lead.id);
      continue;
    }

    const hoursStale = Math.round((now - new Date(lead.updated_date || lead.created_date)) / (1000 * 60 * 60));
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 1); // due tomorrow
    const dueDateStr = dueDate.toISOString().split('T')[0];

    await base44.asServiceRole.entities.Task.create({
      lead_id: lead.id,
      lead_name: `${lead.first_name} ${lead.last_name}`,
      assigned_to: lead.assigned_to || '',
      title: `Follow-Up Required: Lead Stale for ${hoursStale}h`,
      description: `Lead "${lead.first_name} ${lead.last_name}" (${lead.company || 'No company'}) has been in "New" status for over ${hoursStale} hours without an update. Please make contact, qualify this lead, or mark as lost.`,
      type: 'follow_up',
      status: 'pending',
      priority: hoursStale >= 72 ? 'urgent' : 'high',
      due_date: dueDateStr,
      auto_generated: true,
      trigger_event: 'stale_new_48h',
    });

    created.push({ id: lead.id, name: `${lead.first_name} ${lead.last_name}`, hoursStale });
  }

  return Response.json({
    message: `Processed ${staleLeads.length} stale leads.`,
    created: created.length,
    skipped: skipped.length,
    details: created,
  });
});