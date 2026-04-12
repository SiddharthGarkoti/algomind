import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

function ProfilePage({ theme, toggleTheme }) {
  const isDark   = theme === 'dark';
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const { user, updateUser } = useAuth();

  const [editing,    setEditing]    = useState(false);
  const [username,   setUsername]   = useState('');
  const [bio,        setBio]        = useState('');
  const [avatarSrc,  setAvatarSrc]  = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  // Platform stats
  const [platforms,  setPlatforms]  = useState([]);
  const [recentSubs, setRecentSubs] = useState([]);
  const [loadingData,setLoadingData]= useState(true);

  useEffect(() => {
    if (user) {
      setUsername(user.username ?? '');
      setBio(user.bio ?? '');
      setAvatarSrc(user.avatar ?? null);
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard/').catch(() => null),
      api.get('/analytics/recent-submissions/').catch(() => null),
    ]).then(([dashData, recentData]) => {
      setPlatforms(dashData?.platforms ?? []);
      setRecentSubs(recentData?.submissions ?? []);
    }).finally(() => setLoadingData(false));
  }, []);

  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#292a2c' : '#F8FAFC';
  const border  = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

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

  // Compute real achievements from actual data
  const totalSolved  = platforms.reduce((s, p) => s + (p.stats?.problems_solved ?? 0), 0);
  const maxStreak    = user?.streak ?? 0;
  const totalContests= platforms.reduce((s, p) => s + (p.stats?.contests ?? 0), 0);
  const maxRating    = Math.max(0, ...platforms.map(p => p.stats?.rating ?? 0));

  const achievements = [
    { icon: '🔥', label: `${maxStreak}-Day Streak`,  earned: maxStreak >= 7,  desc: 'Solve for 7+ days' },
    { icon: '💯', label: '100 Problems',              earned: totalSolved >= 100, desc: 'Solve 100 problems' },
    { icon: '⚔️', label: 'Contest Fighter',           earned: totalContests >= 5, desc: 'Enter 5 contests' },
    { icon: '🧠', label: '500 Problems',              earned: totalSolved >= 500, desc: 'Solve 500 problems' },
    { icon: '🏆', label: 'Rated 1500+',               earned: maxRating >= 1500,  desc: 'Reach rating 1500' },
    { icon: '💎', label: 'Rated 2000+',               earned: maxRating >= 2000,  desc: 'Reach rating 2000' },
  ];

  const lastSub = recentSubs[0];

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Profile Card */}
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="absolute top-0 left-0 right-0 h-28"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))' }} />

          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative mt-4 shrink-0 group">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl cursor-pointer border-2"
                style={{ borderColor: 'rgba(99,102,241,0.4)' }}
                onClick={() => editing && fileRef.current?.click()}
              >
                {resolvedAvatar ? (
                  <img src={resolvedAvatar} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-white"
                    style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
                    {initials}
                  </div>
                )}
                {editing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {editing && (
                <button
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: '#6366F1', color: '#fff' }}
                  onClick={() => fileRef.current?.click()}
                >
                  Change
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-grow pt-4">
              {editing ? (
                <div className="space-y-3">
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-4 py-2 rounded-xl text-lg font-bold outline-none"
                    style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
                  />
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={2}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: surfLow, border: `1px solid ${border}`, color: textSec }}
                  />
                  {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-60"
                      style={{ background: '#6366F1' }}>
                      {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-5 py-2 rounded-xl text-sm font-bold"
                      style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h1 className="text-2xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>
                        {displayName}
                      </h1>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Basic</span>
                        <button
                          className="text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full transition-all hover:opacity-80"
                          style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.08))', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}
                          onClick={() => navigate('/plans')}>
                          ⚡ Upgrade Plan
                        </button>
                        <span className="text-[10px]" style={{ color: textSec }}>
                          Lv {user?.level ?? 1} · Rating {user?.rating ?? 1000}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all hover:opacity-80"
                      style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}>
                      <span className="material-symbols-outlined text-sm">edit</span> Edit
                    </button>
                  </div>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: textSec }}>
                    {user?.bio || 'No bio yet — click Edit to add one.'}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: textSec }}>{user?.email}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Streak',   value: `${user?.streak ?? 0}d`, color: '#6366F1' },
            { label: 'Level',    value: user?.level  ?? 1,        color: '#A855F7' },
            { label: 'Rating',   value: user?.rating ?? 1000,     color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-5 text-center"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <p className="text-2xl font-headline font-extrabold" style={{ color }}>{value}</p>
              <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: textSec }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Connected Platforms */}
        {loadingData ? (
          <div className="rounded-2xl p-6 flex justify-center" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : platforms.length > 0 ? (
          <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: textSec }}>Platform Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platforms.map(p => {
                const s = p.stats ?? {};
                const platformColor = p.platform_name === 'leetcode' ? '#F59E0B' : '#6366F1';
                return (
                  <a
                    key={p.id}
                    href={p.platform_name === 'leetcode'
                      ? `https://leetcode.com/${p.handle}/`
                      : `https://codeforces.com/profile/${p.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl p-4 block hover:opacity-90 transition-opacity"
                    style={{ background: surfLow, border: `1px solid ${border}`, textDecoration: 'none' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-extrabold text-white"
                        style={{ background: platformColor }}>
                        {p.platform_name === 'leetcode' ? 'LC' : 'CF'}
                      </div>
                      <div>
                        <p className="text-sm font-bold capitalize" style={{ color: textPri }}>{p.platform_name}</p>
                        <p className="text-[10px]" style={{ color: textSec }}>@{p.handle}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Solved',   val: s.problems_solved ?? 0 },
                        { label: 'Contests', val: s.contests        ?? 0 },
                        { label: 'Rating',   val: s.rating          ?? 0 },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <p className="text-base font-headline font-extrabold" style={{ color: platformColor }}>{val}</p>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: textSec }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-6 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
            <p className="text-sm" style={{ color: textSec }}>No platforms connected yet.</p>
            <button
              onClick={() => navigate('/settings')}
              className="mt-3 px-5 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: '#6366F1' }}>
              Connect LeetCode / Codeforces
            </button>
          </div>
        )}

        {/* Last Problem Tried */}
        {lastSub && (
          <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: textSec }}>Last Problem Solved</h2>
            <a
              href={lastSub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              style={{ textDecoration: 'none' }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
                style={{ background: lastSub.platform === 'leetcode' ? '#F59E0B' : '#6366F1' }}>
                {lastSub.platform === 'leetcode' ? 'LC' : 'CF'}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: textPri }}>{lastSub.title}</p>
                <p className="text-[10px]" style={{ color: textSec }}>
                  {lastSub.language} · {lastSub.timestamp
                    ? new Date(lastSub.timestamp * 1000).toLocaleDateString()
                    : ''}
                </p>
              </div>
              <span className="ml-auto material-symbols-outlined text-sm" style={{ color: textSec }}>open_in_new</span>
            </a>
          </div>
        )}

        {/* Real Achievements */}
        <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: textSec }}>Achievements</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {achievements.map(({ icon, label, earned, desc }) => (
              <div
                key={label}
                title={earned ? `Unlocked: ${label}` : `Locked: ${desc}`}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all ${earned ? '' : 'opacity-25 grayscale'}`}
                style={{ background: surfLow }}>
                <span className="text-3xl">{icon}</span>
                <span className="text-[9px] font-semibold leading-tight" style={{ color: textSec }}>{label}</span>
              </div>
            ))}
          </div>
          {!loadingData && achievements.every(a => !a.earned) && (
            <p className="text-xs text-center mt-4" style={{ color: textSec }}>
              Connect your platforms and solve problems to unlock achievements!
            </p>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
