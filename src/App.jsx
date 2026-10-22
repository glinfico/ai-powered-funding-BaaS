import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import CommissionDashboard from "./pages/CommissionDashboard";
import Reports from "./pages/Reports";
import REIDealAnalyzerPage from "./pages/REIDealAnalyzerPage";
import REIFormPage from "./pages/REIFormPage";
import ALSLoanServicingPage from "./pages/ALSLoanServicingPage";

// ── FOD Public Pages ──
import FodHome      from "./pages/fod/Home";
import FodPlatform  from "./pages/fod/Platform";
import FodSolutions from "./pages/fod/Solutions";
import FodPricing   from "./pages/fod/Pricing";
import FodPortal    from "./pages/fod/Portal";
import FodContact   from "./pages/fod/Contact";
import FodSubmit    from "./pages/fod/Submit";
import FodLegal     from "./pages/fod/Legal";
import ProviderSubmit from "./pages/ProviderSubmit";
import CapitalDigest  from "./pages/CapitalDigest";

// ── Portal Hub & Role Portals ──
import PortalHome        from "./pages/portal/PortalHome";
import RoleRedirect      from "./pages/RoleRedirect";
import BorrowerPortal    from "./pages/portals/BorrowerPortal.jsx";
import BrokerPortal      from "./pages/portals/BrokerPortal.jsx";
import LenderPortalPage  from "./pages/portals/LenderPortalPage.jsx";
import InvestorPortal    from "./pages/portals/InvestorPortal.jsx";
import RolePermissionsPage from "./pages/portals/RolePermissionsPage";
import BrokerSubscription  from "./pages/BrokerSubscription.jsx";

// ── CRM Pages ──
import CrmLayout          from "./components/crm/CrmLayout";
import CrmLogin           from "./pages/crm/Login";
import WorkspaceDashboard from "./pages/WorkspaceDashboard.jsx";

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

        {/* ── FOD Public Site ── */}
        <Route path="/"             element={<FodHome />} />
        <Route path="/fod"          element={<FodHome />} />
        <Route path="/fod/platform" element={<FodPlatform />} />
        <Route path="/fod/solutions" element={<FodSolutions />} />
        <Route path="/fod/pricing"   element={<FodPricing />} />
        <Route path="/fod/portal"    element={<ProtectedRoute><FodPortal /></ProtectedRoute>} />
        <Route path="/fod/contact"   element={<FodContact />} />
        <Route path="/fod/submit"    element={<FodSubmit />} />
        <Route path="/fod/legal"     element={<FodLegal />} />
        <Route path="/capital-digest" element={<CapitalDigest />} />
        <Route path="/submit-leads"   element={<ProviderSubmit />} />

        {/* ── Protected Portal Hub ── */}
        <Route path="/portal"                  element={<ProtectedRoute><PortalHome /></ProtectedRoute>} />
        <Route path="/portal/redirect"         element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/portal/borrower"         element={<ProtectedRoute><BorrowerPortal /></ProtectedRoute>} />
        <Route path="/portal/broker"           element={<ProtectedRoute><BrokerPortal /></ProtectedRoute>} />
        <Route path="/portal/lender"           element={<ProtectedRoute><LenderPortalPage /></ProtectedRoute>} />
        <Route path="/portal/investor"         element={<ProtectedRoute><InvestorPortal /></ProtectedRoute>} />
        <Route path="/portal/role-permissions" element={<ProtectedRoute><RolePermissionsPage /></ProtectedRoute>} />
        <Route path="/broker/subscribe"        element={<BrokerSubscription />} />

        {/* ── Protected CRM & Sub-Pages ── */}
        <Route path="/crm/login"     element={<CrmLogin />} />
        <Route path="/crm/dashboard" element={<ProtectedRoute><Crm><WorkspaceDashboard /></Crm></ProtectedRoute>} />
        <Route path="/crm/leads" element={<ProtectedRoute><Crm><Leads /></Crm></ProtectedRoute>} />
        <Route path="/crm/deals" element={<ProtectedRoute><Crm><Deals /></Crm></ProtectedRoute>} />
        <Route path="/crm/commissions" element={<ProtectedRoute><Crm><CommissionDashboard /></Crm></ProtectedRoute>} />
        <Route path="/crm/reports" element={<ProtectedRoute><Crm><Reports /></Crm></ProtectedRoute>} />
        <Route path="/crm/rei-analyzer" element={<ProtectedRoute><Crm><REIDealAnalyzerPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/rei-form" element={<ProtectedRoute><Crm><REIFormPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/als-servicing" element={<ProtectedRoute><Crm><ALSLoanServicingPage /></Crm></ProtectedRoute>} />
        <Route path="/rei-analyzer" element={<ProtectedRoute><REIDealAnalyzerPage /></ProtectedRoute>} />
        <Route path="/rei-form" element={<ProtectedRoute><REIFormPage /></ProtectedRoute>} />

        {/* ── Catch All ── */}
        <Route path="*" element={<FodHome />} />

      </Routes>
      <Toaster />
    </Router>
  );
}
