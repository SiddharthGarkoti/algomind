import { useState, useRef, useEffect } from 'react';
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
  const { isGuest, user } = useAuth();
  const isPro = user?.plan_tier === 'pro';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('chat'); // 'chat' | 'solve'
  const [selectedBot, setSelectedBot] = useState(isPro ? 'sage' : 'milo'); // 'milo' | 'sage'
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

    setMessages(prev => [...prev, userMsg]);
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

      setMessages(prev => [...prev, {
        from: 'bot',
        botVersion: selectedBot,
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        botVersion: selectedBot,
        text: "I'm having a brief connection pause with the reasoning engine. In the meantime, remember to inspect your boundary conditions and verify the inductive step of your algorithm.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleSelectModel = (modelKey) => {
    if (modelKey === 'sage' && !isPro) {
      // Allow preview with pro info or direct them to plans
      setSelectedBot('sage');
    } else {
      setSelectedBot(modelKey);
    }
    setDropdownOpen(false);
  };

  const textPri = isDark ? '#F8FAFC' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="relative min-h-[calc(100vh-96px)] flex flex-col justify-between max-w-4xl mx-auto w-full px-2 sm:px-4">

        {/* ── Ambient Gemini Purple Light Glow Effect ────────────────────── */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] h-[500px] pointer-events-none rounded-full blur-[140px] opacity-25 dark:opacity-40 -z-10"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #9333EA 0%, #6366F1 40%, rgba(147, 51, 234, 0) 75%)',
          }}
        />

        {/* ── Top Bar in Conversation Mode ───────────────────────────────── */}
        {messages.length > 0 && (
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-2xl border backdrop-blur-xl shrink-0 z-10 mb-3"
            style={{
              background: isDark ? 'rgba(16, 16, 22, 0.7)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Milo on side only */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden p-0.5 border shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: textPri }}>
                  {selectedBot === 'sage' ? 'Sage Milo' : 'Milo'}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: selectedBot === 'sage' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                    color: selectedBot === 'sage' ? '#C084FC' : '#818CF8',
                    border: `1px solid ${selectedBot === 'sage' ? 'rgba(168, 85, 247, 0.35)' : 'rgba(99, 102, 241, 0.25)'}`,
                  }}
                >
                  {selectedBot === 'sage' ? 'Pro Plan' : 'Standard'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-white/10 cursor-pointer"
              style={{ color: textSec }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>New Chat</span>
            </button>
          </div>
        )}

        {/* ── Main Canvas ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto custom-scroll">

          {/* ── Initial Gemini Landing State ──────────────────────────────── */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center my-auto py-10 w-full animate-in fade-in duration-300">
              
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-normal tracking-tight mb-8"
                style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
                Where should we start?
              </h1>

              {/* Center Pill Prompt Capsule */}
              <div className="w-full max-w-2xl relative z-20">
                <div
                  className="rounded-full p-2 pl-3.5 pr-2.5 border flex items-center gap-3 backdrop-blur-xl transition-all duration-300"
                  style={{
                    background: isDark ? 'rgba(22, 22, 30, 0.88)' : '#FFFFFF',
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
                    className="flex-1 bg-transparent outline-none text-sm font-sans placeholder:text-gray-500 min-w-0"
                    style={{ color: textPri }}
                  />

                  {/* 2 Chatbot Versions Dropdown (Milo vs Sage Milo) */}
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(prev => !prev)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:border-purple-400"
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        color: selectedBot === 'sage' ? '#C084FC' : textPri,
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
                            background: selectedBot === 'milo' ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)') : 'transparent',
                          }}
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden p-0.5 border shrink-0 mt-0.5"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', borderColor: 'rgba(255,255,255,0.2)' }}>
                            <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold" style={{ color: textPri }}>Milo</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
                                style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>Standard</span>
                            </div>
                            <p className="text-[10px] mt-0.5" style={{ color: textSec }}>Socratic hints & algorithmic guidance</p>
                          </div>
                        </button>

                        {/* Option 2: Sage Milo (Pro Plan) */}
                        <button
                          type="button"
                          onClick={() => handleSelectModel('sage')}
                          className="w-full flex items-start gap-2.5 p-2.5 rounded-xl transition-all hover:bg-white/[0.06] text-left cursor-pointer mt-1"
                          style={{
                            background: selectedBot === 'sage' ? (isDark ? 'rgba(168,85,247,0.18)' : 'rgba(168,85,247,0.1)') : 'transparent',
                          }}
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden p-0.5 border shrink-0 mt-0.5"
                            style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', borderColor: 'rgba(255,255,255,0.2)' }}>
                            <img src="/milo.png" alt="Sage Milo" className="w-full h-full rounded-full object-cover bg-black" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold" style={{ color: '#C084FC' }}>Sage Milo</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                                style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', color: '#FFFFFF' }}>Pro Plan</span>
                            </div>
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
                        : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
                      color: input.trim() ? '#FFFFFF' : textSec,
                    }}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">
                      {input.trim() ? 'arrow_upward' : 'mic'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mode Toggle Chips (Chat / Solve) */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveMode('chat')}
                  className="px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: activeMode === 'chat'
                      ? (isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(99, 102, 241, 0.15)')
                      : 'transparent',
                    color: activeMode === 'chat' ? '#C084FC' : textSec,
                    border: `1px solid ${activeMode === 'chat' ? 'rgba(168, 85, 247, 0.35)' : 'transparent'}`,
                  }}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('solve')}
                  className="px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: activeMode === 'solve'
                      ? (isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(99, 102, 241, 0.15)')
                      : 'transparent',
                    color: activeMode === 'solve' ? '#C084FC' : textSec,
                    border: `1px solid ${activeMode === 'solve' ? 'rgba(168, 85, 247, 0.35)' : 'transparent'}`,
                  }}
                >
                  Task
                </button>
              </div>

              {/* Focused DSA Suggestions Stack */}
              <div className="w-full max-w-xl mt-8 space-y-1 text-left">
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

            </div>
          ) : (
            /* ── Conversation Messages Thread ── */
            <div className="py-4 space-y-5">
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
                        background: isDark ? 'rgba(20, 20, 28, 0.75)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(168, 85, 247, 0.18)' : 'rgba(0, 0, 0, 0.08)',
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

                    <div className={`flex items-center gap-2 mt-1 px-2 text-[10px] ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
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

              {/* Typing indicator */}
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
                      background: isDark ? 'rgba(20, 20, 28, 0.75)' : '#FFFFFF',
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
                      {selectedBot === 'sage' ? 'Sage Milo' : 'Milo'} is thinking...
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
          <div className="relative pt-2 pb-3 z-20">
            {isGuest && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl backdrop-blur-md z-30 border"
                style={{
                  background: isDark ? 'rgba(10, 10, 14, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: 'rgba(168, 85, 247, 0.3)',
                }}
              >
                <p className="text-xs font-bold" style={{ color: textPri }}>Sign in to continue chatting with Milo</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-lg"
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
                className="flex-1 bg-transparent outline-none text-sm font-sans placeholder:text-gray-500 min-w-0"
                style={{ color: textPri }}
              />

              {/* Model Switcher Pill */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    color: selectedBot === 'sage' ? '#C084FC' : textPri,
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
                        background: selectedBot === 'milo' ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)') : 'transparent',
                      }}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden p-0.5 border shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', borderColor: 'rgba(255,255,255,0.2)' }}>
                        <img src="/milo.png" alt="Milo" className="w-full h-full rounded-full object-cover bg-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: textPri }}>Milo</span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
                            style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>Standard</span>
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: textSec }}>Socratic hints & algorithmic guidance</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectModel('sage')}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl transition-all hover:bg-white/[0.06] text-left cursor-pointer mt-1"
                      style={{
                        background: selectedBot === 'sage' ? (isDark ? 'rgba(168,85,247,0.18)' : 'rgba(168,85,247,0.1)') : 'transparent',
                      }}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden p-0.5 border shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', borderColor: 'rgba(255,255,255,0.2)' }}>
                        <img src="/milo.png" alt="Sage Milo" className="w-full h-full rounded-full object-cover bg-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: '#C084FC' }}>Sage Milo</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                            style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', color: '#FFFFFF' }}>Pro Plan</span>
                        </div>
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
                    : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
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

      <SignInModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </DashboardLayout>
  );
}

export default ChatbotPage;
