import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import SignInModal from '../../components/login/SignInModal.jsx';
import api from '../../utils/api.js';

/* ── Standard Curriculum Catalog with Prerequisites ── */
const CURRICULUM_CATALOG = [
  { slug: 'array', name: 'Arrays & Prefix Sum', category: 'Fundamentals', minPreReq: 'None', level: 'Foundation', keyConcepts: ['Index manipulation', 'Prefix sums', 'Kadane algorithm', 'In-place rotations'] },
  { slug: 'string', name: 'Strings & Parsing', category: 'Fundamentals', minPreReq: 'None', level: 'Foundation', keyConcepts: ['Palindromes', 'Anagrams', 'Two-pointer scans', 'Substrings'] },
  { slug: 'two-pointers', name: 'Two Pointers & Sliding Window', category: 'Techniques', minPreReq: 'Arrays', level: 'Foundation', keyConcepts: ['Opposite pointers', 'Dynamic sliding window', 'Monotonic deques'] },
  { slug: 'binary-search', name: 'Binary Search', category: 'Techniques', minPreReq: 'Arrays', level: 'Foundation', keyConcepts: ['Search space division', 'Binary search on answer', 'Matrix search'] },
  { slug: 'stack', name: 'Stack & Monotonic Stack', category: 'Data Structures', minPreReq: 'Arrays', level: 'Foundation', keyConcepts: ['Parentheses matching', 'Monotonic stack (O(n))', 'Expression evaluation'] },
  { slug: 'hash-table', name: 'Hash Tables & Sets', category: 'Data Structures', minPreReq: 'Arrays', level: 'Foundation', keyConcepts: ['O(1) lookup', 'Frequency maps', 'Collision resolution', 'LRU Design'] },
  { slug: 'linked-list', name: 'Linked Lists', category: 'Data Structures', minPreReq: 'None', level: 'Foundation', keyConcepts: ['Fast & slow pointers', 'List reversal', 'Merge operations', 'Cycle detection'] },
  { slug: 'tree', name: 'Binary Trees & Traversals', category: 'Hierarchical', minPreReq: 'Recursion', level: 'Foundation', keyConcepts: ['DFS (pre/in/post-order)', 'BFS level-order', 'Lowest Common Ancestor'] },
  { slug: 'binary-search-tree', name: 'Binary Search Trees (BST)', category: 'Hierarchical', minPreReq: 'Binary Trees', level: 'Intermediate', keyConcepts: ['Inorder sorted property', 'BST validation', 'Insertion & deletion'] },
  { slug: 'sorting', name: 'Sorting & Divide and Conquer', category: 'Algorithms', minPreReq: 'Arrays', level: 'Foundation', keyConcepts: ['Merge Sort', 'QuickSelect O(n)', 'Custom comparators', 'Inversion counting'] },
  { slug: 'greedy', name: 'Greedy Algorithms', category: 'Algorithms', minPreReq: 'Sorting', level: 'Intermediate', keyConcepts: ['Interval scheduling', 'Activity selection', 'Optimal local choices'] },
  { slug: 'backtracking', name: 'Backtracking & Recursion', category: 'Algorithms', minPreReq: 'Recursion, Stack', level: 'Intermediate', keyConcepts: ['State exploration', 'Pruning branches', 'Permutations & Subsets'] },
  { slug: 'dynamic-programming', name: 'Dynamic Programming', category: 'Advanced', minPreReq: 'Recursion, Arrays, Math', level: 'Advanced', keyConcepts: ['Overlapping subproblems', 'Optimal substructure', 'Memoization & Tabulation', '0/1 Knapsack'] },
  { slug: 'graph', name: 'Graph Theory & BFS/DFS', category: 'Advanced', minPreReq: 'Trees, Queue, Stack', level: 'Advanced', keyConcepts: ['Adjacency lists', 'BFS shortest path', 'Cycle detection', 'Topological Sort'] },
  { slug: 'shortest-path', name: 'Advanced Graphs (Dijkstra / MST)', category: 'Advanced', minPreReq: 'Graphs, Priority Queue', level: 'Advanced', keyConcepts: ['Dijkstra algorithm', 'Prim / Kruskal MST', 'Disjoint Set Union (DSU)'] },
  { slug: 'bit-manipulation', name: 'Bit Manipulation & Bitmasks', category: 'Low Level', minPreReq: 'Math', level: 'Intermediate', keyConcepts: ['Bitwise operators', 'XOR cancellations', 'Bitmask DP states', 'Power of two tricks'] },
  { slug: 'math', name: 'Math & Number Theory', category: 'Foundations', minPreReq: 'None', level: 'Foundation', keyConcepts: ['Prime sieves', 'GCD / Euclidean', 'Modular arithmetic', 'Combinatorics'] },
  { slug: 'trie', name: 'Trie (Prefix Tree)', category: 'Advanced DS', minPreReq: 'Trees, Hash Tables', level: 'Advanced', keyConcepts: ['Prefix queries', 'Autocomplete models', 'Bitwise Trie for XOR'] },
  { slug: 'segment-tree', name: 'Segment Tree & Fenwick (BIT)', category: 'Expert DS', minPreReq: 'Binary Search, Trees, Arrays', level: 'Expert', keyConcepts: ['Range query in O(log n)', 'Point / Range updates', 'Lazy propagation'] },
];

/* ── Helper to determine mastery tier ── */
function getMasteryTier(solved) {
  if (solved >= 40) return { key: 'mastered', label: 'Mastered', color: '#C084FC', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.25)', next: null };
  if (solved >= 20) return { key: 'proficient', label: 'Proficient', color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', next: 40 };
  if (solved >= 5)  return { key: 'intermediate', label: 'Intermediate', color: '#818CF8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', next: 20 };
  return { key: 'novice', label: 'Novice', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', next: 5 };
}

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

  const navigate = useNavigate();
  const { user, isGuest, updateUser } = useAuth();

  const [solvedTab,      setSolvedTab]      = useState('total');
  const [platforms,      setPlatforms]      = useState(null);   // null = loading
  const [summary,        setSummary]        = useState(null);
  const [rawTopics,      setRawTopics]      = useState([]);
  const [recentSubs,     setRecentSubs]     = useState([]);
  const [refreshing,     setRefreshing]     = useState('');
  const [showSignIn,     setShowSignIn]     = useState(false);

  // Curriculum & Mastery State
  const [selectedTopic,   setSelectedTopic]   = useState(null);
  const [showAllMastered, setShowAllMastered] = useState(false);
  const [showAllNovice,   setShowAllNovice]   = useState(false);

  const hasRealData = platforms !== null && platforms.length > 0;

  useEffect(() => {
    api.get('/analytics/dashboard/')
      .then(d => {
        const platList = d.platforms ?? [];
        const summ = d.summary ?? {};
        setPlatforms(platList);
        setSummary(summ);
      })
      .catch(() => setPlatforms([]));

    api.get('/analytics/weak-areas/')
      .then(d => setRawTopics(d.weak_areas ?? []))
      .catch(() => {});

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
    // Strictly isolate AlgoMind app streak from third-party platform streaks
    const appStreak = typeof user?.streak === 'number' ? user.streak : (summary?.app_streak ?? 0);

    if (platformName === 'total') {
      return {
        easy:          summary?.easy_solved   ?? platforms?.reduce((s,p)=>s+(p.stats?.easy_solved??0),0) ?? 0,
        medium:        summary?.medium_solved ?? platforms?.reduce((s,p)=>s+(p.stats?.medium_solved??0),0) ?? 0,
        hard:          summary?.hard_solved   ?? platforms?.reduce((s,p)=>s+(p.stats?.hard_solved??0),0) ?? 0,
        total:         summary?.total_problems_solved ?? 0,
        rating:        summary?.average_rating ?? 0,
        currentStreak: appStreak,
        maxStreak:     appStreak,
        streak:        appStreak,
        url:           null,
      };
    }
    const p = platforms?.find(pl => pl.platform_name === platformName);
    const s = p?.stats ?? {};
    const cStreak = s.streak ?? 0;
    const mStreak = s.max_streak || s.streak || 0;
    return {
      easy:          s.easy_solved   ?? 0,
      medium:        s.medium_solved ?? 0,
      hard:          s.hard_solved   ?? 0,
      total:         s.problems_solved ?? 0,
      rating:        s.rating ?? 0,
      currentStreak: cStreak,
      maxStreak:     mStreak,
      streak:        mStreak,
      url:           platformName === 'leetcode'   ? `https://leetcode.com/${p?.handle ?? ''}`
                   : platformName === 'codeforces' ? `https://codeforces.com/profile/${p?.handle ?? ''}`
                   : null,
      handle:        p?.handle,
    };
  };

  const currentStats = statsFor(solvedTab);

  /* Merge backend topics with full curriculum catalog */
  const mergedCurriculum = useMemo(() => {
    const solvedMap = new Map();
    rawTopics.forEach(t => {
      const slug = (t.topic_slug || '').toLowerCase();
      solvedMap.set(slug, (solvedMap.get(slug) || 0) + (t.problems_solved || 0));
    });

    return CURRICULUM_CATALOG.map(item => {
      // Check direct slug or aliases
      let solved = solvedMap.get(item.slug) || 0;
      if (item.slug === 'array' && !solved) solved = solvedMap.get('arrays') || 0;
      if (item.slug === 'string' && !solved) solved = solvedMap.get('strings') || 0;
      if (item.slug === 'tree' && !solved) solved = solvedMap.get('trees') || 0;
      if (item.slug === 'graph' && !solved) solved = solvedMap.get('graphs') || 0;

      const tier = getMasteryTier(solved);
      return {
        ...item,
        problems_solved: solved,
        tier,
      };
    }).sort((a, b) => b.problems_solved - a.problems_solved);
  }, [rawTopics]);

  /* Split curriculum into Mastered/Proficient vs Novice/Intermediate */
  const masteredTopics = useMemo(() => {
    return mergedCurriculum.filter(t => t.problems_solved >= 20 || t.tier.key === 'mastered' || t.tier.key === 'proficient');
  }, [mergedCurriculum]);

  const noviceTopics = useMemo(() => {
    return mergedCurriculum.filter(t => t.problems_solved < 20 || t.tier.key === 'novice' || t.tier.key === 'intermediate');
  }, [mergedCurriculum]);

  const displayedMastered = showAllMastered ? masteredTopics : masteredTopics.slice(0, 5);
  const displayedNovice   = showAllNovice ? noviceTopics : noviceTopics.slice(0, 5);

  const availablePlatforms = [
    { key: 'total',      label: 'Total'    },
    ...(platforms ?? []).map(p => ({
      key:   p.platform_name,
      label: p.platform_name === 'leetcode' ? 'LeetCode' : p.platform_name === 'codeforces' ? 'CF' : p.platform_name,
    })),
  ];

  /* Handler: Start / Continue Learning Topic */
  const handleStartLearning = (topic) => {
    const isMastered = topic.tier?.key === 'mastered' || topic.tier?.key === 'proficient' || topic.problems_solved >= 20;
    navigate(`/plan-view?topic=${topic.slug}&action=teach${isMastered ? '&tier=mastered' : ''}`);
  };

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-5 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>
              Analytics & Mastery
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: textSec }}>
              Performance calibration, verified problems, and curriculum progression
            </p>
          </div>
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
          <div className="flex items-center justify-between gap-4 rounded-xl p-3.5 border"
            style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl shrink-0" style={{ color: '#6366F1' }}>person_off</span>
              <div>
                <p className="text-xs font-bold" style={{ color: textPri }}>You're in guest mode</p>
                <p className="text-[11px] mt-0.5" style={{ color: textSec }}>
                  Sign in to save your progress, track history, and unlock full analytics.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSignIn(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
              style={{ background: '#6366F1', color: '#fff' }}>
              Sign In
            </button>
          </div>
        )}

        {/* No platforms banner */}
        {platforms !== null && !hasRealData && (
          <div className="flex items-center gap-4 rounded-xl p-3.5 border"
            style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <span className="material-symbols-outlined text-xl shrink-0" style={{ color: '#6366F1' }}>link_off</span>
            <div>
              <p className="text-xs font-bold" style={{ color: textPri }}>No platforms connected yet</p>
              <p className="text-[11px] mt-0.5" style={{ color: textSec }}>
                Connect your LeetCode or Codeforces account in Settings to sync verified submissions and topics.
              </p>
            </div>
          </div>
        )}

        {platforms !== null && (
          <>
            {/* ── KPI Metrics Strip (Apple Activity & Microsoft Fluent Space Optimization) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl p-3.5 flex flex-col justify-between"
                style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textSec }}>Problems Solved</span>
                  <span className="material-symbols-outlined text-sm" style={{ color: '#818CF8' }}>check_circle</span>
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>
                    {currentStats.total}
                  </span>
                  <span className="text-xs" style={{ color: textSec }}>solved</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: textSec }}>
                  <span style={{ color: '#6366F1' }}>{currentStats.easy}E</span> ·
                  <span style={{ color: '#A855F7' }}>{currentStats.medium}M</span> ·
                  <span style={{ color: '#C084FC' }}>{currentStats.hard}H</span>
                </div>
              </div>

              <div className="rounded-xl p-3.5 flex flex-col justify-between"
                style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textSec }}>
                    {solvedTab === 'total' ? 'AlgoMind Streak' : `${solvedTab === 'leetcode' ? 'LeetCode' : 'Codeforces'} Streak`}
                  </span>
                  <span className="material-symbols-outlined text-sm" style={{ color: '#F59E0B' }}>local_fire_department</span>
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>
                    {currentStats.currentStreak}d
                  </span>
                  <span className="text-xs" style={{ color: textSec }}>
                    {solvedTab === 'total' ? 'in-app streak' : 'platform streak'}
                  </span>
                </div>
                <p className="text-[10px] font-medium" style={{ color: textSec }}>
                  Best: <strong style={{ color: textPri }}>{currentStats.maxStreak} days</strong>
                </p>
              </div>

              <div className="rounded-xl p-3.5 flex flex-col justify-between"
                style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textSec }}>Contest Standing</span>
                  <span className="material-symbols-outlined text-sm" style={{ color: '#A855F7' }}>military_tech</span>
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>
                    {currentStats.rating > 0 ? currentStats.rating : 'Unrated'}
                  </span>
                </div>
                <p className="text-[10px] font-medium" style={{ color: textSec }}>
                  Verified platform rating
                </p>
              </div>

              <div className="rounded-xl p-3.5 flex flex-col justify-between"
                style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textSec }}>Ecosystem Sync</span>
                  <span className="material-symbols-outlined text-sm" style={{ color: '#22C55E' }}>sync_saved_locally</span>
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>
                    {platforms ? platforms.length : 0}
                  </span>
                  <span className="text-xs" style={{ color: textSec }}>connected</span>
                </div>
                <div className="truncate text-[10px] font-medium" style={{ color: textSec }}>
                  {(platforms ?? []).map(p => p.platform_name).join(' · ') || 'No platforms'}
                </div>
              </div>
            </div>

            {/* ── Row 1: Problem Distribution & Platform Accounts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              {/* Problem breakdown card */}
              <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-headline font-bold" style={{ color: textPri }}>Problem Breakdown</h2>
                  <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: surfLow, border: `1px solid ${border}` }}>
                    {availablePlatforms.map(({ key, label }) => (
                      <button key={key} onClick={() => setSolvedTab(key)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer"
                        style={solvedTab === key ? { background: '#6366F1', color: '#fff' } : { color: textSec }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-5 my-auto">
                  <SolvedDonut
                    easy={currentStats.easy}
                    medium={currentStats.medium}
                    hard={currentStats.hard}
                    surfLow={surfLow}
                    textPri={textPri}
                    textSec={textSec}
                  />
                  <div className="flex-grow space-y-2.5">
                    {[
                      { label: 'Easy',   val: currentStats.easy,   color: '#6366F1' },
                      { label: 'Medium', val: currentStats.medium, color: '#A855F7' },
                      { label: 'Hard',   val: currentStats.hard,   color: '#C084FC' },
                    ].map(({ label, val, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span style={{ color, fontWeight: 600 }}>{label}</span>
                          <span className="font-bold" style={{ color: textPri }}>{val}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: surfLow }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${currentStats.total > 0 ? Math.round((val/currentStats.total)*100) : 0}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                    {currentStats.url && (
                      <a href={currentStats.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-75 mt-0.5"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>
                        <span>View platform profile</span>
                        <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Connected accounts card */}
              <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-headline font-bold" style={{ color: textPri }}>Connected Platforms</h2>
                  <span className="text-[11px]" style={{ color: textSec }}>Auto-synced</span>
                </div>

                <div className="space-y-2.5 my-auto">
                  {(platforms ?? []).length === 0 ? (
                    <div className="p-4 rounded-xl text-center" style={{ background: surfLow, border: `1px solid ${border}` }}>
                      <p className="text-xs" style={{ color: textSec }}>No platforms connected yet. Connect in Settings to sync.</p>
                    </div>
                  ) : (
                    platforms.map(p => {
                      const s = p.stats ?? {};
                      return (
                        <div key={p.id} className="rounded-xl p-3.5 border flex items-center justify-between gap-3"
                          style={{ background: surfLow, borderColor: border }}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold capitalize" style={{ color: textPri }}>{p.platform_name}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                Connected
                              </span>
                            </div>
                            <p className="text-[11px] truncate mt-0.5" style={{ color: textSec }}>
                              @{p.handle} · {s.problems_solved ?? 0} solved · {s.streak ?? 0}d streak
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              disabled={refreshing === p.platform_name}
                              onClick={() => refreshPlatform(p.platform_name)}
                              className="p-1.5 rounded-lg transition-all hover:opacity-75 disabled:opacity-40 cursor-pointer"
                              style={{ background: 'rgba(99,102,241,0.1)' }}
                              title="Refresh stats">
                              <span className={`material-symbols-outlined text-sm ${refreshing === p.platform_name ? 'animate-spin' : ''}`}
                                style={{ color: '#818CF8' }}>sync</span>
                            </button>
                            <a
                              href={p.platform_name === 'leetcode' ? `https://leetcode.com/${p.handle}` : `https://codeforces.com/profile/${p.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg transition-all hover:opacity-75"
                              style={{ background: 'rgba(255,255,255,0.05)', color: textSec }}>
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Row 2: Curriculum Topic Mastery (Two-Column Mastered vs Novice/Intermediate) ── */}
            <div className="space-y-3.5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-lg font-headline font-bold tracking-tight" style={{ color: textPri }}>
                    Curriculum & Topic Mastery
                  </h2>
                  <p className="text-xs" style={{ color: textSec }}>
                    Your mastered foundations alongside novice and intermediate focus areas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* ── Left Side: Mastered Topics ── */}
                <div className="rounded-2xl p-5 flex flex-col justify-between"
                  style={{
                    background: surface,
                    border: `1px solid ${border}`,
                    boxShadow: isDark ? '0 4px 16px -2px rgba(0,0,0,0.3)' : '0 4px 16px -2px rgba(0,0,0,0.03)',
                  }}>
                  <div>
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b" style={{ borderColor: border }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.1)' }}>
                          <span className="material-symbols-outlined text-sm" style={{ color: '#C084FC' }}>verified</span>
                        </div>
                        <div>
                          <h3 className="text-xs font-headline font-bold" style={{ color: textPri }}>
                            Mastered & Proficient
                          </h3>
                          <p className="text-[10px]" style={{ color: textSec }}>
                            Demonstrated algorithmic depth
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.08)',
                          color: isDark ? '#D8B4FE' : '#7E22CE',
                          border: `1px solid ${isDark ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.2)'}`,
                        }}>
                        {masteredTopics.length} Mastered
                      </span>
                    </div>

                    <div className="space-y-2">
                      {displayedMastered.map(t => (
                        <div
                          key={t.slug}
                          onClick={() => setSelectedTopic(t)}
                          className="group p-3 rounded-xl transition-all duration-200 hover:scale-[1.008] cursor-pointer flex items-center justify-between gap-3 border"
                          style={{
                            background: surfLow,
                            borderColor: border,
                          }}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-xs font-bold truncate group-hover:text-purple-400 transition-colors" style={{ color: textPri }}>
                                {t.name}
                              </h4>
                              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded"
                                style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: textSec }}>
                                {t.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]" style={{ color: textSec }}>
                              <span className="font-semibold" style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                                {t.problems_solved} solved
                              </span>
                              <span>·</span>
                              <span>Level: {t.level}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: t.tier.bg,
                                color: t.tier.color,
                                border: `1px solid ${t.tier.border}`,
                              }}>
                              {t.tier.label}
                            </span>
                            <span className="material-symbols-outlined text-xs transition-transform duration-200 group-hover:translate-x-1"
                              style={{ color: textSec }}>
                              arrow_forward
                            </span>
                          </div>
                        </div>
                      ))}

                      {masteredTopics.length === 0 && (
                        <div className="text-center py-8" style={{ color: textSec }}>
                          <p className="text-xs">Solve 20+ problems in foundational areas to unlock Mastered status.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {masteredTopics.length > 5 && (
                    <button
                      onClick={() => setShowAllMastered(prev => !prev)}
                      className="w-full mt-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 active:scale-[0.99]"
                      style={{ background: surfLow, color: textPri, border: `1px solid ${border}` }}>
                      <span>{showAllMastered ? 'Show Less' : `Show More Mastered (${masteredTopics.length})`}</span>
                      <span className="material-symbols-outlined text-sm">{showAllMastered ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  )}
                </div>

                {/* ── Right Side: Novice & Intermediate (Focus Areas) ── */}
                <div className="rounded-2xl p-5 flex flex-col justify-between"
                  style={{
                    background: surface,
                    border: `1px solid ${border}`,
                    boxShadow: isDark ? '0 4px 16px -2px rgba(0,0,0,0.3)' : '0 4px 16px -2px rgba(0,0,0,0.03)',
                  }}>
                  <div>
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b" style={{ borderColor: border }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)' }}>
                          <span className="material-symbols-outlined text-sm" style={{ color: '#818CF8' }}>target</span>
                        </div>
                        <div>
                          <h3 className="text-xs font-headline font-bold" style={{ color: textPri }}>
                            Novice & Intermediate
                          </h3>
                          <p className="text-[10px]" style={{ color: textSec }}>
                            High-growth focus areas to practice
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
                          color: isDark ? '#A5B4FC' : '#4338CA',
                          border: `1px solid ${isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)'}`,
                        }}>
                        {noviceTopics.length} Focus Areas
                      </span>
                    </div>

                    <div className="space-y-2">
                      {displayedNovice.map(t => (
                        <div
                          key={t.slug}
                          onClick={() => setSelectedTopic(t)}
                          className="group p-3 rounded-xl transition-all duration-200 hover:scale-[1.008] cursor-pointer flex items-center justify-between gap-3 border"
                          style={{
                            background: surfLow,
                            borderColor: border,
                          }}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-xs font-bold truncate group-hover:text-indigo-400 transition-colors" style={{ color: textPri }}>
                                {t.name}
                              </h4>
                              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded"
                                style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: textSec }}>
                                {t.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]" style={{ color: textSec }}>
                              <span className="font-semibold" style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                                {t.problems_solved} solved
                              </span>
                              <span>·</span>
                              <span>Requires {t.minPreReq}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: t.tier.bg,
                                color: t.tier.color,
                                border: `1px solid ${t.tier.border}`,
                              }}>
                              {t.tier.label}
                            </span>
                            <span className="material-symbols-outlined text-xs transition-transform duration-200 group-hover:translate-x-1"
                              style={{ color: textSec }}>
                              arrow_forward
                            </span>
                          </div>
                        </div>
                      ))}

                      {noviceTopics.length === 0 && (
                        <div className="text-center py-8" style={{ color: textSec }}>
                          <p className="text-xs">Outstanding! All curriculum topics have reached advanced proficiency.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {noviceTopics.length > 5 && (
                    <button
                      onClick={() => setShowAllNovice(prev => !prev)}
                      className="w-full mt-3 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 active:scale-[0.99]"
                      style={{ background: surfLow, color: textPri, border: `1px solid ${border}` }}>
                      <span>{showAllNovice ? 'Show Less' : `Show More Focus Areas (${noviceTopics.length})`}</span>
                      <span className="material-symbols-outlined text-sm">{showAllNovice ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Row 3: Recent Accepted Submissions (Space-Optimized 2-Column Grid) ── */}
            <div className="rounded-2xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-xs font-headline font-bold uppercase tracking-wider" style={{ color: textPri }}>Recent Accepted Submissions</h2>
                <span className="text-[11px]" style={{ color: textSec }}>Verified on platform</span>
              </div>
              {recentSubs.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: textSec }}>
                  No recent submissions found. Connect a platform and solve problems to see them here.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recentSubs.slice(0, 10).map((sub, i) => {
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
                        className="flex items-center justify-between p-2.5 rounded-xl transition-all hover:border-purple-500/30 border block"
                        style={{ background: surfLow, borderColor: border, textDecoration: 'none' }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: platformColor }}>
                            {platformLabel}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: textPri }}>
                              {sub.title}
                            </p>
                            <p className="text-[10px]" style={{ color: textSec }}>
                              {sub.language} · {dateStr}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ml-2"
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

      {/* ── Topic Details & Teaching Mode Modal ── */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-xl rounded-2xl p-6 sm:p-7 shadow-2xl relative border overflow-hidden"
            style={{ background: isDark ? '#18191c' : '#FFFFFF', borderColor: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(0,0,0,0.1)' }}>
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: selectedTopic.tier.bg, color: selectedTopic.tier.color, border: `1px solid ${selectedTopic.tier.border}` }}>
                    {selectedTopic.tier.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: surfLow, color: textSec }}>
                    {selectedTopic.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: surfLow, color: textSec }}>
                    Level: {selectedTopic.level}
                  </span>
                </div>
                <h2 className="text-2xl font-headline font-extrabold" style={{ color: textPri }}>
                  {selectedTopic.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="p-1.5 rounded-xl hover:opacity-70 cursor-pointer"
                style={{ background: surfLow, color: textSec }}>
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Prerequisite Check & Advisory Warning */}
            {(selectedTopic.level === 'Advanced' || selectedTopic.level === 'Expert' || selectedTopic.slug === 'dynamic-programming' || selectedTopic.slug === 'graph' || selectedTopic.slug === 'segment-tree') && selectedTopic.problems_solved < 5 && (
              <div className="mb-5 p-4 rounded-xl border flex items-start gap-3"
                style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5" style={{ color: '#EF4444' }}>warning</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#EF4444' }}>Prerequisite Advisory</h4>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: textPri }}>
                    This topic requires strong fundamentals in <strong>{selectedTopic.minPreReq}</strong>. Since you are currently at <strong>Novice</strong> level with {selectedTopic.problems_solved} questions solved, we recommend solidifying foundational topics first.
                  </p>
                </div>
              </div>
            )}

            {/* Progress stats */}
            <div className="p-4 rounded-xl mb-5" style={{ background: surfLow, border: `1px solid ${border}` }}>
              <div className="flex justify-between items-center text-xs mb-2">
                <span style={{ color: textSec }}>Problems Solved</span>
                <span className="font-bold" style={{ color: textPri }}>{selectedTopic.problems_solved}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span style={{ color: textSec }}>Next Mastery Target</span>
                <span className="font-bold" style={{ color: selectedTopic.tier.color }}>
                  {selectedTopic.tier.next ? `${selectedTopic.tier.next} solved` : 'Milestone achieved'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span style={{ color: textSec }}>Prerequisites</span>
                <span className="font-semibold" style={{ color: textPri }}>{selectedTopic.minPreReq}</span>
              </div>
            </div>

            {/* Core Concepts */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: textSec }}>Key Concepts You Will Master</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedTopic.keyConcepts.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: surfLow, color: textPri }}>
                    <span className="material-symbols-outlined text-sm" style={{ color: '#6366F1' }}>check_circle</span>
                    <span className="truncate">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: border }}>
              <button
                onClick={() => setSelectedTopic(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold hover:opacity-80 cursor-pointer"
                style={{ background: surfLow, color: textSec }}>
                Close
              </button>
              {(() => {
                const isMastered = selectedTopic.tier?.key === 'mastered' || selectedTopic.tier?.key === 'proficient' || selectedTopic.problems_solved >= 20;
                return (
                  <button
                    onClick={() => handleStartLearning(selectedTopic)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-lg"
                    style={{
                      background: isMastered
                        ? 'linear-gradient(135deg, #7C3AED, #A855F7)'
                        : 'linear-gradient(135deg, #6366F1, #818CF8)',
                      color: '#FFFFFF'
                    }}>
                    <span className="material-symbols-outlined text-sm font-bold">
                      {isMastered ? 'workspace_premium' : 'school'}
                    </span>
                    <span>
                      {isMastered
                        ? 'Launch Master II (Hard & Advanced Patterns)'
                        : (selectedTopic.problems_solved > 0 ? 'Continue Learning Topic' : 'Start Learning Topic')}
                    </span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={() => setShowSignIn(false)}
      />
    </DashboardLayout>
  );
}

export default AnalyticsPage;
