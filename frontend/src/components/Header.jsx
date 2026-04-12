import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';

/* ─── helpers ─────────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

const TYPE_META = {
  friend_request:  { color: '#6366F1', icon: '👤' },
  friend_accepted: { color: '#22C55E', icon: '🎉' },
  system:          { color: '#A855F7', icon: '🔔' },
  achievement:     { color: '#F59E0B', icon: '🏆' },
};

/* ─── Component ──────────────────────────────────────────────────── */
function Header({ theme, toggleTheme, onOpenChat }) {
  const navigate  = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isDark    = theme === 'dark';

  // ── streak (real) ────────────────────────────────────────────────
  const streak = user?.streak ?? 0;

  // ── notifications (real) ─────────────────────────────────────────
  const [notifications,   setNotifications]   = useState([]);
  const [unread,          setUnread]          = useState(0);
  const [streakAtRisk,    setStreakAtRisk]    = useState(false);
  const [showNotifDrop,   setShowNotifDrop]   = useState(false);
  const [loadingNotifs,   setLoadingNotifs]   = useState(false);

  // banner rotation
  const [notifIndex, setNotifIndex] = useState(0);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const notifRef = useRef(null);
  const dropRef  = useRef(null);

  // ── fetch notifications from backend ─────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingNotifs(true);
    try {
      const data = await api.get('/auth/notifications/?limit=30');
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
      setStreakAtRisk(data.streak_at_risk ?? false);
    } catch {
      // silently fail — non-critical UI
    } finally {
      setLoadingNotifs(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount + every 60 s
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Show streak +1 pop if user just got a new streak day
  useEffect(() => {
    if (!user) return;
    const key = `algomind_streak_shown_${user.id}`;
    const lastShown = localStorage.getItem(key);
    const today = new Date().toDateString();
    if (lastShown !== today && streak > 0) {
      localStorage.setItem(key, today);
      setShowPlusOne(true);
      setTimeout(() => setShowPlusOne(false), 1500);
    }
  }, [user, streak]);

  // ── Banner notifications ──────────────────────────────────────────
  // Build dynamic banner items from real data
  const BANNER_NOTIFS = (() => {
    const items = [];
    if (streakAtRisk) {
      items.push(
        <><span style={{ color: '#EF4444', fontWeight: 700 }}>Streak at risk</span> — solve today!</>
      );
    }
    if (unread > 0) {
      items.push(
        <><span style={{ color: '#6366F1', fontWeight: 700 }}>{unread} new</span> notification{unread > 1 ? 's' : ''}</>
      );
    }
    if (streak >= 7) {
      items.push(
        <><span style={{ color: '#A855F7', fontWeight: 700 }}>{streak}-day</span> streak 🔥 Keep it up!</>
      );
    }
    if (items.length === 0) {
      items.push(<>Welcome back! Keep grinding 💪</>);
    }
    return items;
  })();

  // Rotate banner
  useEffect(() => {
    if (BANNER_NOTIFS.length <= 1) return;
    const id = setInterval(() => {
      const el = notifRef.current;
      if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(-5px)'; el.style.transition = 'all 0.3s ease'; }
      setTimeout(() => {
        setNotifIndex(p => (p + 1) % BANNER_NOTIFS.length);
        if (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
      }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, [BANNER_NOTIFS.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowNotifDrop(false); };
    window.addEventListener('mousedown', fn);
    return () => window.removeEventListener('mousedown', fn);
  }, []);

  // ── mark read helpers ─────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try { await api.post(`/auth/notifications/${id}/read/`, {}); } catch { /* best-effort */ }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    try { await api.post('/auth/notifications/read-all/', {}); } catch { /* best-effort */ }
  };

  // ── style tokens ─────────────────────────────────────────────────
  const surface = isDark ? 'rgba(31,32,34,0.7)' : 'rgba(255,255,255,0.9)';
  const border  = isDark ? 'rgba(70,69,84,0.2)'  : 'rgba(0,0,0,0.07)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';
  const dropBg  = isDark ? '#1F2022' : '#FFFFFF';

  return (
    <header className="w-full px-6 pt-6 pb-2 flex justify-end items-center shrink-0">
      <div className="flex items-center gap-3">

        {/* Leaderboard Widget */}
        <button
          className="p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
          style={{ background: surface, border: `1px solid ${border}` }}
          onClick={() => navigate('/friends')}
        >
          <div className="flex -space-x-2">
            {['#2f3aa3','#62259b'].map((bg, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                style={{ borderColor: isDark ? '#121315' : '#fff', background: bg, color: '#fff' }}>
                {['JD','SK'][i]}
              </div>
            ))}
          </div>
          <div>
            <p className="text-[9px] uppercase font-label leading-none mb-0.5" style={{ color: textSec }}>Leaderboard</p>
            <p className="text-[11px] font-bold" style={{ color: textPri }}>Friends</p>
          </div>
        </button>

        {/* Notification Banner */}
        <div className="rounded-xl px-4 py-2.5 flex flex-col justify-center min-w-[210px] h-[48px]"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <p className="text-[9px] uppercase tracking-[0.1em] font-label leading-none mb-0.5" style={{ color: textSec }}>Notification</p>
          <div className="h-[14px] overflow-hidden">
            <p ref={notifRef} className="text-[11px] font-medium whitespace-nowrap notification-fade-in" style={{ color: isDark ? '#c7c4d7' : '#475569' }}>
              {BANNER_NOTIFS[notifIndex % BANNER_NOTIFS.length]}
            </p>
          </div>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:opacity-80 relative"
            style={{ background: surface, border: `1px solid ${border}`, color: textPri }}
            onClick={() => { setShowNotifDrop(p => !p); if (!showNotifDrop) fetchNotifications(); }}
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white badge-pop"
                style={{ background: '#EF4444' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifDrop && (
            <div
              className="notif-dropdown absolute right-0 top-14 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
              style={{ background: dropBg, border: `1px solid ${border}` }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${border}` }}>
                <p className="text-sm font-bold" style={{ color: textPri }}>Notifications</p>
                {unread > 0 && (
                  <button className="text-[10px] font-semibold hover:opacity-70" style={{ color: '#6366F1' }} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <span className="text-2xl">🔔</span>
                    <p className="text-xs" style={{ color: textSec }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const meta = TYPE_META[notif.notif_type] ?? TYPE_META.system;
                    const avatarDisplay = notif.avatar_text || meta.icon;
                    return (
                      <div
                        key={notif.id}
                        className="px-4 py-3 space-y-1 transition-all cursor-pointer"
                        style={{
                          background: notif.read ? 'transparent' : (isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)'),
                          borderBottom: `1px solid ${border}`,
                        }}
                        onClick={() => !notif.read && markRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                            style={{ background: notif.color || meta.color }}
                          >
                            {avatarDisplay}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-xs font-semibold" style={{ color: textPri }}>{notif.title}</p>
                            <p className="text-[11px] leading-tight mt-0.5" style={{ color: textSec }}>{notif.body}</p>
                            <p className="text-[9px] mt-0.5" style={{ color: textSec }}>{timeAgo(notif.created_at)}</p>
                          </div>
                          {!notif.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: '#6366F1' }} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Streak at risk warning */}
              {streakAtRisk && (
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${border}`, background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)' }}>
                  <span className="text-base">🔥</span>
                  <p className="text-[11px] font-semibold" style={{ color: '#EF4444' }}>
                    Streak at risk! Solve a problem today.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Streak — real data from backend */}
        <div className="rounded-xl px-4 py-2.5 flex items-center gap-3 relative"
          style={{ background: surface, border: `1px solid ${border}` }}>
          {showPlusOne && <span className="streak-plus-one">+1</span>}
          <div>
            <p className="text-[9px] uppercase font-label leading-none mb-0.5" style={{ color: textSec }}>Streak</p>
            <p className="text-[11px] font-bold" style={{ color: streakAtRisk ? '#EF4444' : '#A855F7' }}>
              {streak > 0 ? `${streak} Days` : 'Start today!'}
            </p>
          </div>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center float-anim"
            style={{ background: `rgba(${streakAtRisk ? '239,68,68' : '168,85,247'},0.12)`, color: streakAtRisk ? '#EF4444' : '#A855F7' }}>
            <span className="material-symbols-outlined text-lg">local_fire_department</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          id="themeToggle"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: surface, border: `1px solid ${border}`, color: textPri }}
          onClick={toggleTheme}
        >
          <span className="material-symbols-outlined text-lg">{isDark ? 'dark_mode' : 'light_mode'}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
