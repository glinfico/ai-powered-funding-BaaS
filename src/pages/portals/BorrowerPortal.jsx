import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BorrowerPortal() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>BORROWER PORTAL</span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>Deal & Application Tracking</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Track your active funding status, submit required documents, and review term sheets.</p>
        </div>
        <button onClick={() => navigate('/portal')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
          ← Back to Portal Hub
        </button>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px', borderLeft: '5px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase' }}>Active Application #APP-8842</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>Apex Logistics Expansion Loan</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Requested Amount: <strong style={{ color: '#0f172a' }}>$250,000</strong> · Vertical: Commercial MCA</p>
          </div>
          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 16px', borderRadius: '20px', fontWeight: '700', fontSize: '13px' }}>
            ● Underwriting Review
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Document Checklist</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>3 Months Business Bank Statements (<span style={{ color: '#16a34a', fontWeight: '600' }}>Verified</span>)</li>
            <li>Tax Returns 2025 (<span style={{ color: '#16a34a', fontWeight: '600' }}>Verified</span>)</li>
            <li>Driver License Owner Verification (<span style={{ color: '#d97706', fontWeight: '600' }}>Pending Upload</span>)</li>
          </ul>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Available Term Sheets</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>1 Term Sheet issued by Apex Capital Group.</p>
          <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            View & Sign Term Sheet →
          </button>
        </div>
      </div>
    </div>
  );
}
