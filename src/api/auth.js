// Session helpers.
//
// This module previously defeated authentication in two ways:
//
//   getCurrentUser() returned a synthetic admin whenever nothing was stored:
//       { email: 'admin@glinfico.com', role: 'admin',
//         token: 'glinfico-active-session-token' }
//     so any first-time visitor was already an administrator.
//
//   loginUser(email, password, role = 'admin') never checked the password.
//     It wrote whatever email was typed into localStorage with role 'admin'
//     and returned success.
//
// Real authentication lives in src/lib/AuthContext.jsx and goes through
// Supabase. These helpers only read the cached session for display; they
// never grant it.

const STORAGE_KEY = 'glinfico_user';

/**
 * The cached session user, or null when signed out.
 * Returns null rather than a default — the caller must handle the signed-out
 * case. Authorisation decisions belong in ProtectedRoute, which verifies the
 * live Supabase session rather than trusting localStorage.
 */
export function getCurrentUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const user = JSON.parse(stored);
    if (!user || typeof user !== 'object' || !user.email) return null;
    return user;
  } catch {
    return null;
  }
}

/** Convenience check. Not a security boundary — see ProtectedRoute. */
export function isSignedIn() {
  return getCurrentUser() !== null;
}

/**
 * The cached role, defaulting to the least-privileged value.
 * Never defaults to 'admin'.
 */
export function getCurrentRole() {
  return getCurrentUser()?.role || 'guest';
}

/**
 * Cache a session that Supabase has already authenticated.
 * This does not perform authentication. Use the `login` function from
 * AuthContext, which calls supabase.auth.signInWithPassword.
 */
export function cacheSession(user) {
  if (!user?.email) throw new Error('cacheSession requires an authenticated user');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * @deprecated Performed no verification. Kept as a loud failure so any
 * remaining caller surfaces immediately instead of silently granting admin.
 */
export function loginUser() {
  throw new Error(
    'loginUser() has been removed: it granted admin access without verifying ' +
      'the password. Use the login() function from src/lib/AuthContext.jsx.'
  );
}

export function logoutUser() {
  clearSession();
  window.location.href = '/login';
}
