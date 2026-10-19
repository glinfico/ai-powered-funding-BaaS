import { useEffect, useState } from "react";

const SB_URL  = 'https://sadyhmrrqjkhoajuiumg.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZHlobXJycWpraG9hanVpdW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MDUzNDksImV4cCI6MjEwNTA4MTM0OX0.1RJvr9gR7fUHBW5_fLBqZZPbTiK-Eu6PZ3F9pYjgoDU';

const fmt     = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v)||0);
const fmtDate = d => d ? new Date(d).toLocaleDateString() : '--';

async function sb(table, params='') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}${params}`, {
    headers:{ 'apikey':SB_ANON, 'Authorization':`Bearer ${SB_ANON}` }
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const statusColor = s => {
  if (!s) return { bg:'#f1f5f9', color:'#475569' };
  s = s.toLowerCase();
  if (s.includes('approv') || s.includes('issued')) return { bg:'#dcfce7', color:'#166534' };
  if (s.includes('pending')) return { bg:'#fef3c7', color:'#92400e' };
  if (s.includes('declin')) return { bg:'#fee2e2', color:'#991b1b' };
  return { bg:'#f1f5f9', color:'#475569' };
};

export default function TermSheetsPage() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    sb('term_sheets','?select=*&order=created_at.desc&limit=200')
      .then(setSheets)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? sheets.filter(t =>
        (t.deal_id||'').toLowerCase().includes(search.toLowerCase()) ||
        (t.lender_name||t.funder_name||'').toLowerCase().includes(search.toLowerCase()) ||
        (t.status||'').toLowerCase().includes(search.toLowerCase())
      )
    : sheets;

  const totalOffered  = sheets.reduce((s,t) => s+(Number(t.offer_amount||t.amount)||0), 0);
  const totalApproved = sheets.filter(t => t.status?.toLowerCase().includes('approv')).length;
  const pending       = sheets.filter(t => t.status?.toLowerCase().includes('pending')).length;

  return (
    <main style={{ padding:'1.5rem', maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:'800', color:'#0f172a', margin:'0 0 0.25rem' }}>📄 Term Sheets</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:'0.875rem' }}>All issued term sheets and funder decisions</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Total Sheets', value: sheets.length, color:'#3b82f6' },
          { label:'Approved',     value: totalApproved, color:'#22c55e' },
          { label:'Pending',      value: pending,       color:'#f59e0b' },
          { label:'Total Offered',value: fmt(totalOffered), color:'#a855f7' },
        ].map(s => (
          <div key={s.label} style={{ background:'white', border:'1px solid #e2e8f0', borderLeft:`4px solid ${s.color}`, borderRadius:'12px', padding:'1.25rem' }}>
            <p style={{ margin:'0 0 0.5rem', fontSize:'0.75rem', fontWeight:'600', color:'#64748b', textTransform:'uppercase' }}>{s.label}</p>
            <p style={{ margin:0, fontSize:'1.5rem', fontWeight:'800', color:'#0f172a' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
          <input
            type="text" placeholder="🔍 Search by deal ID, lender, status..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'0.65rem 1rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.875rem', outline:'none' }}
          />
        </div>
        {error && <p style={{ padding:'1rem', color:'#ef4444' }}>Error: {error}</p>}
        {loading ? (
          <p style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>Loading term sheets...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>No term sheets found</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Deal ID','Lender','Offer Amount','Factor Rate','Payback','Daily Payment','Term','Status','Date'].map(h => (
                    <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.75rem', fontWeight:'600', color:'#64748b', textTransform:'uppercase', borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t,i) => {
                  const sc = statusColor(t.status);
                  return (
                    <tr key={t.id||i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'0.875rem 1rem', fontSize:'0.8rem', fontFamily:'monospace', color:'#64748b' }}>{t.deal_id?.slice(0,12)||'--'}…</td>
                      <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem', fontWeight:'600', color:'#0f172a' }}>{t.lender_name||t.funder_name||'--'}</td>
                      <td style={{ padding:'0.875rem 1rem', fontWeight:'700', color:'#16a34a' }}>{fmt(t.offer_amount||t.amount)}</td>
                      <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem' }}>{t.factor_rate||'--'}{t.factor_rate?'x':''}</td>
                      <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem' }}>{fmt(t.payback_amount)}</td>
                      <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem' }}>{fmt(t.daily_payment)}/day</td>
                      <td style={{ padding:'0.875rem 1rem', fontSize:'0.875rem' }}>{t.term_days||t.term_months||'--'}{t.term_days?' days':t.term_months?' mo':''}</td>
                      <td style={{ padding:'0.875rem 1rem' }}>
                        <span style={{ background:sc.bg, color:sc.color, padding:'0.25rem 0.6rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'600' }}>
                          {t.status||'pending'}
                        </span>
                      </td>
                      <td style={{ padding:'0.875rem 1rem', fontSize:'0.8rem', color:'#64748b' }}>{fmtDate(t.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
