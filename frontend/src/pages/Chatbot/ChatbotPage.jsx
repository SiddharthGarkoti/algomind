import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

const SUGGESTIONS = [
  'Explain BFS vs DFS',
  'Help me with dynamic programming',
  'What is topological sort?',
  'How to solve Coin Change?',
];

const BOT_REPLIES = {
  default: "I'm your AI Mentor! I can help explain algorithms, debug your thinking, or suggest problems to practice. What would you like to learn today?",
  bfs: "**BFS vs DFS**: BFS uses a queue and explores level by level — great for shortest path on unweighted graphs. DFS uses a stack (or recursion) and goes deep first — great for connected components, cycle detection, and topological sort.",
  dp: "**Dynamic Programming** breaks problems into overlapping subproblems and stores results to avoid recomputation. Key patterns: 1) Fibonacci-style (linear DP), 2) Grid DP (2D problems), 3) Knapsack (0/1 or unbounded), 4) LCS/LIS (sequence matching).",
  topo: "**Topological Sort** orders nodes in a DAG so every directed edge goes from earlier to later. Use Kahn's algorithm (BFS with in-degree) or DFS post-order. Used in: build systems, course scheduling, dependency resolution.",
  coin: "**Coin Change** is a classic unbounded knapsack DP. `dp[i] = min coins to make amount i`. dp[0]=0, dp[i] = min(dp[i-coin]+1) for each coin. Time: O(amount × coins).",
};

function ChatbotPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const [messages, setMessages] = useState([
    { from: 'bot', text: BOT_REPLIES.default, time: 'Just now' },
  ]);
  const [input, setInput] = useState('');
  const messagesEnd = useRef(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getReply = (text) => {
    const t = text.toLowerCase();
    if (t.includes('bfs') || t.includes('dfs')) return BOT_REPLIES.bfs;
    if (t.includes('dynamic') || t.includes('dp')) return BOT_REPLIES.dp;
    if (t.includes('topological') || t.includes('topo')) return BOT_REPLIES.topo;
    if (t.includes('coin')) return BOT_REPLIES.coin;
    return "Great question! This feature will be fully powered by AI once the backend is connected. For now, try asking about BFS/DFS, Dynamic Programming, Topological Sort, or Coin Change.";
  };

  const send = (text) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(m => [...m, { from: 'user', text, time: now }]);
    setInput('');
    setTimeout(() => {
      setMessages(m => [...m, { from: 'bot', text: getReply(text), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 600);
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
              <span className="text-[10px]" style={{ color: textSec }}>Online — Backend integration coming soon</span>
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
          <div ref={messagesEnd} />
        </div>

        {/* Suggestions */}
        <div className="flex gap-2 flex-wrap">
          {SUGGESTIONS.map(s => (
            <button key={s}
              className="px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all hover:opacity-80"
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
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Ask anything about DSA..."
            className="flex-grow bg-transparent outline-none text-sm"
            style={{ color: textPri }}
          />
          <button
            onClick={() => send(input)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-90 active:scale-90 shrink-0"
            style={{ background: input.trim() ? '#6366F1' : surfLow }}>
            <span className="material-symbols-outlined text-base" style={{ color: input.trim() ? '#fff' : textSec }}>send</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ChatbotPage;
