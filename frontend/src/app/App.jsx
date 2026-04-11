import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

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

function App() {
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

  // Props for each page type
  const thin  = { isDark, toggleTheme };                         // Login / Goal / Plan / Support / Privacy / Plans
  const dash  = { theme: isDark ? 'dark' : 'light', toggleTheme }; // Dashboard + all sub-pages

  return (
    <Routes>
      {/* ── Onboarding flow ──────────────────────────────── */}
      <Route path="/"          element={<LoginPage     {...thin} />} />
      <Route path="/goal"      element={<GoalPage      {...thin} />} />
      <Route path="/plan"      element={<PlanPage      {...thin} />} />

      {/* ── Dashboard ────────────────────────────────────── */}
      <Route path="/dashboard"  element={<Dashboard      {...dash} />} />
      <Route path="/analytics"  element={<AnalyticsPage  {...dash} />} />
      <Route path="/plan-view"  element={<PlanViewPage   {...dash} />} />
      <Route path="/arena"      element={<ArenaPage      {...dash} />} />
      <Route path="/resources"  element={<ResourcesPage  {...dash} />} />
      <Route path="/challenges" element={<ChallengesPage {...dash} />} />
      <Route path="/friends"    element={<FriendsPage    {...dash} />} />
      <Route path="/leaderboard"element={<FriendsPage    {...dash} />} />
      <Route path="/community"  element={<CommunityPage  {...dash} />} />
      <Route path="/chatbot"    element={<ChatbotPage    {...dash} />} />
      <Route path="/settings"   element={<SettingsPage   {...dash} />} />
      <Route path="/profile"    element={<ProfilePage    {...dash} />} />

      {/* ── Standalone pages ─────────────────────────────── */}
      <Route path="/support"    element={<SupportPage    {...thin} />} />
      <Route path="/privacy"    element={<PrivacyPage    {...thin} />} />
      <Route path="/plans"      element={<PlansPage      {...thin} />} />
    </Routes>
  );
}

export default App;
