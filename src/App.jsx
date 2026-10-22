import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Lenders from "./pages/Lenders";
import TermSheets from "./pages/TermSheets";
import Pipeline from "./pages/Pipeline";
import Tasks from "./pages/Tasks";
import AICommunicationHub from "./pages/AICommunicationHub";
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
import ProtectedRoute     from "./components/ProtectedRoute";

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
        <Route path="/fod/portal"    element={<FodPortal />} />
        <Route path="/fod/contact"   element={<FodContact />} />
        <Route path="/fod/submit"    element={<FodSubmit />} />
        <Route path="/fod/legal"     element={<FodLegal />} />
        <Route path="/capital-digest" element={<CapitalDigest />} />
        <Route path="/submit-leads"   element={<ProviderSubmit />} />

        {/* ── Portals (External Roles: Borrower, Broker, Lender, Investor) ── */}
        <Route path="/portal"                  element={<ProtectedRoute><PortalHome /></ProtectedRoute>} />
        <Route path="/portal/redirect"         element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/portal/borrower"         element={<ProtectedRoute><BorrowerPortal /></ProtectedRoute>} />
        <Route path="/portal/broker"           element={<ProtectedRoute><BrokerPortal /></ProtectedRoute>} />
        <Route path="/portal/lender"           element={<ProtectedRoute><LenderPortalPage /></ProtectedRoute>} />
        <Route path="/portal/investor"         element={<ProtectedRoute><InvestorPortal /></ProtectedRoute>} />
        <Route path="/portal/role-permissions" element={<ProtectedRoute><RolePermissionsPage /></ProtectedRoute>} />
        <Route path="/broker/subscribe"        element={<BrokerSubscription />} />

        {/* ── CRM / Control Center (Supabase Admin & Internal Staff Only) ── */}
        <Route path="/crm/login"     element={<CrmLogin />} />
        <Route path="/crm/dashboard" element={<ProtectedRoute requireAdmin={true}><Crm><WorkspaceDashboard /></Crm></ProtectedRoute>} />
        <Route path="/crm/deals" element={<ProtectedRoute requireAdmin={true}><Crm><Deals /></Crm></ProtectedRoute>} />
        <Route path="/crm/leads" element={<ProtectedRoute requireAdmin={true}><Crm><Leads /></Crm></ProtectedRoute>} />
        <Route path="/crm/lenders" element={<ProtectedRoute requireAdmin={true}><Crm><Lenders /></Crm></ProtectedRoute>} />
        <Route path="/crm/term-sheets" element={<ProtectedRoute requireAdmin={true}><Crm><TermSheets /></Crm></ProtectedRoute>} />
        <Route path="/crm/pipeline" element={<ProtectedRoute requireAdmin={true}><Crm><Pipeline /></Crm></ProtectedRoute>} />
        <Route path="/crm/tasks" element={<ProtectedRoute requireAdmin={true}><Crm><Tasks /></Crm></ProtectedRoute>} />
        <Route path="/crm/commissions" element={<ProtectedRoute requireAdmin={true}><Crm><CommissionDashboard /></Crm></ProtectedRoute>} />
        <Route path="/crm/reports" element={<ProtectedRoute requireAdmin={true}><Crm><Reports /></Crm></ProtectedRoute>} />
        <Route path="/crm/ai-comms" element={<ProtectedRoute requireAdmin={true}><Crm><AICommunicationHub /></Crm></ProtectedRoute>} />
        <Route path="/crm/rei-analyzer" element={<ProtectedRoute requireAdmin={true}><Crm><REIDealAnalyzerPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/rei-form" element={<ProtectedRoute requireAdmin={true}><Crm><REIFormPage /></Crm></ProtectedRoute>} />
        <Route path="/crm/als-servicing" element={<ProtectedRoute requireAdmin={true}><Crm><ALSLoanServicingPage /></Crm></ProtectedRoute>} />
        <Route path="/rei-analyzer" element={<ProtectedRoute requireAdmin={true}><REIDealAnalyzerPage /></ProtectedRoute>} />
        <Route path="/rei-form" element={<ProtectedRoute requireAdmin={true}><REIFormPage /></ProtectedRoute>} />

        {/* ── Catch All ── */}
        <Route path="*" element={<FodHome />} />

      </Routes>
      <Toaster />
    </Router>
  );
}
