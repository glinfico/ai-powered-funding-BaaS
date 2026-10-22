import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, LogOut, TrendingUp, PieChart, ShieldCheck, ArrowRight } from "lucide-react";

export default function InvestorPortal() {
  const [investorAccount, setInvestorAccount] = useState(null);
  const [email, setEmail] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("glinfico_investor_account");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInvestorAccount(parsed);
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
      code: inputCode || `I-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("glinfico_investor_account", JSON.stringify(account));
    setInvestorAccount(account);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("glinfico_investor_account");
    setInvestorAccount(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-black text-xl">
              I
            </div>
            <div>
              <h1 className="text-lg font-bold">GLINFICO <span className="text-emerald-400">INVESTOR PORTAL</span></h1>
              <p className="text-slate-400 text-xs">Portfolio allocations, debt participations & monthly yield returns</p>
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
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">Investor Portal Sign In</CardTitle>
                <p className="text-slate-400 text-xs mt-1">Enter your accredited investor email to view portfolio performance</p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Investor Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investor@capital.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Investor ID (Optional)</label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="e.g. I-59302"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3">
                    Sign In & Get Investor ID →
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Investor Dashboard */
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black font-extrabold flex items-center justify-center text-2xl shadow-lg">
                  I
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Accredited Participant</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">Secured Portfolio</Badge>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">{investorAccount?.email}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Allocation Strategy: <strong className="text-white">Senior MCA & Commercial Real Estate Debt</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned Investor ID</span>
                  <span className="text-2xl font-black text-emerald-300 tracking-widest">{investorAccount?.code}</span>
                </div>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-4">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Portfolio Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Total Portfolio Value</p>
                    <h3 className="text-3xl font-bold mt-1">$1,850,000</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <PieChart className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Participated Across 32 Pools</p>
              </Card>

              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Net Annualized Yield</p>
                    <h3 className="text-3xl font-bold mt-1">16.8%</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-amber-400">✨ Monthly Distribution</p>
              </Card>

              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Total Yield Paid Out</p>
                    <h3 className="text-3xl font-bold mt-1">$310,800</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-emerald-400">✓ Direct ACH Deposit</p>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
