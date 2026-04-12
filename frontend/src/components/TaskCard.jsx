function TaskCard({ title, difficulty, category, icon, iconColor, diffBg, diffColor, isDark, href, platform }) {
  const surface = isDark ? '#1f2022' : '#FFFFFF';
  const border  = isDark ? 'rgba(70,69,84,0.12)' : 'rgba(0,0,0,0.07)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  const handleStart = () => {
    if (href) {
      window.open(href, '_blank', 'noopener noreferrer');
    } else {
      window.location.href = '/arena';
    }
  };

  const platformLabel = platform === 'leetcode' ? 'LeetCode'
    : platform === 'codeforces' ? 'Codeforces'
    : null;

  return (
    <div
      className="group rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] flex items-center justify-between card-3d container-box"
      style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 2px 8px -2px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center border shrink-0"
          style={{ background: isDark ? '#292a2c' : '#F1F5F9', borderColor: border, color: iconColor }}
        >
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-headline font-bold truncate" style={{ color: textPri }}>{title}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className="text-[9px] font-label px-1.5 py-0.5 rounded font-bold"
              style={{ background: diffBg, color: diffColor }}
            >
              {difficulty}
            </span>
            <span className="text-[9px] font-label uppercase tracking-wider" style={{ color: textSec }}>{category}</span>
            {platformLabel && (
              <span className="text-[9px] font-label px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
                {platformLabel}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        className="task-start-btn px-4 py-1.5 rounded-lg font-label text-[10px] font-bold transition-all flex items-center gap-1.5 hover:scale-[1.04] active:scale-95 shrink-0 ml-3"
        style={{ background: '#6366F1', color: '#FFFFFF', boxShadow: '0 4px 12px -3px rgba(99,102,241,0.4)' }}
        onClick={handleStart}
      >
        {href ? 'Solve' : 'Start'} <span className="material-symbols-outlined text-xs">{href ? 'open_in_new' : 'arrow_forward'}</span>
      </button>
    </div>
  );
}

export default TaskCard;
