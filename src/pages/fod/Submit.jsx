import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import { base44 } from "@/api/base44Client";
import { Upload, User, LogIn } from "lucide-react";

const loanTypes = ["Business Loan", "Equipment Financing", "Commercial Real Estate", "SBA Loan", "Line of Credit", "Invoice Factoring", "Merchant Cash Advance", "M&A Deal", "Bridge Loan", "Other"];

const FIELD = (k, label, ph, type = "text") => ({ k, label, ph, type });

export default function FodSubmit() {
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setAuthUser(u); setAuthChecked(true); }).catch(() => setAuthChecked(true));
  }, []);

  const [mode, setMode] = useState(null); // null | "individual" | "bulk"
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", company: "", loan_type: "", loan_amount: "", annual_revenue: "", years_in_business: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleIndividual = async (e) => {
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

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setBulkLoading(true);
    try {
      const text = await csvFile.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase().replace(/ /g, "_"));
      const leads = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return {
          first_name: obj.first_name || obj.firstname || obj.first || "",
          last_name: obj.last_name || obj.lastname || obj.last || "",
          email: obj.email || "",
          phone: obj.phone || obj.phone_number || "",
          company: obj.company || obj.business_name || obj.company_name || "",
          loan_type: (obj.loan_type || "other").toLowerCase().replace(/ /g, "_").replace(/&/g, "").replace(/__/g, "_"),
          loan_amount: parseFloat(obj.loan_amount || obj.amount || 0) || 0,
          annual_revenue: parseFloat(obj.annual_revenue || obj.revenue || 0) || 0,
          years_in_business: parseFloat(obj.years_in_business || obj.years || 0) || 0,
          notes: obj.notes || obj.description || "",
          status: "new",
          source: "website",
        };
      }).filter(l => l.first_name || l.email);

      await base44.entities.Lead.bulkCreate(leads);
      setBulkResult({ count: leads.length, success: true });
    } catch (err) {
      setBulkResult({ success: false, error: err.message });
    }
    setBulkLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
        <FodNav />
        <div className="flex-1 flex items-center justify-center px-4 pt-20">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
            <h2 className="text-3xl font-extrabold mb-3">Deal Submitted!</h2>
            <p className="text-slate-400 text-lg mb-6">Our team will review your deal and match you with the best lenders within 24 hours.</p>
            <button onClick={() => { setSubmitted(false); setMode(null); setForm({ first_name:"",last_name:"",email:"",phone:"",company:"",loan_type:"",loan_amount:"",annual_revenue:"",years_in_business:"",notes:"" }); }}
              className="px-6 py-2.5 rounded-xl border border-white/20 text-white hover:border-amber-400/50 hover:text-amber-400 text-sm font-medium transition-all">
              Submit Another Deal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bulkResult?.success) {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
        <FodNav />
        <div className="flex-1 flex items-center justify-center px-4 pt-20">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
            <h2 className="text-3xl font-extrabold mb-3">{bulkResult.count} Leads Imported!</h2>
            <p className="text-slate-400 text-lg mb-6">All leads have been added to your pipeline and are ready for matching.</p>
            <button onClick={() => { setBulkResult(null); setMode(null); setCsvFile(null); }}
              className="px-6 py-2.5 rounded-xl border border-white/20 text-white hover:border-amber-400/50 hover:text-amber-400 text-sm font-medium transition-all">
              Upload More
            </button>
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

      {/* Auth nudge for guests */}
      {authChecked && !authUser && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-amber-300 font-semibold text-sm">Sign in for faster deal tracking</p>
              <p className="text-slate-400 text-xs mt-0.5">Already a member? Sign in to track your deals in real time.</p>
            </div>
            <button
              onClick={() => base44.auth.redirectToLogin('/portal/redirect')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all whitespace-nowrap"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Mode selector */}
      {!mode && (
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-32">
          <div className="grid sm:grid-cols-2 gap-6">
            <button onClick={() => setMode("individual")}
              className="bg-[#0f0f1e] border border-white/10 hover:border-amber-500/50 rounded-2xl p-10 flex flex-col items-center gap-4 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-500/60 transition-all">
                <User className="w-7 h-7 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-1">Individual Submission</p>
                <p className="text-slate-400 text-sm">Submit a single deal with full details</p>
              </div>
            </button>
            <button onClick={() => setMode("bulk")}
              className="bg-[#0f0f1e] border border-white/10 hover:border-amber-500/50 rounded-2xl p-10 flex flex-col items-center gap-4 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-500/60 transition-all">
                <Upload className="w-7 h-7 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-1">Bulk Lead Upload</p>
                <p className="text-slate-400 text-sm">Upload a CSV, Excel sheet, or Google Sheet export</p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Individual Form */}
      {mode === "individual" && (
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
          <button onClick={() => setMode(null)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors">
            ← Back
          </button>
          <form onSubmit={handleIndividual} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 space-y-5">
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
      )}

      {/* Bulk Upload Form */}
      {mode === "bulk" && (
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
          <button onClick={() => setMode(null)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors">
            ← Back
          </button>
          <form onSubmit={handleBulkUpload} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 space-y-6">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Bulk Lead Import</h3>
              <p className="text-slate-400 text-sm">Upload a CSV or Excel export. Columns recognized: <span className="text-amber-400">first_name, last_name, email, phone, company, loan_type, loan_amount, annual_revenue, years_in_business, notes</span></p>
            </div>

            <div className="border-2 border-dashed border-white/10 hover:border-amber-500/30 rounded-xl p-10 text-center transition-all cursor-pointer relative"
              onClick={() => document.getElementById('csv-upload').click()}>
              <Upload className="w-10 h-10 text-amber-400/60 mx-auto mb-3" />
              {csvFile ? (
                <div>
                  <p className="text-white font-medium">{csvFile.name}</p>
                  <p className="text-slate-400 text-sm mt-1">{(csvFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-white font-medium">Click to upload file</p>
                  <p className="text-slate-400 text-sm mt-1">CSV, XLS, or XLSX · Export Google Sheets as CSV</p>
                </div>
              )}
              <input id="csv-upload" type="file" accept=".csv,.xls,.xlsx" className="hidden"
                onChange={e => setCsvFile(e.target.files[0])} />
            </div>

            {bulkResult?.success === false && (
              <p className="text-red-400 text-sm">Error: {bulkResult.error}</p>
            )}

            <button type="submit" disabled={!csvFile || bulkLoading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold transition-all">
              {bulkLoading ? "Importing Leads..." : "Import Leads →"}
            </button>
          </form>
        </section>
      )}

      <FodFooter />
    </div>
  );
}