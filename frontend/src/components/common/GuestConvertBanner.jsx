import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

/* Pages where the banner should NOT show */
const HIDDEN_ON = ['/', '/support', '/privacy', '/plans', '/payment'];

function GuestConvertBanner() {
  const { isGuest, isAuthenticated, guestHandles, login, register, promoteGuest } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [open,      setOpen]      = useState(false);
  const [mode,      setMode]      = useState('register'); // 'login' | 'register'
  const [email,     setEmail]     = useState('');
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [error,     setError]     = useState('');
  const [busy,      setBusy]      = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || isAuthenticated || dismissed) return null;
  if (HIDDEN_ON.includes(location.pathname)) return null;

  const hasHandles = guestHandles.leetcode || guestHandles.codeforces;

  function extractError(err) {
    if (!err) return 'Something went wrong.';
    if (typeof err === 'string') return err;
    return err.detail ?? err.non_field_errors?.[0] ?? err.email?.[0] ?? err.username?.[0] ?? err.password?.[0] ?? err.password2?.[0] ?? 'Something went wrong.';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== password2) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password, password2);
      }
      // Connect guest handles to the newly authenticated account
      if (hasHandles) {
        await promoteGuest(guestHandles);
      }
      setOpen(false);
      // Refresh current page data by navigating to same path
      navigate(location.pathname, { replace: true });
      // Small delay then reload to refresh all data
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating pill banner */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff', maxWidth: 'calc(100vw - 32px)' }}>
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-none">Guest Mode</p>
          <p className="text-[10px] opacity-80 mt-0.5 truncate">
            {hasHandles ? 'Save your progress & unlock full features' : 'Create an account to save your data'}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/20 hover:bg-white/30 transition-colors shrink-0">
          Save Account
        </button>
        <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 transition-opacity ml-1 shrink-0">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Auth modal */}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-[#1b1c1e] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-white/10"
            onClick={e => e.stopPropagation()}>
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Save your account</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {hasHandles
                      ? 'Your LeetCode/CF data will be linked automatically'
                      : 'Create an account to access all features'}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-gray-500">close</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 mb-5">
                {[['register', 'Create Account'], ['login', 'Sign In']].map(([m, label]) => (
                  <button key={m} type="button"
                    onClick={() => { setMode(m); setError(''); }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={mode === m ? { background: '#6366F1', color: '#fff' } : { color: '#64748B' }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Linked handles preview */}
              {hasHandles && (
                <div className="mb-4 p-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: '#6366F1' }}>link</span>
                  <p className="text-xs" style={{ color: '#6366F1' }}>
                    Will link: {[guestHandles.leetcode && `LC: @${guestHandles.leetcode}`, guestHandles.codeforces && `CF: @${guestHandles.codeforces}`].filter(Boolean).join('  •  ')}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <input type="text" placeholder="Username" required value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A0A0B] border border-gray-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-sm" />
                )}
                <input type="email" placeholder="Email address" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A0A0B] border border-gray-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-sm" />
                <input type="password" placeholder="Password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A0A0B] border border-gray-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-sm" />
                {mode === 'register' && (
                  <input type="password" placeholder="Confirm password" required value={password2}
                    onChange={e => setPassword2(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A0A0B] border border-gray-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-sm" />
                )}

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <button type="submit" disabled={busy}
                  className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                  style={{ background: '#6366F1', color: '#fff' }}>
                  {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {mode === 'register' ? 'Create Account & Save Data' : 'Sign In & Link Platforms'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GuestConvertBanner;
