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
import Leads from "@/pages/Leads";
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
          <Route path="/login" element={<Portal />} />
          <Route path="/admin" element={<Portal />} />
          <Route path="/admin/login" element={<Portal />} />
          <Route path="/crm/login" element={<Portal />} />
          <Route path="/portal/investor" element={<InvestorPortal />} />

          {/* Command Center Dashboard (CCD) Dedicated Sidebar Views */}
          <Route path="/crm" element={<CrmLayout><Deals /></CrmLayout>} />
          <Route path="/crm/dashboard" element={<CrmLayout><Deals /></CrmLayout>} />
          <Route path="/crm/deals" element={<CrmLayout><Deals /></CrmLayout>} />
          <Route path="/crm/leads" element={<CrmLayout><Leads /></CrmLayout>} />
          <Route path="/crm/lenders" element={<CrmLayout><CrmLenders /></CrmLayout>} />
          <Route path="/crm/investors" element={<CrmLayout><InvestorDirectory /></CrmLayout>} />
          <Route path="/crm/term-sheets" element={<CrmLayout><TermSheets /></CrmLayout>} />
          <Route path="/crm/pipeline" element={<CrmLayout><Pipeline /></CrmLayout>} />
          <Route path="/crm/tasks" element={<CrmLayout><Tasks /></CrmLayout>} />
          <Route path="/crm/commissions" element={<CrmLayout><CommissionDashboard /></CrmLayout>} />
          <Route path="/crm/reports" element={<CrmLayout><Reports /></CrmLayout>} />
          <Route path="/crm/ai-comms" element={<CrmLayout><AiCommHub /></CrmLayout>} />
          <Route path="/crm/ai-comm" element={<CrmLayout><AiCommHub /></CrmLayout>} />
          <Route path="/crm/brokers" element={<CrmLayout><BrokerAssignment /></CrmLayout>} />
          <Route path="/crm/autonomous-closing" element={<CrmLayout><AutonomousClosingEngine /></CrmLayout>} />
          <Route path="/crm/settings" element={<CrmLayout><AdminSettings /></CrmLayout>} />
          <Route path="/admin/settings" element={<CrmLayout><AdminSettings /></CrmLayout>} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
