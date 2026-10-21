import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function FodHome() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navigation Bar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #1e293b', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#d97706', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'white', fontSize: '18px' }}>G</div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em', color: 'white' }}>GLINFICO <span style={{ color: '#d97706' }}>FOD</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px', fontWeight: '600' }}>
          <Link to="/portal" style={{ color: '#94a3b8', textDecoration: 'none' }}>Portals</Link>
          <Link to="/pricing" style={{ color: '#94a3b8', textDecoration: 'none' }}>Pricing</Link>
          <Link to="/crm/leads" style={{ color: '#94a3b8', textDecoration: 'none' }}>Leads</Link>
          <button onClick={() => navigate('/crm/login')} style={{ backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ maxWidth: '1000px', margin: '80px auto 60px auto', textAlign: 'center', padding: '0 20px' }}>
        <span style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#f59e0b', border: '1px solid rgba(217, 119, 6, 0.3)', fontWeight: '700', fontSize: '11px', padding: '6px 16px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', marginBottom: '20px' }}>
          AI-Powered Funding BaaS & MCA Underwriting Engine
        </span>
        <h1 style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1.15', margin: '0 0 20px 0', letterSpacing: '-0.03em' }}>
          Instant Lender Matching & <span style={{ color: '#d97706' }}>Automated MCA Syndication</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '750px', margin: '0 auto 36px auto' }}>
          Connect borrowers, brokers, and 22,450+ institutional lenders with real-time AI scoring, secure PayPal/ACH subscriptions, and instant commission payouts.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/crm/dashboard')} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(217,119,6,0.3)' }}>
            Launch Control Center →
          </button>
          <button onClick={() => navigate('/portal')} style={{ backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', padding: '14px 28px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
            Access Stakeholder Portals
          </button>
          <button onClick={() => navigate('/pricing')} style={{ backgroundColor: '#0070ba', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
            Broker Subscription (PayPal/ACH)
          </button>
        </div>
      </section>

      {/* Asymmetric Professional Demo Videos Showcase */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 100px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>Platform Walkthroughs & Demo Suite</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px' }}>Watch how our AI underwriting engine and 22K+ lender network operate in real time.</p>
        </div>

        {/* Asymmetric Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'stretch' }}>
          
          {/* Main Featured Video Card (Asymmetric Large Left) */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', border: '1px solid #334155', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '320px', backgroundColor: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#d97706', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px auto', cursor: 'pointer', boxShadow: '0 0 20px rgba(217,119,6,0.5)' }}>
                  ▶
                </div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>AI Underwriting & Risk Scoring Walkthrough</div>
                <div style={{ color: '#94a3b8', fontSize: '13px' }}>Runtime: 4:15 mins</div>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>FEATURED DEMO</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '10px 0 6px 0' }}>Instant MCA Decisioning & 22K Lender Matching</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>See how bank statement analysis, FICO evaluation, and factor rate calculations happen in under 30 seconds.</p>
            </div>
          </div>

          {/* Right Column: Two Stacked Professional Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', border: '1px solid #334155', padding: '24px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>BROKER PORTAL</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>2:30 mins</span>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>Broker Subscriptions & Commission Payouts</h4>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>Demonstrating PayPal, CC, and ACH checkout flows linked with automated ledger distribution.</p>
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', border: '1px solid #334155', padding: '24px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>INVESTOR & LENDER</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>3:10 mins</span>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>Portfolio Syndication & Tranche Management</h4>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>Tracking portfolio yield, ROI distributions, and live term sheet issuances.</p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e293b', padding: '30px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        <p style={{ margin: 0 }}>© 2026 GLINFICO FOD • AI-Powered Funding BaaS & MCA Router. All rights reserved.</p>
      </footer>

    </div>
  );
}
