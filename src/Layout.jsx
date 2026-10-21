import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/crm/dashboard', icon: '📊' },
    { name: 'Leads', path: '/crm/leads', icon: '👥' },
    { name: 'Pipeline', path: '/crm/pipeline', icon: '📈' },
    { name: 'Deals', path: '/crm/deals', icon: '💼' },
    { name: 'Tasks', path: '/crm/tasks', icon: '✔️' },
    { name: 'Lenders', path: '/crm/lenders', icon: '🏦' },
    { name: 'M&A Deal Room', path: '/crm/mandadealroom', icon: '🏢' },
    { name: 'REI Analyzer', path: '/crm/rei-analyzer', icon: '⚡' },
    { name: 'REI Form', path: '/crm/rei-form', icon: '🏠' },
    { name: 'Underwriting Approval', path: '/crm/underwritingapproval', icon: '📝' },
    { name: 'Term Sheets', path: '/crm/termsheets', icon: '📑' },
    { name: 'Team', path: '/crm/team', icon: '🧑‍🤝‍🧑' },
    { name: 'Reports', path: '/crm/reports', icon: '📊' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid #1e293b' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>GLINFICO.FOD</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0 0', color: '#ffffff' }}>Control Center</h2>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: active ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: active ? '#fbbf24' : '#94a3b8',
                  fontWeight: active ? '700' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', fontSize: '12px', color: '#64748b' }}>
          BaaS MCA & REI Engine v1.0
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            AI-Powered Funding Control Center
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 12px', borderRadius: '20px' }}>
              ● Live 22K+ Lenders
            </span>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
