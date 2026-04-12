import { useNavigate } from 'react-router-dom';

/* ── Real platform logos as inline SVG ── */
function LCLogo({ color, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}

function CFLogo({ color, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M4.5 7.5C5.329 7.5 6 8.171 6 9v10.5c0 .829-.671 1.5-1.5 1.5h-3C.673 21 0 20.329 0 19.5V9c0-.829.673-1.5 1.5-1.5h3zm9-4.5c.829 0 1.5.671 1.5 1.5v15c0 .829-.671 1.5-1.5 1.5h-3c-.829 0-1.5-.671-1.5-1.5V4.5C9 3.671 9.671 3 10.5 3h3zm9 7.5c.829 0 1.5.671 1.5 1.5v7.5c0 .829-.671 1.5-1.5 1.5h-3c-.829 0-1.5-.671-1.5-1.5V15c0-.829.671-1.5 1.5-1.5h3z" />
    </svg>
  );
}

/* ── Card face — shared layout ── */
function CardFace({ pKey, platform, surfLow, border, textPri, textSec, isDark, onSaveAccount }) {
  const navigate = useNavigate();
  const Logo    = pKey === 'lc' ? LCLogo : CFLogo;
  const label   = pKey === 'lc' ? 'LeetCode' : 'Codeforces';

  /* platform is the full profile object: { platform_name, handle, stats: {...}, isGuest? } */

  /* Not connected at all */
  if (!platform) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center gap-4">
        <Logo color={textSec} size={28} />
        <div>
          <p className="text-sm font-bold" style={{ color: textPri }}>{label}</p>
          <p className="text-xs mt-1" style={{ color: textSec }}>Not connected</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
          style={{ background: '#6366F1', color: '#fff' }}>
          Connect
        </button>
      </div>
    );
  }

  /* Guest preview — handle entered but no real auth stats */
  const platformStats = platform?.stats;
  if (!platformStats) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center gap-4">
        <Logo color="#6366F1" size={28} />
        <div>
          <p className="text-sm font-bold" style={{ color: textPri }}>{label}</p>
          <p className="text-xs mt-1 font-mono" style={{ color: '#6366F1' }}>@{platform.handle}</p>
          <p className="text-xs mt-1" style={{ color: textSec }}>Sign in to load full stats</p>
        </div>
        {onSaveAccount && (
          <button
            onClick={onSaveAccount}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
            style={{ background: '#6366F1', color: '#fff' }}>
            Save Account
          </button>
        )}
      </div>
    );
  }

  /* Real stats — platformStats has: problems_solved, easy_solved, medium_solved, hard_solved, rating, contests */
  const total  = platformStats.problems_solved ?? 0;
  const easy   = platformStats.easy_solved     ?? 0;
  const medium = platformStats.medium_solved   ?? 0;
  const hard   = platformStats.hard_solved     ?? 0;
  const rating = platformStats.rating          ?? 0;

  const totalOf     = pKey === 'lc' ? '3,200+' : 'problems';
  const easyTotal   = pKey === 'lc' ? 800  : Math.max(easy   * 3, 50);
  const mediumTotal = pKey === 'lc' ? 1800 : Math.max(medium * 3, 50);
  const hardTotal   = pKey === 'lc' ? 600  : Math.max(hard   * 3, 50);

  const diffBars = [
    { key: 'hard',   label: pKey === 'cf' ? 'Div. A' : 'Hard',   color: '#EF4444', solved: hard,   total: hardTotal   },
    { key: 'medium', label: pKey === 'cf' ? 'Div. B' : 'Medium', color: '#F59E0B', solved: medium, total: mediumTotal },
    { key: 'easy',   label: pKey === 'cf' ? 'Div. C' : 'Easy',   color: '#22C55E', solved: easy,   total: easyTotal   },
  ];

  const profileUrl = pKey === 'lc'
    ? `https://leetcode.com/${platform.handle}/`
    : `https://codeforces.com/profile/${platform.handle}`;

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Ambient orb */}
      <div aria-hidden style={{
        position: 'absolute', top: '-40px', right: '-30px', width: '160px', height: '160px',
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${border}`, background: surfLow }}>
        <div className="flex items-center gap-2">
          <Logo color="#6366F1" size={15} />
          <span className="text-[12px] font-bold" style={{ color: '#6366F1' }}>{label}</span>
          {platform.handle && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] hover:underline"
              style={{ color: textSec }}>
              @{platform.handle}
            </a>
          )}
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
          CONNECTED
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-5 flex-grow">
        {/* Solved count */}
        <div className="rounded-2xl p-4" style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)',
          border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}`,
        }}>
          <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5" style={{ color: textSec }}>
            Questions Solved
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-headline font-extrabold leading-none"
              style={{ color: '#6366F1' }}>
              {total}
            </span>
            <span className="text-[11px]" style={{ color: textSec }}>/ {totalOf}</span>
          </div>
          {rating > 0 && (
            <p className="text-[11px] mt-1" style={{ color: textSec }}>
              Rating: <span style={{ color: '#6366F1', fontWeight: 700 }}>{rating}</span>
            </p>
          )}
        </div>

        {/* Difficulty bars */}
        <div className="space-y-3">
          {diffBars.map(({ key, label: dLabel, color, solved, total: tot }) => {
            const pct = tot > 0 ? Math.min(100, Math.round((solved / tot) * 100)) : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold" style={{ color }}>{dLabel}</span>
                  <span className="text-[11px]" style={{ color: textSec }}>
                    <span style={{ color: textPri, fontWeight: 700 }}>{solved}</span>/{tot}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: surfLow }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* View profile link */}
        <div className="mt-auto pt-3 flex justify-end" style={{ borderTop: `1px solid ${border}` }}>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-bold flex items-center gap-1 hover:underline"
            style={{ color: '#6366F1' }}>
            View Profile
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */

function StatsCard({ platform, onSwitch, isDark, lcStats, cfStats, loading, onSaveAccount }) {
  const isFlipped = platform === 'cf';

  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#222326' : '#F4F4F8';
  const border  = isDark ? 'rgba(70,69,84,0.2)' : 'rgba(0,0,0,0.07)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  const faceProps = { surfLow, border, textPri, textSec, isDark, onSaveAccount };

  if (loading) {
    return (
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="h-10 rounded-2xl animate-pulse" style={{ background: surfLow }} />
        <div className="h-96 rounded-3xl animate-pulse" style={{ background: surface }} />
      </div>
    );
  }

  return (
    <div className="lg:col-span-4 flex flex-col gap-4">

      {/* Toggle */}
      <div className="flex p-1 rounded-2xl w-fit gap-1" style={{
        background: surfLow, border: `1px solid ${border}`,
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.2)'
          : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {[{ key: 'lc', label: 'LeetCode', Logo: LCLogo }, { key: 'cf', label: 'Codeforces', Logo: CFLogo }].map(({ key, label, Logo }) => {
          const active = platform === key;
          return (
            <button key={key} onClick={() => onSwitch(key)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all"
              style={active ? {
                background: '#6366F1', color: '#fff',
                boxShadow: '0 4px 14px -3px rgba(99,102,241,0.66)',
              } : { color: textSec }}>
              <Logo color={active ? '#fff' : textSec} size={12} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Flip card */}
      <div className="flip-container" style={{ minHeight: '380px' }}>
        <div className={`flip-card-inner h-full${isFlipped ? ' flipped' : ''}`} style={{ minHeight: '380px' }}>

          <div className="flip-card-front overflow-hidden rounded-3xl" style={{
            background: surface, border: `1px solid ${border}`,
            boxShadow: isDark
              ? '0 20px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 20px 40px -12px rgba(99,102,241,0.12), 0 0 0 1px rgba(255,255,255,0.8)',
          }}>
            <CardFace pKey="lc" platform={lcStats} {...faceProps} />
          </div>

          <div className="flip-card-back overflow-hidden rounded-3xl" style={{
            background: surface, border: `1px solid ${border}`,
            boxShadow: isDark
              ? '0 20px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 20px 40px -12px rgba(99,102,241,0.12), 0 0 0 1px rgba(255,255,255,0.8)',
          }}>
            <CardFace pKey="cf" platform={cfStats} {...faceProps} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default StatsCard;
