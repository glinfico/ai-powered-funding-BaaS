import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function InvestorPortal() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>INVESTOR PORTAL</span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>Portfolio & Deal Assignments</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Monitor syndicated loan portfolios, tranche performance, and automated ROI distributions.</p>
        </div>
        <button onClick={() => navigate('/portal')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
          ← Back to Portal Hub
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Portfolio Value</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>$4,850,000</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Projected Annual ROI</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>14.2%</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Active Tranche Assignments</h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Syndicated loan tranches and automated repayment distributions are fully active.</p>
      </div>
    </div>
  );
}
