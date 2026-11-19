import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { GuestOrAuthRoute, AuthOnlyRoute } from '../components/common/PrivateRoute.jsx';
import GuestConvertBanner from '../components/common/GuestConvertBanner.jsx';

// LoginPage eager-loaded — it's the entry point, must render instantly
import LoginPage from '../pages/Login/LoginPage.jsx';

// All other pages lazy-loaded — split into separate JS chunks
const GoalPage            = lazy(() => import('../pages/Goal/GoalPage.jsx'));
const PlanPage            = lazy(() => import('../pages/Plan/PlanPage.jsx'));
const Dashboard           = lazy(() => import('../pages/DashBoard/Dashboard.jsx'));
const AnalyticsPage       = lazy(() => import('../pages/Analytics/AnalyticsPage.jsx'));
const PlanViewPage        = lazy(() => import('../pages/PlanView/PlanViewPage.jsx'));
const ArenaPage           = lazy(() => import('../pages/Arena/ArenaPage.jsx'));
const ResourcesPage       = lazy(() => import('../pages/Resources/ResourcesPage.jsx'));
const ChallengesPage      = lazy(() => import('../pages/Challenges/ChallengesPage.jsx'));
const FriendsPage         = lazy(() => import('../pages/Friends/FriendsPage.jsx'));
const CommunityPage       = lazy(() => import('../pages/Community/CommunityPage.jsx'));
const ChatbotPage         = lazy(() => import('../pages/Chatbot/ChatbotPage.jsx'));
const SettingsPage        = lazy(() => import('../pages/Settings/SettingsPage.jsx'));
const ProfilePage         = lazy(() => import('../pages/Profile/ProfilePage.jsx'));
const PublicProfilePage   = lazy(() => import('../pages/Profile/PublicProfilePage.jsx'));
const SupportPage         = lazy(() => import('../pages/Support/SupportPage.jsx'));
const PrivacyPage         = lazy(() => import('../pages/Privacy/PrivacyPage.jsx'));
const PlansPage           = lazy(() => import('../pages/Plans/PlansPage.jsx'));
const PaymentPage         = lazy(() => import('../pages/Payment/PaymentPage.jsx'));
const OAuthCallbackPage   = lazy(() => import('../pages/OAuthCallback/OAuthCallbackPage.jsx'));
const ConnectPlatformsPage = lazy(() => import('../pages/ConnectPlatforms/ConnectPlatformsPage.jsx'));

// Minimal inline spinner — no external dep, renders instantly
function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#000000]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * SmartRoot: shows the login page, but silently redirects to /dashboard
 * if the user is already authenticated — no flicker, no double-nav useEffect.
 */
function SmartRoot(props) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LoginPage {...props} />;
}

// Shorthand route wrappers defined OUTSIDE component to preserve component reference across theme toggles
const G = ({ children }) => <GuestOrAuthRoute>{children}</GuestOrAuthRoute>;
const A = ({ children }) => <AuthOnlyRoute>{children}</AuthOnlyRoute>;

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

  return (
    <>
      <Suspense fallback={<PageSpinner />}>
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
          <Route path="/profile"           element={<A><ProfilePage       {...dash} /></A>} />
          <Route path="/profile/:username" element={<G><PublicProfilePage {...dash} /></G>} />
          <Route path="/settings" element={<A><SettingsPage {...dash} /></A>} />
        </Routes>
      </Suspense>
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
