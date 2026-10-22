import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle, FileText, UserCheck } from "lucide-react";

export default function ProviderSubmit() {
  const [formData, setFormData] = useState({
    businessName: "",
    borrowerEmail: "",
    amountRequested: "",
    creditScore: "",
    leadProviderCode: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Generate Lead List Borrower ID
    const leadBorrowerId = `BL-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      // Simulate API submission and store lead borrower session for portal access
      const leadEntry = {
        id: leadBorrowerId,
        businessName: formData.businessName,
        email: formData.borrowerEmail,
        amount: formData.amountRequested,
        creditScore: formData.creditScore,
        providerCode: formData.leadProviderCode || 'DIRECT_LEAD',
        submittedAt: new Date().toISOString()
      };

      // Save lead borrower account so borrower can log into portal automatically
      if (formData.borrowerEmail) {
        localStorage.setItem("glinfico_borrower_account", JSON.stringify({
          email: formData.borrowerEmail,
          code: leadBorrowerId,
          source: 'Lead List',
          businessName: formData.businessName
        }));
      }

      setTimeout(() => {
        setResult({
          success: true,
          leadId: leadBorrowerId,
          message: `Lead successfully queued! Assigned Lead Borrower ID: ${leadBorrowerId}`
        });
        setFormData({ businessName: "", borrowerEmail: "", amountRequested: "", creditScore: "", leadProviderCode: "" });
        setLoading(false);
      }, 600);
    } catch (err) {
      console.error("Deal submission error:", err);
      setResult({
        success: false,
        message: "Unable to process deal submission."
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-xl w-full bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold">Lead List Deal Submission</h1>
          <p className="text-slate-400 text-xs mt-1">Submit bulk or individual leads. Lead list borrowers automatically receive a <strong className="text-amber-400">BL-XXXXX ID</strong>.</p>
        </div>

        {result && (
          <div className={`p-4 rounded-xl border mb-6 text-sm flex items-start gap-3 ${
            result.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {result.success ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold">{result.message}</p>
              {result.success && (
                <p className="text-xs text-slate-300 mt-1">
                  The borrower can now log into <a href="/portal/borrower" className="text-amber-400 underline">Borrower Portal</a> using their email to track status.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Business Name</label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Acme Enterprises LLC"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Borrower Email</label>
            <input
              type="email"
              required
              value={formData.borrowerEmail}
              onChange={(e) => setFormData({ ...formData, borrowerEmail: e.target.value })}
              placeholder="owner@acme.com"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Requested Amount ($)</label>
              <input
                type="number"
                required
                value={formData.amountRequested}
                onChange={(e) => setFormData({ ...formData, amountRequested: e.target.value })}
                placeholder="150000"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Credit Score</label>
              <input
                type="number"
                required
                value={formData.creditScore}
                onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
                placeholder="680"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Lead Provider / Broker Code (Optional)</label>
            <input
              type="text"
              value={formData.leadProviderCode}
              onChange={(e) => setFormData({ ...formData, leadProviderCode: e.target.value })}
              placeholder="e.g. P-33412 or LEAD_GEN_01"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-amber-500/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {loading ? "Queueing Lead..." : "Submit Lead & Generate BL- ID"}
          </button>
        </form>
      </div>
    </div>
  );
}
