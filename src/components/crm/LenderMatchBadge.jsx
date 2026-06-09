import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const CREDIT_SCORE_MAP = {
  'excellent_750+': 750, 'good_700-749': 700, 'fair_650-699': 650,
  'poor_below_650': 600, 'unknown': 0,
};

function scoreLenders(lenders, lead) {
  const creditScore = CREDIT_SCORE_MAP[lead?.credit_score_range] ?? 0;
  return lenders
    .filter(l => l.status === 'active')
    .map(lender => {
      let score = 0;
      const types = Array.isArray(lender.loan_types) ? lender.loan_types : [];
      if (lead?.loan_type && types.includes(lead.loan_type)) score += 3;
      if (!lender.min_credit_score || creditScore >= lender.min_credit_score) score += 2;
      if (lender.min_loan_amount && lender.max_loan_amount && lead?.loan_amount) {
        if (lead.loan_amount >= lender.min_loan_amount && lead.loan_amount <= lender.max_loan_amount) score += 2;
      }
      return { lender, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score !== a.score ? b.score - a.score : (b.lender.rating || 0) - (a.lender.rating || 0));
}

/**
 * LenderMatchBadge
 * Props:
 *   lead — Lead or Deal object (needs loan_type, credit_score_range, loan_amount)
 *   compact — small inline badge (for LeadCard)
 *   expanded — full card with top 3 matches (for DealWorkflow)
 */
export default function LenderMatchBadge({ lead, compact = false, expanded = false }) {
  const { data: lenders = [] } = useQuery({
    queryKey: ['lenders-active'],
    queryFn: () => base44.entities.Lender.filter({ status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });

  if (!lenders.length || !lead) return null;

  const scored = scoreLenders(lenders, lead);
  if (!scored.length) return null;

  const best = scored[0].lender;
  const matchScore = scored[0].score;
  const maxScore = 7;
  const pct = Math.round((matchScore / maxScore) * 100);

  // ── Compact badge (for LeadCard) ─────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
        <Building2 className="h-3 w-3 text-amber-500 flex-shrink-0" />
        <span className="truncate max-w-[120px] font-medium text-amber-700">{best.name}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">{pct}% fit</span>
      </div>
    );
  }

  // ── Expanded card (for DealWorkflow) ─────────────────────────────
  if (expanded) {
    const top3 = scored.slice(0, 3);
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-amber-400" /> AI Lender Matches
        </p>
        {top3.map(({ lender, score }, i) => {
          const p = Math.round((score / maxScore) * 100);
          return (
            <div key={lender.id} className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
              i === 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/5"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                i === 0 ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-300"
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold truncate", i === 0 ? "text-amber-300" : "text-slate-300")}>
                  {lender.name}
                  {i === 0 && <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20">Best Fit</span>}
                </p>
                <p className="text-xs text-slate-500 capitalize">{lender.lender_type?.replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn("text-sm font-bold", i === 0 ? "text-amber-400" : "text-slate-400")}>{p}%</p>
                <div className="flex gap-0.5 justify-end mt-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn("h-2.5 w-2.5", (lender.rating || 0) >= s ? "text-amber-400 fill-amber-400" : "text-slate-600")} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}