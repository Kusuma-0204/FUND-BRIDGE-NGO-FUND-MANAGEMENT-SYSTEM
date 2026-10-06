import React, { useState } from 'react';
import { Mail, KeyRound, ExternalLink, Copy, Check, X, Shield, Clock, ArrowRight, Zap } from 'lucide-react';

interface SimulatedEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: {
    recipientEmail: string;
    token: string;
    sentAt: string;
    resetLink: string;
    sentVia?: 'smtp' | 'ethereal' | 'none';
    statusMessage?: string;
    previewUrl?: string | false;
  } | null;
  onOpenResetPassword: (email: string, token: string) => void;
  onMagicLogin: (email: string) => void;
}

export const SimulatedEmailModal: React.FC<SimulatedEmailModalProps> = ({
  isOpen,
  onClose,
  emailData,
  onOpenResetPassword,
  onMagicLogin
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !emailData) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(emailData.resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRealSmtp = emailData.sentVia === 'smtp';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            </div>
            <div className="h-4 w-px bg-slate-600 mx-1"></div>
            <div className="flex items-center gap-2 text-slate-200 text-xs sm:text-sm font-semibold">
              <Mail className="w-4 h-4 text-teal-400" />
              <span>Password Reset Email Delivery Status</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className={`px-4 py-3 text-xs flex items-center justify-between gap-3 border-b ${
          isRealSmtp 
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200' 
            : 'bg-teal-950/60 border-teal-800/80 text-teal-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRealSmtp ? 'bg-emerald-400 animate-ping' : 'bg-teal-400'}`}></span>
            <span>
              {isRealSmtp 
                ? `✓ Live Email Dispatched via SMTP directly to user ${emailData.recipientEmail}. Check inbox & spam.` 
                : `✓ Reset link generated directly for user ${emailData.recipientEmail} (not administration).`}
            </span>
          </div>
          {emailData.previewUrl && (
            <a
              href={emailData.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-white hover:text-teal-300 flex-shrink-0 flex items-center gap-1"
            >
              <span>View Webmail</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Email Meta details */}
        <div className="bg-slate-850 p-4 border-b border-slate-700/70 space-y-2 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>🔐 Reset Link for User: {emailData.recipientEmail}</span>
            </div>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {emailData.sentAt}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-slate-300">
            <div>
              <span className="text-slate-400">Recipient: </span>
              <span className="font-medium text-teal-300 underline">{emailData.recipientEmail}</span>
              <span className="ml-1 text-[11px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">User Account</span>
            </div>
            <div>
              <span className="text-slate-400">Target Role: </span>
              <span className="font-medium text-slate-200">User / Member (Not Administration)</span>
            </div>
          </div>
        </div>

        {/* Email Body: Branded Template */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 bg-slate-900/90 text-slate-200 text-sm">
          {/* Header Card */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-teal-500/30 flex items-center justify-center p-2 shadow-inner">
                <img src="/assets/ngo-logo.svg" alt="NGO Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="font-bold text-white text-base tracking-wide">FUND BRIDGE</div>
                <div className="text-xs text-teal-400 font-medium">NGO Fund Management System</div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              Verified Authenticated Link
            </div>
          </div>

          {/* Salutation & Message */}
          <div className="space-y-3 leading-relaxed">
            <p className="font-medium text-white text-base">Hello,</p>
            <p className="text-slate-300">
              We received an authorization request to reset the account password associated with <strong className="text-teal-300 font-semibold">{emailData.recipientEmail}</strong> on the <strong>Fund Bridge NGO Fund Management System</strong>.
            </p>
            <p className="text-slate-300">
              You can set your new password or log directly into your dashboard using either of the buttons below:
            </p>
          </div>

          {/* Action Callout Box */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-850 border border-teal-500/40 rounded-xl p-5 shadow-lg space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-400" />
              Direct Dashboard Access Options
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option 1: Set New Password & Login */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResetPassword(emailData.recipientEmail, emailData.token);
                }}
                className="w-full p-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 flex flex-col items-center justify-center gap-1.5 text-center transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  <span>Set New Password &amp; Login</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <span className="text-[11px] text-teal-100 font-normal">
                  Create new password for user {emailData.recipientEmail}
                </span>
              </button>

              {/* Option 2: 1-Click Magic Link Direct Login */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onMagicLogin(emailData.recipientEmail);
                }}
                className="w-full p-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Instant User Login</span>
                </div>
                <span className="text-[11px] text-amber-200/80 font-normal">
                  Log in directly as user {emailData.recipientEmail}
                </span>
              </button>
            </div>

            {/* Direct Mailto Option */}
            <div className="pt-2">
              <a
                href={`mailto:${encodeURIComponent(emailData.recipientEmail)}?subject=${encodeURIComponent('Your Password Reset Link for Fund Bridge')}&body=${encodeURIComponent('Hello,\n\nHere is your password reset link for the Fund Bridge NGO Portal:\n\n' + emailData.resetLink + '\n\nOpen this link to set your password and access your dashboard.\n\nBest regards,\nFund Bridge Team')}`}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-750 border border-slate-700 rounded-xl text-teal-300 hover:text-teal-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4 text-teal-400" />
                <span>Open in Your Mail App (Send to {emailData.recipientEmail})</span>
              </a>
            </div>

            {/* Direct URL Box */}
            <div className="pt-2 border-t border-slate-700/60">
              <label className="block text-xs text-slate-400 mb-1 font-medium">Your direct secure reset link:</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-700">
                <input
                  type="text"
                  readOnly
                  value={emailData.resetLink}
                  className="bg-transparent text-xs text-slate-300 font-mono flex-1 outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded border border-slate-600 flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Real email note */}
          <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-2">
            <p className="flex items-center gap-1.5 text-amber-400/90 font-medium">
              <Clock className="w-3.5 h-3.5" />
              This password reset link will automatically expire in 15 minutes.
            </p>
            <p className="text-slate-400 text-[11px]">
              Note on external emails: To send live outbound emails to third-party inboxes across the internet, SMTP credentials (such as Gmail App Password, SendGrid, or Amazon SES) can be added to your environment settings (<code className="text-teal-300">.env</code>).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-5 py-3 border-t border-slate-700/70 flex justify-between items-center text-xs text-slate-400">
          <span>Fund Bridge Password Recovery System</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
