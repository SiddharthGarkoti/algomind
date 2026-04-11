import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

function ChallengesPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';
  const border  = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', border: `1px solid rgba(99,102,241,0.2)` }}>
          <span className="material-symbols-outlined text-5xl" style={{ color: '#6366F1' }}>military_tech</span>
        </div>
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight mb-3" style={{ color: textPri }}>
            Challenges
          </h1>
          <p className="text-base leading-relaxed max-w-md" style={{ color: textSec }}>
            Competitive challenges are coming soon. Battle your friends, participate in weekly contests, and earn badges.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {['Weekly Contest', 'Friend Duel', 'Speed Coding', 'Blind Mode'].map(f => (
            <div key={f} className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: isDark ? '#1b1c1e' : '#FFFFFF', border: `1px solid ${border}` }}>
              <span className="material-symbols-outlined text-lg" style={{ color: '#6366F1' }}>lock</span>
              <span className="text-sm font-semibold" style={{ color: textSec }}>{f} — Coming Soon</span>
            </div>
          ))}
        </div>
        <button className="px-6 py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)', boxShadow: '0 12px 30px -8px rgba(99,102,241,0.4)' }}>
          Notify Me When Ready
        </button>
      </div>
    </DashboardLayout>
  );
}

export default ChallengesPage;
