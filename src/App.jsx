

const Crm = ({ children }) => <CrmLayout>{children}</CrmLayout>;

const ProtectedRoute = ({ children }) => {
  const saved = localStorage.getItem('glinfico_user');
  if (!saved) return <Navigate to="/crm/login" replace />;
  return children;
};

function AppRoutes() {
  return (
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
      <Route path="/capital-digest" element={<CapitalDigest />} />
      <Route path="/submit-leads" element={<ProviderSubmit />} />

            {/* ── CRM Login ── */}
      <Route path="/crm/login" element={<CrmLogin />} />

      {/* ── CRM Protected Routes ── */}
      <Route path="/crm/dashboard" element={<ProtectedRoute><Crm><WorkspaceDashboard /></Crm></ProtectedRoute>} />
      <Route path="/crm/commissions" element={<ProtectedRoute><Crm><CommissionDashboard /></Crm></ProtectedRoute>} />

      <Route path="*" element={<FodHome />} />

      {/* ── Legacy paths ── */}
      <Route path="/Dashboard" element={<ProtectedRoute><Crm><WorkspaceDashboard /></Crm></ProtectedRoute>} />
      <Route path="/Leads" element={<ProtectedRoute><Crm><LeadsPage /></Crm></ProtectedRoute>} />
      <Route path="/Deals" element={<ProtectedRoute><Crm><DealsPage /></Crm></ProtectedRoute>} />

      <Route path="*" element={<FodHome />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
