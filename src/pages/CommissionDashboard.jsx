import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import FodHome from "./pages/fod/Home";
import FodPricing from "./pages/fod/Pricing";
import CrmLogin from "./pages/crm/Login";
import CrmLayout from "./components/crm/CrmLayout";
import WorkspaceDashboard from "./pages/WorkspaceDashboard.jsx";

const ProtectedRoute = ({ children }) => {
  const saved = localStorage.getItem('glinfico_user');
  if (!saved) return <Navigate to="/crm/login" replace />;
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FodHome />} />
        <Route path="/fod/pricing" element={<FodPricing />} />
        <Route path="/crm/login" element={<CrmLogin />} />
        <Route path="/crm/dashboard" element={
          <ProtectedRoute>
            <CrmLayout><WorkspaceDashboard /></CrmLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<FodHome />} />
      </Routes>
      <Toaster />
    </Router>
  );
}
