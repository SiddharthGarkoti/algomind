import AICoach from './AICoach.jsx';

/* Compute the next milestone above the current solved count */
function nextMilestone(solved) {
  const milestones = [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000];
  const target = milestones.find(m => m > solved) ?? solved + 100;
  const prev   = milestones[milestones.indexOf(target) - 1] ?? 0;
  return { target, prev, left: target - solved };
}

function RightPanel({ isDark, summary, weakAreas, loading }) {
  const surface   = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.85)';
  const surfaceLo = isDark ? 'rgba(255, 255, 255, 0.02)'  : 'rgba(241, 245, 249, 0.6)';
  const border    = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
  const textPri   = isDark ? '#F8FAFC' : '#0F172A';
  const textSec   = isDark ? '#94A3B8' : '#64748B';

  const totalSolved   = summary?.total_problems_solved ?? 0;
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

      {/* Next Milestone */}
      <div className="rounded-2xl p-5 flex flex-col shrink-0 border backdrop-blur-xl"
        style={{ background: surface, borderColor: border, boxShadow: isDark ? '0 4px 20px -2px rgba(0,0,0,0.3)' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>
            <span className="material-symbols-outlined text-lg">flag</span>
          </div>
          <h3 className="text-sm font-semibold tracking-tight" style={{ color: textPri }}>Next Milestone</h3>
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
              <p className="text-xs mb-0.5" style={{ color: textSec }}>Target</p>
              <p className="text-sm font-bold" style={{ color: textPri }}>Solve {target} Problems</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="p-3 rounded-xl" style={{ background: surfaceLo }}>
                <p className="text-xs mb-0.5" style={{ color: textSec }}>Remaining</p>
                <p className="text-xs font-bold" style={{ color: textPri }}>{left} Problems</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: surfaceLo }}>
                <p className="text-xs mb-0.5" style={{ color: textSec }}>Progress</p>
                <p className="text-xs font-bold" style={{ color: '#818CF8' }}>{milestoneProgress}%</p>
              </div>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: surfaceLo }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${milestoneProgress}%`, background: 'linear-gradient(90deg, #6366F1, #A855F7)' }} />
            </div>
            {topWeak && (
              <div className="p-2.5 rounded-xl" style={{ background: surfaceLo, border: `1px solid ${border}` }}>
                <p className="text-xs font-medium mb-0.5" style={{ color: textPri }}>
                  Target Area: <span style={{ color: '#A855F7', fontWeight: 600 }}>{topWeak.topic_name}</span>
                </p>
                <p className="text-xs" style={{ color: textSec }}>
                  {topWeak.problems_solved} problems solved
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
