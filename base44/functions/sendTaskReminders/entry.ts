/**
 * sendTaskReminders — GLINFICO Task Reminder Engine
 *
 * Runs daily (scheduled automation):
 * - Finds all overdue tasks (pending, due_date < today)
 * - Finds tasks due today
 * - Sends in-app notification tasks and email reminders to assigned team members
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function daysDiff(isoDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(isoDate);
  due.setHours(0, 0, 0, 0);
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().split('T')[0];
    const allTasks = await base44.asServiceRole.entities.Task.list('-due_date', 500);

    const overdue = allTasks.filter(t =>
      t.status === 'pending' && t.due_date && t.due_date < today
    );
    const dueToday = allTasks.filter(t =>
      t.status === 'pending' && t.due_date === today
    );

    const results = { overdue_count: overdue.length, due_today: dueToday.length, emails_sent: 0, reminders_created: 0 };

    // Group by assigned_to
    const byAssignee = {};
    [...overdue, ...dueToday].forEach(task => {
      const key = task.assigned_to || 'unassigned';
      if (!byAssignee[key]) byAssignee[key] = { overdue: [], today: [] };
      if (task.due_date < today) byAssignee[key].overdue.push(task);
      else byAssignee[key].today.push(task);
    });

    // Fetch team members to get emails
    const team = await base44.asServiceRole.entities.TeamMember.list();
    const emailMap = {};
    team.forEach(m => { if (m.full_name && m.email) emailMap[m.full_name.toLowerCase()] = m.email; });

    for (const [assignee, taskGroups] of Object.entries(byAssignee)) {
      const email = emailMap[assignee.toLowerCase()];
      const totalCount = taskGroups.overdue.length + taskGroups.today.length;

      if (email && email.includes('@')) {
        // Build email body
        let bodyLines = [`Hello ${assignee},\n`];
        if (taskGroups.overdue.length > 0) {
          bodyLines.push(`⚠️ OVERDUE TASKS (${taskGroups.overdue.length}):`);
          taskGroups.overdue.forEach(t => {
            const daysLate = daysDiff(t.due_date);
            bodyLines.push(`  • [${t.priority?.toUpperCase()}] ${t.title} — ${t.lead_name || 'No lead'} (${daysLate} day${daysLate !== 1 ? 's' : ''} overdue)`);
          });
          bodyLines.push('');
        }
        if (taskGroups.today.length > 0) {
          bodyLines.push(`📅 DUE TODAY (${taskGroups.today.length}):`);
          taskGroups.today.forEach(t => {
            bodyLines.push(`  • [${t.priority?.toUpperCase()}] ${t.title} — ${t.lead_name || 'No lead'}`);
          });
        }
        bodyLines.push('\nLog in to GLINFICO to complete these tasks: https://glinfico.com/Tasks');

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `GLINFICO Task Reminder: ${totalCount} task${totalCount !== 1 ? 's' : ''} need your attention`,
          body: bodyLines.join('\n'),
        });
        results.emails_sent++;
      }

      // Also escalate overdue urgent/high tasks as new reminder tasks for admins
      for (const task of taskGroups.overdue) {
        if (['urgent', 'high'].includes(task.priority) && daysDiff(task.due_date) >= 2) {
          await base44.asServiceRole.entities.Task.create({
            lead_name: task.lead_name,
            title: `🔔 OVERDUE ESCALATION: ${task.title}`,
            description: `Original task "${task.title}" for ${task.lead_name || 'unknown'} is overdue by ${daysDiff(task.due_date)} day(s). Assigned to: ${assignee}. Immediate action required.`,
            type: 'follow_up',
            status: 'pending',
            priority: 'urgent',
            auto_generated: true,
            trigger_event: 'Overdue task escalation',
          });
          results.reminders_created++;
        }
      }
    }

    return Response.json({
      success: true,
      date: today,
      overdue_tasks: results.overdue_count,
      due_today: results.due_today,
      emails_sent: results.emails_sent,
      escalations_created: results.reminders_created,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});