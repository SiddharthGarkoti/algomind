import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Hydrate user profile immediately from localStorage for instant rendering
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // If no access token exists, or if profile is already hydrated from cache, loading is false immediately
  const [loading, setLoading] = useState(() => {
    if (!api.getToken()) return false;
    const saved = localStorage.getItem('user');
    return !saved;
  });

  const [isGuest,      setIsGuest]      = useState(false);
  const [guestHandles, setGuestHandles] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('guest_handles') || '{}'); }
    catch { return {}; }
  });

  // Helper to keep React state and localStorage cache in sync
  const _setUserAndCache = useCallback((profile) => {
    setUser(profile);
    if (profile) {
      try { localStorage.setItem('user', JSON.stringify(profile)); } catch {}
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  // On mount: restore real auth OR restore guest session, and revalidate profile in background
  useEffect(() => {
    const handleExpired = () => {
      api.clearTokens();
      _setUserAndCache(null);
      setLoading(false);
    };
    window.addEventListener('algomind:auth-expired', handleExpired);

    // Restore guest session across page refreshes
    if (sessionStorage.getItem('guest_handles')) {
      setIsGuest(true);
    }

    // If no JWT stored, finalize not loading
    if (!api.getToken()) {
      _setUserAndCache(null);
      setLoading(false);
      return () => window.removeEventListener('algomind:auth-expired', handleExpired);
    }

    // Validate token and refresh cached profile from backend
    api.get('/auth/profile/', { noCache: true })
      .then(p => {
        if (p && typeof p.streak === 'number' && p.streak > 100) p.streak = 1;
        _setUserAndCache(p);
        api.post('/analytics/sync/').catch(() => {});
      })
      .catch((err) => {
        if (err?.detail?.includes('401') || err?.status === 401) {
          api.clearTokens();
          _setUserAndCache(null);
        }
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('algomind:auth-expired', handleExpired);
  }, [_setUserAndCache]);

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
    const profile = await api.get('/auth/profile/', { noCache: true });
    if (profile && typeof profile.streak === 'number' && profile.streak > 100) profile.streak = 1;
    _setUserAndCache(profile);
    _clearGuest();
    // Auto-sync platform profiles on login
    api.post('/analytics/sync/').catch(() => {});
    return profile;
  }, [_setUserAndCache]);

  // ── register ─────────────────────────────────────────────────────
  const register = useCallback(async (username, email, password, password2, otp = '') => {
    const data = await api.post('/auth/register/', { username, email, password, password2, otp });
    api.setTokens(data.access, data.refresh);
    _setUserAndCache(data.user);
    _clearGuest();
    // Auto-sync platform profiles on registration/login
    api.post('/analytics/sync/').catch(() => {});
    return data.user;
  }, [_setUserAndCache]);

  // ── OAuth login (called by OAuthCallbackPage) ─────────────────────
  const loginFromOAuth = useCallback(async (access, refresh) => {
    api.setTokens(access, refresh);
    const profile = await api.get('/auth/profile/', { noCache: true });
    if (profile && typeof profile.streak === 'number' && profile.streak > 100) profile.streak = 1;
    _setUserAndCache(profile);
    _clearGuest();
    // Auto-sync platform profiles on login
    api.post('/analytics/sync/').catch(() => {});
    return profile;
  }, [_setUserAndCache]);

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
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh }).catch(() => {});
      }
    } catch {
      /* best-effort */
    } finally {
      api.clearTokens();
      _clearGuest();
      _setUserAndCache(null);
      setLoading(false);
      window.location.href = '/';
    }
  }, [_setUserAndCache]);

  // ── update user globally ─────────────────────────────────────────
  const updateUser = useCallback((data) => {
    setUser(prev => {
      const next = prev ? { ...prev, ...data } : prev;
      if (next) {
        try { localStorage.setItem('user', JSON.stringify(next)); } catch {}
      }
      return next;
    });
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
