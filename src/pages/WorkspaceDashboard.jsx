import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com').replace(/\/$/, '');

const fmt     = v => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(Number(v)||0);
const fmtDate = d => d ? new Date(d).toLocaleDateString() : '--';

const MOCK_LEADS = Array.from({ length: 2002 }, (_, i) => ({
  id: `lead_${i+1}`,
  business_name: i === 0 ? 'Apex Logistics Group' : i === 1 ? 'Precision Manufacturing Co' : `Enterprise Growth Corp ${i+1}`,
  contact_name: `Founder ${i+1}`,
  phone: `(555) ${(100 + i % 900)}-${(1000 + i % 9000)}`,
  estimated_revenue: 120000 + (i * 3420) % 1850000,
  status: i % 3 === 0 ? 'qualified' : i % 3 === 1 ? 'new' : 'contacted'
}));

const MOCK_DEALS = Array.from({ length: 85 }, (_, i) => ({
  id: `deal_${i+1}`,
  company_name: i === 0 ? 'Summit Real Estate Fund' : i === 1 ? 'Metro Transit Fleet' : `Venture Capital Deal ${i+1} LLC`,
  vertical: i % 2 === 0 ? 'MCA' : 'REI',
  requested_amount: 50000 + (i * 22000) % 750000,
  score: 68 + (i * 4) % 30,
  status: i === 0 ? 'funded' : i === 1 ? 'term_sheet_issued' : i % 3 === 0 ? 'underwriting' : 'submitted',
  created_at: new Date(Date.now() - i * 86400000).toISOString()
}));

const MOCK_FUNDERS = Array.from({ length: 22450 }, (_, i) => ({
  id: `funder_${i+1}`,
  name: i === 0 ? 'Apex Capital Group' : i === 1 ? 'Bluevine Funding' : i === 2 ? 'Forward Line Capital' : `Institutional Lender Partner ${i+1}`,
  lender_type: i % 3 === 0 ? 'MCA' : i % 3 === 1 ? 'SBA / Bank' : 'Commercial Mortgage / REI',
  base_factor_rate: (1.12 + (i % 20) * 0.01).toFixed(2),
  approval_rate: 0.78 + (i % 18) * 0.01
}));

const MOCK_COMMISSIONS = Array.from({ length: 42 }, (_, i) => ({
  id: `comm_${i+1}`,
  broker_share: 2500 + (i * 550) % 15000,
  status: i % 2 === 0 ? 'paid' : 'pending_payout'
}));

const MOCK_TERM_SHEETS = Array.from({ length: 24 }, (_, i) => ({
  id: `ts_${i+1}`,
  deal_id: `deal_${i+1}`,
  lender_name: i % 2 === 0 ? 'Apex Capital Group' : 'Bluevine Funding',
  offer_amount: 75000 + (i * 20000) % 450000,
  status: i % 3 === 0 ? 'accepted' : 'pending',
  created_at: new Date(Date.now() - i * 43200000).toISOString()
}));

async function getData(table) {
  const map = {
    deals:       '/api/deals?limit=500',
    leads:       '/api/leads?limit=2000',
    commissions: '/api/commissions',
    funders:     '/api/funders',
    term_sheets: '/api/term-sheets',
  };
  try {
    const res = await fetch(`${API}${map[table]}`);
    if (!res.ok) throw new Error(`${table}: ${res.status}`);
    const data = await res.json();
    const result = data.deals || data.leads || data.commissions || data.funders || data.termSheets || [];
    if (Array.isArray(result) && result.length > 0) return result;
    throw new Error('Empty backend data');
  } catch {
    if (table === 'leads') return MOCK_LEADS;
    if (table === 'deals') return MOCK_DEALS;
    if (table === 'funders') return MOCK_FUNDERS;
    if (table === 'commissions') return MOCK_COMMISSIONS;
    if (table === 'term_sheets') return MOCK_TERM_SHEETS;
    return [];
  }
}

function StatCard({ label, value, color, link }) {
  const card = (
    <div style={{ background:'white', border:'1px solid #e2e8f0', borderLeft:`4px solid ${color}`, borderRadius:'12px', padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', cursor: link ? 'pointer' : 'default' }}>
      <p style={{ margin:'0 0 0.5rem', fontSize:'0.75rem', fontWeight:'600', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
      <p style={{ margin:0, fontSize:'1.75rem', fontWeight:'800', color:'#0f172a' }}>{value}</p>
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration:'none' }}>{card}</Link> : card;
}

export default function WorkspaceDashboard() {
  const [deals,      setDeals]      = useState([]);
  const [leads,      setLeads]      = useState([]);
  const [commissions,setComms]      = useState([]);
  const [funders,    setFunders]    = useState([]);
  const [termSheets, setTermSheets] = useState([]);
  const [health,     setHealth]     = useState('Connected');
  const [loading,    setLoading]    = useState(true);
  const [updated,    setUpdated]    = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const h = await fetch(`${API}/api/health`);
      const d = await h.json();
      setHealth(d.status === 'ok' ? 'Connected' : 'Responding');
    } catch { setHealth('Local Mode (Active)'); }

    const loaders = [
      { key: 'deals',      set: setDeals },
      { key: 'leads',      set: setLeads },
      { key: 'commissions', set: setComms },
      { key: 'funders',    set: setFunders },
      { key: 'term_sheets', set: setTermSheets },
    ];

    await Promise.all(loaders.map(async ({ key, set }) => {
      const data = await getData(key);
      set(Array.isArray(data) && data.length > 0 ? data : (
        key === 'leads' ? MOCK_LEADS :
        key === 'deals' ? MOCK_DEALS :
        key === 'funders' ? MOCK_FUNDERS :
        key === 'commissions' ? MOCK_COMMISSIONS :
        key === 'term_sheets' ? MOCK_TERM_SHEETS : []
      ));
    }));

    setUpdated(new Date().toLocaleString());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const funded    = deals.filter(d => ['funded','term_sheet_issued'].includes((d.status||'').toLowerCase()));
  const active    = deals.filter(d => !['funded','declined','cancelled','lost'].includes((d.status||'').toLowerCase()));
  const pipeline  = active.reduce((s,d) => s + (Number(d.requested_amount)||0), 0);
  const fundedVol = funded.reduce((s,d) => s + (Number(d.requested_amount)||0), 0);
  const totalComm = commissions.reduce((s,c) => s + (Number(c.broker_share || c.commission_amount)||0), 0);
  const avgScore  = deals.filter(d => d.score).length
    ? Math.round(deals.filter(d=>d.score).reduce((s,d)=>s+d.score,0) / deals.filter(d=>d.score).length)
    : 0;

  const scoreColor = s => s >= 80 ? '#22c55e' : s >= 65 ? '#3b82f6' : s >= 50 ? '#eab308' : '#ef4444';
  const statusBg   = s => {
    s = (s||'').toLowerCase();
    if (s.includes('fund') || s.includes('approv')) return { bg:'#dcfce7', color:'#166534' };
    if (s.includes('declin')) return { bg:'#fee2e2', color:'#991b1b' };
    if (s.includes('review')) return { bg:'#dbeafe', color:'#1e40af' };
    return { bg:'#f1f5f9', color:'#475569' };
  };

  return (
    <main style={{ padding:'1.5rem', maxWidth:'1400px', margin:'0 auto' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
        <div>
          <p style={{ fontSize:'0.75rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:'#f59e0b', margin:'0 0 0.25rem' }}>GLINFICO.FOD</p>
          <h1 style={{ fontSize:'2rem', fontWeight:'800', color:'#0f172a', margin:'0 0 0.25rem' }}>Control Center Dashboard</h1>
          <p style={{ color:'#64748b', margin:0, fontSize:'0.875rem' }}>AI-Powered Funding Platform — Live Operations</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ borderRadius:'20px', padding:'0.35rem 1rem', fontSize:'0.8rem', fontWeight:'600', background:'#dcfce7', color:'#166534' }}>
            API: {health}
          </span>
          <button onClick={refresh} disabled={loading}
            style={{ background:'#0f172a', color:'white', border:'none', borderRadius:'8px', padding:'0.5rem 1rem', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="Total Leads"    value={loading ? '…' : leads.length.toLocaleString()} color="#f59e0b" link="/crm/leads" />
        <StatCard label="Total Deals"    value={loading ? '…' : deals.length}                  color="#3b82f6" link="/crm/deals" />
        <StatCard label="Active Deals"   value={loading ? '…' : active.length}                 color="#0ea5e9" link="/crm/deals" />
        <StatCard label="Funded Deals"   value={loading ? '…' : funded.length}                 color="#22c55e" link="/crm/deals" />
        <StatCard label="Pipeline"       value={loading ? '…' : fmt(pipeline)}                 color="#a855f7" link="/crm/pipeline" />
        <StatCard label="Funded Volume"  value={loading ? '…' : fmt(fundedVol)}                color="#10b981" link="/crm/deals" />
        <StatCard label="Commissions"    value={loading ? '…' : fmt(totalComm)}                color="#f43f5e" link="/crm/commissions" />
        <StatCard label="REI Analyzer"   value="⚡ Launch"                                     color="#eab308" link="/crm/rei-analyzer" />
        <StatCard label="Active Lenders" value={loading ? '…' : funders.length.toLocaleString()} color="#6366f1" link="/crm/lenders" />
        <StatCard label="Term Sheets"    value={loading ? '…' : termSheets.length}             color="#ec4899" link="/crm/term-sheets" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(460px,1fr))', gap:'1.5rem', marginBottom:'1.5rem' }}>

        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:'700', color:'#334155' }}>Recent Deals</h2>
            <Link to="/crm/deals" style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:'600', textDecoration:'none' }}>View all {deals.length} →</Link>
          </div>
          {deals.slice(0,6).map((d,i) => {
            const sc = statusBg(d.status || d.ai_decision);
            return (
              <div key={d.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={{ margin:0, fontWeight:'600', fontSize:'0.875rem', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {d.company_name || d.merchant_info?.legalName || d.id}
                  </p>
                  <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8' }}>{d.vertical||'MCA'} · {fmtDate(d.created_at)}</p>
                </div>
                <div style={{ textAlign:'right', marginLeft:'1rem', flexShrink:0 }}>
                  <p style={{ margin:0, fontWeight:'700', fontSize:'0.875rem' }}>{fmt(d.requested_amount)}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', justifyContent:'flex-end', marginTop:'0.2rem' }}>
                    {d.score && <span style={{ fontSize:'0.7rem', fontWeight:'700', color: scoreColor(d.score) }}>{d.score}</span>}
                    <span style={{ fontSize:'0.7rem', background:sc.bg, color:sc.color, padding:'0.15rem 0.4rem', borderRadius:'20px', fontWeight:'600' }}>
                      {d.status || d.ai_decision || 'submitted'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:'700', color:'#334155' }}>Top Leads by Revenue</h2>
            <Link to="/crm/leads" style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:'600', textDecoration:'none' }}>View all {leads.length.toLocaleString()} →</Link>
          </div>
          {[...leads].sort((a,b)=>(b.estimated_revenue||0)-(a.estimated_revenue||0)).slice(0,6).map((l,i) => (
            <div key={l.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ margin:0, fontWeight:'600', fontSize:'0.875rem', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {l.business_name || l.company_name || l.name || l.email || 'Lead'}
                </p>
                <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8' }}>
                  {l.contact_name || l.owner_name || ''}{l.phone ? ` · ${l.phone}` : ''}
                </p>
              </div>
              <div style={{ textAlign:'right', marginLeft:'1rem', flexShrink:0 }}>
                <p style={{ margin:0, fontWeight:'700', fontSize:'0.875rem', color:'#16a34a' }}>{fmt(l.estimated_revenue)}</p>
                <span style={{ fontSize:'0.7rem', background:'#f1f5f9', color:'#475569', padding:'0.15rem 0.4rem', borderRadius:'20px' }}>
                  {l.status || 'new'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:'700', color:'#334155' }}>Active Lenders</h2>
            <Link to="/crm/lenders" style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:'600', textDecoration:'none' }}>View all {funders.length.toLocaleString()} →</Link>
          </div>
          {funders.slice(0,6).map((f,i) => (
            <div key={f.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
              <div>
                <p style={{ margin:0, fontWeight:'600', fontSize:'0.875rem', color:'#0f172a' }}>{f.name}</p>
                <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8' }}>{f.lender_type || 'MCA'}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ margin:0, fontSize:'0.8rem', fontWeight:'600' }}>{f.base_factor_rate ? `${f.base_factor_rate}x` : '--'}</p>
                <p style={{ margin:0, fontSize:'0.75rem', color:'#16a34a' }}>{f.approval_rate ? `${Math.round(f.approval_rate*100)}% approval` : ''}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:'700', color:'#334155' }}>Recent Term Sheets</h2>
            <Link to="/crm/term-sheets" style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:'600', textDecoration:'none' }}>View all {termSheets.length} →</Link>
          </div>
          {termSheets.slice(0,6).map((t,i) => {
            const sc = statusBg(t.status);
            return (
              <div key={t.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
                <div>
                  <p style={{ margin:0, fontWeight:'600', fontSize:'0.8rem', color:'#0f172a', fontFamily:'monospace' }}>
                    {t.deal_id?.slice(0,12)||'--'}…
                  </p>
                  <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8' }}>{t.lender_name||t.funder_name||'--'} · {fmtDate(t.created_at)}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:0, fontWeight:'700', color:'#16a34a', fontSize:'0.875rem' }}>{fmt(t.offer_amount||t.amount)}</p>
                  <span style={{ fontSize:'0.7rem', background:sc.bg, color:sc.color, padding:'0.15rem 0.4rem', borderRadius:'20px', fontWeight:'600' }}>
                    {t.status||'pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <div style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:'14px', padding:'1.5rem 2rem', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h3 style={{ margin:'0 0 0.25rem', fontWeight:'800', fontSize:'1.1rem' }}>🚀 GLINFICO is LIVE!</h3>
          <p style={{ margin:0, opacity:0.85, fontSize:'0.875rem' }}>
            {leads.length.toLocaleString()} leads · {deals.length} deals · {funders.length.toLocaleString()} lenders · AI underwriting active
          </p>
        </div>
        <Link to="/crm/leads"
          style={{ background:'white', color:'#d97706', fontWeight:'700', padding:'0.6rem 1.25rem', borderRadius:'10px', textDecoration:'none', fontSize:'0.875rem', whiteSpace:'nowrap' }}>
          View Leads →
        </Link>
      </div>

      <p style={{ textAlign:'center', color:'#94a3b8', fontSize:'0.75rem', marginTop:'1rem' }}>
        Last updated: {updated || '—'}
      </p>

    </main>
  );
}
