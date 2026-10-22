import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// CRM & Portal Pages
import AiCommHub from "@/pages/crm/AiCommHub";
import BrokerAssignment from "@/pages/crm/BrokerAssignment";
import Deals from "@/pages/crm/Deals";
import CrmLenders from "@/pages/crm/CrmLenders";
import InvestorPortal from "@/pages/portal/InvestorPortal";

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center">Loading Glinfico BaaS...</div>}>
        <Routes>
          {/* Default redirect to CRM Deals / AI-Comm */}
          <Route path="/" element={<Navigate to="/crm/ai-comm" replace />} />

          {/* CRM & Admin Routes */}
          <Route path="/crm/ai-comm" element={<AiCommHub />} />
          <Route path="/crm/brokers" element={<BrokerAssignment />} />
          <Route path="/crm/deals" element={<Deals />} />
          <Route path="/crm/lenders" element={<CrmLenders />} />

          {/* Investor Portal Route */}
          <Route path="/portal/investor" element={<InvestorPortal />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/crm/ai-comm" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
