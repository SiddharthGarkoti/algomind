import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import { API_BASE_URL } from '../../config.js';
/* Platform icons as inline SVG */
const LeetCodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
  </svg>
);

const CodeforcesIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5h-3C.672 21 0 20.328 0 19.5V9c0-.828.672-1.5 1.5-1.5h3zm9-4.5c.828 0 1.5.672 1.5 1.5V19.5c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V4.5C9 3.672 9.672 3 10.5 3h3zm9 7.5c.828 0 1.5.672 1.5 1.5v9c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-9c0-.828.672-1.5 1.5-1.5h3z"/>
  </svg>
);

function ConnectPlatformsPage() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [lc,       setLc]       = useState('');
  const [cf,       setCf]       = useState('');
  const [lcError,  setLcError]  = useState('');
  const [cfError,  setCfError]  = useState('');
  const [genError, setGenError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState('enter'); // 'enter' | 'success'

  useEffect(() => { if (lc) setLcError(''); }, [lc]);
  useEffect(() => { if (cf) setCfError(''); }, [cf]);

  const validateHandle = async (platform, handle) => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/analytics/validate/${platform}/${encodeURIComponent(handle)}/`);
      const data = await res.json();
      return data.valid !== false;
    } catch { return true; }
  };

  const handleConnect = async () => {
    const lcTrim = lc.trim();
    const cfTrim = cf.trim();

    if (!lcTrim && !cfTrim) {
      setGenError('Please enter at least one username to continue.');
      return;
    }
    setGenError('');
    setLcError('');
    setCfError('');
    setLoading(true);

    // Validate both in parallel
    const [lcValid, cfValid] = await Promise.all([
      lcTrim ? validateHandle('leetcode',   lcTrim) : Promise.resolve(null),
      cfTrim ? validateHandle('codeforces', cfTrim) : Promise.resolve(null),
    ]);

    let hasError = false;
    if (lcTrim && lcValid === false) { setLcError('LeetCode username not found.'); hasError = true; }
    if (cfTrim && cfValid === false) { setCfError('Codeforces handle not found.'); hasError = true; }
    if (hasError) { setLoading(false); return; }

    // Connect to backend
    await Promise.all([
      lcTrim ? api.post('/analytics/connect/', { platform_name: 'leetcode',   handle: lcTrim }).catch(() => {}) : null,
      cfTrim ? api.post('/analytics/connect/', { platform_name: 'codeforces', handle: cfTrim }).catch(() => {}) : null,
    ].filter(Boolean));

    setLoading(false);
    setStep('success');
    setTimeout(() => navigate('/goal'), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0A0A0B] p-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-purple-600/10 to-transparent pointer-events-none rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-indigo-600/10 to-transparent pointer-events-none rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/30 mb-4">
            <span className="text-white font-bold text-xl">AM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Connect your profiles
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user ? `Welcome, ${user.username}! ` : ''}
            Link your coding platforms so AlgoMind can personalise your experience.
          </p>
        </div>

        {step === 'success' ? (
          /* ── Success state ── */
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">All set!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Taking you to the next step…</p>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-xl space-y-5">

            {/* LeetCode */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="text-[#FFA116]"><LeetCodeIcon /></span>
                LeetCode username
              </label>
              <input
                id="lc-username"
                type="text"
                placeholder="e.g. neal_wu"
                value={lc}
                onChange={e => setLc(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0A0A0B] outline-none transition-all
                  ${lcError
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/40'
                    : 'border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500'
                  }`}
              />
              {lcError && <p className="text-xs text-red-500">{lcError}</p>}
            </div>

            {/* Codeforces */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="text-[#1A90E0]"><CodeforcesIcon /></span>
                Codeforces handle
              </label>
              <input
                id="cf-handle"
                type="text"
                placeholder="e.g. tourist"
                value={cf}
                onChange={e => setCf(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0A0A0B] outline-none transition-all
                  ${cfError
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/40'
                    : 'border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500'
                  }`}
              />
              {cfError && <p className="text-xs text-red-500">{cfError}</p>}
            </div>

            {genError && (
              <p className="text-xs text-center text-amber-500 bg-amber-500/10 rounded-lg py-2 px-3">{genError}</p>
            )}

            <button
              id="connect-platforms-btn"
              onClick={handleConnect}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {loading ? 'Validating…' : 'Connect & Continue'}
            </button>

            <div className="text-center">
              <button
                id="skip-platforms-btn"
                onClick={() => navigate('/dashboard')}
                className="text-xs text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors underline underline-offset-2"
              >
                Skip for now — I'll connect later in Settings
              </button>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-purple-600" />
          <div className="w-6 h-1 rounded-full bg-purple-600" />
          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export default ConnectPlatformsPage;
