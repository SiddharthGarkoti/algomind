import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FAQS = [
  { q: 'How does AlgoMind analyze my profile?',       a: 'We fetch your solved problems from LeetCode and Codeforces via their public APIs, then identify weak topics and generate a personalized daily plan.' },
  { q: 'Is my data stored anywhere?',                  a: 'Currently all data is stored locally in your browser. Full account persistence will be available once backend integration is complete.' },
  { q: 'What programming language does the IDE support?', a: 'The custom IDE currently supports C++ only. LeetCode and Codeforces redirects support all languages those platforms offer.' },
  { q: 'How do I reset my plan?',                      a: 'Visit the Plan page and click "Customise Plan" to modify topics and intensity. You can also use Settings to reconnect your platform handles.' },
  { q: 'Why is my streak not saving?',                  a: 'Streak is stored in localStorage. Clearing browser data will reset it. Backend-persisted streaks are coming with the next major update.' },
];

function SupportPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', msg: '' });
  const [sent, setSent] = useState(false);

  const bg      = isDark
    ? 'radial-gradient(circle at 0% 0%, rgba(99,102,241,0.12) 0%, transparent 45%), #0A0A0B'
    : 'linear-gradient(180deg, #FAFAFF 0%, #F0EDFF 50%, #F8FAFC 100%)';
  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#292a2c' : '#F8FAFC';
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
            className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: '#6366F1' }}>
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back
          </button>
          <button onClick={toggleTheme}
            className="p-2 rounded-xl transition-all hover:opacity-70"
            style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}>
            <span className="material-symbols-outlined text-lg">{isDark ? 'dark_mode' : 'light_mode'}</span>
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Hero */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: '#6366F1' }}>support_agent</span>
          </div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight mb-4" style={{ color: textPri }}>Support Center</h1>
          <p className="text-base leading-relaxed" style={{ color: textSec }}>
            Find answers to common questions or reach out to us directly.
          </p>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: textSec }}>Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: surface, border: `1px solid ${open === i ? 'rgba(99,102,241,0.3)' : border}` }}
                onClick={() => setOpen(open === i ? null : i)}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <p className="text-sm font-semibold pr-4" style={{ color: textPri }}>{q}</p>
                  <span className="material-symbols-outlined text-lg shrink-0 transition-transform duration-200"
                    style={{ color: '#6366F1', transform: open === i ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </div>
                {open === i && (
                  <div className="px-6 pb-5" style={{ borderTop: `1px solid ${border}` }}>
                    <p className="text-sm leading-relaxed pt-4" style={{ color: textSec }}>{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl p-8" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="text-lg font-headline font-bold mb-6" style={{ color: textPri }}>Contact Us</h2>
          {sent ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: '#22C55E', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="font-headline font-bold text-lg mb-2" style={{ color: textPri }}>Message Sent!</p>
              <p style={{ color: textSec }}>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setSent(true); }}>
              {[
                { label: 'Your Name', key: 'name', type: 'text', placeholder: 'Alex Chen' },
                { label: 'Email',     key: 'email', type: 'email', placeholder: 'alex@example.com' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: textSec }}>{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }} />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: textSec }}>Message</label>
                <textarea rows={4} placeholder="Describe your issue or question..." value={form.msg}
                  onChange={e => setForm(f => ({ ...f, msg: e.target.value }))} required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }} />
              </div>
              <button type="submit"
                className="w-full py-4 rounded-2xl font-headline font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 12px 30px -8px rgba(99,102,241,0.4)' }}>
                Send Message
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default SupportPage;
