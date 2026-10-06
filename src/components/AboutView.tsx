import React from 'react';
import { ShieldCheck, Heart, Headset, SearchCheck, Zap, Receipt, Users, Award } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (view: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 pb-16 animate-fadeIn">
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-950/40 via-slate-900 to-slate-900 py-12 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
            Transparency First
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            About NGO Fund Management System
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            Founded on the principle that trust is earned through radical financial transparency, direct community empowerment, and technology-driven accountability.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Mission & Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Our Core Mission</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Bridging Donors &amp; Communities with 100% Financial Integrity
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Traditional non-profit operations often suffer from administrative opacity, delayed funding, and high overhead costs. <strong>Fund Bridge NGO Fund Management System</strong> was built as a unified digital ecosystem where every single contribution is accounted for in a verifiable ledger.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              We operate across 4 key intervention pillars: Healthcare Accessibility, Quality Child Education, Food &amp; Nutrition Security, and Emergency Humanitarian Relief.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigate('donate')}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-md flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                <span>Partner With Us</span>
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm border border-slate-700 flex items-center gap-2"
              >
                <Headset className="w-4 h-4 text-teal-400" />
                <span>Contact Leadership</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-850 p-6 rounded-2xl border border-slate-800 text-center space-y-4 shadow-xl">
            <img src="/assets/hero-illustration.svg" alt="NGO Platform" className="w-full h-auto rounded-xl" />
            <h4 className="font-bold text-white text-base">Certified Non-Profit Financial Ecosystem</h4>
            <p className="text-xs text-slate-400">
              Registered under Non-Profit Act 2018 | Tax Exemption Section 80G Compliant
            </p>
          </div>
        </div>

        {/* Visual Activities Gallery */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Field Activities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Visuals From Our Ground Impact Programs</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Our dedicated volunteer network and partner clinics delivering real results across regions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden group">
              <div className="h-44 bg-slate-900 overflow-hidden">
                <img src="/assets/about-healthcare.svg" alt="Healthcare Program" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-5 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Mobile Health Clinics</h4>
                <p className="text-xs text-slate-400">Free medical camps and preventive health screening for over 25,000 villagers.</p>
              </div>
            </div>

            <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden group">
              <div className="h-44 bg-slate-900 overflow-hidden">
                <img src="/assets/about-education.svg" alt="Education Program" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-5 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Digital Education Drives</h4>
                <p className="text-xs text-slate-400">Equipping rural schools with digital tablets, library books, and teacher training.</p>
              </div>
            </div>

            <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden group">
              <div className="h-44 bg-slate-900 overflow-hidden">
                <img src="/assets/about-food.svg" alt="Food Relief Program" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-5 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Zero Hunger Ration Kits</h4>
                <p className="text-xs text-slate-400">Distributing balanced dry food packages to daily wage earners and migrant families.</p>
              </div>
            </div>

            <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden group">
              <div className="h-44 bg-slate-900 overflow-hidden">
                <img src="/assets/about-disaster.svg" alt="Disaster Response" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-5 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Emergency Disaster Shelters</h4>
                <p className="text-xs text-slate-400">Pre-positioned emergency tents and clean water units during cyclones and floods.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <SearchCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Radical Transparency</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Every rupee raised and spent is publicly audited. Zero hidden fees, zero unaccounted balances.
            </p>
          </div>

          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Swift Disbursement</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Verified medical and disaster emergencies receive financial disbursal within 24 to 48 hours.
            </p>
          </div>

          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instant Tax 80G Receipts</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Immediate compliance receipts generated automatically for all individual and corporate contributors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
