import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/AuthContext';
import { clearSession } from '@/api/auth';

/**
 * Route guard.
 *
 * This component already existed and was correct in outline, but it was
 * referenced zero times in App.jsx — every CRM and admin route rendered
 * unauthenticated. Verified against production: /crm/leads returned the full
 * 8,228-lead command centre, and /admin/settings returned
 * "Admin Credentials & API Settings", from a browser that had never signed in.
 *
 * Two deliberate choices:
 *
 *  - Authorisation is decided from the **live Supabase session**, never from
 *    localStorage. The cached `glinfico_user` object is user-writable from
 *    DevTools, so trusting it would let anyone mint themselves an admin role.
 *
 *  - Role is read from `app_metadata` first. That field is server-controlled;
 *    `user_metadata` is editable by the user it belongs to.
 *
 * This guards the UI. It is not a substitute for row-level security in
 * Supabase — a determined caller can always hit the API directly, so RLS on
 * the underlying tables remains required.
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [state, setState] = useState({ status: 'checking', role: null });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!supabase) {
        // No auth configured. Fail closed rather than open.
        if (!cancelled) setState({ status: 'unconfigured', role: null });
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;

        if (error || !data?.user) {
          clearSession();
          setState({ status: 'anonymous', role: null });
          return;
        }

        const role =
          data.user.app_metadata?.role ||
          data.user.user_metadata?.role ||
          'contact';

        setState({ status: 'authenticated', role });
      } catch {
        if (!cancelled) setState({ status: 'anonymous', role: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (state.status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-mono text-sm text-slate-400">
        Verifying session…
      </div>
    );
  }

  if (state.status === 'unconfigured') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <h1 className="mb-2 text-lg font-bold text-amber-400">
            Authentication not configured
          </h1>
          <p className="text-sm text-slate-300">
            Set <code className="rounded bg-black/40 px-1">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-black/40 px-1">VITE_SUPABASE_ANON_KEY</code>, then
            redeploy. Protected areas stay closed until then.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(state.role)) {
    // Authenticated but not permitted here — send them somewhere they can use.
    const home =
      state.role === 'admin' || state.role === 'staff' ? '/crm/dashboard' : '/portal';
    if (location.pathname === home) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
          <div>
            <h1 className="mb-2 text-lg font-bold text-rose-400">Access denied</h1>
            <p className="text-sm text-slate-400">
              Your role ({state.role}) cannot view this page.
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to={home} replace />;
  }

  return children;
}
