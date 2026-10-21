import React, { useState } from 'react';

const fmt = v => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(Number(v)||0);

export default function ALSLoanServicingPage() {
  const [loans, setLoans] = useState([
    { id: 'ALS-1001', borrower: 'Apex Logistics LLC', lender: 'Apex Capital Group', type: 'Commercial Mortgage', principal: 1250000, rate: '8.5%', term: '36 mos', status: 'Active Servicing', nextPayment: '2026-11-01' },
    { id: 'ALS-1002', borrower: 'Pacific RE Holdings', lender: 'Bluevine Funding', type: 'Bridge Loan / REI', principal: 450000, rate: '10.2%', term: '12 mos', status: 'Active Servicing', nextPayment: '2026-11-05' },
    { id: 'ALS-1003', borrower: 'Metro Transit Fleet', lender: 'Forward Line Capital', type: 'Equipment Financing', principal: 850000, rate: '9.1%', term: '24 mos', status: 'Escrow Review', nextPayment: '2026-11-12' },
    { id: 'ALS-1004', borrower: 'Sunbelt Properties', lender: 'Global Funder Network', type: 'Residential Mortgage Portfolio', principal: 3100000, rate: '7.8%', term: '120 mos', status: 'Active Servicing', nextPayment: '2026-11-15' },
  ]);

  const totalServicedPrincipal = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalCommission2Percent = totalServicedPrincipal * 0.02;

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '32px' }}>
        <div>
          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '700', fontSize: '11px', padding: '6px 16px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', marginBottom: '10px' }}>
            GLINFICO ALS • Loan Servicing & Mortgage Operations
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
            Automated Loan Services (ALS) Control Center
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
            Servicing institutional lender loans, escrow management, and automated payment distribution with 2% platform commission.
          </p>
        </div>
      </div>

      {/* METRICS STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', borderLeft: '5px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Total Serviced Volume</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>{fmt(totalServicedPrincipal)}</div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px' }}>● 100% Performing Escrow</div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', borderLeft: '5px solid #16a34a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>ALS 2% Loan Commission</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a' }}>{fmt(totalCommission2Percent)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Calculated at 2.0% of principal</div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', borderLeft: '5px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Active Serviced Loans</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>{loans.length} Portfolios</div>
          <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '6px' }}>Automated ACH & Mortgage Ledger</div>
        </div>
      </div>

      {/* LOAN SERVICING TABLE */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Active Serviced Portfolios & 2% Commission Breakdown</h3>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Updated Real-Time</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Loan ID / Borrower</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Lender Partner</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Loan Type</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Principal Balance</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>ALS 2% Comm.</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l, i) => {
                const comm = l.principal * 0.02;
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{l.borrower}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{l.id} · Next: {l.nextPayment}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155', fontWeight: '600' }}>{l.lender}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                        {l.type} ({l.rate})
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{fmt(l.principal)}</td>
                    <td style={{ padding: '16px 20px', fontWeight: '800', color: '#16a34a', fontSize: '14px' }}>{fmt(comm)}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
