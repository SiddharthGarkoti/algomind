import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { GuestOrAuthRoute, AuthOnlyRoute } from '../components/common/PrivateRoute.jsx';
import GuestConvertBanner from '../components/common/GuestConvertBanner.jsx';

import LoginPage      from '../pages/Login/LoginPage.jsx';
import GoalPage       from '../pages/Goal/GoalPage.jsx';
import PlanPage       from '../pages/Plan/PlanPage.jsx';
import Dashboard      from '../pages/DashBoard/Dashboard.jsx';
import AnalyticsPage  from '../pages/Analytics/AnalyticsPage.jsx';
import PlanViewPage   from '../pages/PlanView/PlanViewPage.jsx';
import ArenaPage      from '../pages/Arena/ArenaPage.jsx';
import ResourcesPage  from '../pages/Resources/ResourcesPage.jsx';
import ChallengesPage from '../pages/Challenges/ChallengesPage.jsx';
import FriendsPage    from '../pages/Friends/FriendsPage.jsx';
import CommunityPage  from '../pages/Community/CommunityPage.jsx';
import ChatbotPage    from '../pages/Chatbot/ChatbotPage.jsx';
import SettingsPage   from '../pages/Settings/SettingsPage.jsx';
import ProfilePage    from '../pages/Profile/ProfilePage.jsx';
import SupportPage    from '../pages/Support/SupportPage.jsx';
import PrivacyPage    from '../pages/Privacy/PrivacyPage.jsx';
import PlansPage      from '../pages/Plans/PlansPage.jsx';
import PaymentPage    from '../pages/Payment/PaymentPage.jsx';
import OAuthCallbackPage    from '../pages/OAuthCallback/OAuthCallbackPage.jsx';
import ConnectPlatformsPage from '../pages/ConnectPlatforms/ConnectPlatformsPage.jsx';

/**
 * SmartRoot: shows the login page, but silently redirects to /dashboard
 * if the user is already authenticated — no flicker, no double-nav useEffect.
 */
function SmartRoot(props) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LoginPage {...props} />;
}

function AppRoutes() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.classList.toggle('dark',  isDark);
    root.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    setIsDark(prev => !prev);
    setTimeout(() => root.classList.remove('theme-transition'), 400);
  };

  const thin = { isDark, toggleTheme };
  const dash = { theme: isDark ? 'dark' : 'light', toggleTheme };

  // Shorthand wrappers
  const G = ({ children }) => <GuestOrAuthRoute>{children}</GuestOrAuthRoute>;
  const A = ({ children }) => <AuthOnlyRoute>{children}</AuthOnlyRoute>;

  return (
    <>
      <Routes>
        {/* ── Public ───────────────────────────────────────────── */}
        <Route path="/"          element={<SmartRoot {...thin} />} />
        <Route path="/support"   element={<SupportPage {...thin} />} />
        <Route path="/privacy"   element={<PrivacyPage {...thin} />} />
        <Route path="/plans"     element={<PlansPage   {...thin} />} />
        <Route path="/payment"   element={<PaymentPage {...thin} />} />
        {/* OAuth callback — must be public, outside GuestOrAuthRoute */}
        <Route path="/oauth-callback"    element={<OAuthCallbackPage />} />
        <Route path="/connect-platforms" element={<ConnectPlatformsPage />} />

        {/* ── Onboarding: guest OR real user ───────────────────── */}
        <Route path="/goal"  element={<G><GoalPage {...thin} /></G>} />
        <Route path="/plan"  element={<G><PlanPage {...thin} /></G>} />

        {/* ── Dashboard: guest OR real user ────────────────────── */}
        <Route path="/dashboard"   element={<G><Dashboard      {...dash} /></G>} />
        <Route path="/analytics"   element={<G><AnalyticsPage  {...dash} /></G>} />
        <Route path="/plan-view"   element={<G><PlanViewPage   {...dash} /></G>} />
        <Route path="/arena"       element={<G><ArenaPage      {...dash} /></G>} />
        <Route path="/resources"   element={<G><ResourcesPage  {...dash} /></G>} />
        <Route path="/challenges"  element={<G><ChallengesPage {...dash} /></G>} />
        <Route path="/friends"     element={<G><FriendsPage    {...dash} /></G>} />
        <Route path="/leaderboard" element={<G><FriendsPage    {...dash} /></G>} />
        <Route path="/community"   element={<G><CommunityPage  {...dash} /></G>} />

        {/* ── Auth-only: real JWT required ─────────────────────── */}
        <Route path="/chatbot"  element={<G><ChatbotPage  {...dash} /></G>} />
        <Route path="/profile"  element={<A><ProfilePage  {...dash} /></A>} />
        <Route path="/settings" element={<A><SettingsPage {...dash} /></A>} />
      </Routes>
      <GuestConvertBanner />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
