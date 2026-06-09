import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Intelligent column mapper — handles:
 * - Standard GLINFICO CSV columns
 * - 1003 Uniform Residential Loan Application exports
 * - Generic variations (first name, firstname, fname, etc.)
 */
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

  // Name — try multiple 1003 and generic formats
  const firstName = find('Owner First Name', 'First Name', 'FirstName', 'fname', 'Borrower First Name', 'BorrowerFirstName', 'First');
  const lastName = find('Owner Last Name', 'Last Name', 'LastName', 'lname', 'Borrower Last Name', 'BorrowerLastName', 'Last');

  // Parse combined "Full Name" if split names are missing
  let derivedFirst = firstName, derivedLast = lastName;
  if (!derivedFirst && !derivedLast) {
    const full = find('Name', 'Full Name', 'FullName', 'Applicant Name', 'BorrowerName', 'Borrower Name');
    if (full) {
      const parts = full.trim().split(/\s+/);
      derivedFirst = parts[0] || '';
      derivedLast = parts.slice(1).join(' ') || '';
    }
  }

  // Phone
  const phone = find('Mobile', 'Phone', 'Cell', 'Cell Phone', 'Mobile Phone', 'Phone Number', 'PhoneNumber', 'Borrower Phone', 'Contact Phone');

  // Email
  const email = find('Email', 'Email Address', 'EmailAddress', 'Borrower Email', 'BorrowerEmail', 'email');

  // Company / Business
  const company = find('Business Name', 'Company', 'Company Name', 'BusinessName', 'DBA', 'Employer Name', 'EmployerName', 'Business');

  // Revenue — monthly → annual
  const monthlyRevenue = findNum('Monthly Revenue', 'Monthly Income', 'MonthlyRevenue', 'Monthly Gross Income');
  const annualRevenue = findNum('Annual Revenue', 'AnnualRevenue', 'Annual Income', 'Yearly Revenue', 'Gross Annual Income')
    || (monthlyRevenue ? monthlyRevenue * 12 : undefined);

  // Loan amount
  const loanAmount = findNum('Loan Amount', 'LoanAmount', 'Requested Amount', 'Amount Requested', 'Amount', 'Loan Size', 'Requested Loan Amount');

  // Years in business
  const yearsRaw = find('Years In Business', 'YearsInBusiness', 'Time in Business', 'Business Age', 'Years Operating');
  const yearsInBusiness = yearsRaw ? parseFloat(yearsRaw) || undefined : undefined;

  // Loan type mapping
  const loanTypeRaw = find('Loan Type', 'LoanType', 'Loan Purpose', 'Product Type', 'ProductType').toLowerCase();
  let loan_type = 'business_loan';
  if (loanTypeRaw.includes('real estate') || loanTypeRaw.includes('cre') || loanTypeRaw.includes('commercial')) loan_type = 'commercial_real_estate';
  else if (loanTypeRaw.includes('equipment')) loan_type = 'equipment_financing';
  else if (loanTypeRaw.includes('sba')) loan_type = 'sba_loan';
  else if (loanTypeRaw.includes('line') || loanTypeRaw.includes('loc')) loan_type = 'line_of_credit';
  else if (loanTypeRaw.includes('invoice') || loanTypeRaw.includes('factoring')) loan_type = 'invoice_factoring';
  else if (loanTypeRaw.includes('mca') || loanTypeRaw.includes('merchant') || loanTypeRaw.includes('cash advance')) loan_type = 'merchant_cash_advance';

  // Credit score range
  const creditRaw = findNum('Credit Score', 'CreditScore', 'FICO', 'FICO Score', 'Credit');
  let credit_score_range = 'unknown';
  if (creditRaw >= 750) credit_score_range = 'excellent_750+';
  else if (creditRaw >= 700) credit_score_range = 'good_700-749';
  else if (creditRaw >= 650) credit_score_range = 'fair_650-699';
  else if (creditRaw > 0) credit_score_range = 'poor_below_650';

  // Source
  const sourceRaw = find('Source', 'Lead Source', 'LeadSource', 'Referral Source').toLowerCase();
  let source = 'other';
  if (sourceRaw.includes('web') || sourceRaw.includes('online')) source = 'website';
  else if (sourceRaw.includes('referral') || sourceRaw.includes('refer')) source = 'referral';
  else if (sourceRaw.includes('cold')) source = 'cold_call';
  else if (sourceRaw.includes('partner')) source = 'partner';
  else if (sourceRaw.includes('email') || sourceRaw.includes('campaign')) source = 'email_campaign';
  else if (sourceRaw.includes('social') || sourceRaw.includes('media')) source = 'social_media';

  const mapped = {
    first_name: derivedFirst,
    last_name: derivedLast,
    email,
    phone,
    company,
    loan_type,
    status: 'new',
    source,
    ...(annualRevenue && { annual_revenue: annualRevenue }),
    ...(loanAmount && { loan_amount: loanAmount }),
    ...(yearsInBusiness && { years_in_business: yearsInBusiness }),
    ...(credit_score_range !== 'unknown' && { credit_score_range }),
  };

  return mapped;
}

function getImportStats(rows) {
  const withEmail = rows.filter(r => r.email).length;
  const withAmount = rows.filter(r => r.loan_amount).length;
  const withCompany = rows.filter(r => r.company).length;
  const withRevenue = rows.filter(r => r.annual_revenue).length;
  const loanTypes = [...new Set(rows.map(r => r.loan_type))];
  return { withEmail, withAmount, withCompany, withRevenue, loanTypes };
}

export default function LeadBulkUpload({ open, onClose, onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [columnPreview, setColumnPreview] = useState([]);
  const inputRef = useRef();

  const handleFile = (file) => {
    setFileName(file.name);
    setRows([]);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      setColumnPreview(Object.keys(data[0] || {}));
      const mapped = data.map(mapRow).filter(r => r.first_name || r.email || r.company);
      setRows(mapped);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0, failed = 0;
    const batchSize = 20;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(row => base44.entities.Lead.create(row))
      );
      results.forEach(r => r.status === 'fulfilled' ? success++ : failed++);
      setProgress(Math.min(99, Math.round(((i + batchSize) / rows.length) * 100)));
    }
    setProgress(100);
    setImporting(false);
    setResult({ success, failed });
    if (success > 0) onImported();
  };

  const reset = () => { setRows([]); setFileName(''); setResult(null); setProgress(0); setColumnPreview([]); };

  const stats = rows.length > 0 ? getImportStats(rows) : null;

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); reset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Leads</DialogTitle>
        </DialogHeader>

        {!result ? (
          <>
            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
              />
              {fileName ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-10 w-10 text-amber-500 mx-auto" />
                  <p className="font-semibold text-slate-700">{fileName}</p>
                  <p className="text-sm text-slate-500">{rows.length} leads ready to import</p>
                  <p className="text-xs text-slate-400">Click to choose a different file</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-medium">Drop your Excel or CSV file here</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports: GLINFICO format · 1003 exports · Generic CRM exports
                  </p>
                  <p className="text-xs text-slate-400">
                    Auto-detects: Name, Email, Phone, Company, Revenue, Loan Amount, Credit Score, Source
                  </p>
                </div>
              )}
            </div>

            {/* Import stats preview */}
            {stats && rows.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Total Rows", value: rows.length, color: "text-slate-900" },
                    { label: "Has Email", value: `${stats.withEmail} (${Math.round(stats.withEmail/rows.length*100)}%)`, color: "text-blue-600" },
                    { label: "Has Amount", value: `${stats.withAmount} (${Math.round(stats.withAmount/rows.length*100)}%)`, color: "text-amber-600" },
                    { label: "Has Revenue", value: `${stats.withRevenue} (${Math.round(stats.withRevenue/rows.length*100)}%)`, color: "text-emerald-600" },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Detected columns */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex gap-2 items-start">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1">Detected {columnPreview.length} columns from your file</p>
                    <p className="text-xs text-blue-600 break-all">{columnPreview.slice(0, 12).join(', ')}{columnPreview.length > 12 ? ` +${columnPreview.length - 12} more` : ''}</p>
                  </div>
                </div>

                {/* Loan type breakdown */}
                <div className="flex flex-wrap gap-1.5">
                  {stats.loanTypes.map(lt => (
                    <span key={lt} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                      {lt?.replace(/_/g, ' ')} ({rows.filter(r => r.loan_type === lt).length})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preview table */}
            {rows.length > 0 && (
              <div className="max-h-52 overflow-y-auto border rounded-lg text-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium text-slate-600 text-xs">Name</th>
                      <th className="text-left p-2 font-medium text-slate-600 text-xs">Email</th>
                      <th className="text-left p-2 font-medium text-slate-600 text-xs">Company</th>
                      <th className="text-left p-2 font-medium text-slate-600 text-xs">Amount</th>
                      <th className="text-left p-2 font-medium text-slate-600 text-xs">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((r, i) => (
                      <tr key={i} className={`border-t ${!r.first_name && !r.email ? 'bg-red-50' : ''}`}>
                        <td className="p-2 text-xs">{r.first_name} {r.last_name}</td>
                        <td className="p-2 text-xs text-slate-500 truncate max-w-[130px]">{r.email || <span className="text-slate-300">—</span>}</td>
                        <td className="p-2 text-xs text-slate-500 truncate max-w-[110px]">{r.company || <span className="text-slate-300">—</span>}</td>
                        <td className="p-2 text-xs font-medium text-amber-700">{r.loan_amount ? `$${Number(r.loan_amount).toLocaleString()}` : '—'}</td>
                        <td className="p-2 text-xs text-slate-400">{r.loan_type?.replace(/_/g, ' ')}</td>
                      </tr>
                    ))}
                    {rows.length > 20 && (
                      <tr className="border-t bg-slate-50">
                        <td colSpan={5} className="p-2 text-center text-slate-400 text-xs">
                          +{rows.length - 20} more rows not shown
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {importing && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Importing {rows.length} leads in batches of 20...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { onClose(); reset(); }}>Cancel</Button>
              <Button
                onClick={handleImport}
                disabled={rows.length === 0 || importing}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {importing ? `Importing... ${progress}%` : `Import ${rows.length} Leads`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
            <div>
              <p className="text-xl font-bold text-slate-900">Import Complete!</p>
              <p className="text-slate-500 mt-1">
                <span className="text-emerald-600 font-semibold">{result.success} leads imported</span>
                {result.failed > 0 && <span className="text-red-500 ml-2">({result.failed} failed)</span>}
              </p>
            </div>
            {result.failed > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 text-left">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Some rows failed — usually due to missing required fields (first name or email). Check your file and re-import failed rows.</span>
              </div>
            )}
            <Button onClick={() => { onClose(); reset(); }} className="bg-amber-600 hover:bg-amber-700">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}