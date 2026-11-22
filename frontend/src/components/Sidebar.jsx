import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SignInModal from './login/SignInModal.jsx';

function Sidebar({ isDark, navigate: navProp, onOpenChat }) {
  const navigate       = navProp || useNavigate();
  const { user, isGuest, logout } = useAuth();

  const [isPinned,       setIsPinned]       = useState(false);
  const [isHovered,      setIsHovered]      = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isProfileOpen,  setIsProfileOpen]  = useState(false);
  const [showSignIn,     setShowSignIn]     = useState(false);
  const isExpanded = isPinned || isHovered;

  const profileMenuRef = useRef(null);
  const profileBtnRef  = useRef(null);

  const bgColor   = isDark ? '#121315' : '#FFFFFF';
  const borderCol = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.07)';
  const textMuted = isDark ? '#908fa0' : '#64748B';
  const textPri   = isDark ? '#F8FAFC' : '#0F172A';

  useEffect(() => {
    const fn = (e) => {
      if (!profileBtnRef.current?.contains(e.target) && !profileMenuRef.current?.contains(e.target))
        setIsProfileOpen(false);
    };
    window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, []);

  const NAV_TOP = [
    { path: '/dashboard', icon: 'grid_view',  label: 'Dashboard' },
    { path: '/analytics', icon: 'analytics',  label: 'Analytics' },
  ];

  const NAV_BOTTOM = [
    { path: '/challenges', icon: 'military_tech', label: 'Challenges' },
    { path: '/friends',    icon: 'group',          label: 'Friends'    },
    { path: '/community',  icon: 'public',         label: 'Community', faded: true },
  ];

  const PRACTICE_ITEMS = [
    { path: '/plan-view',  icon: 'edit_note',         label: 'Plan' },
    { path: '/arena',      icon: 'workspace_premium', label: 'Arena' },
    { path: '/resources',  icon: 'menu_book',         label: 'Resources' },
  ];

  // Build avatar URL only for authenticated users
  const avatarUrl = user
    ? (user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username ?? 'user')}`)
    : null;

  const handleLogout = async (e) => {
    e?.stopPropagation?.();
    setIsProfileOpen(false);
    await logout();
  };

  const NavItem = ({ path, icon, label, faded = false }) => (
    <NavLink to={path} end={path === '/dashboard'}
      className={({ isActive }) => `nav-item${isActive ? ' active-item' : ''}`}
      style={({ isActive }) => ({
        color: isActive ? (isDark ? '#FFFFFF' : '#4F46E5') : textMuted,
        backgroundColor: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
        opacity: faded ? 0.45 : 1,
      })}
    >
      <div className="icon-container">
        <span className="material-symbols-outlined !text-[20px]">{icon}</span>
      </div>
      <div className="text-[13px] font-medium sidebar-content-text">{label}</div>
    </NavLink>
  );

  return (
    <>
    <aside
      id="sidebar"
      className={`flex flex-col shrink-0${isExpanded ? ' expanded' : ''}`}
      style={{ background: bgColor, borderRight: `1px solid ${borderCol}` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); if (!isPinned) { setIsPracticeOpen(false); } }}
    >
      {/* Brand */}
      <div className="flex items-center h-16 shrink-0 overflow-hidden" style={{ borderBottom: `1px solid ${borderCol}` }}>
        <div className="w-[72px] h-16 flex items-center justify-center shrink-0">
          <button
            className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors hover:bg-white/5"
            style={{ color: textMuted }}
            onClick={e => { e.stopPropagation(); setIsPinned(p => !p); }}
            title={isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}
          >
            <span className="material-symbols-outlined !text-[20px]">{isPinned ? 'push_pin' : 'menu'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2.5 sidebar-content-text">
          <img
            src="/logo-symbol.png"
            alt="AlgoMind"
            className="h-8 w-8 object-contain shrink-0 drop-shadow-md"
          />
          <span className="text-base font-bold tracking-tight" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            AlgoMind
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow py-3 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1">
          {NAV_TOP.map(item => <NavItem key={item.path} {...item} />)}

          {/* Practice submenu */}
          <div className={`${isPracticeOpen ? 'submenu-active' : ''}`}>
            <div
              className="nav-item cursor-pointer"
              style={{ color: textMuted }}
              onClick={e => { e.stopPropagation(); if (isExpanded) setIsPracticeOpen(p => !p); }}
            >
              <div className="icon-container"><span className="material-symbols-outlined !text-[20px]">code</span></div>
              <div className="text-[13px] font-medium flex-grow text-left sidebar-content-text">Practice</div>
              <div className="sidebar-content-text pr-3">
                <span className={`material-symbols-outlined text-sm transition-transform duration-200${isPracticeOpen ? ' rotate-180' : ''}`}>expand_more</span>
              </div>
            </div>
            <div className="submenu-container">
              <div className="py-1 space-y-1">
                {PRACTICE_ITEMS.map(({ path, icon, label }) => (
                  <NavLink key={path} to={path}
                    className="flex items-center h-9 pl-[64px] pr-4 text-[13px] transition-colors gap-2.5 rounded-lg mx-2"
                    style={({ isActive }) => ({
                      color: isActive ? (isDark ? '#FFFFFF' : '#4F46E5') : textMuted,
                      backgroundColor: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                      fontWeight: isActive ? '600' : '400',
                    })}
                  >
                    <span className="material-symbols-outlined !text-[18px]">{icon}</span>
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {NAV_BOTTOM.map(item => <NavItem key={item.path} {...item} />)}

          {/* MILO (AI Mentor) */}
          <NavLink to="/chatbot"
            className={({ isActive }) => `nav-item${isActive ? ' active-item' : ''}`}
            style={({ isActive }) => ({
              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: isActive ? (isDark ? '#FFFFFF' : '#4F46E5') : textMuted,
            })}
          >
            <div className="icon-container flex items-center justify-center">
              <img src="/milo.png" alt="MILO" className="w-5 h-5 rounded-md object-cover" />
            </div>
            <div className="text-[13px] font-semibold sidebar-content-text">MILO</div>
          </NavLink>
        </div>
      </nav>

      {/* Bottom section — differs for guest vs authenticated */}
      {isGuest && !user ? (
        /* Guest: sign-in nav-item row + guest identity row */
        <div style={{ borderTop: `1px solid ${borderCol}` }} className="shrink-0 py-2">
          {/* Sign In — styled exactly like a nav item so it collapses properly */}
          <button
            onClick={() => setShowSignIn(true)}
            className="nav-item text-left transition-all hover:opacity-90 w-[calc(100%-16px)]"
            style={{ color: '#6366F1', background: 'rgba(99,102,241,0.06)' }}
          >
            <div className="icon-container">
              <span className="material-symbols-outlined text-lg" style={{ color: '#6366F1' }}>login</span>
            </div>
            <div className="sidebar-content-text">
              <p className="text-xs font-bold leading-none" style={{ color: '#6366F1' }}>Sign In</p>
              <p className="text-[9px] mt-0.5 leading-none" style={{ color: textMuted }}>Save your progress</p>
            </div>
          </button>
          {/* Guest identity row */}
          <button
            className="nav-item text-left opacity-50 cursor-default w-[calc(100%-16px)]"
            style={{ color: textMuted }}
            tabIndex={-1}
          >
            <div className="icon-container">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${borderCol}` }}>
                <span className="material-symbols-outlined text-lg" style={{ color: textMuted, fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
            </div>
            <div className="sidebar-content-text flex-grow truncate text-left">
              <p className="text-xs font-bold truncate" style={{ color: textMuted }}>Guest</p>
              <p className="text-[9px]" style={{ color: textMuted }}>Not signed in</p>
            </div>
          </button>
        </div>

      ) : (
        /* Authenticated: full profile dropdown */
        <div style={{ borderTop: `1px solid ${borderCol}` }} className="relative shrink-0">
          {/* Profile Dropdown */}
          <div
            ref={profileMenuRef}
            className={`absolute bottom-full left-2 w-56 mb-2 rounded-2xl shadow-xl overflow-hidden p-1.5 z-[70]${isProfileOpen ? ' block' : ' hidden'}`}
            style={{
              background: isDark ? '#18191c' : '#FFFFFF',
              border: `1px solid ${borderCol}`,
              boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.08)',
            }}
          >
            {/* Plan Tier Status Card */}
            {user?.plan_tier === 'pro' ? (
              <div
                className="rounded-xl p-2.5 mb-1 cursor-pointer hover:opacity-90 transition-all border"
                style={{
                  background: isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.05)',
                  borderColor: isDark ? 'rgba(124, 58, 237, 0.25)' : 'rgba(124, 58, 237, 0.2)',
                }}
                onClick={() => { setIsProfileOpen(false); navigate('/plans'); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-base shrink-0" style={{ color: '#A78BFA' }}>
                      workspace_premium
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate" style={{ color: textPri }}>
                        Pro Active
                      </p>
                      <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: textMuted }}>
                        All features unlocked
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold flex items-center shrink-0 ml-1" style={{ color: '#A78BFA' }}>
                    Manage <span className="material-symbols-outlined text-xs ml-0.5">chevron_right</span>
                  </span>
                </div>
              </div>
            ) : user?.plan_tier === 'plus' ? (
              <div
                className="rounded-xl p-2.5 mb-1 cursor-pointer hover:opacity-90 transition-all border"
                style={{
                  background: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)',
                }}
                onClick={() => { setIsProfileOpen(false); navigate('/plans'); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-base shrink-0" style={{ color: '#6366F1' }}>
                      bolt
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate" style={{ color: textPri }}>
                        Plus Active
                      </p>
                      <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: textMuted }}>
                        Upgrade to Pro
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold flex items-center shrink-0 ml-1" style={{ color: '#6366F1' }}>
                    Upgrade <span className="material-symbols-outlined text-xs ml-0.5">chevron_right</span>
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl p-2.5 mb-1 cursor-pointer hover:opacity-90 transition-all border"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: borderCol,
                }}
                onClick={() => { setIsProfileOpen(false); navigate('/plans'); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-base shrink-0" style={{ color: '#F59E0B' }}>
                      bolt
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate" style={{ color: textPri }}>
                        Upgrade Plan
                      </p>
                      <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: textMuted }}>
                        Unlock all features
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold flex items-center shrink-0 ml-1" style={{ color: '#6366F1' }}>
                    View <span className="material-symbols-outlined text-xs ml-0.5">chevron_right</span>
                  </span>
                </div>
              </div>
            )}

            <div className="pt-1 border-t" style={{ borderColor: borderCol }}>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/5 cursor-pointer"
                style={{ color: textPri }}
                onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}>
                <span className="material-symbols-outlined text-base opacity-75">person</span> Profile
              </button>

              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/5 cursor-pointer"
                style={{ color: textPri }}
                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}>
                <span className="material-symbols-outlined text-base opacity-75">settings</span> Settings
              </button>
            </div>

            <div className="pt-1 border-t mt-1" style={{ borderColor: borderCol }}>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-red-500/10 cursor-pointer"
                style={{ color: '#EF4444' }}
                onClick={handleLogout}>
                <span className="material-symbols-outlined text-base">logout</span> Log Out
              </button>
            </div>
          </div>

          {/* Profile Button */}
          <div className="py-2">
            <button
              ref={profileBtnRef}
              className="nav-item text-left overflow-hidden transition-all w-[calc(100%-16px)]"
              onClick={e => { e.stopPropagation(); if (isExpanded) setIsProfileOpen(p => !p); }}
            >
              <div className="icon-container">
                <div className="h-8 w-8 rounded-xl overflow-hidden shrink-0 border-2" style={{ borderColor: isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)' }}>
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="sidebar-content-text flex-grow truncate text-left pl-1">
              <p className="text-xs font-bold truncate" style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
                {user?.username ?? '...'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase leading-none"
                  style={user?.plan_tier === 'pro' 
                    ? { background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA' } 
                    : { background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                  {user?.plan_tier === 'pro' ? 'PRO' : user?.plan_tier === 'plus' ? 'PLUS' : 'BASIC'}
                </span>
                {user?.plan_tier !== 'pro' && (
                <button
                  className="text-[9px] font-bold flex items-center gap-1 hover:opacity-70 leading-none"
                  style={{ color: '#F59E0B' }}
                  onClick={e => { e.stopPropagation(); navigate('/plans'); }}>
                  <span className="material-symbols-outlined text-[12px]">bolt</span> Upgrade
                </button>
                )}
              </div>
            </div>
          </button>
          </div>
        </div>
      )}
    </aside>

    <SignInModal
      isOpen={showSignIn}
      onClose={() => setShowSignIn(false)}
      onSuccess={() => { setShowSignIn(false); navigate('/dashboard'); }}
    />
    </>
  );
}

export default Sidebar;
