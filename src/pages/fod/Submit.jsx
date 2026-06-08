import { useState } from "react";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import { base44 } from "@/api/base44Client";

const loanTypes = ["Business Loan", "Equipment Financing", "Commercial Real Estate", "SBA Loan", "Line of Credit", "Invoice Factoring", "Merchant Cash Advance", "M&A Deal", "Bridge Loan", "Other"];

export default function FodSubmit() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", company: "", loan_type: "", loan_amount: "", annual_revenue: "", years_in_business: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.Lead.create({
      ...form,
      loan_amount: parseFloat(form.loan_amount) || 0,
      annual_revenue: parseFloat(form.annual_revenue) || 0,
      years_in_business: parseFloat(form.years_in_business) || 0,
      loan_type: form.loan_type.toLowerCase().replace(/ /g, "_").replace(/&/g, "").replace(/__/g, "_"),
      status: "new",
      source: "website",
    });
    setLoading(false);
    setSubmitted(true);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
        <FodNav />
        <div className="flex-1 flex items-center justify-center px-4 pt-20">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
            <h2 className="text-3xl font-extrabold mb-3">Deal Submitted!</h2>
            <p className="text-slate-400 text-lg">Our team will review your deal and match you with the best lenders within 24 hours.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <FodNav />

      <section className="relative pt-32 pb-12 px-4 text-center overflow-hidden">
        <Starfield />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4">Submit a <span className="text-amber-400">Deal</span></h1>
          <p className="text-slate-300 text-lg">Get matched with 500+ lenders in minutes.</p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
        <form onSubmit={handleSubmit} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {[["first_name", "First Name", "John"], ["last_name", "Last Name", "Smith"]].map(([k, label, ph]) => (
              <div key={k}>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">{label}</label>
                <input required value={form[k]} onChange={set(k)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm" placeholder={ph} />
              </div>
            ))}
          </div>
          {[["email", "Email", "you@company.com", "email"], ["phone", "Phone", "555-000-0000", "tel"], ["company", "Company / Business Name", "ACME Corp", "text"]].map(([k, label, ph, type]) => (
            <div key={k}>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">{label}</label>
              <input type={type} value={form[k]} onChange={set(k)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm" placeholder={ph} />
            </div>
          ))}
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Loan Type</label>
            <select required value={form.loan_type} onChange={set("loan_type")} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 text-sm">
              <option value="">Select loan type...</option>
              {loanTypes.map(t => <option key={t} value={t} className="bg-[#0f0f1e]">{t}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[["loan_amount", "Loan Amount ($)", "500000"], ["annual_revenue", "Annual Revenue ($)", "1000000"], ["years_in_business", "Years in Business", "5"]].map(([k, label, ph]) => (
              <div key={k}>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">{label}</label>
                <input type="number" value={form[k]} onChange={set(k)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm" placeholder={ph} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Additional Notes</label>
            <textarea rows={3} value={form.notes} onChange={set("notes")} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm resize-none" placeholder="Any additional details about your funding needs..." />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold transition-all">
            {loading ? "Submitting..." : "Submit Deal →"}
          </button>
        </form>
      </section>

      <FodFooter />
    </div>
  );
}