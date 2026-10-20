import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SB_URL  = 'https://sadyhmrrqjkhoajuiumg.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZHlobXJycWpraG9hanVpdW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MDUzNDksImV4cCI6MjEwNTA4MTM0OX0.1RJvr9gR7fUHBW5_fLBqZZPbTiK-Eu6PZ3F9pYjgoDU';
const API     = (import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com').replace(/\/$/, '');

const fmt = v => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(Number(v) || 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString() : '--';

async function sb(table, params = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}${params}`, {
    headers: { 'apikey': SB_ANON, 'Authorization': `Bearer ${SB_ANON}` }
  });
  if (!res.ok) throw new Error(`${table}: ${res.status}`);
  return res.json();
}

function StatCard({ label, value, color, link }) {
  const card = (
    <div style={{ background:'white', border:`1px solid #e2e8f0`, borderLeft:`4px solid ${color}`, borderRadius:'12px', padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize:'0.75rem', fontWeight:'600', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 0.5rem' }}>{label}</p>
      <p style={{ fontSize:'1.75rem', fontWeight:'800', color:'#0f172a', margin:0 }}>{value}</p>
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration:'none' }}>{card}</Link> : card;
}

export default function WorkspaceDashboard() {
  const [deals, setDeals]           = useState([]);
  const [leads, setLeads]           = useState([]);
  const [commissions, setComms]     = useState([]);
  const [funders, setFunders]       = useState([]);
  const [termSheets, setTermSheets] = useState([]);
  const [health, setHealth]         = useState('Checking');
  const [loading, setLoading]       = useState(true);
  const [updated, setUpdated]       = useState('');
  const [errors, setErrors]         = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const errs = [];
    try {
      const h = await fetch(`${API}/api/health`);
      const hd = await h.json();
      setHealth(hd.status === 'ok' ? 'Connected' : 'Responding');
    } catch { setHealth('Unavailable'); errs.push('API health check failed'); }

    try { setDeals(await sb('deals', '?select=*&order=created_at.desc&limit=500')); } catch(e) { errs.push(e.message); }
    try { setLeads(await sb('leads', '?select=*&order=created_at.desc&limit=2000')); } catch(e) { errs.push(e.message); }
    try { setComms(await sb('commissions', '?select=*&order=created_at.desc&limit=200')); } catch(e) { errs.push('Commissions: ' + e.message); }
    try { setFunders(await sb('funders', '?select=*&active=eq.true&order=name.asc')); } catch(e) { errs.push(e.message); }
    try { setTermSheets(await sb('term_sheets', '?select=*&order=created_at.desc&limit=100')); } catch(e) { errs.push(e.message); }

    setErrors(errs);
    setUpdated(new Date().toLocaleString());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Computed stats
  const funded     = deals.filter(d => ['funded','term_sheet_issued'].includes(d.status?.toLowerCase()));
  const active     = deals.filter(d => !['funded','declined','cancelled','lost'].includes(d.status?.toLowerCase()));
  const pipeline   = active.reduce((s,d) => s + (Number(d.requested_amount) || 0), 0);
  const fundedVol  = funded.reduce((s,d) => s + (Number(d.requested_amount) || 0), 0);
  const totalComm  = [...commissions, ...deals.filter(d => d.commission_amount > 0)]
    .reduce((s,c) => s + (Number(c.broker_share || c.commission_amount) || 0), 0);
  const avgScore   = deals.filter(d => d.score).length
    ? Math.round(deals.filter(d => d.score).reduce((s,d) => s + d.score, 0) / deals.filter(d => d.score).length)
    : 0;

  const scoreColor = s => s >= 80 ? '#22c55e' : s >= 65 ? '#3b82f6' : s >= 50 ? '#eab308' : '#ef4444';
  const tierBg     = t => ({ A:'#dcfce7', B:'#dbeafe', C:'#fef3c7', D:'#fee2e2', F:'#f1f5f9' })[t] || '#f1f5f9';
  const tierColor2 = t => ({ A:'#166534', B:'#1e40af', C:'#92400e', D:'#991b1b', F:'#475569' })[t] || '#475569';

  return (
    <main style={{ padding:'1.5rem', maxWidth:'1400px', margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
        <div>
          <p style={{ fontSize:'0.75rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:'#f59e0b', margin:'0 0 0.25rem' }}>GLINFICO.FOD</p>
          <h1 style={{ fontSize:'2rem', fontWeight:'800', color:'#0f172a', margin:'0 0 0.25rem' }}>Control Center Dashboard</h1>
          <p style={{ color:'#64748b', margin:0, fontSize:'0.875rem' }}>AI-Powered Funding Platform — Live Operations</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ borderRadius:'20px', padding:'0.35rem 1rem', fontSize:'0.8rem', fontWeight:'600', background: health === 'Connected' ? '#dcfce7' : health === 'Unavailable' ? '#fee2e2' : '#fef3c7', color: health === 'Connected' ? '#166534' : health === 'Unavailable' ? '#991b1b' : '#92400e' }}>
            API: {health}
          </span>
          <button onClick={refresh} disabled={loading}
            style={{ background:'#0f172a', color:'white', border:'none', borderRadius:'8px', padding:'0.5rem 1rem', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div style={{ background:'#fef3c7', border:'1px solid #fde047', borderRadius:'12px', padding:'1rem', marginBottom:'1.5rem' }}>
          <p style={{ fontWeight:'600', color:'#92400e', margin:'0 0 0.5rem' }}>⚠️ Some endpoints need attention</p>
          {errors.map(e => <p key={e} style={{ fontSize:'0.8rem', color:'#92400e', margin:'0.2rem 0' }}>• {e}</p>)}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="Total Leads"     value={loading ? '…' : leads.length.toLocaleString()} color="#f59e0b" link="/crm/leads" />
        <StatCard label="Total Deals"     value={loading ? '…' : deals.length}                  color="#3b82f6" link="/crm/deals" />
        <StatCard label="Active Deals"    value={loading ? '…' : active.length}                 color="#0ea5e9" link="/crm/deals" />
        <StatCard label="Funded Deals"    value={loading ? '…' : funded.length}                 color="#22c55e" link="/crm/deals" />
        <StatCard label="Pipeline Value"  value={loading ? '…' : fmt(pipeline)}                 color="#a855f7" link="/crm/pipeline" />
        <StatCard label="Funded Volume"   value={loading ? '…' : fmt(fundedVol)}                color="#10b981" link="/crm/deals" />
        <StatCard label="Commissions"     value={loading ? '…' : fmt(totalComm)}                color="#f43f5e" link="/crm/commissions" />
        <StatCard label="Avg AI Score"    value={loading ? '…' : avgScore ? `${avgScore}/100` : '--'} color="#f59e0b" link="/crm/deals" />
        <StatCard label="Active Lenders"  value={loading ? '…' : funders.length}                color="#6366f1" link="/crm/lenders" />
        <StatCard label="Term Sheets"     value={loading ? '…' : termSheets.length}             color="#ec4899" link="/crm/term-sheets" />
      </div>

      {/* Main Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(480px,1fr))', gap:'1.5rem', marginBottom:'1.5rem' }}>

        {/* Recent Deals */}
        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:'700', color:'#334155' }}>Recent Deals</h2>
            <Link to="/crm/deals" style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:'600', textDecoration:'none' }}>View all →</Link>
          </div>
          {deals.length === 0 ? (
            <p style={{ padding:'2rem', textAlign:'center', color:'#94a3b8', fontSize:'0.875rem' }}>{loading ? 'Loading…' : 'No deals yet'}</p>
          ) : (
            <div>
              {deals.slice(0,6).map((d,i) => (
                <div key={d.id||i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <p style={{ margin:0, fontWeight:'600', fontSize:'0.875rem', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {d.company_name || d.merchant_info?.legalName || d.id}
                    </p>
                    <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8' }}>
                      {d.vertical || 'MCA'} · {fmtDate(d.created_at)}
                    </p>
                  </div>
                  <div style={{ textAlign:'right', marginLeft:'1rem', flexShrink:0 }}>
                    <p style={{ margin:0, fontWeight:'700', fontSize:'0.875rem', color:'#0f172a' }}>{fmt(d.requested_amount)}</p>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem' }}>
                      {d.score && <span style={{ fontSize:'0.7rem', fontWeight:'700', color: scoreColor(d.score) }}>{d.score}</span>}
                      {d.ai_decision && (
                        <span style={{ fontSize:'0.7rem', background: tierBg(d.ai_decision?.[0]), color: tierColor2(d.ai_decision?.[0]), padding:'0.15rem 0.4rem', borderRadius:'20px', fontWeight:'600' }}>
                          {d.ai_decision?.split('_').join(' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:'700', color:'#334155' }}>Top Leads by Revenue</h2>
            <Link to="/crm/leads" style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:'600', textDecoration:'none' }}>View all {leads.length.toLocaleString()} →</Link>
          </div>
          {leads.length === 0 ? (
            <p style={{ padding:'2rem', textAlign:'center', color:'#94a3b8', fontSize:'0.875rem' }}>{loading ? 'Loading…' : 'No leads yet'}</p>
          ) : (
            <div>
              {[...leads].sort((a,b) => (b.estimated_revenue||0)-(a.estimated_revenue||0)).slice(0,6).map((l,i) => (
                <div key={l.id||i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <p style={{ margin:0, fontWeight:'600', fontSize:'0.875rem', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {l.business_name || l.company_name || l.name || l.email || 'Lead'}
                    </p>
                    <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8' }}>
                      {l.contact_name || l.owner_name || ''} {l.phone ? `· ${l.phone}` : ''}
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
          )}
        </div>

        {/* Lenders */}
        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:'700', color:'#334155' }}>Active Lenders</h2>
            <Link to="/crm/lenders" style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:'600', textDecoration:'none' }}>View all {funders.length} →</Link>
          </div>
          {funders.length === 0 ? (
            <p style={{ padding:'2rem', textAlign:'center', color:'#94a3b8', fontSize:'0.875rem' }}>{loading ? 'Loading…' : 'No lenders'}</p>
          ) : (
            <div>
              {funders.slice(0,6).map((f,i) => (
                <div key={f.id||i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
                  <div>
                    <p style={{ margin:0, fontWeight:'600', fontSize:'0.875rem', color:'#0f172a' }}>{f.name}</p>
                    <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8' }}>{f.lender_type || 'MCA'}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:0, fontSize:'0.8rem', fontWeight:'600', color:'#0f172a' }}>{f.base_factor_rate ? `${f.base_factor_rate}x` : '--'}</p>
                    <p style={{ margin:0, fontSize:'0.75rem', color:'#16a34a' }}>{f.approval_rate ? `${Math.round(f.approval_rate*100)}% approval` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Term Sheets */}
        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:'700', color:'#334155' }}>Recent Term Sheets</h2>
            <Link to="/crm/term-sheets" style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:'600', textDecoration:'none' }}>View all →</Link>
          </div>
          {termSheets.length === 0 ? (
            <p style={{ padding:'2rem', textAlign:'center', color:'#94a3b8', fontSize:'0.875rem' }}>{loading ? 'Loading…' : 'No term sheets yet'}</p>
          ) : (
            <div>
              {termSheets.slice(0,6).map((t,i) => (
                <div key={t.id||i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1.5rem', borderBottom:'1px solid #f8fafc' }}>
                  <div>
                    <p style={{ margin:0, fontWeight:'600', fontSize:'0.875rem', color:'#0f172a', fontFamily:'monospace' }}>{t.deal_id?.slice(0,12)}…</p>
                    <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8' }}>{fmtDate(t.created_at)}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:0, fontWeight:'700', color:'#16a34a', fontSize:'0.875rem' }}>{fmt(t.offer_amount || t.amount)}</p>
                    <p style={{ margin:0, fontSize:'0.75rem', color:'#64748b' }}>{t.factor_rate ? `${t.factor_rate}x` : ''} · {t.status || '--'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Launch Banner */}
      <div style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:'14px', padding:'1.5rem 2rem', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h3 style={{ margin:'0 0 0.25rem', fontWeight:'800', fontSize:'1.1rem' }}>🚀 GLINFICO is LIVE!</h3>
          <p style={{ margin:0, opacity:0.85, fontSize:'0.875rem' }}>
            {leads.length.toLocaleString()} leads · {deals.length} deals · {funders.length} funders · AI underwriting active
          </p>
        </div>
        <Link to="/crm/leads"
          style={{ background:'white', color:'#d97706', fontWeight:'700', padding:'0.6rem 1.25rem', borderRadius:'10px', textDecoration:'none', fontSize:'0.875rem', whiteSpace:'nowrap' }}>
          View Leads →
        </Link>
      </div>

      {/* Last updated */}
      <p style={{ textAlign:'center', color:'#94a3b8', fontSize:'0.75rem', marginTop:'1rem' }}>
        Last updated: {updated || '—'}
      </p>

    </main>
  );
}
