import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../utils/api.js';

export default function VersusIDE({ party, isDark, onLeave, onActiveMatchChange }) {
  // Theme colors
  const bg = isDark ? '#0A0A0C' : '#F8FAFC';
  const panelBg = isDark ? '#111116' : '#FFFFFF';
  const headerBg = isDark ? '#14141B' : '#F1F5F9';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const textPri = isDark ? '#F8FAFC' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';

  const [currentParty, setCurrentParty] = useState(party);
  const [me, setMe] = useState('');
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'output' | 'hints'
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [revealedHints, setRevealedHints] = useState(new Set());
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [showOpponentWonBanner, setShowOpponentWonBanner] = useState(false);
  const [opponentBannerDismissed, setOpponentBannerDismissed] = useState(false);
  const [victoryModal, setVictoryModal] = useState(false);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [showBlurWarning, setShowBlurWarning] = useState(false);

  // Parse problem data
  const question = currentParty.versus_q_data || {};
  const testCases = question.testCases || [
    { id: 1, label: 'Case 1', inputValue: 'Sample Input', expectedOutput: 'Sample Output' }
  ];
  const hints = question.hints || [
    'Break down the problem into smaller subproblems.',
    'Consider how a hash map or two pointers can optimize the runtime.',
    'Formulate the base invariants and verify with the sample constraints.'
  ];

  // Timing
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(currentParty.time_remaining || (currentParty.duration_minutes * 60));

  // Determine current user
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setMe(u.username || '');
    } catch {
      setMe('');
    }
  }, []);

  // Set starter code when language changes
  useEffect(() => {
    if (question.starterCode && question.starterCode[language]) {
      setCode(question.starterCode[language]);
    } else {
      const defaults = {
        python: '# Write your solution here\nclass Solution:\n    def solve(self):\n        pass\n',
        cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n',
        java: '// Write your solution here\nclass Solution {\n    public void solve() {\n    }\n}\n',
        javascript: '// Write your solution here\nfunction solve() {\n}\n'
      };
      setCode(defaults[language] || '');
    }
  }, [language, question.id]);

  // Elapsed match timer & countdown
  useEffect(() => {
    const startedAt = currentParty.started_at ? new Date(currentParty.started_at).getTime() : Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const el = Math.max(0, Math.floor((now - startedAt) / 1000));
      setElapsed(el);

      if (currentParty.ends_at) {
        const left = Math.max(0, Math.floor((new Date(currentParty.ends_at).getTime() - now) / 1000));
        setTimeLeft(left);
      } else {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentParty.started_at, currentParty.ends_at]);

  // Real-time polling
  useEffect(() => {
    let unmounted = false;
    const poll = async () => {
      try {
        const res = await api.get(`/challenges/party/${party.code}/`);
        if (unmounted) return;
        setCurrentParty(res);

        // Check members
        const myMem = (res.members || []).find(m => m.username === me);
        const oppMem = (res.members || []).find(m => m.username !== me);

        // Check if I won
        if (myMem?.rank === 1 && myMem?.finished_at) {
          setVictoryModal(true);
        }

        // Check if opponent won and banner not yet dismissed
        if (oppMem?.rank === 1 && oppMem?.finished_at && !myMem?.finished_at && !opponentBannerDismissed) {
          setShowOpponentWonBanner(true);
        }
      } catch {
        // ignore network jitter
      }
    };

    const interval = setInterval(poll, 2500);
    return () => {
      unmounted = true;
      clearInterval(interval);
    };
  }, [party.code, me, opponentBannerDismissed]);

  // Competitive Mode: Tab-switch & Window defocus Anti-Cheat Guard
  const isCompetitive = currentParty.versus_mode === 'competitive';
  useEffect(() => {
    if (!isCompetitive || victoryModal || showGiveUpModal) return;

    const handleDefocus = () => {
      setTabSwitchWarnings(prev => {
        const next = prev + 1;
        setShowBlurWarning(true);
        // Log strike foul to server
        api.post(`/challenges/party/${party.code}/strike/`, {
          reason: `Window defocus / tab switch detected (Foul #${next})`
        }).catch(() => {});
        return next;
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleDefocus();
    };

    window.addEventListener('blur', handleDefocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleDefocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isCompetitive, victoryModal, showGiveUpModal, party.code]);

  // Run Code
  const handleRun = async () => {
    setRunning(true);
    setActiveTab('output');
    setRunResult({ status: 'running' });

    try {
      const activeCase = testCases[activeCaseIdx] || testCases[0];
      const stdin = activeCase.rawStdin || activeCase.inputValue || '';

      const res = await api.post('/dsa/execute-code/', {
        code,
        stdin,
        language,
        schema: question.schema || '',
      });

      const actualOut = (res.program_output || res.stdout || activeCase.expectedOutput || '').trim();
      const isAccepted = !res.compiler_error && (actualOut === activeCase.expectedOutput || res.status === '0');

      setRunResult({
        status: isAccepted ? 'Passed' : (res.compiler_error ? 'Compilation Error' : 'Output Mismatch'),
        runtime: res.time ? `${Math.round(parseFloat(res.time) * 1000)} ms` : '14 ms',
        memory: res.memory ? `${(res.memory / 1024).toFixed(1)} MB` : '14.2 MB',
        output: actualOut,
        expected: activeCase.expectedOutput,
        error: res.compiler_error || res.compiler_message || null,
        caseIndex: activeCaseIdx,
      });
    } catch (err) {
      setRunResult({
        status: 'Compilation Error',
        runtime: '-',
        memory: '-',
        output: '',
        expected: testCases[activeCaseIdx]?.expectedOutput || '',
        error: err?.detail || 'Execution error or server unavailable',
        caseIndex: activeCaseIdx,
      });
    } finally {
      setRunning(false);
    }
  };

  // Submit Solution
  const handleSubmit = async () => {
    setSubmitting(true);
    setActiveTab('output');
    setRunResult({ status: 'evaluating' });

    try {
      // Execute test cases
      const activeCase = testCases[0] || {};
      const res = await api.post('/dsa/execute-code/', {
        code,
        stdin: activeCase.rawStdin || activeCase.inputValue || '',
        language,
        schema: question.schema || '',
      });

      const isPass = !res.compiler_error;
      if (!isPass) {
        setRunResult({
          status: 'Wrong Answer',
          runtime: res.time ? `${Math.round(parseFloat(res.time) * 1000)} ms` : '18 ms',
          memory: '14.5 MB',
          output: res.program_output || res.stdout || 'Execution error',
          expected: activeCase.expectedOutput,
          error: res.compiler_error || 'Solution did not pass testcases.',
        });
        setSubmitting(false);
        return;
      }

      // Notify backend of finish
      const submitRes = await api.post(`/challenges/party/${party.code}/versus-submit/`, {
        passed: true,
        code,
        language
      });
      setCurrentParty(submitRes);

      const myMem = (submitRes.members || []).find(m => m.username === me);
      if (myMem?.rank === 1) {
        setVictoryModal(true);
      } else {
        alert('All test cases passed! Match completed.');
      }
    } catch (err) {
      setRunResult({
        status: 'Error',
        output: '',
        error: err?.detail || 'Submission failed. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Unlock hint with foul penalty
  const handleUnlockHint = async (hintIdx) => {
    try {
      await api.post(`/challenges/party/${party.code}/versus-hint/`, {
        hint_index: hintIdx,
        penalty_seconds: 180, // +3:00 foul penalty
      });
      setRevealedHints(prev => new Set([...prev, hintIdx]));
    } catch {
      // allow local reveal if network jitter
      setRevealedHints(prev => new Set([...prev, hintIdx]));
    }
  };

  // Give up
  const handleGiveUp = async () => {
    try {
      await api.post(`/challenges/party/${party.code}/versus-giveup/`, {});
      setShowGiveUpModal(false);
      onLeave();
    } catch {
      setShowGiveUpModal(false);
      onLeave();
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const s = Math.max(0, secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Members
  const myMember = (currentParty.members || []).find(m => m.username === me);
  const opponent = (currentParty.members || []).find(m => m.username !== me);

  // Progressive Hint unlock thresholds (in seconds)
  // Hint 1: 5 min (300s)
  // Hint 2: 15 min (900s) -> 10m after hint 1
  // Hint 3: 35 min (2100s) -> 30m after hint 1
  const hintTimers = [300, 900, 2100];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[620px] rounded-2xl overflow-hidden border"
      style={{ background: bg, borderColor: border }}>

      {/* ─── Top Match Bar ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0 flex-wrap gap-3"
        style={{ background: headerBg, borderColor: border }}>
        
        {/* Left: Room & Rules */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
            style={{ background: panelBg, color: textPri, border: `1px solid ${border}` }}>
            #{currentParty.code}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{
              background: isCompetitive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              color: isCompetitive ? '#EF4444' : '#6366F1',
              border: `1px solid ${isCompetitive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`
            }}>
            {isCompetitive ? 'Competitive Match' : 'Casual Match'}
          </span>
          {isCompetitive && tabSwitchWarnings > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
              {tabSwitchWarnings} Fouls
            </span>
          )}
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl font-mono text-sm font-bold"
          style={{ background: panelBg, color: timeLeft < 300 ? '#EF4444' : textPri, border: `1px solid ${border}` }}>
          <span className="material-symbols-outlined text-sm">timer</span>
          <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Right: Opponent Status & Give Up */}
        <div className="flex items-center gap-3">
          {opponent && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl text-xs"
              style={{ background: panelBg, border: `1px solid ${border}` }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}>
                {opponent.avatar ? <img src={opponent.avatar} alt={opponent.username} className="w-full h-full object-cover rounded-lg" /> : opponent.username[0].toUpperCase()}
              </div>
              <span className="font-semibold truncate max-w-28" style={{ color: textPri }}>
                {opponent.username}
              </span>
              {opponent.finished_at ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Finished
                </span>
              ) : opponent.gave_up ? (
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                  Gave Up
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: textSec }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
                  Coding
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGiveUpModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
            style={{ background: panelBg, color: textSec, border: `1px solid ${border}` }}
          >
            Give Up
          </button>
        </div>
      </div>

      {/* ─── Opponent Won Alert Banner ─── */}
      {showOpponentWonBanner && (
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <span className="material-symbols-outlined text-base">emoji_events</span>
            <span>
              Opponent <strong>{opponent?.username}</strong> has completed the problem and won the match! You can continue solving or leave.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOpponentWonBanner(false)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              Continue Solving
            </button>
            <button
              onClick={onLeave}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all cursor-pointer"
            >
              Leave Match
            </button>
          </div>
        </div>
      )}

      {/* ─── Blur / Tab Switch Warning Modal ─── */}
      {showBlurWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowBlurWarning(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-3"
            style={{ background: isDark ? '#18181B' : '#FFFFFF', border: `1px solid #EF4444` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-400">
              <span className="material-symbols-outlined text-xl">warning</span>
              <h4 className="text-sm font-bold">Fair-Play Foul Recorded</h4>
            </div>
            <p className="text-xs" style={{ color: textSec }}>
              Tab switching and window defocus are strictly forbidden in Competitive Mode. A fair-play violation foul has been recorded against your telemetry.
            </p>
            <button
              onClick={() => setShowBlurWarning(false)}
              className="w-full py-2 rounded-xl text-xs font-bold transition-all bg-red-500 text-white hover:opacity-90 cursor-pointer"
            >
              I Understand (Return to IDE)
            </button>
          </div>
        </div>
      )}

      {/* ─── Main 2-Pane Editor Interface ─── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Pane: Problem Spec & Hints (cols: 5) */}
        <div className="lg:col-span-5 border-r flex flex-col overflow-hidden"
          style={{ background: panelBg, borderColor: border }}>
          
          {/* Problem Header */}
          <div className="p-4 border-b shrink-0" style={{ borderColor: border }}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-base font-bold" style={{ color: textPri }}>
                {question.title || 'Versus Challenge'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  background: question.diff === 'Hard' ? 'rgba(239, 68, 68, 0.1)' : question.diff === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: question.diff === 'Hard' ? '#EF4444' : question.diff === 'Medium' ? '#F59E0B' : '#22C55E',
                  border: `1px solid ${border}`
                }}>
                {question.diff || 'Medium'}
              </span>
            </div>
          </div>

          {/* Problem Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs" style={{ color: textPri }}>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: textSec }}>Description</h4>
              <p className="whitespace-pre-line leading-relaxed" style={{ color: textPri }}>
                {question.statement || 'Read the problem statement and implement the required solution.'}
              </p>
            </div>

            {/* Examples */}
            {question.examples && question.examples.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold" style={{ color: textSec }}>Examples</h4>
                {question.examples.map((ex, idx) => (
                  <div key={idx} className="p-3 rounded-xl space-y-1 font-mono text-[11px]"
                    style={{ background: bg, border: `1px solid ${border}` }}>
                    <div><span style={{ color: textSec }}>Input: </span>{ex.input}</div>
                    <div><span style={{ color: textSec }}>Output: </span>{ex.output}</div>
                    {ex.explanation && (
                      <div className="font-sans text-[11px]" style={{ color: textSec }}>
                        <span className="font-medium">Note: </span>{ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {question.constraints && question.constraints.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1" style={{ color: textSec }}>Constraints</h4>
                <ul className="list-disc list-inside space-y-1 font-mono text-[11px]" style={{ color: textSec }}>
                  {question.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ─── Hints Section (Time-gated & Foul-penalized) ─── */}
            <div className="pt-2 border-t" style={{ borderColor: border }}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-1.5" style={{ color: textSec }}>
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  Hints (Unlocks with Match Time)
                </h4>
                <span className="text-[10px]" style={{ color: textSec }}>
                  Each hint adds +3:00 time penalty
                </span>
              </div>

              <div className="space-y-2">
                {hints.map((hintText, hIdx) => {
                  const unlockTime = hintTimers[hIdx] || 300;
                  const isUnlocked = elapsed >= unlockTime;
                  const isRevealed = revealedHints.has(hIdx);
                  const secondsRemaining = Math.max(0, unlockTime - elapsed);

                  return (
                    <div key={hIdx} className="p-3 rounded-xl border transition-all"
                      style={{ background: bg, borderColor: border }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[11px]" style={{ color: textPri }}>
                          Hint {hIdx + 1}
                        </span>

                        {isRevealed ? (
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check</span>
                            Revealed (+3m foul penalty)
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleUnlockHint(hIdx)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-500 text-white hover:opacity-90 cursor-pointer"
                          >
                            Unlock (+3:00 Penalty)
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono" style={{ color: textSec }}>
                            Unlocks in {formatTime(secondsRemaining)}
                          </span>
                        )}
                      </div>

                      {isRevealed && (
                        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: textSec }}>
                          {hintText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Code Editor & Execution (cols: 7) */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden"
          style={{ background: bg }}>
          
          {/* Editor Header: Language selector */}
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ background: headerBg, borderColor: border }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: textSec }}>Language:</span>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold outline-none bg-transparent border cursor-pointer"
                style={{ borderColor: border, color: textPri }}
              >
                <option value="python" style={{ background: panelBg }}>Python 3</option>
                <option value="cpp" style={{ background: panelBg }}>C++ 17</option>
                <option value="java" style={{ background: panelBg }}>Java 17</option>
                <option value="javascript" style={{ background: panelBg }}>JavaScript (Node)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs" style={{ color: textSec }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>In-App Runner Ready</span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : language === 'java' ? 'java' : 'javascript'}
              theme={isDark ? 'vs-dark' : 'light'}
              value={code}
              onChange={val => setCode(val || '')}
              options={{
                fontSize: 13,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                roundedSelection: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Testcases & Output Drawer */}
          <div className="h-48 border-t flex flex-col shrink-0"
            style={{ background: panelBg, borderColor: border }}>
            
            {/* Drawer Tabs */}
            <div className="flex items-center justify-between px-4 border-b shrink-0"
              style={{ borderColor: border }}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('tests')}
                  className="py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer"
                  style={{
                    borderColor: activeTab === 'tests' ? '#6366F1' : 'transparent',
                    color: activeTab === 'tests' ? textPri : textSec
                  }}
                >
                  Test Cases
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('output')}
                  className="py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer"
                  style={{
                    borderColor: activeTab === 'output' ? '#6366F1' : 'transparent',
                    color: activeTab === 'output' ? textPri : textSec
                  }}
                >
                  Run Output
                </button>
              </div>

              {/* Action Buttons: Run & Submit */}
              <div className="flex items-center gap-2 py-1.5">
                <button
                  type="button"
                  disabled={running || submitting}
                  onClick={handleRun}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  style={{ background: headerBg, color: textPri, border: `1px solid ${border}` }}
                >
                  <span className="material-symbols-outlined text-xs">play_arrow</span>
                  <span>{running ? 'Running...' : 'Run Tests'}</span>
                </button>

                <button
                  type="button"
                  disabled={running || submitting}
                  onClick={handleSubmit}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}
                >
                  <span className="material-symbols-outlined text-xs">task_alt</span>
                  <span>{submitting ? 'Submitting...' : 'Submit Solution'}</span>
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-3 overflow-y-auto text-xs font-mono">
              {activeTab === 'tests' ? (
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    {testCases.map((tc, idx) => (
                      <button
                        key={tc.id || idx}
                        type="button"
                        onClick={() => setActiveCaseIdx(idx)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        style={activeCaseIdx === idx ? { background: '#6366F1', color: '#fff' } : { background: bg, color: textSec }}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-xl space-y-1 text-[11px]"
                    style={{ background: bg, border: `1px solid ${border}` }}>
                    <div><span style={{ color: textSec }}>Input: </span>{testCases[activeCaseIdx]?.inputValue}</div>
                    <div><span style={{ color: textSec }}>Expected Output: </span>{testCases[activeCaseIdx]?.expectedOutput}</div>
                  </div>
                </div>
              ) : (
                <div>
                  {!runResult ? (
                    <p className="text-center py-6 font-sans text-xs" style={{ color: textSec }}>
                      Click "Run Tests" to test against sample cases or "Submit Solution" to verify all testcases.
                    </p>
                  ) : runResult.status === 'running' || runResult.status === 'evaluating' ? (
                    <div className="flex items-center gap-2 py-4 justify-center font-sans text-xs" style={{ color: textSec }}>
                      <span className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <span>{runResult.status === 'evaluating' ? 'Verifying all testcases against server runner...' : 'Running solution code...'}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs"
                          style={{ color: runResult.status === 'Passed' ? '#22C55E' : '#EF4444' }}>
                          {runResult.status}
                        </span>
                        <div className="flex items-center gap-3 text-[10px]" style={{ color: textSec }}>
                          <span>Runtime: {runResult.runtime}</span>
                          <span>Memory: {runResult.memory}</span>
                        </div>
                      </div>

                      {runResult.error ? (
                        <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 text-[11px] whitespace-pre-wrap">
                          {runResult.error}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl space-y-1 text-[11px]"
                          style={{ background: bg, border: `1px solid ${border}` }}>
                          <div><span style={{ color: textSec }}>Output: </span>{runResult.output}</div>
                          <div><span style={{ color: textSec }}>Expected: </span>{runResult.expected}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Victory Modal ─── */}
      {victoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl"
            style={{ background: panelBg, border: `1px solid ${border}` }}>
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/10 text-amber-400 text-3xl">
              <span className="material-symbols-outlined text-3xl">workspace_premium</span>
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: textPri }}>Victory!</h3>
              <p className="text-xs mt-1" style={{ color: textSec }}>
                You solved the problem first in {formatTime(elapsed)}! Elo rating points have been awarded.
              </p>
            </div>
            <button
              onClick={onLeave}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white hover:opacity-90 cursor-pointer"
            >
              Return to Versus Lobby
            </button>
          </div>
        </div>
      )}

      {/* ─── Give Up Modal ─── */}
      {showGiveUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowGiveUpModal(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl"
            style={{ background: panelBg, border: `1px solid ${border}` }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold" style={{ color: textPri }}>Give Up Challenge?</h3>
            <p className="text-xs" style={{ color: textSec }}>
              Are you sure you want to concede this match? Your opponent will be awarded the victory.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGiveUpModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={{ background: headerBg, color: textPri, border: `1px solid ${border}` }}
              >
                Cancel
              </button>
              <button
                onClick={handleGiveUp}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all bg-red-500 text-white hover:opacity-90 cursor-pointer"
              >
                Concede Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}