import { useState } from "react";
import * as XLSX from "xlsx";
import { base44 } from "@/api/base44Client";
import { Upload, CheckCircle2, User, FileSpreadsheet, Copy, Check } from "lucide-react";

const loanTypes = [
  "Business Loan", "Equipment Financing", "Commercial Real Estate",
  "SBA Loan", "Line of Credit", "Invoice Factoring", "Merchant Cash Advance",
  "Bridge Loan", "Other"
];

// Same smart mapper used in the CRM bulk upload
function mapRow(row) {
  const keys = Object.keys(row);
  const find = (...candidates) => {
    for (const c of candidates) {
      const k = keys.find(k => k.toLowerCase().trim() === c.toLowerCase().trim());
      if (k && row[k] !== undefined && row[k] !== '') return String(row[k]).trim();
    }
    return '';
  };
  const findNum = (...candidates) => {
    const v = find(...candidates);
    return v ? Number(String(v).replace(/[$,]/g, '')) || undefined : undefined;
  };

  const firstName = find('Owner First Name', 'First Name', 'FirstName', 'fname', 'First');
  const lastName = find('Owner Last Name', 'Last Name', 'LastName', 'lname', 'Last');
  let derivedFirst = firstName, derivedLast = lastName;
  if (!derivedFirst && !derivedLast) {
    const full = find('Name', 'Full Name', 'FullName', 'Borrower Name');
    if (full) { const p = full.trim().split(/\s+/); derivedFirst = p[0] || ''; derivedLast = p.slice(1).join(' ') || ''; }
  }

  const phone = find('Mobile', 'Phone', 'Cell', 'Mobile Phone', 'Phone Number');
  const email = find('Email', 'Email Address', 'EmailAddress');
  const company = find('Business Name', 'Company', 'Company Name', 'BusinessName', 'DBA', 'Business');
  const monthlyRevenue = findNum('Monthly Revenue', 'Monthly Income', 'MonthlyRevenue');
  const annualRevenue = findNum('Annual Revenue', 'AnnualRevenue', 'Annual Income', 'Yearly Revenue') || (monthlyRevenue ? monthlyRevenue * 12 : undefined);
  const loanAmount = findNum('Loan Amount', 'LoanAmount', 'Requested Amount', 'Amount');
  const yearsRaw = find('Years In Business', 'YearsInBusiness', 'Time in Business', 'Business Age');
  const yearsInBusiness = yearsRaw ? parseFloat(yearsRaw) || undefined : undefined;

  const loanTypeRaw = find('Loan Type', 'LoanType', 'Loan Purpose').toLowerCase();
  let loan_type = 'business_loan';
  if (loanTypeRaw.includes('real estate') || loanTypeRaw.includes('cre')) loan_type = 'commercial_real_estate';
  else if (loanTypeRaw.includes('equipment')) loan_type = 'equipment_financing';
  else if (loanTypeRaw.includes('sba')) loan_type = 'sba_loan';
  else if (loanTypeRaw.includes('line') || loanTypeRaw.includes('loc')) loan_type = 'line_of_credit';
  else if (loanTypeRaw.includes('invoice') || loanTypeRaw.includes('factoring')) loan_type = 'invoice_factoring';
  else if (loanTypeRaw.includes('mca') || loanTypeRaw.includes('merchant') || loanTypeRaw.includes('cash advance')) loan_type = 'merchant_cash_advance';
  else if (loanTypeRaw.includes('bridge')) loan_type = 'other';

  return {
    first_name: derivedFirst || 'Unknown',
    last_name: derivedLast || 'Unknown',
    email, phone, company, loan_type, status: 'new', source: 'partner',
    ...(annualRevenue && { annual_revenue: annualRevenue }),
    ...(loanAmount && { loan_amount: loanAmount }),
    ...(yearsInBusiness && { years_in_business: yearsInBusiness }),
  };
}

export default function ProviderSubmit() {
  const [mode, setMode] = useState(null); // null | "single" | "bulk"
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", company: "", loan_type: "", loan_amount: "", annual_revenue: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { count, type }
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [copied, setCopied] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = (f) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      const mapped = data.map(mapRow).filter(r => r.first_name || r.email || r.company);
      setPreview(mapped);
    };
    reader.readAsArrayBuffer(f);
  };

  const handleSingle = async e => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.Lead.create({
      ...form,
      loan_amount: parseFloat(form.loan_amount) || 0,
      annual_revenue: parseFloat(form.annual_revenue) || 0,
      loan_type: form.loan_type.toLowerCase().replace(/ /g, "_").replace(/&/g, "").replace(/__/g, "_"),
      status: "new", source: "partner",
    });
    setLoading(false);
    setDone({ count: 1, type: 'single' });
  };

  const handleBulk = async () => {
    if (!preview.length) return;
    setLoading(true);
    for (let i = 0; i < preview.length; i += 50) {
      await base44.entities.Lead.bulkCreate(preview.slice(i, i + 50));
    }
    setLoading(false);
    setDone({ count: preview.length, type: 'bulk' });
  };

  const shareUrl = `${window.location.origin}/submit-leads`;
  const copyLink = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const reset = () => { setDone(null); setMode(null); setForm({ first_name:"",last_name:"",email:"",phone:"",company:"",loan_type:"",loan_amount:"",annual_revenue:"",notes:"" }); setFile(null); setPreview([]); };

  // Success screen
  if (done) return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-3">
          {done.type === 'bulk' ? `${done.count} Leads Submitted!` : 'Lead Submitted!'}
        </h2>
        <p className="text-slate-400 mb-8">Thank you! GLINFICO's team will review and process your submission shortly.</p>
        <button onClick={reset} className="px-6 py-2.5 rounded-xl border border-white/20 text-white hover:border-amber-400/50 hover:text-amber-400 text-sm font-medium transition-all">
          Submit More
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <span className="text-black font-extrabold text-sm">G</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">GLINFICO</p>
              <p className="text-amber-400 text-xs">Lead Provider Portal</p>
            </div>
          </div>
          {/* Copy link button */}
          <button onClick={copyLink} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 text-xs transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-12 pb-24">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-3">Submit <span className="text-amber-400">Leads</span></h1>
          <p className="text-slate-400">Send us your leads one at a time or upload a full list — we handle the rest.</p>
        </div>

        {/* Mode selector */}
        {!mode && (
          <div className="grid sm:grid-cols-2 gap-5">
            <button onClick={() => setMode("single")}
              className="bg-[#0f0f1e] border border-white/10 hover:border-amber-500/50 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:border-amber-500/50 transition-all">
                <User className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base mb-1">Single Lead</p>
                <p className="text-slate-500 text-sm">Fill out a quick form for one lead</p>
              </div>
            </button>
            <button onClick={() => setMode("bulk")}
              className="bg-[#0f0f1e] border border-white/10 hover:border-amber-500/50 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:border-amber-500/50 transition-all">
                <FileSpreadsheet className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base mb-1">Bulk Upload</p>
                <p className="text-slate-500 text-sm">Upload an XLS / CSV list of leads</p>
              </div>
            </button>
          </div>
        )}

        {/* Single lead form */}
        {mode === "single" && (
          <>
            <button onClick={() => setMode(null)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors">← Back</button>
            <form onSubmit={handleSingle} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-7 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {[["first_name","First Name","John",true],["last_name","Last Name","Smith",true]].map(([k,label,ph,req]) => (
                  <div key={k}>
                    <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">{label}</label>
                    <input required={req} value={form[k]} onChange={set(k)} placeholder={ph}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm" />
                  </div>
                ))}
              </div>
              {[["email","Email","john@company.com","email"],["phone","Phone","555-000-0000","tel"],["company","Business Name","ACME Corp","text"]].map(([k,label,ph,type]) => (
                <div key={k}>
                  <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">{label}</label>
                  <input type={type} value={form[k]} onChange={set(k)} placeholder={ph}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm" />
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Loan Type</label>
                  <select required value={form.loan_type} onChange={set("loan_type")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 text-sm">
                    <option value="">Select type...</option>
                    {loanTypes.map(t => <option key={t} value={t} className="bg-[#0f0f1e]">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Loan Amount ($)</label>
                  <input type="number" value={form.loan_amount} onChange={set("loan_amount")} placeholder="500000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Monthly Revenue ($)</label>
                <input type="number" value={form.annual_revenue} onChange={set("annual_revenue")} placeholder="50000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm" />
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Notes</label>
                <textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Any additional context..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold transition-all">
                {loading ? "Submitting..." : "Submit Lead →"}
              </button>
            </form>
          </>
        )}

        {/* Bulk upload */}
        {mode === "bulk" && (
          <>
            <button onClick={() => setMode(null)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors">← Back</button>
            <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-7 space-y-5">
              <div>
                <h3 className="text-white font-bold text-base mb-1">Upload Your Lead List</h3>
                <p className="text-slate-500 text-sm">We auto-detect your columns — no reformatting needed. Supports XLS, XLSX, and CSV.</p>
              </div>

              {/* Accepted columns hint */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300/80">
                <span className="font-semibold text-amber-400">Recognized columns: </span>
                Business Name, Owner First Name, Owner Last Name, Mobile, Email, Monthly Revenue, Loan Amount, Loan Type, Years In Business
              </div>

              <div
                className="border-2 border-dashed border-white/10 hover:border-amber-500/30 rounded-xl p-10 text-center transition-all cursor-pointer"
                onClick={() => document.getElementById('bulk-upload').click()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
              >
                <Upload className="w-9 h-9 text-amber-400/50 mx-auto mb-3" />
                {file ? (
                  <div>
                    <p className="text-white font-semibold">{file.name}</p>
                    <p className="text-emerald-400 text-sm mt-1">{preview.length} leads detected — ready to submit</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white font-medium">Drop file here or click to browse</p>
                    <p className="text-slate-500 text-sm mt-1">XLS · XLSX · CSV</p>
                  </div>
                )}
                <input id="bulk-upload" type="file" accept=".csv,.xls,.xlsx" className="hidden"
                  onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
              </div>

              {/* Preview table */}
              {preview.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 text-xs">
                  <table className="w-full">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        {["Name","Email","Company","Amount"].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-slate-400 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 15).map((r, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="px-3 py-2 text-white">{r.first_name} {r.last_name}</td>
                          <td className="px-3 py-2 text-slate-400 truncate max-w-[120px]">{r.email || '—'}</td>
                          <td className="px-3 py-2 text-slate-400 truncate max-w-[100px]">{r.company || '—'}</td>
                          <td className="px-3 py-2 text-amber-400">{r.loan_amount ? `$${Number(r.loan_amount).toLocaleString()}` : '—'}</td>
                        </tr>
                      ))}
                      {preview.length > 15 && (
                        <tr className="border-t border-white/5">
                          <td colSpan={4} className="px-3 py-2 text-center text-slate-500">+{preview.length - 15} more rows</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <button onClick={handleBulk} disabled={!preview.length || loading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold transition-all">
                {loading ? "Submitting..." : `Submit ${preview.length || ''} Leads →`}
              </button>
            </div>
          </>
        )}

        {/* Footer note */}
        {!mode && (
          <p className="text-center text-slate-600 text-xs mt-10">
            Powered by <span className="text-amber-500 font-semibold">GLINFICO Financial Operations</span> · All submissions are encrypted and secure.
          </p>
        )}
      </div>
    </div>
  );
}