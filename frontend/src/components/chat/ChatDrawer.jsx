/**
 * ChatDrawer.jsx — Slide-in chat panel
 * Supports emojis, text messages. Image/audio gated to paid plan.
 */
import { useState, useRef, useEffect } from 'react';

const EMOJIS = ['😄','😂','🔥','💡','👍','🎉','🤔','😅','💯','🙏','😎','🤩','👾','🚀','💪','✅'];

function ChatDrawer({ friend, messages, onSend, onClose, isDark }) {
  const [input,       setInput]      = useState('');
  const [showEmoji,   setShowEmoji]  = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const surface  = isDark ? '#1F2022' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.2)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
    setShowEmoji(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-[300] w-[360px] flex flex-col shadow-2xl chat-drawer"
      style={{ background: surface, borderLeft: `1px solid ${border}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: `1px solid ${border}` }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{ background: friend.color }}>
          {friend.avatar}
        </div>
        <div className="flex-grow">
          <p className="text-sm font-bold" style={{ color: textPri }}>{friend.name}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: friend.online ? '#22C55E' : '#64748B' }} />
            <p className="text-[10px]" style={{ color: textSec }}>{friend.online ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="p-2 rounded-xl hover:opacity-70 transition-opacity"
          style={{ background: surfLow, color: textSec }}>
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-4xl mb-3 float-anim" style={{ color: '#6366F1' }}>chat_bubble</span>
            <p className="text-sm font-semibold" style={{ color: textSec }}>Say hi to {friend.name}!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.from === 'me';
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
              {!isMe && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-1"
                  style={{ background: friend.color }}>
                  {friend.avatar}
                </div>
              )}
              <div className={`max-w-[75%]`}>
                <div
                  className={`px-3.5 py-2.5 text-sm leading-relaxed ${isMe ? 'chat-bubble-user' : 'chat-bubble-other'}`}
                  style={!isMe ? { background: surfLow, border: `1px solid ${border}`, color: textPri } : {}}
                >
                  {msg.text}
                </div>
                <p className="text-[9px] mt-0.5 px-1" style={{ color: textSec }}>
                  {msg.time}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${border}` }}>
        {/* Emoji picker */}
        {showEmoji && (
          <div
            className="emoji-picker p-3 rounded-2xl mb-3 grid grid-cols-8 gap-1.5"
            style={{ background: surfLow, border: `1px solid ${border}` }}
          >
            {EMOJIS.map(e => (
              <button key={e}
                className="text-xl hover:scale-125 transition-transform"
                onClick={() => setInput(p => p + e)}>
                {e}
              </button>
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
            <button
              onClick={() => setShowEmoji(p => !p)}
              className="shrink-0 transition-all hover:scale-110"
              style={{ color: showEmoji ? '#6366F1' : textSec }}>
              <span className="material-symbols-outlined text-xl">emoji_emotions</span>
            </button>
          </div>
          <button
            onClick={handleSend}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{ background: input.trim() ? '#6366F1' : surfLow, color: input.trim() ? '#fff' : textSec }}>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        {/* Paid feature note */}
        <p className="text-[9px] mt-2 text-center" style={{ color: textSec }}>
          📎 Image & audio sharing — <span style={{ color: '#F59E0B' }}>AlgoMind Plus</span>
        </p>
      </div>
    </div>
  );
}

export default ChatDrawer;
