import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function RoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user) {
        navigate('/fod/portal');
        return;
      }
      switch (user.role) {
        case 'admin':
          navigate('/crm/dashboard');
          break;
        case 'broker':
          navigate('/portal/broker');
          break;
        case 'borrower':
          navigate('/portal/borrower');
          break;
        case 'lender':
          navigate('/portal/lender');
          break;
        case 'investor':
          navigate('/portal/investor');
          break;
        default:
          navigate('/crm/dashboard');
      }
    }).catch(() => navigate('/fod/portal'));
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
}