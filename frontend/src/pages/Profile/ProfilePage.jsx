import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import { buildAchievements } from './achievementsCatalog.js';
import { getInitials } from '../../utils/initials.js';

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
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badgeSearch,   setBadgeSearch]   = useState('');
  const [unlockedOnly,  setUnlockedOnly]  = useState(false);

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
  const initials       = getInitials(displayName);
  const resolvedAvatar = avatarSrc ?? user?.avatar ?? null;

  // Real data metrics
  const totalSolved   = platforms.reduce((s, p) => s + (p.stats?.problems_solved ?? 0), 0);
  const totalContests = platforms.reduce((s, p) => s + (p.stats?.contests ?? 0), 0);
  const maxRating     = Math.max(0, ...platforms.map(p => p.stats?.rating ?? 0));
  const appStreak     = typeof user?.streak === 'number' ? user.streak : 0;
  const bestStreak    = appStreak;

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

  // Real verifiable achievements (180+ across DSA, Core CS, Solving, Streak, Contests, Skills)
  const allAchievements = useMemo(() => {
    return buildAchievements({
      totalSolved,
      bestStreak,
      totalContests,
      maxRating,
      completedPlanTopics,
      getTopicSolved,
      platforms,
      user,
    });
  }, [totalSolved, bestStreak, totalContests, maxRating, completedPlanTopics, topics, platforms, user]);

  const earnedCount = allAchievements.filter(a => a.earned).length;

  const categoryCounts = useMemo(() => {
    const counts = { all: allAchievements.length };
    allAchievements.forEach(a => {
      const cat = a.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allAchievements]);

  const filteredAchievements = useMemo(() => {
    let list = allAchievements;
    if (activeTab !== 'all') {
      list = list.filter(a => a.category.toLowerCase() === activeTab.toLowerCase());
    }
    if (unlockedOnly) {
      list = list.filter(a => a.earned);
    }
    if (badgeSearch.trim()) {
      const q = badgeSearch.trim().toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAchievements, activeTab, unlockedOnly, badgeSearch]);

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
                        <span className="text-xs font-semibold" style={{ color: '#818CF8' }}>
                          {user?.rating ?? 1000} Elo
                        </span>
                        {user?.date_joined && (
                          <span className="text-xs" style={{ color: textSec }}>
                            · Joined {new Date(user.date_joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
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
              { label: 'AlgoMind Streak', value: `${appStreak}d`,            sub: 'In-app solving streak', color: '#818CF8' },
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
                    {s.rating > 0 && (
                      <div className="flex items-center justify-between text-xs px-1 mb-2">
                        <span className="text-[10px] uppercase font-semibold" style={{ color: textSec }}>Contest Rating</span>
                        <span className="font-bold text-amber-500 font-mono">{s.rating}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-1.5 text-center pt-2 border-t"
                      style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      {[
                        { label: 'Solved', val: s.problems_solved ?? 0, color: textPri },
                        { label: 'Easy',   val: s.easy_solved ?? 0,     color: '#22C55E' },
                        { label: 'Medium', val: (s.medium_solved !== undefined && s.medium_solved !== null) ? s.medium_solved : Math.max(0, (s.problems_solved ?? 0) - (s.easy_solved ?? 0) - (s.hard_solved ?? 0)), color: '#F59E0B' },
                        { label: 'Hard',   val: s.hard_solved ?? 0,     color: '#EF4444' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="p-1.5 rounded-lg" style={{ background: surface }}>
                          <p className="text-xs font-bold" style={{ color }}>{val}</p>
                          <p className="text-[9px] uppercase font-medium mt-0.5" style={{ color: textSec }}>{label}</p>
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

        {/* ── Verified Achievements (Chess.com Trophy Showcase Style) ── */}
        <div className="rounded-2xl p-6 border backdrop-blur-xl"
          style={{ background: surface, borderColor: border, boxShadow: isDark ? '0 4px 20px -2px rgba(0,0,0,0.3)' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
          <div className="flex flex-col gap-4 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold tracking-tight" style={{ color: textPri }}>Badges &amp; Achievements</h2>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818CF8' }}>
                    {earnedCount} of {allAchievements.length} Unlocked
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: textSec }}>
                  Over 180 verified milestones across DSA patterns, Core CS subjects, solving tiers, streaks, and contests
                </p>
              </div>

              {/* Unlocked Only Filter */}
              <button
                onClick={() => setUnlockedOnly(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 self-start sm:self-auto border"
                style={{
                  background: unlockedOnly ? 'rgba(34, 197, 94, 0.15)' : surfaceLo,
                  borderColor: unlockedOnly ? 'rgba(34, 197, 94, 0.4)' : border,
                  color: unlockedOnly ? '#22C55E' : textSec,
                }}
              >
                <span className="material-symbols-outlined text-sm">
                  {unlockedOnly ? 'check_circle' : 'lock_open'}
                </span>
                <span>Unlocked Only ({earnedCount})</span>
              </button>
            </div>

            {/* Search toolbar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                style={{ color: textSec }}>
                search
              </span>
              <input
                type="text"
                value={badgeSearch}
                onChange={(e) => setBadgeSearch(e.target.value)}
                placeholder="Search 180+ badges (e.g. DP, SQL, 1400, Binary Search, Streak)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-none transition-all"
                style={{
                  background: surfaceLo,
                  borderColor: border,
                  color: textPri,
                }}
              />
              {badgeSearch && (
                <button
                  onClick={() => setBadgeSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer text-xs"
                  style={{ color: textSec }}
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl overflow-x-auto no-scrollbar"
              style={{ background: surfaceLo, border: `1px solid ${border}` }}>
              {[
                { id: 'all', label: 'All', count: allAchievements.length },
                { id: 'dsa', label: 'DSA Topics', count: categoryCounts.dsa || 0 },
                { id: 'core cs', label: 'Core CS', count: categoryCounts['core cs'] || 0 },
                { id: 'solving', label: 'Solving', count: categoryCounts.solving || 0 },
                { id: 'streak', label: 'Streak', count: categoryCounts.streak || 0 },
                { id: 'contests', label: 'Contests', count: categoryCounts.contests || 0 },
                { id: 'skills', label: 'Skills & Arena', count: categoryCounts.skills || 0 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0"
                  style={{
                    background: activeTab === tab.id ? '#6366F1' : 'transparent',
                    color: activeTab === tab.id ? '#FFFFFF' : textSec,
                  }}>
                  <span>{tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full"
                    style={{
                      background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                      color: activeTab === tab.id ? '#FFFFFF' : textSec,
                    }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Chess.com Style Badges Grid / Empty State */}
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border" style={{ background: surfaceLo, borderColor: border }}>
              <span className="material-symbols-outlined text-4xl mb-2" style={{ color: textSec }}>search_off</span>
              <p className="text-sm font-semibold" style={{ color: textPri }}>No badges match your criteria</p>
              <p className="text-xs mt-1 mb-4" style={{ color: textSec }}>
                Try adjusting your search query or reset the unlocked filter.
              </p>
              <button
                onClick={() => { setActiveTab('all'); setBadgeSearch(''); setUnlockedOnly(false); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                style={{ background: '#6366F1' }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredAchievements.map((badge) => {
                const pct = Math.min(100, Math.max(0, Math.round((badge.current / badge.target) * 100)));
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className="group flex flex-col items-center p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-center relative overflow-hidden hover:scale-[1.02]"
                    style={{
                      background: badge.earned
                        ? (isDark ? 'rgba(99, 102, 241, 0.04)' : 'rgba(99, 102, 241, 0.02)')
                        : surfaceLo,
                      borderColor: badge.earned
                        ? (isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(99, 102, 241, 0.2)')
                        : border,
                    }}
                  >
                    {/* Medallion */}
                    <div className="relative my-1">
                      <div
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: badge.earned
                            ? badge.gradient
                            : (isDark ? '#1C1C22' : '#E2E8F0'),
                          boxShadow: badge.earned && isDark ? badge.glow : 'none',
                          border: badge.earned
                            ? '2px solid rgba(255, 255, 255, 0.25)'
                            : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                          filter: badge.earned ? 'none' : 'grayscale(1)',
                          opacity: badge.earned ? 1 : 0.45,
                        }}
                      >
                        <span
                          className="material-symbols-outlined text-2xl sm:text-3xl"
                          style={{
                            color: badge.earned ? '#FFFFFF' : textSec,
                            fontVariationSettings: badge.earned ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          {badge.icon}
                        </span>
                      </div>

                      {/* Status indicator on medal */}
                      {badge.earned ? (
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 flex items-center justify-center text-white shadow-sm"
                          style={{ borderColor: isDark ? '#141419' : '#FFFFFF' }}
                        >
                          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                        </div>
                      ) : (
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-zinc-400 shadow-sm"
                          style={{
                            background: isDark ? '#27272A' : '#CBD5E1',
                            borderColor: isDark ? '#141419' : '#FFFFFF',
                          }}
                        >
                          <span className="material-symbols-outlined text-[11px]">lock</span>
                        </div>
                      )}
                    </div>

                    {/* Badge Name & Subtitle */}
                    <p className="text-xs font-bold truncate w-full mt-2" style={{ color: badge.earned ? textPri : textSec }}>
                      {badge.title}
                    </p>
                    <p className="text-[10px] truncate w-full mt-0.5" style={{ color: textSec }}>
                      {badge.subtitle}
                    </p>

                    {/* Status Pill */}
                    <div className="mt-2">
                      {badge.earned ? (
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block"
                          style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22C55E' }}
                        >
                          Unlocked
                        </span>
                      ) : (
                        <span
                          className="text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: textSec }}
                        >
                          {pct}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Chess.com Badge Detail Modal ── */}
        {selectedBadge && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl p-6 relative border text-center shadow-2xl"
              style={{
                background: isDark ? '#141419' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                style={{ background: surfaceLo, color: textSec }}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>

              {/* Large Medallion */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center relative mb-3.5"
                style={{
                  background: selectedBadge.earned
                    ? selectedBadge.gradient
                    : (isDark ? '#1C1C22' : '#E2E8F0'),
                  boxShadow: selectedBadge.earned && isDark ? selectedBadge.glow : 'none',
                  border: selectedBadge.earned
                    ? '3px solid rgba(255, 255, 255, 0.25)'
                    : `2px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  filter: selectedBadge.earned ? 'none' : 'grayscale(1)',
                }}
              >
                <span
                  className="material-symbols-outlined text-4xl"
                  style={{
                    color: selectedBadge.earned ? '#FFFFFF' : textSec,
                    fontVariationSettings: selectedBadge.earned ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {selectedBadge.icon}
                </span>
                {selectedBadge.earned ? (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 flex items-center justify-center text-white"
                    style={{ borderColor: isDark ? '#141419' : '#FFFFFF' }}
                  >
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </div>
                ) : (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-zinc-400"
                    style={{
                      background: isDark ? '#27272A' : '#CBD5E1',
                      borderColor: isDark ? '#141419' : '#FFFFFF',
                    }}
                  >
                    <span className="material-symbols-outlined text-xs">lock</span>
                  </div>
                )}
              </div>

              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ background: 'rgba(99,102,241,0.12)', color: selectedBadge.badgeColor }}
              >
                {selectedBadge.category}
              </span>
              <h3 className="text-lg font-bold" style={{ color: textPri }}>
                {selectedBadge.title}
              </h3>
              <p className="text-xs font-medium mt-0.5 mb-2.5" style={{ color: textSec }}>
                {selectedBadge.subtitle}
              </p>

              <p className="text-xs leading-relaxed mb-4 px-2" style={{ color: textSec }}>
                {selectedBadge.description}
              </p>

              {/* Progress Box */}
              <div
                className="p-3.5 rounded-2xl mb-4 border text-left"
                style={{ background: surfaceLo, borderColor: border }}
              >
                <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                  <span style={{ color: textSec }}>Progress</span>
                  <span style={{ color: selectedBadge.earned ? '#22C55E' : textPri, fontWeight: 700 }}>
                    {selectedBadge.earned ? 'Completed' : selectedBadge.metricText}
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, Math.round((selectedBadge.current / selectedBadge.target) * 100)))}%`,
                      background: selectedBadge.earned
                        ? 'linear-gradient(90deg, #22C55E, #10B981)'
                        : selectedBadge.badgeColor,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:opacity-90"
                style={{
                  background: selectedBadge.earned ? selectedBadge.gradient : '#6366F1',
                  color: '#FFFFFF',
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
