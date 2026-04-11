import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const NOTIFICATIONS_KEY = 'algomind_notifications';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'message', from: 'Alex Chen',  avatar: 'AC', color: '#6366F1', text: 'Hey! Want to do a challenge?', time: '2m ago',  read: false },
  { id: 2, type: 'system',  from: 'AlgoMind',   avatar: '🔥', color: '#A855F7', text: 'Streak at risk — solve today!',  time: '10m ago', read: false },
  { id: 3, type: 'message', from: 'Sara Kim',   avatar: 'SK', color: '#A855F7', text: 'Check out this problem!',         time: '1h ago',  read: true  },
];

function Header({ theme, toggleTheme, onOpenChat }) {
  const navigate = useNavigate();
  const [notifIndex,    setNotifIndex]    = useState(0);
  const [showPlusOne,   setShowPlusOne]   = useState(false);
  const [streak,        setStreak]        = useState(14);
  const [showNotifDrop, setShowNotifDrop] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [replyText,     setReplyText]     = useState({});
  const notifRef  = useRef(null);
  const dropRef   = useRef(null);
  const isDark = theme === 'dark';

  const unread = notifications.filter(n => !n.read).length;

  const BANNER_NOTIFS = [
    <><span style={{ color: '#6366F1', fontWeight: 700 }}>Solve 2 problems</span> to beat Alex</>,
    <><span style={{ color: '#6366F1', fontWeight: 700 }}>1 problem</span> to enter top 5</>,
    <><span style={{ color: '#EF4444', fontWeight: 700 }}>Streak at risk</span> — solve today</>,
  ];

  // Rotate banner
  useEffect(() => {
    const id = setInterval(() => {
      const el = notifRef.current;
      if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(-5px)'; el.style.transition = 'all 0.3s ease'; }
      setTimeout(() => {
        setNotifIndex(p => (p + 1) % BANNER_NOTIFS.length);
        if (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
      }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Streak +1 on first daily visit
  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem('algomind_last_visit') !== today) {
      localStorage.setItem('algomind_last_visit', today);
      setShowPlusOne(true);
      setStreak(p => p + 1);
      setTimeout(() => setShowPlusOne(false), 1500);
    }
  }, []);

  // Close dropdown clicking outside
  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowNotifDrop(false); };
    window.addEventListener('mousedown', fn);
    return () => window.removeEventListener('mousedown', fn);
  }, []);

  const markRead = (id) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));

  const handleQuickReply = (notif) => {
    if (replyText[notif.id]?.trim()) {
      markRead(notif.id);
      setReplyText(p => ({ ...p, [notif.id]: '' }));
    }
  };

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
            <p className="text-[11px] font-bold" style={{ color: textPri }}>Rank #4</p>
          </div>
        </button>

        {/* Notification Banner */}
        <div className="rounded-xl px-4 py-2.5 flex flex-col justify-center min-w-[210px] h-[48px]"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <p className="text-[9px] uppercase tracking-[0.1em] font-label leading-none mb-0.5" style={{ color: textSec }}>Notification</p>
          <div className="h-[14px] overflow-hidden">
            <p ref={notifRef} className="text-[11px] font-medium whitespace-nowrap notification-fade-in" style={{ color: isDark ? '#c7c4d7' : '#475569' }}>
              {BANNER_NOTIFS[notifIndex]}
            </p>
          </div>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:opacity-80 relative"
            style={{ background: surface, border: `1px solid ${border}`, color: textPri }}
            onClick={() => setShowNotifDrop(p => !p)}
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white badge-pop"
                style={{ background: '#EF4444' }}>
                {unread}
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
                <button className="text-[10px] font-semibold hover:opacity-70" style={{ color: '#6366F1' }} onClick={markAllRead}>
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className="px-4 py-3 space-y-2 transition-all"
                    style={{
                      background: notif.read ? 'transparent' : (isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)'),
                      borderBottom: `1px solid ${border}`,
                    }}
                    onClick={() => markRead(notif.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: notif.color }}>
                        {notif.type === 'system' ? notif.avatar : notif.avatar}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-semibold" style={{ color: textPri }}>{notif.from}</p>
                        <p className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: textSec }}>{notif.text}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: textSec }}>{notif.time}</p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: '#6366F1' }} />}
                    </div>
                    {/* Quick reply for messages */}
                    {notif.type === 'message' && (
                      <div className="flex gap-2 ml-11">
                        <input
                          value={replyText[notif.id] || ''}
                          onChange={e => setReplyText(p => ({ ...p, [notif.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleQuickReply(notif)}
                          placeholder="Quick reply..."
                          className="flex-grow text-[11px] px-3 py-1.5 rounded-lg outline-none"
                          style={{ background: isDark ? '#292a2c' : '#F1F5F9', color: textPri, border: `1px solid ${border}` }}
                          onClick={e => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuickReply(notif); }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{ background: '#6366F1', color: '#fff' }}>
                          ↑
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowNotifDrop(false); if (onOpenChat) onOpenChat({ id: notif.id, name: notif.from, avatar: notif.avatar, color: notif.color, online: true }); }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{ background: isDark ? '#292a2c' : '#F1F5F9', color: textSec, border: `1px solid ${border}` }}>
                          Open
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Streak */}
        <div className="rounded-xl px-4 py-2.5 flex items-center gap-3 relative"
          style={{ background: surface, border: `1px solid ${border}` }}>
          {showPlusOne && <span className="streak-plus-one">+1</span>}
          <div>
            <p className="text-[9px] uppercase font-label leading-none mb-0.5" style={{ color: textSec }}>Streak</p>
            <p className="text-[11px] font-bold" style={{ color: '#A855F7' }}>{streak} Days</p>
          </div>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center float-anim"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>
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
