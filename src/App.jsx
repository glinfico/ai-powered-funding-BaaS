import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "@/pages/fod/Home";
import Platform from "@/pages/fod/Platform";
import Solutions from "@/pages/fod/Solutions";
import Pricing from "@/pages/fod/Pricing";
import Portal from "@/pages/fod/Portal";
import Contact from "@/pages/fod/Contact";
import Submit from "@/pages/fod/Submit";
import Legal from "@/pages/fod/Legal";
import VideoShowcase from "@/pages/fod/VideoShowcase";

import Deals from "@/pages/crm/Deals";
import AiCommHub from "@/pages/crm/AiCommHub";
import BrokerAssignment from "@/pages/crm/BrokerAssignment";
import CrmLenders from "@/pages/crm/CrmLenders";
import AutonomousClosingEngine from "@/pages/crm/AutonomousClosingEngine";
import AdminSettings from "@/pages/crm/AdminSettings";
import CrmLogin from "@/pages/crm/Login";
import WorkspaceDashboard from "@/pages/WorkspaceDashboard";

import PortalHome from "@/pages/portal/PortalHome";
import RoleRedirect from "@/pages/RoleRedirect";
import BorrowerPortal from "@/pages/portals/BorrowerPortal";
import BrokerPortal from "@/pages/portals/BrokerPortal";
import LenderPortalPage from "@/pages/portals/LenderPortalPage";
import InvestorPortal from "@/pages/portal/InvestorPortal";

import CapitalRaiseDigest from "@/pages/portal/CapitalRaiseDigest";

export default function App() {
  const isDigestDomain = typeof window !== 'undefined' && window.location.hostname.includes('crd.');

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
          <Route path="/" element={<Home />} />
          <Route path="/demos" element={<VideoShowcase />} />
          <Route path="/fod" element={<Home />} />
          <Route path="/fod/demos" element={<VideoShowcase />} />
          <Route path="/fod/platform" element={<Platform />} />
          <Route path="/fod/solutions" element={<Solutions />} />
          <Route path="/fod/pricing" element={<Pricing />} />
          <Route path="/fod/portal" element={<Portal />} />
          <Route path="/fod/contact" element={<Contact />} />
          <Route path="/fod/submit" element={<Submit />} />
          <Route path="/fod/legal" element={<Legal />} />

          <Route path="/portal" element={<PortalHome />} />
          <Route path="/portal/redirect" element={<RoleRedirect />} />
          <Route path="/portal/borrower" element={<BorrowerPortal />} />
          <Route path="/portal/broker" element={<BrokerPortal />} />
          <Route path="/portal/lender" element={<LenderPortalPage />} />
          <Route path="/portal/investor" element={<InvestorPortal />} />
          <Route path="/broker/subscribe" element={<Portal />} />

          <Route path="/crm/login" element={<CrmLogin />} />
          <Route path="/crm/dashboard" element={<WorkspaceDashboard />} />
          <Route path="/crm/deals" element={<Deals />} />
          <Route path="/crm/ai-comm" element={<AiCommHub />} />
          <Route path="/crm/brokers" element={<BrokerAssignment />} />
          <Route path="/crm/lenders" element={<CrmLenders />} />
          <Route path="/crm/autonomous-closing" element={<AutonomousClosingEngine />} />
          <Route path="/crm/settings" element={<AdminSettings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
