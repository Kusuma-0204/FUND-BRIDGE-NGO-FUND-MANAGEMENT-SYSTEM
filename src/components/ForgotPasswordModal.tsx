import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  ArrowRight,
  X,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { User } from '../types';

export interface SendResetResult {
  success: boolean;
  isSmtpConfigured?: boolean;
  sentVia?: 'smtp' | 'ethereal' | 'simulated' | 'resend' | 'brevo';
  deliveredTo?: string;
  message?: string;
  devOtp?: string;
}

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSendResetLink: (email: string) => Promise<SendResetResult>;
  onOpenResetPassword?: (email: string, token: string) => void;
  users?: User[];
}

const maskEmail = (val: string) => {
  if (!val) return 'your registered email';
  return val.trim();
};

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onSendResetLink,
  onOpenResetPassword,
  users = []
}) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState(defaultEmail);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 6-digit OTP state (never auto-filled; user manually inputs code received in their email)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [deliveredTo, setDeliveredTo] = useState<string>('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Compile unique active accounts
  const activeAccounts = React.useMemo(() => {
    const list: { name: string; email: string; role: string; avatar: string }[] = [];
    const seen = new Set<string>();

    for (const u of users) {
      const lower = (u.email || '').trim().toLowerCase();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        list.push({
          name: u.name || lower.split('@')[0],
          email: lower,
          role: u.role || 'Donor Member',
          avatar: u.avatar || (u.name ? u.name.substring(0, 2).toUpperCase() : 'US')
        });
      }
    }

    // Default fallbacks if users list is empty
    const defaults = [
      { name: 'Dr. K. Radhakrishnan', email: 'aadminngo@gmail.com', role: 'Administrator', avatar: 'KR' },
      { name: 'Vengamma Bareddy', email: 'vengammabareddy61@gmail.com', role: 'Donor Member', avatar: 'VB' },
      { name: 'University Member', email: 'o220786@rguktong.ac.in', role: 'Donor Member', avatar: 'UM' },
      { name: 'K. Venkatesh', email: 'venkatesh.k@gmail.com', role: 'Donor Member', avatar: 'KV' },
      { name: 'Kavitha Lakshmi', email: 'kavitha.lakshmi@gmail.com', role: 'Volunteer Staff', avatar: 'KL' }
    ];

    for (const d of defaults) {
      if (!seen.has(d.email)) {
        seen.add(d.email);
        list.push(d);
      }
    }

    return list;
  }, [users]);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail || (activeAccounts.length > 0 ? activeAccounts[0].email : ''));
      setStep('email');
      setOtpDigits(['', '', '', '', '', '']);
      setDeliveredTo('');
      setOtpError(null);
      setResendCooldown(0);
    }
  }, [defaultEmail, isOpen, activeAccounts]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Send 6-Digit OTP to User's Email Inbox
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setOtpError('Please enter your registered email address.');
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      const result = await onSendResetLink(cleanEmail);
      if (!result || !result.success) {
        setOtpError(result?.message || 'Could not send verification code. Please check your email and try again.');
        return;
      }

      if (result?.deliveredTo) {
        setDeliveredTo(result.deliveredTo);
      } else {
        setDeliveredTo(cleanEmail);
      }

      // Reset OTP digits to blank so user types their received code
      setOtpDigits(['', '', '', '', '', '']);
      setStep('otp');
      setResendCooldown(30);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch {
      setOtpError('Failed to send OTP to your email. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle individual OTP digit changes (Manual input only)
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Support typing or pasting multiple digits
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const next = [...otpDigits];
      chars.forEach((ch, i) => {
        if (index + i < 6) next[index + i] = ch;
      });
      setOtpDigits(next);
      const focusIdx = Math.min(index + chars.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = cleaned;
    setOtpDigits(next);
    setOtpError(null);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, idx) => {
      next[idx] = ch;
    });
    setOtpDigits(next);
    setOtpError(null);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  // Step 2: Verify 6-Digit OTP entered by the user
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('').trim();
    if (enteredOtp.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: enteredOtp
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setOtpError(data.message || 'Incorrect OTP code. Please check your email inbox and try again.');
        setIsVerifyingOtp(false);
        return;
      }

      // OTP Verified! Open Set New Password modal
      const verifiedToken = data.resetToken || enteredOtp;
      setIsVerifyingOtp(false);
      onClose();
      if (onOpenResetPassword) {
        onOpenResetPassword(email.trim(), verifiedToken);
      }
    } catch {
      setOtpError('Unable to verify OTP at the moment. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  const fullOtp = otpDigits.join('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide uppercase mb-2 text-teal-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            {step === 'email' ? 'Step 1 of 2: Send Email OTP' : 'Step 2 of 2: Verify Email OTP'}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            {step === 'email' ? 'Forgot Password' : 'Verify 6-Digit OTP'}
          </h3>
          <p className="text-teal-100 text-xs sm:text-sm mt-1 leading-relaxed">
            {step === 'email'
              ? 'All accounts are active. Enter your registered email address to receive your 6-digit OTP.'
              : `Enter the 6-digit verification code sent to ${maskEmail(deliveredTo || email)}`}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 space-y-5 bg-white max-h-[80vh] overflow-y-auto">
          {step === 'email' ? (
            /* STEP 1: ENTER OR SELECT EMAIL TO SEND OTP */
            <form onSubmit={handleSendOtp} className="space-y-4">
              {otpError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Registered Account Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered email (e.g. yourname@gmail.com)"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-medium"
                    autoFocus
                  />
                </div>
              </div>

              {/* All Active Accounts Quick Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    All Active Accounts ({activeAccounts.length})
                  </span>
                  <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    All Active
                  </span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {activeAccounts.map((acc) => {
                    const isSelected = email.trim().toLowerCase() === acc.email.toLowerCase();
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => setEmail(acc.email)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-500/30 shadow-xs'
                            : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            acc.role === 'Administrator'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-teal-100 text-teal-900 border border-teal-200'
                          }`}>
                            {acc.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {acc.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate font-mono">
                              {acc.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            acc.role === 'Administrator'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}>
                            {acc.role}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Active"></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/3 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingOtp || !email.trim()}
                  className="w-full sm:w-2/3 px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSendingOtp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending OTP to Email...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP to Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: ENTER 6-DIGIT OTP FROM EMAIL ON WEBSITE (NO AUTOFILL CODE) */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-teal-900 block text-sm">6-Digit Code Dispatched!</span>
                    <span>Dispatched to: <strong className="text-slate-950 font-mono underline">{maskEmail(deliveredTo || email)}</strong></span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <span className="font-bold block text-amber-800">
                    📬 Please check your Email Inbox:
                  </span>
                  <p>
                    • Look for subject <strong>"Fund Bridge Verification Code"</strong> in your Inbox or <strong>Spam / Junk</strong> folder.<br/>
                    • Enter the 6-digit code received in your email below to verify.
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {otpError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* 6-Digit OTP Input Boxes (Manual Typing / Pasting only) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 text-center mb-3">
                  Enter 6-Digit OTP Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      placeholder="•"
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-mono shadow-xs"
                    />
                  ))}
                </div>
              </div>

              {/* Verify OTP Button */}
              <button
                type="submit"
                disabled={isVerifyingOtp || fullOtp.length !== 6}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Verify 6-Digit OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP & Change Email Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtpError(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>

                <button
                  type="button"
                  disabled={isSendingOtp || resendCooldown > 0}
                  onClick={() => handleSendOtp()}
                  className="text-teal-700 hover:text-teal-800 inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  <span>
                    {isSendingOtp
                      ? 'Sending...'
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend OTP to Email'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
