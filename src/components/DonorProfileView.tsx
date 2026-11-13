import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Save,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  HeartHandshake,
  ArrowRight,
  Edit3
} from 'lucide-react';
import { User, Donation } from '../types';

interface DonorProfileViewProps {
  currentUser: User;
  donations: Donation[];
  onUpdateProfile: (updated: { name: string; phone?: string; bio?: string }) => Promise<void>;
  onViewReceipt: (donation: Donation) => void;
  onOpenDonate: (category?: string) => void;
  onOpenForgotPassword: (email: string) => void;
  onNavigate: (view: string) => void;
}

export const DonorProfileView: React.FC<DonorProfileViewProps> = ({
  currentUser,
  donations,
  onUpdateProfile,
  onViewReceipt,
  onOpenDonate,
  onOpenForgotPassword,
  onNavigate
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ledger filter state
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setName(currentUser.name || '');
    setPhone(currentUser.phone || '');
    setBio(currentUser.bio || '');
  }, [currentUser]);

  // Filter donations belonging to this donor
  const myDonations = useMemo(() => {
    const emailLower = (currentUser.email || '').trim().toLowerCase();
    const nameLower = (currentUser.name || '').trim().toLowerCase();
    return donations.filter((d) => {
      const dEmail = (d.donorEmail || '').trim().toLowerCase();
      const dName = (d.donorName || '').trim().toLowerCase();
      return (emailLower && dEmail === emailLower) || (nameLower && dName === nameLower);
    });
  }, [donations, currentUser.email, currentUser.name]);

  const filteredDonations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myDonations.filter((d) => {
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      const matchesQuery =
        !q ||
        d.cause.toLowerCase().includes(q) ||
        d.receiptNumber.toLowerCase().includes(q) ||
        d.method.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [myDonations, statusFilter, searchQuery]);

  // Aggregate donor metrics
  const totalContributed = useMemo(
    () => myDonations.filter((d) => d.status !== 'Refunded').reduce((sum, d) => sum + d.amount, 0),
    [myDonations]
  );
  const completedCount = useMemo(
    () => myDonations.filter((d) => d.status === 'Completed').length,
    [myDonations]
  );
  const distinctCauses = useMemo(
    () => new Set(myDonations.map((d) => d.cause)).size,
    [myDonations]
  );

  const initials = useMemo(() => {
    const parts = (currentUser.name || currentUser.email || 'DN').trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }, [currentUser.name, currentUser.email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateProfile({
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim()
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Header Row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-600 text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="text-xs font-semibold text-teal-700">
              Donor Portal / Personal Profile
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
              {currentUser.name || 'Donor Member'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-slate-600">
              <span>{currentUser.email}</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.role}</span>
              <span aria-hidden="true">·</span>
              <span>Member since {currentUser.memberSince || '2026'}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                {currentUser.kycVerified ? 'KYC Verified' : 'Standard Account'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onOpenForgotPassword(currentUser.email)}
            className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenDonate()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Make a Donation</span>
          </button>
        </div>
      </div>

      {/* 4-Column Impact Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Total Contributed</div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
            ₹{totalContributed.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Lifetime verified giving</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Completed Gifts</div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
            {completedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Processed transactions</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">80G Tax Receipts</div>
          <div className="mt-1.5 text-2xl font-bold text-teal-700 tabular-nums">
            {completedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Ready for download</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Causes Supported</div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
            {distinctCauses}
          </div>
          <div className="mt-1 text-xs text-slate-500">Active NGO programs</div>
        </div>
      </div>

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Personal Profile Details & Edit Form */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Donor Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Used on your official 80G tax exemption certificates.
              </p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="donor-full-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name (For 80G Receipt)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="donor-full-name"
                  type="text"
                  required
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-600 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="donor-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="donor-email"
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Primary login identifier. Used for OTP verification and receipts.
              </p>
            </div>

            <div>
              <label htmlFor="donor-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="donor-phone"
                  type="tel"
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-600 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="donor-bio" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Philanthropic Focus & Notes
              </label>
              <textarea
                id="donor-bio"
                rows={3}
                disabled={!isEditing}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share causes you care about (e.g. Clean Water, Rural Education, Medical Aid)..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-600 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors resize-none"
              />
            </div>

            {isEditing && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setName(currentUser.name || '');
                    setPhone(currentUser.phone || '');
                    setBio(currentUser.bio || '');
                    setIsEditing(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Need help with tax filings?</span>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="font-semibold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer whitespace-nowrap"
            >
              Contact Support
            </button>
          </div>
        </section>

        {/* Right: Personal Donation History & 80G Receipts */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Contribution History & Receipts</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your verified contributions and download Section 80G certificates.
              </p>
            </div>

            {/* Interactive Segmented Filter */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
              {(['All', 'Completed', 'Pending'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by cause, receipt number, or payment method..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            />
          </div>

          {/* Populated vs Empty Ledger State */}
          {filteredDonations.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
              <HeartHandshake className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {myDonations.length === 0
                    ? 'No contributions recorded yet'
                    : 'No matching contributions found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {myDonations.length === 0
                    ? 'Your donations and instant Section 80G tax receipts will appear here as soon as you contribute to an NGO program.'
                    : 'Try clearing your search filter or switching tabs to view all donations.'}
                </p>
              </div>
              {myDonations.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onOpenDonate()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Make Your First Donation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-3 pr-4">Date & Receipt</th>
                    <th className="py-3 px-4">Program / Cause</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 pl-4 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDonations.map((don) => (
                    <tr key={don.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 tabular-nums">{don.date}</div>
                        <div className="text-xs font-mono text-slate-500">{don.receiptNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{don.cause}</div>
                        <div className="text-xs text-slate-500">{don.method}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {don.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{don.status}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        ₹{don.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(don)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>80G Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
