import React, { useState } from 'react';
import { ShieldCheck, Lock, Zap } from 'lucide-react';

export default function BrokerSubscriptionCheckout() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [paymentMethod, setPaymentMethod] = useState('paypal'); // 'paypal' | 'card' | 'ach'
  const [tier] = useState('Starter');
  const [code] = useState('S-999');

  const monthlyPrice = 999;
  const annualPrice = 9990; // Annual with discount
  const currentPrice = billingCycle === 'annual' ? annualPrice : monthlyPrice;

  const handleCheckout = () => {
    alert(`Initiating secure ${paymentMethod.toUpperCase()} checkout for ${tier} (${billingCycle}) - $${currentPrice.toLocaleString()}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-xl bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Top Accent Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Lock className="h-3.5 w-3.5" /> Secure PayPal Gateway
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Complete Your Subscription</h1>
          <p className="text-slate-400 text-sm">
            Selected Tier: <span className="text-white font-semibold">{tier}</span> (<span className="text-amber-400 font-bold">${currentPrice.toLocaleString()} / {billingCycle === 'annual' ? 'year' : 'month'}</span>)
          </p>
          <p className="text-xs text-slate-500 mt-1">Subscription Code: <code className="text-amber-400 bg-black/40 px-2 py-0.5 rounded font-mono">{code}</code></p>
        </div>

        {/* Billing Frequency Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Billing Frequency:</label>
          <div className="grid grid-cols-2 gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly ($999/mo)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual (2 Mos. Free)
            </button>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Payment Method:</label>
          <div className="grid grid-cols-3 gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                paymentMethod === 'paypal'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PayPal Checkout
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                paymentMethod === 'card'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Credit / Debit
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('ach')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                paymentMethod === 'ach'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ACH Transfer
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">
            You will securely authorize <span className="text-white font-semibold">${currentPrice.toLocaleString()}</span> for the {tier} plan ({billingCycle}) via PayPal Gateway.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleCheckout}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-base transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 mb-6"
        >
          <Zap className="h-5 w-5 fill-current" /> Complete Subscription (${currentPrice.toLocaleString()})
        </button>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>256-bit SSL Encrypted • Powered by PayPal & Glinfico BCD Infrastructure</span>
        </div>

      </div>
    </div>
  );
}
