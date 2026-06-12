import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import Starfield from "@/components/public/Starfield";
import { base44 } from "@/api/base44Client";
import { Loader2, LogIn, ArrowRight } from "lucide-react";

const ROLES = [
  { key: 'borrower', label: 'Borrower', desc: 'Track your deal & application', path: '/portal/borrower', color: 'border-blue-500/40 hover:border-blue-400/60 hover:bg-blue-500/5' },
  { key: 'broker',   label: 'Broker',   desc: 'Leads, deals & lender network', path: '/portal/broker',   color: 'border-amber-500/40 hover:border-amber-400/60 hover:bg-amber-500/5' },
  { key: 'lender',   label: 'Lender',   desc: 'Deals matched to your criteria', path: '/portal/lender',  color: 'border-purple-500/40 hover:border-purple-400/60 hover:bg-purple-500/5' },
  { key: 'investor', label: 'Investor', desc: 'Portfolio & deal assignments',   path: '/portal/investor', color: 'border-emerald-500/40 hover:border-emerald-400/60 hover:bg-emerald-500/5' },
];

export default function FodPortal() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setCheckingAuth(false);
        // If already logged in, redirect immediately to role portal
        if (u) {
          const dest = {
            admin: '/crm/dashboard',
            broker: '/portal/broker',
            borrower: '/portal/borrower',
            lender: '/portal/lender',
            investor: '/portal/investor',
          }[u.role] || '/crm/dashboard';
          navigate(dest, { replace: true });
        }
      })
      .catch(() => setCheckingAuth(false));
  }, [navigate]);

  const handleSignIn = () => {
    // Redirect to Base44 platform login, then come back to role redirect
    base44.auth.redirectToLogin('/portal/redirect');
  };

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />

      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
        <div className="relative w-full max-w-md">
          <Starfield />
          <div className="relative z-10 bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 shadow-2xl">

            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-extrabold text-2xl">G</span>
              </div>
              <h1 className="text-2xl font-extrabold">
                GLINFICO <span className="text-amber-400">PORTAL</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                Sign in to access your role-based dashboard.
              </p>
            </div>

            {/* Role quick-nav (shows where each role lands) */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {ROLES.map(r => (
                <div key={r.key}
                  className={`bg-white/5 border rounded-xl p-3 text-left transition-all ${r.color}`}>
                  <p className="text-white font-semibold text-sm">{r.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{r.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-xs">secure sign-in</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Single Sign In CTA */}
            <button
              onClick={handleSignIn}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all flex items-center justify-center gap-2 text-base"
            >
              <LogIn className="h-5 w-5" />
              Sign In to Your Portal
            </button>

            <p className="text-center text-slate-500 text-xs mt-4">
              After signing in, you'll be automatically directed to your role dashboard.
            </p>

            <div className="flex items-center gap-3 mt-5 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-xs">admin access</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={() => base44.auth.redirectToLogin('/crm/dashboard')}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 font-medium transition-all flex items-center justify-center gap-2 text-sm"
            >
              Admin Console Access
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-5 pt-5 border-t border-white/10 text-center">
              <p className="text-slate-500 text-xs">
                Don't have access?{" "}
                <Link to="/fod/contact" className="text-amber-400 hover:text-amber-300">
                  Request access →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}