import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Direct Page Imports
import AiCommHub from "@/pages/crm/AiCommHub";
import BrokerAssignment from "@/pages/crm/BrokerAssignment";
import Deals from "@/pages/crm/Deals";
import CrmLenders from "@/pages/crm/CrmLenders";
import InvestorPortal from "@/pages/portal/InvestorPortal";
import CapitalRaiseDigest from "@/pages/portal/CapitalRaiseDigest";
import AutonomousClosingEngine from "@/pages/crm/AutonomousClosingEngine";
import AdminSettings from "@/pages/crm/AdminSettings";

export default function App() {
  const isDigestDomain = typeof window !== 'undefined' && window.location.hostname.includes('crd.');

  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center">Loading Capital Raise Digest...</div>}>
        <Routes>
          {/* Default Landing Route -> Capital Raise Digest if on crd domain, else Deals Pipeline */}
          <Route path="/" element={isDigestDomain ? <CapitalRaiseDigest /> : <Deals />} />

          {/* CRM & Admin Routes */}
          <Route path="/crm/deals" element={<Deals />} />
          <Route path="/crm/ai-comm" element={<AiCommHub />} />
          <Route path="/crm/brokers" element={<BrokerAssignment />} />
          <Route path="/crm/lenders" element={<CrmLenders />} />
          <Route path="/crm/autonomous-closing" element={<AutonomousClosingEngine />} />
          <Route path="/crm/settings" element={<AdminSettings />} />

          {/* Portal & Magazine Routes */}
          <Route path="/portal/investor" element={<InvestorPortal />} />
          <Route path="/portal/crd" element={<CapitalRaiseDigest />} />
          <Route path="/portal" element={<InvestorPortal />} />

          {/* Fallback */}
          <Route path="*" element={isDigestDomain ? <CapitalRaiseDigest /> : <Deals />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
