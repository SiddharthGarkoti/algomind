import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import {
  dispatchChallengeStart,
  dispatchChallengeEnd,
  listenToExtension,
} from '../../hooks/useAlgoMindExtension.js';
import ExtensionGuard from '../../components/ExtensionGuard/ExtensionGuard.jsx';

/* ── Shared theme tokens ─────────────────────────────────────────── */
function useTheme(isDark) {
  return {
    bg: isDark ? '#0A0A0B' : '#F0EDFF',
    surface: isDark ? '#18181b' : '#FFFFFF',
    surfLow: isDark ? '#222326' : '#F4F4F8',
    glass: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)',
    border: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.15)',
    textPri: isDark ? '#e3e2e5' : '#0F172A',
    textSec: isDark ? '#908fa0' : '#64748B',
  };
}

/* ── Floating glass card ─────────────────────────────────────────── */
function GlassCard({ children, className = '', style = {}, isDark }) {
  const t = useTheme(isDark);
  return (
    <div
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{
        background: t.glass,
        border: `1px solid ${t.border}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isDark
          ? '0 8px 32px -8px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 8px 32px -8px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
        transform: 'translateZ(0)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Difficulty badge ────────────────────────────────────────────── */
const DIFF_COLOR = { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' };
function DiffBadge({ diff }) {
  const c = DIFF_COLOR[diff] ?? '#6366F1';
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
      style={{ background: `${c}18`, color: c }}>
      {diff}
    </span>
  );
}

/* ── Countdown timer ─────────────────────────────────────────────── */
function Countdown({ seconds, isDark }) {
  const t = useTheme(isDark);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const fmt = (n) => String(n).padStart(2, '0');
  const urgent = seconds < 300;
  return (
    <div className="flex items-center gap-1.5">
      <span className="material-symbols-outlined text-sm" style={{ color: urgent ? '#EF4444' : '#6366F1' }}>timer</span>
      <span className="font-mono font-bold text-sm" style={{ color: urgent ? '#EF4444' : t.textPri }}>
        {h > 0 && `${fmt(h)}:`}{fmt(m)}:{fmt(s)}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Contest Tab — placeholder
══════════════════════════════════════════════════════════════════ */
function ContestTab({ isDark }) {
  const t = useTheme(isDark);
  return (
    <div className="space-y-6">
      {/* Weekly */}
      <GlassCard isDark={isDark} className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <span className="material-symbols-outlined text-2xl" style={{ color: '#6366F1' }}>calendar_month</span>
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: t.textPri }}>Weekly Contest</h3>
            <p className="text-xs" style={{ color: t.textSec }}>Every Sunday · 1.5 hours · 4 problems</p>
          </div>
          <div className="ml-auto px-3 py-1 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
            Coming Soon
          </div>
        </div>
        <div className="rounded-2xl p-6 text-center" style={{ background: t.surfLow, border: `1px solid ${t.border}` }}>
          <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: '#6366F1', opacity: 0.4 }}>emoji_events</span>
          <p className="text-sm font-semibold mb-1" style={{ color: t.textPri }}>No active weekly contest</p>
          <p className="text-xs" style={{ color: t.textSec }}>Check back on Sunday for the next round. Rankings will appear here.</p>
        </div>
      </GlassCard>

      {/* Monthly */}
      <GlassCard isDark={isDark} className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.15)' }}>
            <span className="material-symbols-outlined text-2xl" style={{ color: '#A855F7' }}>military_tech</span>
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: t.textPri }}>Monthly Grand Prix</h3>
            <p className="text-xs" style={{ color: t.textSec }}>Last Sunday of month · 3 hours · 6 problems</p>
          </div>
          <div className="ml-auto px-3 py-1 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>
            Coming Soon
          </div>
        </div>
        <div className="rounded-2xl p-6 text-center" style={{ background: t.surfLow, border: `1px solid ${t.border}` }}>
          <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: '#A855F7', opacity: 0.4 }}>workspace_premium</span>
          <p className="text-sm font-semibold mb-1" style={{ color: t.textPri }}>No active monthly contest</p>
          <p className="text-xs" style={{ color: t.textSec }}>Monthly Grand Prix launches soon. Earn exclusive badges and climb the global leaderboard.</p>
        </div>
      </GlassCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AI Shuffle Filter Modal
══════════════════════════════════════════════════════════════════ */
const TOPIC_OPTIONS = [
  'Array', 'String', 'Dynamic Programming', 'Tree', 'Graph', 'Linked List',
  'Binary Search', 'Stack', 'Hash Table', 'Two Pointers', 'Greedy',
  'Backtracking', 'Heap', 'Sliding Window', 'Matrix', 'Math',
  'Bit Manipulation', 'Sorting',
];
const DIFF_OPTIONS = ['easy', 'medium', 'hard'];

function ShuffleFilterModal({ isDark, onClose, onShuffle }) {
  const t = useTheme(isDark);
  const [selTopics, setSelTopics] = useState([]);
  const [selDiffs, setSelDiffs] = useState([]);
  const [busy, setBusy] = useState(false);

  const toggle = (setArr, val) =>
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const handleShuffle = async () => {
    setBusy(true);
    await onShuffle(selTopics, selDiffs);
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: isDark ? '#18181b' : '#fff', border: `1px solid rgba(99,102,241,0.2)` }}
        onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold" style={{ color: t.textPri }}>AI Shuffle</h3>
              <p className="text-xs mt-0.5" style={{ color: t.textSec }}>Filter by topic and difficulty (optional)</p>
            </div>
            <button onClick={onClose}><span className="material-symbols-outlined" style={{ color: t.textSec }}>close</span></button>
          </div>

          <div className="mb-4">
            <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSec }}>Topics</p>
            <div className="flex flex-wrap gap-1.5">
              {TOPIC_OPTIONS.map(top => (
                <button key={top} onClick={() => toggle(setSelTopics, top)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                  style={selTopics.includes(top)
                    ? { background: '#6366F1', color: '#fff' }
                    : { background: t.surfLow, color: t.textSec, border: `1px solid ${t.border}` }}>
                  {top}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSec }}>Difficulty</p>
            <div className="flex gap-2">
              {DIFF_OPTIONS.map(d => {
                const c = DIFF_COLOR[d];
                return (
                  <button key={d} onClick={() => toggle(setSelDiffs, d)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all"
                    style={selDiffs.includes(d)
                      ? { background: c, color: '#fff' }
                      : { background: t.surfLow, color: t.textSec, border: `1px solid ${t.border}` }}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleShuffle} disabled={busy}
            className="w-full py-3 rounded-2xl font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
            {busy
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-sm">auto_awesome</span>}
            {selTopics.length === 0 && selDiffs.length === 0 ? 'Shuffle (Any)' : 'Shuffle with Filters'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Invite Friends Modal
══════════════════════════════════════════════════════════════════ */
function InviteFriendsModal({ isDark, partyCode, onClose, onInvite }) {
  const t = useTheme(isDark);
  const [friends, setFriends] = useState([]);
  const [sending, setSending] = useState(null);
  const [sent, setSent] = useState(new Set());
  const shareUrl = `${window.location.origin}/challenges?join=${partyCode}`;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/friends/list/').then(d => {
      const list = Array.isArray(d) ? d : (d?.results ?? []);
      setFriends(list.map(f => f.friend).filter(Boolean));
    }).catch(() => { });
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => { });
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const invite = async (friendId) => {
    setSending(friendId);
    await onInvite(friendId);
    setSent(prev => new Set([...prev, friendId]));
    setSending(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: isDark ? '#18181b' : '#fff', border: `1px solid rgba(99,102,241,0.2)` }}
        onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: t.textPri }}>Invite Friends</h3>
            <button onClick={onClose}><span className="material-symbols-outlined" style={{ color: t.textSec }}>close</span></button>
          </div>

          {/* Copy link */}
          <button onClick={copyLink}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl mb-4 transition-all hover:opacity-90"
            style={{ background: t.surfLow, border: `1px solid ${t.border}` }}>
            <span className="text-xs font-mono truncate" style={{ color: t.textSec }}>{shareUrl}</span>
            <span className="material-symbols-outlined text-sm shrink-0" style={{ color: copied ? '#22C55E' : '#6366F1' }}>
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>

          {/* Friends list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {friends.length === 0 && (
              <p className="text-center text-xs py-6" style={{ color: t.textSec }}>No friends yet — share the link above!</p>
            )}
            {friends.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl"
                style={{ background: t.surfLow }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
                    {f.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: t.textPri }}>{f.username}</span>
                </div>
                <button
                  disabled={!!sending || sent.has(f.id)}
                  onClick={() => invite(f.id)}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-bold disabled:opacity-50 transition-all"
                  style={{ background: sent.has(f.id) ? 'rgba(34,197,94,0.15)' : '#6366F1', color: sent.has(f.id) ? '#22C55E' : '#fff' }}>
                  {sending === f.id ? '…' : sent.has(f.id) ? '✓ Sent' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Party Lobby — waiting for host to start
══════════════════════════════════════════════════════════════════ */
function PartyLobby({ party, me, isDark, onStart, onShuffleFilter, onAddQuestion, onRemoveQuestion, onKick, onRename, onInvite }) {
  const t = useTheme(isDark);
  const isHost = party.host_username === me;

  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState('url');   // 'url' | 'number'
  const [addForm, setAddForm] = useState({ title: '', platform: 'leetcode', url: '', slug: '', difficulty: 'medium' });
  const [lcNumber, setLcNumber] = useState('');
  const [lcLookupBusy, setLcLookupBusy] = useState(false);
  const [lcLookupErr, setLcLookupErr] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [showShuffle, setShowShuffle] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(party.name);
  const [renameBusy, setRenameBusy] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    await onAddQuestion(addForm);
    setAddForm({ title: '', platform: 'leetcode', url: '', slug: '', difficulty: 'medium' });
    setLcNumber('');
    setAddOpen(false);
    setAddBusy(false);
  };

  const lookupLcNumber = async () => {
    if (!lcNumber.trim()) return;
    setLcLookupBusy(true); setLcLookupErr('');
    try {
      const res = await api.get(`/challenges/leetcode-problem/${lcNumber.trim()}/`);
      setAddForm({ title: res.title, platform: 'leetcode', url: res.url, slug: res.slug, difficulty: res.difficulty });
    } catch (e) {
      setLcLookupErr(e?.detail ?? 'Problem not found');
    } finally {
      setLcLookupBusy(false);
    }
  };

  const handleRename = async () => {
    setRenameBusy(true);
    await onRename(renameVal);
    setRenaming(false);
    setRenameBusy(false);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <GlassCard isDark={isDark} className="p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-mono font-black tracking-widest" style={{ color: '#6366F1' }}>{party.code}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>WAITING</span>
            </div>
            {renaming ? (
              <div className="flex items-center gap-2 mb-1">
                <input value={renameVal} onChange={e => setRenameVal(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl text-sm outline-none border"
                  style={{ background: t.surfLow, color: t.textPri, borderColor: t.border }}
                  onKeyDown={e => e.key === 'Enter' && handleRename()} autoFocus />
                <button onClick={handleRename} disabled={renameBusy}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: '#6366F1', color: '#fff' }}>
                  {renameBusy ? '…' : 'Save'}
                </button>
                <button onClick={() => setRenaming(false)} className="text-xs" style={{ color: t.textSec }}>Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ color: t.textPri }}>{party.name}</h2>
                {isHost && (
                  <button onClick={() => setRenaming(true)} className="opacity-40 hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-sm" style={{ color: t.textSec }}>edit</span>
                  </button>
                )}
              </div>
            )}
            <p className="text-xs" style={{ color: t.textSec }}>
              {party.duration_minutes} min · {party.max_questions} questions · hosted by {party.host_username}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{ background: t.surfLow, color: t.textPri, border: `1px solid ${t.border}` }}>
              <span className="material-symbols-outlined text-sm">person_add</span>
              Invite
            </button>
            {isHost && (
              <button onClick={onStart} disabled={party.questions.length === 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.03] disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff',
                  boxShadow: '0 8px 24px -6px rgba(99,102,241,0.5)'
                }}>
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Start Party
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <GlassCard isDark={isDark} className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: t.textSec }}>
            Members ({party.members.length})
          </h3>
          <div className="space-y-3">
            {party.members.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: t.surfLow }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff' }}>
                  {m.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold flex-1" style={{ color: t.textPri }}>{m.username}</span>
                {m.is_host && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>HOST</span>
                )}
                {isHost && !m.is_host && (
                  <button onClick={() => onKick(m.id)}
                    className="opacity-30 hover:opacity-100 transition-opacity ml-1"
                    title="Kick member">
                    <span className="material-symbols-outlined text-sm" style={{ color: '#EF4444' }}>person_remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Questions */}
        <GlassCard isDark={isDark} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: t.textSec }}>
              Questions ({party.questions.length}/{party.max_questions})
            </h3>
            {isHost && (
              <div className="flex gap-2">
                <button onClick={() => setShowShuffle(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:opacity-90"
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}>
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  AI Shuffle
                </button>
                {party.questions.length < party.max_questions && (
                  <button onClick={() => setAddOpen(v => !v)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:opacity-90"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Add form */}
          {addOpen && isHost && (
            <form onSubmit={handleAdd} className="mb-4 space-y-2 p-4 rounded-2xl"
              style={{ background: t.surfLow, border: `1px solid ${t.border}` }}>
              {/* Mode toggle */}
              <div className="flex gap-1 p-1 rounded-xl mb-1" style={{ background: t.surface }}>
                {[['url', 'By URL'], ['number', 'LC Number']].map(([mode, label]) => (
                  <button key={mode} type="button" onClick={() => setAddMode(mode)}
                    className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={addMode === mode ? { background: '#6366F1', color: '#fff' } : { color: t.textSec }}>
                    {label}
                  </button>
                ))}
              </div>

              {addMode === 'number' ? (
                <div>
                  <div className="flex gap-2">
                    <input placeholder="e.g. 1" value={lcNumber} type="number"
                      onChange={e => { setLcNumber(e.target.value); setLcLookupErr(''); setAddForm(f => ({ ...f, title: '', slug: '', url: '' })); }}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none bg-transparent border"
                      style={{ color: t.textPri, borderColor: t.border }} />
                    <button type="button" onClick={lookupLcNumber} disabled={lcLookupBusy || !lcNumber}
                      className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                      style={{ background: '#6366F1', color: '#fff' }}>
                      {lcLookupBusy ? '…' : 'Fetch'}
                    </button>
                  </div>
                  {lcLookupErr && <p className="text-[10px] text-red-400 mt-1">{lcLookupErr}</p>}
                  {addForm.title && (
                    <div className="mt-2 p-2 rounded-xl flex items-center gap-2"
                      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: '#6366F1' }}>check_circle</span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: t.textPri }}>{addForm.title}</p>
                        <p className="text-[10px]" style={{ color: t.textSec }}>{addForm.difficulty} · {addForm.slug}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input required placeholder="Problem title" value={addForm.title}
                    onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-transparent border"
                    style={{ color: t.textPri, borderColor: t.border }} />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={addForm.platform} onChange={e => setAddForm(f => ({ ...f, platform: e.target.value }))}
                      className="px-3 py-2 rounded-xl text-xs outline-none"
                      style={{ background: t.surface, color: t.textPri, border: `1px solid ${t.border}` }}>
                      <option value="leetcode">LeetCode</option>
                      <option value="codeforces">Codeforces</option>
                    </select>
                    <select value={addForm.difficulty} onChange={e => setAddForm(f => ({ ...f, difficulty: e.target.value }))}
                      className="px-3 py-2 rounded-xl text-xs outline-none"
                      style={{ background: t.surface, color: t.textPri, border: `1px solid ${t.border}` }}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <input required placeholder="Problem URL" value={addForm.url} type="url"
                    onChange={e => {
                      const url = e.target.value;
                      const lcMatch = url.match(/leetcode\.com\/problems\/([^/]+)/);
                      const cfMatch = url.match(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Z0-9]+)/i);
                      let slug = addForm.slug;
                      if (lcMatch) slug = lcMatch[1];
                      else if (cfMatch) slug = `${cfMatch[1]}-${cfMatch[2]}`;
                      setAddForm(f => ({ ...f, url, slug }));
                    }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-transparent border"
                    style={{ color: t.textPri, borderColor: t.border }} />
                  <input required placeholder="Problem slug (auto-filled)" value={addForm.slug}
                    onChange={e => setAddForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-transparent border"
                    style={{ color: t.textPri, borderColor: t.border }} />
                </>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={addBusy || !addForm.title}
                  className="flex-1 py-2 rounded-xl text-xs font-bold"
                  style={{ background: '#6366F1', color: '#fff' }}>
                  {addBusy ? 'Adding…' : 'Add Question'}
                </button>
                <button type="button" onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs"
                  style={{ color: t.textSec }}>Cancel</button>
              </div>
            </form>
          )}

          {party.questions.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl block mb-2" style={{ color: '#6366F1', opacity: 0.3 }}>quiz</span>
              <p className="text-xs" style={{ color: t.textSec }}>
                {isHost ? 'Use AI Shuffle or add questions manually' : 'Waiting for host to add questions…'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {party.questions.map((q, i) => (
                <div key={q.id} className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: t.surfLow }}>
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: t.textPri }}>{q.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <DiffBadge diff={q.difficulty} />
                      <span className="text-[9px]" style={{ color: t.textSec }}>{q.platform}</span>
                    </div>
                  </div>
                  {isHost && (
                    <button onClick={() => onRemoveQuestion(q.id)}
                      className="shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-sm" style={{ color: '#EF4444' }}>delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {showShuffle && (
        <ShuffleFilterModal isDark={isDark} onClose={() => setShowShuffle(false)} onShuffle={onShuffleFilter} />
      )}
      {showInvite && (
        <InviteFriendsModal isDark={isDark} partyCode={party.code} onClose={() => setShowInvite(false)} onInvite={onInvite} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Active Party Room
══════════════════════════════════════════════════════════════════ */
function PartyRoom({ party, me, isDark, onCheckCompletion, onEndParty, onForfeit, timeLeft }) {
  const t = useTheme(isDark);

  const isHost = party.host_username === me;
  const myMember = party.members.find(m => m.username === me);
  const myDoneIds = new Set((myMember?.completions ?? []).filter(c => c.verified).map(c => c.question_id));
  const totalQ = party.questions.length;

  // Sorted leaderboard — track prev ranks for slide animation
  const sorted = [...party.members].sort((a, b) => {
    if (b.completed_count !== a.completed_count) return b.completed_count - a.completed_count;
    if (a.finished_at && b.finished_at) return new Date(a.finished_at) - new Date(b.finished_at);
    if (a.finished_at) return -1;
    if (b.finished_at) return 1;
    return 0;
  });

  const prevRanksRef = useRef({});
  const [rankAnims, setRankAnims] = useState({}); // memberId → 'up'|'down'|null

  useEffect(() => {
    const newAnims = {};
    sorted.forEach((m, i) => {
      const prev = prevRanksRef.current[m.id];
      if (prev !== undefined && prev !== i) {
        newAnims[m.id] = prev > i ? 'up' : 'down';
      }
    });
    setRankAnims(newAnims);
    const ids = Object.keys(newAnims);
    if (ids.length > 0) {
      setTimeout(() => setRankAnims({}), 800);
    }
    prevRanksRef.current = Object.fromEntries(sorted.map((m, i) => [m.id, i]));
  }, [party.members.map(m => m.completed_count).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const winner = sorted[0]?.finished_at ? sorted[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard isDark={isDark} className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#22C55E' }}>LIVE</span>
              <span className="text-xs ml-1" style={{ color: t.textSec }}>Code Party · {party.code}</span>
            </div>
            <h2 className="text-xl font-bold" style={{ color: t.textPri }}>{party.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Countdown seconds={timeLeft} isDark={isDark} />
            {isHost ? (
              <button onClick={() => { if (window.confirm('End party for everyone?')) onEndParty(); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                End Party
              </button>
            ) : !myMember?.finished_at ? (
              <button onClick={() => { if (window.confirm('Forfeit this challenge?')) onForfeit(); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                Forfeit
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                <span className="material-symbols-outlined text-sm">cancel</span> Forfeited
              </span>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: t.surfLow }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(0, (1 - timeLeft / (party.duration_minutes * 60)) * 100)}%`,
                background: 'linear-gradient(90deg, #6366F1, #A855F7)',
              }} />
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: t.textSec }}>Problems</h3>
          {party.questions.map((q, i) => {
            const done = myDoneIds.has(q.id);
            return (
              <GlassCard key={q.id} isDark={isDark} className="p-5" style={{ opacity: done ? 0.7 : 1 }}>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black"
                    style={{ background: done ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.12)', color: done ? '#22C55E' : '#6366F1' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: t.textPri }}>{q.title}</span>
                      <DiffBadge diff={q.difficulty} />
                      <span className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>{q.platform}</span>
                    </div>
                    {done ? (
                      <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>✓ Verified complete</span>
                    ) : myMember?.finished_at ? (
                      <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>Locked (Finished/Forfeited)</span>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <a href={q.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                          style={{ background: '#6366F1', color: '#fff' }}>
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Solve on {q.platform === 'leetcode' ? 'LeetCode' : 'Codeforces'}
                        </a>
                        <button onClick={() => onCheckCompletion(q.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                          style={{ background: t.surfLow, color: t.textPri, border: `1px solid ${t.border}` }}>
                          <span className="material-symbols-outlined text-sm">verified</span>
                          I solved it!
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Live Leaderboard */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 px-1" style={{ color: t.textSec }}>Live Rankings</h3>
          {winner && (
            <GlassCard isDark={isDark} className="p-4 mb-3 text-center"
              style={{ background: 'rgba(250,204,21,0.08)', borderColor: 'rgba(250,204,21,0.3)' }}>
              <span className="text-2xl">🏆</span>
              <p className="text-sm font-bold mt-1" style={{ color: '#EAB308' }}>{winner.username} finished first!</p>
            </GlassCard>
          )}
          <div className="space-y-2">
            {sorted.map((m, i) => {
              const anim = rankAnims[m.id];
              return (
                <GlassCard key={m.id} isDark={isDark} className="p-4"
                  style={{
                    transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: anim === 'up' ? 'translateY(-4px) scale(1.02)' : anim === 'down' ? 'translateY(4px)' : 'none',
                    borderColor: anim === 'up' ? 'rgba(34,197,94,0.4)' : undefined,
                  }}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black w-6 text-center flex items-center gap-0.5">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      {anim === 'up' && <span className="text-[9px] text-green-400 animate-bounce">↑</span>}
                      {anim === 'down' && <span className="text-[9px] text-red-400">↓</span>}
                    </span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff' }}>
                      {m.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: m.username === me ? '#6366F1' : t.textPri }}>
                        {m.username}{m.username === me ? ' (you)' : ''}
                      </p>
                      <p className="text-[10px]" style={{ color: t.textSec }}>{m.completed_count}/{totalQ} done</p>
                    </div>
                    {m.finished_at && <span className="text-[10px]" style={{ color: '#22C55E' }}>✓</span>}
                  </div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: t.surfLow }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${totalQ > 0 ? (m.completed_count / totalQ) * 100 : 0}%`,
                        background: m.username === me ? '#6366F1' : '#A855F7',
                      }} />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Friends Code Party Tab
══════════════════════════════════════════════════════════════════ */
const PARTY_SESSION_KEY = 'algomind_party_session';

function PartyTab({ isDark }) {
  const t = useTheme(isDark);
  const { user } = useAuth();

  // Restore party state from sessionStorage so page navigation doesn't kill the session
  const [view, setView] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(PARTY_SESSION_KEY) || '{}').view ?? 'home'; } catch { return 'home'; }
  });
  const [party, setParty] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(PARTY_SESSION_KEY) || '{}').party ?? null; } catch { return null; }
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(PARTY_SESSION_KEY) || '{}').timeLeft ?? 0; } catch { return 0; }
  });

  // Persist view + party + timeLeft to sessionStorage whenever they change
  useEffect(() => {
    if (view === 'home') { sessionStorage.removeItem(PARTY_SESSION_KEY); return; }
    try {
      sessionStorage.setItem(PARTY_SESSION_KEY, JSON.stringify({ view, party, timeLeft }));
    } catch { /* quota error — ignore */ }
  }, [view, party, timeLeft]);

  const pollRef = useRef(null);
  const partyCode = party?.code;

  const refreshParty = useCallback(async () => {
    if (!partyCode) return;
    try {
      const p = await api.get(`/challenges/party/${partyCode}/`);
      setParty(p);
      setTimeLeft(p.time_remaining ?? 0);
      if (p.status === 'active' && view !== 'room') setView('room');
      if (p.status === 'finished' && view !== 'finished') setView('finished');
    } catch { /* ignore */ }
  }, [partyCode, view]);

  // Poll every 5 s while in lobby or room
  useEffect(() => {
    if ((view === 'lobby' || view === 'room') && partyCode) {
      refreshParty();
      pollRef.current = setInterval(refreshParty, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [view, partyCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Local countdown tick
  useEffect(() => {
    if (view !== 'room') return;
    const tick = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick);
  }, [view]);

  // Auto-join from URL ?join=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code) setJoinCode(code.toUpperCase());
  }, []);

  const me = user?.username ?? '';

  // ── Handlers ────────────────────────────────────────────────────

  const handleCreate = async (opts) => {
    setBusy(true); setError('');
    try {
      const p = await api.post('/challenges/party/create/', opts);
      setParty(p); setView('lobby'); setCreateOpen(false);
    } catch (e) { setError(e?.detail ?? 'Failed to create party.'); }
    finally { setBusy(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setBusy(true); setError('');
    try {
      const p = await api.post(`/challenges/party/${joinCode.trim().toUpperCase()}/join/`, {});
      setParty(p);
      setView(p.status === 'active' ? 'room' : 'lobby');
    } catch (e) { setError(e?.detail ?? 'Party not found.'); }
    finally { setBusy(false); }
  };

  const handleStart = async () => {
    try {
      const p = await api.post(`/challenges/party/${partyCode}/start/`, {});
      setParty(p); setTimeLeft(p.time_remaining ?? 0); setView('room');
      // Notify extension to start monitoring
      dispatchChallengeStart(partyCode);
    } catch (e) { setError(e?.detail ?? 'Failed to start.'); }
  };

  const handleShuffleFilter = async (topics, difficulties) => {
    try {
      const p = await api.post(`/challenges/party/${partyCode}/questions/shuffle-filter/`, { topics, difficulties });
      setParty(p);
    } catch (e) { setError(e?.detail ?? 'Shuffle failed.'); }
  };

  const handleAddQuestion = async (form) => {
    try {
      await api.post(`/challenges/party/${partyCode}/questions/add/`, form);
      await refreshParty();
    } catch (e) { setError(e?.detail ?? 'Failed to add question.'); }
  };

  const handleRemoveQuestion = async (qid) => {
    try {
      await api.delete(`/challenges/party/${partyCode}/questions/${qid}/remove/`);
      await refreshParty();
    } catch (e) { setError(e?.detail ?? 'Failed to remove.'); }
  };

  const handleKick = async (memberId) => {
    try {
      await api.delete(`/challenges/party/${partyCode}/kick/${memberId}/`);
      await refreshParty();
    } catch (e) { setError(e?.detail ?? 'Kick failed.'); }
  };

  const handleRename = async (name) => {
    try {
      const p = await api.patch(`/challenges/party/${partyCode}/rename/`, { name });
      setParty(p);
    } catch (e) { setError(e?.detail ?? 'Rename failed.'); }
  };

  const handleInvite = async (receiverId) => {
    try { await api.post(`/challenges/party/${partyCode}/invite/`, { receiver_id: receiverId }); }
    catch (e) { setError(e?.detail ?? 'Invite failed.'); }
  };

  const handleCheckCompletion = async (qid) => {
    try {
      const res = await api.post(`/challenges/party/${partyCode}/questions/${qid}/check/`, {});
      if (res.verified) { await refreshParty(); }
      else {
        setError('Not verified yet — make sure you submitted Accepted on ' +
          (party.questions.find(q => q.id === qid)?.platform ?? 'the platform') + '.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (e) { setError(e?.detail ?? 'Verification failed.'); }
  };

  const handleEndParty = async () => {
    try {
      const p = await api.post(`/challenges/party/${partyCode}/end/`, {});
      dispatchChallengeEnd(); // Stop extension monitoring
      setParty(p); setView('finished');
    } catch (e) { setError(e?.detail ?? 'Failed to end party.'); }
  };

  const handleForfeit = async (reason = 'Manual forfeit') => {
    try {
      await api.post(`/challenges/party/${partyCode}/forfeit/`, { reason });
      dispatchChallengeEnd(); // Stop extension monitoring
      await refreshParty();
    } catch (e) { setError(e?.detail ?? 'Forfeit failed.'); }
  };

  // ── Extension auto-forfeit listener ─────────────────────────────────
  // When the extension sends ALGOMIND_TRIGGER_FORFEIT (3 strikes reached),
  // automatically call the backend forfeit API without user confirmation.
  useEffect(() => {
    if (view !== 'room' || !partyCode) return;
    const cleanup = listenToExtension((msg) => {
      if (msg.type === 'ALGOMIND_TRIGGER_FORFEIT') {
        console.warn('[AlgoMind] Auto-forfeited by extension:', msg.reason);
        // Show reason in UI before forfeiting
        setError(`⚠️ Auto-forfeited: ${msg.reason}`);
        handleForfeit(msg.reason);
      }
    });
    return cleanup;
  }, [view, partyCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLeave = async () => {
    try { await api.delete(`/challenges/party/${partyCode}/leave/`); } catch { }
    dispatchChallengeEnd(); // Stop extension monitoring on leave
    setParty(null); setView('home'); sessionStorage.removeItem(PARTY_SESSION_KEY);
  };

  const handleDone = () => {
    setParty(null); setView('home'); sessionStorage.removeItem(PARTY_SESSION_KEY);
  };

  // ── Render ──────────────────────────────────────────────────────

  if (view === 'lobby' && party) {
    return (
      <div>
        {error && <div className="mb-4 p-3 rounded-xl text-xs text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{error}</div>}
        <PartyLobby
          party={party} me={me} isDark={isDark}
          onRefresh={refreshParty}
          onStart={handleStart}
          onShuffleFilter={handleShuffleFilter}
          onAddQuestion={handleAddQuestion}
          onRemoveQuestion={handleRemoveQuestion}
          onKick={handleKick}
          onRename={handleRename}
          onInvite={handleInvite}
        />
        <button onClick={handleLeave} className="mt-4 text-xs hover:underline" style={{ color: t.textSec }}>
          Leave party
        </button>
      </div>
    );
  }

  if (view === 'room' && party) {
    return (
      <div>
        {error && <div className="mb-4 p-3 rounded-xl text-xs text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{error}</div>}
        <PartyRoom
          party={party} me={me} isDark={isDark}
          timeLeft={timeLeft}
          onCheckCompletion={handleCheckCompletion}
          onEndParty={handleEndParty}
          onForfeit={handleForfeit}
        />
        <button onClick={handleLeave} className="mt-4 text-xs hover:underline" style={{ color: t.textSec }}>
          Leave party
        </button>
      </div>
    );
  }

  if (view === 'finished' && party) {
    const totalQ = party.questions.length;
    const sorted = [...party.members].sort((a, b) => {
      // Finished (non-forfeit) by rank first, then forfeit/DNF
      const aFinished = a.completed_count >= totalQ;
      const bFinished = b.completed_count >= totalQ;
      if (aFinished && bFinished) return (a.rank ?? 99) - (b.rank ?? 99);
      if (aFinished) return -1;
      if (bFinished) return 1;
      return b.completed_count - a.completed_count;
    });
    const medals = ['🥇', '🥈', '🥉'];

    // Time taken = finished_at - started_at
    const startedAt = party.started_at ? new Date(party.started_at).getTime() : null;
    const fmtTime = (isoStr) => {
      if (!isoStr || !startedAt) return null;
      const secs = Math.round((new Date(isoStr).getTime() - startedAt) / 1000);
      const m = Math.floor(secs / 60), s = secs % 60;
      return `${m}m ${s}s`;
    };

    return (
      <GlassCard isDark={isDark} className="p-8 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <span className="text-5xl block mb-3">🏁</span>
          <h2 className="text-2xl font-bold mb-1" style={{ color: t.textPri }}>Party Over!</h2>
          <p className="text-sm" style={{ color: t.textSec }}>Final Results — {party.name}</p>
        </div>

        <div className="space-y-3 mb-8">
          {sorted.map((m, i) => {
            const completed = m.completed_count >= totalQ;
            const timeTaken = completed ? fmtTime(m.finished_at) : null;
            return (
              <div key={m.id} className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: t.surfLow, border: `1px solid ${completed ? 'rgba(34,197,94,0.2)' : t.border}` }}>
                <span className="text-xl shrink-0">{completed ? (medals[i] ?? `#${i + 1}`) : '—'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: m.username === me ? '#6366F1' : t.textPri }}>
                    {m.username}{m.username === me ? ' (you)' : ''}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.textSec }}>
                    {m.completed_count}/{totalQ} solved{timeTaken ? ` · ${timeTaken}` : ''}
                  </p>
                </div>
                <span className="text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full"
                  style={completed
                    ? { background: 'rgba(34,197,94,0.12)', color: '#22C55E' }
                    : { background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  {completed ? 'Finished' : 'DNF'}
                </span>
              </div>
            );
          })}
        </div>

        <button onClick={handleDone}
          className="w-full py-3 rounded-2xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
          Back to Home
        </button>
      </GlassCard>
    );
  }

  // ── Home ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl text-xs text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Hero */}
      <GlassCard isDark={isDark} className="p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.25) 0%, transparent 70%)',
        }} />
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
              boxShadow: '0 0 40px rgba(99,102,241,0.3)'
            }}>
            <span className="material-symbols-outlined text-4xl" style={{ color: '#6366F1' }}>groups</span>
          </div>
          <h2 className="text-3xl font-black mb-3" style={{ color: t.textPri }}>Friends Code Party</h2>
          <p className="text-sm max-w-md mx-auto leading-relaxed mb-8" style={{ color: t.textSec }}>
            Host a live coding challenge with friends. The host selects or AI-shuffles problems
            from LeetCode & Codeforces — first to finish all wins! 🎉
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <button onClick={() => setCreateOpen(true)}
              className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff',
                boxShadow: '0 12px 32px -8px rgba(99,102,241,0.5)'
              }}>
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Host a Party
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Join card */}
      <GlassCard isDark={isDark} className="p-7">
        <h3 className="text-base font-bold mb-1" style={{ color: t.textPri }}>Join a Party</h3>
        <p className="text-xs mb-4" style={{ color: t.textSec }}>Enter the 6-character party code shared by your friend.</p>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="flex-1 px-4 py-3 rounded-2xl text-center font-mono font-bold text-lg tracking-widest outline-none"
            style={{ background: t.surfLow, color: '#6366F1', border: `1px solid ${t.border}` }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button onClick={handleJoin} disabled={busy || joinCode.length < 6}
            className="px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center gap-2 transition-all hover:scale-[1.03]"
            style={{ background: '#6366F1', color: '#fff' }}>
            {busy ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Join'}
          </button>
        </div>
      </GlassCard>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: 'add_circle', color: '#6366F1', title: 'Host Creates', desc: 'Set duration, question count, and mode (manual or AI shuffle).' },
          { icon: 'groups', color: '#A855F7', title: 'Friends Join', desc: 'Share the party code or link. Everyone joins the lobby.' },
          { icon: 'emoji_events', color: '#22C55E', title: 'First Wins!', desc: 'Solve problems on LeetCode/CF. Click "I solved it" to verify. First to clear all wins.' },
        ].map(({ icon, color, title, desc }) => (
          <GlassCard key={title} isDark={isDark} className="p-6 text-center">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              <span className="material-symbols-outlined text-2xl" style={{ color }}>{icon}</span>
            </div>
            <h4 className="font-bold text-sm mb-1" style={{ color: t.textPri }}>{title}</h4>
            <p className="text-xs leading-relaxed" style={{ color: t.textSec }}>{desc}</p>
          </GlassCard>
        ))}
      </div>

      {/* ⚡ Ranked Code Party — requires extension */}
      <GlassCard isDark={isDark} className="p-7"
        style={{ borderColor: 'rgba(230,57,70,0.3)', background: isDark ? 'rgba(230,57,70,0.04)' : 'rgba(230,57,70,0.03)' }}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.25)' }}>
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold" style={{ color: t.textPri }}>Ranked Code Party</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ background: 'rgba(230,57,70,0.12)', color: '#e63946' }}>Fair Play Required</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: t.textSec }}>
              Ranked parties enforce strict fair play via the AlgoMind browser extension.
              Tab switching, new tabs, restricted pages, and focus loss are all monitored.
              Three violations = auto-forfeit.
            </p>
          </div>
        </div>
        <ExtensionGuard>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="ranked-host-btn"
              onClick={() => setCreateOpen(true)}
              className="flex-1 py-3 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#e63946,#c1121f)', color: '#fff', boxShadow: '0 8px 24px -6px rgba(230,57,70,0.4)' }}>
              <span className="material-symbols-outlined text-lg">shield</span>
              Host Ranked Party
            </button>
            <div className="flex gap-2 flex-1">
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="PARTY CODE"
                maxLength={6}
                className="flex-1 px-4 py-3 rounded-2xl text-center font-mono font-bold tracking-widest outline-none"
                style={{ background: t.surfLow, color: '#e63946', border: '1px solid rgba(230,57,70,0.3)' }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              <button
                id="ranked-join-btn"
                onClick={handleJoin}
                disabled={busy || joinCode.length < 6}
                className="px-5 py-3 rounded-2xl font-bold text-sm disabled:opacity-40 transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(230,57,70,0.12)', color: '#e63946', border: '1px solid rgba(230,57,70,0.3)' }}>
                {busy ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : 'Join'}
              </button>
            </div>
          </div>
        </ExtensionGuard>
      </GlassCard>

      {/* Create Modal */}
      {createOpen && <CreateModal isDark={isDark} onClose={() => setCreateOpen(false)} onCreate={handleCreate} busy={busy} />}
    </div>
  );
}

/* ── Create party modal ──────────────────────────────────────────── */
function CreateModal({ isDark, onClose, onCreate, busy }) {
  const t = useTheme(isDark);
  const [opts, setOpts] = useState({ name: 'Code Party', duration_minutes: 60, max_questions: 4, question_mode: 'shuffle' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: isDark ? '#18181b' : '#fff', border: `1px solid rgba(99,102,241,0.2)` }}
        onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>Create Code Party</h3>
            <button onClick={onClose}><span className="material-symbols-outlined" style={{ color: t.textSec }}>close</span></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: t.textSec }}>Party Name</label>
              <input value={opts.name} onChange={e => setOpts(o => ({ ...o, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: t.surfLow, color: t.textPri, border: `1px solid ${t.border}` }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: t.textSec }}>Duration (min)</label>
                <select value={opts.duration_minutes}
                  onChange={e => setOpts(o => ({ ...o, duration_minutes: +e.target.value }))}
                  className="w-full px-3 py-3 rounded-xl outline-none text-sm"
                  style={{ background: t.surfLow, color: t.textPri, border: `1px solid ${t.border}` }}>
                  {[15, 30, 45, 60, 90, 120].map(v => <option key={v} value={v}>{v} min</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: t.textSec }}>Questions</label>
                <select value={opts.max_questions}
                  onChange={e => setOpts(o => ({ ...o, max_questions: +e.target.value }))}
                  className="w-full px-3 py-3 rounded-xl outline-none text-sm"
                  style={{ background: t.surfLow, color: t.textPri, border: `1px solid ${t.border}` }}>
                  {[2, 3, 4, 5, 6].map(v => <option key={v} value={v}>{v} problems</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: t.textSec }}>Question Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[['shuffle', 'AI Shuffle', 'auto_awesome'], ['manual', 'Manual Pick', 'edit']].map(([val, label, icon]) => (
                  <button key={val} type="button"
                    onClick={() => setOpts(o => ({ ...o, question_mode: val }))}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: opts.question_mode === val ? 'rgba(99,102,241,0.15)' : t.surfLow,
                      border: `1px solid ${opts.question_mode === val ? '#6366F1' : t.border}`,
                      color: opts.question_mode === val ? '#6366F1' : t.textSec,
                    }}>
                    <span className="material-symbols-outlined text-xl block mb-1">{icon}</span>
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => onCreate(opts)} disabled={busy}
            className="w-full mt-6 py-3 rounded-2xl font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
            {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Create Party
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════════ */
function ChallengesPage({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  const t = useTheme(isDark);
  const [tab, setTab] = useState('party');

  const TABS = [
    { id: 'party', label: 'Friends Code Party', icon: 'groups' },
    { id: 'contest', label: 'Contests', icon: 'emoji_events' },
  ];

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">

        {/* Page header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: t.textPri }}>Challenges</h1>
          <p className="text-sm" style={{ color: t.textSec }}>Compete with friends and test your skills</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl w-fit"
          style={{ background: t.surfLow, border: `1px solid ${t.border}` }}>
          {TABS.map(tab_ => (
            <button key={tab_.id}
              onClick={() => setTab(tab_.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={tab === tab_.id
                ? {
                  background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff',
                  boxShadow: '0 4px 16px -4px rgba(99,102,241,0.5)'
                }
                : { color: t.textSec }}>
              <span className="material-symbols-outlined text-sm">{tab_.icon}</span>
              {tab_.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'party' && <PartyTab isDark={isDark} />}
        {tab === 'contest' && <ContestTab isDark={isDark} />}
      </div>
    </DashboardLayout>
  );
}

export default ChallengesPage;
