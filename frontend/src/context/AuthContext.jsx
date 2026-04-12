import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [isGuest,      setIsGuest]      = useState(false);
  const [guestHandles, setGuestHandles] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('guest_handles') || '{}'); }
    catch { return {}; }
  });

  // On mount: restore real auth OR restore guest session
  useEffect(() => {
    const handleExpired = () => {
      api.clearTokens();
      setUser(null);
    };
    window.addEventListener('algomind:auth-expired', handleExpired);

    // Restore guest session across page refreshes
    if (sessionStorage.getItem('guest_handles')) {
      setIsGuest(true);
    }

    // Try to restore real session from stored JWT
    if (!api.getToken()) {
      setLoading(false);
      return () => window.removeEventListener('algomind:auth-expired', handleExpired);
    }

    api.get('/auth/profile/')
      .then(setUser)
      .catch(() => api.clearTokens())
      .finally(() => setLoading(false));

    return () => window.removeEventListener('algomind:auth-expired', handleExpired);
  }, []);

  // ── helpers ──────────────────────────────────────────────────────
  const _clearGuest = () => {
    sessionStorage.removeItem('guest_handles');
    setIsGuest(false);
    setGuestHandles({});
  };

  // Connect guest handles to an authenticated account
  const promoteGuest = useCallback(async (handles) => {
    const connect = (platform, handle) =>
      api.post('/analytics/connect/', { platform_name: platform, handle }).catch(() => {});
    await Promise.all([
      handles.leetcode   ? connect('leetcode',   handles.leetcode)   : null,
      handles.codeforces ? connect('codeforces', handles.codeforces) : null,
    ].filter(Boolean));
  }, []);

  // ── real login ───────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login/', { email, password });
    api.setTokens(data.access, data.refresh);
    const profile = await api.get('/auth/profile/');
    setUser(profile);
    _clearGuest();
    return profile;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── register ─────────────────────────────────────────────────────
  const register = useCallback(async (username, email, password, password2) => {
    const data = await api.post('/auth/register/', { username, email, password, password2 });
    api.setTokens(data.access, data.refresh);
    setUser(data.user);
    _clearGuest();
    return data.user;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── OAuth login (called by OAuthCallbackPage) ─────────────────────
  // Tokens were already minted by the backend; just store them and
  // hydrate the user profile via a normal /profile/ call.
  const loginFromOAuth = useCallback(async (access, refresh) => {
    api.setTokens(access, refresh);
    const profile = await api.get('/auth/profile/');
    setUser(profile);
    _clearGuest();
    return profile;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── guest login ──────────────────────────────────────────────────
  const loginAsGuest = useCallback((lcHandle, cfHandle) => {
    const handles = { leetcode: lcHandle || '', codeforces: cfHandle || '' };
    sessionStorage.setItem('guest_handles', JSON.stringify(handles));
    setIsGuest(true);
    setGuestHandles(handles);
    return handles;
  }, []);

  // ── logout ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refresh = api.getRefreshToken();
    try { await api.post('/auth/logout/', { refresh }); } catch { /* best-effort */ }
    api.clearTokens();
    _clearGuest();
    setUser(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── update user globally ─────────────────────────────────────────
  const updateUser = useCallback((data) => {
    setUser(prev => prev ? { ...prev, ...data } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isGuest,
      guestHandles,
      isAuthenticated: !!user,
      hasAccess: !!user || isGuest,
      login,
      register,
      loginFromOAuth,
      loginAsGuest,
      promoteGuest,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
