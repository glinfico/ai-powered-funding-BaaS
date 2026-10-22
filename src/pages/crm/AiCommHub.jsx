import { useState } from "react";
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
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const handleBroadcast = (e) => {
    e.preventDefault();
    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastSuccess(true);
    }, 1500);
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
            <p className="text-slate-400 text-xs mt-1">Dispatch high-yield deal flow notifications to 3,000+ US PE/VC investors instantly</p>
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
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>AI-Comm successfully dispatched opportunity notifications to <strong>3,000+ MyCapital US PE/VC Investor Portals</strong> with 2.0% ALS terms!</span>
          </div>
        )}

        {/* AI-Comm Broadcast Form */}
        <Card className="bg-[#0f0f1e] border-white/10 text-white p-6 shadow-2xl">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" /> Draft AI-Comm Investor Campaign
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
                  <span>Estimated Reach: <strong className="text-white">3,240 Verified Institutional Accounts</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-400" />
                  <span>Settlement Framework: <strong className="text-emerald-400">2.0% ALS Harmonized</strong></span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isBroadcasting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 text-sm cursor-pointer shadow-xl shadow-emerald-500/20"
              >
                <Send className="h-4 w-4 mr-2" /> {isBroadcasting ? "Broadcasting via AI-Comm to 3,000+ Investors..." : "🚀 Broadcast Opportunity via AI-Comm Now"}
              </Button>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
