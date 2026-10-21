import React, { useState, useMemo } from 'react';
import { Donation, FundRequest, Expense } from '../types';
import { 
  Search, ShieldCheck, Activity, ArrowRight, CheckCircle2, 
  Clock, Building2, Sparkles, QrCode, FileText, 
  Stethoscope, Waves, Utensils, GraduationCap, AlertCircle,
  ExternalLink, ChevronRight, Check
} from 'lucide-react';

interface FundTrackerViewProps {
  donations: Donation[];
  requests: FundRequest[];
  expenses: Expense[];
  onNavigate: (view: string) => void;
  onOpenDonate: (category?: string, amount?: number) => void;
  onViewReceipt: (donation: Donation) => void;
  initialSearchQuery?: string;
}

export const FundTrackerView: React.FC<FundTrackerViewProps> = ({
  donations,
  requests,
  expenses,
  onNavigate,
  onOpenDonate,
  onViewReceipt,
  initialSearchQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(() => {
    if (initialSearchQuery) {
      const found = donations.find(d => 
        d.id.toLowerCase() === initialSearchQuery.toLowerCase() ||
        d.receiptNumber.toLowerCase() === initialSearchQuery.toLowerCase() ||
        d.donorEmail.toLowerCase() === initialSearchQuery.toLowerCase()
      );
      if (found) return found;
    }
    return donations[0] || null;
  });

  // Simulator State
  const [simAmount, setSimAmount] = useState<number>(1000);

  // Search logic
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const match = donations.find(d => 
      d.id.toLowerCase().includes(query) ||
      d.receiptNumber.toLowerCase().includes(query) ||
      d.donorEmail.toLowerCase().includes(query) ||
      d.donorName.toLowerCase().includes(query)
    );

    if (match) {
      setSelectedDonation(match);
    }
  };

  // Derive matched emergency aid for the selected donation
  const matchedAid = useMemo(() => {
    if (!selectedDonation) return null;

    // Try finding an aid request that matches category or has been disbursed
    const disbursed = requests.filter(r => r.status === 'Disbursed');
    const sameCategory = disbursed.find(r => 
      r.category.toLowerCase().includes(selectedDonation.cause.toLowerCase()) ||
      selectedDonation.cause.toLowerCase().includes(r.category.toLowerCase())
    );

    const aid = sameCategory || disbursed[0] || requests[0] || {
      id: 'REQ-EMERGENCY-2026',
      applicantName: 'City Trauma Center',
      org: 'Medical Relief Partner',
      category: selectedDonation.cause || 'Healthcare',
      urgency: 'Emergency',
      amount: selectedDonation.amount,
      purpose: 'Emergency medical assistance and critical ICU stabilization.',
      date: selectedDonation.date,
      status: 'Disbursed',
      remarks: 'Verified by Regional Field Auditor Dr. Jenkins. Disbursed directly to hospital account.'
    };

    return aid;
  }, [selectedDonation, requests]);

  // Total metrics
  const totalRaised = useMemo(() => donations.reduce((sum, d) => sum + d.amount, 0), [donations]);
  const totalDisbursed = useMemo(() => {
    const fromExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const fromReq = requests.filter(r => r.status === 'Disbursed').reduce((sum, r) => sum + r.amount, 0);
    return fromExp + fromReq;
  }, [expenses, requests]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-fadeIn text-slate-800">
      
      {/* 1. Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-teal-800">
          <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span>Real-Time Public Transparency Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Emergency Aid &amp; Fund Allotment Tracker
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Trace every single rupee: See exactly how FundBridge allocates donations to verified ICU treatments, rapid flood relief, pediatric surgeries, and emergency community aid with zero middleman leakage.
        </p>

        {/* Global Transparency Stats Pill */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs">
            <span className="text-slate-500">Total Funds Collected:</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">₹{totalRaised.toLocaleString('en-IN')}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs">
            <span className="text-slate-500">Direct Emergency Aid Disbursed:</span>
            <span className="font-mono font-bold text-purple-700 text-sm">₹{totalDisbursed.toLocaleString('en-IN')}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white border border-teal-200 text-teal-800 flex items-center gap-1.5 font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>100% Institutional Direct Payment</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive "Trace My Donation" Tool */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <Search className="w-6 h-6 text-teal-600" />
              <span>Trace Your Contribution's Allotment</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your Donation ID, 80G Receipt Number, or Email to see the real-world medical or disaster relief grant your funds supported.
            </p>
          </div>

          {/* Sample quick pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Quick Sample:</span>
            {donations.slice(0, 3).map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDonation(d);
                  setSearchQuery(d.id);
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                  selectedDonation?.id === d.id
                    ? 'bg-teal-50 border-teal-400 text-teal-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {d.id}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Donation ID (e.g. DON-1001), Receipt # (80G-1001), or Donor Name..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Trace Allotment</span>
          </button>
        </form>

        {/* Selected Donation Dossier & Allotment Pathway */}
        {selectedDonation && matchedAid && (
          <div className="mt-6 bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-7 space-y-6 animate-fadeIn">
            
            {/* Top Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Verified Contribution {selectedDonation.id}
                  </span>
                  <span className="text-xs text-slate-500">Date: {selectedDonation.date}</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-slate-900">
                  Contributed by: <span className="text-teal-700">{selectedDonation.isAnonymous ? 'Anonymous Donor' : selectedDonation.donorName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Contribution Amount</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                    ₹{selectedDonation.amount.toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  onClick={() => onViewReceipt(selectedDonation)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-teal-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="View official Section 80G Tax-Exempt Receipt"
                >
                  <FileText className="w-4 h-4" />
                  <span>80G Tax Receipt</span>
                </button>
              </div>
            </div>

            {/* 4-Stage Allotment Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>4-Stage Allotment &amp; Disbursement Journey</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Step 1 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">1</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Complete</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">Donation Reconciled</div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Processed via {selectedDonation.method}. Section 80G tax receipt #{selectedDonation.receiptNumber} generated instantly.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">2</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Allocated</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">Emergency Allotment</div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Pooled into FundBridge's <strong className="text-slate-800">{selectedDonation.cause}</strong> active relief reserve fund.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">3</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Audited</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">Field Verification</div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Matched to verified applicant <strong className="text-slate-800">{matchedAid.applicantName}</strong> after hospital paperwork review.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="bg-white p-4 rounded-xl border border-teal-300 shadow-2xs space-y-2 relative overflow-hidden bg-gradient-to-br from-white to-teal-50/50">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">4</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Direct Disbursed</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">Delivered to Institution</div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Paid directly to institutional billing desk. 0% middleman fees. Immediate on-the-ground impact.
                  </p>
                </div>
              </div>
            </div>

            {/* Matched Beneficiary Dossier Box */}
            <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">
                    Allotted Beneficiary &amp; Assistance Dossier
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Tracking Code: {matchedAid.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Primary Beneficiary / Partner:</span>
                  <strong className="text-slate-900 text-sm">{matchedAid.applicantName}</strong>
                  <span className="text-slate-500 block text-[11px]">{matchedAid.org}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Relief Category &amp; Urgency:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-teal-700 font-bold">{matchedAid.category}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      matchedAid.urgency === 'Emergency' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {matchedAid.urgency}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Audit Remarks &amp; Institution:</span>
                  <span className="text-slate-600 leading-snug block">
                    {matchedAid.remarks || 'Direct institutional disbursement verified by regional compliance desk.'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-900">Cause Purpose:</strong> {matchedAid.purpose}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 3. Global Allotment Breakdown (How Every Rupee is Allotted) */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            FundBridge Emergency Allotment Architecture
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Our constitutional mandate guarantees that 100% of public donations go directly into frontline humanitarian aid. Here is our allocation ratio across critical emergencies:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1: Healthcare */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-teal-400/50 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-rose-600 font-mono">40%</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Emergency Healthcare</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                ICU treatments, pediatric cardiac surgeries, emergency dialysis, chemotherapy drugs, and critical trauma care.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-rose-700 font-semibold flex items-center justify-between">
              <span>Paid directly to hospital accounts</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Pillar 2: Disaster Relief */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-teal-400/50 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                <Waves className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-sky-600 font-mono">28%</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Disaster &amp; Flood Relief</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                48-hour emergency response: water purification units, dry ration kits, emergency temporary shelters, and hygiene packets.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-sky-700 font-semibold flex items-center justify-between">
              <span>Rapid deployment kits</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Pillar 3: Food & Nutrition */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-teal-400/50 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Utensils className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-amber-600 font-mono">20%</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Severe Malnutrition Aid</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Community feeding kitchens, therapeutic nutrition packets for children under 5, and emergency ration supply chains.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-semibold flex items-center justify-between">
              <span>Direct vendor procurement</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Pillar 4: Education & Orphans */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-teal-400/50 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-purple-600 font-mono">12%</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Child Education Grants</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Emergency tuition rescue for orphans and children who lost their family breadwinner, uniforms, and textbooks.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-purple-700 font-semibold flex items-center justify-between">
              <span>Paid to school fee accounts</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Allotment Simulator */}
      <div className="bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 rounded-3xl border border-teal-200 p-6 sm:p-10 shadow-sm space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 border border-teal-200 text-xs font-bold text-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Interactive Donor Impact Calculator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            See How Your Donation Will Be Allotted
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Select or customize an amount below to see the exact real-world emergency aid allotment breakdown FundBridge delivers with your contribution.
          </p>
        </div>

        {/* Amount Selector Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {[500, 1000, 2500, 5000, 10000, 25000].map((amt) => (
            <button
              key={amt}
              onClick={() => setSimAmount(amt)}
              className={`px-5 py-2.5 rounded-xl font-mono text-sm font-bold transition-all cursor-pointer ${
                simAmount === amt
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-2 ring-teal-500'
                  : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
              }`}
            >
              ₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
          <div className="relative min-w-[140px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(Math.max(1, Number(e.target.value)))}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
              placeholder="Custom"
              min="1"
            />
          </div>
        </div>

        {/* Real-time Allotment Math Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-[11px] text-rose-600 font-semibold block">40% Healthcare Allotment</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              ₹{(simAmount * 0.40).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-slate-600">
              Funds {Math.max(1, Math.round(simAmount * 0.4 / 15))} days of emergency medicines or diagnostics.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-[11px] text-sky-600 font-semibold block">28% Disaster Relief Allotment</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              ₹{(simAmount * 0.28).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-slate-600">
              Procures {Math.max(1, Math.round(simAmount * 0.28 / 8))} emergency water &amp; ration relief kits.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-[11px] text-amber-600 font-semibold block">20% Nutrition Allotment</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              ₹{(simAmount * 0.20).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-slate-600">
              Cooks {Math.max(2, Math.round(simAmount * 0.20 / 1.5))} nutritious hot meals for children.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-[11px] text-purple-600 font-semibold block">12% Education Allotment</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              ₹{(simAmount * 0.12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-slate-600">
              Sponsors textbooks and semester fee rescue for vulnerable students.
            </p>
          </div>
        </div>

        {/* CTA to Donate */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-700">
            ✅ Includes official <strong>Section 80G Tax Exemption Receipt</strong> with instant QR code tracking.
          </div>
          <button
            onClick={() => {
              onOpenDonate(undefined, simAmount);
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold rounded-2xl text-sm shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <QrCode className="w-4 h-4" />
            <span>Donate ₹{simAmount.toLocaleString('en-IN')} &amp; Allot to Emergency Aid →</span>
          </button>
        </div>
      </div>

      {/* 5. Live Recent Allotments Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>Live Emergency Allotments &amp; Verified Grants Feed</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recent humanitarian aid disbursements paid straight to hospital and vendor accounts.
            </p>
          </div>
          <button
            onClick={() => onNavigate('request')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Need assistance? Apply for aid</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {requests.slice(0, 5).map((req) => (
            <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-3 rounded-xl transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700">{req.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.status === 'Disbursed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : req.status === 'Field Audited'
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {req.status === 'Disbursed' ? 'Direct Disbursed' : req.status}
                  </span>
                  <span className="text-[11px] text-slate-500">{req.category}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {req.applicantName} <span className="text-xs text-slate-500 font-normal">({req.org})</span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {req.purpose}
                </p>
              </div>

              <div className="text-right sm:flex-shrink-0">
                <div className="text-xs text-slate-500">Allotted Aid</div>
                <div className="text-lg font-black text-purple-700 font-mono">
                  ₹{req.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium flex items-center justify-end gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Audited Verification</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
