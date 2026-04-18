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

  // ── chat message popup ───────────────────────────────────────────
  const [chatPopup, setChatPopup] = useState(null); // { sender, text }
  const chatPopupTimer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      try {
        const s = JSON.parse(localStorage.getItem('algomind_notif_settings') || '{}');
        if (s.notifChat === false) return;
      } catch {}
      setChatPopup(e.detail);
      clearTimeout(chatPopupTimer.current);
      chatPopupTimer.current = setTimeout(() => setChatPopup(null), 4000);
    };
    window.addEventListener('algomind:chatmessage', handler);
    return () => { window.removeEventListener('algomind:chatmessage', handler); clearTimeout(chatPopupTimer.current); };
  }, []);

  // ── notifications (real) ─────────────────────────────────────────
  const [notifications,   setNotifications]   = useState([]);
  const [unread,          setUnread]          = useState(0);
  const [streakAtRisk,    setStreakAtRisk]    = useState(false);
  const [showNotifDrop,   setShowNotifDrop]   = useState(false);
  const [loadingNotifs,   setLoadingNotifs]   = useState(false);
  const [onlineFriends,   setOnlineFriends]   = useState([]);
  const [aiInsights,      setAiInsights]      = useState(['Loading insights...']);
  const [friendToast,     setFriendToast]     = useState(null); // { username } — friend just came online
  const prevOnlineIds = useRef(new Set());  // track who was online last poll
  const friendToastTimer = useRef(null);

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

  // ── fetch friend online statuses (every 30 s) ─────────────────────
  const fetchOnlineFriends = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get('/auth/friends/online/');
      const nowOnline = (data.friends ?? []).filter(f => f.is_online);
      setOnlineFriends(nowOnline);

      // Detect new transitions: friends who are online now but weren't before
      const nowOnlineIds = new Set(nowOnline.map(f => f.id));
      const newlyOnline = nowOnline.filter(f => !prevOnlineIds.current.has(f.id));
      // Only show toast if there was a previous poll (set not empty means we've polled before)
      if (prevOnlineIds.current.size > 0 && newlyOnline.length > 0) {
        const first = newlyOnline[0];
        clearTimeout(friendToastTimer.current);
        setFriendToast({ username: first.username });
        friendToastTimer.current = setTimeout(() => setFriendToast(null), 4000);
      }
      prevOnlineIds.current = nowOnlineIds;
    } catch { /* non-critical */ }
  }, [isAuthenticated]);

  // ── fetch AI insight (every 10 min, once on mount) ────────────────
  const fetchAiInsight = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get('/auth/ai-insight/');
      if (data.insights && data.insights.length > 0) {
        setAiInsights(data.insights);
      }
    } catch { /* non-critical */ }
  }, [isAuthenticated]);

  // Fetch on mount + polling
  useEffect(() => {
    fetchNotifications();
    fetchOnlineFriends();
    fetchAiInsight();
    const notifId   = setInterval(fetchNotifications,    60_000);
    const onlineId  = setInterval(fetchOnlineFriends,    30_000); // 30 s for real-time feel
    const insightId = setInterval(fetchAiInsight,       600_000);
    return () => {
      clearInterval(notifId);
      clearInterval(onlineId);
      clearInterval(insightId);
      clearTimeout(friendToastTimer.current);
    };
  }, [fetchNotifications, fetchOnlineFriends, fetchAiInsight]);

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
  // Mix real-time state with the AI-generated actionable insights
  const BANNER_NOTIFS = (() => {
    const items = [];
    
    if (streakAtRisk) {
      items.push(<><span style={{ color: '#EF4444', fontWeight: 700 }}>Solve 1 more question</span> to keep your streak 🔥</>);
    }
    
    if (onlineFriends.length > 0) {
      const name = onlineFriends[0].username;
      items.push(<><span style={{ color: '#22C55E', fontWeight: 700 }}>{name}</span> is online tracking their goals 🟢</>);
    }
    
    // Add in the AI actionable tips (parsed for *keyword* colors)
    aiInsights.forEach(text => {
      if (text !== 'Loading insights...' || items.length === 0) {
         // split by * to colorize emphasis
         const parts = text.split('*').map((part, i) => 
            i % 2 === 1 
              ? <span key={i} style={{ color: '#F59E0B', fontWeight: 700 }}>{part}</span> 
              : part
         );
         items.push(<span style={{ color: isDark ? '#c7c4d7' : '#475569' }}>{parts}</span>);
      }
    });

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

  const deleteNotif = async (e, id, isRead) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (!isRead) setUnread(prev => Math.max(0, prev - 1));
    try { await api.delete(`/auth/notifications/${id}/delete/`); } catch {}
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
    <>
    {/* Friend went online toast */}
    {friendToast && (
      <div
        className="fixed bottom-6 left-6 z-[400] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
        style={{
          background: isDark ? '#1F2022' : '#FFFFFF',
          border: '1px solid rgba(34,197,94,0.3)',
          boxShadow: '0 8px 32px -8px rgba(34,197,94,0.3)',
          maxWidth: '260px',
          animation: 'notification-slide-in 0.3s ease',
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}>
          {friendToast.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
            {friendToast.username} is online 🟢
          </p>
          <p className="text-[11px]" style={{ color: isDark ? '#908fa0' : '#64748B' }}>Just joined AlgoMind</p>
        </div>
        <button onClick={() => setFriendToast(null)} className="shrink-0 opacity-50 hover:opacity-100" style={{ color: isDark ? '#908fa0' : '#64748B' }}>
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    )}
    {/* Chat message popup toast */}
    {chatPopup && (
      <div
        className="fixed bottom-6 right-6 z-[400] flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl"
        style={{
          background: isDark ? '#1F2022' : '#FFFFFF',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 8px 32px -8px rgba(99,102,241,0.35)',
          maxWidth: '300px',
          animation: 'notification-slide-in 0.3s ease',
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
          {chatPopup.sender.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold mb-0.5" style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
            {chatPopup.sender}
          </p>
          <p className="text-[11px] truncate" style={{ color: isDark ? '#908fa0' : '#64748B' }}>
            {chatPopup.text}
          </p>
        </div>
        <button onClick={() => setChatPopup(null)} className="shrink-0 opacity-50 hover:opacity-100" style={{ color: isDark ? '#908fa0' : '#64748B' }}>
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    )}
    <header className="w-full px-6 pt-6 pb-2 flex justify-end items-center shrink-0">
      <div className="flex items-center gap-3">

        <button
          className="p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
          style={{ background: surface, border: `1px solid ${border}` }}
          onClick={() => navigate('/friends')}
        >
          <div className="flex -space-x-2">
            {onlineFriends.length > 0
              ? onlineFriends.slice(0, 3).map((f, i) => (
                <div key={f.id ?? i} className="relative">
                  {f.avatar
                    ? <img src={f.avatar} className="w-6 h-6 rounded-full object-cover border-2"
                        style={{ borderColor: isDark ? '#121315' : '#fff' }} alt="" />
                    : <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ borderColor: isDark ? '#121315' : '#fff', background: ['#2f3aa3','#62259b','#22C55E'][i % 3] }}>
                        {(f.username ?? '?').slice(0,2).toUpperCase()}
                      </div>
                  }
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white"
                    style={{ background: '#22C55E', borderColor: isDark ? '#121315' : '#fff' }} />
                </div>
              ))
              : ['#2f3aa3','#62259b'].map((bg, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                  style={{ borderColor: isDark ? '#121315' : '#fff', background: bg, color: '#fff' }}>
                  {['JD','SK'][i]}
                </div>
              ))
            }
          </div>
          <div>
            <p className="text-[9px] uppercase font-label leading-none mb-0.5" style={{ color: textSec }}>
              {onlineFriends.length > 0 ? `${onlineFriends.length} Online` : 'Leaderboard'}
            </p>
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



              <div className="max-h-72 overflow-y-auto custom-scrollbar">
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
                        <div className="flex items-start gap-3 relative group">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                            style={{ background: notif.color || meta.color }}
                          >
                            {avatarDisplay}
                          </div>
                          <div className="flex-grow min-w-0 pr-8">
                            <p className="text-xs font-semibold" style={{ color: textPri }}>{notif.title}</p>
                            <p className="text-[11px] leading-tight mt-0.5" style={{ color: textSec }}>{notif.body}</p>
                            <p className="text-[9px] mt-0.5 mb-1.5" style={{ color: textSec }}>{timeAgo(notif.created_at)}</p>
                            {/* Action Buttons */}
                            {notif.notif_type === 'friend_request' && (
                              <div className="flex gap-2 mb-1">
                                <button onClick={(e) => { e.stopPropagation(); navigate('/friends?tab=requests'); markRead(notif.id); }}
                                        className="text-[10px] font-bold px-3 py-1 rounded transition-all hover:opacity-80"
                                        style={{ background: '#6366F1', color: '#fff' }}>Accept</button>
                                <button onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                                        className="text-[10px] font-bold px-3 py-1 rounded transition-all hover:opacity-80"
                                        style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: textPri }}>Dismiss</button>
                              </div>
                            )}
                            {notif.notif_type === 'system' && notif.body.includes('code: ') && (
                              <div className="flex gap-2 mb-1">
                                <button onClick={(e) => {
                                          e.stopPropagation();
                                          const code = notif.body.split('code: ')[1]?.trim();
                                          if(code) navigate('/challenges?join=' + code);
                                          markRead(notif.id);
                                        }}
                                        className="text-[10px] font-bold px-3 py-1 rounded transition-all hover:opacity-80"
                                        style={{ background: '#A855F7', color: '#fff' }}>Accept Challenge</button>
                                <button onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                                        className="text-[10px] font-bold px-3 py-1 rounded transition-all hover:opacity-80"
                                        style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: textPri }}>Decline</button>
                              </div>
                            )}
                          </div>
                          
                          {/* UI actions (Read & Delete) */}
                          <div className="absolute right-0 top-0 h-full flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.read && (
                              <button onClick={(e) => { e.stopPropagation(); markRead(notif.id); }} className="hover:scale-110" style={{ color: '#22C55E' }} title="Mark as read">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              </button>
                            )}
                            <button onClick={(e) => deleteNotif(e, notif.id, notif.read)} className="hover:scale-110" style={{ color: '#EF4444' }} title="Clear notification">
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                            </button>
                          </div>

                          {!notif.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1 opacity-100 group-hover:opacity-0 transition-opacity" style={{ background: '#6366F1' }} />}
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
    </>
  );
}

export default Header;
