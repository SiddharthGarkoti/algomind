function PlanNavbar({ isDark, toggleTheme }) {
  return (
    <nav
      className="w-full h-20 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 transition-all duration-300"
      style={{
        background: isDark
          ? 'rgba(10, 10, 11, 0.88)'
          : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px)',
        borderBottom: isDark
          ? '1px solid rgba(255,255,255,0.05)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDark ? 'none' : '0 4px 20px -4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
          <span className="material-symbols-outlined text-white text-xl">hub</span>
        </div>
        <span
          className="font-headline font-extrabold text-2xl tracking-tighter"
          style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}
        >
          AlgoMind
        </span>
      </div>

      <button
        id="theme-toggle-btn"
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          color: isDark ? '#e3e2e5' : '#374151',
        }}
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined">
          {isDark ? 'dark_mode' : 'light_mode'}
        </span>
      </button>
    </nav>
  );
}

export default PlanNavbar;
