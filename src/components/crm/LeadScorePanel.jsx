import { scoreLeadQuality } from "@/utils/leadScoring";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export default function LeadScorePanel({ lead }) {
  const { score, grade, breakdown, color, bg, ring } = scoreLeadQuality(lead);

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className={cn("flex items-center gap-4 rounded-xl p-5 ring-2", bg, ring)}>
        <div className="text-center min-w-[64px]">
          <div className={cn("text-5xl font-black leading-none", color)}>{score}</div>
          <div className="text-xs text-slate-400 mt-0.5">out of 100</div>
        </div>
        <div className="flex-1">
          <div className={cn("text-2xl font-black mb-0.5", color)}>Grade {grade}</div>
          <div className="text-sm text-slate-500">Lead Quality Score</div>
          {/* Score bar */}
          <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden ring-1 ring-black/5">
            <div
              className={cn("h-full rounded-full transition-all duration-500", {
                "bg-emerald-500": score >= 80,
                "bg-blue-500": score >= 65 && score < 80,
                "bg-amber-500": score >= 45 && score < 65,
                "bg-orange-500": score >= 25 && score < 45,
                "bg-red-500": score < 25,
              })}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Score Breakdown
        </p>
        <div className="space-y-2.5">
          {breakdown.map(({ label, pts, max }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{label}</span>
                <span className={cn("font-bold", pts === 0 ? "text-slate-400" : "text-slate-700")}>
                  {pts} / {max}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: max > 0 ? `${(pts / max) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {score < 80 && (
        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600 mb-1.5">💡 How to improve this score:</p>
          {!lead.phone && <p>· Add a phone number (+contact points)</p>}
          {!lead.company && <p>· Add company name (+profile completeness)</p>}
          {!lead.annual_revenue && <p>· Enter annual revenue (+up to 15 pts)</p>}
          {(!lead.years_in_business) && <p>· Enter years in business (+up to 10 pts)</p>}
          {lead.enrichment_status !== "completed" && <p>· Complete enrichment for Credit IDQ score (+5 pts)</p>}
          {lead.credit_score_range === "unknown" && <p>· Obtain credit score range (+up to 20 pts)</p>}
        </div>
      )}
    </div>
  );
}