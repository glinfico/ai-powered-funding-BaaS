import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com';

export default function WorkspaceDashboard() {
  const [status, setStatus] = useState('loading');
  const [apps, setApps] = useState([]);

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(() => {
        setStatus('live');
        return fetch(`${API}/api/mca/applications`);
      })
      .then(r => r.json())
      .then(d => setApps(d.applications || []))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div style={{padding:'2rem', fontFamily:'sans-serif'}}>
      <h1 style={{fontSize:'1.8rem', fontWeight:'bold', marginBottom:'0.5rem', color:'#0f172a'}}>
        GLINFICO Dashboard
      </h1>
      <p style={{color:'#64748b', marginBottom:'2rem'}}>Admin Operations Center</p>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem'}}>
        <div style={{background:'#fefce8', border:'1px solid #fde047', borderRadius:'12px', padding:'1.5rem'}}>
          <p style={{color:'#713f12', fontSize:'0.75rem', fontWeight:'600', textTransform:'uppercase'}}>API Status</p>
          <p style={{color:'#713f12', fontSize:'1.5rem', fontWeight:'bold'}}>{status}</p>
        </div>
        <div style={{background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'12px', padding:'1.5rem'}}>
          <p style={{color:'#14532d', fontSize:'0.75rem', fontWeight:'600', textTransform:'uppercase'}}>Applications</p>
          <p style={{color:'#14532d', fontSize:'1.5rem', fontWeight:'bold'}}>{apps.length}</p>
        </div>
        <div style={{background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:'12px', padding:'1.5rem'}}>
          <p style={{color:'#1e3a8a', fontSize:'0.75rem', fontWeight:'600', textTransform:'uppercase'}}>Platform</p>
          <p style={{color:'#1e3a8a', fontSize:'1.5rem', fontWeight:'bold'}}>GLINFICO</p>
        </div>
      </div>

      <div style={{background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1.5rem'}}>
        <h2 style={{fontSize:'1rem', fontWeight:'600', marginBottom:'1rem', color:'#334155'}}>
          Recent Applications
        </h2>
        {apps.length === 0 && <p style={{color:'#94a3b8'}}>No applications yet — submit your first MCA deal!</p>}
        {apps.slice(0,5).map(app => (
          <div key={app.id} style={{display:'flex', justifyContent:'space-between', padding:'0.75rem 0', borderBottom:'1px solid #e2e8f0'}}>
            <span style={{color:'#334155', fontWeight:'500'}}>{app.merchant_info?.legalName || app.id}</span>
            <span style={{color:'#f59e0b', fontWeight:'bold'}}>
              {app.mca_tier ? `${app.mca_tier}-Paper` : app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
