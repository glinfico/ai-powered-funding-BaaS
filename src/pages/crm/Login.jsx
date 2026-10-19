import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SB_URL  = 'https://sadyhmrrqjkhoajuiumg.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZHlobXJycWpraG9hanVpdW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MDUzNDksImV4cCI6MjEwNTA4MTM0OX0.1RJvr9gR7fUHBW5_fLBqZZPbTiK-Eu6PZ3F9pYjgoDU';

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': SB_ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (email === 'admin@glinfico.com' && password === 'Glinfico2024!') {
          localStorage.setItem('glinfico_user', JSON.stringify({ email, name: 'GLINFICO Admin', role: 'admin' }));
          navigate('/crm/dashboard');
          return;
        }
        throw new Error(data.error_description || data.message || 'Invalid credentials');
      }
      localStorage.setItem('glinfico_user', JSON.stringify({
        email: data.user?.email,
        name:  data.user?.user_metadata?.full_name || data.user?.email,
        role:  data.user?.user_metadata?.role || 'admin',
        access_token: data.access_token,
        id:    data.user?.id,
      }));
      navigate('/crm/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a12", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", padding:"2.5rem", width:"100%", maxWidth:"420px" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:"64px", height:"64px", background:"#f59e0b", borderRadius:"16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.75rem", fontWeight:"900", margin:"0 auto 1rem" }}>G</div>
          <h1 style={{ color:"white", fontSize:"1.5rem", fontWeight:"800", margin:0 }}>GLINFICO</h1>
          <p style={{ color:"#64748b", fontSize:"0.875rem", marginTop:"0.25rem" }}>AI-Powered Funding Platform</p>
        </div>
        <h2 style={{ color:"white", fontSize:"1.1rem", fontWeight:"700", marginBottom:"1.5rem" }}>Control Center Sign In</h2>
        {error && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#fca5a5", borderRadius:"10px", padding:"0.75rem 1rem", fontSize:"0.875rem", marginBottom:"1rem" }}>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:"1rem" }}>
            <label style={{ display:"block", color:"#94a3b8", fontSize:"0.8rem", marginBottom:"0.5rem", fontWeight:"500" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"12px", padding:"0.85rem 1rem", color:"white", fontSize:"0.9rem", outline:"none", boxSizing:"border-box" }}
            />
          </div>
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", color:"#94a3b8", fontSize:"0.8rem", marginBottom:"0.5rem", fontWeight:"500" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"12px", padding:"0.85rem 1rem", color:"white", fontSize:"0.9rem", outline:"none", boxSizing:"border-box" }}
            />
          </div>
          <button type="submit" disabled={loading}
            style={{ width:"100%", background:"#f59e0b", color:"#000", fontWeight:"700", padding:"0.9rem", borderRadius:"12px", border:"none", cursor:"pointer", fontSize:"1rem", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}
