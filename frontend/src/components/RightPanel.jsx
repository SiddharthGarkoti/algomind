import { useNavigate } from 'react-router-dom';
import AICoach from './AICoach.jsx';

/* Compute the next milestone above the current solved count */
function nextMilestone(solved) {
  const milestones = [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000];
  const target = milestones.find(m => m > solved) ?? solved + 100;
  const prev   = milestones[milestones.indexOf(target) - 1] ?? 0;
  return { target, prev, left: target - solved };
}

function RightPanel({ isDark, summary, weakAreas, loading }) {
  const navigate  = useNavigate();
  const surface   = isDark ? '#1f2022' : '#FFFFFF';
  const surfaceLo = isDark ? '#292a2c' : '#F8FAFC';
  const border    = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.07)';
  const textPri   = isDark ? '#e3e2e5' : '#0F172A';
  const textSec   = isDark ? '#908fa0' : '#64748B';

  const hasSummary    = !!summary;
  const totalSolved   = summary?.total_problems_solved ?? 0;
  const totalContests = summary?.total_contests ?? 0;
  const avgRating     = summary?.average_rating ?? 0;
  const connected     = summary?.platforms_connected ?? 0;

  const { target, prev, left } = nextMilestone(totalSolved);
  const milestoneProgress = target > prev
    ? Math.round(((totalSolved - prev) / (target - prev)) * 100)
    : 100;

  /* Top weak area for the "Focus Today" prompt */
  const topWeak = weakAreas?.find(t => t.status === 'weak');

  return (
    <aside className="fixed-right-panel flex flex-col gap-4">

      {/* AI Coach */}
      <AICoach isDark={isDark} />

      {/* Platform Summary Stats */}
      <div className="rounded-xl p-5 flex flex-col shrink-0 card"
        style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
            <span className="material-symbols-outlined text-base">leaderboard</span>
          </div>
          <h3 className="text-xs font-headline font-bold" style={{ color: textPri }}>Your Stats</h3>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: surfaceLo }} />
            ))}
          </div>
        ) : !hasSummary || connected === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs mb-3" style={{ color: textSec }}>
              Connect a platform to see your real stats.
            </p>
            <button
              className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-90"
              style={{ background: '#6366F1', color: '#fff' }}
              onClick={() => navigate('/settings')}>
              Connect Now
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-3 rounded-lg" style={{ background: surfaceLo }}>
                <p className="text-[8px] uppercase mb-0.5" style={{ color: textSec }}>Problems</p>
                <p className="text-base font-bold" style={{ color: textPri }}>{totalSolved.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: surfaceLo }}>
                <p className="text-[8px] uppercase mb-0.5" style={{ color: textSec }}>Contests</p>
                <p className="text-base font-bold" style={{ color: textPri }}>{totalContests}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: surfaceLo }}>
                <p className="text-[8px] uppercase mb-0.5" style={{ color: textSec }}>Avg Rating</p>
                <p className="text-base font-bold" style={{ color: '#6366F1' }}>{avgRating > 0 ? avgRating : '—'}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: surfaceLo }}>
                <p className="text-[8px] uppercase mb-0.5" style={{ color: textSec }}>Platforms</p>
                <p className="text-base font-bold" style={{ color: '#22C55E' }}>{connected}</p>
              </div>
            </div>
            <button
              className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-90"
              style={{ background: '#6366F1', color: '#FFFFFF' }}
              onClick={() => navigate('/analytics')}>
              Full Analytics
            </button>
          </>
        )}
      </div>

      {/* Next Milestone */}
      <div className="rounded-xl p-5 flex flex-col shrink-0 card"
        style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
            <span className="material-symbols-outlined text-base">flag</span>
          </div>
          <h3 className="text-xs font-headline font-bold" style={{ color: textPri }}>Next Milestone</h3>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-4 rounded-full w-3/4 animate-pulse" style={{ background: surfaceLo }} />
            <div className="h-2 rounded-full w-full animate-pulse mt-3" style={{ background: surfaceLo }} />
          </div>
        ) : connected === 0 ? (
          <p className="text-xs" style={{ color: textSec }}>Connect platforms to track your milestone progress.</p>
        ) : (
          <>
            <div className="mb-3">
              <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: textSec }}>Current Goal</p>
              <p className="text-sm font-bold" style={{ color: textPri }}>Solve {target} Problems</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-3 rounded-lg" style={{ background: surfaceLo }}>
                <p className="text-[8px] uppercase mb-0.5" style={{ color: textSec }}>Left</p>
                <p className="text-[10px] font-bold" style={{ color: textPri }}>{left} Problems</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: surfaceLo }}>
                <p className="text-[8px] uppercase mb-0.5" style={{ color: textSec }}>Progress</p>
                <p className="text-[10px] font-bold" style={{ color: '#6366F1' }}>{milestoneProgress}%</p>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden mb-3" style={{ background: surfaceLo }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${milestoneProgress}%`, background: '#6366F1' }} />
            </div>
            {topWeak && (
              <div className="p-2 rounded-lg" style={{ background: surfaceLo, border: `1px solid ${border}` }}>
                <p className="text-[10px] font-medium mb-0.5" style={{ color: textPri }}>
                  Focus: <span style={{ color: '#EF4444' }}>{topWeak.topic_name}</span>
                </p>
                <p className="text-[9px] italic" style={{ color: textSec }}>
                  Only {topWeak.problems_solved} problems solved — weakest area
                </p>
              </div>
            )}
          </>
        )}
      </div>

    </aside>
  );
}

export default RightPanel;
