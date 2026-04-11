import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar      from '../../components/login/Navbar.jsx';
import HeroSection from '../../components/login/HeroSection.jsx';
import AnalyzeCard from '../../components/login/AnalyzeCard.jsx';
import SignInModal  from '../../components/login/SignInModal.jsx';

function LoginPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();

  const [lcUsername,  setLcUsername]  = useState('');
  const [cfUsername,  setCfUsername]  = useState('');
  const [error,       setError]       = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(false), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleInputChange = (field, value) => {
    if (field === 'lcUsername') setLcUsername(value);
    if (field === 'cfUsername') setCfUsername(value);
  };

  const handleAnalyze = () => {
    const lc = lcUsername.trim();
    const cf = cfUsername.trim();
    if (!lc && !cf) { setError(true); return; }
    setError(false);
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/goal'); }, 1500);
  };

  return (
    <div className="login-page min-h-screen flex flex-col font-body overflow-x-hidden selection:bg-purple-500/30 bg-gray-50 dark:bg-[#0A0A0B] text-gray-900 dark:text-gray-200 transition-colors duration-300">

      <Navbar isDark={isDark} toggleTheme={toggleTheme} onSignIn={() => setIsModalOpen(true)} />

      <main className="min-h-[calc(100vh-144px)] flex flex-col md:flex-row w-full max-w-7xl mx-auto relative overflow-hidden">
        <HeroSection />
        <AnalyzeCard
          lcUsername={lcUsername}
          cfUsername={cfUsername}
          error={error}
          loading={loading}
          onChange={handleInputChange}
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
            <button
              className="font-inter text-[12px] uppercase tracking-widest text-gray-400 dark:text-gray-600 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => navigate('/support')}
            >
              Support
            </button>
            <button
              className="font-inter text-[12px] uppercase tracking-widest text-gray-400 dark:text-gray-600 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => navigate('/privacy')}
            >
              Privacy
            </button>
          </div>
        </div>
      </footer>

      {/* Fixed Background Decoration */}
      <div className="fixed top-0 right-0 w-1/3 h-screen bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none -z-20" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/2 bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none -z-20" />

      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default LoginPage;
