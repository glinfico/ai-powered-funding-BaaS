import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const [status, setStatus] = useState('checking');
  const [role, setRole] = useState(null);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      if (!supabase) {
        if (active) setStatus('unauthorized');
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      if (error || !accessToken) {
        if (active) setStatus('unauthorized');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = response.ok ? await response.json() : null;
        if (active) {
          setRole(result?.role || null);
          setStatus(response.ok ? 'authorized' : 'unauthorized');
        }
      } catch {
        if (active) setStatus('unauthorized');
      }
    }

    verifySession();
    const { data: listener } = supabase?.auth.onAuthStateChange(() => {
      verifySession();
    }) || { data: { subscription: { unsubscribe() {} } } };

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (status === 'checking') {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', color: 'white' }}>Verifying secure access…</div>;
  }

  if (status !== 'authorized') {
    return <Navigate to="/crm/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && role !== 'admin') {
    return <div role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>Administrator access is required for this page.</div>;
  }

  return children;
}
