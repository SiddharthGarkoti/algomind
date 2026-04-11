import { useNavigate } from 'react-router-dom';

function AICoach({ isDark }) {
  const navigate = useNavigate();
  const surface  = isDark ? 'rgba(99,102,241,0.06)' : 'linear-gradient(180deg, #F3F4FF 0%, #EEF2FF 100%)';
  const border   = isDark ? 'rgba(99,102,241,0.2)' : '#E0E7FF';
  const textPri  = isDark ? '#e3e2e5' : '#1e1b4b';
  const textSec  = isDark ? '#908fa0' : '#4338CA';
  const btnBg    = isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB';
  const btnColor = isDark ? '#e3e2e5' : '#111827';

  return (
    <div
      className="ai-mentor-card rounded-xl p-5 relative overflow-hidden shrink-0"
      style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? '0 0 30px rgba(99,102,241,0.06)' : '0 4px 12px rgba(99,102,241,0.08)' }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r" style={{ background: 'linear-gradient(180deg, #6366F1, #8B5CF6)' }} />
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[30px]" style={{ background: 'rgba(99,102,241,0.12)' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 relative z-10 pl-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
          <span className="material-symbols-outlined text-lg">smart_toy</span>
        </div>
        <div>
          <h4 className="text-sm font-headline font-bold ai-mentor-card-h4" style={{ color: isDark ? '#e3e2e5' : '#4338CA' }}>AI Coach</h4>
          <p className="text-[10px] font-semibold tracking-wider uppercase tag" style={{ color: isDark ? '#c0c1ff' : '#4F46E5' }}>
            Graph Specialist
          </p>
        </div>
      </div>

      {/* Insight blocks */}
      <div className="space-y-4 mb-5 relative z-10 pl-3">
        {[
          { label: 'Observation', color: textSec, text: 'I reviewed your last 5 graph attempts.' },
          { label: 'Insight',     color: textSec, text: <>You're solving correctly, but <span style={{ color: '#6366F1', fontWeight: 700 }}>too slow</span> on medium problems.</> },
          { label: 'Weakness',    color: '#EF4444', text: <>You're confusing <em>topological sort</em> with <em>BFS layering</em>.</> },
        ].map(({ label, color, text }) => (
          <div key={label} className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
            <p className="text-[11px] leading-relaxed" style={{ color: textPri }}>{text}</p>
          </div>
        ))}
        <div className="p-2.5 rounded-r-lg" style={{ background: 'rgba(99,102,241,0.08)', borderLeft: '2px solid #6366F1' }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6366F1' }}>Direction</p>
          <p className="text-[11px] leading-tight font-medium" style={{ color: textPri }}>
            Solve 2 DAG-based problems under time constraint.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 relative z-10 pl-3">
        {[
          { label: 'Explain this mistake',   path: '/chatbot?mode=analysis'  },
          { label: 'Give me a strategy',     path: '/chatbot?mode=strategy'  },
          { label: 'Show similar problems',  path: '/arena'                  },
        ].map(({ label, path }) => (
          <button
            key={label}
            className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between hover:opacity-90 ai-mentor-button"
            style={{ background: btnBg, color: btnColor, border: `1px solid ${border}` }}
            onClick={() => navigate(path)}
          >
            <span>{label}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AICoach;
