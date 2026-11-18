function TaskCard({ title, difficulty, category, icon, iconColor, diffBg, diffColor, isDark, href, platform }) {
  const surface = isDark ? '#1a1b1e' : '#FFFFFF';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#F8FAFC' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';

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

  const diffNormalized = (difficulty || '').toLowerCase();
  const badgeColor = diffNormalized === 'easy' ? '#818CF8'
    : diffNormalized === 'medium' ? '#A855F7'
    : diffNormalized === 'hard' ? '#C084FC'
    : '#818CF8';
  const badgeBg = diffNormalized === 'easy' ? 'rgba(99, 102, 241, 0.12)'
    : diffNormalized === 'medium' ? 'rgba(168, 85, 247, 0.12)'
    : diffNormalized === 'hard' ? 'rgba(192, 132, 252, 0.12)'
    : 'rgba(99, 102, 241, 0.12)';

  return (
    <div
      className="group rounded-2xl p-4 sm:p-4.5 transition-all duration-200 hover:border-purple-500/40 flex items-center justify-between"
      style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.2)' : '0 2px 8px -2px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)', color: '#818CF8' }}
        >
          <span className="material-symbols-outlined text-xl">{icon || 'code'}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors" style={{ color: textPri }}>
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-md font-semibold"
              style={{ background: badgeBg, color: badgeColor }}
            >
              {difficulty}
            </span>
            <span className="text-xs font-normal" style={{ color: textSec }}>
              {category}
            </span>
            {platformLabel && (
              <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: textSec }}>
                {platformLabel}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 hover:opacity-90 active:scale-95 shrink-0 ml-4 cursor-pointer"
        style={{ background: '#6366F1', color: '#FFFFFF' }}
        onClick={handleStart}
      >
        <span>{href ? 'Solve' : 'Start'}</span>
        <span className="material-symbols-outlined text-sm">{href ? 'open_in_new' : 'arrow_forward'}</span>
      </button>
    </div>
  );
}

export default TaskCard;
