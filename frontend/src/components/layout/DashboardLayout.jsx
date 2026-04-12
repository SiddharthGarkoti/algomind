import { useState, useEffect } from 'react';
import Sidebar    from '../Sidebar.jsx';
import Header     from '../Header.jsx';
import ChatDrawer from '../chat/ChatDrawer.jsx';

function DashboardLayout({ children, theme, toggleTheme }) {
  const isDark = theme === 'dark';
  const [chatFriend, setChatFriend] = useState(null);

  const bg = isDark
    ? 'radial-gradient(ellipse at 10% 10%, rgba(99,102,241,0.07) 0%, transparent 40%), #0A0A0B'
    : 'linear-gradient(180deg,#EEF2FF 0%,#F8FAFC 100%)';

  /* Listen for custom event from any child page (e.g. Friends) */
  useEffect(() => {
    const handler = (e) => setChatFriend(e.detail);
    window.addEventListener('algomind:openchat', handler);
    return () => window.removeEventListener('algomind:openchat', handler);
  }, []);

  return (
    <div className="dashboard-layout min-h-screen flex" style={{ background: bg, color: isDark ? '#e3e2e5' : '#0F172A' }}>
      <Sidebar isDark={isDark} onOpenChat={(friend) => setChatFriend(friend)} />

      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        <div className="main-container flex flex-col flex-grow">
          <Header
            theme={theme}
            toggleTheme={toggleTheme}
            onOpenChat={(friend) => setChatFriend(friend)}
          />
          <main className="w-full px-6 py-6 flex-grow page-enter">
            {children}
          </main>
        </div>
      </div>

      {/* Chat Drawer — self-contained, fetches its own messages */}
      {chatFriend && (
        <>
          <div
            className="fixed inset-0 z-[299] bg-black/30 backdrop-blur-sm"
            onClick={() => setChatFriend(null)}
          />
          <ChatDrawer
            friend={chatFriend}
            onClose={() => setChatFriend(null)}
            isDark={isDark}
          />
        </>
      )}
    </div>
  );
}

export default DashboardLayout;
