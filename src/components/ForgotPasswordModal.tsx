import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Smartphone,
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
  sentVia?: string;
  deliveredTo?: string;
  message?: string;
  isPhone?: boolean;
}

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSendResetLink: (email: string) => Promise<SendResetResult>;
  onOpenResetPassword?: (email: string, token: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onSendResetLink,
  onOpenResetPassword
}) => {
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [contact, setContact] = useState(defaultEmail);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // 6-digit OTP states - strictly blank for manual entry from user's mobile SMS
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [deliveredTo, setDeliveredTo] = useState<string>('');
  const [isMobileContact, setIsMobileContact] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setContact(defaultEmail);
      setStep('contact');
      setOtpDigits(['', '', '', '', '', '']);
      setDeliveredTo('');
      setOtpError(null);
      setResendCooldown(0);
    }
  }, [defaultEmail, isOpen]);

  // Handle resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Send 6-digit OTP via SMS to user's mobile phone or email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanContact = contact.trim();
    if (!cleanContact) return;

    setIsSendingOtp(true);
    setOtpError(null);

    const isMobile = !cleanContact.includes('@') && /^[+]?[0-9\s-]{8,16}$/.test(cleanContact.replace(/\s+/g, ''));
    setIsMobileContact(isMobile);

    try {
      const result = await onSendResetLink(cleanContact);
      if (result && result.success !== false) {
        if (result.deliveredTo) {
          setDeliveredTo(result.deliveredTo);
        } else {
          setDeliveredTo(cleanContact);
        }

        // Leave all 6 input fields completely empty for the user to manually enter the OTP from their mobile SMS
        setOtpDigits(['', '', '', '', '', '']);
        setStep('otp');
        setResendCooldown(30);

        // Auto-focus on the first digit input
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 120);
      } else {
        setOtpError(result?.message || 'Could not dispatch verification code. Please check your number.');
      }
    } catch {
      setOtpError('Failed to send verification code. Please check your connection and try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle individual OTP digit changes (manual input only)
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Support manual copy-paste of 6-digit code
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

    // Jump to next input box
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

  // Step 2: Verify the 6-Digit OTP entered manually by user
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('').trim();
    if (enteredOtp.length !== 6) {
      setOtpError('Please enter all 6 digits of the OTP received on your mobile.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contact.trim(),
          otp: enteredOtp
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setOtpError(data.message || 'Incorrect verification code. Please check your SMS and try again.');
        setIsVerifyingOtp(false);
        return;
      }

      // OTP Verified successfully! Open Set New Password screen
      const verifiedToken = data.resetToken || enteredOtp;
      setIsVerifyingOtp(false);
      onClose();
      if (onOpenResetPassword) {
        onOpenResetPassword(contact.trim(), verifiedToken);
      }
    } catch {
      setOtpError('Unable to verify OTP right now. Please check your connection and try again.');
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
            {step === 'contact' ? 'Step 1 of 2: Mobile / Email Verification' : 'Step 2 of 2: Enter Mobile OTP'}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            {step === 'contact' ? 'Forgot Password' : 'Verify Mobile OTP'}
          </h3>
          <p className="text-teal-100 text-sm mt-1 leading-relaxed">
            {step === 'contact'
              ? 'Enter your mobile number to receive your 6-digit OTP via SMS and reset your password.'
              : `Enter the 6-digit code sent via SMS to your mobile phone`}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 space-y-5 bg-white">
          {step === 'contact' ? (
            /* STEP 1: ENTER MOBILE NUMBER OR EMAIL */
            <form onSubmit={handleSendOtp} className="space-y-4">
              {otpError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label htmlFor="forgot-contact" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Mobile Phone Number or Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {contact && !contact.includes('@') ? (
                      <Smartphone className="w-5 h-5 text-teal-600" />
                    ) : (
                      <Mail className="w-5 h-5" />
                    )}
                  </div>
                  <input
                    id="forgot-contact"
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. 9876543210 or yourname@gmail.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-medium font-mono"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                  <span>
                    OTP code will be sent via{' '}
                    <strong className="text-teal-700 font-semibold">
                      {contact && !contact.includes('@') ? 'SMS text message to your mobile phone' : 'SMS / Email'}
                    </strong>
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
                  disabled={isSendingOtp || !contact.trim()}
                  className="w-full sm:w-2/3 px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSendingOtp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending SMS to Mobile...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP to Mobile</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: ENTER 6-DIGIT OTP RECEIVED VIA MOBILE SMS */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Delivery notification card */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                  {isMobileContact ? <Smartphone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-0.5 flex items-center gap-2">
                    <span>{isMobileContact ? 'SMS Sent to Mobile' : 'Verification Code Sent'}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Dispatched
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    A 6-digit OTP has been sent to{' '}
                    <strong className="text-slate-900 font-mono font-bold">{deliveredTo || contact}</strong>.
                    Please check your messages and type the code below:
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
              <div className="py-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 text-center mb-3">
                  Type 6-Digit Verification Code
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
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-14 sm:w-12 sm:h-15 text-center text-2xl font-extrabold bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all font-mono shadow-xs"
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  Enter the numbers sent to your phone messages
                </p>
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
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Verify Code &amp; Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP & Change Contact Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('contact');
                    setOtpError(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Mobile Number</span>
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
                      ? 'Sending SMS...'
                      : resendCooldown > 0
                      ? `Resend SMS (${resendCooldown}s)`
                      : 'Resend SMS'}
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
