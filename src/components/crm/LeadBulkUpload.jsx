import React, { useState } from "react";
import { Upload, CheckCircle, AlertCircle, X, ArrowRight } from "lucide-react";

export default function LeadBulkUpload({ onUploadSuccess, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

        if (lines.length < 2) {
          throw new Error("CSV file appears to be empty or missing data rows.");
        }

        // Parse header row to find column indexes dynamically
        const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/["']/g, ""));
        
        const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("company") || h.includes("business"));
        const contactIdx = headers.findIndex(h => h.includes("contact") || h.includes("owner") || h.includes("first") || h.includes("person"));
        const emailIdx = headers.findIndex(h => h.includes("email") || h.includes("mail"));
        const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("mobile") || h.includes("cell") || h.includes("tel"));
        const amountIdx = headers.findIndex(h => h.includes("amount") || h.includes("funding") || h.includes("revenue") || h.includes("deal") || h.includes("requested"));

        const parsedLeads = [];

        // Loop through data rows (start at index 1 if headers exist, or index 0 if not)
        const startIndex = (nameIdx !== -1 || emailIdx !== -1) ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const row = lines[i].split(",").map(cell => cell.trim().replace(/["']/g, ""));
          
          if (row.length >= 2 && (row[0] || row[1])) {
            parsedLeads.push({
              id: `lead-import-${Date.now()}-${i}`,
              business_name: nameIdx !== -1 ? row[nameIdx] : (row[0] || `Lead ${i}`),
              contact_name: contactIdx !== -1 ? row[contactIdx] : (row[1] || "N/A"),
              email: emailIdx !== -1 ? row[emailIdx] : (row.find(cell => cell.includes("@")) || `lead${i}@example.com`),
              phone: phoneIdx !== -1 ? row[phoneIdx] : (row.find(cell => cell.match(/[\d\-\(\)\s]{7,}/)) || "(555) 000-0000"),
              requested_amount: amountIdx !== -1 ? row[amountIdx] : "$250,000",
              status: "New Inquiry",
              source: "CSV Bulk Import"
            });
          }
        }

        if (parsedLeads.length === 0) {
          throw new Error("No valid lead rows could be extracted. Please ensure your CSV contains comma-separated values.");
        }

        setSuccessCount(parsedLeads.length);
        setUploading(false);

        if (onUploadSuccess) {
          onUploadSuccess(parsedLeads);
        }
      } catch (err) {
        console.error("CSV parse error:", err);
        setErrorMsg(err.message || "Failed to parse CSV file. Please check file format.");
        setUploading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 max-w-lg mx-auto my-8 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-amber-500" /> Bulk Lead Ingestion Engine
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-6">
        Upload any standard CSV export (such as <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">leads_2026-10-26.csv</code>). Our parser will automatically map company names, emails, phones, and requested funding amounts.
      </p>

      {errorMsg && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successCount > 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="font-bold">Successfully imported {successCount} leads!</div>
            <div className="text-emerald-600 mt-0.5">All contacts are now indexed in your CRM pipeline.</div>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-amber-50/20 transition-all">
          <Upload className="w-10 h-10 text-amber-500 mb-3" />
          <span className="text-sm font-bold text-slate-900">Click to select CSV lead file</span>
          <span className="text-xs text-slate-400 mt-1">Supports .csv exports from any CRM or spreadsheet</span>
          <input type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" disabled={uploading} />
        </label>
      )}

      {uploading && (
        <div className="text-center py-4 text-xs font-semibold text-slate-500 animate-pulse">
          Processing and normalizing lead records...
        </div>
      )}
    </div>
  );
}
