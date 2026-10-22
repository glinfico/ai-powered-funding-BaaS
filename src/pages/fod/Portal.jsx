import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import Starfield from "@/components/public/Starfield";
import { Loader2, LogIn, ArrowRight } from "lucide-react";

const ROLES = [
  { key: 'borrower', label: 'Borrower', desc: 'Track your deal & application', path: '/portal/borrower', color: 'border-blue-500/40 hover:border-blue-400/60 hover:bg-blue-500/5' },
  { key: 'broker',   label: 'Broker',   desc: 'Leads, deals & lender network', path: '/portal/broker',   color: 'border-amber-500/40 hover:border-amber-400/60 hover:bg-amber-500/5' },
  { key: 'lender',   label: 'Lender',   desc: 'Deals matched to your criteria', path: '/portal/lender',  color: 'border-purple-500/40 hover:border-purple-400/60 hover:bg-purple-500/5' },
  { key: 'investor', label: 'Investor', desc: 'Portfolio & deal assignments',  path: '/portal/investor', color: 'border-emerald-500/40 hover:border-emerald-400/60 hover:bg-emerald-500/5' },
];

export default function FodPortal() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate secure local portal authentication
      setTimeout(() => {
        localStorage.setItem("glinfico_user", JSON.stringify({ email, role: 'portal', source: 'portal' }));
        navigate("/portal", { replace: true });
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to authenticate. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />

      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="relative w-full max-w-md">
          <Starfield />
          <div className="relative z-10 bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 shadow-2xl">

            {/* Logo & Title */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-extrabold text-2xl">G</span>
              </div>
              <h1 className="text-2xl font-extrabold">
                GLINFICO <span className="text-amber-400">PORTAL</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                Sign in to access your portal dashboard.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@glinfico.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                {loading ? "Signing In..." : "Sign In to Your Portal"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-xs uppercase tracking-wider">role previews</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Clickable Role quick-nav */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {ROLES.map(r => (
                <Link key={r.key} to={r.path}
                  className={`bg-white/5 border rounded-xl p-3 text-left transition-all block group ${r.color}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">{r.label}</p>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <p className="text-slate-400 text-xs mt-1 leading-snug">{r.desc}</p>
                </Link>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-white/10 text-center flex items-center justify-between text-xs">
              <Link to="/crm/login" className="text-slate-400 hover:text-white transition-colors">
                ← Admin Control Center
              </Link>
              <Link to="/fod/contact" className="text-amber-400 hover:text-amber-300 transition-colors">
                Contact Support →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
