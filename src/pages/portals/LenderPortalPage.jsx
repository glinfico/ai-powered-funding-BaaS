import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, LogOut, Landmark, Layers, CheckCircle2, ArrowRight } from "lucide-react";

export default function LenderPortalPage() {
  const [lenderAccount, setLenderAccount] = useState(null);
  const [email, setEmail] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("glinfico_lender_account");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLenderAccount(parsed);
        setIsLoggedIn(true);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email) return;

    const account = {
      email,
      code: inputCode || `L-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("glinfico_lender_account", JSON.stringify(account));
    setLenderAccount(account);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("glinfico_lender_account");
    setLenderAccount(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center font-black text-white text-xl">
              L
            </div>
            <div>
              <h1 className="text-lg font-bold">GLINFICO <span className="text-purple-400">LENDER PORTAL</span></h1>
              <p className="text-slate-400 text-xs">Review matched deal flows, underwriting parameters & syndication</p>
            </div>
          </div>

          <Link to="/portal" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Portal Hub
          </Link>
        </div>

        {!isLoggedIn ? (
          /* Sign In Card */
          <div className="max-w-md mx-auto my-12">
            <Card className="bg-[#0f0f1e] border-white/10 text-white p-6 shadow-2xl">
              <CardHeader className="text-center px-0 pt-0">
                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">Lender Portal Sign In</CardTitle>
                <p className="text-slate-400 text-xs mt-1">Enter your underwriting institution email to view deal assignments</p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Institution Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="underwriting@lenderfirm.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Lender ID (Optional)</label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="e.g. L-10492"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-3">
                    Sign In & Get Lender ID →
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Lender Dashboard */
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500 text-white font-extrabold flex items-center justify-center text-2xl shadow-lg">
                  L
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">Approved Capital Partner</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">Syndicate Verified</Badge>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">{lenderAccount?.email}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Active Buy-Box: <strong className="text-white">MCA, CRE & Commercial Debt</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned Lender ID</span>
                  <span className="text-2xl font-black text-purple-300 tracking-widest">{lenderAccount?.code}</span>
                </div>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-4">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Direct Matched Deals</p>
                    <h3 className="text-3xl font-bold mt-1">28 Deals</h3>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Total Volume: $4.2M</p>
              </Card>

              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Automated Match Criteria</p>
                    <h3 className="text-3xl font-bold mt-1">98.5%</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                    <Landmark className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-amber-400">✨ AI Filters Active</p>
              </Card>

              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Deployed Capital YTD</p>
                    <h3 className="text-3xl font-bold mt-1">$12.8M</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-emerald-400">✓ Clean Servicing History</p>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
