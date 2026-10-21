import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  const handlePayPalSubscribe = () => {
    // Kathy's configured PayPal Subscription Plan Link
    window.location.href = 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-52U45125RJ473735HMVLME2A';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '60px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '700', fontSize: '11px', padding: '6px 16px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', marginBottom: '16px' }}>
            GLINFICO FOD • Broker & Funder Subscriptions
          </span>
          <h1 style={{ fontSize: '38px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
            Transparent Pricing & Instant Network Access
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '650px', margin: '0 auto' }}>
            Unlock 22,450+ institutional lenders, automated MCA underwriting, and real-time commission tracking.
          </p>

          {/* Payment Method Badges Header */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Secure Payments via:</span>
            <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>PayPal</span>
            <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>Credit Card (CC)</span>
            <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>Debit Card (DC)</span>
            <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>ACH Direct Debit</span>
          </div>
        </div>

        {/* Pricing Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', justifyContent: 'center' }}>
          
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', border: '2px solid #3b82f6', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-14px', right: '24px', backgroundColor: '#3b82f6', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
              Most Popular
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Pro Broker Subscription</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px 0' }}>Full access to 22K+ lender network, instant lead scoring, and automated commission payouts.</p>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
              <span style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a' }}>$197</span>
              <span style={{ color: '#64748b', fontSize: '14px' }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Unlimited AI Underwriting & Deal Scoring</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Direct Submission to 22,450 Lenders</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Automated Commission Splits & Ledger</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Dedicated Broker Portal & CRM Access</li>
            </ul>

            <button
              onClick={handlePayPalSubscribe}
              style={{
                width: '100%',
                backgroundColor: '#0070ba',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 112, 186, 0.3)'
              }}
            >
              <span>Subscribe with PayPal / CC / DC / ACH</span>
              <span>→</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={() => navigate('/portal/broker')}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Already subscribed? Enter Broker Portal →
              </button>
            </div>
          </div>

        </div>

        {/* Back Button */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button
            onClick={() => navigate('/')}
            style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            ← Return to Home
          </button>
        </div>

      </div>
    </div>
  );
}
