import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const fmt = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(v) || 0);
const valueOf = (row, ...keys) => {
  for (const key of keys) if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') return row[key];
  return null;
};
const statusOf = row => String(valueOf(row, 'status', 'payout_status') || 'unrecorded').toLowerCase();

export default function CommissionDashboard() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (sessionError || !token) throw new Error('Your secure session is unavailable. Please sign in again.');
        const response = await fetch('/api/commissions', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(response.status === 403 ? 'Administrator access is required to view the commission ledger.' : `Could not load commission records (HTTP ${response.status}).`);
        const data = await response.json();
        if (!Array.isArray(data.commissions)) throw new Error('The commission API returned an unexpected response.');
        if (active) setCommissions(data.commissions);
      } catch (err) {
        if (active) { setCommissions([]); setError(err.message || 'Unable to load commission records.'); }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const rows = commissions.map((c, index) => {
    const gross = Number(valueOf(c, 'gross_commission', 'grossCommission', 'commission_amount', 'commissionAmount', 'amount') || 0);
    const brokerRecorded = valueOf(c, 'broker_share', 'brokerShare', 'broker_share_amount');
    const recorded = brokerRecorded == null ? null : Number(brokerRecorded);
    const status = statusOf(c);
    return {
      id: String(valueOf(c, 'id', 'commission_id', 'deal_id', 'dealId') || `COMMISSION-${index + 1}`),
      deal: String(valueOf(c, 'deal_name', 'deal', 'deal_id', 'dealId', 'application_id') || '—'),
      broker: String(valueOf(c, 'broker_name', 'brokerName', 'broker_id', 'brokerId') || 'Unassigned'),
      gross,
      entitlement: gross,
      recorded,
      status,
      date: valueOf(c, 'created_at', 'createdAt') || null,
      mismatch: recorded != null && gross > 0 && recorded < gross
    };
  });
  const totalEntitlement = rows.reduce((sum, row) => sum + row.entitlement, 0);
  const totalRecordedPaid = rows.filter(row => row.status === 'paid').reduce((sum, row) => sum + (row.recorded ?? row.entitlement), 0);
  const totalPending = rows.filter(row => !['paid', 'complete', 'completed'].includes(row.status)).reduce((sum, row) => sum + row.entitlement, 0);

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>GLINFICO REVENUE</span>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>Commission & Broker Payout Ledger</h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Broker entitlement is 100% of the eligible commission on broker-owned or broker-assigned deals. This ledger reports stored payout status; it does not execute payments.</p>
      </div>

      {error && <div role="alert" style={{ marginBottom: '20px', padding: '14px 18px', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', background: '#fef2f2' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Broker Entitlement (100%)</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{loading ? 'Loading…' : fmt(totalEntitlement)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Recorded Paid Amount</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>{loading ? 'Loading…' : fmt(totalRecordedPaid)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Not Yet Recorded as Paid</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>{loading ? 'Loading…' : fmt(totalPending)}</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
          {loading ? 'Loading commission records…' : `${rows.length.toLocaleString()} commission records from the database`}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px' }}>Reference</th>
                <th style={{ padding: '14px 16px' }}>Deal</th>
                <th style={{ padding: '14px 16px' }}>Broker</th>
                <th style={{ padding: '14px 16px' }}>Gross Commission</th>
                <th style={{ padding: '14px 16px' }}>Broker Entitlement (100%)</th>
                <th style={{ padding: '14px 16px' }}>Recorded Broker Share</th>
                <th style={{ padding: '14px 16px' }}>Payout Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{error ? 'Commission data unavailable.' : 'No commission records returned by the database.'}</td></tr>}
              {rows.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', fontFamily: 'monospace' }}>{row.id}</td>
                  <td style={{ padding: '14px 16px' }}>{row.deal}</td>
                  <td style={{ padding: '14px 16px' }}>{row.broker}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '700' }}>{fmt(row.gross)}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '800', color: '#15803d' }}>{fmt(row.entitlement)}</td>
                  <td style={{ padding: '14px 16px', color: row.mismatch ? '#b91c1c' : '#475569' }}>{row.recorded == null ? 'Not recorded' : fmt(row.recorded)}{row.mismatch ? ' · REVIEW SPLIT' : ''}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ backgroundColor: row.status === 'paid' ? '#dcfce7' : '#fef3c7', color: row.status === 'paid' ? '#166534' : '#92400e', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                      {row.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
