import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

function ProfilePage({ theme, toggleTheme }) {
  const isDark   = theme === 'dark';
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const { user, updateUser } = useAuth();

  const [editing,       setEditing]       = useState(false);
  const [username,      setUsername]      = useState('');
  const [bio,           setBio]           = useState('');
  const [avatarSrc,     setAvatarSrc]     = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState('');

  // Platform stats & weak topics
  const [platforms,     setPlatforms]     = useState([]);
  const [topics,        setTopics]        = useState([]);
  const [loadingData,   setLoadingData]   = useState(true);
  const [activeTab,     setActiveTab]     = useState('all');

  useEffect(() => {
    if (user) {
      setUsername(user.username ?? '');
      setBio(user.bio ?? '');
      setAvatarSrc(prev => avatarFile ? prev : (user.avatar ?? null));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard/').catch(() => null),
      api.get('/analytics/weak-areas/').catch(() => null),
    ]).then(([dashData, topicData]) => {
      setPlatforms(dashData?.platforms ?? []);
      setTopics(topicData?.weak_areas ?? []);
    }).finally(() => setLoadingData(false));
  }, []);

  const surface   = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.85)';
  const surfaceLo = isDark ? 'rgba(255, 255, 255, 0.02)'  : 'rgba(241, 245, 249, 0.6)';
  const border    = isDark ? 'rgba(255, 255, 255, 0.08)'  : 'rgba(0, 0, 0, 0.07)';
  const textPri   = isDark ? '#F8FAFC' : '#0F172A';
  const textSec   = isDark ? '#94A3B8' : '#64748B';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let updated;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('username', username);
        fd.append('bio', bio);
        fd.append('avatar', avatarFile);
        updated = await api.patchForm('/auth/profile/', fd);
      } else {
        updated = await api.patch('/auth/profile/', { username, bio });
      }
      updateUser(updated);
      if (updated?.avatar) setAvatarSrc(updated.avatar);
      setAvatarFile(null);
      setEditing(false);
    } catch (err) {
      const msg = err?.username?.[0] ?? err?.bio?.[0] ?? err?.detail ?? 'Save failed.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(user?.username ?? '');
    setBio(user?.bio ?? '');
    setAvatarSrc(user?.avatar ?? null);
    setAvatarFile(null);
    setSaveError('');
    setEditing(false);
  };

  const displayName    = user?.username ?? '...';
  const initials       = displayName.slice(0, 2).toUpperCase();
  const resolvedAvatar = avatarSrc ?? user?.avatar ?? null;

  // Real data metrics
  const totalSolved   = platforms.reduce((s, p) => s + (p.stats?.problems_solved ?? 0), 0);
  const totalContests = platforms.reduce((s, p) => s + (p.stats?.contests ?? 0), 0);
  const maxRating     = Math.max(0, ...platforms.map(p => p.stats?.rating ?? 0));
  const maxPlatformStreak = platforms.reduce((m, p) => Math.max(m, p.stats?.max_streak ?? p.stats?.streak ?? 0), 0);
  const currentPlatformStreak = platforms.reduce((m, p) => Math.max(m, p.stats?.streak ?? 0), 0);
  const bestStreak    = Math.max(user?.streak ?? 0, maxPlatformStreak, Number(localStorage.getItem('algomind_streak_cache') || 0));

  // Study plan completions from localStorage
  const savedPlan = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`algomind_plan_progress_${user?.id}`) || '{}');
    } catch {
      return {};
    }
  }, [user?.id]);
  const completedPlanTopics = useMemo(() => new Set(savedPlan.completed || []), [savedPlan]);

  // Topic solve helpers
  const getTopicSolved = (slugKeywords) => {
    let count = 0;
    // Check topics from weak areas
    for (const t of topics) {
      const slug = (t.topic_slug || '').toLowerCase();
      const name = (t.topic_name || '').toLowerCase();
      if (slugKeywords.some(k => slug.includes(k) || name.includes(k))) {
        count += t.problems_solved || 0;
      }
    }
    // Also scan platform topic_stats
    for (const p of platforms) {
      for (const ts of p.topic_stats || []) {
        const slug = (ts.topic_slug || '').toLowerCase();
        const name = (ts.topic_name || '').toLowerCase();
        if (slugKeywords.some(k => slug.includes(k) || name.includes(k))) {
          count = Math.max(count, ts.problems_solved || 0);
        }
      }
    }
    return count;
  };

  const twoPointerSolved   = getTopicSolved(['two-pointer', 'two_pointer', 'pointers']);
  const binarySearchSolved = getTopicSolved(['binary-search', 'binary_search']);
  const dpSolved           = getTopicSolved(['dynamic-programming', 'dp']);
  const treeGraphSolved    = getTopicSolved(['tree', 'trees', 'graph', 'graphs', 'bfs', 'dfs']);
  const arrayStringSolved  = getTopicSolved(['array', 'arrays', 'string', 'strings']);

  // Real verifiable achievements
  const allAchievements = useMemo(() => [
    // ── Solving Milestones ──
    {
      id: 'solve-100',
      category: 'Solving',
      title: 'Centurion (100 Problems)',
      description: 'Solve 100 problems on LeetCode or Codeforces',
      icon: 'task_alt',
      current: totalSolved,
      target: 100,
      earned: totalSolved >= 100,
      metricText: `${Math.min(totalSolved, 100)} / 100 solved`,
    },
    {
      id: 'solve-150',
      category: 'Solving',
      title: 'Adept (150 Problems)',
      description: 'Solve 150 problems across connected platforms',
      icon: 'military_tech',
      current: totalSolved,
      target: 150,
      earned: totalSolved >= 150,
      metricText: `${Math.min(totalSolved, 150)} / 150 solved`,
    },
    {
      id: 'solve-250',
      category: 'Solving',
      title: 'Quarter-Mille (250 Problems)',
      description: 'Reach 250 solved problems in algorithmic training',
      icon: 'workspace_premium',
      current: totalSolved,
      target: 250,
      earned: totalSolved >= 250,
      metricText: `${Math.min(totalSolved, 250)} / 250 solved`,
    },
    {
      id: 'solve-500',
      category: 'Solving',
      title: 'Grandmaster (500 Problems)',
      description: 'Solve 500 competitive algorithmic problems',
      icon: 'diamond',
      current: totalSolved,
      target: 500,
      earned: totalSolved >= 500,
      metricText: `${Math.min(totalSolved, 500)} / 500 solved`,
    },

    // ── Streak Milestones ──
    {
      id: 'streak-7',
      category: 'Streak',
      title: '7-Day Consistency',
      description: 'Maintain a 7-day problem-solving streak',
      icon: 'local_fire_department',
      current: bestStreak,
      target: 7,
      earned: bestStreak >= 7,
      metricText: `${Math.min(bestStreak, 7)} / 7 days`,
    },
    {
      id: 'streak-30',
      category: 'Streak',
      title: '30-Day Dedication',
      description: 'Complete 30 consecutive days of active practice',
      icon: 'calendar_month',
      current: bestStreak,
      target: 30,
      earned: bestStreak >= 30,
      metricText: `${Math.min(bestStreak, 30)} / 30 days`,
    },
    {
      id: 'streak-100',
      category: 'Streak',
      title: 'Centurion Streak (100 Days)',
      description: 'Reach an exceptional 100-day solving streak',
      icon: 'bolt',
      current: bestStreak,
      target: 100,
      earned: bestStreak >= 100,
      metricText: `${Math.min(bestStreak, 100)} / 100 days`,
    },
    {
      id: 'streak-365',
      category: 'Streak',
      title: 'Iron Will (365 Days)',
      description: 'A full continuous year of daily algorithmic training',
      icon: 'shield',
      current: bestStreak,
      target: 365,
      earned: bestStreak >= 365,
      metricText: `${Math.min(bestStreak, 365)} / 365 days`,
    },

    // ── Topic Plans & Algomind Mastery ──
    {
      id: 'plan-two-pointers',
      category: 'Plans',
      title: 'Two Pointers Specialist',
      description: 'Complete Two Pointers plan or solve 10 Two Pointers problems',
      icon: 'alt_route',
      current: completedPlanTopics.has('two-pointers') ? 10 : twoPointerSolved,
      target: 10,
      earned: completedPlanTopics.has('two-pointers') || twoPointerSolved >= 10,
      metricText: completedPlanTopics.has('two-pointers') ? 'Plan completed' : `${Math.min(twoPointerSolved, 10)} / 10 solved`,
    },
    {
      id: 'plan-binary-search',
      category: 'Plans',
      title: 'Binary Search Navigator',
      description: 'Complete Binary Search plan or solve 10 Binary Search problems',
      icon: 'manage_search',
      current: completedPlanTopics.has('binary-search') ? 10 : binarySearchSolved,
      target: 10,
      earned: completedPlanTopics.has('binary-search') || binarySearchSolved >= 10,
      metricText: completedPlanTopics.has('binary-search') ? 'Plan completed' : `${Math.min(binarySearchSolved, 10)} / 10 solved`,
    },
    {
      id: 'plan-dp',
      category: 'Plans',
      title: 'DP Strategist',
      description: 'Complete Dynamic Programming plan or solve 15 DP problems',
      icon: 'grid_view',
      current: completedPlanTopics.has('dp') || completedPlanTopics.has('dynamic-programming') ? 15 : dpSolved,
      target: 15,
      earned: completedPlanTopics.has('dp') || completedPlanTopics.has('dynamic-programming') || dpSolved >= 15,
      metricText: completedPlanTopics.has('dp') || completedPlanTopics.has('dynamic-programming') ? 'Plan completed' : `${Math.min(dpSolved, 15)} / 15 solved`,
    },
    {
      id: 'plan-trees-graphs',
      category: 'Plans',
      title: 'Graph & Tree Architect',
      description: 'Complete Trees/Graphs plan or solve 15 Tree/Graph problems',
      icon: 'account_tree',
      current: completedPlanTopics.has('trees') || completedPlanTopics.has('graphs') ? 15 : treeGraphSolved,
      target: 15,
      earned: completedPlanTopics.has('trees') || completedPlanTopics.has('graphs') || treeGraphSolved >= 15,
      metricText: completedPlanTopics.has('trees') || completedPlanTopics.has('graphs') ? 'Plan completed' : `${Math.min(treeGraphSolved, 15)} / 15 solved`,
    },
    {
      id: 'plan-arrays-strings',
      category: 'Plans',
      title: 'Array & String Mastery',
      description: 'Solve 50 or more Array & String problems',
      icon: 'data_array',
      current: arrayStringSolved,
      target: 50,
      earned: arrayStringSolved >= 50,
      metricText: `${Math.min(arrayStringSolved, 50)} / 50 solved`,
    },

    // ── Contest Milestones ──
    {
      id: 'contest-first',
      category: 'Contests',
      title: 'Contest Contender',
      description: 'Participate in your first rated contest',
      icon: 'flag',
      current: totalContests,
      target: 1,
      earned: totalContests >= 1,
      metricText: `${Math.min(totalContests, 1)} / 1 contest`,
    },
    {
      id: 'contest-5',
      category: 'Contests',
      title: 'Arena Veteran',
      description: 'Enter 5 or more rated competitive contests',
      icon: 'sports_score',
      current: totalContests,
      target: 5,
      earned: totalContests >= 5,
      metricText: `${Math.min(totalContests, 5)} / 5 contests`,
    },
    {
      id: 'rating-1400',
      category: 'Contests',
      title: 'Specialist Rank',
      description: 'Achieve a contest rating of 1400 or above',
      icon: 'trending_up',
      current: maxRating,
      target: 1400,
      earned: maxRating >= 1400,
      metricText: maxRating > 0 ? `${maxRating} / 1400 rating` : '0 / 1400 rating',
    },
    {
      id: 'rating-1600',
      category: 'Contests',
      title: 'Expert Rank',
      description: 'Attain a competitive contest rating of 1600 or higher',
      icon: 'star',
      current: maxRating,
      target: 1600,
      earned: maxRating >= 1600,
      metricText: maxRating > 0 ? `${maxRating} / 1600 rating` : '0 / 1600 rating',
    },
  ], [totalSolved, bestStreak, totalContests, maxRating, completedPlanTopics, twoPointerSolved, binarySearchSolved, dpSolved, treeGraphSolved, arrayStringSolved]);

  const earnedCount = allAchievements.filter(a => a.earned).length;

  const filteredAchievements = useMemo(() => {
    if (activeTab === 'all') return allAchievements;
    return allAchievements.filter(a => a.category.toLowerCase() === activeTab.toLowerCase());
  }, [allAchievements, activeTab]);

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">

        {/* ── Profile Header Card ── */}
        <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden border backdrop-blur-xl"
          style={{ background: surface, borderColor: border, boxShadow: isDark ? '0 4px 24px -2px rgba(0,0,0,0.3)' : '0 4px 20px -4px rgba(0,0,0,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: isDark ? 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 100%)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative shrink-0 group">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden shadow-md cursor-pointer border"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                onClick={() => editing && fileRef.current?.click()}
              >
                {resolvedAvatar ? (
                  <img src={resolvedAvatar} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>
                    {initials}
                  </div>
                )}
                {editing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {editing && (
                <button
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow"
                  style={{ background: '#6366F1', color: '#fff' }}
                  onClick={() => fileRef.current?.click()}
                >
                  Change
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-grow min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-4 py-2.5 rounded-xl text-base font-semibold outline-none"
                    style={{ background: surfaceLo, border: `1px solid ${border}`, color: textPri }}
                  />
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={2}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2.5 rounded-xl text-xs outline-none resize-none leading-relaxed"
                    style={{ background: surfaceLo, border: `1px solid ${border}`, color: textSec }}
                  />
                  {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      style={{ background: '#6366F1' }}>
                      {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Save Profile
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ background: surfaceLo, color: textSec, border: `1px solid ${border}` }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-headline font-bold tracking-tight" style={{ color: textPri }}>
                        {displayName}
                      </h1>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider"
                          style={{
                            background: user?.plan_tier === 'pro'
                              ? 'rgba(167, 139, 250, 0.15)'
                              : user?.plan_tier === 'plus'
                                ? 'rgba(99, 102, 241, 0.15)'
                                : 'rgba(255, 255, 255, 0.06)',
                            color: user?.plan_tier === 'pro'
                              ? '#A78BFA'
                              : user?.plan_tier === 'plus'
                                ? '#818CF8'
                                : textSec,
                          }}>
                          {user?.plan_tier ? `${user.plan_tier.toUpperCase()} TIER` : 'BASIC TIER'}
                        </span>
                        {user?.plan_tier !== 'pro' && (
                          <button
                            className="text-[10px] font-semibold flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-all hover:opacity-85 cursor-pointer"
                            style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                            onClick={() => navigate('/plans')}>
                            <span className="material-symbols-outlined text-[12px]">bolt</span>
                            Upgrade
                          </button>
                        )}
                        <span className="text-xs" style={{ color: textSec }}>
                          Level {user?.level ?? 1} · Rating {user?.rating ?? 1000}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-white/[0.05] cursor-pointer"
                      style={{ background: surfaceLo, color: textPri, border: `1px solid ${border}` }}>
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit Profile
                    </button>
                  </div>
                  <p className="text-xs mt-2.5 leading-relaxed max-w-xl" style={{ color: textSec }}>
                    {user?.bio || 'No bio provided. Click Edit Profile to add your background and goals.'}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: textSec }}>{user?.email}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Segmented Metrics Strip ── */}
        <div className="rounded-2xl p-5 border backdrop-blur-xl"
          style={{ background: surface, borderColor: border }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            {[
              { label: 'Max Streak',    value: `${bestStreak}d`,             sub: `${currentPlatformStreak}d current`, color: '#818CF8' },
              { label: 'Total Solved',  value: totalSolved.toLocaleString(), sub: 'Across platforms', color: '#A855F7' },
              { label: 'Contests',      value: totalContests,                sub: 'Rated appearances', color: '#C084FC' },
              { label: 'Contest Rating',value: maxRating > 0 ? maxRating : '—', sub: 'Peak rating', color: '#6366F1' },
            ].map(({ label, value, sub, color }, idx) => (
              <div key={label} className={`flex flex-col ${idx > 0 ? 'md:pl-6 pt-3 md:pt-0' : ''}`}>
                <p className="text-xs font-medium" style={{ color: textSec }}>{label}</p>
                <p className="text-xl font-bold tracking-tight mt-0.5" style={{ color }}>{value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: textSec }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Connected Platforms ── */}
        <div className="rounded-2xl p-6 border backdrop-blur-xl"
          style={{ background: surface, borderColor: border }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>Connected Platforms</h2>
            <button
              onClick={() => navigate('/settings')}
              className="text-xs font-semibold hover:underline"
              style={{ color: '#818CF8' }}>
              Manage Connections →
            </button>
          </div>

          {loadingData ? (
            <div className="py-6 flex justify-center">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : platforms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platforms.map(p => {
                const s = p.stats ?? {};
                const isLc = p.platform_name === 'leetcode';
                const profileUrl = isLc
                  ? `https://leetcode.com/${p.handle}/`
                  : `https://codeforces.com/profile/${p.handle}`;
                return (
                  <div key={p.id} className="rounded-xl p-4 border"
                    style={{ background: surfaceLo, borderColor: border }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: isLc ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)', color: isLc ? '#F59E0B' : '#818CF8' }}>
                          {isLc ? 'LC' : 'CF'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold capitalize" style={{ color: textPri }}>{p.platform_name}</p>
                          <p className="text-[11px]" style={{ color: textSec }}>@{p.handle}</p>
                        </div>
                      </div>
                      <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-medium flex items-center gap-1 hover:underline"
                        style={{ color: '#818CF8' }}>
                        <span>Profile</span>
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </a>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t"
                      style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      {[
                        { label: 'Solved',   val: s.problems_solved ?? 0 },
                        { label: 'Current',  val: `${s.streak ?? 0}d` },
                        { label: 'Max',      val: `${s.max_streak || s.streak || 0}d` },
                        { label: 'Rating',   val: s.rating > 0 ? s.rating : '—' },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <p className="text-sm font-bold" style={{ color: textPri }}>{val}</p>
                          <p className="text-[10px] uppercase font-medium mt-0.5" style={{ color: textSec }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs mb-3" style={{ color: textSec }}>No platforms connected yet.</p>
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: '#6366F1' }}>
                Connect LeetCode / Codeforces
              </button>
            </div>
          )}
        </div>

        {/* ── Verified Achievements (Zero Fakes, Strictly Verified) ── */}
        <div className="rounded-2xl p-6 border backdrop-blur-xl"
          style={{ background: surface, borderColor: border, boxShadow: isDark ? '0 4px 20px -2px rgba(0,0,0,0.3)' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight" style={{ color: textPri }}>Verified Achievements</h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818CF8' }}>
                  {earnedCount} of {allAchievements.length} Unlocked
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: textSec }}>
                Milestones authenticated against your connected LeetCode, Codeforces, and AlgoMind plan progress
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl shrink-0" style={{ background: surfaceLo, border: `1px solid ${border}` }}>
              {['all', 'solving', 'streak', 'plans', 'contests'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer"
                  style={{
                    background: activeTab === tab ? '#6366F1' : 'transparent',
                    color: activeTab === tab ? '#FFFFFF' : textSec,
                  }}>
                  {tab === 'plans' ? 'Plans' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAchievements.map((badge) => {
              const pct = Math.min(100, Math.max(0, Math.round((badge.current / badge.target) * 100)));
              return (
                <div
                  key={badge.id}
                  className="p-4 rounded-xl border transition-all flex flex-col justify-between"
                  style={{
                    background: badge.earned
                      ? (isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)')
                      : surfaceLo,
                    borderColor: badge.earned
                      ? (isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(99, 102, 241, 0.2)')
                      : border,
                    opacity: badge.earned ? 1 : 0.65,
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: badge.earned ? 'rgba(99, 102, 241, 0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                            color: badge.earned ? '#818CF8' : textSec,
                          }}>
                          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: badge.earned ? "'FILL' 1" : "'FILL' 0" }}>
                            {badge.icon}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold tracking-tight" style={{ color: textPri }}>
                            {badge.title}
                          </h4>
                          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSec }}>
                            {badge.category}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: badge.earned ? 'rgba(34, 197, 94, 0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                          color: badge.earned ? '#22C55E' : textSec,
                        }}>
                        {badge.earned ? 'Unlocked' : `${pct}%`}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed mt-1" style={{ color: textSec }}>
                      {badge.description}
                    </p>
                  </div>

                  {/* Progress Bar & Real Counts */}
                  <div className="mt-3.5 pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                    <div className="flex justify-between items-center text-[10px] mb-1.5 font-medium" style={{ color: textSec }}>
                      <span>Progress</span>
                      <span style={{ color: badge.earned ? '#818CF8' : textPri, fontWeight: 600 }}>{badge.metricText}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: badge.earned
                            ? 'linear-gradient(90deg, #6366F1, #A855F7)'
                            : '#818CF8',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
