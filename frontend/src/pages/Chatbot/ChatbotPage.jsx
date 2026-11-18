import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import SignInModal from '../../components/login/SignInModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

// Targeted suggestions based strictly on core algorithmic needs
const SUGGESTIONS = [
  {
    icon: 'menu_book',
    label: 'Explain the intuition behind Two Pointers with examples',
    prompt: 'Could you explain the core intuition behind the Two Pointers pattern and when to use it over brute force?',
  },
  {
    icon: 'schema',
    label: 'Break down Dynamic Programming state transitions step-by-step',
    prompt: 'How do I identify subproblems and define state transitions in Dynamic Programming for optimization problems?',
  },
  {
    icon: 'bug_report',
    label: 'Help me diagnose edge cases and logic bugs in my solution',
    prompt: 'What are the most frequent edge cases (empty bounds, duplicates, overflow) that break competitive programming solutions?',
  },
  {
    icon: 'psychology',
    label: 'How do I choose loop invariants in Binary Search?',
    prompt: 'Explain how to determine binary search boundary conditions (left <= right vs left < right) without getting off-by-one errors.',
  },
];

// Default 5-6 historical algorithmic chat sessions
const DEFAULT_CHAT_HISTORY = [
  {
    id: 'chat-1',
    title: 'Two Pointers intuition & boundary conditions',
    snippet: 'Explaining when to move left vs right pointer and avoiding off-by-one errors in sorted arrays.',
    date: 'Today, 03:15 AM',
    model: 'sage',
    messages: [
      { from: 'user', text: 'Could you explain the core intuition behind the Two Pointers pattern and when to use it over brute force?', time: '03:15 AM' },
      { from: 'bot', botVersion: 'sage', text: 'The Two Pointers pattern works by exploiting monotonicity in sorted arrays or structured sequences. Instead of exploring all O(N^2) pairs, each pointer moves in a single direction, pruning the search space in O(N) time.', time: '03:15 AM' },
    ],
  },
  {
    id: 'chat-2',
    title: 'Dynamic Programming: Knapsack state transitions',
    snippet: 'Deriving recurrence relation for 0/1 Knapsack and optimizing memory to a 1D rolling array.',
    date: 'Yesterday, 11:20 PM',
    model: 'sage',
    messages: [
      { from: 'user', text: 'How do I identify subproblems and define state transitions in Dynamic Programming for optimization problems?', time: '11:20 PM' },
      { from: 'bot', botVersion: 'sage', text: 'Start with the decision tree at step `i`. At each element, what choices do you have? Define `dp[i][w]` as the optimal value considering the first `i` items with remaining capacity `w`. To optimize memory, iterate backwards from capacity `W` down to `weight[i]`.', time: '11:21 PM' },
    ],
  },
  {
    id: 'chat-3',
    title: 'Binary Search loop invariants without off-by-one',
    snippet: 'Boundary condition proofs for left <= right vs left < right in monotonic search spaces.',
    date: 'Yesterday, 04:45 PM',
    model: 'milo',
    messages: [
      { from: 'user', text: 'How do I determine binary search boundary conditions without getting off-by-one errors?', time: '04:45 PM' },
      { from: 'bot', botVersion: 'milo', text: 'Choose your search interval upfront: inclusive `[left, right]` with `while (left <= right)` and `mid - 1` / `mid + 1`, or half-open `[left, right)` with `while (left < right)`. Stick strictly to your chosen invariant.', time: '04:46 PM' },
    ],
  },
  {
    id: 'chat-4',
    title: 'Graph cycle detection: 3-Color DFS vs Union-Find',
    snippet: 'Detecting back-edges in directed graphs vs component cycles in undirected graphs.',
    date: '2 days ago',
    model: 'sage',
    messages: [
      { from: 'user', text: 'What is the most robust way to detect cycles in directed vs undirected graphs?', time: '2 days ago' },
      { from: 'bot', botVersion: 'sage', text: 'For undirected graphs, Union-Find (DSU) or standard DFS with parent checking is ideal. For directed graphs, you must use 3-color DFS (WHITE, GRAY, BLACK) or Kahn’s topological sort to detect back-edges.', time: '2 days ago' },
    ],
  },
  {
    id: 'chat-5',
    title: 'Monotonic Stack for Next Greater Element',
    snippet: 'Maintaining monotonic decreasing order to resolve indices in amortized O(N) time.',
    date: '3 days ago',
    model: 'milo',
    messages: [
      { from: 'user', text: 'Explain how monotonic stack achieves linear time for next greater element.', time: '3 days ago' },
      { from: 'bot', botVersion: 'milo', text: 'Each element enters and leaves the stack at most once. By popping elements smaller than the current number, we immediately resolve their next greater element in amortized O(1) per item.', time: '3 days ago' },
    ],
  },
  {
    id: 'chat-6',
    title: 'Dijkstra vs Bellman-Ford shortest paths',
    snippet: 'Why greedy edge relaxation fails on negative weights and when to use SPFA.',
    date: '5 days ago',
    model: 'sage',
    messages: [
      { from: 'user', text: 'Why does Dijkstra fail on negative edge weights, and when should I switch to Bellman-Ford?', time: '5 days ago' },
      { from: 'bot', botVersion: 'sage', text: 'Dijkstra greedily marks nodes as finalized once popped from the priority queue. A negative edge can retroactively offer a shorter path to a finalized node, violating the greedy invariant. Use Bellman-Ford or SPFA whenever negative weights or negative cycles exist.', time: '5 days ago' },
    ],
  },
];

// Formats message text into clean code blocks and paragraphs
function FormattedMessage({ text, isDark }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[13px] sm:text-sm">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const content = part.slice(3, -3);
          const firstLineBreak = content.indexOf('\n');
          let lang = 'code';
          let codeBody = content;

          if (firstLineBreak !== -1) {
            const firstLine = content.slice(0, firstLineBreak).trim();
            if (firstLine && !firstLine.includes(' ')) {
              lang = firstLine;
              codeBody = content.slice(firstLineBreak + 1);
            }
          }

          return (
            <div
              key={index}
              className="rounded-2xl overflow-hidden my-3 border font-mono text-xs"
              style={{
                background: isDark ? '#0D0D14' : '#F1F5F9',
                borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.08)',
                boxShadow: isDark ? '0 4px 20px -4px rgba(168, 85, 247, 0.15)' : 'none',
              }}
            >
              <div
                className="px-4 py-2 border-b flex items-center justify-between text-[11px] font-sans"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#E2E8F0',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}
              >
                <span className="font-semibold text-purple-400 uppercase tracking-wider">{lang}</span>
                <button
                  onClick={() => handleCopy(codeBody.trim(), index)}
                  className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-75 cursor-pointer"
                  style={{ color: '#818CF8' }}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {copiedIndex === index ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed text-indigo-100">
                <code>{codeBody.trim()}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} className="h-1" />;

              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const bulletText = line.trim().slice(2);
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-purple-400 mt-1 text-xs">•</span>
                    <span>{renderFormattedInline(bulletText)}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{renderFormattedInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderFormattedInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-purple-300 dark:text-purple-200">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-purple-500/15 text-purple-300 border border-purple-500/20"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function ChatbotPage({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { isGuest, user } = useAuth();
  
  // Plus and Pro plans have access to continuing past chat conversations
  const hasProOrPlus = user?.plan_tier === 'pro' || user?.plan_tier === 'plus';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('chat'); // 'chat' | 'history'
  const [selectedBot, setSelectedBot] = useState('milo'); // 'milo' | 'sage'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);

  // Chat history state
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(`algomind_chat_history_${user?.id || 'default'}`);
      return stored ? JSON.parse(stored) : DEFAULT_CHAT_HISTORY;
    } catch {
      return DEFAULT_CHAT_HISTORY;
    }
  });

  const messagesEnd = useRef(null);
  const autoSentRef = useRef(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Handle URL query parameters
  useEffect(() => {
    if (autoSentRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const askParam = params.get('ask');
    const problemParam = params.get('problem');

    if (askParam) {
      autoSentRef.current = true;
      setTimeout(() => send(askParam), 350);
    } else if (problemParam) {
      autoSentRef.current = true;
      const initialPrompt = `I'm practicing "${decodeURIComponent(problemParam)}". Could you explain the core invariant and algorithmic approach without giving away the full code?`;
      setTimeout(() => send(initialPrompt), 350);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const detectEndpoint = (text) => {
    const t = text.toLowerCase();
    if (/\b(hint|stuck|clue|nudge|tip)\b/.test(t)) return '/ai/hint/';
    if (/\b(debug|bug|error|wrong|fix|crash|exception|traceback)\b/.test(t)) return '/ai/debug/';
    return '/ai/explain/';
  };

  const send = async (text) => {
    if (!text.trim() || sending) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { from: 'user', text, time: now };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setSending(true);

    try {
      const endpoint = detectEndpoint(text);
      const data = await api.post(endpoint, {
        message: text,
        mode: selectedBot === 'sage' ? 'pro' : 'standard',
        tier: selectedBot === 'sage' ? 'pro' : (user?.plan_tier || 'basic'),
      });

      const botReply = data.response || data.message ||
        "Focus on how each step maintains the invariant. If we examine the subproblem bounds, what property must hold true for the current state?";

      const botMsg = {
        from: 'bot',
        botVersion: selectedBot,
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMsgs = [...newMsgs, botMsg];
      setMessages(finalMsgs);

      // Auto-save or update to recent chat history
      saveToHistory(text, finalMsgs);
    } catch {
      const fallbackMsg = {
        from: 'bot',
        botVersion: selectedBot,
        text: "I'm having a brief connection pause with the reasoning engine. In the meantime, remember to inspect your boundary conditions and verify the inductive step of your algorithm.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setSending(false);
    }
  };

  const saveToHistory = (firstPrompt, allMsgs) => {
    setChatHistory(prev => {
      const title = firstPrompt.length > 55 ? firstPrompt.slice(0, 52) + '...' : firstPrompt;
      const newSession = {
        id: `chat-${Date.now()}`,
        title,
        snippet: allMsgs[allMsgs.length - 1]?.text?.slice(0, 90) + '...',
        date: 'Just now',
        model: selectedBot,
        messages: allMsgs,
      };
      const updated = [newSession, ...prev.filter(c => c.id !== newSession.id)].slice(0, 8);
      try {
        localStorage.setItem(`algomind_chat_history_${user?.id || 'default'}`, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const handleSelectModel = (modelKey) => {
    setSelectedBot(modelKey);
    setDropdownOpen(false);
  };

  const handleContinueChat = (chat) => {
    if (hasProOrPlus) {
      setMessages(chat.messages || []);
      setSelectedBot(chat.model || 'milo');
    } else {
      setProModalOpen(true);
    }
  };

  const textPri = isDark ? '#F8FAFC' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme} hideHeader={true} noPadding={true}>
      <div className="relative h-screen w-full flex flex-col justify-between overflow-hidden bg-black text-slate-100 font-sans">

        {/* ── Ambient Gemini Purple Glow Light Effect ──────────────────────── */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[550px] pointer-events-none rounded-full blur-[150px] opacity-25 dark:opacity-40 -z-10"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #9333EA 0%, #6366F1 40%, rgba(147, 51, 234, 0) 75%)',
          }}
        />

        {/* ── Top Floating Minimal Header (No cluttered pro plan / sage bar) ─ */}
        <div className="absolute top-4 right-6 z-30 flex items-center gap-2.5">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border transition-all hover:bg-white/10 cursor-pointer shadow-lg"
              style={{
                background: isDark ? 'rgba(20, 20, 28, 0.75)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                color: textPri,
              }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>New Chat</span>
            </button>
          )}
        </div>

        {/* ── Main Canvas (Takes 100% full page like Gemini) ─────────────── */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto custom-scroll w-full max-w-4xl mx-auto px-4 sm:px-6">

          {/* ── Initial Gemini Landing View ───────────────────────────────── */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center my-auto py-8 w-full animate-in fade-in duration-300">
              
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-normal tracking-tight mb-8 text-white">
                Where should we start?
              </h1>

              {/* Center Pill Prompt Capsule */}
              <div className="w-full max-w-2xl relative z-20">
                <div
                  className="rounded-full p-2 pl-3.5 pr-2.5 border flex items-center gap-3 backdrop-blur-xl transition-all duration-300"
                  style={{
                    background: isDark ? 'rgba(22, 22, 30, 0.92)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(99, 102, 241, 0.25)',
                    boxShadow: isDark
                      ? '0 0 35px -5px rgba(147, 51, 234, 0.3), 0 0 70px -15px rgba(99, 102, 241, 0.2)'
                      : '0 8px 30px -4px rgba(99, 102, 241, 0.15)',
                  }}
                >
                  {/* Milo on side only */}
                  <div className="w-8 h-8 rounded-full overflow-hidden p-0.5 border shrink-0 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
                  </div>

                  {/* Input field */}
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder={`Ask ${selectedBot === 'sage' ? 'Sage Milo' : 'Milo'}...`}
                    disabled={sending || isGuest}
                    className="flex-1 bg-transparent outline-none text-sm font-sans placeholder:text-gray-400 min-w-0 text-white"
                  />

                  {/* 2 Chatbot Versions Dropdown (Milo vs Sage Milo) - No Pro Plan badge */}
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(prev => !prev)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:border-purple-400"
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        color: selectedBot === 'sage' ? '#C084FC' : '#E2E8F0',
                      }}
                    >
                      <span>{selectedBot === 'sage' ? 'Sage Milo' : 'Milo'}</span>
                      <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 border shadow-2xl backdrop-blur-xl z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                        style={{
                          background: isDark ? '#141419' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {/* Option 1: Milo */}
                        <button
                          type="button"
                          onClick={() => handleSelectModel('milo')}
                          className="w-full flex items-start gap-2.5 p-2.5 rounded-xl transition-all hover:bg-white/[0.06] text-left cursor-pointer"
                          style={{
                            background: selectedBot === 'milo' ? 'rgba(99,102,241,0.15)' : 'transparent',
                          }}
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden p-0.5 border shrink-0 mt-0.5"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', borderColor: 'rgba(255,255,255,0.2)' }}>
                            <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-white block">Milo</span>
                            <p className="text-[10px] mt-0.5" style={{ color: textSec }}>Fast, socratic algorithmic guidance</p>
                          </div>
                        </button>

                        {/* Option 2: Sage Milo */}
                        <button
                          type="button"
                          onClick={() => handleSelectModel('sage')}
                          className="w-full flex items-start gap-2.5 p-2.5 rounded-xl transition-all hover:bg-white/[0.06] text-left cursor-pointer mt-1"
                          style={{
                            background: selectedBot === 'sage' ? 'rgba(168,85,247,0.18)' : 'transparent',
                          }}
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden p-0.5 border shrink-0 mt-0.5"
                            style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', borderColor: 'rgba(255,255,255,0.2)' }}>
                            <img src="/milo.png" alt="Sage Milo" className="w-full h-full rounded-full object-cover bg-black" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-purple-300 block">Sage Milo</span>
                            <p className="text-[10px] mt-0.5" style={{ color: textSec }}>Deep invariant proofs & stress-testing</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={() => send(input)}
                    disabled={sending || !input.trim() || isGuest}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shrink-0 cursor-pointer shadow-md"
                    style={{
                      background: input.trim() && !sending
                        ? 'linear-gradient(135deg, #6366F1, #A855F7)'
                        : 'rgba(255,255,255,0.08)',
                      color: input.trim() ? '#FFFFFF' : textSec,
                    }}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">
                      {input.trim() ? 'arrow_upward' : 'mic'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mode Toggle Chips (Chat / History) */}
              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setActiveMode('chat')}
                  className="flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: activeMode === 'chat' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                    color: activeMode === 'chat' ? '#C084FC' : textSec,
                    border: `1px solid ${activeMode === 'chat' ? 'rgba(168, 85, 247, 0.35)' : 'transparent'}`,
                  }}
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('history')}
                  className="flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: activeMode === 'history' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                    color: activeMode === 'history' ? '#C084FC' : textSec,
                    border: `1px solid ${activeMode === 'history' ? 'rgba(168, 85, 247, 0.35)' : 'transparent'}`,
                  }}
                >
                  <span className="material-symbols-outlined text-sm">history</span>
                  <span>History</span>
                </button>
              </div>

              {/* ── Chat Mode: Focused DSA Suggestions Stack ─────────────── */}
              {activeMode === 'chat' && (
                <div className="w-full max-w-xl mt-7 space-y-1 text-left animate-in fade-in duration-200">
                  {SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => send(item.prompt)}
                      className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all duration-200 hover:bg-white/[0.04] cursor-pointer text-left group border border-transparent hover:border-purple-500/20"
                      style={{ color: textSec }}
                    >
                      <span className="material-symbols-outlined text-lg group-hover:text-purple-400 transition-colors shrink-0">
                        {item.icon}
                      </span>
                      <span className="text-xs sm:text-sm font-normal group-hover:text-white transition-colors truncate">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── History Mode: 5-6 Last Chats with Option to Continue ─── */}
              {activeMode === 'history' && (
                <div className="w-full max-w-2xl mt-6 space-y-2.5 text-left animate-in fade-in duration-200">
                  <div className="flex items-center justify-between px-2 mb-1">
                    <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Recent Conversations ({chatHistory.slice(0, 6).length})
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {hasProOrPlus ? 'Plus/Pro Plan Active' : 'Resume on Plus & Pro'}
                    </span>
                  </div>

                  {chatHistory.slice(0, 6).map((chat) => (
                    <div
                      key={chat.id}
                      className="p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-purple-500/30"
                      style={{
                        background: 'rgba(255, 255, 255, 0.025)',
                        borderColor: border,
                      }}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                          style={{
                            background: chat.model === 'sage'
                              ? 'linear-gradient(135deg, #A855F7, #EC4899)'
                              : 'linear-gradient(135deg, #6366F1, #818CF8)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          }}
                        >
                          <span className="material-symbols-outlined text-sm text-white">
                            {chat.model === 'sage' ? 'psychology' : 'smart_toy'}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                              {chat.title}
                            </h3>
                            <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                              {chat.date}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {chat.snippet}
                          </p>
                        </div>
                      </div>

                      {/* Continue Option */}
                      <button
                        onClick={() => handleContinueChat(chat)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border"
                        style={{
                          background: hasProOrPlus
                            ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                            : 'rgba(255, 255, 255, 0.05)',
                          borderColor: hasProOrPlus
                            ? 'rgba(168, 85, 247, 0.4)'
                            : 'rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                        }}
                      >
                        {hasProOrPlus ? (
                          <>
                            <span>Continue</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xs text-purple-300">lock</span>
                            <span className="text-zinc-300">Continue (Plus/Pro)</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : (
            /* ── Active Conversation Thread ─────────────────────────────── */
            <div className="py-8 space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3.5 ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-up duration-300`}
                >
                  {/* Milo avatar shown on the side only */}
                  {msg.from === 'bot' && (
                    <div className="w-8 h-8 rounded-full overflow-hidden p-0.5 border flex items-center justify-center shrink-0 mt-1 shadow-md"
                      style={{
                        background: msg.botVersion === 'sage'
                          ? 'linear-gradient(135deg, #A855F7, #EC4899)'
                          : 'linear-gradient(135deg, #6366F1, #A855F7)',
                        borderColor: 'rgba(255,255,255,0.2)',
                      }}>
                      <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[78%] ${msg.from === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`px-5 py-4 text-sm leading-relaxed ${
                        msg.from === 'user'
                          ? 'rounded-3xl rounded-tr-sm text-white'
                          : 'rounded-3xl rounded-tl-sm border'
                      }`}
                      style={msg.from === 'user' ? {
                        background: 'linear-gradient(135deg, #6366F1, #7C3AED)',
                        boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.4)',
                      } : {
                        background: isDark ? 'rgba(20, 20, 28, 0.85)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                        color: textPri,
                        boxShadow: isDark ? '0 4px 24px -2px rgba(0, 0, 0, 0.4)' : '0 4px 16px -4px rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      {msg.from === 'bot' ? (
                        <FormattedMessage text={msg.text} isDark={isDark} />
                      ) : (
                        <p className="whitespace-pre-line text-left font-normal">{msg.text}</p>
                      )}
                    </div>

                    <div className={`flex items-center gap-2 mt-1.5 px-2 text-[10px] ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                      style={{ color: textSec }}>
                      <span>{msg.time}</span>
                      {msg.from === 'bot' && (
                        <>
                          <span>•</span>
                          <span style={{ color: msg.botVersion === 'sage' ? '#C084FC' : '#818CF8' }}>
                            {msg.botVersion === 'sage' ? 'Sage Milo' : 'Milo'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking indicator */}
              {sending && (
                <div className="flex items-start gap-3.5 animate-in fade-in">
                  <div className="w-8 h-8 rounded-full overflow-hidden p-0.5 border flex items-center justify-center shrink-0 mt-1 shadow-md"
                    style={{
                      background: selectedBot === 'sage'
                        ? 'linear-gradient(135deg, #A855F7, #EC4899)'
                        : 'linear-gradient(135deg, #6366F1, #A855F7)',
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}>
                    <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
                  </div>

                  <div
                    className="px-5 py-3.5 rounded-3xl rounded-tl-sm border flex items-center gap-2"
                    style={{
                      background: isDark ? 'rgba(20, 20, 28, 0.85)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                      boxShadow: '0 0 20px -2px rgba(168, 85, 247, 0.15)',
                    }}
                  >
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2, 3].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{
                            background: i % 2 === 0 ? '#818CF8' : '#C084FC',
                            animationDelay: `${i * 0.12}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium ml-1.5 text-purple-300">
                      {selectedBot === 'sage' ? 'Sage Milo' : 'Milo'} is reasoning...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEnd} />
            </div>
          )}

        </div>

        {/* ── Bottom Input Pill (when in active chat mode) ───────────────── */}
        {messages.length > 0 && (
          <div className="relative pt-2 pb-5 z-20 w-full max-w-4xl mx-auto px-4 sm:px-6">
            {isGuest && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl backdrop-blur-md z-30 border"
                style={{
                  background: isDark ? 'rgba(10, 10, 14, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: 'rgba(168, 85, 247, 0.3)',
                }}
              >
                <p className="text-xs font-bold text-white">Sign in to continue chatting with Milo</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}
                >
                  Sign In Free
                </button>
              </div>
            )}

            <div
              className="rounded-full p-2 pl-3.5 pr-2.5 border flex items-center gap-3 backdrop-blur-xl transition-all"
              style={{
                background: isDark ? 'rgba(22, 22, 30, 0.92)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(99, 102, 241, 0.25)',
                boxShadow: isDark
                  ? '0 0 35px -5px rgba(147, 51, 234, 0.25), 0 0 70px -15px rgba(99, 102, 241, 0.15)'
                  : '0 8px 30px -4px rgba(99, 102, 241, 0.15)',
              }}
            >
              {/* Milo on side only */}
              <div className="w-8 h-8 rounded-full overflow-hidden p-0.5 border shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
              </div>

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={`Ask ${selectedBot === 'sage' ? 'Sage Milo' : 'Milo'}...`}
                disabled={sending || isGuest}
                className="flex-1 bg-transparent outline-none text-sm font-sans placeholder:text-gray-400 min-w-0 text-white"
              />

              {/* Model Switcher Pill - No Pro Plan badge */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    color: selectedBot === 'sage' ? '#C084FC' : '#E2E8F0',
                  }}
                >
                  <span>{selectedBot === 'sage' ? 'Sage Milo' : 'Milo'}</span>
                  <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl p-2 border shadow-2xl backdrop-blur-xl z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                    style={{
                      background: isDark ? '#141419' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectModel('milo')}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl transition-all hover:bg-white/[0.06] text-left cursor-pointer"
                      style={{
                        background: selectedBot === 'milo' ? 'rgba(99,102,241,0.15)' : 'transparent',
                      }}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden p-0.5 border shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', borderColor: 'rgba(255,255,255,0.2)' }}>
                        <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block">Milo</span>
                        <p className="text-[10px] mt-0.5" style={{ color: textSec }}>Fast, socratic algorithmic guidance</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectModel('sage')}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl transition-all hover:bg-white/[0.06] text-left cursor-pointer mt-1"
                      style={{
                        background: selectedBot === 'sage' ? 'rgba(168,85,247,0.18)' : 'transparent',
                      }}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden p-0.5 border shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', borderColor: 'rgba(255,255,255,0.2)' }}>
                        <img src="/milo.png" alt="Sage Milo" className="w-full h-full rounded-full object-cover bg-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-purple-300 block">Sage Milo</span>
                        <p className="text-[10px] mt-0.5" style={{ color: textSec }}>Deep invariant proofs & stress-testing</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={() => send(input)}
                disabled={sending || !input.trim() || isGuest}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shrink-0 cursor-pointer shadow-md"
                style={{
                  background: input.trim() && !sending
                    ? 'linear-gradient(135deg, #6366F1, #A855F7)'
                    : 'rgba(255,255,255,0.08)',
                  color: input.trim() ? '#FFFFFF' : textSec,
                }}
              >
                <span className="material-symbols-outlined text-sm font-bold">
                  {input.trim() ? 'arrow_upward' : 'mic'}
                </span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Plus / Pro Plan Upgrade Modal for Continuing Past Chats ───────── */}
      {proModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setProModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 relative border text-center shadow-2xl"
            style={{
              background: '#141419',
              borderColor: 'rgba(168, 85, 247, 0.35)',
              boxShadow: '0 0 50px -10px rgba(147, 51, 234, 0.4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setProModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 border"
              style={{
                background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                borderColor: 'rgba(255, 255, 255, 0.25)',
                boxShadow: '0 0 25px rgba(168, 85, 247, 0.4)',
              }}>
              <span className="material-symbols-outlined text-2xl text-white">lock_open</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1.5">
              Continue Past Conversations
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-5 px-2">
              Resuming past reasoning threads and preserving full context memory across problem sessions is an exclusive feature of <span className="text-purple-300 font-semibold">Plus & Pro plans</span>.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => { setProModalOpen(false); navigate('/plans'); }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg cursor-pointer transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}
              >
                Upgrade to Plus or Pro
              </button>
              <button
                onClick={() => setProModalOpen(false)}
                className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <SignInModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </DashboardLayout>
  );
}

export default ChatbotPage;
