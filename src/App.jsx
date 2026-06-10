import { Toaster } from "@/components/ui/toaster"
import FodHome from "./pages/fod/Home";
import FodPlatform from "./pages/fod/Platform";
import FodSolutions from "./pages/fod/Solutions";
import FodPricing from "./pages/fod/Pricing";
import FodPortal from "./pages/fod/Portal";
import FodContact from "./pages/fod/Contact";
import FodSubmit from "./pages/fod/Submit";
import FodLegal from "./pages/fod/Legal";
import RoleRedirect from "./pages/RoleRedirect";
import BorrowerPortal from "./pages/portals/BorrowerPortal.jsx";
import BrokerPortal from "./pages/portals/BrokerPortal.jsx";
import LenderPortalPage from "./pages/portals/LenderPortalPage.jsx";
import InvestorPortal from "./pages/portals/InvestorPortal.jsx";
import RolePermissionsPage from "./pages/portals/RolePermissionsPage";
import BrokerSubscription from "./pages/BrokerSubscription.jsx";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';

// ─────────────────────────────────────────────────────────────
//  GLINFICO — AI-Powered Funding Platform (FOD)
//  This workspace is FOD-only (public site + portals).
//  LeadFlow CRM pages (Leads, Deals, Pipeline, etc.) are
//  preserved in their files but live in the separate CRM workspace.
// ─────────────────────────────────────────────────────────────

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

            {/* ── User Portals ── */}
            <Route path="/portal" element={<RoleRedirect />} />
            <Route path="/portal/borrower" element={<BorrowerPortal />} />
            <Route path="/portal/broker" element={<BrokerPortal />} />
            <Route path="/portal/lender" element={<LenderPortalPage />} />
            <Route path="/portal/investor" element={<InvestorPortal />} />
            <Route path="/portal/role-permissions" element={<RolePermissionsPage />} />
            <Route path="/broker/subscribe" element={<BrokerSubscription />} />

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;