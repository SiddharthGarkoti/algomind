import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import SignInModal from '../../components/login/SignInModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

const PROMPT_STARTERS = [
  {
    title: 'Dynamic Programming',
    desc: 'Break down optimal substructure & state transitions for 0-1 Knapsack or Coin Change.',
    icon: 'auto_awesome',
    prompt: 'Explain the core intuition behind Dynamic Programming state transitions with a simple example.',
  },
  {
    title: 'Binary Search Invariants',
    desc: 'Master left <= right vs left < right loop conditions to eliminate off-by-one bugs.',
    icon: 'manage_search',
    prompt: 'How do I choose loop invariants (left <= right vs left < right) in Binary Search to prevent off-by-one errors?',
  },
  {
    title: 'Two Pointers vs Sliding Window',
    desc: 'Identify when to use dual pointers versus a contiguous expandable window.',
    icon: 'compare_arrows',
    prompt: 'What heuristics help distinguish between a Two-Pointer approach and a Sliding Window problem?',
  },
  {
    title: 'Debug Logic & Edge Cases',
    desc: 'Diagnose runtime errors, empty input bounds, or infinite recursion in your solution.',
    icon: 'bug_report',
    prompt: 'What are the most frequent edge cases that cause Wrong Answer or Runtime Error in array and graph problems?',
  },
];

// Formats message text into clean markdown-like paragraphs and code blocks
function FormattedMessage({ text, isDark }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by code blocks ```lang ... ```
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
                boxShadow: isDark ? '0 4px 20px -4px rgba(168, 85, 247, 0.15)' : 'none'
              }}
            >
              <div
                className="px-4 py-2 border-b flex items-center justify-between text-[11px] font-sans"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#E2E8F0',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                }}
              >
                <span className="font-semibold text-purple-400 uppercase tracking-wider">{lang}</span>
                <button
                  onClick={() => handleCopy(codeBody.trim(), index)}
                  className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-75"
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

        // Normal text lines with bullet / bold formatting
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} className="h-1" />;

              // Bullet points
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

// Inline formatting: **bold**, `code`
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
  const isPlus = user?.plan_tier === 'plus';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [socraticMode, setSocraticMode] = useState(isPro ? 'pro' : 'standard');
  const messagesEnd = useRef(null);
  const autoSentRef = useRef(false);

  // Capitalized First Name or Engineer
  const displayName = user?.username
    ? user.username.split('_')[0].charAt(0).toUpperCase() + user.username.split('_')[0].slice(1)
    : 'Engineer';

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Handle URL query parameters (?ask= or ?problem=)
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

  // Detect query intent to select optimal backend AI endpoint
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
        mode: socraticMode,
        tier: user?.plan_tier || 'basic'
      });

      const botReply = data.response || data.message ||
        "Focus on how each step maintains the invariant. If we examine the subproblem bounds, what property must hold true for the current state?";

      setMessages(prev => [...prev, {
        from: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: "I'm having a brief connection pause with the reasoning engine. In the meantime, remember to inspect your boundary conditions and verify the inductive step of your algorithm.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setSending(false);
    }
  };

  // Color & Theme definitions
  const bg = isDark ? '#08080C' : '#F8FAFC';
  const textPri = isDark ? '#F8FAFC' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';
  const surface = isDark ? 'rgba(255, 255, 255, 0.035)' : '#FFFFFF';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col justify-between max-w-4xl mx-auto overflow-hidden">
        
        {/* ── Ambient Google Gemini Purple/Indigo Glow Light Effect ────────── */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] sm:w-[850px] h-[400px] pointer-events-none rounded-full blur-[130px] opacity-25 dark:opacity-45 -z-10"
          style={{
            background: 'radial-gradient(circle at 50% 40%, #A855F7 0%, #6366F1 45%, rgba(168, 85, 247, 0) 75%)',
          }}
        />
        <div
          className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[380px] h-[300px] pointer-events-none rounded-full blur-[100px] opacity-15 dark:opacity-30 -z-10"
          style={{
            background: 'radial-gradient(circle, #EC4899 0%, #8B5CF6 55%, transparent 80%)',
          }}
        />

        {/* ── Top Header Bar (Gemini Glass Style) ─────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-3 rounded-2xl border backdrop-blur-xl shrink-0 z-10 mb-4 transition-all"
          style={{
            background: isDark ? 'rgba(20, 20, 28, 0.65)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 0, 0, 0.08)',
            boxShadow: isDark
              ? '0 8px 32px -4px rgba(0, 0, 0, 0.5), 0 0 20px -2px rgba(168, 85, 247, 0.12)'
              : '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="flex items-center gap-3.5">
            {/* Glowing Avatar */}
            <div className="relative">
              <div
                className="w-10 h-10 rounded-2xl overflow-hidden p-0.5 border flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #A855F7, #EC4899)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <img src="/milo.png" alt="MILO" className="w-full h-full rounded-[14px] object-cover bg-black" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-black" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline font-extrabold text-base tracking-tight" style={{ color: textPri }}>
                  MILO Socratic
                </h1>
                <span
                  className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: isPro
                      ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.25))'
                      : 'rgba(99, 102, 241, 0.15)',
                    color: isPro ? '#C084FC' : '#818CF8',
                    border: `1px solid ${isPro ? 'rgba(167, 139, 250, 0.35)' : 'rgba(99, 102, 241, 0.25)'}`
                  }}
                >
                  {isPro ? '2.0 Pro' : isPlus ? '2.0 Plus' : '2.0 Flash'}
                </span>
              </div>
              <p className="text-[11px] font-medium" style={{ color: textSec }}>
                {isPro
                  ? 'Asymptotic invariant reasoning & stress-testing active'
                  : 'Socratic algorithm mentor · Guidance without spoilers'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all hover:bg-white/10"
                style={{ color: textSec }}
                title="Start New Session"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}

            {!isPro && (
              <button
                onClick={() => window.location.href = '/plans'}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px -2px rgba(99, 102, 241, 0.4)'
                }}
              >
                <span className="material-symbols-outlined text-xs">bolt</span>
                <span>Upgrade</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Center Stage Area ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-4 space-y-6 custom-scroll">
          
          {/* Gemini-Style Welcome Hero (when no messages yet) */}
          {messages.length === 0 && (
            <div className="py-6 sm:py-10 space-y-8 animate-in fade-in duration-500">
              
              {/* Iridescent Greeting */}
              <div className="space-y-2">
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-headline bg-gradient-to-r from-blue-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  Hello, {displayName}
                </h2>
                <p className="text-xl sm:text-2xl font-medium tracking-tight" style={{ color: textSec }}>
                  How can MILO guide your algorithmic intuition today?
                </p>
              </div>

              {/* Gemini Starters 4-Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {PROMPT_STARTERS.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => send(card.prompt)}
                    className="p-4 sm:p-5 rounded-2xl text-left border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
                    style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.025)' : '#FFFFFF',
                      borderColor: border,
                      boxShadow: isDark ? '0 4px 20px -2px rgba(0,0,0,0.3)' : '0 4px 16px -4px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Hover Purple Border Glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl border"
                      style={{
                        borderColor: '#A855F7',
                        boxShadow: 'inset 0 0 20px rgba(168, 85, 247, 0.15)'
                      }}
                    />

                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6"
                        style={{
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.18))',
                          color: '#A855F7'
                        }}
                      >
                        <span className="material-symbols-outlined text-lg">{card.icon}</span>
                      </div>
                      <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-purple-400">
                        arrow_forward
                      </span>
                    </div>

                    <h3 className="text-sm font-bold tracking-tight mb-1 relative z-10 group-hover:text-purple-300 transition-colors" style={{ color: textPri }}>
                      {card.title}
                    </h3>
                    <p className="text-xs leading-relaxed relative z-10 line-clamp-2" style={{ color: textSec }}>
                      {card.desc}
                    </p>
                  </button>
                ))}
              </div>

            </div>
          )}

          {/* ── Messages Feed ────────────────────────────────────────────── */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-up duration-300`}
            >
              {/* Bot Avatar with Glow */}
              {msg.from === 'bot' && (
                <div className="w-8 h-8 rounded-xl overflow-hidden p-0.5 border flex items-center justify-center shrink-0 mt-1 shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                    borderColor: 'rgba(255,255,255,0.2)'
                  }}>
                  <img src="/milo.png" alt="MILO" className="w-full h-full rounded-[10px] object-cover bg-black" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] ${msg.from === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`px-5 py-4 text-sm leading-relaxed transition-all ${
                    msg.from === 'user'
                      ? 'rounded-3xl rounded-tr-sm'
                      : 'rounded-3xl rounded-tl-sm border'
                  }`}
                  style={msg.from === 'user' ? {
                    background: 'linear-gradient(135deg, #6366F1, #7C3AED)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.4)'
                  } : {
                    background: isDark ? 'rgba(255, 255, 255, 0.035)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                    color: textPri,
                    boxShadow: isDark ? '0 4px 24px -2px rgba(0, 0, 0, 0.4)' : '0 4px 16px -4px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  {msg.from === 'bot' ? (
                    <FormattedMessage text={msg.text} isDark={isDark} />
                  ) : (
                    <p className="whitespace-pre-line text-left font-normal">{msg.text}</p>
                  )}
                </div>

                {/* Subtext info */}
                <div className={`flex items-center gap-2 mt-1.5 px-2 text-[10px] ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ color: textSec }}>
                  <span>{msg.time}</span>
                  {msg.from === 'bot' && (
                    <>
                      <span>•</span>
                      <span>Socratic Nudge</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Wave Indicator (Gemini Style) */}
          {sending && (
            <div className="flex items-start gap-3.5 animate-in fade-in">
              <div className="w-8 h-8 rounded-xl overflow-hidden p-0.5 border flex items-center justify-center shrink-0 mt-1 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                  borderColor: 'rgba(255,255,255,0.2)'
                }}>
                <img src="/milo.png" alt="MILO" className="w-full h-full rounded-[10px] object-cover bg-black" />
              </div>

              <div
                className="px-5 py-4 rounded-3xl rounded-tl-sm border flex items-center gap-2"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.035)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                  boxShadow: '0 0 20px -2px rgba(168, 85, 247, 0.15)'
                }}
              >
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2, 3].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        background: i % 2 === 0 ? '#818CF8' : '#C084FC',
                        animationDelay: `${i * 0.12}s`
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium ml-2 text-purple-300">
                  MILO is reasoning...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEnd} />
        </div>

        {/* ── Gemini Floating Input Capsule with Purple Halo ─────────────── */}
        <div className="relative pt-4 pb-2 z-20">
          
          {/* Guest Lock Overlay */}
          {isGuest && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl backdrop-blur-md z-30 border"
              style={{
                background: isDark ? 'rgba(10, 10, 14, 0.88)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(168, 85, 247, 0.3)'
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}
              >
                <span className="material-symbols-outlined">lock</span>
              </div>
              <div className="text-center">
                <p className="text-base font-bold" style={{ color: textPri }}>Sign in to converse with MILO</p>
                <p className="text-xs mt-0.5" style={{ color: textSec }}>Join AlgoMind to access Socratic algorithmic guidance</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}
              >
                Sign In / Register Free
              </button>
            </div>
          )}

          {/* Floating Pill Box Container */}
          <div
            className="rounded-3xl p-3 sm:p-4 border transition-all duration-300 relative"
            style={{
              background: isDark ? 'rgba(20, 20, 28, 0.85)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(99, 102, 241, 0.25)',
              boxShadow: isDark
                ? '0 0 35px -5px rgba(168, 85, 247, 0.25), 0 0 70px -15px rgba(99, 102, 241, 0.15)'
                : '0 8px 30px -4px rgba(99, 102, 241, 0.15)'
            }}
          >
            {/* Input Area */}
            <textarea
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask MILO about invariant reasoning, algorithm hints, or code bugs..."
              disabled={sending || isGuest}
              className="w-full bg-transparent outline-none text-sm resize-none font-sans placeholder:text-gray-500 custom-scroll px-1"
              style={{ color: textPri }}
            />

            {/* Bottom Controls inside the capsule */}
            <div className="flex items-center justify-between pt-2 border-t mt-1"
              style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}>
              
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                  style={{
                    background: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                    borderColor: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                    color: '#C084FC'
                  }}>
                  <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                  <span>Socratic Guide</span>
                </span>
                <span className="text-[11px] hidden sm:inline" style={{ color: textSec }}>
                  Press <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10">Enter ↵</kbd> to send
                </span>
              </div>

              <button
                onClick={() => send(input)}
                disabled={sending || !input.trim() || isGuest}
                className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-lg"
                style={{
                  background: input.trim() && !sending && !isGuest
                    ? 'linear-gradient(135deg, #6366F1, #A855F7)'
                    : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
                  color: input.trim() && !sending && !isGuest ? '#FFFFFF' : textSec,
                  boxShadow: input.trim() ? '0 4px 16px rgba(168, 85, 247, 0.4)' : 'none'
                }}
              >
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </div>

          {/* Gemini-Style Footer Disclaimer */}
          <p className="text-center text-[11px] mt-2 font-medium" style={{ color: textSec }}>
            MILO provides Socratic algorithmic intuition. Always verify edge cases and constraints.
          </p>
        </div>

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
