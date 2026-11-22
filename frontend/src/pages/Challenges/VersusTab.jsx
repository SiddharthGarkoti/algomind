import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api.js';
import { ARENA_QUESTIONS } from '../../data/arenaQuestions.js';
import VersusIDE from './VersusIDE.jsx';

// Comprehensive categorized DSA curriculum
export const TOPIC_GROUPS = [
  {
    category: 'All Categories',
    icon: 'shuffle',
    items: [
      { id: 'All', name: 'All Topics (Random Mix)', tag: 'General', icon: 'shuffle' },
    ]
  },
  {
    category: 'Data Structures',
    icon: 'account_tree',
    items: [
      { id: 'Arrays', name: 'Arrays & Matrices', tag: 'Linear', icon: 'data_array' },
      { id: 'Strings', name: 'Strings & Parsing', tag: 'Linear', icon: 'short_text' },
      { id: 'Linked List', name: 'Linked Lists (Singly/Doubly)', tag: 'Linear', icon: 'linear_scale' },
      { id: 'Stack', name: 'Stacks & Queues', tag: 'Linear', icon: 'layers' },
      { id: 'Hash Table', name: 'Hash Tables & Sets', tag: 'Lookup', icon: 'tag' },
      { id: 'Trees', name: 'Binary Trees & BST', tag: 'Hierarchical', icon: 'park' },
      { id: 'Heaps', name: 'Heaps & Priority Queues', tag: 'Hierarchical', icon: 'align_vertical_bottom' },
      { id: 'Graphs', name: 'Graphs & Disjoint Set (Union-Find)', tag: 'Non-linear', icon: 'hub' },
      { id: 'Trie', name: 'Tries (Prefix Trees)', tag: 'Tree', icon: 'account_tree' },
    ]
  },
  {
    category: 'Core Algorithms',
    icon: 'psychology',
    items: [
      { id: 'Two Pointers', name: 'Two Pointers Technique', tag: 'Search', icon: 'compare_arrows' },
      { id: 'Sliding Window', name: 'Sliding Window', tag: 'Optimization', icon: 'view_carousel' },
      { id: 'Binary Search', name: 'Binary Search & Search Space', tag: 'Search', icon: 'manage_search' },
      { id: 'BFS', name: 'Breadth-First Search (BFS)', tag: 'Traversal', icon: 'waves' },
      { id: 'DFS', name: 'Depth-First Search (DFS)', tag: 'Traversal', icon: 'alt_route' },
      { id: 'DP', name: 'Dynamic Programming (1D / 2D / Grid)', tag: 'Optimization', icon: 'auto_graph' },
      { id: 'Greedy', name: 'Greedy Algorithms', tag: 'Heuristic', icon: 'bolt' },
      { id: 'Backtracking', name: 'Backtracking & Recursion', tag: 'Exhaustive', icon: 'undo' },
      { id: 'Bit Manipulation', name: 'Bit Manipulation & Bitmasks', tag: 'Bitwise', icon: 'memory' },
    ]
  },
  {
    category: 'Sub-Algorithms & Patterns',
    icon: 'pattern',
    items: [
      { id: 'Fast & Slow', name: 'Fast & Slow Pointers (Floyd)', tag: 'Pattern', icon: 'speed' },
      { id: 'Prefix Sum', name: "Prefix Sum & Kadane's Algorithm", tag: 'Pattern', icon: 'functions' },
      { id: 'Monotonic Stack', name: 'Monotonic Stack & Deque', tag: 'Pattern', icon: 'stacked_bar_chart' },
      { id: 'Intervals', name: 'Interval Merging & Overlap', tag: 'Pattern', icon: 'view_week' },
      { id: 'Topological Sort', name: "Topological Sort (Kahn's / DFS)", tag: 'Pattern', icon: 'timeline' },
      { id: 'Shortest Path', name: 'Dijkstra / Shortest Paths', tag: 'Pattern', icon: 'route' },
      { id: 'Knapsack', name: '0/1 & Unbounded Knapsack', tag: 'Pattern', icon: 'backpack' },
      { id: 'Flood Fill', name: 'Matrix Traversal & Flood Fill', tag: 'Pattern', icon: 'grid_view' },
    ]
  }
];

// Pick question helper with intelligent matching and safe fallback
function pickQuestion(selectionType, topic, lowerRating = 1000) {
  let pool = [...ARENA_QUESTIONS];

  if (selectionType === 'balanced') {
    let targetDiff = 'Medium';
    if (lowerRating < 1100) targetDiff = 'Easy';
    else if (lowerRating > 1400) targetDiff = 'Hard';

    const diffPool = pool.filter(q => q.diff.toLowerCase() === targetDiff.toLowerCase());
    if (diffPool.length > 0) pool = diffPool;
  } else if (topic && topic !== 'All') {
    const t = topic.toLowerCase();
    const matched = pool.filter(q => {
      if (q.topic && q.topic.toLowerCase() === t) return true;
      if (q.tags && q.tags.some(tag => tag.toLowerCase() === t || t.includes(tag.toLowerCase()) || tag.toLowerCase().includes(t))) return true;
      if (q.title && q.title.toLowerCase().includes(t)) return true;
      if (q.statement && q.statement.toLowerCase().includes(t)) return true;
      if (q.hints && q.hints.some(h => h.toLowerCase().includes(t))) return true;
      return false;
    });
    if (matched.length > 0) pool = matched;
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)] || ARENA_QUESTIONS[0];
  return chosen;
}

export default function VersusTab({ isDark, onActiveMatchChange }) {
  // Theme styling
  const panelBg = isDark ? '#14141A' : '#FFFFFF';
  const surfLow = isDark ? '#1A1A22' : '#F1F5F9';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const textPri = isDark ? '#F8FAFC' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';

  const [view, setView] = useState('landing'); // 'landing' | 'lobby' | 'match'
  const [party, setParty] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [sendingInvite, setSendingInvite] = useState(null);
  const [sentInvites, setSentInvites] = useState(new Set());
  const [copiedCode, setCopiedCode] = useState(false);

  // Categorized dropdown state
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const topicDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(e.target)) {
        setTopicDropdownOpen(false);
      }
    };
    if (topicDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [topicDropdownOpen]);

  // Quick save config
  const defaultSaved = {
    versus_mode: 'competitive',
    versus_selection: 'topic',
    versus_topic: 'Arrays',
    duration_minutes: 30,
  };
  const [savedConfig, setSavedConfig] = useState(() => {
    try {
      const s = localStorage.getItem('versus_saved_settings');
      return s ? JSON.parse(s) : defaultSaved;
    } catch {
      return defaultSaved;
    }
  });

  // Modal form config
  const [formMode, setFormMode] = useState(savedConfig.versus_mode || 'competitive');
  const [formSelection, setFormSelection] = useState(savedConfig.versus_selection || 'topic');
  const [formTopic, setFormTopic] = useState(savedConfig.versus_topic || 'Arrays');
  const [formDuration, setFormDuration] = useState(savedConfig.duration_minutes || 30);
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Current user info
  const [currentUser, setCurrentUser] = useState({});
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(u);
    } catch {
      setCurrentUser({});
    }
  }, []);

  // Update active match status to parent
  useEffect(() => {
    if (view === 'match' && party?.code) {
      onActiveMatchChange?.({ mode: '1v1 Versus', code: party.code });
    } else {
      onActiveMatchChange?.(null);
    }
  }, [view, party?.code, onActiveMatchChange]);

  // Real-time polling in Lobby
  useEffect(() => {
    if (view !== 'lobby' || !party?.code) return;
    let unmounted = false;

    const poll = async () => {
      try {
        const res = await api.get(`/challenges/party/${party.code}/`);
        if (unmounted) return;
        setParty(res);
        if (res.status === 'active') {
          setView('match');
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(poll, 2000);
    return () => {
      unmounted = true;
      clearInterval(interval);
    };
  }, [view, party?.code]);

  // Load friends for direct invite
  const loadFriends = async () => {
    try {
      const res = await api.get('/friends/list/');
      const raw = Array.isArray(res) ? res : (res?.results || []);
      const normalized = raw
        .map(item => item?.friend ? { ...item.friend, friendship_id: item.id } : item)
        .filter(f => f && (f.id || f.username));
      setFriends(normalized);
    } catch {
      setFriends([]);
    }
  };

  // Create match
  const handleCreateMatch = async (config) => {
    setBusy(true);
    setError('');

    try {
      const q = pickQuestion(config.versus_selection, config.versus_topic);
      const payload = {
        name: `1v1 Versus`,
        duration_minutes: config.duration_minutes,
        max_questions: 1,
        question_mode: 'versus',
        match_type: 'versus',
        versus_mode: config.versus_mode,
        versus_selection: config.versus_selection,
        versus_topic: config.versus_topic,
        versus_q_data: q,
        is_ranked: config.versus_mode === 'competitive',
        max_strikes: config.versus_mode === 'competitive' ? 3 : 0,
        host_spectator: false,
      };

      const res = await api.post('/challenges/party/create/', payload);
      setParty(res);
      setView('lobby');
      setShowCreateModal(false);

      if (saveAsDefault) {
        localStorage.setItem('versus_saved_settings', JSON.stringify({
          versus_mode: config.versus_mode,
          versus_selection: config.versus_selection,
          versus_topic: config.versus_topic,
          duration_minutes: config.duration_minutes,
        }));
        setSavedConfig(config);
      }
    } catch (err) {
      setError(err?.detail || 'Failed to create 1v1 Versus room.');
    } finally {
      setBusy(false);
    }
  };

  // Join match
  const handleJoinMatch = async () => {
    if (!joinCode.trim()) return;
    setBusy(true);
    setError('');

    try {
      const res = await api.post(`/challenges/party/${joinCode.trim().toUpperCase()}/join/`, {});
      setParty(res);
      setView(res.status === 'active' ? 'match' : 'lobby');
    } catch (err) {
      setError(err?.detail || 'Versus room not found or already full.');
    } finally {
      setBusy(false);
    }
  };

  // Start match
  const handleStartMatch = async () => {
    if (!party?.code) return;
    setBusy(true);
    setError('');

    try {
      // If balanced profile mode, calibrate question to lower rating player before start
      if (party.versus_selection === 'balanced' && party.members && party.members.length >= 2) {
        const ratings = party.members.map(m => m.user?.rating || 1000);
        const lowerRating = Math.min(...ratings);
        const calibratedQ = pickQuestion('balanced', '', lowerRating);

        await api.patch(`/challenges/party/${party.code}/rename/`, {
          versus_q_data: calibratedQ
        });
      }

      const res = await api.post(`/challenges/party/${party.code}/start/`, {});
      setParty(res);
      setView('match');
    } catch (err) {
      setError(err?.detail || 'Failed to start match.');
    } finally {
      setBusy(false);
    }
  };

  // Send friend invite
  const handleInviteFriend = async (friendId) => {
    if (!party?.code) return;
    setSendingInvite(friendId);
    try {
      await api.post(`/challenges/party/${party.code}/invite/`, { receiver_id: friendId });
      setSentInvites(prev => new Set([...prev, friendId]));
    } catch {
      // ignore
    } finally {
      setSendingInvite(null);
    }
  };

  // Copy code
  const copyRoomCode = () => {
    if (!party?.code) return;
    navigator.clipboard.writeText(party.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // If match active, render VersusIDE
  if (view === 'match' && party) {
    return (
      <VersusIDE
        party={party}
        isDark={isDark}
        onLeave={() => {
          setView('landing');
          setParty(null);
        }}
        onActiveMatchChange={onActiveMatchChange}
      />
    );
  }

  // Members in lobby
  const hostMember = (party?.all_members || party?.members || []).find(m => m.username === party?.host_username);
  const opponentMember = (party?.all_members || party?.members || []).find(m => m.username !== party?.host_username);
  const isHost = party?.host_username === currentUser?.username;

  return (
    <div className="space-y-6">
      
      {/* ─── ERROR BANNER ─── */}
      {error && (
        <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ─── VIEW 1: LANDING & SETUP ─── */}
      {view === 'landing' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="p-6 rounded-3xl border transition-all"
            style={{ background: panelBg, borderColor: border }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Real-Time 1v1
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    In-App Coding
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: textPri }}>
                  1v1 Versus Face-off
                </h2>
                <p className="text-xs mt-1" style={{ color: textSec }}>
                  Challenge a friend or rival in a direct duel. Solve the question inside the distraction-free in-app IDE with progressive time-penalty hints.
                </p>
              </div>

              {/* Quick Launch Card (Saved Settings) */}
              {savedConfig && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleCreateMatch(savedConfig)}
                  className="p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] hover:border-violet-500/40 cursor-pointer w-full sm:w-auto shadow-sm"
                  style={{ background: surfLow, borderColor: border }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-amber-400 text-base">bolt</span>
                    <span className="text-xs font-bold" style={{ color: textPri }}>
                      Quick Launch (Saved Config)
                    </span>
                  </div>
                  <p className="text-[11px] font-mono" style={{ color: textSec }}>
                    {savedConfig.versus_mode === 'competitive' ? 'Competitive' : 'Casual'} · {savedConfig.versus_selection === 'balanced' ? 'Balanced Rating' : savedConfig.versus_topic} · {savedConfig.duration_minutes}m
                  </p>
                  <span className="text-[10px] text-violet-400 mt-1.5 inline-block font-semibold">
                    Start match immediately with 1-click →
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 2 Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 1: Create 1v1 Room */}
            <div className="p-6 rounded-3xl border flex flex-col justify-between space-y-4"
              style={{ background: panelBg, borderColor: border }}>
              <div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-violet-500/10 text-violet-400 mb-3 border border-violet-500/20">
                  <span className="material-symbols-outlined text-xl">swords</span>
                </div>
                <h3 className="text-base font-bold" style={{ color: textPri }}>Host 1v1 Duel</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: textSec }}>
                  Create a custom room, choose Competitive or Casual rules, calibrate the problem by topic or player profiles, and invite your opponent.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-full py-3 px-4 rounded-2xl text-left border transition-all hover:bg-violet-600 hover:border-violet-600 text-white cursor-pointer group shadow-sm"
                style={{ background: '#7C3AED', borderColor: 'rgba(124, 58, 237, 0.4)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Create 1v1 Room</div>
                    <div className="text-[11px] opacity-80 font-normal">
                      Configure match rules &amp; generate invite code
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </button>
            </div>

            {/* Card 2: Join 1v1 Room */}
            <div className="p-6 rounded-3xl border flex flex-col justify-between space-y-4"
              style={{ background: panelBg, borderColor: border }}>
              <div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
                  <span className="material-symbols-outlined text-xl">login</span>
                </div>
                <h3 className="text-base font-bold" style={{ color: textPri }}>Join Duel</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: textSec }}>
                  Enter a 6-character room code received from a friend to join their 1v1 challenge.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter 6-char Room Code (e.g. IH8TUJ)"
                  value={joinCode}
                  maxLength={8}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-2xl text-xs font-mono font-bold tracking-wider outline-none bg-transparent border text-center uppercase"
                  style={{ borderColor: border, color: textPri }}
                />

                <button
                  type="button"
                  disabled={!joinCode.trim() || busy}
                  onClick={handleJoinMatch}
                  className="w-full py-3 px-4 rounded-2xl text-left border transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-sm"
                  style={{ background: surfLow, borderColor: border, color: textPri }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold">Join 1v1 Room</div>
                      <div className="text-[11px] font-normal" style={{ color: textSec }}>
                        Connect to your opponent's waiting room
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-base">
                      east
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW 2: LOBBY (WAITING FOR OPPONENT) ─── */}
      {view === 'lobby' && party && (
        <div className="space-y-6">
          
          {/* Lobby Header */}
          <div className="p-6 rounded-3xl border"
            style={{ background: panelBg, borderColor: border }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                    style={{ background: surfLow, color: textSec }}>
                    ROOM #{party.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      background: party.versus_mode === 'competitive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: party.versus_mode === 'competitive' ? '#EF4444' : '#6366F1'
                    }}>
                    {party.versus_mode === 'competitive' ? 'Competitive Duel' : 'Casual Duel'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: textPri }}>
                  Waiting for Opponent
                </h2>
                <p className="text-xs mt-1" style={{ color: textSec }}>
                  Share the room code or invite a friend to start the in-app challenge.
                </p>
              </div>

              {/* Room Code & Invite Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={copyRoomCode}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  style={{ background: surfLow, color: textPri, border: `1px solid ${border}` }}
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedCode ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedCode ? 'Copied Code' : `Code: #${party.code}`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loadFriends();
                    setShowInviteModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-indigo-600 text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  <span>Invite Friend</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('landing');
                    setParty(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                  style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>

          {/* 1v1 Face-Off Matchup Roster */}
          <div className="p-6 rounded-3xl border"
            style={{ background: panelBg, borderColor: border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: textSec }}>
              Competitor Roster (2/2 Required)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              
              {/* Host Slot */}
              <div className="md:col-span-2 p-4 rounded-2xl border text-center space-y-2"
                style={{ background: surfLow, borderColor: border }}>
                <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-bold text-white text-base shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                  {hostMember?.username ? hostMember.username[0].toUpperCase() : 'H'}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: textPri }}>
                    {hostMember?.username || party.host_username}
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold">Host · Ready</span>
                </div>
              </div>

              {/* VS Divider */}
              <div className="md:col-span-1 text-center font-black text-lg tracking-widest text-violet-500">
                VS
              </div>

              {/* Opponent Slot */}
              <div className="md:col-span-2 p-4 rounded-2xl border text-center space-y-2"
                style={{
                  background: opponentMember ? surfLow : 'transparent',
                  borderColor: opponentMember ? border : 'rgba(99, 102, 241, 0.2)',
                  borderStyle: opponentMember ? 'solid' : 'dashed'
                }}>
                {opponentMember ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-bold text-white text-base shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}>
                      {opponentMember.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: textPri }}>
                        {opponentMember.username}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold">Challenger · Connected</span>
                    </div>
                  </>
                ) : (
                  <div className="py-2 space-y-1">
                    <span className="material-symbols-outlined text-2xl animate-spin text-indigo-400">
                      hourglass_top
                    </span>
                    <p className="text-xs font-semibold" style={{ color: textSec }}>
                      Waiting for opponent...
                    </p>
                    <p className="text-[10px]" style={{ color: textSec }}>
                      Share code <strong>#{party.code}</strong> with a friend
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Match Button (Host only) */}
            {isHost && (
              <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{ borderColor: border }}>
                <div className="text-xs" style={{ color: textSec }}>
                  {opponentMember ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Both players connected. You may launch the match.
                    </span>
                  ) : (
                    <span>Match can begin once challenger joins the room.</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!opponentMember || busy}
                  onClick={handleStartMatch}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl text-left border transition-all hover:opacity-95 disabled:opacity-40 cursor-pointer text-white shadow-md"
                  style={{ background: '#7C3AED', borderColor: 'rgba(124, 58, 237, 0.4)' }}
                >
                  <div className="text-xs font-bold">Start 1v1 Face-off</div>
                  <div className="text-[11px] opacity-80 font-normal">
                    Launches the in-app IDE for both players simultaneously
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE 1V1 ROOM ─── */}
      {showCreateModal && (() => {
        const allItems = TOPIC_GROUPS.flatMap(g => g.items);
        const selectedTopicItem = allItems.find(it => it.id === formTopic) || {
          id: formTopic,
          name: formTopic,
          tag: 'DSA',
          icon: 'category'
        };

        const filteredGroups = TOPIC_GROUPS.map(group => {
          const q = topicSearchQuery.trim().toLowerCase();
          if (!q) return group;
          const filteredItems = group.items.filter(it =>
            it.name.toLowerCase().includes(q) ||
            it.id.toLowerCase().includes(q) ||
            it.tag.toLowerCase().includes(q) ||
            group.category.toLowerCase().includes(q)
          );
          return { ...group, items: filteredItems };
        }).filter(group => group.items.length > 0);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="w-full max-w-2xl rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative my-auto border"
              style={{ background: panelBg, borderColor: border }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: border }}>
                <div>
                  <h3 className="text-lg font-bold tracking-tight" style={{ color: textPri }}>
                    Configure 1v1 Room
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: textSec }}>
                    Set match rules, choose DSA curriculum topic, and set time limit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg" style={{ color: textSec }}>close</span>
                </button>
              </div>

              {/* Match Rules: Competitive vs Casual */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>
                    Match Rules
                  </label>
                  <span className="text-[11px]" style={{ color: textSec }}>
                    Controls anti-cheat &amp; tab foul enforcement
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setFormMode('competitive')}
                    className="p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group"
                    style={{
                      background: formMode === 'competitive' ? 'rgba(124, 58, 237, 0.12)' : surfLow,
                      borderColor: formMode === 'competitive' ? '#7C3AED' : border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs" style={{ color: formMode === 'competitive' ? '#A78BFA' : textPri }}>
                        <span className="material-symbols-outlined text-base">shield</span>
                        <span>Competitive</span>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          background: formMode === 'competitive' ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255,255,255,0.06)',
                          color: formMode === 'competitive' ? '#C4B5FD' : textSec,
                        }}
                      >
                        Strict Fair Play
                      </span>
                    </div>
                    <p className="text-[11px] mt-2 leading-relaxed" style={{ color: textSec }}>
                      Tab switching or window blur logged as anti-cheat fouls · Ranked
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMode('casual')}
                    className="p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group"
                    style={{
                      background: formMode === 'casual' ? 'rgba(99, 102, 241, 0.12)' : surfLow,
                      borderColor: formMode === 'casual' ? '#6366F1' : border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs" style={{ color: formMode === 'casual' ? '#818CF8' : textPri }}>
                        <span className="material-symbols-outlined text-base">sports_esports</span>
                        <span>Casual</span>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          background: formMode === 'casual' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.06)',
                          color: formMode === 'casual' ? '#A5B4FC' : textSec,
                        }}
                      >
                        Relaxed Duel
                      </span>
                    </div>
                    <p className="text-[11px] mt-2 leading-relaxed" style={{ color: textSec }}>
                      Window &amp; tab switching freely allowed · Unranked friendly match
                    </p>
                  </button>
                </div>
              </div>

              {/* Problem Selection Mode */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>
                    Problem Selection
                  </label>
                  <span className="text-[11px]" style={{ color: textSec }}>
                    {formSelection === 'topic' ? 'Filtered by chosen DSA curriculum' : 'Auto-balanced to player ratings'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setFormSelection('topic')}
                    className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer"
                    style={{
                      background: formSelection === 'topic' ? 'rgba(124, 58, 237, 0.12)' : surfLow,
                      borderColor: formSelection === 'topic' ? '#7C3AED' : border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: formSelection === 'topic' ? '#A78BFA' : textPri }}>
                        Topic &amp; Pattern Selection
                      </span>
                      {formSelection === 'topic' && (
                        <span className="material-symbols-outlined text-sm text-purple-400">check_circle</span>
                      )}
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: textSec }}>
                      Choose specific Data Structure, Algo, or Pattern
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSelection('balanced')}
                    className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer"
                    style={{
                      background: formSelection === 'balanced' ? 'rgba(124, 58, 237, 0.12)' : surfLow,
                      borderColor: formSelection === 'balanced' ? '#7C3AED' : border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: formSelection === 'balanced' ? '#A78BFA' : textPri }}>
                        Balanced Profile Match
                      </span>
                      {formSelection === 'balanced' && (
                        <span className="material-symbols-outlined text-sm text-purple-400">check_circle</span>
                      )}
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: textSec }}>
                      Calibrate difficulty to the lower-rated player
                    </p>
                  </button>
                </div>

                {/* Categorized Dropdown Menu */}
                {formSelection === 'topic' && (
                  <div className="pt-1.5 relative" ref={topicDropdownRef}>
                    <label className="text-[11px] font-semibold block mb-1.5" style={{ color: textSec }}>
                      Select Curriculum Topic or Pattern:
                    </label>

                    {/* Dropdown Trigger Card */}
                    <button
                      type="button"
                      onClick={() => setTopicDropdownOpen(!topicDropdownOpen)}
                      className="w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer hover:border-purple-500/50"
                      style={{
                        background: surfLow,
                        borderColor: topicDropdownOpen ? '#7C3AED' : border,
                        boxShadow: topicDropdownOpen ? '0 0 0 2px rgba(124, 58, 237, 0.2)' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA' }}
                        >
                          <span className="material-symbols-outlined text-base">
                            {selectedTopicItem.icon || 'category'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold truncate" style={{ color: textPri }}>
                              {selectedTopicItem.name}
                            </span>
                            <span
                              className="text-[9px] font-semibold px-2 py-0.5 rounded-md"
                              style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA' }}
                            >
                              {selectedTopicItem.tag}
                            </span>
                          </div>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: textSec }}>
                            Click to select another data structure, algorithm, or pattern
                          </p>
                        </div>
                      </div>

                      <span
                        className="material-symbols-outlined text-sm transition-transform duration-200"
                        style={{
                          color: textSec,
                          transform: topicDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Dropdown Overlay Menu */}
                    {topicDropdownOpen && (
                      <div
                        className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl shadow-2xl border overflow-hidden p-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                        style={{
                          background: isDark ? '#161622' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                          maxHeight: '340px',
                        }}
                      >
                        {/* Search Input */}
                        <div className="pb-2.5 mb-2 border-b" style={{ borderColor: border }}>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-2.5 top-2 text-xs" style={{ color: textSec }}>
                              search
                            </span>
                            <input
                              type="text"
                              value={topicSearchQuery}
                              onChange={(e) => setTopicSearchQuery(e.target.value)}
                              placeholder="Search data structures, algorithms, patterns..."
                              autoFocus
                              className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs outline-none bg-transparent border"
                              style={{
                                borderColor: border,
                                color: textPri,
                              }}
                            />
                            {topicSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setTopicSearchQuery('')}
                                className="absolute right-2 top-2 text-xs cursor-pointer hover:opacity-80"
                                style={{ color: textSec }}
                              >
                                <span className="material-symbols-outlined text-xs">close</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Categorized Scrollable Items */}
                        <div className="overflow-y-auto space-y-3 pr-1" style={{ maxHeight: '230px' }}>
                          {filteredGroups.length === 0 ? (
                            <div className="text-center py-6 text-xs" style={{ color: textSec }}>
                              No topics match &quot;{topicSearchQuery}&quot;
                            </div>
                          ) : (
                            filteredGroups.map((group) => (
                              <div key={group.category} className="space-y-1">
                                <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: textSec }}>
                                  <span className="material-symbols-outlined text-xs">{group.icon}</span>
                                  <span>{group.category}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {group.items.map((item) => {
                                    const isSelected = formTopic === item.id;
                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                          setFormTopic(item.id);
                                          setTopicDropdownOpen(false);
                                          setTopicSearchQuery('');
                                        }}
                                        className="px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer group"
                                        style={{
                                          background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                                          border: isSelected ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid transparent',
                                        }}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span
                                            className="material-symbols-outlined text-sm shrink-0"
                                            style={{ color: isSelected ? '#A78BFA' : textSec }}
                                          >
                                            {item.icon}
                                          </span>
                                          <span
                                            className="text-xs truncate font-medium group-hover:text-purple-400"
                                            style={{ color: isSelected ? '#A78BFA' : textPri }}
                                          >
                                            {item.name}
                                          </span>
                                        </div>
                                        <span
                                          className="text-[9px] px-1.5 py-0.5 rounded shrink-0 ml-1"
                                          style={{
                                            background: isSelected ? 'rgba(124, 58, 237, 0.25)' : surfLow,
                                            color: isSelected ? '#C4B5FD' : textSec,
                                          }}
                                        >
                                          {item.tag}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Match Duration */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>
                    Match Duration
                  </label>
                  <span className="text-xs font-mono font-bold" style={{ color: '#A78BFA' }}>
                    {formDuration} minutes
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFormDuration(mins)}
                      className="py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      style={formDuration === mins
                        ? { background: '#7C3AED', color: '#fff', boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)' }
                        : { background: surfLow, color: textSec, border: `1px solid ${border}` }
                      }
                    >
                      <span className="material-symbols-outlined text-xs opacity-75">timer</span>
                      <span>{mins}m</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences & Launch Action */}
              <div className="pt-2 flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: textPri }}>
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={e => setSaveAsDefault(e.target.checked)}
                    className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                  />
                  <span>Remember settings as 1-click Quick Launch default</span>
                </label>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleCreateMatch({
                    versus_mode: formMode,
                    versus_selection: formSelection,
                    versus_topic: formTopic,
                    duration_minutes: formDuration,
                  })}
                  className="w-full py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all hover:opacity-95 cursor-pointer shadow-lg active:scale-[0.99]"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                    boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)',
                  }}
                >
                  <span>Launch 1v1 Room</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── MODAL: INVITE FRIENDS ─── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl"
            style={{ background: panelBg, border: `1px solid ${border}` }}
            onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: border }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: textPri }}>Invite Friends to Duel</h3>
                <p className="text-xs mt-0.5" style={{ color: textSec }}>Send direct in-app invite with room #{party?.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base" style={{ color: textSec }}>close</span>
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {friends.length === 0 ? (
                <div className="text-center py-8 rounded-2xl" style={{ background: surfLow }}>
                  <span className="material-symbols-outlined text-3xl block mb-2" style={{ color: textSec, opacity: 0.6 }}>group_off</span>
                  <p className="text-xs font-semibold" style={{ color: textPri }}>No friends connected yet</p>
                  <p className="text-[11px] mt-1" style={{ color: textSec }}>Share room code #{party?.code} directly with your opponent.</p>
                </div>
              ) : (
                friends.map(f => {
                  const isSent = sentInvites.has(f.id);
                  const isSending = sendingInvite === f.id;
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-2xl transition-all"
                      style={{ background: surfLow, border: `1px solid ${border}` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                        >
                          {f.avatar ? (
                            <img src={f.avatar} alt={f.username} className="w-full h-full object-cover" />
                          ) : (
                            (f.username || '?')[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: textPri }}>{f.username}</p>
                          <p className="text-[10px] truncate" style={{ color: textSec }}>
                            {f.rating ? `Rating: ${f.rating}` : 'Friend'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSending || isSent}
                        onClick={() => handleInviteFriend(f.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer flex items-center gap-1 shrink-0"
                        style={{
                          background: isSent ? 'rgba(34, 197, 94, 0.15)' : '#7C3AED',
                          color: isSent ? '#22C55E' : '#fff',
                          border: isSent ? '1px solid rgba(34, 197, 94, 0.3)' : 'none',
                        }}
                      >
                        {isSending ? (
                          <span>Sending...</span>
                        ) : isSent ? (
                          <>
                            <span className="material-symbols-outlined text-xs">check</span>
                            <span>Invite Sent</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xs">send</span>
                            <span>Send Invite</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t" style={{ borderColor: border }}>
              <span style={{ color: textSec }}>Direct Room Code:</span>
              <button
                type="button"
                onClick={copyRoomCode}
                className="font-mono font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer flex items-center gap-1 hover:bg-white/10"
                style={{ color: '#A78BFA', background: surfLow }}
              >
                <span>#{party?.code}</span>
                <span className="material-symbols-outlined text-xs">{copiedCode ? 'check' : 'content_copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}