import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import Starfield from "@/components/public/Starfield";
import { Loader2, LogIn, ArrowRight } from "lucide-react";

const ROLES = [
  { key: 'admin',   label: 'Command Center', desc: 'Full CCD deal pipeline & settings', path: '/crm', color: 'border-amber-500/40 hover:border-amber-400/60 hover:bg-amber-500/5' },
  { key: 'borrower', label: 'Borrower', desc: 'Track your deal & application', path: '/portal/borrower', color: 'border-blue-500/40 hover:border-blue-400/60 hover:bg-blue-500/5' },
  { key: 'broker',   label: 'Broker',   desc: 'Leads, deals & lender network', path: '/crm/brokers', color: 'border-amber-500/40 hover:border-amber-400/60 hover:bg-amber-500/5' },
  { key: 'lender',   label: 'Lender',   desc: 'Deals matched to your criteria', path: '/crm/lenders', color: 'border-purple-500/40 hover:border-purple-400/60 hover:bg-purple-500/5' },
  { key: 'investor', label: 'Investor', desc: 'Portfolio & deal assignments', path: '/portal/investor', color: 'border-emerald-500/40 hover:border-emerald-400/60 hover:bg-emerald-500/5' },
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
      setTimeout(() => {
        localStorage.setItem("glinfico_user", JSON.stringify({ email, role: 'admin', authenticated: true }));
        // Direct redirect to Command Center Dashboard
        navigate("/crm", { replace: true });
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
                Sign in to access your Command Center Dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@glinfico.com"
                  className="w-full px-4 py-3 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In to Command Center
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs uppercase tracking-wider text-slate-500 text-center mb-4">
                Or Select Role Portal
              </p>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map((role) => (
                  <Link
                    key={role.key}
                    to={role.path}
                    className={`p-3 rounded-xl border ${role.color} transition-all flex items-center justify-between group`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{role.label}</div>
                      <div className="text-xs text-slate-400">{role.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
