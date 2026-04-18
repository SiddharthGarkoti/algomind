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
 * Registration flow:
 *  1. User fills form → clicks "Send Verification Code"
 *  2. OTP sent to email → user enters code
 *  3. Verified → account created
 */
function SignInModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMode,     setEmailMode]     = useState('login');  // 'login' | 'register'

  // Common fields
  const [email,    setEmail]    = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2,setPassword2]= useState('');

  // OTP sub-flow (register only)
  const [otpStep,  setOtpStep]  = useState('form');  // 'form' → 'otp' → done
  const [otp,      setOtp]      = useState('');
  const [otpSent,  setOtpSent]  = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);        // countdown for resend

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
      setError(''); setInfo('');
    }
  }, [isOpen]);

  /* OTP resend countdown timer */
  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setTimeout(() => setOtpTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [otpTimer]);

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

  // ── Send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setError(''); setInfo('');
    if (!email || !email.includes('@')) { setError('Enter a valid email first.'); return; }
    if (!username.trim()) { setError('Enter your username first.'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== password2) { setError('Passwords do not match.'); return; }

    setBusy(true);
    try {
      const res = await api.post('/auth/send-otp/', { email }, { skipAuth: true });
      setOtpSent(true);
      setOtpStep('otp');
      setOtpTimer(60);
      setInfo(res.detail ?? 'Verification code sent! Check your inbox.');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    setBusy(true);
    try {
      await api.post('/auth/send-otp/', { email }, { skipAuth: true });
      setOtpTimer(60);
      setInfo('New code sent!'); setError('');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Submit (login or final register with OTP) ──────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (emailMode === 'register') {
      // Must have sent OTP first
      if (otpStep !== 'otp') { setError('Please request and enter a verification code first.'); return; }
      if (!otp.trim() || otp.length !== 6) { setError('Enter the 6-digit code sent to your email.'); return; }
    }

    setBusy(true);
    try {
      let user;
      if (emailMode === 'login') {
        user = await login(email, password);
      } else {
        // register() must be updated in AuthContext to pass otp
        user = await register(username, email, password, password2, otp);
      }
      onClose();
      if (onSuccess) { onSuccess(user); } else { navigate('/dashboard'); }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-gray-50 dark:bg-surface-container-low border border-gray-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-sm';

  return (
    <div className="fixed inset-0 z-[100]" id="signin-modal">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal Panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4">
        <div className="bg-white dark:bg-surface-container rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10">
          <div className="p-8">

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">
                  Welcome back
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose your preferred sign in method
                </p>
              </div>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                onClick={onClose}
                aria-label="Close sign in modal"
              >
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            {/* Auth Options */}
            <div className="space-y-3">

              {/* GitHub */}
              <button
                id="github-oauth-btn"
                onClick={() => { window.location.href = `${API_BASE_URL}/api/auth/oauth/github/`; }}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
                </svg>
                Continue with GitHub
              </button>

              {/* Google */}
              <button
                id="google-oauth-btn"
                onClick={() => { window.location.href = `${API_BASE_URL}/api/auth/oauth/google/`; }}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium"
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
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-surface-container px-2 text-gray-500">Or</span>
                </div>
              </div>

              {/* Email toggle */}
              <button
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors font-medium"
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
                        onClick={() => { setEmailMode(m); setError(''); setInfo(''); setOtpStep('form'); setOtp(''); setOtpSent(false); setOtpTimer(0); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={emailMode === m ? { background: '#6366F1', color: '#fff' } : { color: '#64748B' }}
                      >
                        {m === 'login' ? 'Sign In' : 'Register'}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Register fields */}
                    {emailMode === 'register' && (
                      <input type="text" placeholder="Username" required
                        value={username} onChange={e => setUsername(e.target.value)}
                        className={inputCls} disabled={otpStep === 'otp'} />
                    )}

                    <input type="email" placeholder="Enter your email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      className={inputCls} disabled={otpStep === 'otp'} />

                    <input type="password" placeholder="Password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      className={inputCls} disabled={otpStep === 'otp'} />

                    {emailMode === 'register' && (
                      <input type="password" placeholder="Confirm password" required
                        value={password2} onChange={e => setPassword2(e.target.value)}
                        className={inputCls} disabled={otpStep === 'otp'} />
                    )}

                    {/* OTP step for registration */}
                    {emailMode === 'register' && (
                      <>
                        {otpStep === 'form' ? (
                          <button type="button" onClick={handleSendOTP} disabled={busy}
                            className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)', color: '#fff' }}>
                            {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Send Verification Code
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Enter the 6-digit code sent to {email}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                placeholder="• • • • • •"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-surface-container-low border border-indigo-300 dark:border-indigo-500/40 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-center font-mono text-lg tracking-widest"
                                autoFocus
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleResendOTP}
                              disabled={otpTimer > 0 || busy}
                              className="text-xs text-indigo-500 hover:underline disabled:opacity-40 disabled:no-underline"
                            >
                              {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend code'}
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Feedback */}
                    {info  && <p className="text-xs text-green-600 text-center">{info}</p>}
                    {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                    {/* Submit — only shown when OTP step is complete (register) or always (login) */}
                    {(emailMode === 'login' || otpStep === 'otp') && (
                      <button type="submit" disabled={busy || (emailMode === 'register' && otp.length < 6)}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                        {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {emailMode === 'login' ? 'Sign In' : 'Create Account'}
                      </button>
                    )}
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInModal;
