import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LenderPortalPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>LENDER PORTAL</span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>Deals Matched to Your Criteria</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Review pre-vetted deal flow, inspect AI risk scores, and issue binding term sheets.</p>
        </div>
        <button onClick={() => navigate('/portal')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
          ← Back to Portal Hub
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Matched Deal Flow</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>34 Deals Ready</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Issued Term Sheets</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>12 Active Offers</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Incoming Matched Deal Queue</h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Your lending criteria (Min FICO 620, Factor Rate 1.15x - 1.35x, MCA & Bridge) is actively matching incoming platform submissions.</p>
      </div>
    </div>
  );
}
