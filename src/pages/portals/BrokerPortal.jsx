import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, User, LogOut, CheckCircle2, Briefcase, Award, ArrowRight } from "lucide-react";

export default function BrokerPortal() {
  const navigate = useNavigate();
  const [brokerAccount, setBrokerAccount] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("glinfico_broker_account");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBrokerAccount(parsed);
        setIsLoggedIn(true);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleManualLogin = (e) => {
    e.preventDefault();
    if (!loginEmail) return;
    
    const prefix = inputCode ? inputCode.charAt(0).toUpperCase() : 'P';
    const account = {
      email: loginEmail,
      plan: prefix === 'S' ? 'Starter' : prefix === 'G' ? 'Growth' : prefix === 'E' ? 'Enterprise' : 'Pro',
      code: inputCode || `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`,
      billing: 'monthly',
      subscribedAt: new Date().toISOString()
    };

    localStorage.setItem("glinfico_broker_account", JSON.stringify(account));
    setBrokerAccount(account);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("glinfico_broker_account");
    setBrokerAccount(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Nav Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-black text-xl">
              G
            </div>
            <div>
              <h1 className="text-lg font-bold">GLINFICO <span className="text-amber-400">BROKER PORTAL</span></h1>
              <p className="text-slate-400 text-xs">Manage active deals, lender network & commission tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/portal" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Portal Hub
            </Link>
            <Link to="/broker/subscribe" className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors">
              Upgrade Subscription
            </Link>
          </div>
        </div>

        {/* Account Login Box if not logged in */}
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto my-12">
            <Card className="bg-[#0f0f1e] border-white/10 text-white p-6 shadow-2xl">
              <CardHeader className="text-center px-0 pt-0">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">Broker Account Sign In</CardTitle>
                <p className="text-slate-400 text-xs mt-1">Enter your broker email and membership code (e.g. P-12345)</p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Broker Email</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="broker@company.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Membership Code (Optional)</label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="e.g. P-48291 or S-99210"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3">
                    Access My Broker Account →
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-500">
                    Don't have a broker plan yet?{" "}
                    <Link to="/broker/subscribe" className="text-amber-400 hover:underline">
                      Choose a Plan & Get Code →
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Logged In Dashboard View */
          <div className="space-y-8">
            
            {/* Broker ID & Status Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-black font-extrabold flex items-center justify-center text-2xl shadow-lg">
                  {brokerAccount?.code ? brokerAccount.code.charAt(0) : 'B'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Active Broker Membership</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">PayPal Verified</Badge>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">{brokerAccount?.email}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Plan Tier: <strong className="text-white">{brokerAccount?.plan} Plan</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned Broker ID</span>
                  <span className="text-2xl font-black text-amber-300 tracking-widest">{brokerAccount?.code}</span>
                </div>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-4">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Active Deals in Pipeline</p>
                    <h3 className="text-3xl font-bold mt-1">14</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-400">⚡ 4 pending lender underwriting</p>
              </Card>

              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Matched Lenders</p>
                    <h3 className="text-3xl font-bold mt-1">22,450+</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-amber-400">✨ AI Match Rate: 94.2%</p>
              </Card>

              <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Commission Earned (YTD)</p>
                    <h3 className="text-3xl font-bold mt-1">$48,250</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-emerald-400">✓ Ready for payout</p>
              </Card>
            </div>

            {/* Quick Navigation to Portal Tools */}
            <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Broker Toolkit & Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link to="/crm/leads" className="bg-white/5 border border-white/10 p-4 rounded-xl hover:border-amber-400/50 transition-all flex items-center justify-between group">
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-amber-400 transition-colors">Submit New Lead / Deal</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Upload MCA, CRE or M&A borrower applications</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </Link>

                <Link to="/crm/lenders" className="bg-white/5 border border-white/10 p-4 rounded-xl hover:border-amber-400/50 transition-all flex items-center justify-between group">
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-amber-400 transition-colors">Browse 22K+ Lender Network</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Filter by buy-box, criteria & terms</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
