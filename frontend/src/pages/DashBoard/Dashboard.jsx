import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar    from '../../components/Sidebar.jsx';
import Header     from '../../components/Header.jsx';
import TaskCard   from '../../components/TaskCard.jsx';
import RightPanel from '../../components/RightPanel.jsx';
import ChatDrawer from '../../components/chat/ChatDrawer.jsx';

const TASKS = [
  { id: 1, title: 'Longest Path in DAG',  difficulty: 'Medium', category: 'Graphs', icon: 'account_tree', iconColor: '#6366F1', diffBg: 'rgba(99,102,241,0.12)', diffColor: '#6366F1' },
  { id: 2, title: 'Word Ladder II',        difficulty: 'Hard',   category: 'Graphs', icon: 'route',        iconColor: '#EF4444', diffBg: 'rgba(239,68,68,0.12)',  diffColor: '#EF4444' },
  { id: 3, title: 'Course Schedule',       difficulty: 'Medium', category: 'Graphs', icon: 'fact_check',   iconColor: '#6366F1', diffBg: 'rgba(99,102,241,0.12)', diffColor: '#6366F1' },
];

const SKILLS = [
  { id: 1, name: 'Graphs',      badge: 'Weak',      badgeColor: '#EF4444', subtitle: 'Lv 1 → 2 · 3 problems left',  barColor: '#EF4444', progress: '25%', locked: false },
  { id: 2, name: 'Dyn. Prog.', badge: 'Improving',  badgeColor: '#6366F1', subtitle: 'Lv 3 → 4 · 8 problems left',  barColor: '#6366F1', progress: '45%', locked: false },
  { id: 3, name: 'Arrays',      badge: 'Strong',     badgeColor: '#22C55E', subtitle: 'Lv 5 → 6 · 15 problems left', barColor: '#22C55E', progress: '92%', locked: false },
  { id: 4, name: 'Adv. Graphs', badge: null,         badgeColor: '',        subtitle: 'Unlock at Graph Level 2',      barColor: '#64748B', progress: '0%',  locked: true  },
];

// Simple per-page chat messages store
const CHAT_STORE = {};

function Dashboard({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const isDark   = theme === 'dark';

  const [chatFriend, setChatFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState({});

  const handleOpenChat = (friend) => {
    setChatFriend(friend);
  };

  const handleSendMessage = (text) => {
    const fid  = chatFriend.id;
    const now  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg  = { from: 'me', text, time: now };
    setChatMessages(prev => ({ ...prev, [fid]: [...(prev[fid] || []), msg] }));
  };

  const bg       = isDark
    ? 'radial-gradient(ellipse at 10% 10%, rgba(99,102,241,0.08) 0%, transparent 40%), #0A0A0B'
    : 'linear-gradient(180deg,#EEF2FF 0%,#F8FAFC 100%)';
  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfaceLo= isDark ? '#1F2022' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.12)' : 'rgba(0,0,0,0.07)';
  const textPri  = isDark ? '#e3e2e5'              : '#0F172A';
  const textSec  = isDark ? '#908fa0'              : '#64748B';

  return (
    <div className="dashboard-layout min-h-screen flex" style={{ background: bg, color: textPri }}>
      <Sidebar isDark={isDark} navigate={navigate} onOpenChat={handleOpenChat} />

      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        <div className="main-container flex flex-col flex-grow">
          <Header theme={theme} toggleTheme={toggleTheme} onOpenChat={handleOpenChat} />

          <main className="w-full px-6 py-5 flex gap-6 flex-grow">

            {/* Left Column */}
            <div className="flex-grow flex flex-col gap-6 min-w-0">

              {/* Priority Action Point — animated banner */}
              <section
                className="insight-banner relative overflow-hidden rounded-2xl p-7 shrink-0"
                style={{
                  background: isDark ? surfaceLo : '#FFFFFF',
                  border: `1px solid ${border}`,
                  boxShadow: isDark ? 'none' : '0 4px 20px -4px rgba(0,0,0,0.06)',
                }}
              >
                <div className="accent-line" />
                {/* Right ambient glow */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-50"
                  style={{ background: 'radial-gradient(circle at 100% 50%, rgba(99,102,241,0.15) 0%, transparent 60%)' }} />

                <div className="relative z-10 pl-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-label uppercase tracking-widest mb-3 px-3 py-1 rounded-full insight-slide"
                    style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1', animationDelay: '0.1s' }}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>bolt</span>
                    Priority Action Point
                  </span>
                  <h1
                    className="font-headline font-bold leading-snug max-w-2xl insight-slide"
                    style={{ fontSize: '1.25rem', color: textPri, animationDelay: '0.2s' }}
                  >
                    Your success rate in{' '}
                    <span className="px-1.5 py-0.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                      Medium Graphs
                    </span>
                    {' '}is{' '}
                    <span style={{ color: '#EF4444', fontWeight: 800 }}>24%</span>
                    {' '}— compared to your{' '}
                    <span style={{ color: '#22C55E', fontWeight: 800 }}>78%</span>
                    {' '}average across all topics.
                  </h1>
                  <div className="flex items-center gap-3 mt-4 insight-slide" style={{ animationDelay: '0.3s' }}>
                    <button
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-95"
                      style={{ background: '#6366F1', color: '#fff' }}
                      onClick={() => navigate('/arena')}
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Practice Graphs Now
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
                      style={{ background: isDark ? '#292a2c' : '#F1F5F9', color: textSec, border: `1px solid ${border}` }}
                      onClick={() => navigate('/analytics')}
                    >
                      View Full Analysis
                    </button>
                  </div>
                </div>
              </section>

              {/* Recommended Tasks */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-base font-headline font-bold" style={{ color: textPri }}>Recommended Tasks</h2>
                    <p className="text-xs font-normal mt-0.5" style={{ color: textSec }}>Focused on your graph algorithm weaknesses</p>
                  </div>
                  <button
                    className="px-5 py-2.5 rounded-xl font-label text-xs font-bold transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-2"
                    style={{ background: '#6366F1', color: '#FFFFFF', boxShadow: '0 8px 20px -6px rgba(99,102,241,0.35)' }}
                    onClick={() => navigate('/plan-view')}
                  >
                    Start Daily Plan
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {TASKS.map((task, i) => (
                    <div key={task.id} className={`task-card-anim stagger-${i + 1}`}>
                      <TaskCard {...task} isDark={isDark} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mastery Overview */}
              <div
                className="p-6 rounded-2xl"
                style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}
              >
                <h3 className="text-xs font-label uppercase tracking-widest mb-6" style={{ color: textSec }}>Mastery Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7 max-w-4xl">
                  {SKILLS.map((skill, i) => (
                    <div key={skill.id} className={`space-y-3 ${skill.locked ? 'opacity-40' : ''} page-enter stagger-${i + 1}`}>
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-sm font-headline font-bold flex items-center gap-2" style={{ color: textPri }}>
                            {skill.name}
                            {skill.locked
                              ? <span className="material-symbols-outlined text-xs">lock</span>
                              : <span className="text-[9px] font-label uppercase" style={{ color: skill.badgeColor }}>({skill.badge})</span>
                            }
                          </span>
                          <p className="text-[10px] mt-0.5" style={{ color: textSec }}>{skill.subtitle}</p>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#292a2c' : '#E2E8F0' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: skill.progress, background: skill.barColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Panel */}
            <RightPanel isDark={isDark} />
          </main>
        </div>
      </div>

      {/* Chat Drawer */}
      {chatFriend && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[299] bg-black/30 backdrop-blur-sm"
            onClick={() => setChatFriend(null)}
          />
          <ChatDrawer
            friend={chatFriend}
            messages={chatMessages[chatFriend.id] || []}
            onSend={handleSendMessage}
            onClose={() => setChatFriend(null)}
            isDark={isDark}
          />
        </>
      )}
    </div>
  );
}

export default Dashboard;
