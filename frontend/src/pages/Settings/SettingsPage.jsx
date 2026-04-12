import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../utils/api.js';

/* ── PlatformRow — defined OUTSIDE SettingsPage so React never remounts it ── */
function PlatformRow({
  label, value, onChange, onSave, saving, status, warn,
  surfLow, border, textPri,
}) {
  return (
    <div className="px-6 py-4 flex items-end gap-4">
      <div className="flex-grow">
        <p className="text-sm font-semibold mb-1.5" style={{ color: textPri }}>{label}</p>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Enter your ${label.toLowerCase()}`}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
          onKeyDown={e => { if (e.key === 'Enter') onSave(); }}
        />
        {status === 'connecting'  && <p className="text-[10px] mt-1" style={{ color: '#6366F1' }}>Connecting…</p>}
        {status === 'saved'       && <p className="text-[10px] text-green-500 mt-1">Connected successfully — stats loaded!</p>}
        {status === 'saved_warn'  && <p className="text-[10px] text-amber-500 mt-1">Handle saved! Stats may take a moment to load — try Refresh in Analytics.</p>}
        {status === 'invalid'     && <p className="text-[10px] text-red-500 mt-1">Handle not found — check the username</p>}
        {status === 'error'       && <p className="text-[10px] text-red-500 mt-1">{warn || 'Connection failed — try again'}</p>}
      </div>
      <button
        onClick={onSave}
        disabled={saving || !value.trim()}
        className="px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-80 shrink-0 transition-all disabled:opacity-50 flex items-center gap-1.5"
        style={{ background: '#6366F1', color: '#fff' }}
      >
        {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

/* ── Toggle — also outside to avoid same issue ── */
function Toggle({ label, desc, value, onChange, accentColor, isDark, textPri, textSec }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: textPri }}>{label}</p>
        {desc && <p className="text-[11px] mt-0.5" style={{ color: textSec }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full relative shrink-0 transition-colors duration-200"
        style={{ background: value ? (accentColor || '#6366F1') : (isDark ? '#343537' : '#E2E8F0') }}>
        <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm transition-all duration-200"
          style={{ left: value ? '26px' : '2px' }} />
      </button>
    </div>
  );
}

function Section({ title, children, surface, surfLow, border, textSec }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${border}`, background: surfLow }}>
        <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textSec }}>{title}</h2>
      </div>
      <div className="divide-y" style={{ borderColor: border }}>{children}</div>
    </div>
  );
}

/* ── Main page ── */
function SettingsPage({ theme, toggleTheme }) {
  const isDark   = theme === 'dark';
  const navigate = useNavigate();

  // Notification settings
  const [notifPush,   setNotifPush]   = useState(true);
  const [notifEmail,  setNotifEmail]  = useState(false);
  const [notifChat,   setNotifChat]   = useState(true);
  const [chatSound,   setChatSound]   = useState(false);
  const [notifStreak, setNotifStreak] = useState(true);

  // Platform handles
  const [lcUser,   setLcUser]   = useState('');
  const [cfUser,   setCfUser]   = useState('');
  const [lcSaving, setLcSaving] = useState(false);
  const [cfSaving, setCfSaving] = useState(false);
  const [lcStatus, setLcStatus] = useState('');
  const [cfStatus, setCfStatus] = useState('');
  const [lcWarn,   setLcWarn]   = useState('');
  const [cfWarn,   setCfWarn]   = useState('');

  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#292a2c' : '#F8FAFC';
  const border  = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  // Load existing platform handles on mount
  useEffect(() => {
    api.get('/analytics/dashboard/').then(data => {
      (data?.platforms ?? []).forEach(p => {
        if (p.platform_name === 'leetcode')   setLcUser(p.handle);
        if (p.platform_name === 'codeforces') setCfUser(p.handle);
      });
    }).catch(() => {});
  }, []);

  const savePlatform = useCallback(async (platform, handle, setSaving, setStatus, setWarn) => {
    if (!handle.trim()) return;
    setSaving(true);
    setStatus('connecting');
    setWarn('');
    try {
      const res = await api.post('/analytics/connect/', {
        platform_name: platform,
        handle: handle.trim(),
      });
      if (res?.warning) {
        setWarn(res.warning);
        setStatus('saved_warn');
        setTimeout(() => { setStatus(''); setWarn(''); }, 7000);
      } else {
        setStatus('saved');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      const msg = err?.detail || '';
      if (msg.toLowerCase().includes('not found')) {
        setStatus('invalid');
      } else {
        setStatus('error');
        setWarn(msg || 'Connection failed');
      }
      setTimeout(() => { setStatus(''); setWarn(''); }, 4000);
    } finally {
      setSaving(false);
    }
  }, []);

  const handleLcSave = useCallback(() => savePlatform('leetcode',   lcUser, setLcSaving, setLcStatus, setLcWarn), [savePlatform, lcUser]);
  const handleCfSave = useCallback(() => savePlatform('codeforces', cfUser, setCfSaving, setCfStatus, setCfWarn), [savePlatform, cfUser]);

  const sharedProps = { surfLow, border, textPri, textSec };

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Manage your preferences and account</p>
        </div>

        {/* Appearance */}
        <Section title="Appearance" surface={surface} surfLow={surfLow} border={border} textSec={textSec}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: textPri }}>Theme</p>
              <p className="text-[11px] mt-0.5" style={{ color: textSec }}>Switch between dark and light mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-80 transition-all"
              style={{ background: isDark ? '#292a2c' : '#E2E8F0', color: textPri }}>
              {isDark ? '🌙 Dark' : '☀️ Light'}
              <span className="material-symbols-outlined text-sm">sync</span>
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" surface={surface} surfLow={surfLow} border={border} textSec={textSec}>
          <Toggle label="Push Notifications" desc="Alerts for streaks, challenges, and system updates"
            value={notifPush} onChange={setNotifPush} isDark={isDark} textPri={textPri} textSec={textSec} />
          <Toggle label="Message Popup" desc="Show a popup when a friend sends you a message"
            value={notifChat} onChange={setNotifChat} accentColor="#A855F7" isDark={isDark} textPri={textPri} textSec={textSec} />
          <Toggle label="Chat Sound" desc="Play a sound on new messages"
            value={chatSound} onChange={setChatSound} accentColor="#A855F7" isDark={isDark} textPri={textPri} textSec={textSec} />
          <Toggle label="Streak Reminder" desc="Daily reminder if you haven't solved a problem"
            value={notifStreak} onChange={setNotifStreak} accentColor="#F59E0B" isDark={isDark} textPri={textPri} textSec={textSec} />
          <Toggle label="Email Digest" desc="Weekly progress summary sent to your email"
            value={notifEmail} onChange={setNotifEmail} isDark={isDark} textPri={textPri} textSec={textSec} />
        </Section>

        {/* Platform Connections */}
        <Section title="Platform Connections" surface={surface} surfLow={surfLow} border={border} textSec={textSec}>
          <PlatformRow
            label="LeetCode Username"
            value={lcUser}
            onChange={setLcUser}
            onSave={handleLcSave}
            saving={lcSaving}
            status={lcStatus}
            warn={lcWarn}
            {...sharedProps}
          />
          <PlatformRow
            label="Codeforces Handle"
            value={cfUser}
            onChange={setCfUser}
            onSave={handleCfSave}
            saving={cfSaving}
            status={cfStatus}
            warn={cfWarn}
            {...sharedProps}
          />
        </Section>

        {/* Subscription */}
        <Section title="Subscription" surface={surface} surfLow={surfLow} border={border} textSec={textSec}>
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
              onClick={() => navigate('/plans')}>
              <span>⚡</span> View Plans
            </button>
          </div>
        </Section>

        {/* Account */}
        <Section title="Account" surface={surface} surfLow={surfLow} border={border} textSec={textSec}>
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
