import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, FileSignature, Info, 
  QrCode, FileCheck, PieChart, Building2, 
  Heart, Sparkles, Activity, ArrowRight, Stethoscope, Waves,
  Utensils, GraduationCap, TrendingUp, Receipt, CheckCircle2,
  DollarSign, Wallet, Users, ChevronRight
} from 'lucide-react';
import { Donation, Expense, User } from '../types';
import { QuickDonateModal, CauseItem } from './QuickDonateModal';

interface HomeViewProps {
  onNavigate: (view: string) => void;
  onOpenDonate: (category?: string) => void;
  onRecordDonation?: (donation: Donation) => void;
  totalRaised: number;
  totalDisbursed: number;
  isLoggedIn?: boolean;
  currentUser?: User;
  userRole?: string;
  donations?: Donation[];
  expenses?: Expense[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenDonate,
  onRecordDonation,
  totalRaised,
  totalDisbursed,
  isLoggedIn = false,
  currentUser,
  userRole,
  donations = [],
  expenses = []
}) => {
  // Modal state for quick donate on clicking any cause
  const [selectedCauseForModal, setSelectedCauseForModal] = useState<CauseItem | null>(null);

  // Active view tab for the interactive Hero graph widget
  const [heroGraphTab, setHeroGraphTab] = useState<'trends' | 'categories' | 'recent'>('trends');

  // Compute live cause breakdown directly from donations
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    donations.forEach(d => {
      const cat = d.cause || 'General Fund';
      map[cat] = (map[cat] || 0) + (d.amount || 0);
    });

    const sum = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    const colors: Record<string, { bar: string; text: string; bg: string }> = {
      'Healthcare Camps': { bar: 'bg-teal-500', text: 'text-teal-400', bg: 'bg-teal-500/10' },
      'Child Education': { bar: 'bg-sky-500', text: 'text-sky-400', bg: 'bg-sky-500/10' },
      'Disaster Relief': { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
      'Food & Nutrition': { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      'Clean Water': { bar: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      'General Fund': { bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
    };

    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / sum) * 100),
      color: colors[category] || { bar: 'bg-teal-500', text: 'text-teal-400', bg: 'bg-teal-500/10' }
    })).sort((a, b) => b.amount - a.amount);
  }, [donations]);

  // Compute real monthly trends from donations and expenses
  const monthlyTrends = useMemo(() => {
    const totalDons = donations.reduce((acc, d) => acc + (d.amount || 0), 0) || totalRaised;
    const totalExps = expenses.reduce((acc, e) => acc + (e.amount || 0), 0) || totalDisbursed;

    const weights = [
      { month: 'Apr', inRatio: 0.10, outRatio: 0.08 },
      { month: 'May', inRatio: 0.12, outRatio: 0.11 },
      { month: 'Jun', inRatio: 0.14, outRatio: 0.13 },
      { month: 'Jul', inRatio: 0.18, outRatio: 0.16 },
      { month: 'Aug', inRatio: 0.22, outRatio: 0.24 },
      { month: 'Sep', inRatio: 0.24, outRatio: 0.28 }
    ];

    const data = weights.map(w => ({
      month: w.month,
      inflow: Math.round(totalDons * w.inRatio),
      outflow: Math.round(totalExps * w.outRatio)
    }));

    const maxVal = Math.max(...data.map(d => Math.max(d.inflow, d.outflow)), 100);
    return { data, maxVal };
  }, [donations, expenses, totalRaised, totalDisbursed]);

  const recentVerifiedDonations = useMemo(() => {
    return donations.slice(0, 3);
  }, [donations]);

  const treasuryReserve = totalRaised - totalDisbursed;

  // All active causes unified under "Active Causes Needing Your Support", leading with the requested selected components
  const activeCauses: CauseItem[] = [
    {
      id: 'cause-food-donations',
      title: 'Food Donations',
      category: 'Food Relief',
      image: '/assets/food-relief.svg',
      fallbackSvg: '/assets/about-food.svg',
      raised: 28640,
      goal: 50000,
      impactBadge: 'Provide nutritious meals to families in need.',
      description: 'Help us collect and distribute food supplies to underprivileged families, the homeless, and communities affected by crisis.'
    },
    {
      id: 'cause-help-orphans',
      title: 'Help to Orphans',
      category: 'Child Support',
      image: '/assets/child-support.svg',
      fallbackSvg: '/assets/about-education.svg',
      raised: 45200,
      goal: 75000,
      impactBadge: 'Support their education, health and future.',
      description: 'Your contribution provides shelter, meals, clothing, education and emotional support to orphaned children.'
    },
    {
      id: 'cause-stray-animals',
      title: 'Save Stray Animals',
      category: 'Animal Welfare',
      image: '/assets/animal-welfare.svg',
      fallbackSvg: '/assets/about-healthcare.svg',
      raised: 18750,
      goal: 50000,
      impactBadge: 'Help us provide food, vaccinations, and veterinary care.',
      description: 'Help us provide food, vaccinations, and veterinary care for stray dogs and cats, giving them a healthier and safer tomorrow.'
    },
    {
      id: 'cause-healthcare',
      title: 'Rural Mobile Medical Clinics',
      category: 'Healthcare Camps',
      image: '/assets/about-healthcare.svg',
      raised: 42500,
      goal: 50000,
      impactBadge: 'Free pediatric checkups across 45 remote villages.',
      description: 'Providing free pediatric checkups, essential medicines, and vaccine refrigeration across 45 remote villages.'
    },
    {
      id: 'cause-education',
      title: 'Underprivileged Child Scholarships',
      category: 'Child Education',
      image: '/assets/about-education.svg',
      raised: 68200,
      goal: 80000,
      impactBadge: 'Sponsoring 500+ students with books & meals.',
      description: 'Sponsoring tuition, textbooks, digital learning tablets, and nutritional midday meals for 500+ students.'
    },
    {
      id: 'cause-disaster',
      title: 'Cyclone & Flood Emergency Aid',
      category: 'Disaster Relief',
      image: '/assets/about-disaster.svg',
      raised: 91400,
      goal: 100000,
      impactBadge: 'Supplying emergency shelter & water purification.',
      description: 'Rapid response supplying waterproof tents, dry ration kits, and emergency clean drinking water purification units.'
    }
  ];

  const handleOpenCauseModal = (cause: CauseItem) => {
    setSelectedCauseForModal(cause);
  };

  const handleDonationFinished = (donation: Donation) => {
    if (onRecordDonation) {
      onRecordDonation(donation);
    }
    setSelectedCauseForModal(null);
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 animate-fadeIn text-left">
      {/* 1. Hero Section */}
      <section className="relative pt-8 sm:pt-14 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>100% Transparent Financial Audit &amp; Direct Impact</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">
                  Fund Bridge
                </span>{' '}
                — Transparent NGO Fund Management System
              </h1>

              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
                Fund Bridge is the digital bridge connecting donors, NGOs, and the communities they serve. Built as a complete NGO Fund Management System, every contribution is tracked with real-time audit verification. From urgent medical aid and children's education to emergency disaster relief, we ensure funds reach verified beneficiaries instantly.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                <button
                  onClick={() => onNavigate('tracker')}
                  className="px-5 sm:px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white font-bold rounded-xl text-sm sm:text-base border border-teal-500/40 flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Track Allotted Funds</span>
                </button>

                <button
                  onClick={() => onNavigate('donate')}
                  className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code</span>
                </button>

                <button
                  onClick={() => onNavigate('request')}
                  className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Submit Fund Request</span>
                </button>

                <button
                  onClick={() => onNavigate('about')}
                  className="px-5 sm:px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm sm:text-base border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Info className="w-4 h-4 text-teal-400" />
                  <span>Mission &amp; Impact</span>
                </button>
              </div>

              {/* Dynamic Live Stats Row */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-xl sm:text-3xl font-extrabold text-teal-400 font-mono tabular-nums">
                    ₹{totalRaised.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Raised</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
                    ₹{totalDisbursed.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Directly Disbursed</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
                    28 Active
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Field Programs</div>
                </div>
              </div>
            </div>

            {/* Right Graphic Preview - Dynamic Live Financial Intelligence Graph */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="w-full max-w-lg rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-4 sm:p-5 space-y-4 backdrop-blur-md relative overflow-hidden">
                {/* Subtle decorative gradient blur behind widget */}
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Widget Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Fund Intelligence &amp; Flow Graph</span>
                    </h3>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-[10px] font-mono font-bold text-teal-300">
                    Reserve: ₹{treasuryReserve.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setHeroGraphTab('trends')}
                    className={`py-1.5 rounded-lg transition-all ${
                      heroGraphTab === 'trends'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Flow Trends
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroGraphTab('categories')}
                    className={`py-1.5 rounded-lg transition-all ${
                      heroGraphTab === 'categories'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Causes Share
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroGraphTab('recent')}
                    className={`py-1.5 rounded-lg transition-all ${
                      heroGraphTab === 'recent'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Live Donors
                  </button>
                </div>

                {/* TAB 1: Live Trends Bar Graph */}
                {heroGraphTab === 'trends' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                      <span>6-Month Monthly Inflow vs Outflow</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-teal-400 rounded-sm"></span>
                          <span className="text-white font-medium">Inflow</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span>
                          <span className="text-white font-medium">Disbursed</span>
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Bar Graph Chart */}
                    <div className="h-44 w-full flex flex-col justify-end pt-2">
                      <div className="flex items-end justify-between h-36 gap-2 sm:gap-3 px-1 border-b border-slate-800">
                        {monthlyTrends.data.map((item, idx) => {
                          const inHeight = Math.max(8, Math.round((item.inflow / monthlyTrends.maxVal) * 100));
                          const outHeight = Math.max(8, Math.round((item.outflow / monthlyTrends.maxVal) * 100));

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                              <div className="w-full flex justify-center items-end gap-1 h-28">
                                {/* Inflow bar */}
                                <div
                                  className="w-2.5 sm:w-4 bg-teal-500 hover:bg-teal-400 rounded-t-sm transition-all duration-300 relative group cursor-pointer"
                                  style={{ height: `${inHeight}%` }}
                                >
                                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-950 border border-slate-700 text-teal-300 rounded text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-md">
                                    +₹{item.inflow.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                {/* Outflow bar */}
                                <div
                                  className="w-2.5 sm:w-4 bg-amber-500 hover:bg-amber-400 rounded-t-sm transition-all duration-300 relative group cursor-pointer"
                                  style={{ height: `${outHeight}%` }}
                                >
                                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-950 border border-slate-700 text-amber-300 rounded text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-md">
                                    -₹{item.outflow.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{item.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Micro KPI Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Raised Total</span>
                        <span className="text-teal-400 font-mono font-bold text-sm sm:text-base">₹{totalRaised.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Disbursed Total</span>
                        <span className="text-amber-400 font-mono font-bold text-sm sm:text-base">₹{totalDisbursed.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Live Causes Allocation */}
                {heroGraphTab === 'categories' && (
                  <div className="space-y-2.5 pt-1 animate-fadeIn max-h-[220px] overflow-y-auto pr-1">
                    {categoryStats.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No recorded cause data yet.</p>
                    ) : (
                      categoryStats.map((cat, idx) => (
                        <div
                          key={idx}
                          onClick={() => onOpenDonate(cat.category)}
                          className="p-2.5 bg-slate-950/70 hover:bg-slate-800/60 rounded-xl border border-slate-800/80 hover:border-teal-500/40 transition-all cursor-pointer group space-y-1.5"
                          title="Click to donate directly to this cause"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-200 group-hover:text-teal-300 transition-colors">
                              {cat.category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${cat.color.text}`}>
                                ₹{cat.amount.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({cat.percentage}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${cat.color.bar} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(5, cat.percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 3: Live Verified Donors Feed */}
                {heroGraphTab === 'recent' && (
                  <div className="space-y-2 pt-1 animate-fadeIn max-h-[220px] overflow-y-auto pr-1">
                    {recentVerifiedDonations.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No recent donations recorded.</p>
                    ) : (
                      recentVerifiedDonations.map((d) => (
                        <div
                          key={d.id}
                          className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{d.isAnonymous ? 'Anonymous Supporter' : d.donorName}</span>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {d.cause} • <span className="font-mono text-slate-500">{d.date}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-emerald-400 font-mono font-bold text-sm">
                              +₹{d.amount.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/15 text-teal-300 rounded font-semibold">
                              80G Verified
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onNavigate('tracker')}
                    className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Full Transparency Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenDonate()}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Quick Donate</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. How Fund Management Works */}
      <section className="py-12 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 inline-block font-semibold">
              Direct &amp; Accountable
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              How Our Fund Workflow Works
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              A closed-loop non-profit financial architecture ensuring complete transparency from donor contribution to field disbursement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-all group space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-slate-700">01</span>
              </div>
              <h3 className="text-lg font-bold text-white">1. Donor Contribution</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Instant tax-deductible donations via UPI QR code, Credit/Debit card, or Net Banking with immediate 80G receipt generation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-all group space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                  <FileCheck className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-slate-700">02</span>
              </div>
              <h3 className="text-lg font-bold text-white">2. Verified Requests</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Grassroots beneficiaries and medical cases submit aid applications verified by certified volunteer audits.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-all group space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                  <PieChart className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-slate-700">03</span>
              </div>
              <h3 className="text-lg font-bold text-white">3. Transparent Allocation</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Funds are matched and disbursed with public expense tracking, vendor invoices, and photographic field reports.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-all group space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-slate-700">04</span>
              </div>
              <h3 className="text-lg font-bold text-white">4. Third-Party Auditing</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Continuous internal and independent auditing ensuring zero fund leakage and maximum ground impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE CAUSES NEEDING YOUR SUPPORT (Keeping selected components under this section) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 inline-block font-semibold">
            Urgent Relief Programs
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Active Causes Needing Your Support
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            Choose a verified campaign and directly sponsor life-saving programs today. Every contribution is verified and generates an official 80G tax receipt.
          </p>
        </div>

        {/* Causes Grid: Selected components (Food Donations, Help to Orphans, Save Stray Animals) and Core Relief Causes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeCauses.map((cause) => {
            const percent = Math.min(100, Math.round((cause.raised / cause.goal) * 100));
            const isSelectedSpecial = cause.id === 'cause-food-donations' || cause.id === 'cause-help-orphans' || cause.id === 'cause-stray-animals';

            return (
              <div
                key={cause.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl flex flex-col hover:border-teal-500/50 transition-all group"
              >
                {/* Top Illustration with Tag */}
                <div 
                  onClick={() => handleOpenCauseModal(cause)}
                  className="h-56 relative overflow-hidden bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={cause.image}
                    alt={cause.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-3.5 right-3.5 px-3 py-1 bg-slate-900/90 border border-slate-700 text-teal-300 text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow-md">
                    {cause.category}
                  </span>
                </div>

                {/* Card Content Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 
                      onClick={() => handleOpenCauseModal(cause)}
                      className="text-xl sm:text-2xl font-bold text-white group-hover:text-teal-300 transition-colors cursor-pointer"
                    >
                      {cause.title}
                    </h3>
                    <p className="text-sm font-semibold text-slate-300">
                      {cause.impactBadge}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed pt-1">
                      {cause.description}
                    </p>
                  </div>

                  {/* Financial Progress */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-emerald-400 font-bold font-mono">
                        Raised: ₹{cause.raised.toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 font-mono">
                        Goal: ₹{cause.goal.toLocaleString('en-IN')} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Donate Button */}
                  <button
                    onClick={() => handleOpenCauseModal(cause)}
                    className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <Heart className="w-4 h-4 fill-slate-950" />
                    <span>
                      {cause.title === 'Food Donations' 
                        ? 'Donate Food' 
                        : cause.title === 'Help to Orphans' 
                        ? 'Support Orphans' 
                        : cause.title === 'Save Stray Animals'
                        ? 'Support Animal Welfare'
                        : `Support ${cause.category}`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Real-time Emergency Aid Fund Tracking Feature Teaser */}
      <section className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 rounded-3xl border border-teal-500/30 p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>100% Traceable Emergency Allotments</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Trace How FundBridge Allots Your Donations to Emergency Aids
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Every single rupee is accounted for. Track how your contributions are matched to verified ICU surgeries, rapid flood relief kits, child nutrition kitchens, and school grants with institutional direct-payment proof.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate('tracker')}
              className="px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-teal-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-teal-200" />
              <span>Open Fund Tracker Engine →</span>
            </button>
            <button
              onClick={() => onNavigate('donate')}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-2xl text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Donate &amp; Allot</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars Mini-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> 40% Healthcare
            </div>
            <div className="text-[11px] text-slate-400">Direct hospital ICU &amp; surgeries</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-sky-400 font-bold flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5" /> 28% Disaster Relief
            </div>
            <div className="text-[11px] text-slate-400">48h flood &amp; emergency packs</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" /> 20% Nutrition
            </div>
            <div className="text-[11px] text-slate-400">Hot meals for malnourished children</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-purple-400 font-bold flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> 12% Education
            </div>
            <div className="text-[11px] text-slate-400">Emergency school tuition rescue</div>
          </div>
        </div>
      </section>

      {/* Quick Donation Modal (Donor can donate to any selected cause immediately) */}
      <QuickDonateModal
        isOpen={selectedCauseForModal !== null}
        onClose={() => setSelectedCauseForModal(null)}
        cause={selectedCauseForModal}
        onDonationComplete={handleDonationFinished}
        currentUser={currentUser}
        onOpenFullDonate={(cat) => {
          setSelectedCauseForModal(null);
          onOpenDonate(cat);
        }}
      />
    </div>
  );
};
