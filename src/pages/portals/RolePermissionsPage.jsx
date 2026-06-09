import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Users, Building2, Briefcase, TrendingUp, LayoutDashboard, CheckCircle2, XCircle } from "lucide-react";

const ROLES = [
  {
    role: "admin",
    label: "Admin",
    icon: LayoutDashboard,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    portal: "/Dashboard",
    permissions: [
      { label: "Full CRM access (Leads, Deals, Pipeline)", allowed: true },
      { label: "Manage Lenders & Team Members", allowed: true },
      { label: "View Reports & Analytics", allowed: true },
      { label: "Configure Automation Rules & Alerts", allowed: true },
      { label: "Manage all portals & user roles", allowed: true },
      { label: "Site Blueprint & DNS Settings", allowed: true },
    ],
  },
  {
    role: "broker",
    label: "Broker",
    icon: Briefcase,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    portal: "/portal/broker",
    permissions: [
      { label: "View assigned leads", allowed: true },
      { label: "View own deal pipeline", allowed: true },
      { label: "Browse active lender network", allowed: true },
      { label: "View commission estimates", allowed: true },
      { label: "Access CRM admin panel", allowed: false },
      { label: "Edit lender or team records", allowed: false },
    ],
  },
  {
    role: "borrower",
    label: "Borrower",
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    portal: "/portal/borrower",
    permissions: [
      { label: "View own deal status & workflow", allowed: true },
      { label: "Track deal stages in real time", allowed: true },
      { label: "View matched lender name", allowed: true },
      { label: "Submit funding application", allowed: true },
      { label: "View other borrowers' deals", allowed: false },
      { label: "Access broker or admin panel", allowed: false },
    ],
  },
  {
    role: "lender",
    label: "Lender",
    icon: Building2,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    portal: "/portal/lender",
    permissions: [
      { label: "View matched deal submissions", allowed: true },
      { label: "Track funded deal history", allowed: true },
      { label: "View own lender profile stats", allowed: true },
      { label: "Access borrower full financial records", allowed: false },
      { label: "Modify CRM pipeline stages", allowed: false },
      { label: "View other lender criteria", allowed: false },
    ],
  },
  {
    role: "investor",
    label: "Investor",
    icon: TrendingUp,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    portal: "/portal/investor",
    permissions: [
      { label: "View available investment opportunities", allowed: true },
      { label: "Track portfolio performance", allowed: true },
      { label: "Access deal summaries", allowed: true },
      { label: "Access borrower personal data", allowed: false },
      { label: "Modify deal stages or terms", allowed: false },
      { label: "Access CRM or admin tools", allowed: false },
    ],
  },
];

export default function RolePermissionsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { setLoading(false); base44.auth.redirectToLogin('/portal'); });
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a12] text-white gap-4">
        <Shield className="h-12 w-12 text-rose-400" />
        <p className="text-xl font-bold">Access Restricted</p>
        <p className="text-slate-400 text-sm">Admin access required to view role permissions.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Role Permissions</h1>
            <p className="text-slate-500 text-sm">Access levels for each portal role in GLINFICO LP</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.role} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className={`border-b ${r.bg} px-5 py-4 flex items-center gap-3`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.bg}`}>
                    <Icon className={`h-4 w-4 ${r.color}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${r.color}`}>{r.label}</p>
                    <p className="text-slate-500 text-xs">Portal: <span className="font-mono">{r.portal}</span></p>
                  </div>
                </div>
                <ul className="px-5 py-4 space-y-2.5">
                  {r.permissions.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      {p.allowed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${p.allowed ? "text-slate-700" : "text-slate-400"}`}>{p.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-amber-800 font-semibold text-sm mb-1">How Roles Are Assigned</p>
          <p className="text-amber-700 text-sm">
            Roles are assigned per user in the <strong>User</strong> entity. The <code className="bg-amber-100 px-1 rounded">role</code> field
            controls which portal a user is routed to upon login via <code className="bg-amber-100 px-1 rounded">/portal</code>.
            Valid values: <code className="bg-amber-100 px-1 rounded">admin</code>, <code className="bg-amber-100 px-1 rounded">broker</code>,{" "}
            <code className="bg-amber-100 px-1 rounded">borrower</code>, <code className="bg-amber-100 px-1 rounded">lender</code>,{" "}
            <code className="bg-amber-100 px-1 rounded">investor</code>.
          </p>
        </div>
      </div>
    </div>
  );
}