import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function mapRow(row) {
  const phone = row['Mobile'] ? String(row['Mobile']) : '';
  const annualRevenue = row['Monthly Revenue'] ? Number(row['Monthly Revenue']) * 12 : undefined;
  return {
    first_name: String(row['Owner First Name'] || '').trim(),
    last_name: String(row['Owner Last Name'] || '').trim(),
    email: String(row['Email'] || '').trim(),
    phone,
    company: String(row['Business Name'] || '').trim(),
    annual_revenue: annualRevenue,
    status: 'new',
    loan_type: 'business_loan',
  };
}

export default function LeadBulkUpload({ open, onClose, onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (file) => {
    setFileName(file.name);
    setRows([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      const mapped = data.map(mapRow).filter(r => r.first_name || r.email);
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
    const batchSize = 10;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(row =>
          base44.entities.Lead.create(row).then(() => success++).catch(() => failed++)
        )
      );
      setProgress(Math.round(((i + batchSize) / rows.length) * 100));
    }
    setImporting(false);
    setResult({ success, failed });
    onImported();
  };

  const reset = () => { setRows([]); setFileName(''); setResult(null); setProgress(0); };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Leads from Excel</DialogTitle>
        </DialogHeader>

        {!result ? (
          <>
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
                  <p className="text-xs text-slate-400">
                    Expected columns: Business Name, Mobile, Email,<br />
                    Owner First Name, Owner Last Name, Monthly Revenue
                  </p>
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <div className="max-h-44 overflow-y-auto border rounded-lg text-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium text-slate-600">Name</th>
                      <th className="text-left p-2 font-medium text-slate-600">Email</th>
                      <th className="text-left p-2 font-medium text-slate-600">Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 15).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{r.first_name} {r.last_name}</td>
                        <td className="p-2 text-slate-500 truncate max-w-[140px]">{r.email}</td>
                        <td className="p-2 text-slate-500 truncate max-w-[120px]">{r.company}</td>
                      </tr>
                    ))}
                    {rows.length > 15 && (
                      <tr className="border-t bg-slate-50">
                        <td colSpan={3} className="p-2 text-center text-slate-400 text-xs">
                          +{rows.length - 15} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {importing && (
              <div className="space-y-1">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 text-right">{progress}% complete</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { onClose(); reset(); }}>Cancel</Button>
              <Button
                onClick={handleImport}
                disabled={rows.length === 0 || importing}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {importing ? 'Importing...' : `Import ${rows.length} Leads`}
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
            <Button onClick={() => { onClose(); reset(); }} className="bg-amber-600 hover:bg-amber-700">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}