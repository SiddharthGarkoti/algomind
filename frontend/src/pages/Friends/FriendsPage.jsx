import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../utils/api.js';

const COLOURS = ['#6366F1','#A855F7','#22C55E','#F59E0B','#EF4444','#06B6D4','#EC4899','#8B5CF6'];
const colourFor = (id) => COLOURS[(id ?? 0) % COLOURS.length];
const initials  = (name) => (name ?? '??').slice(0, 2).toUpperCase();

function FriendsPage({ theme, toggleTheme }) {
  const isDark = theme === 'dark';

  const [tab,         setTab]         = useState('leaderboard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [friends,     setFriends]     = useState([]);
  const [requests,    setRequests]    = useState([]);
  const [searchQ,     setSearchQ]     = useState('');
  const [searchRes,   setSearchRes]   = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState(null);

  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#292a2c' : '#F8FAFC';
  const border  = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  const loadLeaderboard = useCallback(() =>
    api.get('/auth/leaderboard/?limit=50').then(d => setLeaderboard(d.leaderboard ?? [])).catch(() => {}), []);
  const loadFriends     = useCallback(() =>
    api.get('/friends/list/').then(d => setFriends(Array.isArray(d) ? d : (d?.results ?? []))).catch(() => {}), []);
  const loadRequests    = useCallback(() =>
    api.get('/friends/requests/').then(d => setRequests(Array.isArray(d) ? d : (d?.results ?? []))).catch(() => {}), []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadLeaderboard(), loadFriends(), loadRequests()]).finally(() => setLoading(false));
  }, [loadLeaderboard, loadFriends, loadRequests]);

  /* Debounced user search */
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchRes([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      api.get(`/auth/search/?q=${encodeURIComponent(searchQ)}`)
        .then(d => setSearchRes(d.results ?? []))
        .catch(() => setSearchRes([]))
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const sendRequest = async (userId) => {
    setActionId(userId);
    try {
      await api.post('/friends/send/', { receiver_id: userId });
      setSearchRes(prev => prev.filter(u => u.id !== userId));
    } catch (e) { alert(e?.detail ?? 'Could not send request.'); }
    finally { setActionId(null); }
  };

  const acceptRequest = async (reqId) => {
    setActionId(reqId);
    try { await api.post(`/friends/requests/${reqId}/accept/`); loadRequests(); loadFriends(); }
    finally { setActionId(null); }
  };

  const declineRequest = async (reqId) => {
    setActionId(reqId);
    try { await api.post(`/friends/requests/${reqId}/reject/`); loadRequests(); }
    finally { setActionId(null); }
  };

  const removeFriend = async (friendUserId) => {
    if (!window.confirm('Remove this friend?')) return;
    setActionId(friendUserId);
    try { await api.delete(`/friends/remove/${friendUserId}/`); loadFriends(); }
    finally { setActionId(null); }
  };

  const openChat = (friendUser) =>
    window.dispatchEvent(new CustomEvent('algomind:openchat', { detail: { ...friendUser, id: friendUser.id } }));

  const TABS = [
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'friends',     label: `Friends (${friends.length})` },
    { id: 'requests',    label: `Requests${requests.length ? ` (${requests.length})` : ''}` },
    { id: 'add',         label: 'Add Friend' },
  ];

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-4xl mx-auto">

        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Friends</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Compete, collaborate, and grow together</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl w-fit flex-wrap" style={{ background: surfLow, border: `1px solid ${border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all relative"
              style={tab === t.id ? { background: '#6366F1', color: '#fff' } : { color: textSec }}>
              {t.label}
              {t.id === 'requests' && requests.length > 0 && tab !== 'requests' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-16" style={{ color: textSec }}>
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading...
          </div>
        )}

        {/* Leaderboard */}
        {!loading && tab === 'leaderboard' && (
          <div className="space-y-2">
            <div className="grid grid-cols-[40px_1fr_80px_90px] gap-4 px-4 pb-1">
              {['Rank','Name','Level','Rating'].map(h => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textSec }}>{h}</span>
              ))}
            </div>
            {leaderboard.length === 0 && (
              <p className="text-center py-10 text-sm" style={{ color: textSec }}>No users yet.</p>
            )}
            {leaderboard.map(entry => (
              <div key={entry.id}
                className="rounded-2xl p-4 transition-all hover:scale-[1.003]"
                style={{
                  background: entry.is_self ? (isDark ? 'rgba(99,102,241,0.08)' : '#EEF2FF') : surface,
                  border: `1px solid ${entry.is_self ? 'rgba(99,102,241,0.3)' : border}`,
                }}>
                <div className="grid grid-cols-[40px_1fr_80px_90px] gap-4 items-center">
                  <span className="text-lg font-headline font-extrabold"
                    style={{ color: entry.rank <= 3 ? ['#F59E0B','#94A3B8','#CD7C2F'][entry.rank-1] : textSec }}>
                    {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank-1] : `#${entry.rank}`}
                  </span>
                  <div className="flex items-center gap-3">
                    {entry.avatar
                      ? <img src={entry.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                      : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
                          style={{ background: colourFor(entry.id) }}>{initials(entry.username)}</div>
                    }
                    <div>
                      <p className="text-sm font-bold" style={{ color: entry.is_self ? '#6366F1' : textPri }}>
                        {entry.username}
                        {entry.is_self && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded" style={{ background:'rgba(99,102,241,0.15)',color:'#6366F1' }}>You</span>}
                      </p>
                      <p className="text-[9px]" style={{ color: textSec }}>🔥 {entry.streak}d streak</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: textPri }}>Lv {entry.level}</span>
                  <span className="text-sm font-bold" style={{ color: colourFor(entry.id) }}>{entry.rating}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        {!loading && tab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 && (
              <div className="text-center py-16" style={{ color: textSec }}>
                <span className="material-symbols-outlined text-4xl block mb-3">group_off</span>
                <p>No friends yet. Go to <strong>Add Friend</strong> to search for users!</p>
              </div>
            )}
            {friends.map(f => {
              const friend = f.friend;
              return (
                <div key={f.id}
                  className="friend-card rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-4">
                    {friend?.avatar
                      ? <img src={friend.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                      : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                          style={{ background: colourFor(friend?.id) }}>{initials(friend?.username)}</div>
                    }
                    <div>
                      <p className="text-sm font-bold" style={{ color: textPri }}>{friend?.username}</p>
                      <p className="text-[10px]" style={{ color: textSec }}>Lv {friend?.level} · Rating {friend?.rating} · 🔥{friend?.streak}d</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                      style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}
                      onClick={() => openChat(friend)}>
                      <span className="material-symbols-outlined text-sm align-middle mr-1">chat</span>Chat
                    </button>
                    <button
                      disabled={actionId === friend?.id}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                      onClick={() => removeFriend(friend?.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Requests */}
        {!loading && tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0
              ? <div className="text-center py-16" style={{ color: textSec }}>No pending requests</div>
              : requests.map(r => (
                <div key={r.id} className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-4">
                    {r.sender_info?.avatar
                      ? <img src={r.sender_info.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                      : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                          style={{ background: colourFor(r.sender_info?.id) }}>{initials(r.sender_info?.username)}</div>
                    }
                    <div>
                      <p className="text-sm font-bold" style={{ color: textPri }}>{r.sender_info?.username}</p>
                      <p className="text-[10px]" style={{ color: textSec }}>Lv {r.sender_info?.level} · Rating {r.sender_info?.rating}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={actionId === r.id}
                      className="px-4 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-90 active:scale-95 disabled:opacity-50"
                      style={{ background: '#6366F1', color: '#fff' }}
                      onClick={() => acceptRequest(r.id)}>Accept</button>
                    <button disabled={actionId === r.id}
                      className="px-4 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-80 disabled:opacity-50"
                      style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}
                      onClick={() => declineRequest(r.id)}>Decline</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Add Friend */}
        {!loading && tab === 'add' && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-2xl p-3" style={{ background: surface, border: `1px solid ${border}` }}>
              <span className="material-symbols-outlined self-center" style={{ color: textSec }}>search</span>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by username…"
                className="flex-grow bg-transparent outline-none text-sm"
                style={{ color: textPri }}
                autoFocus
              />
              {searching && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin self-center" />}
            </div>

            {searchRes.length > 0 && (
              <div className="space-y-2">
                {searchRes.map(u => (
                  <div key={u.id}
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{ background: surface, border: `1px solid ${border}` }}>
                    <div className="flex items-center gap-3">
                      {u.avatar
                        ? <img src={u.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                        : <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[11px]"
                            style={{ background: colourFor(u.id) }}>{initials(u.username)}</div>
                      }
                      <div>
                        <p className="text-sm font-bold" style={{ color: textPri }}>{u.username}</p>
                        <p className="text-[10px]" style={{ color: textSec }}>Lv {u.level} · Rating {u.rating}</p>
                      </div>
                    </div>
                    <button
                      disabled={actionId === u.id}
                      onClick={() => sendRequest(u.id)}
                      className="px-4 py-1.5 rounded-xl text-[10px] font-bold disabled:opacity-50 transition-all hover:opacity-90"
                      style={{ background: '#6366F1', color: '#fff' }}>
                      {actionId === u.id ? 'Sending…' : '+ Add Friend'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQ.length >= 2 && !searching && searchRes.length === 0 && (
              <p className="text-center text-sm py-8" style={{ color: textSec }}>No users found for "{searchQ}"</p>
            )}

            {searchQ.length < 2 && (
              <div className="text-center py-10" style={{ color: textSec }}>
                <span className="material-symbols-outlined text-3xl block mb-2">person_search</span>
                Type at least 2 characters to search
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default FriendsPage;
