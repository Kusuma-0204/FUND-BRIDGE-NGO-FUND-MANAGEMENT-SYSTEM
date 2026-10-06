import React, { useState, useEffect } from 'react';
import { Donation } from '../types';
import { QrCode, CreditCard, Copy, Check, Lock, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';

interface DonateViewProps {
  onDonationComplete: (donation: Donation) => void;
  defaultCategory?: string;
}

export const DonateView: React.FC<DonateViewProps> = ({ onDonationComplete, defaultCategory = 'General Fund' }) => {
  const [category, setCategory] = useState(defaultCategory);

  useEffect(() => {
    if (defaultCategory) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);
  const [amount, setAmount] = useState<number>(1000);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [taxExemption, setTaxExemption] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('/assets/qr-code.svg');

  useEffect(() => {
    const upiUri = `upi://pay?pa=9391514815@pthdfc&pn=Fund%20Bridge&am=${amount}&cu=INR`;
    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [amount]);

  const presetAmounts = [500, 1000, 2500, 5000];

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('9391514815@pthdfc');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !donorName.trim() || !donorEmail.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const newDonation: Donation = {
        id: `DON-${Date.now().toString().slice(-6)}`,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        cause: category,
        amount: Number(amount),
        method: paymentMethod === 'upi' ? 'UPI / QR Code' : 'Debit / Credit Card',
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        receiptNumber: `80G-${Math.floor(100000 + Math.random() * 900000)}`,
        isAnonymous: anonymous
      };
      onDonationComplete(newDonation);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20 inline-flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5 text-teal-400" />
          Official QR Code &amp; Direct Contribution
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Scan QR Code &amp; Make a Donation
        </h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Scan the verified UPI QR Code with Google Pay, PhonePe, Paytm, or BHIM. Instant 80G Tax Exemption receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Donation Form */}
        <div className="lg:col-span-8 bg-slate-850 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Select Cause / Program
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="General Fund">General Emergency &amp; Greatest Need Fund</option>
                <option value="Food Relief">Food Donations (Food Relief)</option>
                <option value="Food Donations">Food Donations</option>
                <option value="Child Support">Help to Orphans (Child Support)</option>
                <option value="Help to Orphans">Help to Orphans</option>
                <option value="Animal Welfare">Save Stray Animals (Animal Welfare)</option>
                <option value="Save Stray Animals">Save Stray Animals</option>
                <option value="Healthcare Camps">Healthcare &amp; Mobile Medical Clinics</option>
                <option value="Child Education">Child Education &amp; Scholarships</option>
                <option value="Food & Nutrition">Food &amp; Nutrition Support</option>
                <option value="Disaster Relief">Disaster Relief &amp; Emergency Shelter</option>
                <option value="Clean Water & Sanitation">Clean Water Wells &amp; Community Sanitation</option>
              </select>
            </div>

            {/* Amount Presets */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Select Contribution Amount (₹ INR)
              </label>
              <div className="grid grid-cols-4 gap-2.5 mb-3">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
                      amount === amt
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom Amount input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  min="50"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Custom Amount"
                  className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            {/* Donor Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email (For 80G Receipt) *
                </label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 text-xs text-slate-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxExemption}
                  onChange={(e) => setTaxExemption(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <span>Generate official Section 80G Tax Exemption Certificate</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <span>Keep this donation anonymous on the public donor honor roll</span>
              </label>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Payment Gateway Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'upi'
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI / Dynamic QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card / Stripe / Wire</span>
                </button>
              </div>
            </div>

            {/* UPI QR Display */}
            {paymentMethod === 'upi' ? (
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-center space-y-3">
                <p className="text-xs font-semibold text-teal-400">
                  Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM, Bank App)
                </p>
                <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl shadow-inner flex items-center justify-center">
                  <img src={qrDataUrl} alt="UPI QR Code - 9391514815@pthdfc" className="w-full h-full object-contain" />
                </div>
                <div className="text-lg font-extrabold text-teal-300 font-mono">
                  ₹{amount.toLocaleString('en-IN')} INR
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700 text-xs text-slate-300">
                  <span>UPI ID: <strong className="text-white">9391514815@pthdfc</strong></span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 hover:text-teal-400"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Card Number</label>
                  <input
                    type="text"
                    defaultValue="4242 •••• •••• 4242"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      defaultValue="08 / 28"
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">CVC / CVV</label>
                    <input
                      type="password"
                      defaultValue="894"
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Verified Contribution...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Confirm Donation (${amount}) &amp; Generate 80G Receipt</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Trust & Guarantee */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Donor Protection Promise
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span><strong>100% Tax Deductible:</strong> Recognized Section 80G certificate provided instantly.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span><strong>Bank-Grade Encryption:</strong> 256-bit SSL secured transaction processing.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span><strong>Direct Ground Tracking:</strong> Receive email updates and photographic proof of utilization.</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-teal-950 to-slate-900 p-6 rounded-2xl border border-teal-500/40 text-white space-y-3">
            <h4 className="font-bold text-teal-300 text-sm flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" />
              Corporate CSR Matching
            </h4>
            <p className="text-xs text-teal-100/80 leading-relaxed">
              Many employers match charitable employee contributions 1:1. Inquire about corporate partnership packages and tax receipts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
