import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CrmLayout from "@/components/crm/CrmLayout";

// Page Imports
import FodHome from "@/pages/FodHome";
import Pricing from "@/pages/Pricing";
import PaypalCheckout from "@/pages/PaypalCheckout";
import PortalHome from "@/pages/portal/PortalHome";
import BrokerPortal from "@/pages/portals/BrokerPortal";
import BrokerSubscriptionCheckout from "@/pages/crm/BrokerSubscriptionCheckout";

// CRM Imports
import InvestorDirectory from "@/pages/InvestorDirectory";
import CrmLenders from "@/pages/crm/CrmLenders";
import Leads from "@/pages/crm/Leads";
import CommissionDashboard from "@/pages/CommissionDashboard";
import Deals from "@/pages/Deals";
import WorkspaceDashboard from "@/pages/WorkspaceDashboard";

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<FodHome />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/paypal-checkout" element={<PaypalCheckout />} />
      
      {/* Central Portal Hub */}
      <Route path="/portal" element={<PortalHome />} />
      
      {/* Broker Explicit Routes */}
      <Route path="/broker" element={<BrokerPortal />} />
      <Route path="/brokers" element={<BrokerPortal />} />
      <Route path="/broker-subscription" element={<BrokerSubscriptionCheckout />} />
      
      {/* CRM Portal Routes */}
      <Route path="/crm" element={<CrmLayout><WorkspaceDashboard /></CrmLayout>} />
      <Route path="/crm/dashboard" element={<CrmLayout><WorkspaceDashboard /></CrmLayout>} />
      <Route path="/crm/investors" element={<CrmLayout><InvestorDirectory /></CrmLayout>} />
      <Route path="/crm/lenders" element={<CrmLayout><CrmLenders /></CrmLayout>} />
      <Route path="/crm/leads" element={<CrmLayout><Leads /></CrmLayout>} />
      <Route path="/crm/commissions" element={<CrmLayout><CommissionDashboard /></CrmLayout>} />
      <Route path="/crm/deals" element={<CrmLayout><Deals /></CrmLayout>} />

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
