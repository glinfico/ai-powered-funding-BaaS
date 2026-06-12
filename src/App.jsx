import { Toaster } from "@/components/ui/toaster";

// ── FOD Public Pages ──
import FodHome from "./pages/fod/Home";
import FodPlatform from "./pages/fod/Platform";
import FodSolutions from "./pages/fod/Solutions";
import FodPricing from "./pages/fod/Pricing";
import FodPortal from "./pages/fod/Portal";
import FodContact from "./pages/fod/Contact";
import FodSubmit from "./pages/fod/Submit";
import FodLegal from "./pages/fod/Legal";
import CapitalDigest from "./pages/CapitalDigest";
import ProviderSubmit from "./pages/ProviderSubmit";

// ── Portal Hub & Role Portals ──
import PortalHome from "./pages/portal/PortalHome";
import RoleRedirect from "./pages/RoleRedirect";
import BorrowerPortal from "./pages/portals/BorrowerPortal.jsx";
import BrokerPortal from "./pages/portals/BrokerPortal.jsx";
import LenderPortalPage from "./pages/portals/LenderPortalPage.jsx";
import InvestorPortal from "./pages/portals/InvestorPortal.jsx";
import RolePermissionsPage from "./pages/portals/RolePermissionsPage";
import BrokerSubscription from "./pages/BrokerSubscription.jsx";

// ── CRM Internal Pages ──
import CrmLayout from "./components/crm/CrmLayout";
import WorkspaceDashboard from "./pages/WorkspaceDashboard.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LeadsPage from "./pages/Leads.jsx";
import PipelinePage from "./pages/Pipeline.jsx";
import DealsPage from "./pages/Deals.jsx";
import TasksPage from "./pages/Tasks.jsx";
import LendersPage from "./pages/Lenders.jsx";
import TeamPage from "./pages/Team.jsx";
import ReportsPage from "./pages/Reports.jsx";
import CommissionDashboard from "./pages/CommissionDashboard.jsx";

// ── App Infrastructure ──
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

const Crm = ({ children }) => <CrmLayout>{children}</CrmLayout>;

// Public paths that never need auth
const isPublicPath = (pathname) =>
  pathname === "/" ||
  pathname.startsWith("/fod") ||
  pathname === "/portal" ||
  pathname.startsWith("/portal/") ||
  pathname.startsWith("/broker/") ||
  pathname === "/submit-leads";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const publicPath = isPublicPath(location.pathname);

  if ((isLoadingPublicSettings || isLoadingAuth) && !publicPath) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Public paths render immediately — no loading gate
  if (publicPath) {
    return (
      <Routes>
        <Route path="/" element={<FodHome />} />
        <Route path="/fod" element={<FodHome />} />
        <Route path="/fod/platform" element={<FodPlatform />} />
        <Route path="/fod/solutions" element={<FodSolutions />} />
        <Route path="/fod/pricing" element={<FodPricing />} />
        <Route path="/fod/portal" element={<FodPortal />} />
        <Route path="/fod/contact" element={<FodContact />} />
        <Route path="/fod/submit" element={<FodSubmit />} />
        <Route path="/fod/legal" element={<FodLegal />} />
        <Route path="/portal" element={<PortalHome />} />
        <Route path="/portal/redirect" element={<RoleRedirect />} />
        <Route path="/portal/borrower" element={<BorrowerPortal />} />
        <Route path="/portal/broker" element={<BrokerPortal />} />
        <Route path="/portal/lender" element={<LenderPortalPage />} />
        <Route path="/portal/investor" element={<InvestorPortal />} />
        <Route path="/portal/role-permissions" element={<RolePermissionsPage />} />
        <Route path="/broker/subscribe" element={<BrokerSubscription />} />
        <Route path="/capital-digest" element={<CapitalDigest />} />
        <Route path="/submit-leads" element={<ProviderSubmit />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  if (authError && !publicPath) {
    if (authError.type === "user_not_registered") return <UserNotRegisteredError />;
    if (authError.type === "auth_required") { navigateToLogin(); return null; }
  }


  return (
    <Routes>
      {/* ── FOD Public Site ── */}
      <Route path="/" element={<FodHome />} />
      <Route path="/fod" element={<FodHome />} />
      <Route path="/fod/platform" element={<FodPlatform />} />
      <Route path="/fod/solutions" element={<FodSolutions />} />
      <Route path="/fod/pricing" element={<FodPricing />} />
      <Route path="/fod/portal" element={<FodPortal />} />
      <Route path="/fod/contact" element={<FodContact />} />
      <Route path="/fod/submit" element={<FodSubmit />} />
      <Route path="/fod/legal" element={<FodLegal />} />

      {/* ── Portal Hub & Role Portals ── */}
      <Route path="/portal" element={<PortalHome />} />
      <Route path="/portal/redirect" element={<RoleRedirect />} />
      <Route path="/portal/borrower" element={<BorrowerPortal />} />
      <Route path="/portal/broker" element={<BrokerPortal />} />
      <Route path="/portal/lender" element={<LenderPortalPage />} />
      <Route path="/portal/investor" element={<InvestorPortal />} />
      <Route path="/portal/role-permissions" element={<RolePermissionsPage />} />
      <Route path="/broker/subscribe" element={<BrokerSubscription />} />
      <Route path="/capital-digest" element={<CapitalDigest />} />
      <Route path="/submit-leads" element={<ProviderSubmit />} />

      {/* ── CRM Internal (admin/staff only) ── */}
      <Route path="/crm/dashboard" element={<Crm><WorkspaceDashboard /></Crm>} />
      <Route path="/crm/overview"  element={<Crm><Dashboard /></Crm>} />
      <Route path="/crm/leads"     element={<Crm><LeadsPage /></Crm>} />
      <Route path="/crm/pipeline"  element={<Crm><PipelinePage /></Crm>} />
      <Route path="/crm/deals"     element={<Crm><DealsPage /></Crm>} />
      <Route path="/crm/tasks"     element={<Crm><TasksPage /></Crm>} />
      <Route path="/crm/lenders"   element={<Crm><LendersPage /></Crm>} />
      <Route path="/crm/team"      element={<Crm><TeamPage /></Crm>} />
      <Route path="/crm/reports"   element={<Crm><ReportsPage /></Crm>} />
      <Route path="/crm/commissions" element={<Crm><CommissionDashboard /></Crm>} />

      {/* ── Legacy CRM alias paths ── */}
      <Route path="/Dashboard"          element={<Crm><WorkspaceDashboard /></Crm>} />
      <Route path="/Leads"              element={<Crm><LeadsPage /></Crm>} />
      <Route path="/Pipeline"           element={<Crm><PipelinePage /></Crm>} />
      <Route path="/Deals"              element={<Crm><DealsPage /></Crm>} />
      <Route path="/Tasks"              element={<Crm><TasksPage /></Crm>} />
      <Route path="/Lenders"            element={<Crm><LendersPage /></Crm>} />
      <Route path="/Team"               element={<Crm><TeamPage /></Crm>} />
      <Route path="/ReportsNew"         element={<Crm><ReportsPage /></Crm>} />
      <Route path="/CommissionDashboard" element={<Crm><CommissionDashboard /></Crm>} />
      <Route path="/WorkspaceDashboard" element={<Crm><WorkspaceDashboard /></Crm>} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;