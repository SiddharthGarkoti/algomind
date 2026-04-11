/* ── Platform data — purple shades only ── */
const DATA = {
  lc: {
    label:    'LeetCode',
    color:    '#6366F1',
    solved:   205,
    solvedOf: '3,200+',
    hard:     { solved: 25,  total: 600  },
    medium:   { solved: 100, total: 1800 },
    easy:     { solved: 80,  total: 800  },
    streak:   14,
  },
  cf: {
    label:    'Codeforces',
    color:    '#6366F1',
    solved:   84,
    solvedOf: 'problems',
    hard:     { solved: 8,  total: 221, label: 'Div. A' },
    medium:   { solved: 32, total: 337, label: 'Div. B' },
    easy:     { solved: 44, total: 135, label: 'Div. C' },
    streak:   5,
  },
};

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

/* ── Card face — shared layout for LC and CF ── */
function CardFace({ pKey, surfLow, border, textPri, textSec, isDark }) {
  const d = DATA[pKey];
  const Logo = pKey === 'lc' ? LCLogo : CFLogo;

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* 3D ambient orb — top-right glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-30px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${border}`, background: surfLow }}
      >
        <div className="flex items-center gap-2">
          <Logo color={d.color} size={15} />
          <span className="text-[12px] font-bold" style={{ color: d.color }}>{d.label}</span>
        </div>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${d.color}15`, color: d.color }}
        >
          CONNECTED
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-5 flex-grow">

        {/* Solved count with subtle 3D card inset */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)',
            border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}`,
            boxShadow: isDark
              ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 12px -4px rgba(0,0,0,0.3)'
              : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px -4px rgba(99,102,241,0.1)',
          }}
        >
          <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5" style={{ color: textSec }}>
            Questions Solved
          </p>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-5xl font-headline font-extrabold leading-none"
              style={{
                color: d.color,
                textShadow: isDark
                  ? '0 2px 8px rgba(99,102,241,0.4)'
                  : '0 2px 8px rgba(99,102,241,0.2)',
              }}
            >
              {d.solved}
            </span>
            <span className="text-[11px]" style={{ color: textSec }}>/ {d.solvedOf}</span>
          </div>
        </div>

        {/* Difficulty bars */}
        <div className="space-y-3">
          {[
            { key: 'hard',   label: d.hard.label   ?? 'Hard',   color: '#EF4444', data: d.hard   },
            { key: 'medium', label: d.medium.label ?? 'Medium', color: '#F59E0B', data: d.medium },
            { key: 'easy',   label: d.easy.label   ?? 'Easy',   color: '#22C55E', data: d.easy   },
          ].map(({ key, label, color, data }) => {
            const pct = Math.round((data.solved / data.total) * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold" style={{ color }}>{label}</span>
                  <span className="text-[11px]" style={{ color: textSec }}>
                    <span style={{ color: textPri, fontWeight: 700 }}>{data.solved}</span>/{data.total}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{
                    background: surfLow,
                    boxShadow: isDark ? 'inset 0 1px 2px rgba(0,0,0,0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: color,
                      boxShadow: `0 0 6px 0 ${color}55`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak — bottom */}
        <div
          className="flex items-center gap-2 mt-auto pt-3"
          style={{ borderTop: `1px solid ${border}` }}
        >
          <span>🔥</span>
          <span className="text-sm font-extrabold" style={{ color: d.color }}>{d.streak}d</span>
          <span className="text-[11px]" style={{ color: textSec }}>streak</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */

function StatsCard({ platform, onSwitch, isDark }) {
  /* Derive flip state directly from platform — LC=front, CF=back */
  const isFlipped = platform === 'cf';

  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#222326' : '#F4F4F8';
  const border  = isDark ? 'rgba(70,69,84,0.2)' : 'rgba(0,0,0,0.07)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  const faceProps = { surfLow, border, textPri, textSec, isDark };

  return (
    <div className="lg:col-span-4 flex flex-col gap-4">

      {/* ── Toggle ── */}
      <div
        className="flex p-1 rounded-2xl w-fit gap-1"
        style={{
          background: surfLow,
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.2)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {(['lc', 'cf']).map(p => {
          const active = platform === p;
          const Logo   = p === 'lc' ? LCLogo : CFLogo;
          return (
            <button
              key={p}
              onClick={() => onSwitch(p)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all"
              style={active
                ? {
                    background: DATA[p].color,
                    color: '#fff',
                    boxShadow: `0 4px 14px -3px ${DATA[p].color}66`,
                  }
                : { color: textSec }
              }
            >
              <Logo color={active ? '#fff' : textSec} size={12} />
              {DATA[p].label}
            </button>
          );
        })}
      </div>

      {/* ── Flip card — LC front / CF back ── */}
      <div className="flip-container" style={{ minHeight: '380px' }}>
        <div
          className={`flip-card-inner h-full${isFlipped ? ' flipped' : ''}`}
          style={{ minHeight: '380px' }}
        >

          {/* Front: LeetCode */}
          <div
            className="flip-card-front overflow-hidden rounded-3xl"
            style={{
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: isDark
                ? '0 20px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
                : '0 20px 40px -12px rgba(99,102,241,0.12), 0 0 0 1px rgba(255,255,255,0.8)',
            }}
          >
            <CardFace pKey="lc" {...faceProps} />
          </div>

          {/* Back: Codeforces */}
          <div
            className="flip-card-back overflow-hidden rounded-3xl"
            style={{
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: isDark
                ? '0 20px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
                : '0 20px 40px -12px rgba(99,102,241,0.12), 0 0 0 1px rgba(255,255,255,0.8)',
            }}
          >
            <CardFace pKey="cf" {...faceProps} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default StatsCard;
