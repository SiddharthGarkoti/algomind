import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import SignInModal from '../login/SignInModal.jsx';

/**
 * GuestOrAuthRoute — accessible by real authenticated users AND guests.
 * Redirects to "/" only when the user has neither.
 */
export function GuestOrAuthRoute({ children }) {
  const { hasAccess, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return hasAccess ? children : <Navigate to="/" replace />;
}

/**
 * AuthOnlyRoute — requires a real JWT (not just guest mode).
 * Shows a friendly "login required" message instead of redirecting.
 */
export function AuthOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return children;

  // Show a graceful login wall instead of a hard redirect
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0B] px-4">
        <div
          className="max-w-sm w-full rounded-2xl p-10 text-center shadow-2xl border"
          style={{ background: 'var(--surface, #1b1c1e)', borderColor: 'rgba(99,102,241,0.2)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}
          >
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Sign in to access your profile, track achievements, and sync your coding progress.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}
          >
            Sign In / Create Account
          </button>
        </div>
      </div>
      <SignInModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setShowModal(false)}
      />
    </>
  );
}

// Default export kept for backwards compatibility
export default GuestOrAuthRoute;
