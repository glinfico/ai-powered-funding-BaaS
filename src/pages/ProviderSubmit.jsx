import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProviderSubmit() {
  const [formData, setFormData] = useState({
    businessName: "",
    amountRequested: "",
    creditScore: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/deals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `Deal successfully queued! ID: ${data.dealId}`
        });
        setFormData({ businessName: "", amountRequested: "", creditScore: "" });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to process deal submission."
        });
      }
    } catch (err) {
      console.error("Deal submission network error:", err);
      setResult({
        success: false,
        message: "Unable to connect to the backend server."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-[#0f0f1e] border border-white/10 rounded-3xl shadow-2xl text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">
          Submit a <span className="text-amber-400">Deal</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Input the borrower or merchant details to queue for automated processing and lender matching.
        </p>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm ${
          result.success 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {result.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Business Name</label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            placeholder="e.g. Seattle Convenience & Grocery"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount Requested ($)</label>
            <input
              type="number"
              required
              value={formData.amountRequested}
              onChange={(e) => setFormData({ ...formData, amountRequested: e.target.value })}
              placeholder="50000"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Estimated Credit Score</label>
            <input
              type="number"
              required
              value={formData.creditScore}
              onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
              placeholder="720"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 mt-4"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {loading ? "Processing Deal..." : "Submit Deal to Pipeline"}
        </button>
      </form>
    </div>
  );
}
