import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';

function AICoach({ isDark }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const surface   = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.85)';
  const border    = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
  const textPri   = isDark ? '#F8FAFC' : '#0F172A';
  const textSec   = isDark ? '#94A3B8' : '#64748B';
  const btnBg     = isDark ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9';
  const btnBorder = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const btnColor  = isDark ? '#E2E8F0' : '#1E293B';

  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cached = sessionStorage.getItem('algomind_mentor_analysis');
    const cachedTs = sessionStorage.getItem('algomind_mentor_analysis_ts');
    // Cache for 10 minutes
    if (cached && cachedTs && Date.now() - Number(cachedTs) < 600_000) {
      try { setAnalysis(JSON.parse(cached)); setLoading(false); return; } catch {}
    }
    api.get('/auth/mentor-analysis/')
      .then(data => {
        setAnalysis(data);
        sessionStorage.setItem('algomind_mentor_analysis', JSON.stringify(data));
        sessionStorage.setItem('algomind_mentor_analysis_ts', String(Date.now()));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const specialist  = analysis?.specialist  ?? 'DSA';
  const observation = analysis?.observation ?? 'Analysing your recent submissions…';
  const insight     = analysis?.insight     ?? '';
  const weakness    = analysis?.weakness    ?? '';
  const direction   = analysis?.direction   ?? '';

  const blocks = [
    { label: 'Observation', color: textSec,   text: observation },
    { label: 'Insight',     color: textSec,   text: insight },
    { label: 'Weakness',    color: '#EF4444', text: weakness },
  ].filter(b => b.text);

  return (
    <div
      className="ai-mentor-card rounded-2xl p-5 relative overflow-hidden shrink-0 border backdrop-blur-xl"
      style={{
        background: surface,
        borderColor: border,
        boxShadow: isDark ? '0 4px 20px -2px rgba(0,0,0,0.3)' : '0 4px 16px -4px rgba(0,0,0,0.06)'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 relative z-10">
        <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
          <img src="/milo.png" alt="MILO" className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-tight" style={{ color: textPri }}>MILO</h4>
          <p className="text-[11px] font-medium" style={{ color: '#818CF8' }}>
            {loading ? 'Evaluating…' : `${specialist} Specialist`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 mb-4 relative z-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-2 w-16 rounded animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
              <div className="h-3.5 w-full rounded animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Insight blocks */}
          <div className="space-y-3 mb-4 relative z-10">
            {blocks.map(({ label, color, text }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
                <p className="text-xs leading-relaxed" style={{ color: textPri }}>{text}</p>
              </div>
            ))}
            {direction && (
              <div className="p-3 rounded-xl mt-2" style={{ background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)', border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)'}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#818CF8' }}>Next Focus</p>
                <p className="text-xs leading-snug font-medium" style={{ color: textPri }}>
                  {direction}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="space-y-2 relative z-10">
        {[
          { label: 'Explain this weakness',  path: '/chatbot?mode=analysis'  },
          { label: 'Give me a strategy',     path: '/chatbot?mode=strategy'  },
          { label: 'Show similar problems',  path: '/arena'                  },
        ].map(({ label, path }) => (
          <button
            key={label}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between hover:bg-white/[0.05] active:scale-[0.99] cursor-pointer"
            style={{ background: btnBg, color: btnColor, border: `1px solid ${btnBorder}` }}
            onClick={() => navigate(path)}
          >
            <span>{label}</span>
            <span className="material-symbols-outlined text-xs opacity-60">arrow_forward</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AICoach;
