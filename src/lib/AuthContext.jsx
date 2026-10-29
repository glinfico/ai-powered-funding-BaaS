import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-supabase-url'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

function isPublicPath(path) {
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
    if (supabase) {
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
        } else {
          checkLocalStorage();
        }
        setIsLoadingAuth(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('glinfico_user');
        }
      });

      return () => subscription?.unsubscribe();
    } else {
      checkLocalStorage();
      setIsLoadingAuth(false);
    }
  }, []);

  const checkLocalStorage = () => {
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
  };

  const login = async (email, password) => {
    setAuthError(null);
    
    // Emergency admin fallback or local mock login if Supabase is unconfigured
    if (email === 'admin@glinfico.com' && (password === 'Glinfico2024!' || !supabase)) {
      const userData = {
        id: 'admin-001',
        email: 'admin@glinfico.com',
        name: 'GLINFICO Administrator',
        role: 'admin'
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('glinfico_user', JSON.stringify(userData));
      return { success: true };
    }

    if (!supabase) {
      // Mock login for contacts if Supabase env vars aren't set yet
      const userData = {
        id: 'contact-' + Date.now(),
        email,
        name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'contact'
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('glinfico_user', JSON.stringify(userData));
      return { success: true };
    }

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
        role: data.user.user_metadata?.role || (email.includes('admin') ? 'admin' : 'contact')
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('glinfico_user', JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: 'Authentication failed' };
  };

  const requestEmailBackup = async (email) => {
    setAuthError(null);
    if (!supabase) {
      return { success: true, message: 'Mock magic link sent to ' + email + '!' };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/crm/dashboard'
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, message: 'Secure login magic link sent to your email!' };
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
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

export { isPublicPath };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
