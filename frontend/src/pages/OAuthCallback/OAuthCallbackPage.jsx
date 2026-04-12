import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

/**
 * OAuthCallbackPage
 *
 * Landed on after the backend OAuth callback redirects with:
 *   ?access=<jwt>&refresh=<jwt>&is_new=true|false
 *
 * NEW users  → /connect-platforms (enter LeetCode / Codeforces handle)
 * OLD users  → /dashboard
 * Error      → / (login page with error param)
 */
function OAuthCallbackPage() {
  const navigate  = useNavigate();
  const { loginFromOAuth } = useAuth();
  const processed = useRef(false);   // guard against double-run in StrictMode

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params   = new URLSearchParams(window.location.search);
    const access   = params.get('access');
    const refresh  = params.get('refresh');
    const isNew    = params.get('is_new') === 'true';
    const error    = params.get('error');

    if (error) {
      navigate(`/?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!access || !refresh) {
      navigate('/?error=oauth_failed', { replace: true });
      return;
    }

    // Store tokens + hydrate the user object
    loginFromOAuth(access, refresh).then(() => {
      if (isNew) {
        navigate('/connect-platforms', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }).catch(() => {
      api.clearTokens();
      navigate('/?error=profile_load_failed', { replace: true });
    });
  }, [loginFromOAuth, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0A0A0B] gap-4">
      <div className="w-10 h-10 border-[3px] border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
        Signing you in…
      </p>
    </div>
  );
}

export default OAuthCallbackPage;
