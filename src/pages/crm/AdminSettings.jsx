import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Lock, Cpu, DollarSign, Activity } from "lucide-react";
import { supabase } from "@/lib/AuthContext";

/**
 * Credentials are held server-side.
 *
 * This screen previously wrote every secret into browser localStorage:
 *
 *     localStorage.setItem("glinfico_paypal_secret",  paypalSecret);
 *     localStorage.setItem("glinfico_idiq_secret",    idiqSecret);
 *     localStorage.setItem("glinfico_fingoal_secret", fingoalSecret);
 *
 * localStorage is readable by any script on the page, any browser extension
 * and anyone with the machine, and it persists until cleared by hand. A
 * PayPal secret can move money and an IDIQ secret can pull credit reports on
 * real people, so they are now stored behind the service_role key and this
 * form can write them but never read them back.
 */
export default function AdminSettings() {
  const [paypalId, setPaypalId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("closing@glinfico.com");
  const [idiqKey, setIdiqKey] = useState("");
  const [idiqSecret, setIdiqSecret] = useState("");
  const [fingoalKey, setFingoalKey] = useState("");
  const [fingoalSecret, setFingoalSecret] = useState("");

  const [status, setStatus] = useState({});   // which secrets are already set
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const authHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("Your session has expired. Sign in again.");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/credentials", { headers: await authHeaders() });
        if (!res.ok) throw new Error((await res.json()).message || `HTTP ${res.status}`);
        const { credentials } = await res.json();
        setStatus(credentials || {});
        setPaypalId(credentials?.paypal_client_id?.value || "");
        setPayoutEmail(credentials?.payout_email?.value || "closing@glinfico.com");
        setIdiqKey(credentials?.idiq_key?.value || "");
        setFingoalKey(credentials?.fingoal_key?.value || "");
      } catch (err) {
        setErrorMsg(err.message);
      }
    })();
  }, []);

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setBusy(true); setSavedMsg(""); setErrorMsg("");
    try {
      // Only send secrets the admin actually typed. Blank means "leave as is",
      // which matters because the form can never read the stored value back.
      const payload = {
        paypal_client_id: paypalId,
        payout_email: payoutEmail,
        idiq_key: idiqKey,
        fingoal_key: fingoalKey,
      };
      if (paypalSecret)  payload.paypal_secret  = paypalSecret;
      if (idiqSecret)    payload.idiq_secret    = idiqSecret;
      if (fingoalSecret) payload.fingoal_secret = fingoalSecret;

      const res = await fetch("/api/admin/credentials", {
        method: "PUT",
        headers: await authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).message || `HTTP ${res.status}`);

      // Clear the secret inputs so they do not sit in memory or get autofilled.
      setPaypalSecret(""); setIdiqSecret(""); setFingoalSecret("");

      const refreshed = await fetch("/api/admin/credentials", { headers: await authHeaders() });
      if (refreshed.ok) setStatus((await refreshed.json()).credentials || {});

      setSavedMsg("Credentials stored server-side. Secrets are not kept in this browser.");
      setTimeout(() => setSavedMsg(""), 6000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const secretHint = (field) =>
    status?.[field]?.configured
      ? `Currently set (${status[field].preview}). Leave blank to keep it.`
      : "Not configured.";

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
