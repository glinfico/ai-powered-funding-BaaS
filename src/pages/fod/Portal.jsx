import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import Starfield from "@/components/public/Starfield";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle } from "lucide-react";

const ROLES = [
  { key: 'borrower', label: 'Borrower', desc: 'Track your deal & application', path: '/portal/borrower', color: 'border-blue-500/40 hover:border-blue-400/60' },
  { key: 'broker', label: 'Broker', desc: 'Leads, deals & lender network', path: '/portal/broker', color: 'border-amber-500/40 hover:border-amber-400/60' },
  { key: 'lender', label: 'Lender', desc: 'Deals matched to your institution', path: '/portal/lender', color: 'border-purple-500/40 hover:border-purple-400/60' },
  { key: 'investor', label: 'Investor', desc: 'Portfolio & deal assignments', path: '/portal/investor', color: 'border-emerald-500/40 hover:border-emerald-400/60' },
];

function getRoleRedirectPath(role) {
  switch (role) {
    case 'admin': return '/crm/dashboard';
    case 'broker': return '/portal/broker';
    case 'borrower': return '/portal/borrower';
    case 'lender': return '/portal/lender';
    case 'investor': return '/portal/investor';
    default: return '/crm/dashboard';
  }
}

function LoginForm({ redirectPath, buttonLabel }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.login(email, password);
      const user = await base44.auth.me();
      const dest = redirectPath || getRoleRedirectPath(user?.role);
      navigate(dest);
    } catch (err) {
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <div>
        <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
          placeholder="you@company.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Signing in..." : buttonLabel || "Sign In"}
      </button>
    </form>
  );
}

export default function FodPortal() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />

      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
        <div className="relative w-full max-w-md">
          <Starfield />
          <div className="relative z-10 bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-extrabold text-2xl">G</span>
              </div>
              <h1 className="text-2xl font-extrabold">
                GLINFICO <span className="text-amber-400">ACCESS ENGINE</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2">Sign in to your role portal or access the admin console.</p>
            </div>

            {/* Role quick-nav */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {ROLES.map(r => (
                <Link key={r.key} to={r.path}
                  className={`bg-white/5 border rounded-xl p-3 text-left hover:bg-white/10 transition-all ${r.color}`}>
                  <p className="text-white font-semibold text-sm">{r.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{r.desc}</p>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-xs">sign in below</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <Tabs defaultValue="portal">
              <TabsList className="grid grid-cols-2 w-full mb-6 bg-white/5 border border-white/10">
                <TabsTrigger value="portal" className="text-white data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  Portal Login
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-white data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  Admin Login
                </TabsTrigger>
              </TabsList>

              <TabsContent value="portal">
                <LoginForm buttonLabel="Sign In to Portal" />
                <p className="text-center text-slate-500 text-xs mt-4">
                  Need access?{" "}
                  <button type="button" onClick={() => base44.auth.redirectToLogin()} className="text-amber-400 hover:text-amber-300">
                    Contact your administrator →
                  </button>
                </p>
              </TabsContent>

              <TabsContent value="admin">
                <LoginForm redirectPath="/crm/dashboard" buttonLabel="Access Admin Console" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}