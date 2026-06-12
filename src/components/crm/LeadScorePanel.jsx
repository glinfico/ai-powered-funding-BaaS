import { scoreLeadQuality } from "@/utils/leadScoring";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from "lucide-react";

// Per-category explanations of why the score is what it is
function getCategoryInsight(label, pts, max, lead) {
  const pct = max > 0 ? pts / max : 0;

  if (label === "Loan Amount") {
    const amt = lead.loan_amount || 0;
    if (pts === 0) return { status: "weak", reason: "No loan amount entered — this is worth up to 25 pts and is the biggest factor." };
    if (pct < 0.5) return { status: "weak", reason: `$${amt.toLocaleString()} requested — amounts over $250K score significantly higher.` };
    if (pct < 0.8) return { status: "ok", reason: `$${amt.toLocaleString()} requested — good, but $1M+ earns full marks.` };
    return { status: "strong", reason: `$${amt.toLocaleString()} requested — high-value deal, full score category.` };
  }

  if (label === "Credit Score") {
    if (pts === 0) return { status: "weak", reason: "Credit score range is unknown — add it to gain up to 20 pts." };
    if (pct < 0.5) return { status: "weak", reason: "Poor credit range (below 650) — high lender risk." };
    if (pct < 0.8) return { status: "ok", reason: "Fair-to-good credit range — qualifies for most products." };
    return { status: "strong", reason: "Excellent credit (750+) — top tier for lender matching." };
  }

  if (label === "Annual Revenue") {
    const rev = lead.annual_revenue || 0;
    if (pts === 0) return { status: "weak", reason: "No revenue data — enter annual revenue to unlock up to 15 pts." };
    if (pct < 0.6) return { status: "weak", reason: `$${rev.toLocaleString()} annual revenue — below $500K limits lender options.` };
    if (pct < 0.85) return { status: "ok", reason: `$${rev.toLocaleString()} annual revenue — solid, $5M+ earns full marks.` };
    return { status: "strong", reason: `$${rev.toLocaleString()} annual revenue — top-tier business financials.` };
  }

  if (label === "Time in Business") {
    const yrs = lead.years_in_business || 0;
    if (pts === 0) return { status: "weak", reason: "Years in business not entered — add it for up to 10 pts." };
    if (yrs < 1) return { status: "weak", reason: "Less than 1 year in business — startup risk is high for most lenders." };
    if (yrs < 3) return { status: "ok", reason: `${yrs} year(s) in business — 3+ years unlocks better rates.` };
    return { status: "strong", reason: `${yrs} years in business — established business, strong signal.` };
  }

  if (label === "Priority") {
    if (pts === 0) return { status: "weak", reason: "Priority not set — assign a priority to add up to 10 pts." };
    if (pct < 0.5) return { status: "weak", reason: "Low priority — bump to High or Urgent for a better score." };
    if (pct < 0.85) return { status: "ok", reason: "High priority — good internal signal." };
    return { status: "strong", reason: "Urgent priority — flagged for immediate attention." };
  }

  if (label === "Profile Completeness") {
    const missing = [];
    if (!lead.email) missing.push("email");
    if (!lead.phone) missing.push("phone");
    if (!lead.company) missing.push("company");
    if (!lead.source) missing.push("source");
    if (!lead.assigned_to) missing.push("assigned to");
    if (!lead.credit_score_range) missing.push("credit range");
    if (!lead.annual_revenue) missing.push("annual revenue");
    if (!lead.years_in_business) missing.push("years in business");
    if (!lead.next_follow_up) missing.push("follow-up date");
    if (pts === max) return { status: "strong", reason: "Profile fully complete — all key fields filled in." };
    if (pct < 0.5) return { status: "weak", reason: `Missing: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ` +${missing.length - 4} more` : ""}.` };
    return { status: "ok", reason: missing.length ? `Almost complete — still missing: ${missing.join(", ")}.` : "Profile mostly complete." };
  }

  if (label === "AI Due Diligence") {
    if (pts === 0) return { status: "weak", reason: "No enrichment run yet — run AI due diligence to unlock up to 10 pts." };
    if (pct < 0.5) return { status: "ok", reason: "Partial enrichment completed — run full due diligence for max points." };
    return { status: "strong", reason: "AI due diligence completed with strong results." };
  }

  if (label === "Property LTV") {
    if (pts === 0) return { status: "weak", reason: "High LTV or missing — lenders prefer under 75% LTV." };
    if (pct < 0.7) return { status: "ok", reason: "Moderate LTV — good but lower LTV improves terms." };
    return { status: "strong", reason: "Low LTV — strong collateral position for CRE lenders." };
  }

  if (label === "Pipeline Stage") {
    if (pts === 0) return { status: "weak", reason: "Lead is new/lost — move through the pipeline to gain stage points." };
    if (pct < 0.6) return { status: "ok", reason: "Early pipeline stage — progress to proposal or negotiation for more points." };
    return { status: "strong", reason: "Advanced pipeline stage — near or at funded status." };
  }

  return { status: "ok", reason: "" };
}

const statusIcon = {
  strong: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />,
  ok: <Minus className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />,
  weak: <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />,
};

const barColor = {
  strong: "bg-emerald-400",
  ok: "bg-amber-400",
  weak: "bg-red-400",
};

export default function LeadScorePanel({ lead }) {
  const { score, grade, breakdown, color, bg, ring } = scoreLeadQuality(lead);

  const strong = breakdown.filter(b => b.pts / b.max >= 0.8 && b.pts > 0);
  const weak = breakdown.filter(b => b.pts / b.max < 0.4 || b.pts === 0);

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

      {/* Strong / Weak summary pills */}
      {(strong.length > 0 || weak.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
            <p className="text-xs font-bold text-emerald-700 mb-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Strengths
            </p>
            {strong.length === 0
              ? <p className="text-xs text-slate-400 italic">None yet</p>
              : strong.map(b => <p key={b.label} className="text-xs text-emerald-700 leading-snug">· {b.label}</p>)
            }
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
            <p className="text-xs font-bold text-red-600 mb-1.5 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Weaknesses
            </p>
            {weak.length === 0
              ? <p className="text-xs text-slate-400 italic">None — great!</p>
              : weak.slice(0, 4).map(b => <p key={b.label} className="text-xs text-red-600 leading-snug">· {b.label}</p>)
            }
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          Why this score?
        </p>
        <div className="space-y-3">
          {breakdown.map(({ label, pts, max }) => {
            const insight = getCategoryInsight(label, pts, max, lead);
            const status = insight.status;
            return (
              <div key={label} className="bg-slate-50 rounded-lg p-2.5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-semibold">{label}</span>
                  <span className={cn("font-bold tabular-nums", pts === 0 ? "text-red-400" : pts === max ? "text-emerald-600" : "text-slate-600")}>
                    {pts} / {max}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", barColor[status])}
                    style={{ width: max > 0 ? `${(pts / max) * 100}%` : "0%" }}
                  />
                </div>
                {insight.reason && (
                  <div className="flex items-start gap-1.5">
                    {statusIcon[status]}
                    <p className="text-xs text-slate-500 leading-snug">{insight.reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}