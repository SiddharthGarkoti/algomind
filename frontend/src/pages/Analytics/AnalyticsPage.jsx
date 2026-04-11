import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

const STATS = [
  { label: 'Problems Solved', value: '412', icon: 'check_circle', color: '#6366F1', delta: '+12 this week' },
  { label: 'Streak',          value: '14d',  icon: 'local_fire_department', color: '#A855F7', delta: 'Personal best!' },
  { label: 'Accuracy',        value: '74%',  icon: 'target',       color: '#22C55E', delta: '+3% this month' },
  { label: 'Global Rank',     value: '#204', icon: 'leaderboard',  color: '#F59E0B', delta: '↑ 18 places' },
];

const TOPIC_DATA = [
  { name: 'Arrays',     solved: 92, total: 120, color: '#6366F1' },
  { name: 'Graphs',     solved: 28, total: 90,  color: '#EF4444' },
  { name: 'DP',         solved: 45, total: 100, color: '#A855F7' },
  { name: 'Trees',      solved: 60, total: 80,  color: '#22C55E' },
  { name: 'Strings',    solved: 55, total: 70,  color: '#F59E0B' },
  { name: 'Greedy',     solved: 35, total: 60,  color: '#06B6D4' },
  { name: 'Backtrack',  solved: 20, total: 50,  color: '#EC4899' },
  { name: 'Bit Manip',  solved: 18, total: 40,  color: '#8B5CF6' },
];

const RECENT = [
  { title: 'Longest Path in DAG',     diff: 'Medium', time: '2h ago',   status: 'Solved',   color: '#22C55E' },
  { title: 'Word Ladder II',           diff: 'Hard',   time: '5h ago',   status: 'Attempted', color: '#F59E0B' },
  { title: 'Coin Change',             diff: 'Medium', time: 'Yesterday', status: 'Solved',   color: '#22C55E' },
  { title: 'N-Queens',                diff: 'Hard',   time: '2 days',   status: 'Solved',   color: '#22C55E' },
];

function AnalyticsPage({ theme, toggleTheme }) {
  const isDark   = theme === 'dark';
  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-8 max-w-6xl mx-auto">

        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Your detailed performance breakdown</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ label, value, icon, color, delta }) => (
            <div key={label} className="rounded-2xl p-5 card-3d"
              style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: textSec }}>{label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}18` }}>
                  <span className="material-symbols-outlined text-base" style={{ color }}>{icon}</span>
                </div>
              </div>
              <p className="text-3xl font-headline font-extrabold tracking-tight" style={{ color }}>{value}</p>
              <p className="text-[10px] mt-1 font-medium" style={{ color: '#22C55E' }}>{delta}</p>
            </div>
          ))}
        </div>

        {/* Topic Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bar chart */}
          <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <h2 className="text-sm font-headline font-bold mb-6" style={{ color: textPri }}>Topic-wise Progress</h2>
            <div className="space-y-4">
              {TOPIC_DATA.map(({ name, solved, total, color }) => {
                const pct = Math.round((solved / total) * 100);
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: textPri, fontWeight: 600 }}>{name}</span>
                      <span style={{ color: textSec }}>{solved}/{total} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: surfLow }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty ring */}
          <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <h2 className="text-sm font-headline font-bold mb-6" style={{ color: textPri }}>Difficulty Distribution</h2>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke={surfLow} strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#6366F1" strokeWidth="12"
                    strokeDasharray={`${73*2.51} ${100*2.51}`} strokeLinecap="round" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="12"
                    strokeDasharray={`${32*2.51} ${100*2.51}`} strokeDashoffset={`-${73*2.51}`} strokeLinecap="round" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="12"
                    strokeDasharray={`${12*2.51} ${100*2.51}`} strokeDashoffset={`-${(73+32)*2.51}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-headline font-extrabold" style={{ color: textPri }}>412</span>
                  <span className="text-[10px]" style={{ color: textSec }}>solved</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {[['Easy','#6366F1','184'],['Medium','#F59E0B','192'],['Hard','#EF4444','36']].map(([l,c,n]) => (
                <div key={l} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  <span className="text-xs" style={{ color: textSec }}>{l} <strong style={{ color: textPri }}>{n}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="text-sm font-headline font-bold mb-4" style={{ color: textPri }}>Recent Activity</h2>
          <div className="space-y-3">
            {RECENT.map(({ title, diff, time, status, color }) => (
              <div key={title} className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.005]"
                style={{ background: surfLow }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: textPri }}>{title}</p>
                    <p className="text-[10px]" style={{ color: textSec }}>{diff} • {time}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                  style={{ background: `${color}18`, color }}>
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
