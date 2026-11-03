import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Zap, Check } from 'lucide-react';

const TIERS = [
  { id: 'starter', name: 'Starter', codePrefix: 'S', monthlyPrice: 999, annualPrice: 9990, desc: 'Essential matching engine access & lead scoring' },
  { id: 'gold', name: 'Gold', codePrefix: 'G', monthlyPrice: 2499, annualPrice: 24990, desc: 'Advanced capital routing & priority lender dispatch' },
  { id: 'platinum', name: 'Platinum', codePrefix: 'P', monthlyPrice: 4999, annualPrice: 49990, desc: 'Full automated closing suite & dedicated API access' },
  { id: 'enterprise', name: 'Enterprise', codePrefix: 'E', monthlyPrice: 9999, annualPrice: 99990, desc: 'Custom BaaS platform white-labeling & unlimited volume' },
];

export default function BrokerSubscriptionCheckout() {
  const [selectedTierId, setSelectedTierId] = useState('starter');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [paymentMethod, setPaymentMethod] = useState('paypal'); // 'paypal' | 'card' | 'ach'
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const activeTier = TIERS.find(t => t.id === selectedTierId) || TIERS[0];
  const currentPrice = billingCycle === 'annual' ? activeTier.annualPrice : activeTier.monthlyPrice;
  const subscriptionCode = `${activeTier.codePrefix}-${Math.floor(100 + Math.random() * 900)}`;

  // Dynamically load PayPal SDK script
  useEffect(() => {
    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb'; // Fallback to PayPal Sandbox if env variable pending
    const scriptId = 'paypal-sdk-script';

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&vault=true&intent=subscription`;
      script.async = true;
      script.onload = () => setPaypalLoaded(true);
      document.body.appendChild(script);
    } else {
      setPaypalLoaded(true);
    }
  }, [selectedTierId, billingCycle]);

  // Render Live PayPal Buttons into container when ready
  useEffect(() => {
    if (paypalLoaded && window.paypal && paymentMethod === 'paypal') {
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = ''; // Clear previous render
        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe',
          },
          createSubscription: (data, actions) => {
            return actions.subscription.create({
              /* Replace with your exact PayPal Plan ID from Developer Dashboard */
              plan_id: import.meta.env[`VITE_PAYPAL_PLAN_${activeTier.id.toUpperCase()}_${billingCycle.toUpperCase()}`] || 'P-MOCKPLAN12345',
              custom_id: subscriptionCode,
            });
          },
          onApprove: async (data, actions) => {
            alert(`Subscription Successful! ID: ${data.subscriptionID} | Code Assigned: ${subscriptionCode}`);
            // Hook to backend endpoint/Supabase sync
          },
          onError: (err) => {
            console.error('PayPal Integration Error:', err);
          }
        }).render('#paypal-button-container');
      }
    }
  }, [paypalLoaded, selectedTierId, billingCycle, paymentMethod]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-2xl bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Top Accent Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Lock className="h-3.5 w-3.5" /> Secure PayPal Gateway
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Complete Your Subscription</h1>
          <p className="text-slate-400 text-sm">
            Selected Tier: <span className="text-white font-semibold">{activeTier.name}</span> (<span className="text-amber-400 font-bold">${currentPrice.toLocaleString()} / {billingCycle === 'annual' ? 'year' : 'month'}</span>)
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Allocated Code: <code className="text-amber-400 bg-black/40 px-2 py-0.5 rounded font-mono">{subscriptionCode}</code>
          </p>
        </div>

        {/* Tier Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Subscription Tier:</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTierId(t.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                  selectedTierId === t.id
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div>{t.name}</div>
                <div className="text-[10px] opacity-80">${(billingCycle === 'annual' ? t.annualPrice : t.monthlyPrice).toLocaleString()}</div>
              </button>
            ))}
          </div>
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
              Monthly Billing
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
              Annual (2 Months Free)
            </button>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mb-6">
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
        </div>

        {/* Live PayPal Button Container */}
        <div className="mb-6">
          {paymentMethod === 'paypal' ? (
            <div id="paypal-button-container" className="w-full min-h-[150px] flex items-center justify-center">
              {!paypalLoaded && <p className="text-xs text-slate-400 animate-pulse">Initializing Live PayPal Security Gateway...</p>}
            </div>
          ) : (
            <button
              onClick={() => alert(`Initiating direct ${paymentMethod.toUpperCase()} authorization for $${currentPrice.toLocaleString()}`)}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-base transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Zap className="h-5 w-5 fill-current" /> Authorize {paymentMethod.toUpperCase()} (${currentPrice.toLocaleString()})
            </button>
          )}
        </div>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>256-bit SSL Encrypted • Powered by Live PayPal & Glinfico BCD Infrastructure</span>
        </div>

      </div>
    </div>
  );
}
