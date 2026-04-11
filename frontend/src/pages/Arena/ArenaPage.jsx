import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Editor from '@monaco-editor/react';

const QUESTIONS = [
  { id: 1, title: 'Two Sum',                     diff: 'Easy',   topic: 'Arrays',   lcId: 'two-sum',                   cfId: null },
  { id: 2, title: 'Longest Substring No Repeat',  diff: 'Medium', topic: 'Strings',  lcId: 'longest-substring-without-repeating-characters', cfId: null },
  { id: 3, title: 'Word Ladder II',               diff: 'Hard',   topic: 'Graphs',   lcId: 'word-ladder-ii',            cfId: null },
  { id: 4, title: 'Coin Change',                  diff: 'Medium', topic: 'DP',       lcId: 'coin-change',               cfId: null },
  { id: 5, title: 'N-Queens',                     diff: 'Hard',   topic: 'Backtrack',lcId: 'n-queens',                  cfId: null },
  { id: 6, title: 'Maximum Flow',                 diff: 'Hard',   topic: 'Graphs',   lcId: null,                        cfId: '1Flow' },
  { id: 7, title: 'Binary Search',                diff: 'Easy',   topic: 'Search',   lcId: 'binary-search',             cfId: null },
  { id: 8, title: 'Merge Sort',                   diff: 'Medium', topic: 'Sorting',  lcId: null,                        cfId: '1Msort' },
];

const TOPICS = ['All', 'Arrays', 'Strings', 'Graphs', 'DP', 'Backtrack', 'Search', 'Sorting'];
const DIFFS  = ['All', 'Easy', 'Medium', 'Hard'];
const DIFF_COLORS = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444' };

const STARTER = `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Your solution here
    
    return 0;
}`;

function ArenaPage({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  const [topicFilter, setTopicFilter] = useState('All');
  const [diffFilter,  setDiffFilter]  = useState('All');
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(null);
  const [showIDE,     setShowIDE]     = useState(false);
  const [code,        setCode]        = useState(STARTER);
  const [output,      setOutput]      = useState('');

  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  const filtered = QUESTIONS.filter(q => {
    const matchTopic = topicFilter === 'All' || q.topic === topicFilter;
    const matchDiff  = diffFilter  === 'All' || q.diff  === diffFilter;
    const matchSearch= q.title.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchDiff && matchSearch;
  });

  const runCode = () => {
    setOutput('// C++ execution requires backend integration.\n// Output will appear here once connected.\n\n// Your code was submitted successfully!');
  };

  if (showIDE && selected) {
    return (
      <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
        <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
          <div className="flex items-center justify-between">
            <div>
              <button onClick={() => setShowIDE(false)} className="text-xs flex items-center gap-1 mb-1 hover:opacity-70 transition-opacity" style={{ color: '#6366F1' }}>
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Arena
              </button>
              <h1 className="text-xl font-headline font-bold" style={{ color: textPri }}>{selected.title}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: `${DIFF_COLORS[selected.diff]}18`, color: DIFF_COLORS[selected.diff] }}>
                {selected.diff}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={runCode}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: '#22C55E', color: '#fff' }}>
                ▶ Run (C++)
              </button>
              {selected.lcId && (
                <a href={`https://leetcode.com/problems/${selected.lcId}`} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                  style={{ background: '#FFA116', color: '#fff' }}>
                  LeetCode ↗
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-4 flex-grow min-h-0">
            {/* Editor */}
            <div className="flex-grow rounded-2xl overflow-hidden code-editor-container" style={{ border: `1px solid ${border}` }}>
              <Editor
                height="100%"
                defaultLanguage="cpp"
                theme={isDark ? 'vs-dark' : 'light'}
                value={code}
                onChange={v => setCode(v || '')}
                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 16 } }}
              />
            </div>
            {/* Output */}
            <div className="w-80 rounded-2xl p-4 flex flex-col" style={{ background: surface, border: `1px solid ${border}` }}>
              <p className="text-[10px] uppercase font-bold mb-3" style={{ color: textSec }}>Output</p>
              <pre className="text-xs font-mono leading-relaxed flex-grow overflow-auto" style={{ color: output ? '#22C55E' : textSec }}>
                {output || 'Run your code to see output...'}
              </pre>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-5xl mx-auto">

        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Arena</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Free-roam problem solving — choose any question</p>
        </div>

        {/* Search + Filters */}
        <div className="rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="relative flex-grow min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSec }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search problems..."
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
                <span className="text-[11px] font-bold w-8 text-center" style={{ color: textSec }}>#{q.id}</span>
                <div>
                  <h3 className="text-sm font-headline font-bold" style={{ color: textPri }}>{q.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: `${DIFF_COLORS[q.diff]}18`, color: DIFF_COLORS[q.diff] }}>
                      {q.diff}
                    </span>
                    <span className="text-[10px]" style={{ color: textSec }}>{q.topic}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90"
                  style={{ background: '#6366F1', color: '#fff' }}
                  onClick={() => { setSelected(q); setCode(STARTER); setOutput(''); setShowIDE(true); }}
                >
                  Solve in IDE (C++)
                </button>
                {q.lcId && (
                  <a href={`https://leetcode.com/problems/${q.lcId}`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                    style={{ background: '#FFA116', color: '#fff' }}>
                    LeetCode ↗
                  </a>
                )}
                {q.cfId && (
                  <a href={`https://codeforces.com/problemset`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                    style={{ background: '#1F8ACB', color: '#fff' }}>
                    CF ↗
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
