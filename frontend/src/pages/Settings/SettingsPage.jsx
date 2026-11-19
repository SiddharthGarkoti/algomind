import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

/* ── Local storage helpers ── */
const NOTIF_KEY = 'algomind_notif_settings';
const EDITOR_LANG_KEY = 'algomind_default_lang';
const EDITOR_FONT_KEY = 'algomind_editor_fontsize';
const EDITOR_TAB_KEY = 'algomind_editor_tabsize';
const EDITOR_BIND_KEY = 'algomind_editor_keybinding';

function loadNotifSettings() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { notifPush: true, notifEmail: false, notifChat: true, chatSound: false, notifStreak: true };
}

/* ── Modern Apple/Fluent Toggle Switch (Zero Emojis) ── */
function ToggleSwitch({ checked, onChange, label, description, disabled = false, isDark, textPri, textSec }) {
  const isOn = Boolean(checked);
  return (
    <div className="flex items-center justify-between py-3.5 px-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
      <div className="pr-4 select-none">
        <p className="text-sm font-medium" style={{ color: textPri }}>{label}</p>
        {description && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: textSec }}>{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        disabled={disabled}
        onClick={() => !disabled && onChange(!isOn)}
        className="w-12 h-6 rounded-full relative shrink-0 transition-colors duration-200 focus:outline-none cursor-pointer disabled:opacity-40"
        style={{
          background: isOn ? '#6366F1' : (isDark ? '#3E3F44' : '#CBD5E1')
        }}
      >
        <span
          className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm transition-all duration-200"
          style={{
            left: isOn ? '26px' : '2px'
          }}
        />
      </button>
    </div>
  );
}

/* ── Modern Card Container ── */
function SettingCard({ title, subtitle, icon, children, surface, surfLow, border, textPri, textSec }) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: surface,
        border: `1px solid ${border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: border, background: surfLow }}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: textPri }}>{title}</h2>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: textSec }}>{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function SettingsPage({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated, logout } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'platforms' | 'editor' | 'appearance' | 'notifications' | 'danger'

  // Profile fields
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Connected platforms
  const [platforms, setPlatforms] = useState({
    leetcode: { handle: '', connected: false, stats: null },
    codeforces: { handle: '', connected: false, stats: null }
  });
  const [lcInput, setLcInput] = useState('');
  const [cfInput, setCfInput] = useState('');
  const [platLoading, setPlatLoading] = useState({ leetcode: false, codeforces: false });
  const [platFeedback, setPlatFeedback] = useState({ leetcode: null, codeforces: null });

  // Notifications
  const [notifs, setNotifs] = useState(loadNotifSettings);

  // Editor Preferences
  const [editorLang, setEditorLang] = useState(() => localStorage.getItem(EDITOR_LANG_KEY) || 'cpp');
  const [editorFont, setEditorFont] = useState(() => localStorage.getItem(EDITOR_FONT_KEY) || '13');
  const [editorTab, setEditorTab] = useState(() => localStorage.getItem(EDITOR_TAB_KEY) || '4');
  const [editorBinding, setEditorBinding] = useState(() => localStorage.getItem(EDITOR_BIND_KEY) || 'standard');
  const [editorSaved, setEditorSaved] = useState(false);

  // Cache clear feedback
  const [cacheCleared, setCacheCleared] = useState(false);

  // Palette tokens
  const surface = isDark ? '#18191C' : '#FFFFFF';
  const surfLow = isDark ? '#212226' : '#F8FAFC';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';

  // Sync profile when user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
    }
  }, [user]);

  // Load platform connection statuses
  const fetchPlatformStatus = useCallback(async () => {
    try {
      const data = await api.get('/analytics/dashboard/');
      const list = data?.platforms || [];
      const updated = {
        leetcode: { handle: '', connected: false, stats: null },
        codeforces: { handle: '', connected: false, stats: null }
      };
      list.forEach(p => {
        const key = p.platform_name?.toLowerCase();
        if (key && updated[key] !== undefined) {
          updated[key] = {
            handle: p.handle,
            connected: true,
            stats: p.stats || null
          };
          if (key === 'leetcode') setLcInput(p.handle);
          if (key === 'codeforces') setCfInput(p.handle);
        }
      });
      setPlatforms(updated);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPlatformStatus();
  }, [fetchPlatformStatus]);

  // Update Notification settings
  const handleToggleNotif = (key, value) => {
    const next = { ...notifs, [key]: value };
    setNotifs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));

    if (key === 'notifPush' && value && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Save Profile Info
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await api.patch('/auth/profile/', {
        username: username.trim(),
        bio: bio.trim()
      });
      if (updateUser) updateUser(res);
      setProfileMsg({ type: 'success', text: 'Profile changes saved successfully' });
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 3500);
    } catch (err) {
      const msg = err?.detail || err?.username?.[0] || 'Failed to update profile';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  // Connect platform
  const handleConnectPlatform = async (platform) => {
    const handle = platform === 'leetcode' ? lcInput.trim() : cfInput.trim();
    if (!handle) return;

    setPlatLoading(prev => ({ ...prev, [platform]: true }));
    setPlatFeedback(prev => ({ ...prev, [platform]: null }));

    try {
      const res = await api.post('/analytics/connect/', {
        platform_name: platform,
        handle: handle
      });
      await fetchPlatformStatus();
      setPlatFeedback(prev => ({
        ...prev,
        [platform]: { type: 'success', text: res?.warning ? 'Saved! Stats synchronizing in background.' : `Connected @${handle}` }
      }));
    } catch (err) {
      const msg = err?.detail || 'Connection failed — check handle spelling';
      setPlatFeedback(prev => ({ ...prev, [platform]: { type: 'error', text: msg } }));
    } finally {
      setPlatLoading(prev => ({ ...prev, [platform]: false }));
      setTimeout(() => setPlatFeedback(prev => ({ ...prev, [platform]: null })), 4500);
    }
  };

  // Disconnect platform
  const handleDisconnectPlatform = async (platform) => {
    if (!window.confirm(`Disconnect ${platform === 'leetcode' ? 'LeetCode' : 'Codeforces'}? Linked stats will be unlinked.`)) return;
    setPlatLoading(prev => ({ ...prev, [platform]: true }));
    try {
      await api.delete('/analytics/connect/', {
        data: { platform_name: platform }
      });
      if (platform === 'leetcode') setLcInput('');
      if (platform === 'codeforces') setCfInput('');
      await fetchPlatformStatus();
      setPlatFeedback(prev => ({
        ...prev,
        [platform]: { type: 'success', text: 'Platform disconnected successfully' }
      }));
    } catch (err) {
      setPlatFeedback(prev => ({
        ...prev,
        [platform]: { type: 'error', text: err?.detail || 'Could not disconnect' }
      }));
    } finally {
      setPlatLoading(prev => ({ ...prev, [platform]: false }));
      setTimeout(() => setPlatFeedback(prev => ({ ...prev, [platform]: null })), 3500);
    }
  };

  // Save Editor Preferences
  const handleSaveEditor = (lang, font, tab, bind) => {
    setEditorLang(lang);
    setEditorFont(font);
    setEditorTab(tab);
    setEditorBinding(bind);
    localStorage.setItem(EDITOR_LANG_KEY, lang);
    localStorage.setItem(EDITOR_FONT_KEY, font);
    localStorage.setItem(EDITOR_TAB_KEY, tab);
    localStorage.setItem(EDITOR_BIND_KEY, bind);
    setEditorSaved(true);
    setTimeout(() => setEditorSaved(false), 2000);
  };

  // Clear local storage / cache
  const handleClearCache = () => {
    const token = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const appStreak = localStorage.getItem('algomind_app_streak');
    
    // Retain auth & streak tokens while scrubbing temp scratchpads & cache
    localStorage.clear();
    if (token) localStorage.setItem('access_token', token);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    if (appStreak) localStorage.setItem('algomind_app_streak', appStreak);
    
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  // Export User Data
  const handleExportData = () => {
    const data = {
      user: {
        id: user?.id,
        username: user?.username,
        email: user?.email,
        streak: user?.streak,
        rating: user?.rating,
        level: user?.level,
        plan_tier: user?.plan_tier
      },
      platforms: platforms,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algomind-data-${user?.username || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to completely delete your account? This action is permanent and cannot be undone.")) {
      if (window.confirm("Double confirmation: This will permanently delete your ratings, friends list, and history. Proceed?")) {
        try {
          await api.delete('/auth/delete-account/');
          logout();
          navigate('/login');
        } catch {
          alert('Failed to delete account. Please contact support.');
        }
      }
    }
  };

  // Plan tier formatting (accurate dynamic data)
  const planTier = (user?.plan_tier || 'basic').toLowerCase();
  const planLabel = planTier === 'pro' ? 'Pro Member' : planTier === 'starter' ? 'Plus Member' : 'Free Tier';
  const planBadgeBg = planTier === 'pro' ? 'rgba(168,85,247,0.12)' : planTier === 'starter' ? 'rgba(59,130,246,0.12)' : 'rgba(34,197,94,0.12)';
  const planBadgeColor = planTier === 'pro' ? '#A855F7' : planTier === 'starter' ? '#3B82F6' : '#22C55E';

  // Navigation Items
  const navTabs = [
    { id: 'account',       label: 'Account & Profile',      icon: 'person' },
    { id: 'platforms',     label: 'Connected Platforms',    icon: 'hub' },
    { id: 'editor',        label: 'IDE & Code Editor',      icon: 'terminal' },
    { id: 'appearance',    label: 'Appearance & Theme',     icon: 'palette' },
    { id: 'notifications', label: 'Notifications',          icon: 'notifications' },
    { id: 'danger',        label: 'Data & Security',        icon: 'shield' },
  ];

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Page Header */}
        <div className="pb-2 border-b" style={{ borderColor: border }}>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight" style={{ color: textPri }}>
            Settings
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: textSec }}>
            Configure your preferences, account details, and developer environment
          </p>
        </div>

        {/* Apple/Fluent Split-View: Nav Sidebar + Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Vertical Nav (Desktop) / Horizontal Pills (Mobile) */}
          <div className="md:col-span-3 space-y-1">
            <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {navTabs.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    style={{
                      background: active ? (isDark ? '#292a2e' : '#F1F5F9') : 'transparent',
                      color: active ? textPri : textSec,
                      fontWeight: active ? 600 : 500
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ color: active ? '#6366F1' : textSec }}
                    >
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="md:col-span-9 space-y-6">
            {/* ── 1. ACCOUNT & PROFILE ─────────────────────────── */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <SettingCard
                  title="Profile Overview"
                  subtitle="Your account identification and public details"
                  icon="badge"
                  surface={surface} surfLow={surfLow} border={border} textPri={textPri} textSec={textSec}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-4 border-b" style={{ borderColor: border }}>
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold font-mono tracking-wider shrink-0"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1', border: `1px solid rgba(99,102,241,0.2)` }}
                    >
                      {(user?.username || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold" style={{ color: textPri }}>{user?.username || 'AlgoMind User'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: planBadgeBg, color: planBadgeColor }}>
                          {planLabel}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: textSec }}>{user?.email || 'No email attached'}</p>
                      <div className="flex items-center gap-4 text-xs pt-1" style={{ color: textSec }}>
                        <span>AlgoMind Rating: <strong style={{ color: textPri }}>{user?.rating || 0}</strong></span>
                        <span>Level: <strong style={{ color: textPri }}>{user?.level || 1}</strong></span>
                        <span>App Streak: <strong style={{ color: textPri }}>{user?.streak || 0}d</strong></span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: textPri }}>Display Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1 focus:ring-indigo-500"
                        style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: textPri }}>Bio / Learning Goal</label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none transition-all focus:ring-1 focus:ring-indigo-500"
                        style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
                        placeholder="e.g. Preparing for FAANG SDE-2 interviews with focus on Graphs and DP."
                      />
                    </div>

                    {profileMsg.text && (
                      <div
                        className="text-xs px-3.5 py-2 rounded-xl flex items-center gap-2"
                        style={{
                          background: profileMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: profileMsg.type === 'success' ? '#22C55E' : '#EF4444'
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {profileMsg.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        <span>{profileMsg.text}</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        style={{ background: '#6366F1', color: '#FFFFFF' }}
                      >
                        {profileSaving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        <span>{profileSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                      </button>
                    </div>
                  </form>
                </SettingCard>

                {/* Subscription Tier Info Card */}
                <SettingCard
                  title="Plan & Membership"
                  subtitle="Your active tier benefits and subscription details"
                  icon="workspace_premium"
                  surface={surface} surfLow={surfLow} border={border} textPri={textPri} textSec={textSec}
                >
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: surfLow, border: `1px solid ${border}` }}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: textPri }}>Current Tier: {planLabel}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ background: planBadgeBg, color: planBadgeColor }}>
                          Active
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: textSec }}>
                        {planTier === 'pro'
                          ? 'Unlimited Socratic MILO AI, real-time stress testing, and competitive features.'
                          : planTier === 'starter'
                          ? 'Extended AI diagnostics and study materials.'
                          : 'Standard curriculum access with core problem sets and verification.'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/plans')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 shrink-0 cursor-pointer"
                      style={{ background: '#6366F1', color: '#FFFFFF' }}
                    >
                      {planTier === 'pro' ? 'View Benefits' : 'Upgrade Plan'}
                    </button>
                  </div>
                </SettingCard>
              </div>
            )}

            {/* ── 2. CONNECTED PLATFORMS ───────────────────────── */}
            {activeTab === 'platforms' && (
              <div className="space-y-6">
                <SettingCard
                  title="Platform Connections"
                  subtitle="Link your external competitive programming profiles to synchronize problem history"
                  icon="hub"
                  surface={surface} surfLow={surfLow} border={border} textPri={textPri} textSec={textSec}
                >
                  {/* LeetCode Card */}
                  <div className="p-4 rounded-xl space-y-3" style={{ background: surfLow, border: `1px solid ${border}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-lg" style={{ color: '#F59E0B' }}>terminal</span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: textPri }}>LeetCode</p>
                          <p className="text-xs" style={{ color: textSec }}>Synchronizes verified solved problems & topic stats</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platforms.leetcode.connected ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Connected
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: isDark ? '#2D2E32' : '#E2E8F0', color: textSec }}>
                            Not Connected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={lcInput}
                        onChange={e => setLcInput(e.target.value)}
                        placeholder="LeetCode username (e.g. tourister)"
                        className="flex-1 px-3.5 py-2 rounded-xl text-xs outline-none"
                        style={{ background: surface, border: `1px solid ${border}`, color: textPri }}
                        onKeyDown={e => { if (e.key === 'Enter') handleConnectPlatform('leetcode'); }}
                      />
                      <button
                        onClick={() => handleConnectPlatform('leetcode')}
                        disabled={platLoading.leetcode || !lcInput.trim()}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        style={{ background: '#6366F1', color: '#FFFFFF' }}
                      >
                        {platLoading.leetcode && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        <span>{platforms.leetcode.connected ? 'Update / Sync' : 'Connect'}</span>
                      </button>
                      {platforms.leetcode.connected && (
                        <button
                          onClick={() => handleDisconnectPlatform('leetcode')}
                          disabled={platLoading.leetcode}
                          className="px-3 py-2 rounded-xl text-xs font-medium hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                          title="Disconnect account"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>

                    {platFeedback.leetcode && (
                      <p className={`text-xs ${platFeedback.leetcode.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {platFeedback.leetcode.text}
                      </p>
                    )}
                  </div>

                  {/* Codeforces Card */}
                  <div className="p-4 rounded-xl space-y-3" style={{ background: surfLow, border: `1px solid ${border}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-lg" style={{ color: '#3B82F6' }}>code</span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: textPri }}>Codeforces</p>
                          <p className="text-xs" style={{ color: textSec }}>Tracks contest rating and problem verifications</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platforms.codeforces.connected ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Connected
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: isDark ? '#2D2E32' : '#E2E8F0', color: textSec }}>
                            Not Connected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={cfInput}
                        onChange={e => setCfInput(e.target.value)}
                        placeholder="Codeforces handle (e.g. tourist)"
                        className="flex-1 px-3.5 py-2 rounded-xl text-xs outline-none"
                        style={{ background: surface, border: `1px solid ${border}`, color: textPri }}
                        onKeyDown={e => { if (e.key === 'Enter') handleConnectPlatform('codeforces'); }}
                      />
                      <button
                        onClick={() => handleConnectPlatform('codeforces')}
                        disabled={platLoading.codeforces || !cfInput.trim()}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        style={{ background: '#6366F1', color: '#FFFFFF' }}
                      >
                        {platLoading.codeforces && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        <span>{platforms.codeforces.connected ? 'Update / Sync' : 'Connect'}</span>
                      </button>
                      {platforms.codeforces.connected && (
                        <button
                          onClick={() => handleDisconnectPlatform('codeforces')}
                          disabled={platLoading.codeforces}
                          className="px-3 py-2 rounded-xl text-xs font-medium hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                          title="Disconnect account"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>

                    {platFeedback.codeforces && (
                      <p className={`text-xs ${platFeedback.codeforces.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {platFeedback.codeforces.text}
                      </p>
                    )}
                  </div>
                </SettingCard>
              </div>
            )}

            {/* ── 3. IDE & CODE EDITOR ─────────────────────────── */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <SettingCard
                  title="Code Workspace Configuration"
                  subtitle="Customize your Monaco code editor behavior, font size, and default runtime"
                  icon="terminal"
                  surface={surface} surfLow={surfLow} border={border} textPri={textPri} textSec={textSec}
                >
                  {/* Default Programming Language */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPri }}>Default Coding Language</p>
                      <p className="text-xs" style={{ color: textSec }}>Standard starter runtime when opening any problem</p>
                    </div>
                    <select
                      value={editorLang}
                      onChange={e => handleSaveEditor(e.target.value, editorFont, editorTab, editorBinding)}
                      className="px-3 py-2 rounded-xl text-xs font-medium outline-none cursor-pointer"
                      style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
                    >
                      <option value="cpp">C++ (GCC 14 / C++20)</option>
                      <option value="python">Python 3.12</option>
                      <option value="java">Java 21 (OpenJDK)</option>
                      <option value="javascript">JavaScript (Node.js)</option>
                      <option value="sql">SQL (PostgreSQL / MySQL)</option>
                    </select>
                  </div>

                  {/* Editor Font Size */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPri }}>Editor Font Size</p>
                      <p className="text-xs" style={{ color: textSec }}>Adjust typography in the Monaco editor view</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['12', '13', '14', '15', '16'].map(size => (
                        <button
                          key={size}
                          onClick={() => handleSaveEditor(editorLang, size, editorTab, editorBinding)}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer"
                          style={{
                            background: editorFont === size ? '#6366F1' : surfLow,
                            color: editorFont === size ? '#FFFFFF' : textPri,
                            border: `1px solid ${editorFont === size ? '#6366F1' : border}`
                          }}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Indentation Size */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPri }}>Tab Indentation</p>
                      <p className="text-xs" style={{ color: textSec }}>Number of spaces per indentation level</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['2', '4'].map(spaces => (
                        <button
                          key={spaces}
                          onClick={() => handleSaveEditor(editorLang, editorFont, spaces, editorBinding)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer"
                          style={{
                            background: editorTab === spaces ? '#6366F1' : surfLow,
                            color: editorTab === spaces ? '#FFFFFF' : textPri,
                            border: `1px solid ${editorTab === spaces ? '#6366F1' : border}`
                          }}
                        >
                          {spaces} Spaces
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Keybinding Mode */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPri }}>Keybinding Mode</p>
                      <p className="text-xs" style={{ color: textSec }}>Standard VSCode editor controls or Vim modal navigation</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: 'standard', label: 'Standard' },
                        { id: 'vim', label: 'Vim' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => handleSaveEditor(editorLang, editorFont, editorTab, mode.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                          style={{
                            background: editorBinding === mode.id ? '#6366F1' : surfLow,
                            color: editorBinding === mode.id ? '#FFFFFF' : textPri,
                            border: `1px solid ${editorBinding === mode.id ? '#6366F1' : border}`
                          }}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editorSaved && (
                    <div className="p-2.5 rounded-xl text-xs text-emerald-500 bg-emerald-500/10 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Editor preferences saved</span>
                    </div>
                  )}
                </SettingCard>
              </div>
            )}

            {/* ── 4. APPEARANCE & THEME ────────────────────────── */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <SettingCard
                  title="Theme & Visuals"
                  subtitle="Choose your preferred visual presentation style"
                  icon="palette"
                  surface={surface} surfLow={surfLow} border={border} textPri={textPri} textSec={textSec}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPri }}>Interface Theme</p>
                      <p className="text-xs" style={{ color: textSec }}>Toggle between deep dark workspace and high-contrast light mode</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { if (!isDark) toggleTheme(); }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                        style={{
                          background: isDark ? '#6366F1' : surfLow,
                          color: isDark ? '#FFFFFF' : textPri,
                          border: `1px solid ${isDark ? '#6366F1' : border}`
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">dark_mode</span>
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => { if (isDark) toggleTheme(); }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                        style={{
                          background: !isDark ? '#6366F1' : surfLow,
                          color: !isDark ? '#FFFFFF' : textPri,
                          border: `1px solid ${!isDark ? '#6366F1' : border}`
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">light_mode</span>
                        <span>Light</span>
                      </button>
                    </div>
                  </div>

                  <div className="py-2 text-xs leading-relaxed" style={{ color: textSec }}>
                    <span>Note: Theme preferences persist globally across all views and sync with local browser storage.</span>
                  </div>
                </SettingCard>
              </div>
            )}

            {/* ── 5. NOTIFICATIONS & ALERTS ────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <SettingCard
                  title="Notification Center"
                  subtitle="Configure system alerts, daily streak reminders, and friend messaging popups"
                  icon="notifications"
                  surface={surface} surfLow={surfLow} border={border} textPri={textPri} textSec={textSec}
                >
                  <div className="divide-y" style={{ borderColor: border }}>
                    <ToggleSwitch
                      label="Push Notifications"
                      description="Receive browser alerts when friends invite you to a challenge or when streak resets"
                      checked={notifs.notifPush}
                      onChange={v => handleToggleNotif('notifPush', v)}
                      isDark={isDark} textPri={textPri} textSec={textSec}
                    />
                    <ToggleSwitch
                      label="Streak Safeguard Alerts"
                      description="Notify at 8 PM if you have not completed your daily problem on AlgoMind"
                      checked={notifs.notifStreak}
                      onChange={v => handleToggleNotif('notifStreak', v)}
                      isDark={isDark} textPri={textPri} textSec={textSec}
                    />
                    <ToggleSwitch
                      label="Friend Message Popups"
                      description="Display a subtle banner toast when incoming direct messages arrive"
                      checked={notifs.notifChat}
                      onChange={v => handleToggleNotif('notifChat', v)}
                      isDark={isDark} textPri={textPri} textSec={textSec}
                    />
                    <ToggleSwitch
                      label="Sound Chimes"
                      description="Play audio feedback upon successful code submission and message receipt"
                      checked={notifs.chatSound}
                      onChange={v => handleToggleNotif('chatSound', v)}
                      isDark={isDark} textPri={textPri} textSec={textSec}
                    />
                    <ToggleSwitch
                      label="Weekly Digest Email"
                      description="Receive a weekly recap of curriculum mastery gains and consistency stats"
                      checked={notifs.notifEmail}
                      onChange={v => handleToggleNotif('notifEmail', v)}
                      isDark={isDark} textPri={textPri} textSec={textSec}
                    />
                  </div>
                </SettingCard>
              </div>
            )}

            {/* ── 6. DATA & SECURITY (DANGER ZONE) ─────────────── */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <SettingCard
                  title="Data Management"
                  subtitle="Export your progress or clear local client cache"
                  icon="database"
                  surface={surface} surfLow={surfLow} border={border} textPri={textPri} textSec={textSec}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPri }}>Export Progress Data</p>
                      <p className="text-xs" style={{ color: textSec }}>Download a machine-readable JSON copy of your metrics and problem history</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>Export JSON</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPri }}>Clear Local Cache</p>
                      <p className="text-xs" style={{ color: textSec }}>Purge temporary editor buffers, cached queries, and local states</p>
                    </div>
                    <button
                      onClick={handleClearCache}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
                    >
                      <span className="material-symbols-outlined text-sm">cleaning_services</span>
                      <span>Purge Cache</span>
                    </button>
                  </div>

                  {cacheCleared && (
                    <div className="p-2.5 rounded-xl text-xs text-emerald-500 bg-emerald-500/10 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Local cache purged successfully</span>
                    </div>
                  )}
                </SettingCard>

                {/* Account Deletion */}
                <SettingCard
                  title="Account Deletion"
                  subtitle="Permanent account decommissioning and data erasure"
                  icon="shield"
                  surface={surface} surfLow={surfLow} border={border} textPri={textPri} textSec={textSec}
                >
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-red-500">Delete AlgoMind Account</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: textSec }}>
                        Once deleted, your account cannot be recovered. All submission records, ratings, and stats will be permanently wiped.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all shrink-0 cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                </SettingCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
