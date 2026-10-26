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

// CRM / Command Center Dashboard (CCD) Pages & Modules
import Deals from "@/pages/crm/Deals";
import AiCommHub from "@/pages/crm/AiCommHub";
import BrokerAssignment from "@/pages/crm/BrokerAssignment";
import CrmLenders from "@/pages/crm/CrmLenders";
import AutonomousClosingEngine from "@/pages/crm/AutonomousClosingEngine";
import AdminSettings from "@/pages/crm/AdminSettings";

// Portals & Authentication / Digest Domain
import CapitalRaiseDigest from "@/pages/portal/CapitalRaiseDigest";
import InvestorPortal from "@/pages/portal/InvestorPortal";

export default function App() {
  const isDigestDomain = typeof window !== 'undefined' && window.location.hostname.includes('crd.');

  // 1. Isolated Magazine Domain (crd.glinfico.com)
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
          <Route path="/fod/portal" element={<Portal />} />
          <Route path="/fod/contact" element={<Contact />} />
          <Route path="/fod/submit" element={<Submit />} />
          <Route path="/fod/legal" element={<Legal />} />

          {/* Portal & Sign-In Paths */}
          <Route path="/portal" element={<Portal />} />
          <Route path="/portal/investor" element={<InvestorPortal />} />
          <Route path="/login" element={<Portal />} />
          <Route path="/admin/login" element={<Portal />} />

          {/* Deals Command Center Dashboard (CCD) & Sub-Pages */}
          <Route path="/crm" element={<Deals />} />
          <Route path="/crm/dashboard" element={<Deals />} />
          <Route path="/crm/deals" element={<Deals />} />
          <Route path="/crm/ai-comm" element={<AiCommHub />} />
          <Route path="/crm/brokers" element={<BrokerAssignment />} />
          <Route path="/crm/lenders" element={<CrmLenders />} />
          <Route path="/crm/autonomous-closing" element={<AutonomousClosingEngine />} />
          <Route path="/crm/settings" element={<AdminSettings />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
