import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Briefcase, Users, Building2, TrendingUp, ArrowRight, Shield, Zap, Loader2, AlertCircle } from "lucide-react";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";

const ROLES = [
  {
    role: "borrower",
    label: "Borrower",
    description: "Track your funding application and deal stages.",
    icon: Users,
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    iconColor: "text-emerald-400",
    href: "/portal/borrower",
  },
  {
    role: "broker",
    label: "Broker",
    description: "Manage leads, deals, commissions & lender network.",
    icon: Briefcase,
    border: "border-amber-500/30 hover:border-amber-400/60",
    iconColor: "text-amber-400",
    href: "/portal/broker",
  },
  {
    role: "lender",
    label: "Lender",
    description: "Review matched deal submissions and funded history.",
    icon: Building2,
    border: "border-purple-500/30 hover:border-purple-400/60",
    iconColor: "text-purple-400",
    href: "/portal/lender",
  },
  {
    role: "investor",
    label: "Investor",
    description: "Explore investment opportunities and portfolio performance.",
    icon: TrendingUp,
    border: "border-rose-500/30 hover:border-rose-400/60",
    iconColor: "text-rose-400",
    href: "/portal/investor",
  },
];

const ROLE_REDIRECT = {
  admin: "/crm/dashboard",
  broker: "/portal/broker",
  borrower: "/portal/borrower",
  lender: "/portal/lender",
  investor: "/portal/investor",
};

function SignInForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      await base44.auth.login(email, password);
      const user = await base44.auth.me();
      onSuccess(ROLE_REDIRECT[user?.role] || "/crm/dashboard");
    } catch (err) {
      setError(err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-red-400 text-xs">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email address"
        autoComplete="email"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <p className="text-center text-slate-500 text-xs">
        Need access?{" "}
        <button type="button" onClick={() => base44.auth.redirectToLogin()} className="text-amber-400 hover:text-amber-300">
          Contact your administrator →
        </button>
      </p>
    </form>
  );
}

export default function PortalHome() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setChecking(false);
        if (u) navigate(ROLE_REDIRECT[u.role] || "/crm/dashboard", { replace: true });
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <Starfield />
      <FodNav />

      <main className="relative z-10 pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 mb-5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-amber-300 text-xs font-semibold tracking-wide uppercase">Portal Access</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              Welcome to <span className="text-amber-400">GLINFICO</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Select your role to access your portal, or sign in below.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Role Cards — left 3 cols */}
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
              {ROLES.map(({ role, label, description, icon: Icon, border, iconColor, href }) => (
                <Link
                  key={role}
                  to={href}
                  className={`group bg-[#0f0f1e] border ${border} rounded-2xl p-5 hover:bg-white/5 transition-all duration-200`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm mb-1">{label}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Sign In Panel — right 2 cols */}
            <div className="lg:col-span-2">
              <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3">
                    <span className="text-black font-extrabold text-xl">G</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">Sign In</h2>
                  <p className="text-slate-400 text-xs mt-1">Access your GLINFICO portal</p>
                </div>

                <SignInForm onSuccess={(path) => navigate(path)} />

                <div className="mt-5 pt-4 border-t border-white/10 text-center">
                  <Link
                    to="/fod/portal"
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-amber-400 text-xs transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin Console
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <FodFooter />
    </div>
  );
}