import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth, supabase } from '../../lib/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials');
        setIsSubmitting(false);
        return;
      }

      // Check profiles table in Supabase for custom role
      let role = 'contact';
      if (supabase) {
        const { data: session } = await supabase.auth.getSession();
        const user = session?.session?.user;
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          role = profile?.role || user.user_metadata?.role || (user.email === 'admin@glinfico.com' ? 'admin' : 'contact');
        } else if (email === 'admin@glinfico.com' || email.includes('admin')) {
          role = 'admin';
        }
      } else if (email === 'admin@glinfico.com' || email.includes('admin')) {
        role = 'admin';
      }

      // Route based on role
      if (role === 'admin' || role === 'operator') {
        navigate('/crm/dashboard');
      } else if (role === 'broker') {
        navigate('/portal/broker');
      } else if (role === 'lender') {
        navigate('/portal/lender');
      } else if (role === 'investor') {
        navigate('/portal/investor');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-md bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Lock className="h-3.5 w-3.5" /> Glinfico Supabase Secure Auth
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Control Center Access</h1>
          <p className="text-slate-400 text-xs">Verified Admin & Contact Portal</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@glinfico.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="h-4 w-4 fill-current" /> {isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard →'}
          </button>
        </form>

        {/* Portal Hub Access & Pricing Links */}
        <div className="space-y-3 pt-4 border-t border-white/10 text-center">
          <Link
            to="/portal"
            className="block w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 font-bold text-xs transition-all border border-amber-500/20 flex items-center justify-center gap-2"
          >
            Portal Hub Access <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/checkout"
            className="block text-xs text-slate-400 hover:text-white transition-all font-semibold"
          >
            Pricing & Subscriptions
          </Link>
        </div>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs mt-6">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Supabase RLS Encrypted</span>
        </div>

      </div>
    </div>
  );
}
