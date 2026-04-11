import { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

/* ── Platform data — #6366F1 only ── */
const PLATFORM_DATA = {
  total: {
    label:  'Total',
    solved: 134,
    easy:   { solved: 112, total: 935  },
    medium: { solved: 22,  total: 2037 },
    hard:   { solved: 0,   total: 921  },
    url:    null,
    color:  '#6366F1',
  },
  leetcode: {
    label:  'LeetCode',
    solved: 80,
    easy:   { solved: 50,  total: 800  },
    medium: { solved: 25,  total: 1800 },
    hard:   { solved: 5,   total: 600  },
    url:    'https://leetcode.com',
    color:  '#6366F1',
  },
  codeforces: {
    label:  'Codeforces',
    solved: 54,
    easy:   { solved: 32,  total: 135  },
    medium: { solved: 20,  total: 337  },
    hard:   { solved: 2,   total: 221  },
    url:    'https://codeforces.com',
    color:  '#6366F1',
  },
};

/* ── Achievement badges ── */
const ACHIEVEMENTS = [
  { id: 'contest_1', icon: '🏆', label: 'Contest Victor', desc: 'Complete a weekly contest',  earned: true,  date: 'Jan 2026' },
  { id: 'mock_1',    icon: '📋', label: 'Mock Master',    desc: 'Complete 5 mock tests',       earned: true,  date: 'Feb 2026' },
  { id: 'algo_1',    icon: '🧠', label: 'Algo Unlocked',  desc: 'Mastered a new algorithm',   earned: true,  date: 'Mar 2026' },
  { id: 'contest_2', icon: '⚡', label: 'Speed Racer',    desc: 'Finish contest top 25%',      earned: false },
  { id: 'mock_2',    icon: '🎯', label: 'Perfect Score',  desc: '100% on a mock test',         earned: false },
  { id: 'algo_2',    icon: '🌐', label: 'Graph Guru',     desc: 'Master graph algorithms',     earned: false },
];

/* ── Topic progress + before/after strengths (merged) ── */
const TOPIC_DATA = [
  { name: 'Arrays',      solved: 92, total: 120, color: '#6366F1', before: 52, after: 88, isStrength: true  },
  { name: 'Trees',       solved: 60, total: 80,  color: '#6366F1', before: 40, after: 78, isStrength: true  },
  { name: 'Strings',     solved: 55, total: 70,  color: '#6366F1', before: 35, after: 70, isStrength: true  },
  { name: 'DP',          solved: 45, total: 100, color: '#6366F1', isStrength: false },
  { name: 'Graphs',      solved: 28, total: 90,  color: '#6366F1', isStrength: false },
  { name: 'Greedy',      solved: 35, total: 60,  color: '#6366F1', isStrength: false },
  { name: 'Backtrack',   solved: 20, total: 50,  color: '#6366F1', isStrength: false },
  { name: 'Bit Manip',   solved: 18, total: 40,  color: '#6366F1', isStrength: false },
];

/* ── Recent activity ── */
const RECENT = [
  { title: 'Longest Path in DAG', diff: 'Medium', time: '2h ago',    status: 'Solved',    color: '#22C55E' },
  { title: 'Word Ladder II',      diff: 'Hard',   time: '5h ago',    status: 'Attempted', color: '#F59E0B' },
  { title: 'Coin Change',         diff: 'Medium', time: 'Yesterday', status: 'Solved',    color: '#22C55E' },
  { title: 'N-Queens',            diff: 'Hard',   time: '2 days',    status: 'Solved',    color: '#22C55E' },
];

/* ── Generate heatmap data: 52 weeks × 7 days ── */
function generateHeatmap() {
  const cells = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 363); // 52 weeks back
  // align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  for (let w = 0; w < 53; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      // Fake activity: past days only, random sparse data
      const isPast = date <= today;
      let count = 0;
      if (isPast) {
        const r = Math.random();
        if (r > 0.55) count = 0;
        else if (r > 0.3) count = 1 + Math.floor(Math.random() * 2);
        else if (r > 0.15) count = 3 + Math.floor(Math.random() * 3);
        else count = 6 + Math.floor(Math.random() * 5);
      }
      cells.push({ date, count, week: w, day: d });
    }
  }
  return cells;
}

/* ── Donut SVG ── */
function SolvedDonut({ pd, surfLow, textPri, textSec }) {
  const R    = 40;
  const circ = 2 * Math.PI * R;

  const totalAll    = pd.easy.total + pd.medium.total + pd.hard.total;
  const totalSolved = pd.easy.solved + pd.medium.solved + pd.hard.solved;
  const filled      = totalAll > 0 ? (totalSolved / totalAll) * circ : 0;

  const easyLen = totalSolved > 0 ? (pd.easy.solved   / totalSolved) * filled : 0;
  const medLen  = totalSolved > 0 ? (pd.medium.solved / totalSolved) * filled : 0;
  const hardLen = totalSolved > 0 ? (pd.hard.solved   / totalSolved) * filled : 0;

  return (
    <div className="relative shrink-0 w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke={surfLow} strokeWidth="10" />
        {easyLen > 0 && (
          <circle cx="50" cy="50" r={R} fill="none" stroke="#22C55E" strokeWidth="10"
            strokeDasharray={`${easyLen} ${circ}`} strokeLinecap="round" />
        )}
        {medLen > 0 && (
          <circle cx="50" cy="50" r={R} fill="none" stroke="#F59E0B" strokeWidth="10"
            strokeDasharray={`${medLen} ${circ}`} strokeDashoffset={`-${easyLen}`} strokeLinecap="round" />
        )}
        {hardLen > 0 && (
          <circle cx="50" cy="50" r={R} fill="none" stroke="#EF4444" strokeWidth="10"
            strokeDasharray={`${hardLen} ${circ}`} strokeDashoffset={`-${easyLen + medLen}`} strokeLinecap="round" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-headline font-extrabold" style={{ color: textPri }}>{totalSolved}</span>
        <span className="text-[10px]" style={{ color: textSec }}>solved</span>
      </div>
    </div>
  );
}

/* ── Activity Heatmap ── */
function ActivityHeatmap({ isDark, surface, border, textSec }) {
  const cells = useMemo(() => generateHeatmap(), []);
  const surfLow = isDark ? '#292a2c' : '#F1F5F9';

  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_LABELS   = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  function cellColor(count) {
    if (count === 0) return surfLow;
    if (count <= 2)  return isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)';
    if (count <= 4)  return isDark ? 'rgba(99,102,241,0.5)'  : 'rgba(99,102,241,0.45)';
    if (count <= 6)  return isDark ? 'rgba(99,102,241,0.75)' : 'rgba(99,102,241,0.7)';
    return '#6366F1';
  }

  // Build month label positions (by week index when month changes)
  const monthPositions = [];
  let lastMonth = -1;
  for (let w = 0; w < 53; w++) {
    const cell = cells[w * 7]; // first day of this week
    if (cell) {
      const m = cell.date.getMonth();
      if (m !== lastMonth) {
        monthPositions.push({ week: w, label: MONTH_LABELS[m] });
        lastMonth = m;
      }
    }
  }

  // Group cells by week
  const weeks = Array.from({ length: 53 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-headline font-bold" style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
          Daily Activity
        </h2>
        <span className="text-[10px]" style={{ color: textSec }}>Past year</span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: '660px' }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
            {monthPositions.map(({ week, label }) => (
              <div
                key={`${week}-${label}`}
                className="text-[9px] font-bold"
                style={{ color: textSec, position: 'absolute', marginLeft: `${28 + week * 13}px` }}
              >
                {label}
              </div>
            ))}
            <div style={{ height: '14px' }} />
          </div>

          <div className="flex gap-0.5" style={{ marginTop: '14px' }}>
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="text-[9px] leading-none flex items-center" style={{ height: '11px', color: textSec, width: '20px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-0.5">
                {week.map((cell, d) => (
                  <div
                    key={d}
                    title={`${cell.date.toDateString()}: ${cell.count} problems`}
                    style={{
                      width: '11px',
                      height: '11px',
                      borderRadius: '2px',
                      background: cellColor(cell.count),
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[9px]" style={{ color: textSec }}>Less</span>
            {[0, 2, 4, 6, 8].map(v => (
              <div
                key={v}
                style={{ width: '10px', height: '10px', borderRadius: '2px', background: cellColor(v) }}
              />
            ))}
            <span className="text-[9px]" style={{ color: textSec }}>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */

function AnalyticsPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#292a2c' : '#F8FAFC';
  const border  = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  const [solvedTab, setSolvedTab] = useState('total');
  const pd = PLATFORM_DATA[solvedTab];

  const earnedCount = ACHIEVEMENTS.filter(a => a.earned).length;
  const top3 = TOPIC_DATA.filter(t => t.isStrength);

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Page header */}
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Your detailed performance breakdown</p>
        </div>

        {/* ── Row 1: Problems Solved + Achievements ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Problems Solved */}
          <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-headline font-bold" style={{ color: textPri }}>Problems Solved</h2>
              <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: surfLow, border: `1px solid ${border}` }}>
                {[
                  { key: 'total',      label: 'Total'    },
                  { key: 'leetcode',   label: 'LeetCode' },
                  { key: 'codeforces', label: 'CF'       },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSolvedTab(key)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={solvedTab === key
                      ? { background: PLATFORM_DATA[key].color, color: '#fff' }
                      : { color: textSec }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <SolvedDonut pd={pd} surfLow={surfLow} textPri={textPri} textSec={textSec} />
              <div className="flex-grow space-y-3">
                {[
                  { label: 'Easy',   data: pd.easy,   color: '#22C55E' },
                  { label: 'Medium', data: pd.medium, color: '#F59E0B' },
                  { label: 'Hard',   data: pd.hard,   color: '#EF4444' },
                ].map(({ label, data, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color, fontWeight: 700 }}>{label}</span>
                      <span style={{ color: textSec }}>
                        {data.solved}<span style={{ opacity: 0.6 }}>/{data.total}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: surfLow }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((data.solved / data.total) * 100)}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
                {pd.url && (
                  <a
                    href={pd.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-75 mt-1"
                    style={{ background: `${pd.color}18`, color: pd.color }}
                  >
                    View on {pd.label}
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
                  </a>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 flex items-center gap-4 flex-wrap" style={{ borderTop: `1px solid ${border}` }}>
              <div className="flex items-center gap-1.5">
                <span>🔥</span>
                <span className="text-xs font-bold" style={{ color: textPri }}>14d streak</span>
              </div>
              <div className="h-3 w-px" style={{ background: border }} />
              <span className="text-xs" style={{ color: textSec }}>95 active days</span>
              <div className="h-3 w-px" style={{ background: border }} />
              <span className="text-xs" style={{ color: textSec }}>Max: 69d</span>
            </div>
          </div>

          {/* Achievements */}
          <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-headline font-bold" style={{ color: textPri }}>Achievements</h2>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}
              >
                {earnedCount}/{ACHIEVEMENTS.length} earned
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {ACHIEVEMENTS.map((ach) => (
                <div
                  key={ach.id}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all"
                  style={{
                    background: ach.earned ? (isDark ? 'rgba(99,102,241,0.08)' : '#EEF2FF') : surfLow,
                    border: `1px solid ${ach.earned ? 'rgba(99,102,241,0.2)' : border}`,
                    opacity: ach.earned ? 1 : 0.45,
                  }}
                >
                  <span className={`text-2xl ${ach.earned ? 'badge-pop' : 'grayscale'}`}>{ach.icon}</span>
                  <span className="text-[9px] font-bold leading-tight" style={{ color: ach.earned ? textPri : textSec }}>
                    {ach.label}
                  </span>
                  <span className="text-[8px] leading-tight text-center" style={{ color: textSec }}>{ach.desc}</span>
                  {ach.earned && ach.date
                    ? <span className="text-[8px] font-bold" style={{ color: '#6366F1' }}>{ach.date}</span>
                    : <span className="material-symbols-outlined" style={{ fontSize: '12px', color: textSec }}>lock</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Activity Heatmap ── */}
        <ActivityHeatmap isDark={isDark} surface={surface} border={border} textSec={textSec} />

        {/* ── Row 3: Topic Progress + Top 3 Strengths (merged) ── */}
        <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left: All topic bars */}
            <div>
              <h2 className="text-sm font-headline font-bold mb-5" style={{ color: textPri }}>Topic-wise Progress</h2>
              <div className="space-y-3.5">
                {TOPIC_DATA.map(({ name, solved, total, color }) => {
                  const pct = Math.round((solved / total) * 100);
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: textPri, fontWeight: 600 }}>{name}</span>
                        <span style={{ color: textSec }}>
                          {solved}/{total}
                          <span style={{ opacity: 0.55 }}> ({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: surfLow }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block absolute" style={{ left: '50%', top: 0, bottom: 0, width: '1px' }} />

            {/* Right: Top 3 Strengths */}
            <div>
              <h2 className="text-sm font-headline font-bold" style={{ color: textPri }}>Top 3 Strengths</h2>
              <p className="text-[10px] mt-0.5 mb-5" style={{ color: textSec }}>
                Before vs. after AlgoMind
              </p>

              {/* Legend */}
              <div className="flex gap-5 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-2 rounded-sm" style={{ background: 'rgba(99,102,241,0.25)' }} />
                  <span className="text-[10px]" style={{ color: textSec }}>Before</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-2 rounded-sm" style={{ background: '#6366F1' }} />
                  <span className="text-[10px]" style={{ color: textSec }}>After</span>
                </div>
              </div>

              <div className="space-y-6">
                {top3.map(({ name, before, after }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold" style={{ color: textPri }}>{name}</span>
                      <span className="text-[10px] font-bold" style={{ color: '#22C55E' }}>
                        +{after - before}%
                      </span>
                    </div>

                    {/* Before row */}
                    <div className="mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] w-9 text-right shrink-0" style={{ color: textSec }}>
                          {before}%
                        </span>
                        <div className="flex-grow h-2 rounded-full overflow-hidden" style={{ background: surfLow }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${before}%`, background: 'rgba(99,102,241,0.28)' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* After row */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] w-9 text-right shrink-0 font-bold" style={{ color: '#6366F1' }}>
                          {after}%
                        </span>
                        <div className="flex-grow h-2 rounded-full overflow-hidden" style={{ background: surfLow }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${after}%`, background: '#6366F1' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="text-sm font-headline font-bold mb-4" style={{ color: textPri }}>Recent Activity</h2>
          <div className="space-y-3">
            {RECENT.map(({ title, diff, time, status, color }) => (
              <div
                key={title}
                className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.005]"
                style={{ background: surfLow }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: textPri }}>{title}</p>
                    <p className="text-[10px]" style={{ color: textSec }}>{diff} • {time}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                  style={{ background: `${color}18`, color }}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default AnalyticsPage;
