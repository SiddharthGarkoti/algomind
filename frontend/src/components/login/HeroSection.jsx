/**
 * HeroSection.jsx
 *
 * Renders the left branding column with background decorations.
 * Purely presentational — no props required.
 */
function HeroSection() {
  return (
    <section className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 md:py-0 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 node-pattern -z-10"></div>
      <div className="absolute -left-20 top-1/4 w-[400px] h-[400px] luminous-glow -z-10"></div>

      <div className="max-w-xl">
        {/* Headline */}
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6 text-gray-900 dark:text-gray-100">
          AlgoMind
        </h1>

        {/* Sub-headline */}
        <p className="font-headline text-xl md:text-2xl text-gray-600 dark:text-gray-400/90 leading-relaxed mb-8">
          Stop guessing what to practice.{' '}
          <span className="text-purple-600 dark:text-purple-400">
            Start improving systematically.
          </span>
        </p>

        {/* Description block */}
        <div className="flex items-center gap-4 py-6 border-t border-gray-200 dark:border-outline-variant/10">
          <div className="h-10 w-1 bg-purple-600 dark:bg-purple-500 rounded-full"></div>
          <div className="space-y-1">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-light leading-relaxed">
              Built for serious DSA preparation. We analyze your solved problems to identify gaps
              and generate a structured daily plan
            </p>
            <p className="text-base mt-1.5 font-semibold tracking-wide text-purple-600 dark:text-purple-400 font-label">
              Supports LeetCode + Codeforces
            </p>
          </div>
        </div>

        {/* Abstract visual accent lines */}
        <div className="mt-12 opacity-40">
          <div className="flex gap-4">
            <div className="h-[2px] w-12 bg-purple-600 dark:bg-purple-500"></div>
            <div className="h-[2px] w-24 bg-gray-300 dark:bg-outline-variant"></div>
            <div className="h-[2px] w-8 bg-purple-400 dark:bg-purple-400/50"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
