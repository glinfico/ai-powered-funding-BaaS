import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// ── Admin credentials (change these to your real credentials) ──
const ADMIN_EMAIL = 'admin@glinfico.com';
const ADMIN_PASSWORD = 'Glinfico2024!';

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
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check if already logged in via localStorage
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
    setIsLoadingAuth(false);
  }, []);

  const login = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const userData = {
        id: 'admin-001',
        email: ADMIN_EMAIL,
        name: 'GLINFICO Admin',
        role: 'admin'
      };
      setUser(userData);
      setIsAuthenticated(true);
      setAuthError(null);
      localStorage.setItem('glinfico_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
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
      isLoadingPublicSettings,
      authError,
      appPublicSettings: null,
      login,
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
