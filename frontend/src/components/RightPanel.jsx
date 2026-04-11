import { useNavigate } from 'react-router-dom';
import AICoach from './AICoach.jsx';

function RightPanel({ isDark }) {
  const navigate = useNavigate();
  const surface  = isDark ? '#1f2022' : '#FFFFFF';
  const surfaceLo= isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.07)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  return (
    <aside className="fixed-right-panel flex flex-col gap-4">

      {/* AI Coach */}
      <AICoach isDark={isDark} />

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
        <div className="mb-4">
          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: textSec }}>Current Goal</p>
          <p className="text-sm font-bold" style={{ color: textPri }}>Reach Graph Level 3</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-lg" style={{ background: surfaceLo }}>
            <p className="text-[8px] uppercase mb-0.5" style={{ color: textSec }}>Left</p>
            <p className="text-[10px] font-bold" style={{ color: textPri }}>3 Problems</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: surfaceLo }}>
            <p className="text-[8px] uppercase mb-0.5" style={{ color: textSec }}>Impact</p>
            <p className="text-[10px] font-bold" style={{ color: '#6366F1' }}>+40 Rating</p>
          </div>
        </div>
        <button
          className="w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-90 btn-view-details"
          style={{ background: '#6366F1', color: '#FFFFFF' }}
          onClick={() => navigate('/analytics')}
        >
          View Details
        </button>
      </div>

      {/* Today's Execution */}
      <div className="rounded-xl p-5 flex flex-col shrink-0 card"
        style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>
              <span className="material-symbols-outlined text-base">bolt</span>
            </div>
            <h3 className="text-xs font-headline font-bold" style={{ color: textPri }}>Today's Execution</h3>
          </div>
          <span className="text-[11px] font-bold" style={{ color: textPri }}>1 / 3</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px]">
            <span style={{ color: textSec }}>Target: Graph Problems</span>
            <span className="font-semibold" style={{ color: textPri }}>3 Total</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: surfaceLo }}>
            <div className="h-full w-[33%] rounded-full" style={{ background: '#A855F7' }} />
          </div>
          <div className="p-2 rounded-lg" style={{ background: surfaceLo, border: `1px solid ${border}` }}>
            <p className="text-[10px] font-medium mb-0.5" style={{ color: textPri }}>Next: Solve 1 medium graph problem</p>
            <p className="text-[9px] italic" style={{ color: textSec }}>Stay consistent to maintain progress</p>
          </div>
        </div>
      </div>

    </aside>
  );
}

export default RightPanel;
