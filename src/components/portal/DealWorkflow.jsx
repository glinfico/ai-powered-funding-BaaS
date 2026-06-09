import { useState } from "react";
import { CheckCircle2, Circle, Clock, FileText, Building2, BadgeCheck, Banknote, XCircle, ChevronDown, Upload, AlertTriangle } from "lucide-react";
import LenderMatchBadge from "@/components/crm/LenderMatchBadge";

const STAGES = [
  {
    id: "submitted",
    label: "Submitted",
    desc: "Application received by GLINFICO",
    icon: FileText,
    detail: "Your application has been received and is in our queue for review. You'll hear from us within 1-2 business days.",
    action: null,
  },
  {
    id: "under_review",
    label: "Under Review",
    desc: "GLINFICO team reviewing your file",
    icon: Clock,
    detail: "Our underwriting team is actively reviewing your application, verifying business details, and assessing your loan profile.",
    action: null,
  },
  {
    id: "docs_requested",
    label: "Docs Requested",
    desc: "Documents needed from you",
    icon: Upload,
    detail: "We need supporting documents to continue. Please provide: last 3 months bank statements, 2 years tax returns, business license, and voided check.",
    action: { label: "Upload Documents", href: "/fod/submit" },
  },
  {
    id: "docs_received",
    label: "Docs Received",
    desc: "All documents received & verified",
    icon: CheckCircle2,
    detail: "Thank you! We have received your documents and are verifying them before forwarding to our lender partners.",
    action: null,
  },
  {
    id: "lender_matched",
    label: "Lender Matched",
    desc: "Matched to a funding partner",
    icon: Building2,
    detail: "Great news — we have identified a lender that fits your profile. They will review your file and respond with preliminary terms.",
    action: null,
  },
  {
    id: "term_sheet_sent",
    label: "Term Sheet Sent",
    desc: "Offer terms delivered to you",
    icon: FileText,
    detail: "A term sheet has been sent to your email. Please review the proposed interest rate, term length, and repayment schedule carefully.",
    action: { label: "Review Term Sheet", href: "mailto:deals@glinfico.com" },
  },
  {
    id: "approved",
    label: "Approved",
    desc: "Application approved by lender",
    icon: BadgeCheck,
    detail: "Congratulations — your application has been approved! Final closing documents are being prepared. American Eagle closing services will coordinate next steps.",
    action: { label: "Contact Closing Team", href: "mailto:closing@glinfico.com" },
  },
  {
    id: "funded",
    label: "Funded",
    desc: "Funds disbursed — deal closed!",
    icon: Banknote,
    detail: "Funding complete! Your funds have been disbursed to your designated account. Thank you for choosing GLINFICO.",
    action: null,
  },
];

const TERMINAL = ["declined", "withdrawn"];
const stageIndex = (stage) => STAGES.findIndex(s => s.id === stage);

export default function DealWorkflow({ deal }) {
  const [expanded, setExpanded] = useState(null);
  if (!deal) return null;

  const isTerminal = TERMINAL.includes(deal.stage);
  const currentIdx = stageIndex(deal.stage);

  return (
    <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-white font-bold text-base">{deal.borrower_name}</p>
          <p className="text-slate-400 text-sm capitalize">
            {deal.loan_type?.replace(/_/g, " ")} &middot;{" "}
            {deal.loan_amount
              ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(deal.loan_amount)
              : "—"}
          </p>
        </div>
        <div className="text-right">
          {deal.lender_name && (
            <>
              <p className="text-slate-500 text-xs">Matched Lender</p>
              <p className="text-amber-400 text-sm font-semibold">{deal.lender_name}</p>
            </>
          )}
          {deal.deal_number && (
            <p className="text-slate-600 text-xs mt-1">#{deal.deal_number}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isTerminal && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress</span>
            <span>{Math.round(((currentIdx + 1) / STAGES.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.round(((currentIdx + 1) / STAGES.length) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {isTerminal ? (
        <div>
          <div className={`flex items-center gap-3 rounded-xl px-4 py-4 mb-4 ${deal.stage === "declined" ? "bg-red-500/10 border border-red-500/20" : "bg-slate-500/10 border border-slate-500/20"}`}>
            <XCircle className={`h-5 w-5 flex-shrink-0 ${deal.stage === "declined" ? "text-red-400" : "text-slate-400"}`} />
            <div>
              <p className={`font-semibold text-sm ${deal.stage === "declined" ? "text-red-300" : "text-slate-300"}`}>
                {deal.stage === "declined" ? "Application Declined" : "Deal Withdrawn"}
              </p>
              {deal.stage === "declined" && (
                <p className="text-slate-400 text-xs mt-1">
                  You may qualify for IDIQ Credit Monitoring to rebuild your profile and reapply.{" "}
                  <a href="/fod/legal?section=borrower_consent" className="text-amber-400 hover:underline">Learn more →</a>
                </p>
              )}
            </div>
          </div>
          {deal.stage === "declined" && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 text-sm font-semibold">Next Step: Credit Improvement</p>
                <p className="text-slate-400 text-xs mt-1">Our IDIQ partner program can help you improve your business credit score. Enrollment is free to start.</p>
                <a href="https://idiq.com" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-3 py-1.5 bg-amber-500 text-black text-xs font-semibold rounded-lg hover:bg-amber-400 transition-all">
                  Explore IDIQ Program →
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {STAGES.map((stage, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const upcoming = idx > currentIdx;
            const Icon = stage.icon;
            const isLast = idx === STAGES.length - 1;
            const isExpanded = expanded === stage.id;

            return (
              <div key={stage.id}>
                <button
                  onClick={() => active || done ? setExpanded(isExpanded ? null : stage.id) : null}
                  className={`w-full flex items-start gap-4 text-left ${(active || done) ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Connector column */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                      done ? "bg-emerald-500 border-emerald-500" :
                      active ? "bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/30" :
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
                      <div className={`w-0.5 mt-0.5 ${isExpanded ? 'h-0' : 'h-8'} ${done ? "bg-emerald-500/40" : "bg-slate-700/60"} transition-all`} />
                    )}
                  </div>

                  {/* Label row */}
                  <div className={`flex-1 pb-2 pt-0.5 flex items-start justify-between ${!isLast ? '' : ''}`}>
                    <div>
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
                    {(active || done) && (
                      <ChevronDown className={`h-4 w-4 text-slate-500 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="ml-11 mb-4">
                    <div className={`rounded-xl p-4 border text-xs ${active ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                      <p className="text-slate-300 leading-relaxed mb-3">{stage.detail}</p>
                      {stage.id === 'lender_matched' && active && (
                        <LenderMatchBadge lead={deal} expanded />
                      )}
                      {stage.action && active && (
                        <a
                          href={stage.action.href}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black text-xs font-semibold rounded-lg hover:bg-amber-400 transition-all"
                        >
                          {stage.action.label} →
                        </a>
                      )}
                    </div>
                    {!isLast && <div className={`w-0.5 h-4 ml-[-1.25rem] mt-0 ${done ? "bg-emerald-500/40" : "bg-slate-700/60"}`} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deal notes */}
      {deal.notes && !deal.notes.startsWith('⚡') && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Notes from GLINFICO</p>
          <p className="text-slate-400 text-sm">{deal.notes}</p>
        </div>
      )}
    </div>
  );
}