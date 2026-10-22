import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation();
  const rawUser = localStorage.getItem('glinfico_user');
  
  if (!rawUser) {
    // Redirect unauthenticated visitors trying to access protected paths back to login
    return <Navigate to="/crm/login" state={{ from: location }} replace />;
  }

  let user = null;
  try {
    user = JSON.parse(rawUser);
  } catch (e) {
    user = { email: rawUser };
  }

  // If page requires Supabase Admin / Internal Staff status, verify identity
  if (requireAdmin) {
    const isSupabaseAdmin = user?.is_admin || user?.role === 'admin' || user?.source === 'supabase';
    if (!isSupabaseAdmin) {
      // Non-admin portal users attempting to access CRM backend get redirected to portal home
      return <Navigate to="/portal" replace />;
    }
  }

  return children;
}
