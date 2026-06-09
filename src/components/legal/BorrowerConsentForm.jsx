import { useState } from "react";
import { CheckCircle2, Shield, Database, Building2, CreditCard, Lock } from "lucide-react";

const PROVIDERS = [
  {
    icon: Shield,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    name: "IDIQ — Soft Credit Pull",
    badge: "Coming Soon",
    badgeColor: "bg-amber-500/20 text-amber-300",
    description:
      "A soft inquiry will be conducted via IDIQ to retrieve your business credit profile. This does NOT affect your personal credit score. Information pulled includes: trade lines, payment history, derogatory marks, and public records associated with your business EIN.",
  },
  {
    icon: Database,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    name: "Plaid — Bank & Revenue Verification",
    badge: "Coming Soon",
    badgeColor: "bg-blue-500/20 text-blue-300",
    description:
      "Plaid will be used to securely connect to your business bank accounts to verify revenue, cash flow, and average daily balance. No credentials are stored by GLINFICO. Plaid uses bank-grade encryption and read-only access.",
  },
  {
    icon: Building2,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    name: "CBRE / CoStar — Property Valuation",
    badge: "Real Estate Deals",
    badgeColor: "bg-purple-500/20 text-purple-300",
    description:
      "For commercial real estate loan requests, GLINFICO will obtain an estimated property valuation via CBRE and/or CoStar commercial data feeds. This estimate is used for initial underwriting and loan-to-value (LTV) calculations only.",
  },
  {
    icon: CreditCard,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    name: "American Eagle — Soft Closing",
    badge: "Closing",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
    description:
      "GLINFICO partners with American Eagle Title & Closing Services for facilitated soft closings. Alternatively, closing may be conducted through the funding lender's preferred banking institution.",
  },
];

const REJECTION_NOTICE = {
  icon: Lock,
  color: "text-rose-400",
  bg: "bg-rose-500/10 border-rose-500/30",
  title: "Credit-Based Rejection — Automatic Referral to IDIQ Credit Services",
  body: `If your application is declined due to credit-related reasons, you will automatically be referred to IDIQ's Credit Monitoring & Credit Building program. This is a monthly subscription service (fee disclosed at enrollment) that provides:

• 24/7 credit monitoring across all three bureaus
• Credit score tracking and improvement tools
• Personalized credit-building recommendations
• Dispute assistance for inaccurate negative items
• Identity theft protection

Enrollment is optional but strongly recommended to improve your eligibility for future funding. You may opt out at any time directly through IDIQ. GLINFICO receives a referral fee for this partnership, disclosed in our full compensation disclosure.`,
};

export default function BorrowerConsentForm() {
  const [checked, setChecked] = useState({
    credit: false,
    revenue: false,
    property: false,
    rejection: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const allChecked = Object.values(checked).every(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (allChecked) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Consent Recorded</h3>
        <p className="text-slate-400 text-sm max-w-sm">
          Your acknowledgment has been saved. You may proceed with your funding application.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <p className="text-amber-300 text-sm font-semibold mb-1">⚠ Important — Please Read Before Proceeding</p>
        <p className="text-slate-400 text-sm">
          By submitting a funding application through GLINFICO LP, you authorize us and our partners to perform the
          data pulls described below. All activity is performed under applicable federal and state privacy laws,
          including the Fair Credit Reporting Act (FCRA) and Gramm-Leach-Bliley Act (GLBA).
        </p>
      </div>

      {/* Data Provider Cards */}
      <div className="space-y-4">
        {PROVIDERS.map((p, i) => (
          <div key={i} className={`border rounded-xl p-5 ${p.bg}`}>
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                <p.icon className={`h-5 w-5 ${p.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-white font-semibold text-sm">{p.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.badgeColor}`}>{p.badge}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{p.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection / IDIQ Credit Building Notice */}
      <div className={`border rounded-xl p-5 ${REJECTION_NOTICE.bg}`}>
        <div className="flex items-start gap-4">
          <REJECTION_NOTICE.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${REJECTION_NOTICE.color}`} />
          <div>
            <p className="text-rose-300 font-semibold text-sm mb-2">{REJECTION_NOTICE.title}</p>
            {REJECTION_NOTICE.body.split("\n").map((line, i) => {
              const t = line.trim();
              if (!t) return <div key={i} className="h-1" />;
              if (t.startsWith("•"))
                return <li key={i} className="text-slate-400 text-xs ml-4 list-none mb-0.5">{t}</li>;
              return <p key={i} className="text-slate-400 text-xs leading-relaxed mb-1">{t}</p>;
            })}
          </div>
        </div>
      </div>

      {/* Consent Checkboxes */}
      <form onSubmit={handleSubmit} className="bg-[#0a0a12] border border-white/10 rounded-xl p-5 space-y-4">
        <p className="text-white font-semibold text-sm mb-2">Your Acknowledgments</p>

        {[
          { key: "credit", label: "I authorize GLINFICO LP and its partners to perform a soft credit inquiry on my business via IDIQ. I understand this does not affect my personal credit score." },
          { key: "revenue", label: "I authorize GLINFICO LP to verify my business revenue and banking data via Plaid's read-only API. I understand no credentials are stored." },
          { key: "property", label: "For real estate loans: I authorize GLINFICO LP to obtain a property valuation estimate via CBRE / CoStar commercial data services." },
          { key: "rejection", label: "I understand that if my application is declined for credit-related reasons, I may be referred to IDIQ's Credit Monitoring & Building program (optional monthly subscription). I may opt out at any time." },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setChecked(prev => ({ ...prev, [key]: !prev[key] }))}
              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                checked[key]
                  ? "bg-amber-500 border-amber-500"
                  : "border-slate-600 hover:border-amber-500/50"
              }`}
            >
              {checked[key] && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
            </div>
            <span className="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">
              {label}
            </span>
          </label>
        ))}

        <button
          type="submit"
          disabled={!allChecked}
          className={`w-full mt-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            allChecked
              ? "bg-amber-500 hover:bg-amber-400 text-black"
              : "bg-white/5 text-slate-600 cursor-not-allowed"
          }`}
        >
          {allChecked ? "Submit Consent & Continue →" : "Please acknowledge all items above"}
        </button>
      </form>

      <p className="text-slate-600 text-xs text-center">
        This consent is valid for 90 days from the date of submission. Questions? Contact{" "}
        <a href="mailto:compliance@glinfico.com" className="text-amber-500 hover:underline">compliance@glinfico.com</a>
      </p>
    </div>
  );
}