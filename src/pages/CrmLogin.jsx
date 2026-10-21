import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '@/api/auth';

export default function CrmLogin() {
  const [email, setEmail] = useState('admin@glinfico.com');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      loginUser(email, 'admin');
      navigate('/crm/dashboard');
    }, 500);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#1e293b', padding: '32px', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: 'white' }}>Glinfico CRM & BaaS</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Sign in to access your MCA underwriting suite</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #475569', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #475569', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '8px', transition: 'background 0.2s' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <a href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Home</a>
          <a href="/portal" style={{ color: '#f59e0b', textDecoration: 'none' }}>Stakeholder Portals →</a>
        </div>
      </div>
    </div>
  );
}
