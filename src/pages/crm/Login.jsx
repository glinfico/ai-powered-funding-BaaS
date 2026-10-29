import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

export default function CrmLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!login) {
        throw new Error('Supabase Auth Context is not initialized.');
      }
      const res = await login(email, password);
      if (res && res.success) {
        navigate('/crm/dashboard');
      } else {
        setError(res?.error || 'Invalid Supabase credentials. Please verify your Admin/Contact account.');
      }
    } catch (err) {
      setError(err.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.1em' }}>GLINFICO SUPABASE SECURE AUTH</span>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '8px 0 4px 0' }}>Control Center Access</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Verified Admin & Contact Portal</p>
        </div>

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@glinfico.com or contact@glinfico.com"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure password..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#d97706',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
            }}
          >
            {loading ? 'Authenticating with Supabase...' : 'Sign In to Dashboard →'}
          </button>
        </form>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <button onClick={() => navigate('/portal')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '700', cursor: 'pointer' }}>
            Portal Hub Access →
          </button>
          <button onClick={() => navigate('/pricing')} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>
            Pricing & Subscriptions
          </button>
        </div>

      </div>
    </div>
  );
}
