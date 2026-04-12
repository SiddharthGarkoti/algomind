/**
 * ChatDrawer.jsx — Slide-in chat panel wired to real backend
 * GET /api/chat/<id>/ on open, POST to send, polls every 10s for new messages.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

const EMOJIS = ['😄','😂','🔥','💡','👍','🎉','🤔','😅','💯','🙏','😎','🤩','👾','🚀','💪','✅'];

function fmt(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatDrawer({ friend, onClose, isDark }) {
  const { user } = useAuth();

  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const pollRef        = useRef(null);

  const surface  = isDark ? '#1F2022' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.2)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  /* Fetch messages from backend */
  const fetchMessages = useCallback(async (silent = false) => {
    if (!friend?.id) return;
    if (!silent) setLoading(true);
    try {
      const data = await api.get(`/chat/${friend.id}/`);
      if (Array.isArray(data)) {
        setMessages(data.map(m => ({
          id:   m.id,
          from: m.sender === user?.id ? 'me' : 'them',
          text: m.text,
          time: fmt(m.created_at),
        })));
      }
    } catch { /* silently ignore polling errors */ }
    finally { if (!silent) setLoading(false); }
  }, [friend?.id, user?.id]);

  /* On open: fetch + start poll */
  useEffect(() => {
    fetchMessages();
    inputRef.current?.focus();
    pollRef.current = setInterval(() => fetchMessages(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  /* Scroll to bottom when messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setShowEmoji(false);

    /* Optimistic */
    const optimistic = { id: `opt-${Date.now()}`, from: 'me', text, time: fmt(new Date()) };
    setMessages(prev => [...prev, optimistic]);
    setSending(true);
    try {
      const saved = await api.post(`/chat/${friend.id}/`, { text });
      /* Replace optimistic with real message */
      setMessages(prev => prev.map(m =>
        m.id === optimistic.id
          ? { id: saved.id, from: 'me', text: saved.text, time: fmt(saved.created_at) }
          : m
      ));
    } catch {
      /* Keep optimistic on failure — message still visible */
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* Derive initials for friend avatar */
  const friendName    = friend?.username ?? friend?.name ?? '??';
  const friendInitial = friendName.slice(0, 2).toUpperCase();
  const COLOURS = ['#6366F1','#A855F7','#22C55E','#F59E0B','#EF4444','#06B6D4'];
  const friendColor = friend?.avatar_color ?? COLOURS[(friend?.id ?? 0) % COLOURS.length];

  return (
    <div
      className="fixed inset-y-0 right-0 z-[300] w-[360px] flex flex-col shadow-2xl chat-drawer"
      style={{ background: surface, borderLeft: `1px solid ${border}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: `1px solid ${border}` }}>
        {friend?.avatar
          ? <img src={friend.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
          : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
              style={{ background: friendColor }}>
              {friendInitial}
            </div>
          )
        }
        <div className="flex-grow">
          <p className="text-sm font-bold" style={{ color: textPri }}>{friendName}</p>
          <p className="text-[10px]" style={{ color: textSec }}>
            {sending ? 'Sending…' : 'Direct message'}
          </p>
        </div>
        <button onClick={onClose}
          className="p-2 rounded-xl hover:opacity-70 transition-opacity"
          style={{ background: surfLow, color: textSec }}>
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-4xl mb-3 float-anim" style={{ color: '#6366F1' }}>chat_bubble</span>
            <p className="text-sm font-semibold" style={{ color: textSec }}>Say hi to {friendName}!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.from === 'me';
            return (
              <div key={msg.id ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isMe && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-1"
                    style={{ background: friendColor }}>
                    {friendInitial}
                  </div>
                )}
                <div className="max-w-[75%]">
                  <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${isMe ? 'chat-bubble-user' : 'chat-bubble-other'}`}
                    style={!isMe ? { background: surfLow, border: `1px solid ${border}`, color: textPri } : {}}>
                    {msg.text}
                  </div>
                  <p className="text-[9px] mt-0.5 px-1" style={{ color: textSec }}>{msg.time}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${border}` }}>
        {showEmoji && (
          <div className="emoji-picker p-3 rounded-2xl mb-3 grid grid-cols-8 gap-1.5"
            style={{ background: surfLow, border: `1px solid ${border}` }}>
            {EMOJIS.map(e => (
              <button key={e} className="text-xl hover:scale-125 transition-transform"
                onClick={() => setInput(p => p + e)}>{e}</button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-grow rounded-2xl flex items-end gap-2 px-4 py-3"
            style={{ background: surfLow, border: `1px solid ${border}` }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              className="flex-grow bg-transparent outline-none text-sm resize-none max-h-24"
              style={{ color: textPri }}
            />
            <button onClick={() => setShowEmoji(p => !p)}
              className="shrink-0 transition-all hover:scale-110"
              style={{ color: showEmoji ? '#6366F1' : textSec }}>
              <span className="material-symbols-outlined text-xl">emoji_emotions</span>
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-50"
            style={{ background: input.trim() ? '#6366F1' : surfLow, color: input.trim() ? '#fff' : textSec }}>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        <p className="text-[9px] mt-2 text-center" style={{ color: textSec }}>
          📎 Image & audio sharing — <span style={{ color: '#F59E0B' }}>AlgoMind Plus</span>
        </p>
      </div>
    </div>
  );
}

export default ChatDrawer;
