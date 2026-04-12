import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import SignInModal from '../../components/login/SignInModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

const SUGGESTIONS = [
  'Explain BFS vs DFS',
  'Help me with dynamic programming',
  'What is topological sort?',
  'How to solve Coin Change?',
];

function ChatbotPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const { isGuest } = useAuth();
  const [messages, setMessages] = useState([
    { from: 'bot', text: "I'm your AI Mentor! I can help explain algorithms, debug your thinking, or suggest problems to practice. What would you like to learn today?", time: 'Just now' },
  ]);
  const [input,        setInput]        = useState('');
  const [sending,      setSending]      = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    if (!text.trim() || sending) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(m => [...m, { from: 'user', text, time: now }]);
    setInput('');
    setSending(true);

    try {
      const data = await api.post('/ai/explain/', { message: text });
      setMessages(m => [...m, {
        from: 'bot',
        text: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(m => [...m, {
        from: 'bot',
        text: 'Sorry, I could not reach the AI service right now. Please check that the backend is running.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setSending(false);
    }
  };

  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto gap-4">

        {/* Header */}
        <div className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h1 className="font-headline font-bold text-base" style={{ color: textPri }}>AI Mentor</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px]" style={{ color: textSec }}>Online — powered by backend AI</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.from === 'bot' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>
                  <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                </div>
              )}
              <div className="max-w-[80%]">
                <div className={`px-4 py-3 text-sm leading-relaxed ${msg.from === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}
                  style={msg.from === 'bot' ? {
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                    border: `1px solid ${border}`,
                    color: textPri,
                  } : {}}>
                  {msg.text.split('**').map((part, j) =>
                    j % 2 === 1
                      ? <strong key={j}>{part}</strong>
                      : <span key={j}>{part}</span>
                  )}
                </div>
                <p className="text-[9px] mt-1 px-1" style={{ color: textSec }}>{msg.time}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator while waiting for backend response */}
          {sending && (
            <div className="flex justify-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>
                <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
              </div>
              <div className="px-4 py-3 rounded-2xl text-sm flex gap-1 items-center"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', border: `1px solid ${border}` }}>
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                    style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEnd} />
        </div>

        {/* Suggestions + Input — locked for guests */}
        <div className="relative">
          {/* Suggestions */}
          <div className="flex gap-2 flex-wrap mb-3">
            {SUGGESTIONS.map(s => (
              <button key={s}
                disabled={sending || isGuest}
                className="px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)' }}
                onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-3 rounded-2xl p-3"
            style={{ background: surface, border: `1px solid ${border}` }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Ask anything about DSA..."
              className="flex-grow bg-transparent outline-none text-sm"
              style={{ color: textPri }}
              disabled={sending || isGuest}
            />
            <button
              onClick={() => send(input)}
              disabled={sending || !input.trim() || isGuest}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-90 active:scale-90 shrink-0 disabled:opacity-40"
              style={{ background: input.trim() && !sending && !isGuest ? '#6366F1' : surfLow }}>
              <span className="material-symbols-outlined text-base" style={{ color: input.trim() && !sending && !isGuest ? '#fff' : textSec }}>send</span>
            </button>
          </div>

          {/* Guest gate overlay */}
          {isGuest && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl backdrop-blur-sm"
              style={{ background: isDark ? 'rgba(27,28,30,0.85)' : 'rgba(255,255,255,0.88)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
                <span className="material-symbols-outlined text-white">lock</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: textPri }}>Sign in to use AI Mentor</p>
                <p className="text-[11px] mt-0.5" style={{ color: textSec }}>Create a free account to chat with your AI tutor</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
                Sign In / Register
              </button>
            </div>
          )}
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
