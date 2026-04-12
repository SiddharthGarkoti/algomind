import { useNavigate } from 'react-router-dom';

const INTENSITY_LEVELS = ['Light', 'Balanced', 'Intense'];

function PlanCustomizer({
  intensity, onIntensity,
  currentSelection,
  onTopicClick, onOpenModal,
  onUsePlan, onCustomize,
  weakAreas,   // [{topic_name, status}] from API
  aiPlan,      // {message, daily_goal, theory_focus, topics} from AI
  aiLoading,
  isDark,
}) {
  const navigate    = useNavigate();
  const surface     = isDark ? 'rgba(28,29,32,0.95)' : '#FFFFFF';
  const surfaceHigh = isDark ? 'rgba(38,39,42,0.9)'  : '#F8FAFC';
  const border      = isDark ? 'rgba(70,69,84,0.2)'  : 'rgba(0,0,0,0.07)';
  const textPri     = isDark ? '#e3e2e5'              : '#0F172A';
  const textSec     = isDark ? '#908fa0'              : '#64748B';

  /* Derive the top 3 weak/improving areas to display */
  const displayAreas = weakAreas
    .filter(w => w.status === 'weak' || w.status === 'improving')
    .slice(0, 3)
    .map((w, i) => ({ priority: `Priority ${i + 1}`, label: w.topic_name }));

  /* Fallback when no real data yet */
  const showAreas = displayAreas.length > 0
    ? displayAreas
    : [{ priority: 'Priority 1', label: 'Connect platforms to detect weak areas' }];

  return (
    <section className="lg:col-span-8 flex flex-col space-y-8">
      <div
        className="rounded-2xl p-8 space-y-10"
        style={{
          background: surface,
          border: `1px solid ${border}`,
          boxShadow: isDark ? '0 25px 50px -15px rgba(0,0,0,0.6)' : '0 8px 30px -8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Core Improvement Areas */}
        <div className="space-y-5">
          <SectionHeader icon="psychology" label="Core Improvement Areas" textSec={textSec} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {showAreas.map(({ priority, label }) => (
              <div key={priority}
                className="p-4 pl-6 rounded-xl flex flex-col gap-2 relative hover:scale-[1.02] transition-transform"
                style={{ background: surfaceHigh, border: `1px solid ${border}` }}>
                <div className="weak-accent" />
                <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#6366F1' }}>{priority}</span>
                <p className="font-headline font-bold text-sm" style={{ color: textPri }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Coaching Message */}
        {(aiLoading || aiPlan?.message) && (
          <div className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)',
              border: '1px solid rgba(99,102,241,0.18)',
            }}>
            <span className="material-symbols-outlined shrink-0 mt-0.5"
              style={{ color: '#6366F1', fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            {aiLoading ? (
              <div className="space-y-2 flex-grow">
                <div className="h-3 rounded-full w-3/4 animate-pulse" style={{ background: isDark ? '#292a2c' : '#E2E8F0' }} />
                <div className="h-3 rounded-full w-1/2 animate-pulse" style={{ background: isDark ? '#292a2c' : '#E2E8F0' }} />
              </div>
            ) : (
              <div className="flex-grow">
                <p className="text-xs font-bold mb-1" style={{ color: '#6366F1' }}>AI Coach</p>
                <p className="text-[12px] leading-relaxed" style={{ color: textSec }}>{aiPlan.message}</p>
                {aiPlan.daily_goal && (
                  <p className="mt-2 text-[11px] font-bold" style={{ color: textPri }}>
                    Daily goal: <span style={{ color: '#6366F1' }}>{aiPlan.daily_goal} problems/day</span>
                    {aiPlan.theory_focus && <span className="font-normal text-[10px] ml-2" style={{ color: textSec }}>· {aiPlan.theory_focus}</span>}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Intensity */}
        <div className="space-y-4">
          <SectionHeader icon="bolt" label="Curriculum Intensity" textSec={textSec} />
          <div className="flex flex-wrap gap-3">
            {INTENSITY_LEVELS.map(level => {
              const isActive = intensity === level;
              return (
                <button key={level} onClick={() => onIntensity(level)}
                  className="intensity-btn px-8 py-3 rounded-full text-sm transition-all active:scale-95"
                  style={isActive ? {
                    background: '#6366F1', color: '#FFFFFF', fontWeight: '700',
                    boxShadow: '0 8px 20px -6px rgba(99,102,241,0.4)',
                  } : {
                    border: `1px solid ${border}`, background: surfaceHigh,
                    color: textSec, fontWeight: '600',
                  }}>
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Focus Topics */}
        <div className="space-y-4">
          <SectionHeader icon="list_alt" label="Focus Topics" textSec={textSec} />
          {currentSelection.length === 0 ? (
            <p className="text-xs" style={{ color: textSec }}>Loading topics from your profile…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentSelection.map(topic => (
                <button key={topic} onClick={() => onTopicClick(topic)} title="Click to remove"
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', color: '#6366F1' }}>
                  {topic}
                  <span className="material-symbols-outlined text-[11px] opacity-60">close</span>
                </button>
              ))}
              <button onClick={onOpenModal}
                className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                style={{
                  color: isDark ? '#c0c1ff' : '#6366F1',
                  background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
                  border: '1px dashed rgba(99,102,241,0.4)',
                }}>
                <span className="material-symbols-outlined text-sm">add</span>
                <span>More</span>
              </button>
            </div>
          )}
          <p className="text-[10px]" style={{ color: textSec }}>Click a topic to remove · Click More to add</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
        <button
          className="w-full sm:w-auto min-w-[200px] px-8 py-4 rounded-2xl font-headline font-extrabold text-lg text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)', boxShadow: '0 20px 40px -10px rgba(99,102,241,0.4)' }}
          onClick={onUsePlan}>
          Use This Plan
        </button>
        <button
          className="w-full sm:w-auto min-w-[200px] px-8 py-4 rounded-2xl font-headline font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', border: `1px solid ${border}`, color: textPri }}
          onClick={onCustomize}>
          Customise Plan
        </button>
      </div>

      {/* AI Mentor link */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-[11px]" style={{ color: textSec }}>Not sure about a topic?</span>
        <button
          onClick={() => navigate('/chatbot')}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold hover:opacity-75 transition-opacity"
          style={{ color: '#6366F1' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          Ask AI Mentor
        </button>
      </div>
    </section>
  );
}

function SectionHeader({ icon, label, textSec }) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-xl" style={{ color: '#6366F1' }}>{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: textSec }}>{label}</h3>
    </div>
  );
}

export default PlanCustomizer;
