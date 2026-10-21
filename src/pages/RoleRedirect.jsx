import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function RoleRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'borrower';

  useEffect(() => {
    const map = {
      borrower: '/portal/borrower',
      broker: '/portal/broker',
      lender: '/portal/lender',
      investor: '/portal/investor',
    };
    navigate(map[role] || '/portal/borrower', { replace: true });
  }, [role, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui', color: '#64748b' }}>
      <p>Redirecting to {role} portal...</p>
    </div>
  );
}
