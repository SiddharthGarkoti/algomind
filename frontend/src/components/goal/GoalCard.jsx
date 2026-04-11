function GoalCard({ goalId, icon, iconFilled, title, description, isActive, onSelect, isDark }) {
  const darkCard = {
    background: isActive ? 'rgba(47,58,163,0.25)' : 'rgba(28,29,32,0.9)',
    border: isActive ? '2px solid #6366F1' : '1px solid rgba(255,255,255,0.07)',
    boxShadow: isActive
      ? '0 0 0 1px rgba(99,102,241,0.2), 0 40px 70px -20px rgba(0,0,0,0.8), 0 0 30px rgba(99,102,241,0.2)'
      : '0 10px 30px -10px rgba(0,0,0,0.7)',
  };
  const lightCard = {
    background: isActive ? '#FFFFFF' : '#FFFFFF',
    border: isActive ? '2px solid #6366F1' : '1px solid rgba(0,0,0,0.08)',
    boxShadow: isActive
      ? '0 35px 60px -10px rgba(99,102,241,0.12), 0 0 0 1px rgba(99,102,241,0.15)'
      : '0 8px 24px -4px rgba(0,0,0,0.06)',
  };

  return (
    <div
      className={`glass-card group relative p-8 rounded-2xl cursor-pointer flex flex-col gap-5 overflow-hidden${isActive ? ' active-state' : ''}`}
      style={{
        ...(isDark ? darkCard : lightCard),
        transform: isActive
          ? 'perspective(1500px) scale(1.07) translateY(-18px) rotateX(0deg)'
          : undefined,
      }}
      onClick={() => onSelect(goalId)}
    >
      {/* Icon */}
      <div
        className="goal-icon-wrap w-14 h-14 rounded-xl flex items-center justify-center"
        style={{
          background: isActive
            ? (isDark ? 'rgba(99,102,241,0.25)' : '#6366F1')
            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)'),
          color: isActive
            ? (isDark ? '#c0c1ff' : '#FFFFFF')
            : '#6366F1',
        }}
      >
        <span
          className="material-symbols-outlined text-3xl"
          style={iconFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
      </div>

      {/* Text */}
      <div>
        <h3 className="font-headline text-xl font-bold mb-2"
          style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed"
          style={{ color: isDark ? '#c7c4d7' : '#475569' }}>
          {description}
        </p>
      </div>

      {/* Bottom bar + check */}
      <div className={`mt-auto pt-2 ${isActive ? 'flex items-center justify-between' : ''}`}>
        <div
          className={`h-1 rounded-full transition-all duration-500 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
          style={{ background: 'linear-gradient(90deg, #6366F1, #A855F7)' }}
        />
        {isActive && (
          <span
            className="material-symbols-outlined ml-3 text-xl shrink-0 badge-pop"
            style={{ color: '#6366F1', fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        )}
      </div>
    </div>
  );
}

export default GoalCard;
