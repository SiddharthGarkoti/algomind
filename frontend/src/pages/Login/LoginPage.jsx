import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import { API_BASE_URL } from '../../config.js';
import Navbar      from '../../components/login/Navbar.jsx';
import HeroSection from '../../components/login/HeroSection.jsx';
import AnalyzeCard from '../../components/login/AnalyzeCard.jsx';
import SignInModal  from '../../components/login/SignInModal.jsx';
import GraphConstellationBackground from '../../components/login/GraphConstellationBackground.jsx';

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
    <div className="login-page min-h-screen flex flex-col font-body overflow-x-hidden selection:bg-purple-500/30 bg-[#F8F9FE] dark:bg-[#0A0A0C] text-gray-900 dark:text-gray-200 transition-colors duration-300 relative">

      {/* High-tech engineering dot-matrix background mesh — adds rich texture in both light and dark mode */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-70 dark:opacity-40"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(rgba(168, 85, 247, 0.16) 1.2px, transparent 1.2px)'
            : 'radial-gradient(rgba(99, 102, 241, 0.18) 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at 50% 45%, black 45%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, black 45%, transparent 85%)',
        }}
      />

      {/* Ambient lighting pools */}
      <div className="fixed -top-24 -right-24 w-[600px] h-[600px] bg-gradient-to-bl from-purple-500/20 via-indigo-500/15 to-transparent blur-[140px] pointer-events-none -z-20" />
      <div className="fixed -bottom-24 -left-24 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/18 via-cyan-500/12 to-transparent blur-[140px] pointer-events-none -z-20" />

      {/* 3D Holographic Cube & Constellation — full viewport coverage */}
      <GraphConstellationBackground isDark={isDark} />

      <Navbar isDark={isDark} toggleTheme={toggleTheme} onSignIn={() => setIsModalOpen(true)} />

      <main className="min-h-[calc(100vh-144px)] flex flex-col md:flex-row w-full max-w-7xl mx-auto relative">
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
      <footer className="w-full border-t border-gray-200/60 dark:border-white/5 bg-white/70 dark:bg-black/30 backdrop-blur-md relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-8 w-full max-w-7xl mx-auto gap-4">
          <p className="font-inter text-[12px] uppercase tracking-widest text-gray-500 dark:text-gray-500 font-medium">
            © AlgoMind
          </p>
          <div className="flex gap-8">
            <button className="font-inter text-[12px] uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
              onClick={() => navigate('/support')}>Support</button>
            <button className="font-inter text-[12px] uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
              onClick={() => navigate('/privacy')}>Privacy</button>
          </div>
        </div>
      </footer>

      <SignInModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default LoginPage;
