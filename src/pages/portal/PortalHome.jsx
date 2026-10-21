import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PortalHome() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'borrower',
      title: 'Borrower Portal',
      desc: 'Track your active loan applications, upload bank statements, and review term sheets.',
      icon: '🏢',
      path: '/portal/borrower',
      color: '#3b82f6',
      bg: '#eff6ff'
    },
    {
      id: 'broker',
      title: 'Broker Portal',
      desc: 'Manage leads, submit deals to 22K+ lenders, and track commission payouts.',
      icon: '🤝',
      path: '/portal/broker',
      color: '#f59e0b',
      bg: '#fffbeb'
    },
    {
      id: 'lender',
      title: 'Lender Portal',
      desc: 'Review incoming matched deals, analyze risk scores, and issue binding term sheets.',
      icon: '🏦',
      path: '/portal/lender',
      color: '#10b981',
      bg: '#ecfdf5'
    },
    {
      id: 'investor',
      title: 'Investor Portal',
      desc: 'Monitor portfolio performance, syndicated loan tranches, and ROI distributions.',
      icon: '📈',
      path: '/portal/investor',
      color: '#8b5cf6',
      bg: '#f5f3ff'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '700', fontSize: '11px', padding: '6px 16px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', marginBottom: '16px' }}>
            GLINFICO FOD • Role-Based Portal Hub
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
            Select Your Portal Access
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            Choose your designated stakeholder portal below to access real-time applications, deal rooms, and funding networks.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {roles.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(r.path)}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '32px 24px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = r.color;
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)';
              }}
            >
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                  {r.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{r.title}</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px 0' }}>{r.desc}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: r.color, fontWeight: '700', fontSize: '14px' }}>
                <span>Launch {r.title}</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Control Center */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/crm/dashboard')}
            style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            ← Return to Control Center Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
