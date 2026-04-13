import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import SignInModal from '../login/SignInModal.jsx';

/* Pages where the banner should NOT show */
const HIDDEN_ON = ['/', '/support', '/privacy', '/plans', '/payment'];

function GuestConvertBanner() {
  const { isGuest, isAuthenticated, guestHandles, promoteGuest } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [open,      setOpen]      = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || isAuthenticated || dismissed) return null;
  if (HIDDEN_ON.includes(location.pathname)) return null;

  const hasHandles = guestHandles.leetcode || guestHandles.codeforces;

  /* Called by SignInModal after a successful login/register/OAuth */
  const handleAuthSuccess = async () => {
    setOpen(false);
    // Promote any guest handles to the newly-authenticated account
    if (hasHandles) {
      await promoteGuest(guestHandles).catch(() => {});
    }
    // Reload the page so all data refreshes for the real user
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <>
      {/* Floating pill banner */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff', maxWidth: 'calc(100vw - 32px)' }}
      >
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-none">Guest Mode</p>
          <p className="text-[10px] opacity-80 mt-0.5 truncate">
            {hasHandles ? 'Save your progress & unlock full features' : 'Create an account to save your data'}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/20 hover:bg-white/30 transition-colors shrink-0"
        >
          Save Account
        </button>
        <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 transition-opacity ml-1 shrink-0">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Use the unified SignInModal so GitHub / Google / Email are all available */}
      <SignInModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default GuestConvertBanner;
