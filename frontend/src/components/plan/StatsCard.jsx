import { useState } from 'react';

const STATS = {
  lc: {
    label:    'LeetCode',
    color:    '#FFA116',
    gradient: 'linear-gradient(135deg,#FFA116,#FF7B00)',
    stats: [
      { label: 'Solved',   value: '205', sub: 'of 3,200+' },
      { label: 'Easy',     value: '80',  sub: 'of 800' },
      { label: 'Medium',   value: '100', sub: 'of 1,800' },
      { label: 'Hard',     value: '25',  sub: 'of 600' },
    ],
    rate: '78%',
    streak: 14,
    rank: '#4',
  },
  cf: {
    label:    'Codeforces',
    color:    '#1F8ACB',
    gradient: 'linear-gradient(135deg,#1F8ACB,#1565B0)',
    stats: [
      { label: 'Solved',   value: '84',  sub: 'problems' },
      { label: 'Rating',   value: '1680',sub: 'Pupil' },
      { label: 'Max',      value: '1721',sub: 'rating' },
      { label: 'Contests', value: '12',  sub: 'completed' },
    ],
    rate: '62%',
    streak: 5,
    rank: 'Pupil',
  },
};

function StatsCard({ platform, onSwitch, isDark }) {
  const [flipped, setFlipped] = useState(false);
  const data = STATS[platform];

  const surface  = isDark ? 'rgba(28,29,32,0.95)' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c'              : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.2)'  : 'rgba(0,0,0,0.07)';
  const textPri  = isDark ? '#e3e2e5'              : '#0F172A';
  const textSec  = isDark ? '#908fa0'              : '#64748B';

  const handleSwitch = (p) => {
    if (p === platform) return;
    setFlipped(true);
    setTimeout(() => {
      onSwitch(p);
      setFlipped(false);
    }, 300);
  };

  return (
    <div className="lg:col-span-5 flex flex-col gap-5">
      {/* Platform Switcher */}
      <div className="flex gap-2 p-1 rounded-2xl w-fit"
        style={{ background: surfLow, border: `1px solid ${border}` }}>
        {(['lc','cf']).map(p => (
          <button
            key={p}
            onClick={() => handleSwitch(p)}
            className="px-6 py-2 rounded-xl text-xs font-bold transition-all"
            style={platform === p
              ? { background: STATS[p].gradient, color: '#fff', boxShadow: `0 6px 16px -4px ${STATS[p].color}66` }
              : { color: textSec }
            }
          >
            {STATS[p].label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        className="flip-container flex-grow"
        style={{ minHeight: '460px' }}
      >
        <div
          className={`flip-card-inner h-full${flipped ? ' flipped' : ''}`}
          style={{ minHeight: '460px' }}
        >
          {/* Front: stats */}
          <div
            className="flip-card-front flex flex-col overflow-hidden"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? '0 25px 50px -15px rgba(0,0,0,0.6)' : '0 8px 30px -8px rgba(0,0,0,0.08)' }}
          >
            {/* Card banner */}
            <div className="p-6 pb-4" style={{ background: `${data.color}14`, borderBottom: `1px solid ${data.color}22` }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: data.gradient }}>
                  <span className="material-symbols-outlined text-white text-base">hub</span>
                </div>
                <span className="font-headline font-bold text-base" style={{ color: data.color }}>{data.label}</span>
              </div>
              <p className="text-[10px] font-label uppercase tracking-widest ml-11" style={{ color: textSec }}>
                Connected Profile
              </p>
            </div>

            {/* Stats grid */}
            <div className="p-6 grid grid-cols-2 gap-4 flex-grow">
              {data.stats.map(({ label, value, sub }) => (
                <div key={label} className="flex flex-col gap-1 p-4 rounded-2xl"
                  style={{ background: surfLow, border: `1px solid ${border}` }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: textSec }}>{label}</p>
                  <p className="text-2xl font-headline font-extrabold" style={{ color: data.color }}>{value}</p>
                  <p className="text-[10px]" style={{ color: textSec }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold" style={{ color: '#A855F7' }}>🔥 {data.streak}d streak</span>
                <span className="text-[10px]" style={{ color: textSec }}>· Rank {data.rank}</span>
              </div>
              <button
                className="text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                style={{ background: `${data.color}14`, color: data.color }}
                onClick={() => setFlipped(true)}
              >
                Success Rate ↗
              </button>
            </div>
          </div>

          {/* Back: success rate detail */}
          <div
            className="flip-card-back flex flex-col p-6"
            style={{ background: surface, border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-lg" style={{ color: textPri }}>Success Rate</h3>
              <button
                className="text-[10px] font-bold px-3 py-1.5 rounded-xl hover:opacity-80"
                style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}
                onClick={() => setFlipped(false)}
              >
                ← Back
              </button>
            </div>

            {/* Radial ring */}
            <div className="flex flex-col items-center my-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                    stroke={isDark ? '#292a2c' : '#E2E8F0'} />
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                    stroke={data.color}
                    strokeLinecap="round"
                    strokeDasharray={`${parseFloat(data.rate) * 2.51} 251`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-headline font-extrabold" style={{ color: data.color }}>{data.rate}</span>
                  <span className="text-[9px]" style={{ color: textSec }}>success</span>
                </div>
              </div>
              <p className="text-sm mt-4 font-medium text-center" style={{ color: textSec }}>
                Based on {data.stats[0].value} submissions on {data.label}
              </p>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-3 mt-auto">
              {[
                { label: 'Easy',   pct: 95, color: '#22C55E' },
                { label: 'Medium', pct: 72, color: data.color },
                { label: 'Hard',   pct: 38, color: '#EF4444' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span style={{ color: textSec }}>{label}</span>
                    <span style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#343537' : '#E2E8F0' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
