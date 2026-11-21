import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { ARENA_QUESTIONS } from '../../data/arenaQuestions.js';
import VersusIDE from './VersusIDE.jsx';

// Pick question helper
function pickQuestion(selectionType, topic, lowerRating = 1000) {
  let pool = [...ARENA_QUESTIONS];

  if (selectionType === 'balanced') {
    let targetDiff = 'Medium';
    if (lowerRating < 1100) targetDiff = 'Easy';
    else if (lowerRating > 1400) targetDiff = 'Hard';

    const diffPool = pool.filter(q => q.diff.toLowerCase() === targetDiff.toLowerCase());
    if (diffPool.length > 0) pool = diffPool;
  } else if (topic && topic !== 'All') {
    const topicPool = pool.filter(q => q.topic.toLowerCase() === topic.toLowerCase());
    if (topicPool.length > 0) pool = topicPool;
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

  // Available topics from arena questions
  const availableTopics = ['All', 'Arrays', 'Strings', 'Stack', 'Linked List', 'Binary Search', 'DP'];

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
      const res = await api.get('/friends/');
      setFriends(Array.isArray(res) ? res : res.results || []);
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
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl"
            style={{ background: panelBg, border: `1px solid ${border}` }}
            onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: border }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: textPri }}>Configure 1v1 Room</h3>
                <p className="text-xs mt-0.5" style={{ color: textSec }}>Setup match rules and problem selection</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="cursor-pointer">
                <span className="material-symbols-outlined" style={{ color: textSec }}>close</span>
              </button>
            </div>

            {/* Rule: Competitive vs Casual */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>
                Match Rules
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormMode('competitive')}
                  className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer"
                  style={{
                    background: formMode === 'competitive' ? 'rgba(124, 58, 237, 0.12)' : surfLow,
                    borderColor: formMode === 'competitive' ? '#7C3AED' : border,
                  }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: formMode === 'competitive' ? '#A78BFA' : textPri }}>
                    <span className="material-symbols-outlined text-sm">shield</span>
                    Competitive
                  </div>
                  <p className="text-[10px] mt-1 leading-snug" style={{ color: textSec }}>
                    Strict fair play. Tab switching or window blur is flagged as a foul.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormMode('casual')}
                  className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer"
                  style={{
                    background: formMode === 'casual' ? 'rgba(99, 102, 241, 0.12)' : surfLow,
                    borderColor: formMode === 'casual' ? '#6366F1' : border,
                  }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: formMode === 'casual' ? '#818CF8' : textPri }}>
                    <span className="material-symbols-outlined text-sm">sports_esports</span>
                    Casual
                  </div>
                  <p className="text-[10px] mt-1 leading-snug" style={{ color: textSec }}>
                    Relaxed 1v1. Window and tab switching is freely permitted.
                  </p>
                </button>
              </div>
            </div>

            {/* Question Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>
                Problem Selection
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormSelection('topic')}
                  className="p-3 rounded-2xl border text-left transition-all cursor-pointer"
                  style={{
                    background: formSelection === 'topic' ? 'rgba(124, 58, 237, 0.1)' : surfLow,
                    borderColor: formSelection === 'topic' ? '#7C3AED' : border,
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: formSelection === 'topic' ? '#A78BFA' : textPri }}>
                    Topic Selection
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: textSec }}>
                    Picks randomly within chosen category
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormSelection('balanced')}
                  className="p-3 rounded-2xl border text-left transition-all cursor-pointer"
                  style={{
                    background: formSelection === 'balanced' ? 'rgba(124, 58, 237, 0.1)' : surfLow,
                    borderColor: formSelection === 'balanced' ? '#7C3AED' : border,
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: formSelection === 'balanced' ? '#A78BFA' : textPri }}>
                    Balanced Profile Match
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: textSec }}>
                    Calibrates difficulty to lower-profile player
                  </p>
                </button>
              </div>

              {/* Topic Pills if Topic Selection */}
              {formSelection === 'topic' && (
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {availableTopics.map(top => (
                    <button
                      key={top}
                      type="button"
                      onClick={() => setFormTopic(top)}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      style={formTopic === top ? { background: '#7C3AED', color: '#fff' } : { background: surfLow, color: textSec, border: `1px solid ${border}` }}
                    >
                      {top}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>
                Match Duration
              </label>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFormDuration(mins)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    style={formDuration === mins ? { background: '#7C3AED', color: '#fff' } : { background: surfLow, color: textSec, border: `1px solid ${border}` }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Save Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: textPri }}>
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={e => setSaveAsDefault(e.target.checked)}
                className="rounded accent-violet-600"
              />
              <span>Remember settings as 1-click Quick Launch default</span>
            </label>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleCreateMatch({
                  versus_mode: formMode,
                  versus_selection: formSelection,
                  versus_topic: formTopic,
                  duration_minutes: formDuration,
                })}
                className="w-full py-3 px-4 rounded-2xl text-left border transition-all hover:opacity-95 text-white cursor-pointer shadow-md"
                style={{ background: '#7C3AED', borderColor: 'rgba(124, 58, 237, 0.4)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Launch 1v1 Room</div>
                    <div className="text-[11px] opacity-80 font-normal">
                      Initializes room and opens opponent lobby
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-base">
                    rocket_launch
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: INVITE FRIENDS ─── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl"
            style={{ background: panelBg, border: `1px solid ${border}` }}
            onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: border }}>
              <h3 className="text-base font-bold" style={{ color: textPri }}>Invite Friends to Duel</h3>
              <button onClick={() => setShowInviteModal(false)} className="cursor-pointer">
                <span className="material-symbols-outlined" style={{ color: textSec }}>close</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="text-center py-6 text-xs" style={{ color: textSec }}>
                  No friends connected yet. Share the room code directly!
                </p>
              ) : (
                friends.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 rounded-2xl"
                    style={{ background: surfLow }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                        {f.username[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: textPri }}>{f.username}</span>
                    </div>

                    <button
                      type="button"
                      disabled={sendingInvite === f.id || sentInvites.has(f.id)}
                      onClick={() => handleInviteFriend(f.id)}
                      className="px-3 py-1 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                      style={{
                        background: sentInvites.has(f.id) ? 'rgba(34, 197, 94, 0.15)' : '#7C3AED',
                        color: sentInvites.has(f.id) ? '#22C55E' : '#fff'
                      }}
                    >
                      {sendingInvite === f.id ? 'Sending...' : sentInvites.has(f.id) ? '✓ Sent' : 'Invite'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}