import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import { API_BASE_URL } from '../../config.js';
import Navbar      from '../../components/login/Navbar.jsx';
import HeroSection from '../../components/login/HeroSection.jsx';
import AnalyzeCard from '../../components/login/AnalyzeCard.jsx';
import SignInModal  from '../../components/login/SignInModal.jsx';

function LoginPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const { isAuthenticated, loginAsGuest } = useAuth();

  const [lcUsername,  setLcUsername]  = useState('');
  const [cfUsername,  setCfUsername]  = useState('');
  const [lcError,     setLcError]     = useState('');   // per-field error
  const [cfError,     setCfError]     = useState('');
  const [generalError,setGeneralError]= useState('');
  const [loading,     setLoading]     = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Clear errors when user types
  useEffect(() => { if (lcUsername) setLcError(''); }, [lcUsername]);
  useEffect(() => { if (cfUsername) setCfError(''); }, [cfUsername]);

  /* Validate a single handle against the backend (no auth required) */
  const validateHandle = async (platform, handle) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/validate/${platform}/${encodeURIComponent(handle)}/`);
      const data = await res.json();
      return data.valid !== false;   // treat API errors as valid (fail-open)
    } catch {
      return true;   // network error → proceed anyway
    }
  };

  /* Connect a platform for an authenticated user */
  const connectPlatform = (platform, handle) =>
    api.post('/analytics/connect/', { platform_name: platform, handle }).catch(() => {});

  /* Called when user clicks "Analyze My Profile" */
  const handleAnalyze = async () => {
    const lc = lcUsername.trim();
    const cf = cfUsername.trim();

    if (!lc && !cf) {
      setGeneralError('Please enter at least one username.');
      return;
    }
    setGeneralError('');
    setLcError('');
    setCfError('');
    setLoading(true);

    // Validate entered handles in parallel
    const [lcValid, cfValid] = await Promise.all([
      lc ? validateHandle('leetcode',   lc) : Promise.resolve(null),
      cf ? validateHandle('codeforces', cf) : Promise.resolve(null),
    ]);

    // Check for clear "not found" responses
    let hasError = false;
    if (lc && lcValid === false) { setLcError('LeetCode username not found — check the spelling.'); hasError = true; }
    if (cf && cfValid === false) { setCfError('Codeforces handle not found — check the spelling.'); hasError = true; }

    if (hasError) {
      setLoading(false);
      return;
    }

    // At least one valid handle — proceed
    if (isAuthenticated) {
      // Real user: connect platforms, then go to goal selection
      await Promise.all([
        lc ? connectPlatform('leetcode',   lc) : null,
        cf ? connectPlatform('codeforces', cf) : null,
      ].filter(Boolean));
      setLoading(false);
      navigate('/goal');
    } else {
      // Guest: store handles in session, go to goal selection
      loginAsGuest(lc, cf);
      setLoading(false);
      navigate('/goal');
    }
  };

  /* After signing in/registering via the modal */
  const handleAuthSuccess = async () => {
    setIsModalOpen(false);
    const lc = lcUsername.trim();
    const cf = cfUsername.trim();

    if (lc || cf) {
      // Handles were typed — connect them and go to goal selection
      setLoading(true);
      await Promise.all([
        lc ? connectPlatform('leetcode',   lc) : null,
        cf ? connectPlatform('codeforces', cf) : null,
      ].filter(Boolean));
      setLoading(false);
      navigate('/goal');
    } else {
      // No handles typed — send them to Settings to connect platforms first
      navigate('/settings');
    }
  };

  return (
    <div className="login-page min-h-screen flex flex-col font-body overflow-x-hidden selection:bg-purple-500/30 bg-gray-50 dark:bg-[#0A0A0B] text-gray-900 dark:text-gray-200 transition-colors duration-300">

      <Navbar isDark={isDark} toggleTheme={toggleTheme} onSignIn={() => setIsModalOpen(true)} />

      <main className="min-h-[calc(100vh-144px)] flex flex-col md:flex-row w-full max-w-7xl mx-auto relative overflow-hidden">
        <HeroSection />
        <AnalyzeCard
          lcUsername={lcUsername}
          cfUsername={cfUsername}
          lcError={lcError}
          cfError={cfError}
          generalError={generalError}
          loading={loading}
          onChange={(field, val) => {
            if (field === 'lcUsername') setLcUsername(val);
            if (field === 'cfUsername') setCfUsername(val);
          }}
          onSubmit={handleAnalyze}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-8 w-full max-w-7xl mx-auto gap-4">
          <p className="font-inter text-[12px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            © AlgoMind — Built by Bhayankar Coders
          </p>
          <div className="flex gap-8">
            <button className="font-inter text-[12px] uppercase tracking-widest text-gray-400 dark:text-gray-600 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => navigate('/support')}>Support</button>
            <button className="font-inter text-[12px] uppercase tracking-widest text-gray-400 dark:text-gray-600 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => navigate('/privacy')}>Privacy</button>
          </div>
        </div>
      </footer>

      <div className="fixed top-0 right-0 w-1/3 h-screen bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none -z-20" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/2 bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none -z-20" />

      <SignInModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default LoginPage;
