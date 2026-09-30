import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import Starfield from "@/components/public/Starfield";
import { Loader2, LogIn, ArrowRight } from "lucide-react";

const ROLES = [
  { key: 'borrower', label: 'Borrower', desc: 'Track your deal & application', path: '/portal/borrower', color: 'border-blue-500/40 hover:border-blue-400/60 hover:bg-blue-500/5' },
  { key: 'broker',   label: 'Broker',   desc: 'Leads, deals & lender network', path: '/portal/broker',   color: 'border-amber-500/40 hover:border-amber-400/60 hover:bg-amber-500/5' },
  { key: 'lender',   label: 'Lender',   desc: 'Deals matched to your criteria', path: '/portal/lender',  color: 'border-purple-500/40 hover:border-purple-400/60 hover:bg-purple-500/5' },
  { key: 'investor', label: 'Investor', desc: 'Portfolio & deal assignments',   path: '/portal/investor', color: 'border-emerald-500/40 hover:border-emerald-400/60 hover:bg-emerald-500/5' },
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("glinfico_token", data.token);
        // Redirect to dashboard or role portal
        navigate("/crm/dashboard", { replace: true });
      } else {
        setError(data.error || "Sign-in failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login network error:", err);
      setError("Unable to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />

      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
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
                Sign in to access your dashboard.
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
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                {loading ? "Signing In..." : "Sign In to Your Portal"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-xs">role previews</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Role quick-nav */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {ROLES.map(r => (
                <div key={r.key}
                  className={`bg-white/5 border rounded-xl p-3 text-left transition-all ${r.color}`}>
                  <p className="text-white font-semibold text-sm">{r.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{r.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-white/10 text-center">
              <p className="text-slate-500 text-xs">
                Need assistance?{" "}
                <Link to="/fod/contact" className="text-amber-400 hover:text-amber-300">
                  Contact Support →
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
