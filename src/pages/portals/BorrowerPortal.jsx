import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, LogOut, FileText, Clock, CheckCircle2, ArrowRight, DollarSign } from "lucide-react";

export default function BorrowerPortal() {
  const [borrowerAccount, setBorrowerAccount] = useState(null);
  const [email, setEmail] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("glinfico_borrower_account");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBorrowerAccount(parsed);
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
      code: inputCode || `B-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("glinfico_borrower_account", JSON.stringify(account));
    setBorrowerAccount(account);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("glinfico_borrower_account");
    setBorrowerAccount(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-black text-white text-xl">
              B
            </div>
            <div>
              <h1 className="text-lg font-bold">GLINFICO <span className="text-blue-400">BORROWER PORTAL</span></h1>
              <p className="text-slate-400 text-xs">Track application status, term sheets & funding disbursements</p>
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
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">Borrower Portal Sign In</CardTitle>
                <p className="text-slate-400 text-xs mt-1">Enter your business email to view application status and assigned ID</p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="borrower@company.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Borrower ID (Optional)</label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="e.g. B-84920"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3">
                    Sign In & Get Borrower ID →
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Borrower Dashboard */
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-500 text-white font-extrabold flex items-center justify-center text-2xl shadow-lg">
                  B
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Verified Borrower Account</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">Active Application</Badge>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">{borrowerAccount?.email}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Application Status: <strong className="text-amber-400">Underwriting in Progress</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned Borrower ID</span>
                  <span className="text-2xl font-black text-blue-300 tracking-widest">{borrowerAccount?.code}</span>
                </div>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-4">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Application Pipeline */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Funding Request</p>
                    <h3 className="text-3xl font-bold mt-1">$250,000</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Type: Working Capital / MCA</p>
              </Card>

              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Matched Term Sheets</p>
                    <h3 className="text-3xl font-bold mt-1">3 Offers</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-amber-400">✨ Best Factor Rate: 1.18x</p>
              </Card>

              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Est. Closing Time</p>
                    <h3 className="text-3xl font-bold mt-1">24 Hours</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-emerald-400">✓ Bank Verification Complete</p>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
