import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import { getInitials } from '../../utils/initials.js';
import { buildAchievements } from '../Profile/achievementsCatalog.js';

function formatJoinedDate(dateStr) {
  if (!dateStr) return 'Joined recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Joined recently';
    return `Joined ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  } catch {
    return 'Joined recently';
  }
}

function formatSyncDate(dateStr) {
  if (!dateStr) return 'Synced';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Synced';
    const now = Date.now();
    const diff = (now - d.getTime()) / 1000;
    if (diff < 3600) return 'Synced recently';
    if (diff < 86400) return 'Synced today';
    return `Synced ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } catch {
    return 'Synced';
  }
}

function PublicProfilePage({ theme, toggleTheme }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [friendActionMsg, setFriendActionMsg] = useState('');

  const surface = isDark ? '#141416' : '#FFFFFF';
  const surfLow = isDark ? '#1C1D21' : '#F8FAFC';
  const border  = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#F4F4F6' : '#0F172A';
  const textSec = isDark ? '#8E8E93' : '#64748B';

  // Fetch target profile data
  const fetchProfile = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await api.get(`/auth/profile/${username}/`);
      setProfile(data);
      setNotFound(false);
    } catch (err) {
      if (err?.detail === 'Not found.' || err?.detail?.includes('404')) {
        setNotFound(true);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [username]);

  // Initial fetch + 5-second polling interval for real-time updates
  useEffect(() => {
    fetchProfile(true);

    const interval = setInterval(() => {
      fetchProfile(false);
    }, 5000);

    const onFocus = () => fetchProfile(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchProfile]);

  // Compute verifiable achievements from real target profile data
  const achievements = useMemo(() => {
    if (!profile) return [];
    const platList = profile.platforms || [];
    const totalSolved = platList.reduce((s, p) => s + (p.problems_solved || 0), 0);
    const totalContests = platList.reduce((s, p) => s + (p.contests || 0), 0);
    const maxRating = Math.max(profile.rating || 0, ...platList.map(p => p.rating || 0));
    const completedPlanTopics = new Set(
      Array.from({ length: profile.completed_plans_count || 0 }, (_, i) => `topic-${i}`)
    );

    return buildAchievements({
      totalSolved,
      bestStreak: profile.streak || 0,
      totalContests,
      maxRating,
      completedPlanTopics,
      platforms: platList,
      user: profile,
    });
  }, [profile]);

  const earnedBadges = useMemo(() => achievements.filter(a => a.earned), [achievements]);

  // Handle Add Friend action
  const handleAddFriend = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!profile?.id || friendActionLoading) return;
    setFriendActionLoading(true);
    setFriendActionMsg('');
    try {
      const res = await api.post('/friends/send/', { receiver_id: profile.id });
      setProfile(prev => ({
        ...prev,
        friendship_status: res?.detail?.includes('accepted') ? 'friends' : 'request_sent'
      }));
      setFriendActionMsg('Friend request sent');
      setTimeout(() => setFriendActionMsg(''), 3000);
    } catch (e) {
      const msg = e?.detail || 'Failed to send friend request';
      setFriendActionMsg(msg);
      setTimeout(() => setFriendActionMsg(''), 3000);
    } finally {
      setFriendActionLoading(false);
    }
  };

  const initials = getInitials(profile?.username ?? username ?? '??');

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="max-w-2xl mx-auto space-y-6 pb-12">

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-75"
            style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: textSec }}>
            AlgoMind Profile Inspection
          </span>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium" style={{ color: textSec }}>Loading user profile...</p>
          </div>
        )}

        {/* Not Found State */}
        {!loading && notFound && (
          <div className="rounded-3xl p-10 text-center space-y-4" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-gray-500/10 text-gray-400">
              <span className="material-symbols-outlined text-3xl">person_off</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: textPri }}>User Not Found</h2>
              <p className="text-xs mt-1" style={{ color: textSec }}>
                No active AlgoMind account exists with username <strong>@{username}</strong>.
              </p>
            </div>
            <button
              onClick={() => navigate('/friends')}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#6366F1' }}
            >
              Back to Friends
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!loading && profile && (
          <div className="space-y-6">

            {/* Apple-style Profile Header Card */}
            <div
              className="rounded-3xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl transition-all"
              style={{
                background: surface,
                border: `1px solid ${border}`,
                boxShadow: isDark ? '0 10px 40px -15px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 flex items-center justify-center shadow-lg"
                    style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                  >
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>

                {/* Identity & Metadata */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: textPri }}>
                      {profile.username}
                    </h1>
                    {profile.is_admin && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                        Admin
                      </span>
                    )}
                    {profile.plan_tier === 'pro' && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                        PRO
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: profile.bio ? textSec : 'rgba(142,142,147,0.6)' }}>
                    {profile.bio || 'No bio written yet.'}
                  </p>

                  {/* Rating & Streak Badges (No Level) */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: surfLow, border: `1px solid ${border}`, color: '#818CF8' }}
                    >
                      <span className="material-symbols-outlined text-sm">stars</span>
                      <span>{profile.rating ?? 1000} Elo</span>
                    </div>

                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: surfLow, border: `1px solid ${border}`, color: '#F59E0B' }}
                    >
                      <span className="material-symbols-outlined text-sm">local_fire_department</span>
                      <span>{profile.streak ?? 0}d App Streak</span>
                    </div>

                    {profile.date_joined && (
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ background: surfLow, border: `1px solid ${border}`, color: textSec }}
                      >
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span>{formatJoinedDate(profile.date_joined)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Friend Action Button */}
                <div className="sm:self-center shrink-0 w-full sm:w-auto">
                  {profile.friendship_status === 'self' ? (
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                      style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit Profile
                    </button>
                  ) : profile.friendship_status === 'friends' ? (
                    <div
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
                    >
                      <span className="material-symbols-outlined text-sm">how_to_reg</span>
                      Friends
                    </div>
                  ) : profile.friendship_status === 'request_sent' ? (
                    <div
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: surfLow, border: `1px solid ${border}`, color: textSec }}
                    >
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Request Sent
                    </div>
                  ) : (
                    <button
                      onClick={handleAddFriend}
                      disabled={friendActionLoading}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      style={{ background: '#6366F1', color: '#FFFFFF' }}
                    >
                      {friendActionLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-sm">person_add</span>
                      )}
                      <span>Add Friend</span>
                    </button>
                  )}
                  {friendActionMsg && (
                    <p className="text-[10px] text-center mt-1 font-medium" style={{ color: '#818CF8' }}>
                      {friendActionMsg}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Connected Platforms Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold tracking-tight" style={{ color: textPri }}>
                  Connected Platforms
                </h2>
                <span className="text-[11px]" style={{ color: textSec }}>
                  {profile.platforms_hidden ? 'Private' : `${profile.platforms?.length || 0} Connected`}
                </span>
              </div>

              {profile.platforms_hidden ? (
                <div
                  className="rounded-2xl p-5 flex items-center gap-3.5"
                  style={{ background: surface, border: `1px solid ${border}` }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gray-500/10" style={{ color: textSec }}>
                    <span className="material-symbols-outlined text-lg">visibility_off</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: textPri }}>Platform Statistics Private</p>
                    <p className="text-[11px]" style={{ color: textSec }}>
                      This user has configured their LeetCode and Codeforces profiles to remain private.
                    </p>
                  </div>
                </div>
              ) : profile.platforms && profile.platforms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.platforms.map((plat) => {
                    const isLc = plat.platform_name === 'leetcode';
                    const iconColor = isLc ? '#F59E0B' : '#3B82F6';
                    return (
                      <div
                        key={plat.platform_name}
                        className="rounded-2xl p-4.5 space-y-3 transition-all"
                        style={{ background: surface, border: `1px solid ${border}` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                              style={{ background: `${iconColor}15`, color: iconColor }}>
                              <span className="material-symbols-outlined text-base">
                                {isLc ? 'terminal' : 'code'}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold capitalize" style={{ color: textPri }}>
                                {plat.platform_name}
                              </p>
                              <p className="text-[11px] font-mono" style={{ color: textSec }}>
                                @{plat.handle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {plat.rating > 0 && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                                style={{ background: surfLow, color: iconColor, border: `1px solid ${border}` }}>
                                Contest Rating {plat.rating}
                              </span>
                            )}
                            {plat.last_updated && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg"
                                style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}>
                                {formatSyncDate(plat.last_updated)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metrics Breakdown */}
                        <div className="grid grid-cols-4 gap-2 pt-1 border-t" style={{ borderColor: border }}>
                          <div className="text-center p-2 rounded-xl" style={{ background: surfLow }}>
                            <p className="text-xs font-bold" style={{ color: textPri }}>{plat.problems_solved || 0}</p>
                            <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: textSec }}>Solved</p>
                          </div>
                          <div className="text-center p-2 rounded-xl" style={{ background: surfLow }}>
                            <p className="text-xs font-bold" style={{ color: '#22C55E' }}>{plat.easy_solved || 0}</p>
                            <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: textSec }}>Easy</p>
                          </div>
                          <div className="text-center p-2 rounded-xl" style={{ background: surfLow }}>
                            <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>
                              {plat.medium_solved !== undefined && plat.medium_solved !== null && plat.medium_solved > 0
                                ? plat.medium_solved
                                : Math.max(0, (plat.problems_solved || 0) - (plat.easy_solved || 0) - (plat.hard_solved || 0))}
                            </p>
                            <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: textSec }}>Medium</p>
                          </div>
                          <div className="text-center p-2 rounded-xl" style={{ background: surfLow }}>
                            <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{plat.hard_solved || 0}</p>
                            <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: textSec }}>Hard</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: surface, border: `1px solid ${border}` }}
                >
                  <p className="text-xs" style={{ color: textSec }}>
                    No external competitive programming accounts connected yet.
                  </p>
                </div>
              )}
            </div>

            {/* Achievement Badges Showcase */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight" style={{ color: textPri }}>
                    Badges &amp; Achievements
                  </h2>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}
                  >
                    {earnedBadges.length} Unlocked
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: textSec }}>
                  {achievements.length} Total Catalog
                </span>
              </div>

              {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {earnedBadges.slice(0, 12).map((badge) => (
                    <div
                      key={badge.id}
                      className="rounded-2xl p-3.5 flex items-start gap-3 transition-all hover:scale-[1.01]"
                      style={{ background: surface, border: `1px solid ${border}` }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ background: badge.grad || 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#FFFFFF' }}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {badge.icon || 'military_tech'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate" style={{ color: textPri }}>
                          {badge.title}
                        </p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: textSec }}>
                          {badge.subtitle || badge.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-2xl p-6 text-center space-y-1"
                  style={{ background: surface, border: `1px solid ${border}` }}
                >
                  <p className="text-xs font-medium" style={{ color: textPri }}>
                    No achievement badges unlocked yet
                  </p>
                  <p className="text-[11px]" style={{ color: textSec }}>
                    Badges unlock automatically when problems are solved and streaks are maintained.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default PublicProfilePage;
