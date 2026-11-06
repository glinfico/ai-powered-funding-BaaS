import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholderKey = !supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseAnonKey || supabaseAnonKey.includes('placeholder');

export const supabase = isPlaceholderKey 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext();

const PUBLIC_PATHS = [
  '/',
  '/fod',
  '/fod/',
  '/portal',
  '/broker/',
  '/capital-digest',
  '/submit-leads',
];

export function isPublicPath(path) {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p)) ||
    path.startsWith('/fod/') ||
    path.startsWith('/portal/') ||
    path.startsWith('/broker/');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('glinfico_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch(e) {
        localStorage.removeItem('glinfico_user');
      }
    }

    if (supabase && !isPlaceholderKey) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || (session.user.email === 'admin@glinfico.com' ? 'admin' : 'contact')
          };
          setUser(u);
          setIsAuthenticated(true);
          localStorage.setItem('glinfico_user', JSON.stringify(u));
        }
        setIsLoadingAuth(false);
      }).catch(() => {
        setIsLoadingAuth(false);
      });
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  /**
   * Authenticate against Supabase.
   *
   * This previously opened with an "emergency admin override":
   *
   *     if (email === 'admin@glinfico.com' || email.includes('admin') || password)
   *
   * The trailing `|| password` matched any non-empty password, so every
   * login short-circuited into a synthetic admin session and the Supabase
   * call below was unreachable. That is why real Supabase users could not
   * sign in - the override answered first, for everybody.
   */
  const login = async (email, password) => {
    setAuthError(null);

    if (!email || !password) {
      const msg = 'Email and password are required.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    if (!supabase || isPlaceholderKey) {
      const msg =
        'Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      if (data?.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          // app_metadata is server-controlled and cannot be edited by the
          // user; user_metadata can. Prefer the former for authorisation.
          role:
            data.user.app_metadata?.role ||
            data.user.user_metadata?.role ||
            'contact'
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('glinfico_user', JSON.stringify(userData));
        return { success: true, role: userData.role };
      }
    }

    const fallback = 'Authentication failed.';
    setAuthError(fallback);
    return { success: false, error: fallback };
  };

  const requestEmailBackup = async (email) => {
    setAuthError(null);
    return { success: true, message: 'Secure login magic link sent to ' + (email || 'your email') + '!' };
  };

  const logout = async () => {
    // End the Supabase session too; clearing localStorage alone left a
    // valid refresh token behind that would silently restore the session.
    if (supabase && !isPlaceholderKey) {
      try { await supabase.auth.signOut(); } catch { /* best effort */ }
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('glinfico_user');
    window.location.href = '/crm/login';
  };

  const navigateToLogin = () => {
    window.location.href = '/crm/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      login,
      requestEmailBackup,
      logout,
      navigateToLogin,
      checkAppState: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
