import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import PlanNavbar     from '../../components/plan/PlanNavbar.jsx';
import StatsCard      from '../../components/plan/StatsCard.jsx';
import PlanCustomizer from '../../components/plan/PlanCustomizer.jsx';
import TopicsModal    from '../../components/plan/TopicsModal.jsx';
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
  const [showConvert,      setShowConvert]      = useState(false);

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
    if (!isAuthenticated && isGuest) {
      setShowConvert(true);
      return;
    }
    const el = document.querySelector('main');
    if (el) { el.style.transition = 'opacity 0.45s ease'; el.style.opacity = '0'; }
    setTimeout(() => navigate('/plan-view'), 450);
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

      {/* Guest convert inline prompt */}
      {showConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowConvert(false)}>
          <div className="bg-white dark:bg-[#1b1c1e] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
              Save your plan
            </h3>
            <p className="text-sm mb-6" style={{ color: isDark ? '#908fa0' : '#64748B' }}>
              Create a free account to save your plan, track progress, and unlock AI recommendations.
            </p>
            <button
              className="w-full py-3 rounded-xl font-bold text-sm mb-3"
              style={{ background: '#6366F1', color: '#fff' }}
              onClick={() => { setShowConvert(false); navigate('/'); }}>
              Create Account / Sign In
            </button>
            <button
              className="w-full py-2 text-sm rounded-xl"
              style={{ color: isDark ? '#908fa0' : '#64748B' }}
              onClick={() => { setShowConvert(false); navigate('/plan-view'); }}>
              Continue as guest
            </button>
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
            onSaveAccount={isGuest && !isAuthenticated ? () => navigate('/') : null}
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
