import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `We collect the following information to provide our services:
• Platform usernames (LeetCode, Codeforces) that you voluntarily provide
• Usage data (problems viewed, time spent) stored locally in your browser
• Theme preferences stored in localStorage
We do NOT collect passwords, payment information, or personally identifiable information beyond what you provide.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `Your data is used solely to:
• Analyze your coding performance and identify weak areas
• Generate personalized daily practice plans
• Track your streak and progress
• Customize your theme and interface preferences
We do not sell, share, or transmit your data to third parties.`,
  },
  {
    title: '3. Data Storage',
    content: `Currently all data is stored locally in your browser using localStorage and sessionStorage. This means:
• Clearing browser data will reset your preferences and progress
• Your data never leaves your device in the current version
• Backend persistence is planned for future releases (will require explicit consent)`,
  },
  {
    title: '4. Third-Party Services',
    content: `AlgoMind may link to or redirect you to third-party platforms:
• LeetCode (leetcode.com) — for problem solving
• Codeforces (codeforces.com) — for problem solving
• Google Fonts — for typography
These services have their own privacy policies which we encourage you to review.`,
  },
  {
    title: '5. Cookies',
    content: `We use minimal browser storage:
• localStorage: theme preference, streak data, last visit date
• No tracking cookies, advertising cookies, or third-party analytics
• No cookie consent required as we do not use non-essential cookies`,
  },
  {
    title: '6. Your Rights',
    content: `You have the right to:
• Access all data stored locally (via browser developer tools)
• Delete all your data by clearing browser localStorage
• Opt out at any time by simply not using the service
• Contact us with any privacy concerns via the Support page`,
  },
  {
    title: '7. Changes to This Policy',
    content: `We may update this Privacy Policy as we add backend features. Changes will be announced via the Community page. Continued use of AlgoMind after changes constitutes acceptance of the updated policy.`,
  },
];

function PrivacyPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();

  const bg      = isDark
    ? 'radial-gradient(circle at 0% 0%, rgba(99,102,241,0.1) 0%, transparent 40%), #0A0A0B'
    : 'linear-gradient(180deg, #FAFAFF 0%, #F5F3FF 100%)';
  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const border  = isDark ? 'rgba(70,69,84,0.2)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#475569';

  return (
    <div className="min-h-screen font-body" style={{ background: bg, color: textPri }}>
      {/* Navbar */}
      <nav className="w-full h-16 px-8 flex items-center justify-between sticky top-0 z-50"
        style={{ background: isDark ? 'rgba(10,10,11,0.9)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${border}` }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
            <span className="material-symbols-outlined text-white text-base">hub</span>
          </div>
          <span className="font-headline font-extrabold text-xl tracking-tighter" style={{ color: textPri }}>AlgoMind</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-70"
            style={{ color: '#6366F1' }}>
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back
          </button>
          <button onClick={toggleTheme}
            className="p-2 rounded-xl transition-all hover:opacity-70"
            style={{ background: isDark ? '#292a2c' : '#F1F5F9', border: `1px solid ${border}`, color: textPri }}>
            <span className="material-symbols-outlined text-lg">{isDark ? 'dark_mode' : 'light_mode'}</span>
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6366F1' }}>Legal</p>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight mb-4" style={{ color: textPri }}>Privacy Policy</h1>
          <p className="text-sm" style={{ color: textSec }}>
            Last updated: April 2026 · AlgoMind — Built by Bhayankar Coders
          </p>
          <p className="text-base leading-relaxed mt-4" style={{ color: textSec }}>
            At AlgoMind, we take your privacy seriously. This policy explains what data we collect, how we use it, and what rights you have. As an early-stage platform, we keep things minimal and transparent.
          </p>
        </div>

        <div className="space-y-4">
          {SECTIONS.map(({ title, content }) => (
            <div key={title} className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
              <h2 className="font-headline font-bold text-base mb-3" style={{ color: textPri }}>{title}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: textSec }}>{content}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="text-sm mb-4" style={{ color: textSec }}>Have questions about your privacy?</p>
          <button onClick={() => navigate('/support')}
            className="px-6 py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
}

export default PrivacyPage;
