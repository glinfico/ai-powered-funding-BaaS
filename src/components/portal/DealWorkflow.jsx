import { CheckCircle2, Circle, Clock, FileText, Building2, BadgeCheck, Banknote, XCircle } from "lucide-react";

const STAGES = [
  { id: "submitted", label: "Submitted", desc: "Application received", icon: FileText },
  { id: "under_review", label: "Under Review", desc: "GLINFICO team reviewing", icon: Clock },
  { id: "docs_requested", label: "Docs Requested", desc: "Documents needed from you", icon: FileText },
  { id: "docs_received", label: "Docs Received", desc: "All documents received", icon: CheckCircle2 },
  { id: "lender_matched", label: "Lender Matched", desc: "Matched to a funding partner", icon: Building2 },
  { id: "term_sheet_sent", label: "Term Sheet Sent", desc: "Offer terms delivered", icon: FileText },
  { id: "approved", label: "Approved", desc: "Application approved by lender", icon: BadgeCheck },
  { id: "funded", label: "Funded", desc: "Funds disbursed — deal closed!", icon: Banknote },
];

const TERMINAL = ["declined", "withdrawn"];

const stageIndex = (stage) => STAGES.findIndex(s => s.id === stage);

export default function DealWorkflow({ deal }) {
  if (!deal) return null;

  const isTerminal = TERMINAL.includes(deal.stage);
  const currentIdx = stageIndex(deal.stage);

  return (
    <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-white font-bold text-base">{deal.borrower_name}</p>
          <p className="text-slate-400 text-sm capitalize">
            {deal.loan_type?.replace(/_/g, " ")} &middot;{" "}
            {deal.loan_amount
              ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(deal.loan_amount)
              : "—"}
          </p>
        </div>
        {deal.lender_name && (
          <div className="text-right">
            <p className="text-slate-500 text-xs">Lender</p>
            <p className="text-white text-sm font-medium">{deal.lender_name}</p>
          </div>
        )}
      </div>

      {isTerminal ? (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${deal.stage === "declined" ? "bg-red-500/10 border border-red-500/20" : "bg-slate-500/10 border border-slate-500/20"}`}>
          <XCircle className={`h-5 w-5 ${deal.stage === "declined" ? "text-red-400" : "text-slate-400"}`} />
          <div>
            <p className={`font-semibold text-sm ${deal.stage === "declined" ? "text-red-300" : "text-slate-300"}`}>
              {deal.stage === "declined" ? "Application Declined" : "Deal Withdrawn"}
            </p>
            {deal.stage === "declined" && (
              <p className="text-slate-400 text-xs mt-0.5">
                You may qualify for IDIQ Credit Monitoring to improve your profile.{" "}
                <a href="/fod/legal?section=borrower_consent" className="text-amber-400 hover:underline">Learn more →</a>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {STAGES.map((stage, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const upcoming = idx > currentIdx;
            const Icon = stage.icon;
            const isLast = idx === STAGES.length - 1;

            return (
              <div key={stage.id} className="flex items-start gap-4">
                {/* Connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                    done ? "bg-emerald-500 border-emerald-500" :
                    active ? "bg-amber-500 border-amber-500" :
                    "bg-[#0a0a12] border-slate-700"
                  }`}>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-black" />
                    ) : active ? (
                      <Icon className="h-3.5 w-3.5 text-black" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-slate-600" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-8 mt-0.5 ${done ? "bg-emerald-500/40" : "bg-slate-700/60"}`} />
                  )}
                </div>

                {/* Label */}
                <div className="pb-2 pt-0.5">
                  <p className={`text-sm font-semibold ${
                    done ? "text-emerald-400" :
                    active ? "text-amber-400" :
                    "text-slate-600"
                  }`}>
                    {stage.label}
                    {active && <span className="ml-2 text-xs font-normal text-amber-300/70 animate-pulse">● In Progress</span>}
                  </p>
                  <p className={`text-xs ${upcoming ? "text-slate-700" : "text-slate-500"}`}>{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deal.notes && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Notes from GLINFICO</p>
          <p className="text-slate-400 text-sm">{deal.notes}</p>
        </div>
      )}
    </div>
  );
}