import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import {
  dispatchChallengeStart,
  dispatchChallengeEnd,
  listenToExtension,
  useExtensionPulse,
  reportStrikeToBackend,
} from '../../hooks/useAlgoMindExtension.js';
import { useAlgoMindExtension } from '../../hooks/useAlgoMindExtension.js';

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
function PartyLobby({ party, me, isDark, onStart, onShuffleFilter, onAddQuestion, onRemoveQuestion, onKick, onRename, onUpdateSettings, onInvite }) {
  const t = useTheme(isDark);
  const isHost = party.host_username === me;

  const durationInvalid = (party.duration_minutes ?? 0) <= 0;
  const strikesInvalid = (party.max_strikes ?? 0) <= 0;
  const questionsInvalid = (party.questions?.length || 0) === 0;

  const cannotStartReason = durationInvalid
    ? 'Duration is 0 min. Set duration > 0 to start.'
    : strikesInvalid
    ? 'Allowed strikes is 0. Set strikes > 0 to start.'
    : questionsInvalid
    ? 'Add at least 1 question before starting.'
    : null;
  const canStart = !cannotStartReason;

  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState('url');   // 'url' | 'lc_number' | 'cf_lookup'
  const [addForm, setAddForm] = useState({ title: '', platform: 'leetcode', url: '', slug: '', difficulty: 'medium' });
  const [lcNumber, setLcNumber] = useState('');
  const [lcLookupBusy, setLcLookupBusy] = useState(false);
  const [lcLookupErr, setLcLookupErr] = useState('');
  const [cfQuery, setCfQuery] = useState('');
  const [cfLookupBusy, setCfLookupBusy] = useState(false);
  const [cfLookupErr, setCfLookupErr] = useState('');
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
    setCfQuery('');
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
      setLcLookupErr(e?.detail ?? 'LeetCode problem not found');
    } finally {
      setLcLookupBusy(false);
    }
  };

  const lookupCfProblem = async () => {
    if (!cfQuery.trim()) return;
    setCfLookupBusy(true); setCfLookupErr('');
    try {
      const res = await api.get(`/challenges/codeforces-problem/${cfQuery.trim()}/`);
      setAddForm({ title: res.title, platform: 'codeforces', url: res.url, slug: res.slug, difficulty: res.difficulty });
    } catch (e) {
      setCfLookupErr(e?.detail ?? 'Codeforces problem not found');
    } finally {
      setCfLookupBusy(false);
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
            <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: t.textSec }}>
              {party.duration_minutes > 0 ? (
                <span>{party.duration_minutes} min</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                  <span>0 min (Required)</span>
                  {isHost && (
                    <button
                      onClick={() => onUpdateSettings && onUpdateSettings({ duration_minutes: 60 })}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 ml-1 font-semibold"
                    >
                      Set 60m
                    </button>
                  )}
                </span>
              )}
              <span>·</span>
              <span>{party.max_questions} questions</span>
              {party.is_ranked && (
                <>
                  <span>·</span>
                  {party.max_strikes > 0 ? (
                    <span>{party.max_strikes} strikes</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                      <span>0 strikes (Required)</span>
                      {isHost && (
                        <button
                          onClick={() => onUpdateSettings && onUpdateSettings({ max_strikes: 3 })}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 ml-1 font-semibold"
                        >
                          Set 3
                        </button>
                      )}
                    </span>
                  )}
                </>
              )}
              <span>·</span>
              <span>hosted by {party.host_username}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{ background: t.surfLow, color: t.textPri, border: `1px solid ${t.border}` }}>
              <span className="material-symbols-outlined text-sm">person_add</span>
              Invite
            </button>
            {isHost && (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={onStart}
                  disabled={!canStart}
                  title={cannotStartReason || 'Start Party'}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: party.is_ranked
                      ? 'linear-gradient(135deg,#e63946,#c1121f)'
                      : 'linear-gradient(135deg,#6366F1,#A855F7)',
                    color: '#fff',
                    boxShadow: canStart
                      ? (party.is_ranked ? '0 8px 24px -6px rgba(230,57,70,0.5)' : '0 8px 24px -6px rgba(99,102,241,0.5)')
                      : 'none'
                  }}>
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Start Party
                </button>
                {!canStart && (
                  <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">info</span>
                    {cannotStartReason}
                  </span>
                )}
              </div>
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
                {[['url', 'By URL'], ['lc_number', 'LeetCode ID / Slug'], ['cf_lookup', 'Codeforces ID']].map(([mode, label]) => (
                  <button key={mode} type="button" onClick={() => setAddMode(mode)}
                    className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={addMode === mode ? { background: '#6366F1', color: '#fff' } : { color: t.textSec }}>
                    {label}
                  </button>
                ))}
              </div>

              {addMode === 'lc_number' ? (
                <div>
                  <div className="flex gap-2">
                    <input placeholder="e.g. 128 or longest-consecutive-sequence" value={lcNumber} type="text"
                      onChange={e => { setLcNumber(e.target.value); setLcLookupErr(''); setAddForm(f => ({ ...f, title: '', slug: '', url: '' })); }}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none bg-transparent border"
                      style={{ color: t.textPri, borderColor: t.border }} />
                    <button type="button" onClick={lookupLcNumber} disabled={lcLookupBusy || !lcNumber.trim()}
                      className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                      style={{ background: '#6366F1', color: '#fff' }}>
                      {lcLookupBusy ? '…' : 'Fetch'}
                    </button>
                  </div>
                  {lcLookupErr && <p className="text-[10px] text-red-400 mt-1">{lcLookupErr}</p>}
                  {addForm.title && addForm.platform === 'leetcode' && (
                    <div className="mt-2 p-2 rounded-xl flex items-center gap-2"
                      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: '#6366F1' }}>check_circle</span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: t.textPri }}>{addForm.title}</p>
                        <p className="text-[10px]" style={{ color: t.textSec }}>LeetCode · {addForm.difficulty} · {addForm.slug}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : addMode === 'cf_lookup' ? (
                <div>
                  <div className="flex gap-2">
                    <input placeholder="e.g. 158A, 4A, or CF problem URL" value={cfQuery} type="text"
                      onChange={e => { setCfQuery(e.target.value); setCfLookupErr(''); setAddForm(f => ({ ...f, title: '', slug: '', url: '', platform: 'codeforces' })); }}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none bg-transparent border"
                      style={{ color: t.textPri, borderColor: t.border }} />
                    <button type="button" onClick={lookupCfProblem} disabled={cfLookupBusy || !cfQuery.trim()}
                      className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                      style={{ background: '#3B82F6', color: '#fff' }}>
                      {cfLookupBusy ? '…' : 'Fetch CF'}
                    </button>
                  </div>
                  {cfLookupErr && <p className="text-[10px] text-red-400 mt-1">{cfLookupErr}</p>}
                  {addForm.title && addForm.platform === 'codeforces' && (
                    <div className="mt-2 p-2 rounded-xl flex items-center gap-2"
                      style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: '#3B82F6' }}>check_circle</span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: t.textPri }}>{addForm.title}</p>
                        <p className="text-[10px]" style={{ color: t.textSec }}>Codeforces · {addForm.difficulty} · {addForm.slug}</p>
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
function PartyRoom({ party, me, isDark, onCheckCompletion, onEndParty, onForfeit, onDisqualify, timeLeft, isRanked }) {
  const t = useTheme(isDark);

  const isHost = party.host_username === me;
  const myMember = (party.members || []).find(m => m.username === me);
  const myDoneIds = new Set((myMember?.completions ?? []).filter(c => c.verified).map(c => c.question_id));
  const totalQ = party.questions.length;
  const maxStrikes = party.max_strikes || 3;

  // View toggle for host: admin command center vs problem list
  const [hostViewMode, setHostViewMode] = useState(isHost ? 'admin' : 'problems');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'out' | 'strikes'
  const [auditLogMember, setAuditLogMember] = useState(null);
  const [disqualifyTarget, setDisqualifyTarget] = useState(null);
  const [disqualifyReason, setDisqualifyReason] = useState('Host moderation: fair-play rule violation');
  const [disqualifyBusy, setDisqualifyBusy] = useState(false);

  // All members including spectators for host admin overview
  const memberList = party.all_members && party.all_members.length > 0 ? party.all_members : (party.members || []);
  const competitors = memberList.filter(m => !m.is_spectator && m.username !== party.host_username);

  // Sorted leaderboard for competitors view
  const sorted = [...(party.members || [])].sort((a, b) => {
    if (a.is_disqualified && !b.is_disqualified) return 1;
    if (!a.is_disqualified && b.is_disqualified) return -1;
    if (b.completed_count !== a.completed_count) return b.completed_count - a.completed_count;
    if (a.finished_at && b.finished_at) return new Date(a.finished_at) - new Date(b.finished_at);
    if (a.finished_at) return -1;
    if (b.finished_at) return 1;
    return 0;
  });

  const prevRanksRef = useRef({});
  const [rankAnims, setRankAnims] = useState({});

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
  }, [(party.members || []).map(m => m.completed_count).join(',')]);

  const winner = sorted.find(m => m.finished_at && !m.is_disqualified && m.completed_count >= totalQ);

  // Filtered competitors for Host Admin Panel (Comfortably supports 100+ players!)
  const filteredCompetitors = competitors.filter(m => {
    const matchesSearch = m.username.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!matchesSearch) return false;
    if (filterTab === 'active') return !m.finished_at && !m.is_disqualified;
    if (filterTab === 'out') return m.is_disqualified || (m.strikes >= maxStrikes);
    if (filterTab === 'strikes') return (m.strikes || 0) > 0;
    return true;
  });

  // Track active question click
  const handleProblemClick = (q) => {
    if (!party.code) return;
    api.post(`/challenges/party/${party.code}/active-question/`, { slug: q.slug, title: q.title }).catch(() => {});
  };

  const confirmDisqualify = async () => {
    if (!disqualifyTarget || !onDisqualify) return;
    setDisqualifyBusy(true);
    try {
      await onDisqualify(disqualifyTarget.id, disqualifyReason);
      setDisqualifyTarget(null);
    } finally {
      setDisqualifyBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Apple-grade Navigation & Status Header */}
      <GlassCard isDark={isDark} className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#22C55E' }}>LIVE MATCH</span>
              <span className="text-xs px-2 py-0.5 rounded-md font-mono" style={{ background: t.surfLow, color: t.textSec }}>
                ROOM #{party.code}
              </span>
              {isRanked && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(230,57,70,0.12)', color: '#EF4444' }}>
                  Anti-Cheat Active · Max {maxStrikes} Strikes
                </span>
              )}
              {isHost && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Host Administrator
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPri }}>{party.name}</h2>
          </div>

          <div className="flex items-center gap-3">
            {isHost && (
              <div className="flex p-1 rounded-xl" style={{ background: t.surfLow, border: `1px solid ${t.border}` }}>
                <button
                  type="button"
                  onClick={() => setHostViewMode('admin')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  style={hostViewMode === 'admin' ? { background: '#6366F1', color: '#fff' } : { color: t.textSec }}
                >
                  <span className="material-symbols-outlined text-sm">shield_person</span>
                  Host Admin Panel
                </button>
                <button
                  type="button"
                  onClick={() => setHostViewMode('problems')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  style={hostViewMode === 'problems' ? { background: '#6366F1', color: '#fff' } : { color: t.textSec }}
                >
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  Problems View
                </button>
              </div>
            )}

            <Countdown seconds={timeLeft} isDark={isDark} />

            {isHost ? (
              <button
                onClick={() => { if (window.confirm('End party for all participants?')) onEndParty(); }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-1.5"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <span className="material-symbols-outlined text-sm">power_settings_new</span>
                End Match
              </button>
            ) : !myMember?.finished_at && !myMember?.is_disqualified ? (
              <button
                onClick={() => { if (window.confirm('Forfeit this challenge?')) onForfeit(); }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-1.5"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <span className="material-symbols-outlined text-sm">flag</span>
                Forfeit
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                <span className="material-symbols-outlined text-sm">cancel</span>
                {myMember?.is_disqualified ? 'OUT (Disqualified)' : 'Finished'}
              </span>
            )}
          </div>
        </div>

        {/* Live Match Progress Bar */}
        <div className="mt-5">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: t.surfLow }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(0, (1 - timeLeft / (party.duration_minutes * 60)) * 100)}%`,
                background: 'linear-gradient(90deg, #6366F1, #A855F7)',
              }}
            />
          </div>
        </div>
      </GlassCard>

      {/* ─── HOST ADMIN PANEL (MODERATION & OBSERVABILITY) ─── */}
      {isHost && hostViewMode === 'admin' ? (
        <div className="space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total Players', val: competitors.length, sub: '100+ Concurrent Scale', icon: 'groups', color: '#6366F1' },
              { label: 'Active Solvers', val: competitors.filter(m => !m.finished_at && !m.is_disqualified).length, sub: 'Currently solving', icon: 'psychology', color: '#22C55E' },
              { label: 'Finished All', val: competitors.filter(m => m.completed_count >= totalQ && !m.is_disqualified).length, sub: 'Completed', icon: 'check_circle', color: '#8B5CF6' },
              { label: 'Made OUT', val: competitors.filter(m => m.is_disqualified || m.strikes >= maxStrikes).length, sub: 'Disqualified', icon: 'cancel', color: '#EF4444' },
              { label: 'Violations', val: competitors.reduce((acc, m) => acc + (m.strikes || 0), 0), sub: 'Strikes registered', icon: 'warning', color: '#F59E0B' },
            ].map(({ label, val, sub, icon, color }) => (
              <GlassCard key={label} isDark={isDark} className="p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textSec }}>{label}</span>
                  <span className="material-symbols-outlined text-base" style={{ color }}>{icon}</span>
                </div>
                <p className="text-2xl font-extrabold tracking-tight" style={{ color: t.textPri }}>{val}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: t.textSec }}>{sub}</p>
              </GlassCard>
            ))}
          </div>

          {/* Player Management Roster */}
          <GlassCard isDark={isDark} className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold tracking-tight" style={{ color: t.textPri }}>
                  Competitor Roster &amp; Live Telemetry
                </h3>
                <p className="text-xs" style={{ color: t.textSec }}>
                  Monitor participant question progress, live fair-play strikes, violation audit trails, and moderate players.
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-sm" style={{ color: t.textSec }}>search</span>
                  <input
                    type="text"
                    placeholder="Search player username..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none bg-transparent border w-48 sm:w-60"
                    style={{ borderColor: t.border, color: t.textPri }}
                  />
                </div>

                <div className="flex p-1 rounded-xl text-xs" style={{ background: t.surfLow, border: `1px solid ${t.border}` }}>
                  {[
                    ['all', `All (${competitors.length})`],
                    ['active', `Active (${competitors.filter(m => !m.finished_at && !m.is_disqualified).length})`],
                    ['out', `OUT (${competitors.filter(m => m.is_disqualified || m.strikes >= maxStrikes).length})`],
                    ['strikes', `Violations (${competitors.filter(m => (m.strikes || 0) > 0).length})`],
                  ].map(([tab, label]) => (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={filterTab === tab ? { background: '#6366F1', color: '#fff' } : { color: t.textSec }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Roster Table / List */}
            {filteredCompetitors.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: t.surfLow }}>
                <span className="material-symbols-outlined text-4xl block mb-2" style={{ color: t.textSec, opacity: 0.5 }}>group_off</span>
                <p className="text-sm font-semibold" style={{ color: t.textPri }}>No participants match the selected filter</p>
                <p className="text-xs mt-1" style={{ color: t.textSec }}>Share the room code #{party.code} to let players join.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: t.border }}>
                {filteredCompetitors.map((m, idx) => {
                  const strikePct = Math.min(100, Math.round(((m.strikes || 0) / maxStrikes) * 100));
                  const isOut = m.is_disqualified || (m.strikes >= maxStrikes);
                  const isFinished = m.completed_count >= totalQ && !isOut;

                  return (
                    <div key={m.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:bg-white/[0.01]">
                      {/* Left: Player Info & Status */}
                      <div className="flex items-center gap-3.5 min-w-[220px]">
                        <span className="text-xs font-mono font-bold w-6 text-center" style={{ color: t.textSec }}>
                          #{idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff' }}>
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.username} className="w-full h-full object-cover" />
                          ) : (
                            m.username[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold truncate" style={{ color: t.textPri }}>{m.username}</p>
                            {isOut ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                                OUT
                              </span>
                            ) : isFinished ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                FINISHED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                SOLVING
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: t.textSec }}>
                            Joined {new Date(m.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Active Question & Progress */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
                        {/* Currently Working On */}
                        <div className="p-3 rounded-xl" style={{ background: t.surfLow }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: t.textSec }}>
                            Active Problem
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-indigo-400">terminal</span>
                            <p className="text-xs font-bold truncate" style={{ color: t.textPri }}>
                              {m.current_question_title || 'Browsing problem pool…'}
                            </p>
                          </div>
                        </div>

                        {/* Problems Solved Progress */}
                        <div className="p-3 rounded-xl" style={{ background: t.surfLow }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textSec }}>
                              Solve Progress
                            </span>
                            <span className="text-xs font-bold font-mono" style={{ color: t.textPri }}>
                              {m.completed_count} / {totalQ}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/20">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${totalQ > 0 ? (m.completed_count / totalQ) * 100 : 0}%`,
                                background: isFinished ? '#22C55E' : '#6366F1'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Fair-Play Strikes & Moderation Actions */}
                      <div className="flex items-center gap-4 min-w-[280px] justify-between sm:justify-end">
                        {/* Strike Percentage Bar */}
                        <div className="min-w-[130px]">
                          <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                            <span style={{ color: (m.strikes || 0) > 0 ? '#EF4444' : t.textSec }}>
                              {m.strikes || 0} / {maxStrikes} Strikes
                            </span>
                            <span className="font-mono text-[10px]" style={{ color: strikePct >= 100 ? '#EF4444' : strikePct > 0 ? '#F59E0B' : '#22C55E' }}>
                              {strikePct}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden bg-black/20">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${strikePct}%`,
                                background: strikePct >= 100 ? '#EF4444' : strikePct >= 50 ? '#F59E0B' : '#22C55E',
                              }}
                            />
                          </div>
                        </div>

                        {/* Audit Log Button */}
                        <button
                          type="button"
                          onClick={() => setAuditLogMember(m)}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 flex items-center gap-1"
                          style={{ background: t.surfLow, border: `1px solid ${t.border}`, color: t.textPri }}
                          title="View strike violation audit log"
                        >
                          <span className="material-symbols-outlined text-xs">history</span>
                          <span>Logs ({m.strike_logs?.length || m.strikes || 0})</span>
                        </button>

                        {/* Disqualify / Make OUT button */}
                        {isOut ? (
                          <div className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 text-center">
                            OUT
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDisqualifyTarget(m)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
                            title="Make this player OUT immediately"
                          >
                            <span className="material-symbols-outlined text-sm">gavel</span>
                            Make OUT
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        /* ─── COMPETITOR VIEW & PROBLEMS LIST (APPLE CLEAN UI, NO EMOJIS) ─── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: t.textSec }}>
                Problem Set ({party.questions.length})
              </h3>
              <span className="text-[11px]" style={{ color: t.textSec }}>
                Submit on platform, then click "Verify Solve"
              </span>
            </div>

            {party.questions.map((q, i) => {
              const done = myDoneIds.has(q.id);
              return (
                <GlassCard
                  key={q.id}
                  isDark={isDark}
                  className="p-5.5 transition-all rounded-3xl"
                  style={{ opacity: done ? 0.75 : 1 }}
                  onClick={() => handleProblemClick(q)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black border"
                      style={{
                        background: done ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.1)',
                        borderColor: done ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.2)',
                        color: done ? '#22C55E' : '#818CF8'
                      }}
                    >
                      {done ? <span className="material-symbols-outlined text-lg">check</span> : i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-base font-bold tracking-tight" style={{ color: t.textPri }}>{q.title}</span>
                        <DiffBadge diff={q.difficulty} />
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg uppercase tracking-wider"
                          style={{
                            background: q.platform === 'leetcode' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: q.platform === 'leetcode' ? '#F59E0B' : '#3B82F6',
                            border: `1px solid ${q.platform === 'leetcode' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                          }}
                        >
                          {q.platform}
                        </span>
                      </div>

                      {done ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 pt-1">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          Verified Solved
                        </span>
                      ) : myMember?.finished_at ? (
                        <span className="text-xs font-semibold text-red-400 pt-1">Locked (Match Finished)</span>
                      ) : (
                        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                          <a
                            href={q.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleProblemClick(q)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 shadow-sm"
                            style={{ background: '#6366F1', color: '#fff' }}
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            Solve on {q.platform === 'leetcode' ? 'LeetCode' : 'Codeforces'}
                          </a>
                          <button
                            onClick={() => { handleProblemClick(q); onCheckCompletion(q.id); }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                            style={{ background: t.surfLow, color: t.textPri, border: `1px solid ${t.border}` }}
                          >
                            <span className="material-symbols-outlined text-sm text-emerald-400">verified</span>
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

          {/* Live Rankings Column */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: t.textSec }}>
              Live Standings
            </h3>

            {winner && (
              <GlassCard isDark={isDark} className="p-4 text-center rounded-2xl"
                style={{ background: 'rgba(250,204,21,0.08)', borderColor: 'rgba(250,204,21,0.3)' }}>
                <span className="material-symbols-outlined text-2xl text-amber-400 block mb-1">workspace_premium</span>
                <p className="text-sm font-bold" style={{ color: '#EAB308' }}>{winner.username} cleared all problems!</p>
              </GlassCard>
            )}

            <div className="space-y-2">
              {sorted.map((m, i) => {
                const anim = rankAnims[m.id];
                const isOut = m.is_disqualified || (m.strikes >= maxStrikes);

                return (
                  <GlassCard
                    key={m.id}
                    isDark={isDark}
                    className="p-3.5 rounded-2xl"
                    style={{
                      transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: anim === 'up' ? 'translateY(-4px) scale(1.02)' : anim === 'down' ? 'translateY(4px)' : 'none',
                      borderColor: anim === 'up' ? 'rgba(34,197,94,0.4)' : undefined,
                      opacity: isOut ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-black w-6 text-center shrink-0 px-1 py-0.5 rounded-md"
                        style={{
                          color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#B45309' : t.textSec,
                          background: i < 3 ? 'rgba(255,255,255,0.04)' : 'transparent',
                        }}
                      >
                        #{i + 1}
                      </span>

                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff' }}
                      >
                        {m.avatar ? <img src={m.avatar} alt={m.username} className="w-full h-full object-cover" /> : m.username[0].toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold truncate" style={{ color: m.username === me ? '#6366F1' : t.textPri }}>
                            {m.username}{m.username === me ? ' (you)' : ''}
                          </p>
                          {isOut && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-400">
                              OUT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px]" style={{ color: t.textSec }}>
                          {m.completed_count}/{totalQ} solved
                        </p>
                      </div>

                      {/* Strikes pill */}
                      {isRanked && (m.strikes ?? 0) > 0 && (
                        <span
                          className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}
                          title={`${m.strikes} fair-play violations recorded`}
                        >
                          <span className="material-symbols-outlined text-[11px]">warning</span>
                          {m.strikes}
                        </span>
                      )}

                      {m.finished_at && !isOut && (
                        <span className="material-symbols-outlined text-xs text-emerald-400">check_circle</span>
                      )}
                    </div>

                    <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: t.surfLow }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${totalQ > 0 ? (m.completed_count / totalQ) * 100 : 0}%`,
                          background: m.username === me ? '#6366F1' : '#A855F7',
                        }}
                      />
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Strike Reasons Audit Log ─── */}
      {auditLogMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setAuditLogMember(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4"
            style={{ background: isDark ? '#161719' : '#FFFFFF', border: `1px solid ${t.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-500">warning</span>
                <div>
                  <h4 className="text-base font-bold" style={{ color: t.textPri }}>
                    Fair-Play Violation History
                  </h4>
                  <p className="text-xs" style={{ color: t.textSec }}>
                    Participant: <strong>@{auditLogMember.username}</strong> · Total Strikes: {auditLogMember.strikes || 0}/{maxStrikes}
                  </p>
                </div>
              </div>
              <button onClick={() => setAuditLogMember(null)} className="opacity-60 hover:opacity-100">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 py-1">
              {(!auditLogMember.strike_logs || auditLogMember.strike_logs.length === 0) ? (
                <div className="p-4 text-center text-xs" style={{ color: t.textSec }}>
                  {(auditLogMember.strikes || 0) === 0 ? 'No violations detected. Player is clean!' : `${auditLogMember.strikes} strike(s) registered.`}
                </div>
              ) : (
                auditLogMember.strike_logs.map((log, i) => (
                  <div key={log.id || i} className="p-3 rounded-xl flex items-start gap-3" style={{ background: t.surfLow }}>
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 shrink-0">
                      #{log.strike_number || i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: t.textPri }}>{log.reason}</p>
                      <p className="text-[10px] mt-0.5 font-mono" style={{ color: t.textSec }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setAuditLogMember(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#6366F1' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: Disqualify / Make OUT Confirmation ─── */}
      {disqualifyTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setDisqualifyTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4"
            style={{ background: isDark ? '#161719' : '#FFFFFF', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-500">
              <span className="material-symbols-outlined text-2xl">gavel</span>
              <h4 className="text-lg font-bold" style={{ color: t.textPri }}>
                Disqualify &amp; Make OUT
              </h4>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: t.textSec }}>
              Are you sure you want to make <strong>@{disqualifyTarget.username}</strong> OUT of this challenge?
              Their status will transition to Disqualified immediately, just like when the strike limit is reached.
            </p>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: t.textSec }}>
                Disqualification Reason (Host Audit)
              </label>
              <input
                type="text"
                value={disqualifyReason}
                onChange={e => setDisqualifyReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-transparent border"
                style={{ borderColor: t.border, color: t.textPri }}
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDisqualifyTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: t.surfLow, color: t.textPri, border: `1px solid ${t.border}` }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDisqualify}
                disabled={disqualifyBusy}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-red-600 hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {disqualifyBusy && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm OUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Friends Code Party Tab
══════════════════════════════════════════════════════════════════ */
const PARTY_SESSION_KEY = 'algomind_party_session';

function PartyTab({ isDark, isRankedView = false }) {
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
  // Track whether the current active party is a ranked party (extension required)
  const [isRanked, setIsRanked] = useState(false);
  // isRankedFlow: true if this tab is the Ranked tab OR if host explicitly chose ranked
  const [isRankedFlow, setIsRankedFlow] = useState(isRankedView);

  // Auto-set isRanked when entering the Ranked tab
  useEffect(() => {
    if (isRankedView) setIsRankedFlow(true);
  }, [isRankedView]);

  // partyCode MUST be derived before any hooks that use it
  const partyCode = party?.code;
  const pollRef = useRef(null);

  // Extension detection — used to guard ranked start
  const { extensionInstalled, extensionInvalidated } = useAlgoMindExtension();

  // Backend pulse — send every 5s during a ranked room; auto-forfeit on miss
  useExtensionPulse(
    partyCode,
    isRanked && view === 'room',
    (reason) => handleForfeit(reason), // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Persist view + party + timeLeft to sessionStorage whenever they change
  useEffect(() => {
    if (view === 'home') { sessionStorage.removeItem(PARTY_SESSION_KEY); return; }
    try {
      sessionStorage.setItem(PARTY_SESSION_KEY, JSON.stringify({ view, party, timeLeft }));
    } catch { /* quota error — ignore */ }
  }, [view, party, timeLeft]);

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
      // If user clicked "Host Ranked Party", mark the session as ranked
      if (isRankedFlow) setIsRanked(true);
    } catch (e) { setError(e?.detail ?? 'Failed to create party.'); }
    finally { setBusy(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setBusy(true); setError('');
    try {
      const p = await api.post(`/challenges/party/${joinCode.trim().toUpperCase()}/join/`, {});
      setParty(p);
      // FIX: if joining a ranked party, set isRanked so extension monitoring activates
      if (p.is_ranked) {
        setIsRanked(true);
        setIsRankedFlow(true);
        // Block join if extension not installed
        if (!extensionInstalled) {
          setError('This is The Gauntlet. Install the AlgoMind Fair Play extension to join.');
          setBusy(false);
          return;
        }
      }
      setView(p.status === 'active' ? 'room' : 'lobby');
    } catch (e) { setError(e?.detail ?? 'Party not found.'); }
    finally { setBusy(false); }
  };

  const handleStart = async (ranked = false) => {
    // Hard block — ranked challenge MUST have extension
    if (ranked && !extensionInstalled) {
      setError('Install the AlgoMind Fair Play extension before starting The Gauntlet.');
      return;
    }
    try {
      const p = await api.post(`/challenges/party/${partyCode}/start/`, {});
      setParty(p); setTimeLeft(p.time_remaining ?? 0); setView('room');
      if (ranked || p.is_ranked) {
        setIsRanked(true);
        // Pass max_strikes from party config so extension uses the host-set value
        dispatchChallengeStart(partyCode, p.max_strikes ?? 3);
      }
    } catch (e) { setError(e?.detail ?? 'Failed to start.'); }
  };

  // FIX: When entering the room view, sync isRanked from the party data
  useEffect(() => {
    if (view === 'room' && party?.is_ranked) {
      setIsRanked(true);
      // If extension is installed and party is ranked, start monitoring (handles page refresh case)
      if (extensionInstalled) {
        dispatchChallengeStart(partyCode, party.max_strikes ?? 3);
      }
    }
  }, [view, party?.is_ranked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShuffleFilter = async (topics, difficulties) => {
    try {
      const p = await api.post(`/challenges/party/${partyCode}/questions/shuffle-filter/`, { topics, difficulties });
      setParty(p);
    } catch (e) { setError(e?.detail ?? 'Shuffle failed.'); }
  };

  const handleAddQuestion = async (form) => {
    try {
      const newQ = await api.post(`/challenges/party/${partyCode}/questions/add/`, form);
      if (newQ && newQ.id) {
        setParty(prev => prev ? ({
          ...prev,
          questions: [...(prev.questions || []), newQ]
        }) : prev);
      } else {
        await refreshParty();
      }
    } catch (e) { setError(e?.detail ?? 'Failed to add question.'); }
  };

  const handleRemoveQuestion = async (qid) => {
    // Optimistic instant removal: disappears from UI immediately in 0ms!
    setParty(prev => prev ? ({
      ...prev,
      questions: (prev.questions || []).filter(q => q.id !== qid)
    }) : prev);
    try {
      await api.delete(`/challenges/party/${partyCode}/questions/${qid}/remove/`);
    } catch (e) {
      setError(e?.detail ?? 'Failed to remove question.');
      await refreshParty();
    }
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

  const handleUpdateSettings = async (settings) => {
    try {
      const p = await api.patch(`/challenges/party/${partyCode}/rename/`, settings);
      setParty(p);
    } catch (e) { setError(e?.detail ?? 'Settings update failed.'); }
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

  const handleDisqualify = async (memberId, reason = 'Disqualified by host') => {
    try {
      const res = await api.post(`/challenges/party/${partyCode}/disqualify/`, { member_id: memberId, reason });
      if (res?.party) setParty(res.party);
      else await refreshParty();
    } catch (e) {
      setError(e?.detail ?? 'Disqualification failed.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // ── Extension auto-forfeit listener ─────────────────────────────────
  // When the extension sends ALGOMIND_TRIGGER_FORFEIT (3 strikes reached),
  // automatically call the backend forfeit API without user confirmation.
  useEffect(() => {
    if (view !== 'room' || !partyCode) return;
    const cleanup = listenToExtension(async (msg) => {
      if (msg.type === 'ALGOMIND_VIOLATION') {
        // Report to backend so strike count is persisted and visible to all
        if (isRanked) {
          const res = await reportStrikeToBackend(partyCode, msg.reason);
          if (res?.party) setParty(res.party);
          if (res?.forfeited) {
            setError(`⚠️ Auto-forfeited: ${msg.reason}`);
            dispatchChallengeEnd();
            await refreshParty();
          }
        }
      }
      if (msg.type === 'ALGOMIND_TRIGGER_FORFEIT') {
        setError(`⚠️ Auto-forfeited: ${msg.reason}`);
        handleForfeit(msg.reason);
      }
    });
    return cleanup;
  }, [view, partyCode, isRanked]); // eslint-disable-line react-hooks/exhaustive-deps

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
          onStart={() => handleStart(isRanked)}
          onShuffleFilter={handleShuffleFilter}
          onAddQuestion={handleAddQuestion}
          onRemoveQuestion={handleRemoveQuestion}
          onKick={handleKick}
          onRename={handleRename}
          onUpdateSettings={handleUpdateSettings}
          onInvite={handleInvite}
          isRanked={isRanked}
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
          isRanked={isRanked}
          onCheckCompletion={handleCheckCompletion}
          onEndParty={handleEndParty}
          onForfeit={handleForfeit}
          onDisqualify={handleDisqualify}
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
      const aFinished = a.completed_count >= totalQ && !a.is_disqualified;
      const bFinished = b.completed_count >= totalQ && !b.is_disqualified;
      if (aFinished && bFinished) return (a.rank ?? 99) - (b.rank ?? 99);
      if (aFinished) return -1;
      if (bFinished) return 1;
      return b.completed_count - a.completed_count;
    });

    // Time taken = finished_at - started_at
    const startedAt = party.started_at ? new Date(party.started_at).getTime() : null;
    const fmtTime = (isoStr) => {
      if (!isoStr || !startedAt) return null;
      const secs = Math.round((new Date(isoStr).getTime() - startedAt) / 1000);
      const m = Math.floor(secs / 60), s = secs % 60;
      return `${m}m ${s}s`;
    };

    return (
      <GlassCard isDark={isDark} className="p-8 max-w-lg mx-auto rounded-3xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-3xl mx-auto mb-3 flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <span className="material-symbols-outlined text-3xl">sports_score</span>
          </div>
          <h2 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: t.textPri }}>Match Concluded</h2>
          <p className="text-xs font-medium" style={{ color: t.textSec }}>Official Results — {party.name}</p>
        </div>

        <div className="space-y-3 mb-8">
          {sorted.map((m, i) => {
            const completed = m.completed_count >= totalQ && !m.is_disqualified;
            const timeTaken = completed ? fmtTime(m.finished_at) : null;
            const isDisqualified = m.is_disqualified;

            return (
              <div key={m.id} className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: t.surfLow, border: `1px solid ${completed ? 'rgba(34,197,94,0.2)' : isDisqualified ? 'rgba(239,68,68,0.2)' : t.border}` }}>
                <span
                  className="text-xs font-black shrink-0 px-2 py-1 rounded-lg"
                  style={{
                    color: completed && i === 0 ? '#F59E0B' : completed && i === 1 ? '#94A3B8' : completed && i === 2 ? '#B45309' : t.textSec,
                    background: completed && i < 3 ? 'rgba(255,255,255,0.06)' : 'transparent',
                  }}
                >
                  {isDisqualified ? 'OUT' : completed ? `#${i + 1}` : '—'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: m.username === me ? '#6366F1' : t.textPri }}>
                    {m.username}{m.username === me ? ' (you)' : ''}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.textSec }}>
                    {isDisqualified ? `Disqualified (${m.disqualified_reason || 'Strike limit exceeded'})` : `${m.completed_count}/${totalQ} solved${timeTaken ? ` · ${timeTaken}` : ''}`}
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

  // -- Home view: conditional on isRankedView
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl text-xs text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {isRankedView ? (
        /* RANKED PARTY HOME */
        <>
          {/* Invalidated context banner — shown when extension was toggled OFF/ON */}
          {extensionInvalidated && (
            <div className="p-5 rounded-2xl flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(217,119,6,0.08))', border: '1px solid rgba(245,158,11,0.4)' }}>
              <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: '#F59E0B' }}>sync_problem</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold mb-0.5" style={{ color: '#F59E0B' }}>Extension Disconnected — Reload Required</p>
                <p className="text-xs mb-2" style={{ color: t.textSec }}>The AlgoMind extension was toggled off/on. The page must reload to reconnect.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs font-bold px-4 py-1.5 rounded-lg"
                  style={{ background: '#F59E0B', color: '#000' }}
                >Reload Page</button>
              </div>
            </div>
          )}
          {/* Prominent extension install banner */}
          {!extensionInstalled && !extensionInvalidated && (
            <div className="p-5 rounded-2xl flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg,rgba(230,57,70,0.12),rgba(193,18,31,0.08))', border: '1px solid rgba(230,57,70,0.35)' }}>
              <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)' }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: '#e63946' }}>extension_off</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold mb-0.5" style={{ color: '#e63946' }}>AlgoMind Fair Play Extension Required</p>
                <p className="text-xs" style={{ color: t.textSec }}>Install the extension to host or enter The Gauntlet. It monitors fair play during the challenge.</p>
              </div>
              <a
                id="algomind-extension-install-btn"
                href="https://chromewebstore.google.com/detail/lfpemlimminiefikoofinbldcjoalbib"
                target="_blank" rel="noreferrer"
                className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg,#e63946,#c1121f)', color: '#fff', boxShadow: '0 8px 20px -6px rgba(230,57,70,0.5)' }}
              >
                <span className="material-symbols-outlined text-base">download</span>
                Install Extension
              </a>
            </div>
          )}

          {/* Ranked Hero */}
          <GlassCard isDark={isDark} className="p-10 text-center relative overflow-hidden"
            style={{ borderColor: 'rgba(230,57,70,0.25)', background: isDark ? 'rgba(230,57,70,0.03)' : 'rgba(230,57,70,0.02)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 50% -20%, rgba(230,57,70,0.2) 0%, transparent 70%)',
            }} />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg,rgba(230,57,70,0.2),rgba(193,18,31,0.2))',
                  border: '1px solid rgba(230,57,70,0.3)',
                  boxShadow: '0 0 40px rgba(230,57,70,0.25)'
                }}>
                <span className="material-symbols-outlined text-4xl" style={{ color: '#e63946' }}>swords</span>
              </div>
              <h2 className="text-3xl font-black mb-3" style={{ color: t.textPri }}>The Gauntlet</h2>
              <p className="text-sm max-w-md mx-auto leading-relaxed mb-2" style={{ color: t.textSec }}>
                Enter The Gauntlet. Compete under strict fair-play rules enforced by the AlgoMind extension.
                Tab switching, new windows, restricted pages, and focus loss are all monitored in real-time.
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-8"
                style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '1px solid rgba(230,57,70,0.25)' }}>
                <span className="material-symbols-outlined text-sm">gpp_good</span>
                Fair Play Enforced
              </span>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <button
                  id="ranked-host-btn"
                  disabled={!extensionInstalled}
                  onClick={() => { setIsRankedFlow(true); setCreateOpen(true); }}
                  className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#e63946,#c1121f)', color: '#fff', boxShadow: extensionInstalled ? '0 12px 32px -8px rgba(230,57,70,0.5)' : 'none' }}>
                  <span className="material-symbols-outlined text-lg">swords</span>
                  {extensionInstalled ? 'Host The Gauntlet' : 'Install Extension First'}
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Join ranked */}
          <GlassCard isDark={isDark} className="p-7" style={{ borderColor: 'rgba(230,57,70,0.2)' }}>
            <h3 className="text-base font-bold mb-1" style={{ color: t.textPri }}>Join The Gauntlet</h3>
            <p className="text-xs mb-4" style={{ color: t.textSec }}>Enter the 6-character party code. Extension must be installed to participate.</p>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 px-4 py-3 rounded-2xl text-center font-mono font-bold text-lg tracking-widest outline-none"
                style={{ background: t.surfLow, color: '#e63946', border: '1px solid rgba(230,57,70,0.3)' }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              <button onClick={handleJoin} disabled={busy || joinCode.length < 6 || !extensionInstalled}
                className="px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center gap-2 transition-all hover:scale-[1.03]"
                style={{ background: '#e63946', color: '#fff' }}>
                {busy ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Enter'}
              </button>
            </div>
          </GlassCard>

          {/* How Ranked Works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: 'gpp_good', color: '#e63946', title: 'Extension Enforced', desc: 'Every tab switch, new window, and focus loss is tracked in real-time by the browser extension.' },
              { icon: 'bolt', color: '#F59E0B', title: 'Custom Strikes', desc: 'Host sets how many violations (1-5) are allowed before auto-forfeit. Every strike is notified.' },
              { icon: 'leaderboard', color: '#22C55E', title: 'The Gauntlet Leaderboard', desc: 'Strike counts visible live. Spectator mode lets the host watch without competing.' },
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
        </>
      ) : (
        /* CASUAL PARTY HOME */
        <>
          {/* Casual Hero */}
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
                <span className="material-symbols-outlined text-4xl" style={{ color: '#6366F1' }}>sports_esports</span>
              </div>
              <h2 className="text-3xl font-black mb-3" style={{ color: t.textPri }}>Playground</h2>
              <p className="text-sm max-w-md mx-auto leading-relaxed mb-8" style={{ color: t.textSec }}>
                Host a live coding match in the Playground with friends. The host selects or AI-shuffles problems
                from LeetCode &amp; Codeforces — first to finish all wins!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <button onClick={() => setCreateOpen(true)}
                  className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff', boxShadow: '0 12px 32px -8px rgba(99,102,241,0.5)' }}>
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Host Playground
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Casual Join */}
          <GlassCard isDark={isDark} className="p-7">
            <h3 className="text-base font-bold mb-1" style={{ color: t.textPri }}>Join Playground</h3>
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
        </>
      )}

      {/* Create Modal */}
      {createOpen && <CreateModal isDark={isDark} onClose={() => setCreateOpen(false)} onCreate={handleCreate} busy={busy} isRanked={isRankedFlow} />}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Create party modal (Casual + Ranked variants) — Clean Apple Design
═════════════════════════════════════════════════════════════════ */
function CreateModal({ isDark, onClose, onCreate, busy, isRanked: modalIsRanked = false }) {
  const t = useTheme(isDark);
  const [opts, setOpts] = useState({
    name: modalIsRanked ? 'The Gauntlet' : 'Playground',
    duration_minutes: 60,
    max_questions: 4,
    question_mode: 'shuffle',
    is_ranked: modalIsRanked,
    max_strikes: 3,
    host_spectator: true, // Default host as supervisor per user requirement
  });

  const accentColor = modalIsRanked ? '#e63946' : '#6366F1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl transition-all my-8"
        style={{
          background: isDark ? '#141417' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: isDark ? '0 25px 50px -12px rgba(0,0,0,0.7)' : '0 25px 50px -12px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-5 flex items-start justify-between border-b"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full"
                style={{
                  background: modalIsRanked ? 'rgba(230,57,70,0.12)' : 'rgba(99,102,241,0.12)',
                  color: accentColor,
                }}>
                {modalIsRanked ? 'Ranked Gauntlet' : 'Collaborative Playground'}
              </span>
              <span className="text-[11px] font-medium" style={{ color: t.textSec }}>
                100+ Player Capacity
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight" style={{ color: t.textPri }}>
              {modalIsRanked ? 'Configure The Gauntlet' : 'Create Playground Room'}
            </h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: t.textSec }}>
              {modalIsRanked
                ? 'Strict competitive arena with automated extension integrity and host supervision.'
                : 'Open multi-player practice room. Test algorithms together in real time.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-75"
            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: t.textSec }}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section: Room Details */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold tracking-wide uppercase block mb-1.5" style={{ color: t.textSec }}>
                Room Title
              </label>
              <input
                type="text"
                value={opts.name}
                onChange={e => setOpts(o => ({ ...o, name: e.target.value }))}
                placeholder="e.g. Weekend DSA Sprint"
                className="w-full px-4 py-3 rounded-2xl outline-none text-sm transition-all font-medium"
                style={{
                  background: isDark ? '#1C1D21' : '#F8FAFC',
                  color: t.textPri,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                }}
              />
            </div>

            {/* Direct Number Input: Duration & Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold tracking-wide uppercase block mb-1.5" style={{ color: t.textSec }}>
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  step="5"
                  value={opts.duration_minutes}
                  onChange={e => {
                    const raw = e.target.value;
                    const val = raw === '' ? 0 : parseInt(raw, 10);
                    setOpts(o => ({ ...o, duration_minutes: isNaN(val) ? 0 : Math.max(0, Math.min(360, val)) }));
                  }}
                  className="w-full px-4 py-3 rounded-2xl outline-none text-sm font-semibold transition-all"
                  style={{
                    background: isDark ? '#1C1D21' : '#F8FAFC',
                    color: t.textPri,
                    border: `1px solid ${opts.duration_minutes === 0 ? 'rgba(239,68,68,0.5)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                />
                {opts.duration_minutes === 0 ? (
                  <p className="text-[11px] text-amber-500 font-medium mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">warning</span>
                    Duration is 0. Match cannot be started until duration is &gt; 0 min.
                  </p>
                ) : (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[30, 45, 60, 90, 120].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setOpts(o => ({ ...o, duration_minutes: m }))}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                        style={{
                          background: opts.duration_minutes === m
                            ? (modalIsRanked ? 'rgba(230,57,70,0.15)' : 'rgba(99,102,241,0.15)')
                            : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                          color: opts.duration_minutes === m ? accentColor : t.textSec,
                        }}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold tracking-wide uppercase block mb-1.5" style={{ color: t.textSec }}>
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={opts.max_questions}
                  onChange={e => setOpts(o => ({ ...o, max_questions: Math.max(1, Math.min(50, +e.target.value || 1)) }))}
                  className="w-full px-4 py-3 rounded-2xl outline-none text-sm font-semibold transition-all"
                  style={{
                    background: isDark ? '#1C1D21' : '#F8FAFC',
                    color: t.textPri,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                />
                <p className="text-[11px] mt-1.5" style={{ color: t.textSec }}>
                  Directly type any question count (1 to 50)
                </p>
              </div>
            </div>
          </div>

          {/* Section: Allowed Strikes (Gauntlet only) & Host Role */}
          <div className="pt-4 border-t space-y-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            {/* Allowed Strikes — ONLY in The Gauntlet, hidden in Playground */}
            {modalIsRanked && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold tracking-wide uppercase" style={{ color: t.textSec }}>
                    Allowed Strikes (Before Disqualification)
                  </label>
                  <span className="text-[11px] font-bold" style={{ color: opts.max_strikes === 0 ? '#EF4444' : '#818CF8' }}>
                    {opts.max_strikes} Strikes Allowed
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={opts.max_strikes}
                  onChange={e => {
                    const raw = e.target.value;
                    const val = raw === '' ? 0 : parseInt(raw, 10);
                    setOpts(o => ({ ...o, max_strikes: isNaN(val) ? 0 : Math.max(0, Math.min(20, val)) }));
                  }}
                  className="w-full px-4 py-3 rounded-2xl outline-none text-sm font-semibold transition-all"
                  style={{
                    background: isDark ? '#1C1D21' : '#F8FAFC',
                    color: t.textPri,
                    border: `1px solid ${opts.max_strikes === 0 ? 'rgba(239,68,68,0.5)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                />
                {opts.max_strikes === 0 ? (
                  <p className="text-[11px] text-amber-500 font-medium mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">warning</span>
                    Strikes is 0. Note: You cannot start the match until strikes are &gt; 0.
                  </p>
                ) : (
                  <p className="text-[11px] mt-1.5" style={{ color: t.textSec }}>
                    When a player accumulates this many strikes (tab switches, devtools, unauthorized clicks), they are automatically marked OUT.
                  </p>
                )}
              </div>
            )}

            {/* Clear Host Role Selection Cards */}
            <div>
              <label className="text-xs font-bold tracking-wide uppercase block mb-2" style={{ color: t.textSec }}>
                Host Mode (How do you want to participate?)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setOpts(o => ({ ...o, host_spectator: true }))}
                  className="p-4 rounded-2xl cursor-pointer transition-all border text-left"
                  style={{
                    background: opts.host_spectator
                      ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)')
                      : (isDark ? '#1C1D21' : '#F8FAFC'),
                    borderColor: opts.host_spectator ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="material-symbols-outlined text-lg" style={{ color: opts.host_spectator ? '#6366F1' : t.textSec }}>
                      shield_person
                    </span>
                    <span className="text-sm font-bold" style={{ color: opts.host_spectator ? t.textPri : t.textSec }}>
                      Host &amp; Supervise
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: t.textSec }}>
                    You supervise the match with the Host Admin Panel: view player progress, inspect strike logs, and moderate. You do not solve problems.
                  </p>
                </div>

                <div
                  onClick={() => setOpts(o => ({ ...o, host_spectator: false }))}
                  className="p-4 rounded-2xl cursor-pointer transition-all border text-left"
                  style={{
                    background: !opts.host_spectator
                      ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)')
                      : (isDark ? '#1C1D21' : '#F8FAFC'),
                    borderColor: !opts.host_spectator ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="material-symbols-outlined text-lg" style={{ color: !opts.host_spectator ? '#6366F1' : t.textSec }}>
                      sports_esports
                    </span>
                    <span className="text-sm font-bold" style={{ color: !opts.host_spectator ? t.textPri : t.textSec }}>
                      Compete as Player
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: t.textSec }}>
                    You actively solve problems, submit code, and compete on the leaderboard alongside all participants.
                  </p>
                </div>
              </div>
            </div>

            {/* Clear Question Mode Selection Cards */}
            <div>
              <label className="text-xs font-bold tracking-wide uppercase block mb-2" style={{ color: t.textSec }}>
                Question Pool Selection
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setOpts(o => ({ ...o, question_mode: 'shuffle' }))}
                  className="p-4 rounded-2xl cursor-pointer transition-all border text-left"
                  style={{
                    background: opts.question_mode === 'shuffle'
                      ? (isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.06)')
                      : (isDark ? '#1C1D21' : '#F8FAFC'),
                    borderColor: opts.question_mode === 'shuffle' ? '#A855F7' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-lg" style={{ color: opts.question_mode === 'shuffle' ? '#A855F7' : t.textSec }}>
                      auto_awesome
                    </span>
                    <span className="text-sm font-bold" style={{ color: opts.question_mode === 'shuffle' ? t.textPri : t.textSec }}>
                      Curated AI Shuffle
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: t.textSec }}>
                    AlgoMind automatically picks fresh, unsolved LeetCode &amp; Codeforces questions suited to the group.
                  </p>
                </div>

                <div
                  onClick={() => setOpts(o => ({ ...o, question_mode: 'manual' }))}
                  className="p-4 rounded-2xl cursor-pointer transition-all border text-left"
                  style={{
                    background: opts.question_mode === 'manual'
                      ? (isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.06)')
                      : (isDark ? '#1C1D21' : '#F8FAFC'),
                    borderColor: opts.question_mode === 'manual' ? '#A855F7' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-lg" style={{ color: opts.question_mode === 'manual' ? '#A855F7' : t.textSec }}>
                      playlist_add
                    </span>
                    <span className="text-sm font-bold" style={{ color: opts.question_mode === 'manual' ? t.textPri : t.textSec }}>
                      Custom Lobby Selection
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: t.textSec }}>
                    Pick your own questions in the lobby by typing LeetCode numbers, URLs, or Codeforces problem IDs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', background: isDark ? '#101013' : '#F8FAFC' }}>
          <p className="text-[11px]" style={{ color: t.textSec }}>
            Code can be shared with up to 100+ competitors.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold hover:opacity-75 transition-opacity"
              style={{ color: t.textSec }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onCreate(opts)}
              disabled={busy || !opts.name.trim()}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer shadow-lg"
              style={{
                background: modalIsRanked
                  ? 'linear-gradient(135deg, #e63946, #c1121f)'
                  : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                boxShadow: modalIsRanked ? '0 8px 24px -6px rgba(230,57,70,0.5)' : '0 8px 24px -6px rgba(99,102,241,0.5)',
              }}
            >
              {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{modalIsRanked ? 'Launch The Gauntlet' : 'Create Room'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Main Page — 3 tabs: Playground, The Gauntlet, Contests
═════════════════════════════════════════════════════════════════ */
function ChallengesPage({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  const t = useTheme(isDark);
  const [tab, setTab] = useState('casual');

  const TABS = [
    { id: 'casual', label: 'Playground',    icon: 'sports_esports', color: '#6366F1' },
    { id: 'ranked', label: 'The Gauntlet',  icon: 'swords',         color: '#e63946' },
    { id: 'contest', label: 'Contests',     icon: 'emoji_events',  color: '#F59E0B' },
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
          {TABS.map(tab_ => {
            const active = tab === tab_.id;
            const bg = tab_.id === 'ranked'
              ? 'linear-gradient(135deg,#e63946,#c1121f)'
              : tab_.id === 'contest'
                ? 'linear-gradient(135deg,#F59E0B,#D97706)'
                : 'linear-gradient(135deg,#6366F1,#A855F7)';
            return (
              <button key={tab_.id}
                onClick={() => setTab(tab_.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={active
                  ? { background: bg, color: '#fff', boxShadow: `0 4px 16px -4px ${tab_.color}80` }
                  : { color: t.textSec }}>
                <span className="material-symbols-outlined text-sm">{tab_.icon}</span>
                {tab_.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === 'casual'  && <PartyTab isDark={isDark} isRankedView={false} />}
        {tab === 'ranked'  && <PartyTab isDark={isDark} isRankedView={true} />}
        {tab === 'contest' && <ContestTab isDark={isDark} />}
      </div>
    </DashboardLayout>
  );
}

export default ChallengesPage;
