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

// ── Portal / Role Hub ──
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
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider } from "@/lib/AuthContext";

const Crm = ({ children }) => <CrmLayout>{children}</CrmLayout>;

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
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

            {/* ── CRM Internal (admin only) — /crm/* ── */}
            <Route path="/crm/dashboard" element={<Crm><WorkspaceDashboard /></Crm>} />
            <Route path="/crm/overview" element={<Crm><Dashboard /></Crm>} />
            <Route path="/crm/leads" element={<Crm><LeadsPage /></Crm>} />
            <Route path="/crm/pipeline" element={<Crm><PipelinePage /></Crm>} />
            <Route path="/crm/deals" element={<Crm><DealsPage /></Crm>} />
            <Route path="/crm/tasks" element={<Crm><TasksPage /></Crm>} />
            <Route path="/crm/lenders" element={<Crm><LendersPage /></Crm>} />
            <Route path="/crm/team" element={<Crm><TeamPage /></Crm>} />
            <Route path="/crm/reports" element={<Crm><ReportsPage /></Crm>} />
            <Route path="/crm/commissions" element={<Crm><CommissionDashboard /></Crm>} />

            {/* Legacy CRM paths → redirect handled by RoleRedirect */}
            <Route path="/Dashboard" element={<Crm><WorkspaceDashboard /></Crm>} />
            <Route path="/Leads" element={<Crm><LeadsPage /></Crm>} />
            <Route path="/Pipeline" element={<Crm><PipelinePage /></Crm>} />
            <Route path="/Deals" element={<Crm><DealsPage /></Crm>} />
            <Route path="/Tasks" element={<Crm><TasksPage /></Crm>} />
            <Route path="/Lenders" element={<Crm><LendersPage /></Crm>} />
            <Route path="/Team" element={<Crm><TeamPage /></Crm>} />
            <Route path="/ReportsNew" element={<Crm><ReportsPage /></Crm>} />
            <Route path="/CommissionDashboard" element={<Crm><CommissionDashboard /></Crm>} />
            <Route path="/WorkspaceDashboard" element={<Crm><WorkspaceDashboard /></Crm>} />

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;