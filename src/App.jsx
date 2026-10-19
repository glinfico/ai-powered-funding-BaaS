import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

// ── FOD Public Pages ──
import FodHome        from "./pages/fod/Home";
import FodPlatform    from "./pages/fod/Platform";
import FodSolutions   from "./pages/fod/Solutions";
import FodPricing     from "./pages/fod/Pricing";
import FodPortal      from "./pages/fod/Portal";
import FodContact     from "./pages/fod/Contact";
import FodSubmit      from "./pages/fod/Submit";
import FodLegal       from "./pages/fod/Legal";
import CapitalDigest  from "./pages/CapitalDigest";
import ProviderSubmit from "./pages/ProviderSubmit";

// ── Portal Pages ──
import PortalHome          from "./pages/portal/PortalHome";
import RoleRedirect        from "./pages/RoleRedirect";
import BorrowerPortal      from "./pages/portals/BorrowerPortal.jsx";
import BrokerPortal        from "./pages/portals/BrokerPortal.jsx";
import LenderPortalPage    from "./pages/portals/LenderPortalPage.jsx";
import InvestorPortal      from "./pages/portals/InvestorPortal.jsx";
import RolePermissionsPage from "./pages/portals/RolePermissionsPage";
import BrokerSubscription  from "./pages/BrokerSubscription.jsx";

// ── CRM Pages ──
import CrmLayout           from "./components/crm/CrmLayout";
import CrmLogin            from "./pages/crm/Login";
import WorkspaceDashboard  from "./pages/WorkspaceDashboard.jsx";
import DealsPage           from "./pages/Deals.jsx";
import LeadsPage           from "./pages/Leads.jsx";
import LendersPage         from "./pages/Lenders.jsx";
import PipelinePage        from "./pages/Pipeline.jsx";
import TasksPage           from "./pages/Tasks.jsx";
import CommissionDashboard from "./pages/CommissionDashboard.jsx";
import ReportsPage         from "./pages/Reports.jsx";
import AICommunicationHub  from "./pages/AICommunicationHub.jsx";
import TermSheetsPage      from "./pages/TermSheets.jsx";

const ProtectedRoute = ({ children }) => {
  const saved = localStorage.getItem('glinfico_user');
  if (!saved) return <Navigate to="/crm/login" replace />;
  return children;
};

const Crm = ({ children }) => <CrmLayout>{children}</CrmLayout>;

export default function App() {
  return (
    <Router>
      <Routes>
        {/* FOD Public */}
        <Route path="/"               element={<FodHome />} />
        <Route path="/fod"            element={<FodHome />} />
        <Route path="/fod/platform"   element={<FodPlatform />} />
        <Route path="/fod/solutions"  element={<FodSolutions />} />
        <Route path="/fod/pricing"    element={<FodPricing />} />
        <Route path="/fod/portal"     element={<FodPortal />} />
        <Route path="/fod/contact"    element={<FodContact />} />
        <Route path="/fod/submit"     element={<FodSubmit />} />
        <Route path="/fod/legal"      element={<FodLegal />} />
        <Route path="/capital-digest" element={<CapitalDigest />} />
        <Route path="/submit-leads"   element={<ProviderSubmit />} />

        {/* Portal */}
        <Route path="/portal"                  element={<PortalHome />} />
        <Route path="/portal/redirect"         element={<RoleRedirect />} />
        <Route path="/portal/borrower"         element={<BorrowerPortal />} />
        <Route path="/portal/broker"           element={<BrokerPortal />} />
        <Route path="/portal/lender"           element={<LenderPortalPage />} />
        <Route path="/portal/investor"         element={<InvestorPortal />} />
        <Route path="/portal/role-permissions" element={<RolePermissionsPage />} />
        <Route path="/broker/subscribe"        element={<BrokerSubscription />} />

        {/* CRM Login */}
        <Route path="/crm/login" element={<CrmLogin />} />

        {/* CRM Protected — 10 Pages */}
        <Route path="/crm/dashboard"   element={<ProtectedRoute><Crm><WorkspaceDashboard /></Crm></ProtectedRoute>} />
        <Route path="/crm/deals"       element={<ProtectedRoute><Crm><DealsPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/leads"       element={<ProtectedRoute><Crm><LeadsPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/lenders"     element={<ProtectedRoute><Crm><LendersPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/term-sheets" element={<ProtectedRoute><Crm><TermSheetsPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/pipeline"    element={<ProtectedRoute><Crm><PipelinePage /></Crm></ProtectedRoute>} />
        <Route path="/crm/tasks"       element={<ProtectedRoute><Crm><TasksPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/commissions" element={<ProtectedRoute><Crm><CommissionDashboard /></Crm></ProtectedRoute>} />
        <Route path="/crm/reports"     element={<ProtectedRoute><Crm><ReportsPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/ai-comms"    element={<ProtectedRoute><Crm><AICommunicationHub /></Crm></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<FodHome />} />
      </Routes>
      <Toaster />
    </Router>
  );
}
