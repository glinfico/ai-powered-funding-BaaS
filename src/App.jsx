import { Toaster } from "@/components/ui/toaster"
import FinVenturePro from "./pages/FinVenturePro";
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
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (skip for FOD public paths)
  const isFodPublic = location.pathname === '/' || location.pathname.startsWith('/fod');
  if (authError && !isFodPublic) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* FOD Public Site — no auth required */}
      <Route path="/" element={<FodHome />} />
      <Route path="/fod" element={<FodHome />} />
      <Route path="/fod/platform" element={<FodPlatform />} />
      <Route path="/fod/solutions" element={<FodSolutions />} />
      <Route path="/fod/pricing" element={<FodPricing />} />
      <Route path="/fod/portal" element={<FodPortal />} />
      <Route path="/fod/contact" element={<FodContact />} />
      <Route path="/fod/submit" element={<FodSubmit />} />
      <Route path="/fod/legal" element={<FodLegal />} />
      <Route path="/portal" element={<RoleRedirect />} />
      <Route path="/portal/borrower" element={<BorrowerPortal />} />
      <Route path="/portal/broker" element={<BrokerPortal />} />
      <Route path="/portal/lender" element={<LenderPortalPage />} />
      <Route path="/portal/investor" element={<InvestorPortal />} />
      <Route path="/portal/role-permissions" element={<RolePermissionsPage />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route
        path="/FinVenturePro"
        element={
          <LayoutWrapper currentPageName="FinVenturePro">
            <FinVenturePro />
          </LayoutWrapper>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App