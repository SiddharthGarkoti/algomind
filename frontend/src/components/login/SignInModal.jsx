import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_BASE_URL } from '../../config.js';
import api from '../../utils/api.js';

/**
 * SignInModal
 *
 * Props:
 *  isOpen     – boolean – controls visibility
 *  onClose    – fn      – called when the user dismisses the modal
 *  onSuccess  – fn(user) – optional callback after successful auth
 *
 * Flow:
 *  1. Login: email + password (with "Forgot password?" recovery link)
 *  2. Register: email + username + password -> OTP verification -> account created
 *  3. Forgot Password: email -> OTP verification -> new password set -> auto login
 */
function SignInModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMode,     setEmailMode]     = useState('login');  // 'login' | 'register' | 'forgot'

  // Common fields
  const [email,    setEmail]    = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2,setPassword2]= useState('');

  // Register OTP sub-flow
  const [otpStep,  setOtpStep]  = useState('form');  // 'form' -> 'otp'
  const [otp,      setOtp]      = useState('');
  const [otpSent,  setOtpSent]  = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Forgot password sub-flow
  const [forgotStep,      setForgotStep]      = useState('form'); // 'form' -> 'otp'
  const [forgotOtp,       setForgotOtp]       = useState('');
  const [forgotNewPass,   setForgotNewPass]   = useState('');
  const [forgotNewPass2,  setForgotNewPass2]  = useState('');
  const [forgotTimer,     setForgotTimer]     = useState(0);

  const [error, setError] = useState('');
  const [info,  setInfo]  = useState('');
  const [busy,  setBusy]  = useState(false);

  /* Lock/unlock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  /* Reset everything when modal closes */
  useEffect(() => {
    if (!isOpen) {
      setShowEmailForm(false);
      setEmailMode('login');
      setEmail(''); setUsername(''); setPassword(''); setPassword2('');
      setOtpStep('form'); setOtp(''); setOtpSent(false); setOtpTimer(0);
      setForgotStep('form'); setForgotOtp(''); setForgotNewPass(''); setForgotNewPass2(''); setForgotTimer(0);
      setError(''); setInfo('');
    }
  }, [isOpen]);

  /* Registration OTP resend countdown timer */
  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setTimeout(() => setOtpTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [otpTimer]);

  /* Forgot password OTP resend countdown timer */
  useEffect(() => {
    if (forgotTimer <= 0) return;
    const id = setTimeout(() => setForgotTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [forgotTimer]);

  /* Auto-scroll into view when OTP arrives */
  useEffect(() => {
    if (otpStep === 'otp' || forgotStep === 'otp') {
      setTimeout(() => {
        const target = document.querySelector('#otp-section');
        target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    }
  }, [otpStep, forgotStep]);

  if (!isOpen) return null;

  // ── error extraction ───────────────────────────────────────────────
  function extractError(err) {
    if (!err) return 'Something went wrong. Is the backend running?';
    if (err instanceof TypeError) return 'Cannot reach server. Make sure the backend is running.';
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return (
      err.detail ??
      err.non_field_errors?.[0] ??
      err.email?.[0]    ??
      err.username?.[0] ??
      err.password?.[0] ??
      err.password2?.[0] ??
      'Something went wrong.'
    );
  }

  // ── Send Registration OTP ──────────────────────────────────────────
  const handleSendOTP = async () => {
    setError(''); setInfo('');

    const emailInput = document.querySelector('#email-input');
    const liveEmail = (emailInput?.value || email || '').trim();
    if (liveEmail && liveEmail !== email) setEmail(liveEmail);

    const effectiveEmail = liveEmail;

    if (!effectiveEmail || !effectiveEmail.includes('@') || !effectiveEmail.includes('.')) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    if (!username.trim()) { setError('Please enter a username first.'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== password2) { setError('Passwords do not match.'); return; }

    setBusy(true);
    try {
      const res = await api.post('/auth/send-otp/', { email: effectiveEmail });
      setOtpSent(true);
      setOtpStep('otp');
      setOtpTimer(60);
      if (res.dev_otp) {
        setOtp(res.dev_otp);
      }
      setInfo(res.detail ?? 'Verification code sent! Check your inbox.');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Resend Registration OTP ────────────────────────────────────────
  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/auth/send-otp/', { email: email.trim() });
      setOtpTimer(60);
      if (res.dev_otp) {
        setOtp(res.dev_otp);
      }
      setInfo(res.detail ?? 'New verification code sent!');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Send Forgot Password OTP ───────────────────────────────────────
  const handleSendForgotOTP = async (e) => {
    e?.preventDefault();
    setError(''); setInfo('');
    const effEmail = email.trim().toLowerCase();
    if (!effEmail || !effEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      const res = await api.post('/auth/forgot-password/send-otp/', { email: effEmail });
      setForgotStep('otp');
      setForgotTimer(60);
      if (res.dev_otp) {
        setForgotOtp(res.dev_otp);
      }
      setInfo(res.detail || 'Password reset verification code sent to your email.');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Resend Forgot Password OTP ─────────────────────────────────────
  const handleResendForgotOTP = async () => {
    if (forgotTimer > 0) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password/send-otp/', { email: email.trim().toLowerCase() });
      setForgotTimer(60);
      if (res.dev_otp) {
        setForgotOtp(res.dev_otp);
      }
      setInfo(res.detail || 'New reset code sent!');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Execute Password Reset & Auto-Login ─────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    const code = forgotOtp.trim();
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (forgotNewPass !== forgotNewPass2) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await api.post('/auth/forgot-password/reset/', {
        email: email.trim().toLowerCase(),
        otp: code,
        password: forgotNewPass,
        password2: forgotNewPass2,
      });

      // Automatically authenticate the user with their newly reset password
      const loggedUser = await login(email.trim().toLowerCase(), forgotNewPass);
      onClose();
      if (onSuccess) { onSuccess(loggedUser); } else { navigate('/dashboard'); }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Submit (login or final register with OTP) ───────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (emailMode === 'register') {
      if (otpStep !== 'otp') { setError('Please request and enter a verification code first.'); return; }
      if (!otp.trim() || otp.length !== 6) { setError('Enter the 6-digit code sent to your email.'); return; }
    }

    setBusy(true);
    try {
      let loggedUser;
      if (emailMode === 'login') {
        loggedUser = await login(email, password);
      } else {
        loggedUser = await register(username, email, password, password2, otp);
      }
      onClose();
      if (onSuccess) { onSuccess(loggedUser); } else { navigate('/dashboard'); }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-gray-50 dark:bg-surface-container-low border border-gray-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-sm';

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain flex flex-col items-center justify-center p-3 sm:p-6"
      id="signin-modal"
      onClick={(e) => {
        if (e.target.id === 'signin-modal' || e.target.id === 'signin-backdrop') {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div id="signin-backdrop" className="fixed inset-0 bg-black/60 backdrop-blur-md -z-10" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-surface-container rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 my-auto overflow-hidden transition-all duration-300">
        <div className="p-6 sm:p-8 max-h-[88vh] overflow-y-auto custom-scrollbar">

          {/* Close button */}
          <div className="flex justify-end mb-2">
            <button
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              onClick={onClose}
              aria-label="Close sign in modal"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* ── SCREEN 1: Registration OTP Verification ── */}
          {emailMode === 'register' && otpStep === 'otp' ? (
            <div className="space-y-5 animate-[fadeIn_0.25s_ease-out]">
              <button
                type="button"
                onClick={() => { setOtpStep('form'); setError(''); setInfo(''); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to registration details
              </button>

              <div className="text-center py-1">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3 border border-purple-500/20 shadow-lg shadow-purple-500/10">
                  <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-gray-900 dark:text-white">
                  Verify Your Email
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                  We sent a 6-digit code to <span className="font-semibold text-gray-900 dark:text-white break-all">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2" id="otp-section">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block text-center">
                    Enter 6-digit verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-surface-container-low border rounded-xl focus:ring-2 outline-none text-gray-900 dark:text-white text-center font-mono text-2xl tracking-[0.4em] transition-all ${
                      error
                        ? 'border-red-500 ring-2 ring-red-500/20 focus:ring-red-500'
                        : 'border-indigo-300 dark:border-indigo-500/40 focus:ring-purple-500'
                    }`}
                    autoFocus
                  />
                </div>

                {error ? (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    <p className="text-xs font-semibold text-red-500">{error}</p>
                  </div>
                ) : info ? (
                  <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">{info}</p>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={busy || otp.length !== 6}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff' }}
                >
                  {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Complete Registration
                </button>

                <div className="text-center pt-1">
                  {otpTimer > 0 ? (
                    <span className="text-xs text-gray-400">
                      Resend code in <strong className="text-purple-500">{otpTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={busy}
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Resend verification code
                    </button>
                  )}
                </div>
              </form>
            </div>

          /* ── SCREEN 2: Forgot Password Recovery ── */
          ) : emailMode === 'forgot' ? (
            <div className="space-y-5 animate-[fadeIn_0.25s_ease-out]">
              <button
                type="button"
                onClick={() => { setEmailMode('login'); setError(''); setInfo(''); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to Sign In
              </button>

              <div className="text-center py-1">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                  <span className="material-symbols-outlined text-3xl">lock_reset</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-gray-900 dark:text-white">
                  {forgotStep === 'otp' ? 'Create New Password' : 'Reset Password'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                  {forgotStep === 'otp'
                    ? `Enter the 6-digit code sent to ${email} and set your new password.`
                    : "Enter your registered email address to receive a verification code."}
                </p>
              </div>

              {/* Forgot Step 1: Request OTP */}
              {forgotStep === 'form' && (
                <form onSubmit={handleSendForgotOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Account Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. name@example.com"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={inputCls}
                      autoFocus
                    />
                  </div>

                  {error ? (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                      <p className="text-xs font-semibold text-red-500">{error}</p>
                    </div>
                  ) : info ? (
                    <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400">{info}</p>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={busy || !email.trim()}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-sm cursor-pointer"
                  >
                    {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Send Reset Code
                  </button>
                </form>
              )}

              {/* Forgot Step 2: Enter OTP + New Password */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2" id="otp-section">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block text-center">
                      6-Digit Reset Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={forgotOtp}
                      onChange={e => {
                        setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setError('');
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-container-low border border-indigo-300 dark:border-indigo-500/40 rounded-xl outline-none text-gray-900 dark:text-white text-center font-mono text-xl tracking-[0.3em]"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      required
                      value={forgotNewPass}
                      onChange={e => setForgotNewPass(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      required
                      value={forgotNewPass2}
                      onChange={e => setForgotNewPass2(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {error ? (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                      <p className="text-xs font-semibold text-red-500">{error}</p>
                    </div>
                  ) : info ? (
                    <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400">{info}</p>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={busy || forgotOtp.length !== 6 || !forgotNewPass}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-sm cursor-pointer"
                  >
                    {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Reset Password & Sign In
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep('form')}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                    >
                      Change email
                    </button>
                    {forgotTimer > 0 ? (
                      <span className="text-gray-400">
                        Resend in <strong className="text-indigo-500">{forgotTimer}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendForgotOTP}
                        disabled={busy}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

          /* ── SCREEN 3: Standard Login & Register ── */
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
                  Welcome to AlgoMind
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose your preferred authentication method
                </p>
              </div>

              {/* Auth Options */}
              <div className="space-y-3">
                {/* GitHub */}
                <button
                  id="github-oauth-btn"
                  onClick={() => {
                    const base = (API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '').replace(/\/$/, '');
                    window.location.href = `${base}/api/auth/oauth/github/`;
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
                  </svg>
                  Continue with GitHub
                </button>

                {/* Google */}
                <button
                  id="google-oauth-btn"
                  onClick={() => {
                    const base = (API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '').replace(/\/$/, '');
                    window.location.href = `${base}/api/auth/oauth/google/`;
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100 dark:border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-surface-container px-2 text-gray-500 font-medium">Or</span>
                  </div>
                </div>

                {/* Email toggle */}
                <button
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors font-medium text-sm cursor-pointer"
                  onClick={() => setShowEmailForm(prev => !prev)}
                >
                  <span className="material-symbols-outlined text-xl">mail</span>
                  Continue with Email
                </button>

                {/* Email form */}
                {showEmailForm && (
                  <div className="pt-2 space-y-3" id="email-form">
                    {/* Sign In / Register tabs */}
                    <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5">
                      {['login', 'register'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setEmailMode(m);
                            setError('');
                            setInfo('');
                            setOtpStep('form');
                            setOtp('');
                            setOtpSent(false);
                            setOtpTimer(0);
                          }}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          style={emailMode === m ? { background: '#6366F1', color: '#fff' } : { color: '#64748B' }}
                        >
                          {m === 'login' ? 'Sign In' : 'Register'}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={emailMode === 'login' ? handleSubmit : (e) => { e.preventDefault(); handleSendOTP(); }} className="space-y-3">
                      {/* Email */}
                      <input
                        type="email"
                        id="email-input"
                        placeholder="Email address"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onInput={e => { if (e.target.value !== email) setEmail(e.target.value); }}
                        autoComplete="email"
                        className={inputCls}
                      />

                      {/* Username — register only */}
                      {emailMode === 'register' && (
                        <input
                          type="text"
                          placeholder="Choose a username"
                          required
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          autoComplete="username"
                          className={inputCls}
                        />
                      )}

                      {/* Password */}
                      <div>
                        <input
                          type="password"
                          placeholder="Password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          autoComplete={emailMode === 'login' ? 'current-password' : 'new-password'}
                          className={inputCls}
                        />
                        {/* Forgot password link */}
                        {emailMode === 'login' && (
                          <div className="flex justify-end pt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEmailMode('forgot');
                                setForgotStep('form');
                                setError('');
                                setInfo('');
                                setForgotOtp('');
                              }}
                              className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                            >
                              Forgot password?
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password — register only */}
                      {emailMode === 'register' && (
                        <input
                          type="password"
                          placeholder="Confirm password"
                          required
                          value={password2}
                          onChange={e => setPassword2(e.target.value)}
                          autoComplete="new-password"
                          className={inputCls}
                        />
                      )}

                      {/* Feedback */}
                      {error ? (
                        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                          <p className="text-xs font-semibold text-red-500">{error}</p>
                        </div>
                      ) : info ? (
                        <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                          <p className="text-xs font-semibold text-green-600 dark:text-green-400">{info}</p>
                        </div>
                      ) : null}

                      {/* Action Button */}
                      {emailMode === 'register' ? (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={busy}
                          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                          style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff' }}
                        >
                          {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          Send Verification Code
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={busy}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-sm cursor-pointer"
                        >
                          {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          Sign In
                        </button>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default SignInModal;
