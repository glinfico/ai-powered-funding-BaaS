import CcdV2Redirect from "@/components/CcdV2Redirect";
import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import Home from "@/pages/fod/Home";
import Platform from "@/pages/fod/Platform";
import Solutions from "@/pages/fod/Solutions";
import Pricing from "@/pages/fod/Pricing";
import Portal from "@/pages/fod/Portal";
import Contact from "@/pages/fod/Contact";
import Submit from "@/pages/fod/Submit";
import Legal from "@/pages/fod/Legal";
import VideoShowcase from "@/pages/fod/VideoShowcase";

// Dedicated CRM & CCD Views
import CrmLayout from "@/components/crm/CrmLayout";
import Deals from "@/pages/crm/Deals";
import Pipeline from "@/pages/Pipeline";
import TermSheets from "@/pages/TermSheets";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import CommissionDashboard from "@/pages/CommissionDashboard";
import AiCommHub from "@/pages/crm/AiCommHub";
import CrmLenders from "@/pages/crm/CrmLenders";
import InvestorDirectory from "@/pages/crm/InvestorDirectory";
import BrokerAssignment from "@/pages/crm/BrokerAssignment";
import AutonomousClosingEngine from "@/pages/crm/AutonomousClosingEngine";
import AdminSettings from "@/pages/crm/AdminSettings";

// Portals & Digest Domain
import CapitalRaiseDigest from "@/pages/portal/CapitalRaiseDigest";
import InvestorPortal from "@/pages/portal/InvestorPortal";
import ProtectedRoute from "@/components/ProtectedRoute";
import BrokerSubscription from "@/pages/BrokerSubscription";
import BrokerSubscriptionCheckout from "@/pages/crm/BrokerSubscriptionCheckout";

// Private-only code splits: public FOD pages do not eagerly load DPE/CCD changes.
const ControlCenterDashboard = React.lazy(() => import("@/pages/crm/ControlCenterDashboard"));
const VerifiedLeads = React.lazy(() => import("@/pages/crm/VerifiedLeads"));
const BankLeads = React.lazy(() => import("@/pages/crm/BankLeads"));
const DocumentsProcessing = React.lazy(() => import("@/pages/crm/DocumentsProcessing"));
const EngineHub = React.lazy(() => import("@/pages/crm/EngineHub"));
const PortalsDirectory = React.lazy(() => import("@/pages/crm/PortalsDirectory"));

export default function App() {
  const isDigestDomain = typeof window !== "undefined" && window.location.hostname.includes("crd.");

  if (isDigestDomain) {
    return (
      <Router>
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="*" element={<CapitalRaiseDigest />} />
          </Routes>
        </Suspense>
      </Router>
    );
  }

  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center">Loading...</div>}>
        <Routes>
          {/* Public Main Site Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/demos" element={<VideoShowcase />} />
          <Route path="/fod/demos" element={<VideoShowcase />} />
          <Route path="/fod/platform" element={<Platform />} />
          <Route path="/fod/solutions" element={<Solutions />} />
          <Route path="/fod/pricing" element={<Pricing />} />
          <Route path="/broker/subscribe" element={<BrokerSubscription />} />
          <Route path="/checkout" element={<BrokerSubscriptionCheckout />} />
          <Route path="/fod/portal" element={<Portal />} />
          <Route path="/fod/contact" element={<Contact />} />
          <Route path="/fod/submit" element={<Submit />} />
          <Route path="/fod/legal" element={<Legal />} />

          {/* Portal & Sign-In Paths */}
          <Route path="/portal" element={<Portal />} />
          <Route path="/login" element={<Portal />} />
          <Route path="/admin" element={<Portal />} />
          <Route path="/admin/login" element={<Portal />} />
          <Route path="/crm/login" element={<Portal />} />
          <Route path="/portal/investor" element={<InvestorPortal />} />

          {/* Command Center Dashboard (CCD) Dedicated Sidebar Views */}
          <Route path="/crm" element={<CcdV2Redirect />} />
          <Route path="/crm/*" element={<CcdV2Redirect />} />
          <Route path="/crm/dashboard" element={<CcdV2Redirect />} />
          <Route path="/crm/deals" element={<CcdV2Redirect />} />
          <Route path="/crm/leads" element={<CcdV2Redirect />} />
          <Route path="/crm/bank-leads" element={<CcdV2Redirect />} />
          <Route path="/crm/documents" element={<CcdV2Redirect />} />
          <Route path="/crm/engines" element={<CcdV2Redirect />} />
          <Route path="/crm/portals" element={<CcdV2Redirect />} />
          <Route path="/crm/lenders" element={<CcdV2Redirect />} />
          <Route path="/crm/investors" element={<CcdV2Redirect />} />
          <Route path="/crm/term-sheets" element={<CcdV2Redirect />} />
          <Route path="/crm/pipeline" element={<CcdV2Redirect />} />
          <Route path="/crm/tasks" element={<CcdV2Redirect />} />
          <Route path="/crm/commissions" element={<CcdV2Redirect />} />
          <Route path="/crm/reports" element={<CcdV2Redirect />} />
          <Route path="/crm/ai-comms" element={<CcdV2Redirect />} />
          <Route path="/crm/ai-comm" element={<CcdV2Redirect />} />
          <Route path="/crm/brokers" element={<CcdV2Redirect />} />
          <Route path="/crm/autonomous-closing" element={<CcdV2Redirect />} />
          <Route path="/crm/settings" element={<CcdV2Redirect />} />
          <Route path="/admin/settings" element={<CcdV2Redirect />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
