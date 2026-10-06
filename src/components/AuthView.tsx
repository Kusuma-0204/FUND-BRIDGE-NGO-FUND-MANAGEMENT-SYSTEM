import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Lock, Mail, UserCheck, ShieldCheck, ArrowRight, Zap, CheckCircle2, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { validatePasswordPolicy } from '../utils/passwordValidator';
import { PasswordRequirementsList } from './PasswordRequirementsList';

interface AuthViewProps {
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  users: User[];
  onOpenForgotPassword: (prefillEmail: string) => void;
  onSendResetLink?: (email: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onRegister,
  users,
  onOpenForgotPassword,
  onSendResetLink
}) => {
  const [activePortalTab, setActivePortalTab] = useState<'donor' | 'admin' | 'register'>(() => {
    if (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('admin')) {
      return 'admin';
    }
    return 'donor';
  });
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('admin')) {
      return '';
    }
    const last = localStorage.getItem('fb_last_login_email');
    return last && last !== 'aadminngo@gmail.com' && last !== 'admin@ngofunds.org' ? last : '';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sync hash changes (e.g. clicking /#admin)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) {
        setActivePortalTab('admin');
        setLoginEmail('');
        setLoginPassword('');
      } else if (hash.includes('register')) {
        setActivePortalTab('register');
      } else if (hash.includes('login') || hash.includes('donor')) {
        setActivePortalTab('donor');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Donor Member');
  const [regPassword, setRegPassword] = useState('');

  const [authError, setAuthError] = useState<string | null>(null);

  const handleEmailChange = (val: string) => {
    setLoginEmail(val);
    if (val !== 'aadminngo@gmail.com' && val !== 'admin@ngofunds.org') {
      localStorage.setItem('fb_last_login_email', val);
    }
  };

  const handleForgotPasswordClick = () => {
    if (activePortalTab === 'admin') {
      onOpenForgotPassword('aadminngo@gmail.com');
    } else {
      onOpenForgotPassword(loginEmail.trim());
    }
  };

  const switchPortalTab = (tab: 'donor' | 'admin' | 'register') => {
    setActivePortalTab(tab);
    setAuthError(null);
    if (tab === 'donor') {
      const last = localStorage.getItem('fb_last_login_email');
      handleEmailChange(last && last !== 'aadminngo@gmail.com' && last !== 'admin@ngofunds.org' ? last : '');
      setLoginPassword('');
      if (window.location.hash.includes('admin')) {
        window.location.hash = 'login';
      }
    } else if (tab === 'admin') {
      setLoginEmail('');
      setLoginPassword('');
      window.location.hash = 'admin';
    } else if (tab === 'register') {
      if (window.location.hash.includes('admin')) {
        window.location.hash = 'register';
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const emailInput = loginEmail.trim().toLowerCase();
    const effectiveEmail = (emailInput === 'adminngo@gmail.com') ? 'aadminngo@gmail.com' : emailInput;

    if (!effectiveEmail) {
      setAuthError('Please enter your Email ID.');
      return;
    }

    if (!loginPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    // If user is on Admin tab but entered a non-admin email (like their donor email),
    // automatically switch them to the Donor Portal instead of blocking them with an error
    let portalTarget = activePortalTab;
    if (activePortalTab === 'admin' && effectiveEmail !== 'aadminngo@gmail.com') {
      portalTarget = 'donor';
      setActivePortalTab('donor');
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: effectiveEmail, 
          password: loginPassword,
          portal: portalTarget 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.isDonorAccount) {
          // If server noted this is a donor account, retry as donor
          setActivePortalTab('donor');
          const retryRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: effectiveEmail, 
              password: loginPassword,
              portal: 'donor' 
            })
          });
          const retryData = await retryRes.json();
          if (retryRes.ok) {
            if (retryData.token) localStorage.setItem('fb_jwt_token', retryData.token);
            onLogin({
              id: retryData.user.id,
              name: retryData.user.full_name,
              email: retryData.user.email,
              role: retryData.user.role,
              avatar: retryData.user.avatar || retryData.user.full_name.substring(0, 2).toUpperCase(),
              kycVerified: retryData.user.kyc_verified,
              phone: retryData.user.phone,
              bio: retryData.user.bio,
              memberSince: retryData.user.member_since,
              auditsApproved: retryData.user.audits_approved
            });
            return;
          }
        }
        setAuthError(data.message || 'Incorrect password entered. Click "Forgot password?" to reset it.');
        return;
      }

      if (data.token) {
        localStorage.setItem('fb_jwt_token', data.token);
      }

      const loggedInUser: User = {
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar || data.user.full_name.substring(0, 2).toUpperCase(),
        kycVerified: data.user.kyc_verified,
        phone: data.user.phone,
        bio: data.user.bio,
        memberSince: data.user.member_since,
        auditsApproved: data.user.audits_approved
      };

      onLogin(loggedInUser);
    } catch {
      // Offline fallback
      if (activePortalTab === 'admin' && loginEmail.trim().toLowerCase() !== 'aadminngo@gmail.com') {
        setAuthError("Access Restricted: Only the authorized administrator account can access the Admin Portal.");
        return;
      }
      const user = users.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
      if (user) {
        if (activePortalTab === 'admin' && user.email.toLowerCase() !== 'aadminngo@gmail.com') {
          setAuthError("Access Restricted: Only the authorized administrator account can access the Admin Portal.");
          return;
        }
        onLogin(user);
      } else {
        setAuthError('Unable to connect to authentication service.');
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;
    setAuthError(null);

    const policy = validatePasswordPolicy(regPassword);
    if (!policy.valid) {
      setAuthError(policy.message || 'Password does not meet required security standards.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          role: regRole,
          password: regPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.message || 'Registration failed.');
        return;
      }

      if (data.token) {
        localStorage.setItem('fb_jwt_token', data.token);
      }

      const createdUser: User = {
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        kycVerified: data.user.kyc_verified,
        phone: data.user.phone,
        memberSince: data.user.member_since,
        auditsApproved: data.user.audits_approved
      };

      onRegister(createdUser);
    } catch {
      const initials = regName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';
      const createdUser: User = {
        id: `user-${Date.now()}`,
        name: regName.trim(),
        email: regEmail.trim(),
        role: regRole,
        avatar: initials,
        kycVerified: true,
        phone: regPhone.trim(),
        memberSince: '2026',
        auditsApproved: 0,
        password: regPassword
      };
      onRegister(createdUser);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 animate-fadeIn">
      <div className="max-w-5xl mx-auto bg-slate-850 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left: Graphic Illustration Side */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black border border-slate-700/80 p-0.5 flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/60 overflow-hidden">
                <img
                  src="/assets/ngo-logo.svg"
                  alt="Fund Bridge NGO Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-teal-300">
                {activePortalTab === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300">Official Administration Gateway</span>
                  </>
                ) : activePortalTab === 'register' ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>New Donor Registration</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-teal-400" />
                    <span>Public Donor Portal</span>
                  </>
                )}
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activePortalTab === 'admin'
                ? 'Fund Bridge Admin Portal'
                : activePortalTab === 'register'
                ? 'Join Fund Bridge'
                : 'Fund Bridge Donor Portal'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activePortalTab === 'admin'
                ? 'Executive management dashboard, treasury controls, Section 80G tax certificates, and verified aid disbursements.'
                : activePortalTab === 'register'
                ? 'Create a donor profile to contribute directly via QR Code and submit verified aid assistance requests.'
                : 'Transparent humanitarian relief, verified fund disbursements, and instant QR Code contributions.'}
            </p>
          </div>

          <div className="my-6 text-center flex flex-col items-center justify-center">
            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-black border border-slate-800 shadow-2xl p-2.5 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-300">
              <img
                src="/assets/ngo-logo.svg"
                alt="Fund Bridge NGO Logo"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>
            <span className="text-[11px] text-teal-400 font-semibold tracking-wider uppercase mt-3">
              Official Non-Profit Emblem
            </span>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 flex items-center justify-between">
            <span>NGO Board &amp; Public Transparency</span>
            <span className="text-teal-400 font-medium">Secured with 256-bit Encryption</span>
          </div>
        </div>

        {/* Right: Forms Side */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-6 flex flex-col justify-center">
          
          {/* Top Switcher: 3 Displayed Portals (Donor, Admin, and Register) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => switchPortalTab('donor')}
              className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activePortalTab === 'donor'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 ring-1 ring-teal-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>🤝 Donor</span>
            </button>

            <button
              type="button"
              onClick={() => switchPortalTab('admin')}
              className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activePortalTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 ring-1 ring-amber-300 font-extrabold'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-current" />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => switchPortalTab('register')}
              className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activePortalTab === 'register'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 ring-1 ring-teal-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>✨ Register</span>
            </button>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="px-3 py-1.5 bg-rose-500/25 hover:bg-rose-500/40 text-white font-bold rounded-lg border border-rose-400/40 transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-teal-300" />
                <span>Send OTP to Email</span>
              </button>
            </div>
          )}

          {/* Form 1: Donor Portal Login */}
          {activePortalTab === 'donor' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Donor &amp; Member Login</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your registered email address and password to sign in.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Donor Mail ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter your email ID (e.g. yourname@domain.com)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password (e.g. Donor@2026)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginPassword && (
                  <PasswordRequirementsList password={loginPassword} showAlways={false} />
                )}
              </div>

              {/* Remember Session & Forgot Password Link */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700"
                  />
                  <span>Remember session</span>
                </label>

                {/* THE FORGOT PASSWORD TRIGGER */}
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="font-semibold text-teal-400 hover:text-teal-300 underline transition-colors cursor-pointer flex items-center gap-1"
                  title="Click to send 6-digit OTP to your mail ID"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Forgot password?</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>Login to Donor Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form 2: Admin Portal Login */}
          {activePortalTab === 'admin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>Administrator Portal Login</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Exclusive access for NGO board administration and treasury controllers.
                </p>
              </div>

              {/* Email ID Field */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Email ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter email ID"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>Remember admin session</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="font-semibold text-amber-400 hover:text-amber-300 underline transition-colors cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Forgot password?</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Login to Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Administrative Security Gateway</span>
                </span>
                <span className="text-[11px] text-amber-400/90 font-medium">Restricted Access</span>
              </div>
            </form>
          )}

          {/* Form 3: Register New Donor */}
          {activePortalTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Register as a New Donor</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Create your donor profile with your personal email ID to contribute via QR Code and submit verified fund requests.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="yourname@domain.com"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="e.g. Donor@2026"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordRequirementsList password={regPassword} showAlways={true} />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Complete Registration &amp; Enter Donor Portal</span>
              </button>
            </form>
          )}

          {/* Discreet staff link so regular users are not prompted or shown to click on admin portal */}
        </div>

      </div>
    </div>
  );
};
