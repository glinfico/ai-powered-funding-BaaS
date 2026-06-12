import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { FolderOpen, Upload, FileText, Trash2, Download, Shield, Users, Plus, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const COMPARTMENTS = [
  {
    key: "platform",
    label: "Platform Docs",
    icon: Shield,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBg: "bg-amber-600",
    description: "Internal platform documentation, compliance, policies & procedures",
  },
  {
    key: "client",
    label: "Client Docs",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-blue-600",
    description: "Client-submitted documents, agreements, and financial records",
  },
];

export default function DocumentVault() {
  const [activeTab, setActiveTab] = useState("platform");
  const [platformDocs, setPlatformDocs] = useState([]);
  const [clientDocs, setClientDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const docs = activeTab === "platform" ? platformDocs : clientDocs;
  const setDocs = activeTab === "platform" ? setPlatformDocs : setClientDocs;
  const compartment = COMPARTMENTS.find(c => c.key === activeTab);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocs(prev => [...prev, {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        url: file_url,
        uploaded_at: new Date().toISOString(),
        type: file.type,
      }]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = (id) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type) => {
    if (type?.includes("pdf")) return "📄";
    if (type?.includes("image")) return "🖼️";
    if (type?.includes("spreadsheet") || type?.includes("excel") || type?.includes("csv")) return "📊";
    if (type?.includes("word") || type?.includes("document")) return "📝";
    return "📎";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-amber-500" />
            Document Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">Secure document storage with separate compartments</p>
        </div>
      </div>

      {/* Compartment Tabs */}
      <div className="grid grid-cols-2 gap-4">
        {COMPARTMENTS.map((c) => {
          const Icon = c.icon;
          const isActive = activeTab === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveTab(c.key)}
              className={cn(
                "flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
                isActive
                  ? `${c.border} ${c.bg} shadow-sm`
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className={cn("p-2.5 rounded-lg", isActive ? c.bg : "bg-slate-100")}>
                <Icon className={cn("h-5 w-5", isActive ? c.color : "text-slate-400")} />
              </div>
              <div>
                <div className={cn("font-bold text-base", isActive ? "text-slate-900" : "text-slate-600")}>
                  {c.label}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{c.description}</div>
                <div className={cn("text-xs font-semibold mt-2", c.color)}>
                  {c.key === "platform" ? platformDocs.length : clientDocs.length} document{(c.key === "platform" ? platformDocs.length : clientDocs.length) !== 1 ? "s" : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Compartment Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Panel Header */}
        <div className={cn("flex items-center justify-between px-6 py-4 border-b border-slate-100", compartment.bg)}>
          <div className="flex items-center gap-2">
            <compartment.icon className={cn("h-5 w-5", compartment.color)} />
            <span className={cn("font-bold text-base", compartment.color)}>{compartment.label}</span>
            <span className="text-xs text-slate-400 font-normal ml-1">· {docs.length} file{docs.length !== 1 ? "s" : ""}</span>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              size="sm"
              className={cn("gap-2", compartment.activeBg)}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload Files"}
            </Button>
          </div>
        </div>

        {/* File List */}
        <div className="divide-y divide-slate-100">
          {docs.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-16 gap-3 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={cn("p-4 rounded-2xl group-hover:scale-105 transition-transform", compartment.bg)}>
                <Upload className={cn("h-8 w-8", compartment.color)} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700">Drop files here or click to upload</p>
                <p className="text-sm text-slate-400 mt-1">PDF, Word, Excel, images — any format supported</p>
              </div>
            </div>
          )}

          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
              <span className="text-2xl flex-shrink-0">{getFileIcon(doc.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate text-sm">{doc.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatSize(doc.size)} · Uploaded {format(new Date(doc.uploaded_at), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={doc.url} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <a href={doc.url} download={doc.name}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}