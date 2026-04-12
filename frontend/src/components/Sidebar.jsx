import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Sidebar({ isDark, navigate: navProp, onOpenChat }) {
  const navigate       = navProp || useNavigate();
  const { user, logout } = useAuth();

  const [isPinned,       setIsPinned]       = useState(false);
  const [isHovered,      setIsHovered]      = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isProfileOpen,  setIsProfileOpen]  = useState(false);
  const isExpanded = isPinned || isHovered;

  const profileMenuRef = useRef(null);
  const profileBtnRef  = useRef(null);

  const bgColor   = isDark ? '#121315' : '#FFFFFF';
  const borderCol = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.07)';
  const textMuted = isDark ? '#908fa0' : '#64748B';

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

  // Build avatar URL: use uploaded avatar or fallback to dicebear seeded with username
  const avatarUrl = user?.avatar
    ? user.avatar
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.username ?? 'user')}`;

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/');
  };

  const NavItem = ({ path, icon, label, faded = false }) => (
    <NavLink to={path} end={path === '/dashboard'}
      className={({ isActive }) => `nav-item${isActive ? ' active-item' : ''}`}
      style={({ isActive }) => ({
        color: isActive ? '#6366F1' : textMuted,
        backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
        opacity: faded ? 0.45 : 1,
      })}
    >
      <div className="icon-container">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="font-medium sidebar-content-text">{label}</div>
    </NavLink>
  );

  return (
    <aside
      id="sidebar"
      className={`flex flex-col shrink-0${isExpanded ? ' expanded' : ''}`}
      style={{ background: bgColor, borderRight: `1px solid ${borderCol}` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); if (!isPinned) { setIsPracticeOpen(false); } }}
    >
      {/* Brand */}
      <div className="flex items-center h-16 shrink-0 overflow-hidden" style={{ borderBottom: `1px solid ${borderCol}` }}>
        <div className="icon-container">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: textMuted }}
            onClick={e => { e.stopPropagation(); setIsPinned(p => !p); }}
          >
            <span className="material-symbols-outlined !text-lg">{isPinned ? 'push_pin' : 'menu'}</span>
          </button>
        </div>
        <div className="flex items-center gap-3 sidebar-content-text">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}>
            <span className="material-symbols-outlined text-white text-sm">hub</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none" style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>AlgoMind</h1>
            <p className="text-[9px] font-medium leading-none mt-1" style={{ color: textMuted }}>Think in Algorithms</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow py-4 overflow-y-auto overflow-x-hidden mt-2">
        <div className="space-y-1">
          {NAV_TOP.map(item => <NavItem key={item.path} {...item} />)}

          {/* Practice submenu */}
          <div className={`${isPracticeOpen ? 'submenu-active' : ''}`}>
            <div
              className="nav-item cursor-pointer"
              style={{ color: textMuted }}
              onClick={e => { e.stopPropagation(); if (isExpanded) setIsPracticeOpen(p => !p); }}
            >
              <div className="icon-container"><span className="material-symbols-outlined">code</span></div>
              <div className="font-medium flex-grow text-left sidebar-content-text">Practice</div>
              <div className="sidebar-content-text pr-4">
                <span className={`material-symbols-outlined text-sm transition-transform duration-200${isPracticeOpen ? ' rotate-180' : ''}`}>expand_more</span>
              </div>
            </div>
            <div className="submenu-container">
              <div className="py-1 space-y-1">
                {PRACTICE_ITEMS.map(({ path, icon, label }) => (
                  <NavLink key={path} to={path}
                    className="flex items-center h-10 pl-[70px] pr-6 text-sm transition-colors gap-3"
                    style={({ isActive }) => ({ color: isActive ? '#6366F1' : textMuted, fontWeight: isActive ? '600' : '500' })}
                  >
                    <span className="material-symbols-outlined !text-lg">{icon}</span>
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {NAV_BOTTOM.map(item => <NavItem key={item.path} {...item} />)}

          {/* AI Mentor */}
          <NavLink to="/chatbot"
            className="nav-item"
            style={({ isActive }) => ({
              borderLeft: isActive ? '3px solid #6366F1' : '3px solid rgba(99,102,241,0.3)',
              background: 'rgba(99,102,241,0.08)',
              color: isActive ? '#6366F1' : '#8b89ff',
            })}
          >
            <div className="icon-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <div className="font-semibold sidebar-content-text">AI Mentor</div>
          </NavLink>
        </div>
      </nav>

      {/* Profile */}
      <div style={{ borderTop: `1px solid ${borderCol}` }} className="relative shrink-0">
        {/* Profile Dropdown */}
        <div
          ref={profileMenuRef}
          className={`absolute bottom-full left-2 w-52 mb-2 rounded-2xl shadow-2xl overflow-hidden py-2 z-[70]${isProfileOpen ? ' block' : ' hidden'}`}
          style={{ background: isDark ? '#292a2c' : '#FFFFFF', border: `1px solid ${borderCol}` }}
        >
          {/* Upgrade Banner */}
          <div className="mx-2 mb-2 rounded-xl p-3 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.2)' }}
            onClick={() => { setIsProfileOpen(false); navigate('/plans'); }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-[11px] font-extrabold" style={{ color: '#6366F1' }}>Upgrade to Plus</p>
                <p className="text-[9px]" style={{ color: isDark ? '#908fa0' : '#64748B' }}>₹100/month · Unlock all features</p>
              </div>
            </div>
          </div>

          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
            style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}
            onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}>
            <span className="material-symbols-outlined text-lg">person</span> Profile
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
            style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}
            onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}>
            <span className="material-symbols-outlined text-lg">settings</span> Settings
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
            style={{ color: '#EF4444' }}
            onClick={handleLogout}>
            <span className="material-symbols-outlined text-lg">logout</span> Log Out
          </button>
        </div>

        {/* Profile Button */}
        <button
          ref={profileBtnRef}
          className="w-full flex items-center h-16 overflow-hidden transition-colors hover:opacity-80"
          onClick={e => { e.stopPropagation(); if (isExpanded) setIsProfileOpen(p => !p); }}
        >
          <div className="icon-container">
            <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)' }}>
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="sidebar-content-text flex-grow truncate text-left">
            <p className="text-xs font-bold truncate" style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
              {user?.username ?? '...'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase leading-none"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>Basic</span>
              <button
                className="text-[9px] font-bold flex items-center gap-0.5 hover:opacity-70 leading-none"
                style={{ color: '#F59E0B' }}
                onClick={e => { e.stopPropagation(); navigate('/plans'); }}>
                <span>⚡</span> Upgrade
              </button>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
