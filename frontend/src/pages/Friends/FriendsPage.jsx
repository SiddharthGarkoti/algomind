import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

const INITIAL_FRIENDS = [
  { id: 1, name: 'Alex Chen',   handle: 'alex.c',  rank: 1, rating: 1842, solved: 520, avatar: 'AC', color: '#6366F1', online: true  },
  { id: 2, name: 'Sara Kim',    handle: 'sara.k',  rank: 2, rating: 1791, solved: 480, avatar: 'SK', color: '#A855F7', online: true  },
  { id: 3, name: 'Raj Patel',   handle: 'raj.p',   rank: 3, rating: 1743, solved: 445, avatar: 'RP', color: '#22C55E', online: false },
  { id: 4, name: 'You',         handle: 'you',      rank: 4, rating: 1680, solved: 412, avatar: 'ME', color: '#F59E0B', online: true,  isSelf: true },
  { id: 5, name: 'Jake Wilson', handle: 'jake.w',  rank: 5, rating: 1620, solved: 398, avatar: 'JW', color: '#EF4444', online: false },
  { id: 6, name: 'Mia Scott',   handle: 'mia.s',   rank: 6, rating: 1580, solved: 372, avatar: 'MS', color: '#06B6D4', online: true  },
];

const REQUESTS = [
  { id: 8, name: 'Priya Nair',   handle: 'priya.n', avatar: 'PN', color: '#8B5CF6', mutuals: 3 },
  { id: 9, name: 'Omar Hassan',  handle: 'omar.h',  avatar: 'OH', color: '#F59E0B', mutuals: 1 },
];

function FriendsPage({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  const [tab,        setTab]        = useState('leaderboard');
  const [friends,    setFriends]    = useState(INITIAL_FRIENDS);
  const [requests,   setRequests]   = useState(REQUESTS);
  const [removingId, setRemovingId] = useState(null);

  // Chat is handled by DashboardLayout — we trigger it via onOpenChat from props
  // But DashboardLayout auto-provides onOpenChat via context pattern; here we pass down via props
  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  const removeFriend = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      setFriends(prev => prev.filter(f => f.id !== id));
      setRemovingId(null);
    }, 400);
  };

  const acceptRequest = (id) => {
    const req = requests.find(r => r.id === id);
    if (req) {
      const newFriend = { ...req, rank: friends.length + 1, rating: 1400, solved: 200, online: false };
      setFriends(prev => [...prev, newFriend]);
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  const declineRequest = (id) => setRequests(prev => prev.filter(r => r.id !== id));

  const myFriends = friends.filter(f => !f.isSelf);

  const TABS = [
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'friends',     label: `Friends (${myFriends.length})` },
    { id: 'requests',    label: `Requests${requests.length ? ` (${requests.length})` : ''}` },
  ];

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-4xl mx-auto">

        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Friends</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Compete, collaborate, and grow together</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: surfLow, border: `1px solid ${border}` }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
              style={tab === id ? { background: '#6366F1', color: '#fff' } : { color: textSec }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Leaderboard ── */}
        {tab === 'leaderboard' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4 px-4 pb-2">
              {['Rank','Name','Solved','Rating'].map(h => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textSec }}>{h}</span>
              ))}
            </div>
            {[...friends].sort((a,b) => a.rank - b.rank).map(f => (
              <div
                key={f.id}
                className="rounded-2xl p-4 transition-all hover:scale-[1.005]"
                style={{
                  background: f.isSelf ? (isDark ? 'rgba(99,102,241,0.08)' : '#EEF2FF') : surface,
                  border: `1px solid ${f.isSelf ? 'rgba(99,102,241,0.25)' : border}`,
                  opacity: removingId === f.id ? 0.2 : 1,
                  transition: 'opacity 0.4s ease, transform 0.3s ease',
                }}
              >
                <div className="grid grid-cols-4 gap-4 items-center">
                  <span className="text-lg font-headline font-extrabold"
                    style={{ color: f.rank <= 3 ? ['#F59E0B','#94A3B8','#CD7C2F'][f.rank-1] : textSec }}>
                    {f.rank <= 3 ? ['🥇','🥈','🥉'][f.rank-1] : `#${f.rank}`}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
                      style={{ background: f.color }}>{f.avatar}</div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: f.isSelf ? '#6366F1' : textPri }}>
                        {f.name}
                        {f.isSelf && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded" style={{ background:'rgba(99,102,241,0.15)',color:'#6366F1' }}>You</span>}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: f.online ? '#22C55E' : '#64748B' }} />
                        <span className="text-[9px]" style={{ color: textSec }}>{f.online ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: textPri }}>{f.solved}</span>
                  <span className="text-sm font-bold" style={{ color: f.color }}>{f.rating}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Friends List ── */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {myFriends.length === 0 && (
              <div className="text-center py-16" style={{ color: textSec }}>
                <span className="material-symbols-outlined text-4xl block mb-3">group_off</span>
                <p>No friends yet. Accept some requests!</p>
              </div>
            )}
            {myFriends.map(f => (
              <div
                key={f.id}
                className="friend-card rounded-2xl p-4 flex items-center justify-between"
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  opacity: removingId === f.id ? 0.2 : 1,
                  transition: 'opacity 0.4s ease, transform 0.2s ease',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                    style={{ background: f.color }}>{f.avatar}</div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: textPri }}>{f.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: f.online ? '#22C55E' : '#64748B' }} />
                      <span className="text-[10px]" style={{ color: textSec }}>Rank #{f.rank} · {f.solved} solved</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Challenge */}
                  <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)' }}>
                    Challenge
                  </button>
                  {/* Open Chat — triggers DashboardLayout's chat drawer via layout */}
                  <OpenChatButton friend={f} isDark={isDark} border={border} textSec={textSec} surfLow={surfLow} />
                  {/* Remove */}
                  <button
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    onClick={() => removeFriend(f.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Requests ── */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0
              ? <div className="text-center py-16" style={{ color: textSec }}>No pending requests</div>
              : requests.map(r => (
                <div key={r.id} className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ background: r.color }}>{r.avatar}</div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: textPri }}>{r.name}</p>
                      <p className="text-[10px]" style={{ color: textSec }}>{r.mutuals} mutual friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-90 active:scale-95"
                      style={{ background: '#6366F1', color: '#fff' }}
                      onClick={() => acceptRequest(r.id)}>
                      Accept
                    </button>
                    <button
                      className="px-4 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-80"
                      style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}
                      onClick={() => declineRequest(r.id)}>
                      Decline
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* Uses a custom event to trigger DashboardLayout's chat drawer */
function OpenChatButton({ friend, isDark, border, textSec, surfLow }) {
  const openChat = () => {
    window.dispatchEvent(new CustomEvent('algomind:openchat', { detail: friend }));
  };
  return (
    <button
      className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
      style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}
      onClick={openChat}
    >
      <span className="material-symbols-outlined text-sm align-middle mr-1">chat</span>Chat
    </button>
  );
}

export default FriendsPage;
