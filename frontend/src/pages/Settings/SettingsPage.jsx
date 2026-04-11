import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

function SettingsPage({ theme, toggleTheme }) {
  const isDark   = theme === 'dark';
  const navigate = useNavigate();

  // Notification settings
  const [notifPush,   setNotifPush]   = useState(true);
  const [notifEmail,  setNotifEmail]  = useState(false);
  const [notifChat,   setNotifChat]   = useState(true);    // show message popup
  const [chatSound,   setChatSound]   = useState(false);
  const [notifStreak, setNotifStreak] = useState(true);

  // Platform
  const [lcUser, setLcUser] = useState('your_leetcode');
  const [cfUser, setCfUser] = useState('your_cf_handle');

  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  const Section = ({ title, children }) => (
    <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${border}`, background: surfLow }}>
        <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textSec }}>{title}</h2>
      </div>
      <div className="divide-y" style={{ borderColor: border }}>{children}</div>
    </div>
  );

  const Toggle = ({ label, desc, value, onChange, accentColor }) => (
    <div className="px-6 py-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: textPri }}>{label}</p>
        {desc && <p className="text-[11px] mt-0.5" style={{ color: textSec }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full relative shrink-0 transition-colors duration-200"
        style={{ background: value ? (accentColor || '#6366F1') : (isDark ? '#343537' : '#E2E8F0') }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm transition-all duration-200"
          style={{ left: value ? '26px' : '2px' }}
        />
      </button>
    </div>
  );

  const InputRow = ({ label, value, onChange, placeholder }) => (
    <div className="px-6 py-4 flex items-end gap-4">
      <div className="flex-grow">
        <p className="text-sm font-semibold mb-1.5" style={{ color: textPri }}>{label}</p>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
        />
      </div>
      <button
        className="px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-80 shrink-0 transition-all"
        style={{ background: '#6366F1', color: '#fff' }}
      >
        Save
      </button>
    </div>
  );

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Manage your preferences and account</p>
        </div>

        {/* Appearance */}
        <Section title="Appearance">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: textPri }}>Theme</p>
              <p className="text-[11px] mt-0.5" style={{ color: textSec }}>Switch between dark and light mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-80 transition-all"
              style={{ background: isDark ? '#292a2c' : '#E2E8F0', color: textPri }}
            >
              {isDark ? '🌙 Dark' : '☀️ Light'}
              <span className="material-symbols-outlined text-sm">sync</span>
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Toggle
            label="Push Notifications"
            desc="Alerts for streaks, challenges, and system updates"
            value={notifPush}
            onChange={setNotifPush}
          />
          <Toggle
            label="Message Popup"
            desc="Show a popup notification when a friend sends you a message"
            value={notifChat}
            onChange={setNotifChat}
            accentColor="#A855F7"
          />
          <Toggle
            label="Chat Sound"
            desc="Play a sound when you receive a new message"
            value={chatSound}
            onChange={setChatSound}
            accentColor="#A855F7"
          />
          <Toggle
            label="Streak Reminder"
            desc="Daily reminder if you haven't solved a problem yet"
            value={notifStreak}
            onChange={setNotifStreak}
            accentColor="#F59E0B"
          />
          <Toggle
            label="Email Digest"
            desc="Weekly progress summary sent to your email"
            value={notifEmail}
            onChange={setNotifEmail}
          />
        </Section>

        {/* Platform Connections */}
        <Section title="Platform Connections">
          <InputRow label="LeetCode Username" value={lcUser} onChange={setLcUser} placeholder="your_leetcode_handle" />
          <InputRow label="Codeforces Handle" value={cfUser} onChange={setCfUser} placeholder="your_cf_handle" />
        </Section>

        {/* Plan */}
        <Section title="Subscription">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: textPri }}>Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Basic (Free)</span>
              </div>
            </div>
            <button
              className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', boxShadow: '0 8px 20px -6px rgba(245,158,11,0.35)' }}
              onClick={() => navigate('/plans')}
            >
              <span>⚡</span> View Plans
            </button>
          </div>
        </Section>

        {/* Account */}
        <Section title="Account">
          <div className="px-6 py-4">
            <button className="text-sm font-semibold text-red-500 hover:opacity-70 transition-opacity">
              Delete Account
            </button>
            <p className="text-[11px] mt-1" style={{ color: textSec }}>This action is permanent and cannot be undone</p>
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;
