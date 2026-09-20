import { useNavigate } from "react-router-dom";

export default function CrmLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('glinfico_user');
    navigate('/crm/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '220px', background: '#0f172a', color: 'white', padding: '1.5rem', flexShrink: 0 }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: '40px', height: '40px', background: '#f59e0b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>G</div>
          <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>GLINFICO</p>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Admin Portal</p>
        </div>

        {[
          { label: 'Dashboard', path: '/crm/dashboard' },
          { label: 'Leads', path: '/crm/leads' },
          { label: 'Deals', path: '/crm/deals' },
          { label: 'Commissions', path: '/crm/commissions' },
          { label: 'Reports', path: '/crm/reports' },
        ].map(item => (
          <a key={item.path} href={item.path}
            style={{ display: 'block', padding: '0.6rem 0.75rem', marginBottom: '0.25rem', borderRadius: '8px', color: '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem' }}
            onMouseOver={e => e.target.style.background = '#1e293b'}
            onMouseOut={e => e.target.style.background = 'transparent'}>
            {item.label}
          </a>
        ))}

        <button onClick={handleLogout}
          style={{ marginTop: '2rem', width: '100%', padding: '0.6rem', background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
          Sign Out
        </button>
      </aside>

      <main style={{ flex: 1, background: '#f8fafc', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
