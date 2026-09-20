import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com';

export default function WorkspaceDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        GLINFICO Dashboard
      </h1>
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '1rem' }}>
        <p style={{ color: '#166534', fontWeight: 'bold' }}>✅ Admin Panel Active</p>
        {data && <p style={{ color: '#166534' }}>API Status: {data.status} — {data.platform}</p>}
        {error && <p style={{ color: 'red' }}>API Error: {error}</p>}
      </div>
      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {['Leads', 'Deals', 'Commissions'].map(item => (
          <div key={item} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{item}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0</p>
          </div>
        ))}
      </div>
    </div>
  );
}
