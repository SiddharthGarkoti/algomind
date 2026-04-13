import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import PlanNavbar     from '../../components/plan/PlanNavbar.jsx';
import StatsCard      from '../../components/plan/StatsCard.jsx';
import PlanCustomizer from '../../components/plan/PlanCustomizer.jsx';
import TopicsModal    from '../../components/plan/TopicsModal.jsx';
import SignInModal    from '../../components/login/SignInModal.jsx';
import { useAuth }    from '../../context/AuthContext.jsx';
import api            from '../../utils/api.js';
import { API_BASE_URL } from '../../config.js';
const FALLBACK_TOPICS = ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming'];

/* Fetch public preview stats (no auth required) */
async function fetchPreview(platform, handle) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analytics/preview/${platform}/${encodeURIComponent(handle)}/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.detail) return null;
    // Shape it like a platform profile so StatsCard can use it
    return {
      platform_name: platform,
      handle,
      stats: {
        problems_solved: data.problems_solved ?? 0,
        easy_solved:     data.easy_solved     ?? 0,
        medium_solved:   data.medium_solved   ?? 0,
        hard_solved:     data.hard_solved     ?? 0,
        rating:          data.rating          ?? 0,
        contests:        data.contests        ?? 0,
      },
      topic_stats: [],
      isGuest: true,
    };
  } catch {
    return null;
  }
}

function PlanPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const { isAuthenticated, isGuest, guestHandles } = useAuth();

  const [platform,         setPlatform]         = useState('lc');
  const [intensity,        setIntensity]        = useState('Balanced');
  const [currentSelection, setCurrentSelection] = useState([]);
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [showSignIn,       setShowSignIn]       = useState(false);
  const [showUsePlanModal, setShowUsePlanModal] = useState(false); // 2-choice gate

  const [lcStats,   setLcStats]   = useState(null);
  const [cfStats,   setCfStats]   = useState(null);
  const [weakAreas, setWeakAreas] = useState([]);
  const [aiPlan,    setAiPlan]    = useState(null);

  const [loading,   setLoading]   = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const seededRef = useRef(false);

  /* ── Fetch data depending on auth state ── */
  useEffect(() => {
    seededRef.current = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
          /* Real user: authenticated endpoints */
          const [analyticsRes, weakRes] = await Promise.allSettled([
            api.get('/analytics/dashboard/'),
            api.get('/analytics/weak-areas/'),
          ]);

          if (analyticsRes.status === 'fulfilled') {
            const platforms = analyticsRes.value?.platforms ?? [];
            setLcStats(platforms.find(p => p.platform_name === 'leetcode') ?? null);
            setCfStats(platforms.find(p => p.platform_name === 'codeforces') ?? null);
          }

          if (weakRes.status === 'fulfilled') {
            const areas = weakRes.value?.weak_areas ?? [];
            setWeakAreas(areas);
            if (!seededRef.current) {
              seededRef.current = true;
              const weakNames = areas
                .filter(w => w.status === 'weak' || w.status === 'improving')
                .slice(0, 5)
                .map(w => w.topic_name);
              setCurrentSelection(weakNames.length >= 3 ? weakNames : FALLBACK_TOPICS);
            }
          } else if (!seededRef.current) {
            seededRef.current = true;
            setCurrentSelection(FALLBACK_TOPICS);
          }

        } else if (isGuest && (guestHandles.leetcode || guestHandles.codeforces)) {
          /* Guest: fetch live preview stats without auth */
          const [lcPreview, cfPreview] = await Promise.all([
            guestHandles.leetcode   ? fetchPreview('leetcode',   guestHandles.leetcode)   : Promise.resolve(null),
            guestHandles.codeforces ? fetchPreview('codeforces', guestHandles.codeforces) : Promise.resolve(null),
          ]);
          setLcStats(lcPreview);
          setCfStats(cfPreview);

          if (!seededRef.current) {
            seededRef.current = true;
            setCurrentSelection(FALLBACK_TOPICS);
          }
        } else {
          if (!seededRef.current) {
            seededRef.current = true;
            setCurrentSelection(FALLBACK_TOPICS);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAuthenticated, isGuest, guestHandles]);

  /* ── Generate AI plan when intensity changes (after initial load) ── */
  const generatePlan = useCallback(async (chosenIntensity) => {
    if (!isAuthenticated) return;  // AI plan requires auth
    setAiLoading(true);
    setAiPlan(null);
    try {
      const result = await api.post('/ai/generate-plan/', { intensity: chosenIntensity });
      setAiPlan(result);
      if (result?.topics?.length) {
        const aiTopics = result.topics.map(t => t.name);
        setCurrentSelection(prev => {
          const isDefault = prev.every(p => FALLBACK_TOPICS.includes(p) || weakAreas.some(w => w.topic_name === p));
          return isDefault ? aiTopics.slice(0, 6) : prev;
        });
      }
    } catch {
      /* keep aiPlan null */
    } finally {
      setAiLoading(false);
    }
  }, [isAuthenticated, weakAreas]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      generatePlan(intensity);
    }
  }, [intensity, loading, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handlers ── */
  const handleTopicClick = (topicName) => {
    setCurrentSelection(prev => {
      if (prev.length <= 3) return prev;
      return prev.filter(t => t !== topicName);
    });
  };

  const handleApply = (newSelection) => setCurrentSelection(newSelection);

  const handleUsePlan = () => {
    if (!isAuthenticated) {
      setShowUsePlanModal(true); // show 2-choice gate
      return;
    }
    const el = document.querySelector('main');
    if (el) { el.style.transition = 'opacity 0.45s ease'; el.style.opacity = '0'; }
    setTimeout(() => navigate('/plan-view'), 450);
  };

  const handleSignInSuccess = () => {
    setShowSignIn(false);
    navigate('/dashboard');
  };

  /* Guest chose "Continue as Guest" from the use-plan gate */
  const handleContinueAsGuest = () => {
    setShowUsePlanModal(false);
    const el = document.querySelector('main');
    if (el) { el.style.transition = 'opacity 0.45s ease'; el.style.opacity = '0'; }
    setTimeout(() => navigate('/plan-view'), 450);
  };

  /* Guest chose "Login" from the use-plan gate */
  const handleUsePlanLogin = () => {
    setShowUsePlanModal(false);
    setShowSignIn(true);
  };

  return (
    <div
      className="plan-page min-h-screen flex flex-col transition-colors duration-300"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 40%), #0A0A0B'
          : 'linear-gradient(180deg, #FAFAFF 0%, #F0EDFF 50%, #F5F3FF 100%)',
      }}
    >
      <PlanNavbar isDark={isDark} toggleTheme={toggleTheme} />

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={handleSignInSuccess}
      />

      {/* 2-Choice gate: shown when an unauthenticated user clicks "Use Plan" */}
      {showUsePlanModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setShowUsePlanModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1b1c1e] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-gray-200 dark:border-white/10 p-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Use This Plan</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">How would you like to continue?</p>
              </div>
              <button
                onClick={() => setShowUsePlanModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Login */}
              <button
                onClick={handleUsePlanLogin}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all border border-gray-200 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/5 group"
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                  style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}
                >
                  <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                </span>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Login to use all features</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Save progress, track streaks & use AI coach</p>
                </div>
              </button>

              {/* Option 2: Guest */}
              <button
                onClick={handleContinueAsGuest}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/5 group"
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform bg-gray-100 dark:bg-white/10"
                >
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </span>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Continue as Guest</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Preview the plan without an account</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow w-full max-w-[1100px] mx-auto flex flex-col space-y-12 px-6 py-10 lg:px-12">
        <header className="space-y-3">
          <h1
            className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tighter"
            style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}
          >
            Your Personalized Plan.
          </h1>
          <p className="max-w-xl text-lg font-light leading-relaxed" style={{ color: isDark ? '#908fa0' : '#475569' }}>
            {loading
              ? 'Analyzing your performance…'
              : (lcStats || cfStats)
                ? 'We\'ve analyzed your performance to calibrate a curriculum focused on high-growth potential areas.'
                : isGuest
                  ? 'Connect your platforms in Settings to get a personalised AI-powered study plan.'
                  : 'Connect your platforms to get a personalised AI-powered study plan.'}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <StatsCard
            platform={platform}
            onSwitch={setPlatform}
            isDark={isDark}
            lcStats={lcStats}
            cfStats={cfStats}
            loading={loading}
            onSaveAccount={isGuest && !isAuthenticated ? () => setShowSignIn(true) : null}
          />
          <PlanCustomizer
            intensity={intensity}
            onIntensity={setIntensity}
            currentSelection={currentSelection}
            onTopicClick={handleTopicClick}
            onOpenModal={() => setIsModalOpen(true)}
            onUsePlan={handleUsePlan}
            onCustomize={() => setIsModalOpen(true)}
            weakAreas={weakAreas}
            aiPlan={isAuthenticated ? aiPlan : null}
            aiLoading={isAuthenticated ? aiLoading : false}
            isDark={isDark}
          />
        </div>
      </main>

      <TopicsModal
        isOpen={isModalOpen}
        currentSelection={currentSelection}
        initialTopics={FALLBACK_TOPICS}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApply}
        isDark={isDark}
      />
    </div>
  );
}

export default PlanPage;
