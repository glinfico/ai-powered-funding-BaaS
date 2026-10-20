import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: '📊 Dashboard',    path: '/crm/dashboard' },
  { label: '💼 Deals',        path: '/crm/deals' },
  { label: '👥 Leads',        path: '/crm/leads' },
  { label: '🏦 Lenders',      path: '/crm/lenders' },
  { label: '📄 Term Sheets',  path: '/crm/term-sheets' },
  { label: '🔀 Pipeline',     path: '/crm/pipeline' },
  { label: '✅ Tasks',        path: '/crm/tasks' },
  { label: '💰 Commissions',  path: '/crm/commissions' },
  { label: '📈 Reports',      path: '/crm/reports' },
  { label: '🤖 AI Comms',     path: '/crm/ai-comms' },
];

export default function CrmLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('glinfico_user');
    navigate('/crm/login');
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <aside style={{ width:'220px', background:'#0f172a', color:'white', padding:'1.25rem', flexShrink:0, display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ width:'40px', height:'40px', background:'#f59e0b', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'1.2rem', color:'#000', marginBottom:'0.5rem' }}>G</div>
          <p style={{ fontWeight:'700', fontSize:'0.95rem', margin:0 }}>GLINFICO</p>
          <p style={{ color:'#f59e0b', fontSize:'0.7rem', margin:0 }}>Control Center</p>
        </div>
        <nav style={{ flex:1 }}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <a key={item.path} href={item.path}
                style={{ display:'block', padding:'0.6rem 0.75rem', marginBottom:'2px', borderRadius:'8px', color: active ? '#f59e0b' : '#cbd5e1', textDecoration:'none', fontSize:'0.875rem', fontWeight: active ? '600' : '400', background: active ? '#1e293b' : 'transparent', transition:'all 0.15s' }}
                onMouseOver={e => { if (!active) e.currentTarget.style.background = '#1e293b'; }}
                onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                {item.label}
              </a>
            );
          })}
        </nav>
        <div style={{ borderTop:'1px solid #1e293b', paddingTop:'1rem', marginTop:'1rem' }}>
          <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.75rem' }}>
            {(() => { try { return JSON.parse(localStorage.getItem('glinfico_user')||'{}').email || 'Admin'; } catch { return 'Admin'; } })()}
          </div>
          <button onClick={handleLogout}
            style={{ width:'100%', padding:'0.6rem', background:'#1e293b', color:'#94a3b8', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.875rem', textAlign:'left' }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>
      <main style={{ flex:1, background:'#f8fafc', overflow:'auto', minHeight:'100vh' }}>
        {children}
      </main>
    </div>
  );
}
