import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { LayoutDashboard, Users, GitBranch, CheckSquare, BarChart2, Settings, Menu, X, LogOut, Briefcase, Building2, UserCog, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Leads", page: "Leads", icon: Users },
  { name: "Pipeline", page: "Pipeline", icon: GitBranch },
  { name: "Deals", page: "Deals", icon: Briefcase },
  { name: "Tasks", page: "Tasks", icon: CheckSquare },
  { name: "Lenders", page: "Lenders", icon: Building2 },
  { name: "Team", page: "Team", icon: UserCog },
  { name: "Reports", page: "Reports", icon: BarChart2 },
  { name: "Settings", page: "Settings", icon: Settings },
  { name: "Site Blueprint", page: "SiteBlueprint", icon: Globe },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <span className="text-white font-bold text-base">G</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">GLINFICO LP</h1>
              <p className="text-xs text-amber-600 font-medium">Admin CRM</p>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-slate-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navigation.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-4.5 w-4.5 flex-shrink-0", isActive ? "text-amber-600" : "text-slate-400")} style={{ width: '1.1rem', height: '1.1rem' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:text-slate-700 text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              className="text-slate-600 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-bold text-slate-900 text-sm">GLINFICO LP</span>
            </div>
            <div className="w-6" />
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}