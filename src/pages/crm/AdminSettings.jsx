import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Lock, Cpu, DollarSign, Activity } from "lucide-react";

export default function AdminSettings() {
  const [paypalId, setPaypalId] = useState(localStorage.getItem("glinfico_paypal_id") || "");
  const [paypalSecret, setPaypalSecret] = useState(localStorage.getItem("glinfico_paypal_secret") || "");
  const [payoutEmail, setPayoutEmail] = useState(localStorage.getItem("glinfico_payout_email") || "closing@glinfico.com");
  
  const [idiqKey, setIdiqKey] = useState(localStorage.getItem("glinfico_idiq_key") || "");
  const [idiqSecret, setIdiqSecret] = useState(localStorage.getItem("glinfico_idiq_secret") || "");

  const [fingoalKey, setFingoalKey] = useState(localStorage.getItem("glinfico_fingoal_key") || "");
  const [fingoalSecret, setFingoalSecret] = useState(localStorage.getItem("glinfico_fingoal_secret") || "");

  const [savedMsg, setSavedMsg] = useState("");

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    localStorage.setItem("glinfico_paypal_id", paypalId);
    localStorage.setItem("glinfico_paypal_secret", paypalSecret);
    localStorage.setItem("glinfico_payout_email", payoutEmail);

    localStorage.setItem("glinfico_idiq_key", idiqKey);
    localStorage.setItem("glinfico_idiq_secret", idiqSecret);

    localStorage.setItem("glinfico_fingoal_key", fingoalKey);
    localStorage.setItem("glinfico_fingoal_secret", fingoalSecret);

    setSavedMsg("API Credentials for PayPal, IDIQ, and FinGoal successfully saved and synchronized!");
    setTimeout(() => setSavedMsg(""), 6000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono">
                System Master Security Vault
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold">Admin Credentials & API Settings</h1>
            <p className="text-slate-400 text-xs mt-1">Configure PayPal commission payouts, IDIQ credit monitoring, and FinGoal bank revenue telemetry</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/crm/deals" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Deals Pipeline
            </Link>
            <Link to="/portal">
              <Button variant="outline" className="border-white/10 text-xs text-slate-300 hover:bg-white/5">
                Portal Hub
              </Button>
            </Link>
          </div>
        </div>

        {savedMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <Card className="bg-[#0f0f1e] border-white/10 text-white p-8">
          <form onSubmit={handleSaveCredentials} className="space-y-6">
            
            {/* PayPal Commission Section */}
            <div className="space-y-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold">PayPal Commission Payout Gateway</h3>
              </div>
              <p className="text-slate-400 text-xs">
                Configured for PayPal Payout API and ALS commission split disbursement.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">PayPal Client ID</label>
                  <input
                    type="password"
                    value={paypalId}
                    onChange={(e) => setPaypalId(e.target.value)}
                    placeholder="Enter PayPal Client ID..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">PayPal Client Secret</label>
                  <input
                    type="password"
                    value={paypalSecret}
                    onChange={(e) => setPaypalSecret(e.target.value)}
                    placeholder="Enter PayPal Client Secret..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Commission Payout PayPal Email</label>
                <input
                  type="email"
                  required
                  value={payoutEmail}
                  onChange={(e) => setPayoutEmail(e.target.value)}
                  placeholder="closing@glinfico.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>
            </div>

            {/* IDIQ Credit Telemetry Section */}
            <div className="space-y-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-bold">IDIQ Credit Telemetry & Monitoring API</h3>
              </div>
              <p className="text-slate-400 text-xs">
                Connects live business owner credit monitoring and credit score bureau telemetry feeds.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">IDIQ Partner API Key</label>
                  <input
                    type="password"
                    value={idiqKey}
                    onChange={(e) => setIdiqKey(e.target.value)}
                    placeholder="Enter IDIQ Partner Key..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">IDIQ Client Secret</label>
                  <input
                    type="password"
                    value={idiqSecret}
                    onChange={(e) => setIdiqSecret(e.target.value)}
                    placeholder="Enter IDIQ Client Secret..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* FinGoal Bank Revenue Telemetry Section */}
            <div className="space-y-4 pb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-bold">FinGoal Bank Revenue & Cash Flow API</h3>
              </div>
              <p className="text-slate-400 text-xs">
                Verifies merchant monthly bank revenues, cash flow stability, and daily average balances.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">FinGoal API Key</label>
                  <input
                    type="password"
                    value={fingoalKey}
                    onChange={(e) => setFingoalKey(e.target.value)}
                    placeholder="Enter FinGoal API Key..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">FinGoal Client Secret</label>
                  <input
                    type="password"
                    value={fingoalSecret}
                    onChange={(e) => setFingoalSecret(e.target.value)}
                    placeholder="Enter FinGoal Client Secret..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 text-sm cursor-pointer shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" /> Save & Securely Synchronize API Keys
            </Button>

          </form>
        </Card>

      </div>
    </div>
  );
}
