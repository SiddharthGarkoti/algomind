function GoalNavbar({ isDark, toggleTheme }) {
  return (
    <nav
      className="fixed top-0 w-full z-50 flex justify-between items-center px-12 h-20 font-headline tracking-tight transition-all duration-300"
      style={{
        background: isDark
          ? 'rgba(10, 10, 11, 0.85)'
          : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px)',
        borderBottom: isDark
          ? '1px solid rgba(255,255,255,0.05)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDark
          ? 'none'
          : '0 4px 20px -4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <img
          src="/logo-symbol.png"
          alt="AlgoMind"
          className="h-8 w-8 object-contain shrink-0 drop-shadow-md"
        />
        <span className="text-2xl font-extrabold tracking-tighter"
          style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
          AlgoMind
        </span>
      </div>

      <button
        id="theme-toggle"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        className="p-2.5 rounded-xl transition-all duration-300 active:scale-90 flex items-center justify-center"
        style={{
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          color: isDark ? '#e3e2e5' : '#374151',
        }}
      >
        <span className="material-symbols-outlined text-xl">
          {isDark ? 'dark_mode' : 'light_mode'}
        </span>
      </button>
    </nav>
  );
}

export default GoalNavbar;
