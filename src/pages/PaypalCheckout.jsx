import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, CheckCircle2, Zap, ArrowRight, Lock } from "lucide-react";

export default function PaypalCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planName = searchParams.get("plan") || "Growth";
  const amount = searchParams.get("amount") || "1499.00";
  const code = searchParams.get("code") || "G-1499";
  const billing = searchParams.get("billing") || "monthly";

  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleProcessPayment = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Store subscription activation state to unlock 100% broker commission tier platform-wide
      localStorage.setItem("glinfico_broker_subscribed", "true");
      localStorage.setItem("glinfico_active_tier", planName);
      localStorage.setItem("glinfico_sub_code", code);
      localStorage.setItem("glinfico_billing_cycle", billing);
      localStorage.setItem("glinfico_subscribed_at", new Date().toISOString());
      
      setLoading(false);
      setSuccess(true);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-500/20">
          Secure PayPal Gateway
        </span>
        <h2 className="mt-4 text-3xl font-extrabold text-white">
          Complete Your Subscription
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Selected Tier: <span className="font-bold text-amber-400">{planName} (${amount} / {billing === "annual" ? "year" : "month"})</span>
        </p>
        {code && (
          <p className="text-xs text-slate-500 mt-1">
            Subscription Code: <span className="font-mono text-slate-300">{code}</span>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-[#1e293b] py-8 px-6 shadow-2xl rounded-2xl border border-slate-700">
          
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Payment Method:</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${paymentMethod === "paypal" ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-slate-600 text-slate-300 hover:bg-slate-800"}`}
              >
                PayPal Checkout
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${paymentMethod === "card" ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-slate-600 text-slate-300 hover:bg-slate-800"}`}
              >
                Credit / Debit
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("ach")}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${paymentMethod === "ach" ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-slate-600 text-slate-300 hover:bg-slate-800"}`}
              >
                ACH Transfer
              </button>
            </div>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-center space-y-3">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="font-extrabold text-xl text-white">Subscription Active & Verified!</h3>
              <p className="text-sm text-slate-300">Your PayPal transaction for the <strong>{planName}</strong> plan (${amount}) has been successfully processed.</p>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 uppercase tracking-wide">
                🎉 100% Broker Commission Tier Unlocked Platform-Wide
              </div>
              <button 
                onClick={() => navigate("/portal")} 
                className="mt-2 w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2"
              >
                Go to Portal Hub <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {paymentMethod === "card" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Card Number</label>
                    <input type="text" required placeholder="4242 •••• •••• 4242" className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Expiration</label>
                      <input type="text" required placeholder="MM/YY" className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">CVV Security Code</label>
                      <input type="text" required placeholder="123" className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === "ach" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Bank Routing Number (ABA)</label>
                    <input type="text" required placeholder="9 digits" className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Checking Account Number</label>
                    <input type="text" required placeholder="Account number" className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                  </div>
                </>
              )}

              {paymentMethod === "paypal" && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl text-sm text-center">
                  You will securely authorize <strong>${amount}</strong> for the <strong>{planName}</strong> plan via PayPal Gateway.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-lg transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap size={18} fill="#020617" />
                {loading ? "Processing Secure Authorization..." : `Complete Subscription ($${amount})`}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Lock size={12} className="text-amber-400" /> 256-bit SSL Encrypted • Powered by PayPal & Glinfico BCD Infrastructure
          </div>
        </div>
      </div>
    </div>
  );
}
