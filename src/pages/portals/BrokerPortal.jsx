import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BrokerPortal() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>BROKER PORTAL</span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>Leads, Deals & Lender Network</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Submit borrower applications, match deals against 22K+ lenders, and track commission shares.</p>
        </div>
        <button onClick={() => navigate('/portal')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
          ← Back to Portal Hub
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Active Broker Leads</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>142 Leads</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Submitted Deals</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>18 Deals ($2.4M)</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Commission Earned</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>$48,500</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Recent Broker Submissions</h3>
          <button onClick={() => navigate('/crm/deals')} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            + Submit New Deal
          </button>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px' }}>All 22,450 institutional lender matching algorithms are live and synchronizing automatically.</p>
      </div>
    </div>
  );
}
