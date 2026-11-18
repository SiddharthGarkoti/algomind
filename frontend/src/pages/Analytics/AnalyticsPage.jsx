import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import SignInModal from '../../components/login/SignInModal.jsx';
import api from '../../utils/api.js';

/* ── Donut SVG ── */
function SolvedDonut({ easy, medium, hard, surfLow, textPri, textSec }) {
  const R     = 40;
  const circ  = 2 * Math.PI * R;
  const total = easy + medium + hard;

  const easyLen   = total > 0 ? (easy   / total) * circ : 0;
  const medLen    = total > 0 ? (medium / total) * circ : 0;
  const hardLen   = total > 0 ? (hard   / total) * circ : 0;

  return (
    <div className="relative shrink-0 w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke={surfLow} strokeWidth="10" />
        {easyLen > 0 && (
          <circle cx="50" cy="50" r={R} fill="none" stroke="#6366F1" strokeWidth="10"
            strokeDasharray={`${easyLen} ${circ}`} strokeLinecap="round" />
        )}
        {medLen > 0 && (
          <circle cx="50" cy="50" r={R} fill="none" stroke="#A855F7" strokeWidth="10"
            strokeDasharray={`${medLen} ${circ}`} strokeDashoffset={`-${easyLen}`} strokeLinecap="round" />
        )}
        {hardLen > 0 && (
          <circle cx="50" cy="50" r={R} fill="none" stroke="#C084FC" strokeWidth="10"
            strokeDasharray={`${hardLen} ${circ}`} strokeDashoffset={`-${easyLen + medLen}`} strokeLinecap="round" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>{total}</span>
        <span className="text-xs font-medium mt-0.5" style={{ color: textSec }}>solved</span>
      </div>
    </div>
  );
}

/* ── Main page ── */
function AnalyticsPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#292a2c' : '#F8FAFC';
  const border  = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  const { user, isGuest } = useAuth();

  const [solvedTab,    setSolvedTab]    = useState('total');
  const [platforms,    setPlatforms]    = useState(null);   // null = loading
  const [summary,      setSummary]      = useState(null);
  const [topics,       setTopics]       = useState([]);
  const [recentSubs,   setRecentSubs]   = useState([]);
  const [refreshing,   setRefreshing]   = useState('');
  const [showSignIn,   setShowSignIn]   = useState(false);

  const hasRealData = platforms !== null && platforms.length > 0;

  useEffect(() => {
    api.get('/analytics/dashboard/')
      .then(d => {
        setPlatforms(d.platforms ?? []);
        setSummary(d.summary ?? {});
      })
      .catch(() => setPlatforms([]));

    api.get('/analytics/weak-areas/')
      .then(d => setTopics(d.weak_areas ?? []))
      .catch(() => {});

    // Real recent submissions from LeetCode + Codeforces
    api.get('/analytics/recent-submissions/')
      .then(d => setRecentSubs(d?.submissions ?? []))
      .catch(() => {});
  }, []);

  const refreshPlatform = async (platform) => {
    setRefreshing(platform);
    try {
      const updated = await api.post(`/analytics/refresh/${platform}/`);
      setPlatforms(prev => prev.map(p => p.platform_name === platform ? updated : p));
    } catch { /* ignore */ }
    finally { setRefreshing(''); }
  };

  /* Build solved stats for current tab */
  const statsFor = (platformName) => {
    const maxPlatformStreak = platforms?.reduce((max, p) => Math.max(max, p.stats?.streak ?? 0), 0) ?? 0;
    const bestStreak = summary?.streak || maxPlatformStreak || user?.streak || 0;
    if (platformName === 'total') {
      return {
        easy:   summary?.easy_solved   ?? platforms?.reduce((s,p)=>s+(p.stats?.easy_solved??0),0) ?? 0,
        medium: summary?.medium_solved ?? platforms?.reduce((s,p)=>s+(p.stats?.medium_solved??0),0) ?? 0,
        hard:   summary?.hard_solved   ?? platforms?.reduce((s,p)=>s+(p.stats?.hard_solved??0),0) ?? 0,
        total:  summary?.total_problems_solved ?? 0,
        rating: summary?.average_rating ?? 0,
        streak: bestStreak,
        url:    null,
      };
    }
    const p = platforms?.find(pl => pl.platform_name === platformName);
    const s = p?.stats ?? {};
    return {
      easy:   s.easy_solved   ?? 0,
      medium: s.medium_solved ?? 0,
      hard:   s.hard_solved   ?? 0,
      total:  s.problems_solved ?? 0,
      rating: s.rating ?? 0,
      streak: (s.streak && s.streak > 0) ? s.streak : bestStreak,
      url:    platformName === 'leetcode'   ? `https://leetcode.com/${p?.handle ?? ''}`
            : platformName === 'codeforces' ? `https://codeforces.com/profile/${p?.handle ?? ''}`
            : null,
      handle: p?.handle,
    };
  };

  const currentStats = statsFor(solvedTab);

  /* Topic classification */
  const weakTopics     = topics.filter(t => t.status === 'weak');
  const strengthTopics = topics.filter(t => t.status === 'strength');

  /* Which platform tabs exist */
  const availablePlatforms = [
    { key: 'total',      label: 'Total'    },
    ...(platforms ?? []).map(p => ({
      key:   p.platform_name,
      label: p.platform_name === 'leetcode' ? 'LeetCode' : p.platform_name === 'codeforces' ? 'CF' : p.platform_name,
    })),
  ];

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-6xl mx-auto">

        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Your detailed performance breakdown</p>
        </div>

        {/* Loading skeleton */}
        {platforms === null && (
          <div className="text-center py-16" style={{ color: textSec }}>
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading your analytics…
          </div>
        )}

        {/* Guest sign-in banner */}
        {isGuest && (
          <div className="flex items-center justify-between gap-4 rounded-2xl p-4 border"
            style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl shrink-0" style={{ color: '#6366F1' }}>person_off</span>
              <div>
                <p className="text-sm font-bold" style={{ color: textPri }}>You're in guest mode</p>
                <p className="text-xs mt-0.5" style={{ color: textSec }}>
                  Sign in to save your progress, track history, and unlock full analytics.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSignIn(true)}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{ background: '#6366F1', color: '#fff' }}>
              Sign In
            </button>
          </div>
        )}

        {/* No platforms banner */}
        {platforms !== null && !hasRealData && (
          <div className="flex items-center gap-4 rounded-2xl p-4 border"
            style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <span className="material-symbols-outlined text-2xl shrink-0" style={{ color: '#6366F1' }}>link_off</span>
            <div>
              <p className="text-sm font-bold" style={{ color: textPri }}>No platforms connected yet</p>
              <p className="text-xs mt-0.5" style={{ color: textSec }}>
                Go to the home page, enter your LeetCode or Codeforces username and click <strong>Analyze My Profile</strong>.
              </p>
            </div>
          </div>
        )}

        {platforms !== null && hasRealData && (
          <>
            {/* ── Row 1: Problems Solved + Connected Platforms ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Problems Solved donut */}
              <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-headline font-bold" style={{ color: textPri }}>Problems Solved</h2>
                  <div className="flex gap-1 p-1 rounded-xl" style={{ background: surfLow, border: `1px solid ${border}` }}>
                    {availablePlatforms.map(({ key, label }) => (
                      <button key={key} onClick={() => setSolvedTab(key)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        style={solvedTab === key ? { background: '#6366F1', color: '#fff' } : { color: textSec }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <SolvedDonut
                    easy={currentStats.easy}
                    medium={currentStats.medium}
                    hard={currentStats.hard}
                    surfLow={surfLow}
                    textPri={textPri}
                    textSec={textSec}
                  />
                  <div className="flex-grow space-y-3">
                    {[
                      { label: 'Easy',   val: currentStats.easy,   color: '#6366F1' },
                      { label: 'Medium', val: currentStats.medium, color: '#A855F7' },
                      { label: 'Hard',   val: currentStats.hard,   color: '#C084FC' },
                    ].map(({ label, val, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color, fontWeight: 700 }}>{label}</span>
                          <span style={{ color: textSec }}>{val}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: surfLow }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${currentStats.total > 0 ? Math.round((val/currentStats.total)*100) : 0}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                    {currentStats.url && (
                      <a href={currentStats.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-75 mt-1"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>
                        View profile
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 flex items-center gap-4 flex-wrap" style={{ borderTop: `1px solid ${border}` }}>
                  <div className="flex items-center gap-1.5">
                    <span>🔥</span>
                    <span className="text-sm font-bold tracking-tight" style={{ color: textPri }}>{currentStats.streak}d streak</span>
                  </div>
                  <div className="h-3 w-px" style={{ background: border }} />
                  <span className="text-xs font-medium" style={{ color: textSec }}>Contest Rating: {currentStats.rating > 0 ? currentStats.rating : 'Unrated'}</span>
                </div>
              </div>

              {/* Connected Platforms */}
              <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
                <h2 className="text-sm font-headline font-bold mb-5" style={{ color: textPri }}>Connected Platforms</h2>
                <div className="space-y-4">
                  {platforms.map(p => {
                    const s = p.stats ?? {};
                    return (
                      <div key={p.id} className="rounded-xl p-4 sm:p-5"
                        style={{ background: surfLow, border: `1px solid ${border}` }}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-bold capitalize" style={{ color: textPri }}>{p.platform_name}</p>
                            <p className="text-xs" style={{ color: textSec }}>@{p.handle}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.25)' }}>Connected</span>
                            <button
                              disabled={refreshing === p.platform_name}
                              onClick={() => refreshPlatform(p.platform_name)}
                              className="p-1.5 rounded-lg transition-all hover:opacity-70 disabled:opacity-40 cursor-pointer"
                              style={{ background: 'rgba(99,102,241,0.1)' }}
                              title="Refresh stats">
                              <span className={`material-symbols-outlined text-sm ${refreshing === p.platform_name ? 'animate-spin' : ''}`}
                                style={{ color: '#818CF8' }}>sync</span>
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { label: 'Solved', val: s.problems_solved ?? 0 },
                            { label: 'Streak', val: `${(s.streak && s.streak > 0) ? s.streak : (summary?.streak || user?.streak || 0)}d` },
                            { label: 'Contests', val: s.contests ?? 0 },
                            { label: 'Rating', val: s.rating ?? 0 },
                          ].map(({ label, val }) => (
                            <div key={label}>
                              <p className="text-xl font-headline font-bold" style={{ color: '#A855F7' }}>{val}</p>
                              <p className="text-xs uppercase tracking-wider mt-0.5" style={{ color: textSec }}>{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Row 2: Topic Progress from real API ── */}
            {topics.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* Weak areas */}
                  <div>
                    <h2 className="text-sm font-headline font-bold mb-1" style={{ color: textPri }}>Weak Areas</h2>
                    <p className="text-xs mb-5" style={{ color: textSec }}>Topics with fewest problems solved — focus here</p>
                    <div className="space-y-3">
                      {weakTopics.slice(0, 8).map(t => {
                        const max = Math.max(...topics.map(x => x.problems_solved), 1);
                        const pct = Math.round((t.problems_solved / max) * 100);
                        return (
                          <div key={t.topic_slug}>
                            <div className="flex justify-between text-xs mb-1">
                              <span style={{ color: textPri, fontWeight: 600 }}>{t.topic_name}</span>
                              <span style={{ color: textSec, fontWeight: 600 }}>{t.problems_solved} solved</span>
                            </div>
                            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: surfLow }}>
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: 'rgba(168, 85, 247, 0.35)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h2 className="text-sm font-headline font-bold mb-1" style={{ color: textPri }}>Strengths</h2>
                    <p className="text-xs mb-5" style={{ color: textSec }}>Topics you've mastered</p>
                    <div className="space-y-3">
                      {strengthTopics.slice(0, 5).map(t => {
                        const max = Math.max(...topics.map(x => x.problems_solved), 1);
                        const pct = Math.round((t.problems_solved / max) * 100);
                        return (
                          <div key={t.topic_slug}>
                            <div className="flex justify-between text-xs mb-1">
                              <span style={{ color: textPri, fontWeight: 600 }}>{t.topic_name}</span>
                              <span style={{ color: '#C084FC', fontWeight: 600 }}>{t.problems_solved} solved</span>
                            </div>
                            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: surfLow }}>
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366F1, #A855F7)' }} />
                            </div>
                          </div>
                        );
                      })}
                      {strengthTopics.length === 0 && (
                        <p className="text-xs py-4" style={{ color: textSec }}>Keep solving problems to build strengths!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Row 3: Recent Submissions (real from DSA app) ── */}
            <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
              <h2 className="text-sm font-headline font-bold mb-4" style={{ color: textPri }}>Recent Accepted Submissions</h2>
              {recentSubs.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: textSec }}>
                  No recent submissions found. Connect a platform and solve problems to see them here.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSubs.slice(0, 15).map((sub, i) => {
                    const platformColor = sub.platform === 'leetcode' ? '#4F46E5' : '#7C3AED';
                    const platformLabel = sub.platform === 'leetcode' ? 'LC' : 'CF';
                    const dateStr = sub.timestamp
                      ? new Date(sub.timestamp * 1000).toLocaleDateString()
                      : '—';
                    return (
                      <a
                        key={sub.slug ?? i}
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl transition-all hover:border-purple-500/30 block"
                        style={{ background: surfLow, textDecoration: 'none' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: platformColor }}>
                            {platformLabel}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: textPri }}>
                              {sub.title}
                            </p>
                            <p className="text-xs" style={{ color: textSec }}>
                              {sub.language} · {dateStr}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ml-2"
                          style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818CF8' }}>
                          Accepted
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={() => setShowSignIn(false)}
      />
    </DashboardLayout>
  );
}

export default AnalyticsPage;
