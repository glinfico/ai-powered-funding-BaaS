import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Briefcase, Users, Building2, TrendingUp, ArrowRight, Shield, Zap } from "lucide-react";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";

const ROLES = [
  {
    role: "borrower",
    label: "Borrower",
    description: "Track your funding application, view deal stages, and communicate with your broker.",
    icon: Users,
    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    iconColor: "text-emerald-400",
    href: "/portal/borrower",
  },
  {
    role: "broker",
    label: "Broker",
    description: "Manage your leads, pipeline deals, commissions, and access the lender network.",
    icon: Briefcase,
    color: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    iconColor: "text-blue-400",
    href: "/portal/broker",
  },
  {
    role: "lender",
    label: "Lender",
    description: "Review matched deal submissions and track your funded deal history.",
    icon: Building2,
    color: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    iconColor: "text-purple-400",
    href: "/portal/lender",
  },
  {
    role: "investor",
    label: "Investor",
    description: "Explore investment opportunities, track portfolio performance, and access deal summaries.",
    icon: TrendingUp,
    color: "from-rose-500/20 to-rose-500/5 border-rose-500/30",
    iconColor: "text-rose-400",
    href: "/portal/investor",
  },
];

export default function PortalHome() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setChecking(false);
        // Auto-redirect if already logged in
        if (u) {
          const map = {
            admin: "/crm/dashboard",
            broker: "/portal/broker",
            borrower: "/portal/borrower",
            lender: "/portal/lender",
            investor: "/portal/investor",
          };
          const dest = map[u.role] || "/crm/dashboard";
          navigate(dest, { replace: true });
        }
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
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 mb-6">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-amber-300 text-xs font-semibold tracking-wide uppercase">Portal Access</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Welcome to <span className="text-amber-400">GLINFICO</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Select your portal below or sign in to access your dashboard.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {ROLES.map(({ role, label, description, icon: Icon, color, iconColor, href }) => (
              <Link
                key={role}
                to={href}
                className={`group relative rounded-2xl border bg-gradient-to-br ${color} p-6 hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg mb-1">{label}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          {/* Admin access */}
          <div className="text-center">
            <Link
              to="/fod/portal"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-400 text-sm transition-colors"
            >
              <Shield className="h-4 w-4" />
              Admin / Staff Sign In
            </Link>
          </div>

        </div>
      </main>

      <FodFooter />
    </div>
  );
}