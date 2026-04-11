import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

const PLAN_PROBLEMS = [
  { day: 1, title: 'Two Sum',                  diff: 'Easy',   topic: 'Arrays',  lcId: 'two-sum',                  cfId: null,    done: true  },
  { day: 2, title: 'Kadane\'s Algorithm',       diff: 'Medium', topic: 'Arrays',  lcId: 'maximum-subarray',          cfId: null,    done: true  },
  { day: 3, title: 'Longest Path in DAG',       diff: 'Medium', topic: 'Graphs',  lcId: null,                        cfId: '1553F', done: false },
  { day: 4, title: 'Word Ladder II',            diff: 'Hard',   topic: 'Graphs',  lcId: 'word-ladder-ii',            cfId: null,    done: false },
  { day: 5, title: 'Coin Change',               diff: 'Medium', topic: 'DP',      lcId: 'coin-change',               cfId: null,    done: false },
  { day: 6, title: 'Longest Common Subsequence',diff: 'Medium', topic: 'DP',      lcId: 'longest-common-subsequence',cfId: null,    done: false },
  { day: 7, title: 'N-Queens',                  diff: 'Hard',   topic: 'Backtrack',lcId: 'n-queens',                 cfId: null,    done: false },
];

const DIFF_COLORS = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444' };

function PlanViewPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const [platform, setPlatform] = useState('lc');
  const [done, setDone] = useState(PLAN_PROBLEMS.map(p => p.done));

  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  const today   = 3; // current day (1-indexed)
  const progress = (done.filter(Boolean).length / PLAN_PROBLEMS.length) * 100;

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Your Plan</h1>
            <p className="text-sm mt-1" style={{ color: textSec }}>Follow the prescribed order for best results</p>
          </div>
          {/* Platform switcher */}
          <div className="flex p-1 rounded-xl" style={{ background: surfLow, border: `1px solid ${border}` }}>
            {['lc','cf'].map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
                style={platform === p
                  ? { background: '#6366F1', color: '#fff', boxShadow: '0 4px 12px -2px rgba(99,102,241,0.4)' }
                  : { color: textSec }}>
                {p === 'lc' ? 'LeetCode' : 'Codeforces'}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex justify-between text-xs mb-2">
            <span style={{ color: textSec }}>Overall Progress</span>
            <span style={{ color: '#6366F1', fontWeight: 700 }}>{done.filter(Boolean).length}/{PLAN_PROBLEMS.length} complete</span>
          </div>
          <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: surfLow }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366F1, #A855F7)' }} />
          </div>
        </div>

        {/* Problem List — fixed order */}
        <div className="space-y-3">
          {PLAN_PROBLEMS.map((prob, i) => {
            const isToday  = (i + 1) === today;
            const isPast   = done[i];
            const isLocked = (i + 1) > today && !done.slice(0, i).every(Boolean);
            const lcUrl    = `https://leetcode.com/problems/${prob.lcId}`;
            const cfUrl    = `https://codeforces.com/problemset/problem/${prob.cfId}`;

            return (
              <div key={prob.day}
                className={`rounded-2xl p-5 transition-all ${isToday ? 'ring-2 ring-purple-500/40' : ''} ${isLocked ? 'opacity-40 pointer-events-none' : 'hover:scale-[1.005]'}`}
                style={{ background: isPast ? (isDark ? 'rgba(34,197,94,0.06)' : '#F0FFF4') : surface, border: `1px solid ${isPast ? 'rgba(34,197,94,0.2)' : border}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-extrabold"
                      style={{ background: isToday ? '#6366F1' : (isPast ? 'rgba(34,197,94,0.15)' : surfLow), color: isToday ? '#fff' : (isPast ? '#22C55E' : textSec) }}>
                      {isPast ? '✓' : `D${prob.day}`}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {isToday && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>Today</span>}
                        <h3 className="text-sm font-headline font-bold" style={{ color: textPri }}>{prob.title}</h3>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: `${DIFF_COLORS[prob.diff]}18`, color: DIFF_COLORS[prob.diff] }}>
                          {prob.diff}
                        </span>
                        <span className="text-[10px]" style={{ color: textSec }}>{prob.topic}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isLocked && (
                      <>
                        {prob.lcId && platform === 'lc' && (
                          <a href={lcUrl} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                            style={{ background: '#FFA116', color: '#fff' }}>
                            LeetCode ↗
                          </a>
                        )}
                        {prob.cfId && platform === 'cf' && (
                          <a href={cfUrl} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                            style={{ background: '#1F8ACB', color: '#fff' }}>
                            Codeforces ↗
                          </a>
                        )}
                        {!isPast && (
                          <button
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90"
                            style={{ background: '#6366F1', color: '#fff' }}
                            onClick={() => setDone(d => d.map((v, j) => j === i ? true : v))}
                          >
                            Mark Done
                          </button>
                        )}
                      </>
                    )}
                    {isLocked && <span className="material-symbols-outlined text-base" style={{ color: textSec }}>lock</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PlanViewPage;
