import React from 'react';
import { Check, ShieldCheck, Zap } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: 'Starter MCA BaaS',
      price: '$299',
      period: '/month',
      desc: 'Ideal for independent brokers and boutique funding shops launching AI scoring.',
      features: ['Up to 250 AI Lead Scores / mo', 'Standard Underwriting Engine', 'Borrower & Broker Portals', 'Basic CRM & Pipeline', 'Email & Chat Support'],
      badge: 'Starter'
    },
    {
      name: 'Business BaaS Suite',
      price: '$799',
      period: '/month',
      desc: 'Full institutional MCA underwriting suite with automated lender matching.',
      features: ['Unlimited AI Lead Scores', 'Advanced Underwriting & Risk Scoring', 'All 4 Stakeholder Portals (Borrower, Broker, Lender, Investor)', 'ServiceLink Valuation Integration', 'Priority 24/7 Support'],
      badge: 'Most Popular',
      highlight: true
    },
    {
      name: 'Enterprise Syndicate',
      price: '$1,999',
      period: '/month',
      desc: 'Custom BaaS infrastructure for large-scale funding syndicates and ISOs.',
      features: ['Custom API Endpoints & Webhooks', 'Dedicated Institutional Lenders', 'White-labeled Portal Branding', 'Advanced Analytics & Reports', 'Dedicated Account Manager'],
      badge: 'Enterprise'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: 'white', padding: '60px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#f59e0b', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>
            Transparent Subscription Plans
          </span>
          <h1 style={{ fontSize: '38px', fontWeight: '900', margin: '16px 0 12px 0' }}>Accelerate Your Funding Business</h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            Secure your subscription instantly using PayPal, Credit Card, Debit Card, or ACH Direct Debit.
          </p>

          {/* Payment Badges Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
            {['PayPal Checkout', 'Visa / Mastercard', 'American Express', 'ACH Direct Debit', 'Secure SSL Encrypted'].map((badge, idx) => (
              <span key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#f59e0b" /> {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'stretch' }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              backgroundColor: '#1e293b',
              borderRadius: '20px',
              border: plan.highlight ? '2px solid #d97706' : '1px solid #334155',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: plan.highlight ? '0 15px 30px -10px rgba(217, 119, 6, 0.3)' : '0 10px 20px -5px rgba(0,0,0,0.3)'
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#d97706', color: 'white', padding: '4px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>
                  {plan.badge}
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0' }}>{plan.name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', minHeight: '40px', margin: '0 0 20px 0' }}>{plan.desc}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '900', color: 'white' }}>{plan.price}</span>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>{plan.period}</span>
                </div>

                <div style={{ borderTop: '1px solid #334155', paddingTop: '20px', marginBottom: '24px' }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1', marginBottom: '12px' }}>
                      <Check size={16} color="#34d399" /> {feat}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {/* PayPal & Card Checkout Button */}
                <button 
                  onClick={() => alert(`Redirecting to secure PayPal subscription checkout for ${plan.name} (${plan.price}/mo)...`)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: plan.highlight ? '#d97706' : '#0f172a',
                    color: 'white',
                    border: plan.highlight ? 'none' : '1px solid #475569',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Zap size={16} color="#f59e0b" /> Subscribe with PayPal / ACH
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</a>
        </div>

      </div>
    </div>
  );
}
