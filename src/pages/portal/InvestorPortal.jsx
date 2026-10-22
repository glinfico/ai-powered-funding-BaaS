import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, ShieldCheck, TrendingUp, CheckCircle2, Wallet, ArrowRight } from "lucide-react";

export default function InvestorPortal() {
  const [investorName] = useState("Matrix Partners (I-10492)");
  const [committedTranches, setCommittedTranches] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const handleParticipateTranche = (trancheId, amount) => {
    setCommittedTranches(prev => ({ ...prev, [trancheId]: true }));
    setSuccessMsg(`Successfully committed $${amount.toLocaleString()} to Tranche ${trancheId} under 2.0% ALS Harmonized framework!`);
    setTimeout(() => setSuccessMsg(""), 6000);
  };

  const activeOpportunities = [
    {
      id: "TR-801",
      name: "Q4 High-Yield MCA Tranche A",
      borrowerCount: "42 Merchants",
      avgFico: "720 FICO",
      yieldRate: "18.5% APY",
      totalSize: "$2,500,000",
      minCommitment: "$50,000",
      status: "AI-Comm Broadcasted Live"
    },
    {
      id: "TR-802",
      name: "Commercial Real Estate Debt Portfolio B",
      borrowerCount: "12 Properties",
      avgFico: "745 FICO",
      yieldRate: "14.2% APY",
      totalSize: "$5,000,000",
      minCommitment: "$100,000",
      status: "AI-Comm Broadcasted Live"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono">
                Institutional Investor Syndicate Portal
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold">Welcome, {investorName}</h1>
            <p className="text-slate-400 text-xs mt-1">Review AI-Comm broadcasted debt tranches and execute syndication under 2.0% ALS terms</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/crm/ai-comm" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← CRM AI-Comm Hub
            </Link>
            <Link to="/crm/deals">
              <Button variant="outline" className="border-white/10 text-xs text-slate-300 hover:bg-white/5">
                Deals Pipeline
              </Button>
            </Link>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Portfolio Stats Bar */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-[#0f0f1e] border border-white/10 p-5 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Available Capital</span>
            <span className="text-2xl font-black text-emerald-400">$12,450,000</span>
          </div>
          <div className="bg-[#0f0f1e] border border-white/10 p-5 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Active Portfolio Yield</span>
            <span className="text-2xl font-black text-amber-400">16.8% APY</span>
          </div>
          <div className="bg-[#0f0f1e] border border-white/10 p-5 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Syndicated Tranches</span>
            <span className="text-2xl font-black text-blue-400">8 Active</span>
          </div>
          <div className="bg-[#0f0f1e] border border-white/10 p-5 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Settlement Framework</span>
            <span className="text-2xl font-black text-white">2.0% ALS</span>
          </div>
        </div>

        {/* AI-Comm Broadcasted Opportunities Feed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">📢 AI-Comm Broadcasted Opportunities (Live Feed)</h3>
            <span className="text-xs text-emerald-400 font-mono">Synced with 3,240 Investor Accounts</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {activeOpportunities.map((opp) => {
              const isCommitted = committedTranches[opp.id];
              return (
                <Card key={opp.id} className="bg-[#0f0f1e] border-white/10 text-white p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-mono">{opp.id}</Badge>
                      <Badge className="bg-blue-500/20 text-blue-300 border-0 text-[10px]">{opp.status}</Badge>
                    </div>

                    <h4 className="text-xl font-bold mb-2">{opp.name}</h4>
                    <p className="text-slate-400 text-xs mb-4">{opp.borrowerCount} • Verified via FinGoal & IDIQ Telemetry</p>

                    <div className="grid grid-cols-2 gap-3 bg-white/5 p-4 rounded-xl text-xs mb-6">
                      <div>
                        <span className="text-slate-400 block">Target Yield</span>
                        <strong className="text-emerald-400 text-sm">{opp.yieldRate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total Tranche Size</span>
                        <strong className="text-white text-sm">{opp.totalSize}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Avg Credit</span>
                        <strong className="text-amber-400">{opp.avgFico}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Min Commitment</span>
                        <strong className="text-white">{opp.minCommitment}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    {!isCommitted ? (
                      <Button
                        onClick={() => handleParticipateTranche(opp.id, 50000)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-3 cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        ⚡ Participate in Tranche ($50,000 Min)
                      </Button>
                    ) : (
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center text-emerald-300 font-bold text-xs">
                        ✅ Successfully Committed & Syndicated!
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
