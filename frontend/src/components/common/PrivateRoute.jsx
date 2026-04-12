import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

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
 * Guests are redirected to "/" so they can sign in.
 */
export function AuthOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}

// Default export kept for backwards compatibility
export default GuestOrAuthRoute;
