/**
 * AnalyzeCard.jsx
 *
 * Props:
 *  lcUsername   – string   – controlled value for LeetCode input
 *  cfUsername   – string   – controlled value for Codeforces input
 *  lcError      – string   – per-field error for LeetCode (empty = no error)
 *  cfError      – string   – per-field error for Codeforces
 *  generalError – string   – shown below both fields
 *  loading      – boolean  – show spinner, disable button
 *  onChange     – fn(field, value) – update parent state
 *  onSubmit     – fn       – trigger validation + navigate
 */
function AnalyzeCard({ lcUsername, cfUsername, lcError, cfError, generalError, loading, onChange, onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <section className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
      {/* Background glow */}
      <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/5 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-md glass-panel-login p-10 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-purple-500/10 backdrop-blur-lg hover:scale-[1.01] transition-all duration-300 bg-white/95 dark:bg-white/5">

        {/* Card Header */}
        <div className="mb-10 text-center">
          <h2 className="font-headline text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Analyze Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-body">
            Input your handles to begin the extraction
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* LeetCode Input */}
          <div className="space-y-1">
            <label
              className="text-xs font-label uppercase tracking-widest text-gray-500 dark:text-gray-400/80 ml-1"
              htmlFor="lc-username"
            >
              LeetCode Username
            </label>
            <div className={`relative group border-b-2 transition-colors ${lcError ? 'border-red-500' : 'border-gray-200 dark:border-outline-variant/20 focus-within:border-purple-600 dark:focus-within:border-purple-400'}`}>
              <input
                id="lc-username"
                type="text"
                placeholder="Enter your username"
                value={lcUsername}
                onChange={(e) => onChange('lcUsername', e.target.value)}
                className="w-full bg-gray-50/50 dark:bg-surface-container-low px-4 py-4 rounded-t-xl transition-all outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 font-body"
              />
              <span className={`material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${lcError ? 'text-red-500' : 'text-gray-400 dark:text-gray-600 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400'}`}>
                person
              </span>
            </div>
            {lcError && (
              <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {lcError}
              </p>
            )}
          </div>

          {/* Codeforces Input */}
          <div className="space-y-1">
            <label
              className="text-xs font-label uppercase tracking-widest text-gray-500 dark:text-gray-400/80 ml-1"
              htmlFor="cf-username"
            >
              Codeforces Username
            </label>
            <div className={`relative group border-b-2 transition-colors ${cfError ? 'border-red-500' : 'border-gray-200 dark:border-outline-variant/20 focus-within:border-purple-600 dark:focus-within:border-purple-400'}`}>
              <input
                id="cf-username"
                type="text"
                placeholder="Enter your username"
                value={cfUsername}
                onChange={(e) => onChange('cfUsername', e.target.value)}
                className="w-full bg-gray-50/50 dark:bg-surface-container-low px-4 py-4 rounded-t-xl transition-all outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 font-body"
              />
              <span className={`material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${cfError ? 'text-red-500' : 'text-gray-400 dark:text-gray-600 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400'}`}>
                person
              </span>
            </div>
            {cfError && (
              <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {cfError}
              </p>
            )}
          </div>

          {/* General error (no handle entered) */}
          {generalError && (
            <p className="text-xs text-red-500 text-center font-medium">{generalError}</p>
          )}

          {/* Validating indicator */}
          {loading && (
            <p className="text-xs text-purple-500 text-center flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Validating handle…
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined spinner">progress_activity</span>
                Validating…
              </>
            ) : (
              <>
                Analyze My Profile
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </>
            )}
          </button>

          {/* Demo link */}
          <div className="pt-2 text-center">
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              Not on LeetCode/CF yet? <button type="button" className="text-purple-500 hover:underline" onClick={() => {}}>Continue as guest →</button>
            </p>
          </div>

        </form>

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-xl bg-gray-100/50 dark:bg-surface-container-lowest/50 border border-gray-200 dark:border-outline-variant/5">
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed text-center">
            We analyze your solved problems to identify gaps and build your daily plan.
          </p>
        </div>

      </div>
    </section>
  );
}

export default AnalyzeCard;
