import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Zap, CheckCircle2, Building2, Play, Layers } from "lucide-react";
import { generate22KLenders, generate1000Leads } from "@/data/mockEcosystemData";

export default function CrmLenders() {
  const [lenders] = useState(() => generate22KLenders());
  const [leads] = useState(() => generate1000Leads());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("lenders");
  const [simulatingMatch, setSimulatingMatch] = useState(false);
  const [matchResults, setMatchResults] = useState(null);

  const filteredLenders = useMemo(() => {
    if (!searchTerm) return lenders.slice(0, 50); // Show top 50 for performance
    return lenders.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.assetClass.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50);
  }, [lenders, searchTerm]);

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads.slice(0, 50);
    return leads.filter(l => 
      l.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50);
  }, [leads, searchTerm]);

  const runFullEcosystemMatch = () => {
    setSimulatingMatch(true);
    setMatchResults(null);
    setTimeout(() => {
      setSimulatingMatch(false);
      setMatchResults({
        totalLeadsProcessed: 1000,
        totalLendersMatched: 22450,
        successfulMatches: 984,
        avgMatchScore: "94.8%",
        totalVolumeQueued: "$248,500,000"
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                Full AI Ecosystem Matching Engine
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold">22K+ Lender Network & 1,000 Lead Pipeline</h1>
            <p className="text-slate-400 text-xs mt-1">Real-time buy-box evaluation across 22,450 lenders and 1,000 active leads</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/portal" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Portal Hub
            </Link>
            <Button
              onClick={runFullEcosystemMatch}
              disabled={simulatingMatch}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 py-3 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Play className="h-4 w-4" /> {simulatingMatch ? "Running 22K x 1K Match Simulation..." : "Run AI Matching Engine (1K Leads x 22K Lenders)"}
            </Button>
          </div>
        </div>

        {/* Match Simulation Stats Banner */}
        {matchResults && (
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500 text-black font-black rounded-2xl flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Matching Simulation Complete!</h3>
                <p className="text-slate-300 text-xs mt-0.5">Matched <strong>{matchResults.successfulMatches} out of 1,000 leads</strong> against <strong>22,450 lender buy-boxes</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Volume Matched</span>
                <span className="text-lg font-bold text-emerald-400">{matchResults.totalVolumeQueued}</span>
              </div>
              <div className="bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Avg Match Score</span>
                <span className="text-lg font-bold text-amber-300">{matchResults.avgMatchScore}</span>
              </div>
              <div className="bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Processing Time</span>
                <span className="text-lg font-bold text-blue-400">1.2 Seconds</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0f0f1e] p-4 rounded-2xl border border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("lenders")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "lenders" ? "bg-amber-500 text-black" : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" /> 22,450 Lenders
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "leads" ? "bg-amber-500 text-black" : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="h-4 w-4" /> 1,000 Active Leads
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 w-full md:w-80">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab === "lenders" ? "22,450 lenders" : "1,000 leads"}...`}
              className="bg-transparent text-xs text-white focus:outline-none w-full placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Tab 1: 22K Lenders Grid */}
        {activeTab === "lenders" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLenders.map((lender) => (
              <Card key={lender.id} className="bg-[#0f0f1e] border-white/10 text-white p-5 hover:border-amber-500/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 font-mono text-[10px] mb-1">
                      {lender.id}
                    </Badge>
                    <h4 className="font-bold text-sm text-white">{lender.name}</h4>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">
                    Match {lender.matchRate}
                  </Badge>
                </div>

                <div className="space-y-1.5 bg-white/5 p-3 rounded-xl text-xs text-slate-300 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset Focus:</span>
                    <strong className="text-white">{lender.assetClass}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min Credit Score:</span>
                    <strong className="text-amber-400">{lender.minCredit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Deal Size:</span>
                    <strong className="text-emerald-400">${lender.maxDealSize.toLocaleString()}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tab 2: 1,000 Leads Grid */}
        {activeTab === "leads" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="bg-[#0f0f1e] border-white/10 text-white p-5 hover:border-blue-500/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 font-mono text-[10px] mb-1">
                      {lead.id}
                    </Badge>
                    <h4 className="font-bold text-sm text-white">{lead.businessName}</h4>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 text-[10px] border-0">
                    {lead.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 bg-white/5 p-3 rounded-xl text-xs text-slate-300 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Requested Amount:</span>
                    <strong className="text-emerald-400">${lead.requestedAmount.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Credit Score:</span>
                    <strong className="text-amber-400">{lead.creditScore}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Industry:</span>
                    <span className="text-slate-200">{lead.industry} ({lead.state})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Broker ID:</span>
                    <strong className="text-blue-300">{lead.assignedBroker}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
