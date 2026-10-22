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
  AlertCircle
} from 'lucide-react';

export interface SendResetResult {
  success: boolean;
  isSmtpConfigured?: boolean;
  sentVia?: 'smtp' | 'ethereal' | 'simulated';
  deliveredTo?: string;
  message?: string;
}

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSendResetLink: (email: string) => Promise<SendResetResult>;
  onOpenResetPassword?: (email: string, token: string) => void;
}

const maskEmail = (val: string) => {
  if (!val) return 'your registered email';
  if (val.toLowerCase() === 'aadminngo@gmail.com' || val.toLowerCase() === 'adminngo@gmail.com') {
    return 'authorized administrator email';
  }
  const parts = val.split('@');
  if (parts.length === 2) {
    const u = parts[0];
    const masked = u.length <= 2 ? '**' : `${u[0]}${'*'.repeat(Math.min(u.length - 2, 6))}${u[u.length - 1]}`;
    return `${masked}@${parts[1]}`;
  }
  return val;
};

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onSendResetLink,
  onOpenResetPassword
}) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState(defaultEmail);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // 6-digit OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [deliveredTo, setDeliveredTo] = useState<string>('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setStep('email');
      setOtpDigits(['', '', '', '', '', '']);
      setDeliveredTo('');
      setOtpError(null);
    }
  }, [defaultEmail, isOpen]);

  if (!isOpen) return null;

  // Step 1: Send 6-Digit OTP to User's Gmail Inbox
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      const result = await onSendResetLink(email.trim());
      if (result?.deliveredTo) {
        setDeliveredTo(result.deliveredTo);
      }
      setOtpDigits(['', '', '', '', '', '']);
      setStep('otp');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch {
      setOtpError('Failed to send OTP to your email. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle individual OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Support pasting or typing multiple digits
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

  // Step 2: Verify 6-Digit OTP entered on the website
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('').trim();
    if (enteredOtp.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP sent to your Gmail.');
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
        setOtpError(data.message || 'Incorrect OTP code. Please check your Gmail inbox and try again.');
        setIsVerifyingOtp(false);
        return;
      }

      // OTP Verified! Open Set New Password screen
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
          <p className="text-teal-100 text-sm mt-1 leading-relaxed">
            {step === 'email'
              ? 'Enter your login email address to receive a 6-digit OTP in your Gmail inbox.'
              : `Enter the 6-digit OTP sent to ${maskEmail(email)}`}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 space-y-5 bg-white">
          {step === 'email' ? (
            /* STEP 1: ENTER EMAIL TO SEND OTP TO GMAIL */
            <form onSubmit={handleSendOtp} className="space-y-4">
              {otpError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Registered Login Email Address
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
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-medium"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                  <span>
                    6-digit OTP will be sent to: <strong className="text-teal-700">{maskEmail(email)}</strong>
                  </span>
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
                      <span>Sending OTP to Gmail...</span>
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
            /* STEP 2: ENTER 6-DIGIT OTP FROM GMAIL ON WEBSITE */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-teal-800 block text-sm">6-Digit Code Dispatched!</span>
                    <span>Dispatched to: <strong className="text-slate-900 underline">{maskEmail(deliveredTo || email)}</strong></span>
                  </div>
                </div>


                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <span className="font-bold block text-amber-800">
                    📬 Important Gmail Delivery Tips:
                  </span>
                  <p>
                    • Check your <strong>Spam / Junk</strong> folder in the Gmail app.<br/>
                    • If sent from/to your own account, Gmail frequently files it in the <strong>Sent</strong> folder instead of Inbox.<br/>
                    • Or search for subject <strong>"Fund Bridge"</strong> in Gmail search.
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

              {/* 6-Digit OTP Input Boxes */}
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
                    <span>Verify OTP</span>
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
                  disabled={isSendingOtp}
                  onClick={() => handleSendOtp()}
                  className="text-teal-700 hover:text-teal-800 inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  <span>{isSendingOtp ? 'Sending...' : 'Resend OTP to Gmail'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
