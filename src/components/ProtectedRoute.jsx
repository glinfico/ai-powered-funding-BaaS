import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
);

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);

  useEffect(() => {
    verifySessionAndRole();
  }, []);

  const verifySessionAndRole = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setRedirectUrl('/login');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const userRole = user.user_metadata?.role || 'broker';

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        if (userRole === 'admin' || userRole === 'staff') {
          setRedirectUrl('/crm/dashboard');
        } else {
          setRedirectUrl('/portal');
        }
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
    } catch (err) {
      console.error('Auth verification error:', err);
      setRedirectUrl('/login');
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Verifying secure BPG session & role privileges...
      </div>
    );
  }

  if (!authorized && redirectUrl) {
    window.location.replace(redirectUrl);
    return null;
  }

  return children;
}
