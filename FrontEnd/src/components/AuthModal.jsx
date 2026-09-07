import React, { useState, useEffect } from 'react';
import { X, GraduationCap, School, ShieldCheck, Mail, Lock, User, ArrowRight, Loader2, Sparkles, Clock, AlertTriangle, KeyRound, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApprovalConfig, forgotPassword, resetPassword } from '../services/authService';

const ROLES = [
  {
    key: 'student',
    label: 'Student',
    icon: GraduationCap,
    description: 'Join live interactive sessions & track learning progress',
    color: 'from-cyan-500 to-blue-600',
    demo: { email: 'student@edupulse.com', password: 'student123', name: 'Alex Student' }
  },
  {
    key: 'teacher',
    label: 'Teacher',
    icon: School,
    description: 'Manage classroom sessions & monitor real-time engagement',
    color: 'from-indigo-500 to-purple-600',
    demo: { email: 'teacher@edupulse.com', password: 'teacher123', name: 'Prof. Mayur Raut' }
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    description: 'Manage platform content, mentors & system settings',
    color: 'from-amber-500 to-rose-600',
    demo: { email: 'admin@edupulse.com', password: 'admin123', name: 'EduPulse Admin' }
  }
];

export default function AuthModal({ isOpen, onClose, initialRole = 'student', onLoginSuccess }) {
  const { login, register } = useAuth();
  const [activeRole, setActiveRole] = useState(initialRole);
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  
  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot password flow state
  const [forgotStep, setForgotStep] = useState(1); // 1: Request token, 2: Reset password
  const [generatedCode, setGeneratedCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [approvalMode, setApprovalMode] = useState('manual');

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await getApprovalConfig();
      if (res && res.approval_mode) {
        setApprovalMode(res.approval_mode);
      }
    } catch (e) {
      console.warn('Failed to load approval config:', e.message);
    }
  };

  if (!isOpen) return null;

  const currentRoleConfig = ROLES.find((r) => r.key === activeRole) || ROLES[0];

  const handleRoleSelect = (roleKey) => {
    setActiveRole(roleKey);
    setError('');
    setSuccessMsg('');
  };

  const handleFillDemo = () => {
    const demo = currentRoleConfig.demo;
    setEmail(demo.email);
    setPassword(demo.password);
    if (mode === 'signup') {
      setName(demo.name);
    }
    setError('');
    setSuccessMsg('');
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword({ email });
      if (res && res.success) {
        setGeneratedCode(res.resetToken || '');
        setResetTokenInput(res.resetToken || '');
        setSuccessMsg(res.message || `Verification code generated for ${email}`);
        setForgotStep(2);
      } else {
        setError(res?.message || 'Failed to request reset code.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Account not found with this email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !resetTokenInput || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter new password.');
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword({ email, resetToken: resetTokenInput, newPassword: password });
      if (res && res.success) {
        setSuccessMsg('Password reset successfully! Redirecting to Sign In...');
        setTimeout(() => {
          setMode('login');
          setForgotStep(1);
          setResetTokenInput('');
          setConfirmPassword('');
          setSuccessMsg('Password updated. Please sign in with your new password.');
        }, 1500);
      } else {
        setError(res?.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'forgot') {
      if (forgotStep === 1) return handleRequestResetCode(e);
      return handleResetPasswordSubmit(e);
    }

    if (!email || !password || (mode === 'signup' && !name)) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'signup') {
        const res = await register({ name, email, password, role: activeRole });
        if (res && res.success) {
          if (res.pending) {
            setSuccessMsg('Registration submitted. Waiting for Admin approval.');
            setName('');
            setPassword('');
          } else {
            setSuccessMsg('Registration successful. Your account has been approved.');
            setTimeout(() => {
              onClose();
              if (onLoginSuccess) onLoginSuccess(res.user);
            }, 1200);
          }
        } else {
          setError(res?.message || 'Registration failed.');
        }
      } else {
        const res = await login({ email, password, role: activeRole });
        if (res && res.success) {
          onClose();
          if (onLoginSuccess) onLoginSuccess(res.user);
        } else {
          setError(res?.message || 'Sign in failed. Please check your credentials.');
        }
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Server error occurred.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>{mode === 'forgot' ? 'Account Password Recovery' : mode === 'login' ? 'Welcome Back' : 'Create Account'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'forgot'
                ? 'Enter your registered email to receive a password reset verification code'
                : 'Select your role and sign in to continue to EduPulse'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role Selector Tabs (Only shown in Login & Signup mode) */}
        {mode !== 'forgot' && (
          <div className="px-6 pt-5 relative z-10">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Your Account Role:
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-cyan-300">
                Mode: {approvalMode === 'automatic' ? 'Automatic Approval' : 'Manual Approval'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = activeRole === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleRoleSelect(r.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-gradient-to-tr ' + r.color + ' text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-bold">{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Role Description Hint */}
            <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
              <span className="truncate">{currentRoleConfig.description}</span>
            </div>
          </div>
        )}

        {/* Mode Selector (Login vs Signup) */}
        {mode !== 'forgot' && (
          <div className="px-6 pt-4 relative z-10 flex border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all ${
                mode === 'login'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all ${
                mode === 'signup'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account ({currentRoleConfig.label})
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col gap-4 relative z-10">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <AlertTriangle size={18} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle size={18} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= FORGOT PASSWORD MODE ================= */}
          {mode === 'forgot' ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@edupulse.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {forgotStep === 2 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={resetTokenInput}
                        onChange={(e) => setResetTokenInput(e.target.value)}
                        placeholder="e.g. 849301"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-sm text-cyan-300 font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-slate-400 hover:text-white font-medium"
                >
                  ← Back to Sign In
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>{forgotStep === 1 ? 'Send Reset Code' : 'Reset Password'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ================= SIGN IN & SIGN UP MODES ================= */
            <>
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`${activeRole}@edupulse.com`}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotStep(1);
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-semibold text-cyan-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Quick Demo Credentials Autofill */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-cyan-400 hover:underline font-medium text-[11px] flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  Fill {currentRoleConfig.label} Demo Credentials
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? `Sign In as ${currentRoleConfig.label}` : `Create ${currentRoleConfig.label} Account`}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
