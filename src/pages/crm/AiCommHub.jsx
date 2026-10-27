import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Send, Sparkles, CheckCircle2, MessageSquare, Building2, Users } from "lucide-react";

export default function AiCommHub() {
  const [targetAudience, setTargetAudience] = useState("all_3000_investors");
  const [campaignTitle, setCampaignTitle] = useState("Exclusive Syndicate Opportunity: High-Yield MCA & CRE Portfolios (2.0% ALS Fee)");
  const [campaignBody, setCampaignBody] = useState(
    "Hello Partner,\n\nWe are pleased to invite your firm to review newly listed MCA and Commercial Real Estate debt tranches on the Glinfico Secondary Marketplace. All transactions are settled under the harmonized 2.0% ALS framework with guaranteed liquidity and automated yield tracking.\n\nLog into your Investor Portal to review active tranches and participate in syndication.\n\nBest regards,\nGlinfico Capital Markets & BaaS Engine"
  );
  const [broadcastSuccess, setBroadcastSuccess] = useState("");
  const [vault, setVault] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("glinfico_ai_comm_vault") || "[]");
      if (Array.isArray(saved)) setVault(saved);
    } catch {
      setVault([]);
    }
  }, []);

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!campaignTitle.trim() || !campaignBody.trim()) return;
    const now = new Date();
    const reference = `AICOMM-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${now.toISOString().slice(11, 19).replace(/:/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const record = { reference, targetAudience, campaignTitle: campaignTitle.trim(), campaignBody: campaignBody.trim(), channel: "Investor Portal Notification & Email Blast", completedAt: now.toISOString(), status: "Saved to vault — not sent" };
    const nextVault = [record, ...vault];
    try {
      localStorage.setItem("glinfico_ai_comm_vault", JSON.stringify(nextVault));
      setVault(nextVault);
      setBroadcastSuccess(`Saved ${reference} to the local vault. No email or portal notification was sent.`);
      setCampaignTitle("");
      setCampaignBody("");
    } catch {
      setBroadcastSuccess("Could not save to the local vault. Please copy your draft before leaving this page.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono">
                AI-Comm Intelligent Communications
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold">Investor Opportunity Broadcast Engine</h1>
            <p className="text-slate-400 text-xs mt-1">Create a communication, save it to the vault with a reference, then start the next one.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/crm/lenders" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Lenders & Network
            </Link>
            <Link to="/portal">
              <Button variant="outline" className="border-white/10 text-xs text-slate-300 hover:bg-white/5">
                Portal Hub
              </Button>
            </Link>
          </div>
        </div>

        {broadcastSuccess && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-sm flex items-center gap-3 shadow-lg" role="status">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{broadcastSuccess}</span>
          </div>
        )}

        {/* AI-Comm Broadcast Form */}
        <Card className="bg-[#0f0f1e] border-white/10 text-white p-6 shadow-2xl">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" /> New AI-Comm Draft
            </CardTitle>
            <p className="text-slate-400 text-xs mt-1">Compose personalized syndication alerts powered by Glinfico's AI communication engine.</p>
          </CardHeader>

          <CardContent className="px-0 pb-0">
            <form onSubmit={handleBroadcast} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#15152a] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                  >
                    <option value="all_3000_investors">All 3,000+ MyCapital PE/VC Investors</option>
                    <option value="grade_a_syndicates">Grade A+ Venture Capital Partners Only</option>
                    <option value="private_equity">Private Equity Funds (Top 500)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Communication Channel</label>
                  <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-400 text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Investor Portal Notification & Email Blast
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Campaign Subject Line</label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Campaign Message Body (Markdown Supported)</label>
                <textarea
                  rows={8}
                  required
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                ></textarea>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>Selected Audience: <strong className="text-white">Ready for review</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-400" />
                  <span>Dispatch Status: <strong className="text-amber-200">Not connected</strong></span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 text-sm cursor-pointer shadow-xl shadow-emerald-500/20"
              >
                <Send className="h-4 w-4 mr-2" /> Save Completed Comm to Vault & Start Next
              </Button>
              <p className="text-xs text-amber-200/80">Saving creates a local vault record only. Live email/portal dispatch is not connected to this screen.</p>

            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f1e] border-white/10 text-white p-6 shadow-2xl">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" /> AI-Comm Vault
            </CardTitle>
            <p className="text-slate-400 text-xs mt-1">Each saved communication receives a reference number and moves here, leaving the composer ready for the next comm. Vault entries are stored in this browser only.</p>
          </CardHeader>
          <CardContent className="px-0 pb-0 space-y-3">
            {vault.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">No communications saved yet. Complete a draft above to create the first vault reference.</div>
            ) : vault.map((item) => (
              <details key={item.reference} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <summary className="cursor-pointer list-none flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="font-mono text-emerald-300 text-sm">{item.reference}</span>
                  <span className="text-sm font-semibold text-white">{item.campaignTitle || "Untitled communication"}</span>
                  <span className="text-xs text-amber-200">{item.status}</span>
                </summary>
                <div className="mt-4 border-t border-white/10 pt-3 space-y-2">
                  <p className="text-xs text-slate-400">Completed: {new Date(item.completedAt).toLocaleString()} · Audience: {item.targetAudience}</p>
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-300">{item.campaignBody}</pre>
                </div>
              </details>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
