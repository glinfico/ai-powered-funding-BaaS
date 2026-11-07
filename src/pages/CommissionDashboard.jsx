import React, { useState, useEffect } from 'react';
import { crmApi } from '@/lib/crmApi';

const fmt = v => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(Number(v)||0);

/**
 * Reads the real commissions table.
 *
 * This ledger previously displayed four hardcoded rows — "Sarah Jenkins",
 * "Michael Chang", "Pacific RE Bridge" — and totalled them into headline
 * figures. Anyone looking at the screen saw revenue that did not exist.
 */
export default function CommissionDashboard() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await crmApi.commissions({ limit: 500 });
        if (!cancelled) setCommissions(r.data || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Tolerate either the ledger shape from buildCommissionRecord() or a
  // simpler legacy row, rather than silently reading undefined as zero.
  const shareOf = c => Number(c.broker_amount ?? c.share ?? 0);
  const isPaid  = c => String(c.status || '').toLowerCase() === 'paid';

  const totalEarned  = commissions.reduce((s, c) => s + shareOf(c), 0);
  const totalPaid    = commissions.filter(isPaid).reduce((s, c) => s + shareOf(c), 0);
  const totalPending = totalEarned - totalPaid;

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>GLINFICO REVENUE</span>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>Commission & Broker Payout Ledger</h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Track broker commission shares, fee distributions, and pending payouts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Earned</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{fmt(totalEarned)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Paid Out</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>{fmt(totalPaid)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Pending Payout</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>{fmt(totalPending)}</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 20px', fontWeight: '700', color: '#475569' }}>Transaction</th>
              <th style={{ padding: '14px 20px', fontWeight: '700', color: '#475569' }}>Deal</th>
              <th style={{ padding: '14px 20px', fontWeight: '700', color: '#475569' }}>Broker</th>
              <th style={{ padding: '14px 20px', fontWeight: '700', color: '#475569' }}>Gross Comm.</th>
              <th style={{ padding: '14px 20px', fontWeight: '700', color: '#475569' }}>Broker Share</th>
              <th style={{ padding: '14px 20px', fontWeight: '700', color: '#475569' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                <td style={{ padding: '14px 20px', fontWeight: '700', fontFamily: 'monospace' }}>{c.id}</td>
                <td style={{ padding: '14px 20px', fontWeight: '600', color: '#0f172a' }}>{c.deal}</td>
                <td style={{ padding: '14px 20px', color: '#475569' }}>{c.broker}</td>
                <td style={{ padding: '14px 20px', fontWeight: '700' }}>{fmt(c.amount)}</td>
                <td style={{ padding: '14px 20px', fontWeight: '800', color: '#16a34a' }}>{fmt(c.share)}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ backgroundColor: c.status === 'Paid' ? '#dcfce7' : '#fef3c7', color: c.status === 'Paid' ? '#166534' : '#92400e', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
