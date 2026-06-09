/**
 * autoAdvanceDeal — GLINFICO Deal Automation Engine
 *
 * Runs on schedule (every hour via automation):
 * 1. Auto-advance deals stuck in a stage with no activity > N days
 * 2. Reassign unresponsive lenders after 24h — find next best lender match
 * 3. Create task alerts for admin when action is needed
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CREDIT_SCORE_MAP = {
  'excellent_750+': 750,
  'good_700-749': 700,
  'fair_650-699': 650,
  'poor_below_650': 600,
  'unknown': 0,
};

// If a deal stays in lender_matched stage for > 24h without moving, reassign lender
const LENDER_RESPONSE_HOURS = 24;
// If under_review for > 48h, auto-advance to docs_requested
const AUTO_ADVANCE_RULES = [
  { from: 'submitted', to: 'under_review', after_hours: 2 },
  { from: 'under_review', to: 'docs_requested', after_hours: 48 },
  { from: 'docs_received', to: 'lender_matched', after_hours: 4 },
];

function hoursAgo(isoDate) {
  if (!isoDate) return 9999;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled (service role) and manual admin calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch (_) {
      // Scheduled calls have no user — proceed as service role
    }

    const deals = await base44.asServiceRole.entities.Deal.list('-updated_date', 500);
    const lenders = await base44.asServiceRole.entities.Lender.filter({ status: 'active' });

    const results = { advanced: [], reassigned: [], tasks_created: [] };

    for (const deal of deals) {
      // Skip terminal deals
      if (['funded', 'declined', 'withdrawn'].includes(deal.stage)) continue;

      const hoursSinceUpdate = hoursAgo(deal.updated_date || deal.created_date);

      // ── 1. Auto-advance stale deals ────────────────────────────────────────
      for (const rule of AUTO_ADVANCE_RULES) {
        if (deal.stage === rule.from && hoursSinceUpdate >= rule.after_hours) {
          await base44.asServiceRole.entities.Deal.update(deal.id, { stage: rule.to });
          results.advanced.push({ id: deal.id, borrower: deal.borrower_name, from: rule.from, to: rule.to });

          // Create admin task
          await base44.asServiceRole.entities.Task.create({
            lead_name: deal.borrower_name,
            title: `Deal auto-advanced: ${rule.from} → ${rule.to}`,
            description: `${deal.borrower_name}'s deal was automatically advanced after ${rule.after_hours}h of inactivity.`,
            type: 'review',
            status: 'pending',
            priority: deal.priority || 'medium',
            auto_generated: true,
            trigger_event: `Auto-advance engine: ${rule.from} → ${rule.to}`,
          });
          results.tasks_created.push(deal.borrower_name);
          break; // Only one rule at a time
        }
      }

      // ── 2. Lender re-assignment (no response in 24h) ───────────────────────
      if (deal.stage === 'lender_matched' && hoursSinceUpdate >= LENDER_RESPONSE_HOURS) {
        // Find the current lender index, pick the next best
        const currentLenderName = deal.lender_name;

        // Score lenders for this deal
        const dealCreditScore = deal.credit_score || 0;
        const scored = lenders
          .filter(l => l.name !== currentLenderName) // Exclude current unresponsive lender
          .map(lender => {
            let score = 0;
            const types = Array.isArray(lender.loan_types) ? lender.loan_types : [];
            if (deal.loan_type && types.includes(deal.loan_type)) score += 3;
            if (!lender.min_credit_score || dealCreditScore >= lender.min_credit_score) score += 2;
            if (lender.min_loan_amount && lender.max_loan_amount) {
              if (deal.loan_amount >= lender.min_loan_amount && deal.loan_amount <= lender.max_loan_amount) score += 2;
            }
            if (deal.state && Array.isArray(lender.states_licensed) && lender.states_licensed.includes(deal.state)) score += 1;
            return { lender, score };
          })
          .filter(s => s.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return (b.lender.rating || 0) - (a.lender.rating || 0);
          });

        if (scored.length > 0) {
          const newLender = scored[0].lender;
          await base44.asServiceRole.entities.Deal.update(deal.id, {
            lender_id: newLender.id,
            lender_name: newLender.name,
            notes: (deal.notes ? deal.notes + '\n\n' : '') +
              `⚡ [AUTO] Lender reassigned from "${currentLenderName || 'unknown'}" to "${newLender.name}" after ${LENDER_RESPONSE_HOURS}h no response. (${new Date().toLocaleDateString()})`,
          });

          // Create urgent task
          await base44.asServiceRole.entities.Task.create({
            lead_name: deal.borrower_name,
            title: `Lender Reassigned — Action Needed`,
            description: `${deal.borrower_name}: No response from "${currentLenderName}" after ${LENDER_RESPONSE_HOURS}h. Auto-reassigned to "${newLender.name}". Please notify borrower and new lender.`,
            type: 'call',
            status: 'pending',
            priority: 'urgent',
            auto_generated: true,
            trigger_event: 'Lender no-response auto-reassignment',
          });

          results.reassigned.push({
            id: deal.id,
            borrower: deal.borrower_name,
            from: currentLenderName,
            to: newLender.name,
          });
          results.tasks_created.push(deal.borrower_name);
        } else {
          // No alternative lender — create escalation task
          await base44.asServiceRole.entities.Task.create({
            lead_name: deal.borrower_name,
            title: `⚠️ No Alternative Lender Found — Manual Review Required`,
            description: `${deal.borrower_name}: Current lender "${currentLenderName}" has not responded in ${LENDER_RESPONSE_HOURS}h and no eligible replacement was found in the network. Manual intervention required.`,
            type: 'review',
            status: 'pending',
            priority: 'urgent',
            auto_generated: true,
            trigger_event: 'Lender no-response — no replacement found',
          });
          results.tasks_created.push(deal.borrower_name + ' (escalation)');
        }
      }
    }

    return Response.json({
      success: true,
      summary: `Processed ${deals.length} deals`,
      advanced: results.advanced.length,
      reassigned: results.reassigned.length,
      tasks_created: results.tasks_created.length,
      details: results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});