import React, { useState, useEffect } from 'react';
import { Donation, User } from '../types';
import { X, QrCode, CreditCard, Copy, Check, Lock, ShieldCheck, HeartHandshake, CheckCircle2, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

export interface CauseItem {
  id: string;
  title: string;
  category: string;
  image: string;
  fallbackSvg?: string;
  raised: number;
  goal: number;
  impactBadge: string;
  description: string;
}

interface QuickDonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  cause: CauseItem | null;
  onDonationComplete: (donation: Donation) => void;
  currentUser?: User;
  onOpenFullDonate?: (category: string) => void;
}

export const QuickDonateModal: React.FC<QuickDonateModalProps> = ({
  isOpen,
  onClose,
  cause,
  onDonationComplete,
  currentUser,
  onOpenFullDonate
}) => {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('1000');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [taxExemption, setTaxExemption] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('/assets/qr-code.svg');

  // Pre-fill user details if logged in or stored
  useEffect(() => {
    if (currentUser?.email && currentUser.email !== 'aadminngo@gmail.com') {
      setDonorName(currentUser.name || '');
      setDonorEmail(currentUser.email || '');
    } else {
      const savedEmail = localStorage.getItem('fb_last_login_email');
      if (savedEmail && !savedEmail.includes('admin')) {
        setDonorEmail(savedEmail);
        const namePart = savedEmail.split('@')[0].replace(/[._-]/g, ' ');
        setDonorName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      }
    }
  }, [currentUser, isOpen]);

  // Generate dynamic QR code matching amount
  useEffect(() => {
    const upiUri = `upi://pay?pa=9391514815@pthdfc&pn=Fund%20Bridge&am=${amount}&cu=INR`;
    QRCode.toDataURL(upiUri, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#090d16', light: '#ffffff' }
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [amount]);

  if (!isOpen || !cause) return null;

  const presetAmounts = [500, 1000, 2500, 5000];

  const handleSelectAmount = (val: number) => {
    setAmount(val);
    setCustomAmount(String(val));
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('9391514815@pthdfc');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    const finalName = donorName.trim() || 'Generous Donor';
    const finalEmail = donorEmail.trim() || 'donor@fundbridge.org';

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const newDonation: Donation = {
        id: `DON-${Date.now().toString().slice(-6)}`,
        donorName: isAnonymous ? 'Anonymous Benefactor' : finalName,
        donorEmail: finalEmail,
        cause: cause.category,
        amount: Number(amount),
        method: paymentMethod === 'upi' ? 'UPI / QR Code' : 'Debit / Credit Card',
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        receiptNumber: `80G-${Math.floor(100000 + Math.random() * 900000)}`,
        isAnonymous: isAnonymous
      };

      onDonationComplete(newDonation);
      onClose();
    }, 700);
  };

  const percentRaised = Math.min(100, Math.round((cause.raised / cause.goal) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Cause Picture Background */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-800">
          <img
            src={cause.image}
            alt={cause.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              if (cause.fallbackSvg) {
                (e.target as HTMLImageElement).src = cause.fallbackSvg;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-950 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category & Title on Header */}
          <div className="absolute bottom-3 left-4 right-4 sm:left-6 sm:right-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-500/40 inline-block mb-1.5">
              {cause.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight drop-shadow-md">
              {cause.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Progress Bar & Goal */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                Raised: <strong className="text-teal-400 font-mono">₹{cause.raised.toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-slate-400 font-mono">
                Goal: ₹{cause.goal.toLocaleString('en-IN')} ({percentRaised}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${percentRaised}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{cause.impactBadge}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Donation Amount (₹ INR)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2.5">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectAmount(amt)}
                    className={`py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      amount === amt
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 scale-[1.02]'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom Amount Field */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Custom amount"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Payment Option
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-teal-400" />
                  <span>UPI / QR Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Debit / Card</span>
                </button>
              </div>
            </div>

            {/* Dynamic Payment Body */}
            {paymentMethod === 'upi' ? (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-300 font-medium">
                  Scan instantly using any UPI App (Google Pay, PhonePe, Paytm, BHIM)
                </p>
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl shadow-inner flex items-center justify-center">
                  <img src={qrDataUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-slate-400">UPI ID:</span>
                  <strong className="text-teal-300 font-mono">9391514815@pthdfc</strong>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Card Number</label>
                  <input
                    type="text"
                    defaultValue="4242 •••• •••• 4242"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Expiry</label>
                    <input
                      type="text"
                      defaultValue="08 / 28"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">CVC</label>
                    <input
                      type="password"
                      defaultValue="894"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Donor Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email (For 80G Receipt) *
                </label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Receipt & Privacy Options */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxExemption}
                  onChange={(e) => setTaxExemption(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-teal-500 bg-slate-900 border-slate-700"
                />
                <span className="text-[11px]">Generate official Section 80G Tax Exemption Certificate</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-teal-500 bg-slate-900 border-slate-700"
                />
                <span className="text-[11px]">Keep my name anonymous on the public donor honor roll</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isProcessing || !amount || amount <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold rounded-xl text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Verified Donation...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Donate ₹{amount.toLocaleString('en-IN')} &amp; Receive Instant 80G Receipt</span>
                  </>
                )}
              </button>

              {onOpenFullDonate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullDonate(cause.category);
                  }}
                  className="w-full text-center text-xs text-slate-400 hover:text-teal-400 py-1 transition-colors cursor-pointer"
                >
                  Need bank transfer details or full gateway? Open Full Donation Page →
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
