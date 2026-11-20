import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import ArenaIDE from '../../components/IDE/ArenaIDE.jsx';
import { ARENA_QUESTIONS } from '../../data/arenaQuestions.js';

const TOPICS = ['All', 'Arrays', 'Strings', 'Stack', 'Linked List', 'DP', 'Binary Search', 'SQL', 'LLD'];
const DIFFS  = ['All', 'Easy', 'Medium', 'Hard'];
const DIFF_COLORS = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444' };

function ArenaPage({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  const { isAuthenticated } = useAuth();
  const [topicFilter, setTopicFilter] = useState('All');
  const [diffFilter,  setDiffFilter]  = useState('All');
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(() => {
    const savedId = sessionStorage.getItem('algomind_arena_selected_id');
    if (savedId) {
      const q = ARENA_QUESTIONS.find(item => String(item.id) === String(savedId));
      if (q) return q;
    }
    return ARENA_QUESTIONS[0];
  });
  const [showIDE,     setShowIDE]     = useState(() => {
    return sessionStorage.getItem('algomind_arena_show_ide') === 'true';
  });
  const [solvedSlugs, setSolvedSlugs] = useState(new Set());

  const handleSetShowIDE = (val) => {
    setShowIDE(val);
    sessionStorage.setItem('algomind_arena_show_ide', val ? 'true' : 'false');
  };

  const handleSetSelected = (q) => {
    setSelected(q);
    if (q?.id) sessionStorage.setItem('algomind_arena_selected_id', String(q.id));
  };

  // Fetch verified solved statuses
  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all(
      ARENA_QUESTIONS.map(q =>
        api.post('/analytics/verify-solved/', {
          platform: 'leetcode',
          slug: q.slug,
          difficulty: q.difficulty?.toLowerCase?.() || 'easy',
        })
          .then(r => r.verified ? q.slug : null)
          .catch(() => null)
      )
    ).then(results => {
      setSolvedSlugs(new Set(results.filter(Boolean)));
    });
  }, [isAuthenticated]);

  const surface  = isDark ? '#14141A' : '#FFFFFF';
  const surfLow  = isDark ? '#1C1C24' : '#F8FAFC';
  const border   = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#F8FAFC' : '#0F172A';
  const textSec  = isDark ? '#94A3B8' : '#64748B';

  const filtered = ARENA_QUESTIONS.filter(q => {
    const matchTopic = topicFilter === 'All' || q.topic === topicFilter;
    const matchDiff  = diffFilter  === 'All' || q.diff  === diffFilter;
    const matchSearch= q.title.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchDiff && matchSearch;
  });

  if (showIDE && selected) {
    return (
      <ArenaIDE 
        key={selected.id} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        selected={selected}
        setSelected={handleSetSelected}
        setShowIDE={handleSetShowIDE} 
      />
    );
  }

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-5xl mx-auto">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Arena IDE</h1>
            <p className="text-sm mt-1" style={{ color: textSec }}>Interactive coding workspace with Socratic AI guidance</p>
          </div>
          <button
            onClick={() => { handleSetSelected(ARENA_QUESTIONS[0]); handleSetShowIDE(true); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#FFFFFF'
            }}
          >
            <span className="material-symbols-outlined text-sm">code</span>
            <span>Open IDE (Majority Element)</span>
          </button>
        </div>

        {/* Search + Filters */}
        <div className="rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="relative flex-grow min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSec }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search arena problems..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setTopicFilter(t)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={topicFilter === t ? { background: '#6366F1', color: '#fff' } : { background: surfLow, color: textSec, border: `1px solid ${border}` }}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {DIFFS.map(d => (
              <button key={d} onClick={() => setDiffFilter(d)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={diffFilter === d ? { background: DIFF_COLORS[d] || '#6366F1', color: '#fff' } : { background: surfLow, color: textSec, border: `1px solid ${border}` }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className="rounded-2xl p-5 flex items-center justify-between transition-all hover:scale-[1.005] card-3d"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold w-8 text-center" style={{ color: textSec }}>#{q.number}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-headline font-bold" style={{ color: textPri }}>{q.title}</h3>
                    {solvedSlugs.has(q.slug) && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                        ✓ Solved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: `${DIFF_COLORS[q.diff]}18`, color: DIFF_COLORS[q.diff] }}>
                      {q.diff}
                    </span>
                    <span className="text-[10px]" style={{ color: textSec }}>{q.topic}</span>
                    <span className="text-[10px] text-gray-500">•</span>
                    <span className="text-[10px]" style={{ color: textSec }}>{q.companies?.slice(0, 3).join(', ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-1.5"
                  style={{ background: '#6366F1', color: '#fff' }}
                  onClick={() => { handleSetSelected(q); handleSetShowIDE(true); }}
                >
                  <span className="material-symbols-outlined text-xs">code</span>
                  <span>Solve in IDE</span>
                </button>
                {q.slug && (
                  <a href={`https://leetcode.com/problems/${q.slug}`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 flex items-center gap-1"
                    style={{ background: 'rgba(255, 161, 22, 0.15)', color: '#FFA116', border: '1px solid rgba(255, 161, 22, 0.3)' }}>
                    <span>LC</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: textSec }}>
              <span className="material-symbols-outlined text-5xl mb-3 block">search_off</span>
              <p>No problems found. Try different filters.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ArenaPage;
