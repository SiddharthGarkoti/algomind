/**
 * Navbar.jsx
 *
 * Props:
 *  isDark       – boolean  – current theme
 *  toggleTheme  – fn       – flip dark/light
 *  onSignIn     – fn       – open the sign-in modal
 */
function Navbar({ isDark, toggleTheme, onSignIn }) {
  return (
    <header className="w-full top-0 left-0 z-50 border-b border-gray-200 dark:border-white/5">
      <nav className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">

        {/* ── Logo ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-xl">hub</span>
            </div>
            <span className="text-xl font-headline font-extrabold tracking-tight text-gray-900 dark:text-white">
              AlgoMind
            </span>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────── */}
        <div className="flex gap-4 items-center">
          {/* Theme Toggle */}
          <button
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-surface-container-high text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-surface-bright transition-all active:scale-95 duration-150 flex items-center justify-center"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <span className="material-symbols-outlined text-[20px]">dark_mode</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">light_mode</span>
            )}
          </button>

          {/* Sign In */}
          <button
            className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-surface-container-high text-white dark:text-purple-400 font-bold hover:opacity-90 dark:hover:bg-surface-bright transition-all active:scale-95 duration-150 text-sm"
            onClick={onSignIn}
          >
            Sign In
          </button>
        </div>

      </nav>
    </header>
  );
}

export default Navbar;
