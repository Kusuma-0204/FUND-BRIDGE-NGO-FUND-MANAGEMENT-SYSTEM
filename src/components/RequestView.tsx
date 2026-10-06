import React, { useState } from 'react';
import { FundRequest } from '../types';
import { FilePen, Search, Paperclip, Send, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RequestViewProps {
  requests: FundRequest[];
  onSubmitRequest: (req: FundRequest) => void;
}

export const RequestView: React.FC<RequestViewProps> = ({ requests, onSubmitRequest }) => {
  const [applicantName, setApplicantName] = useState('');
  const [applicantOrg, setApplicantOrg] = useState('');
  const [category, setCategory] = useState('Healthcare');
  const [urgency, setUrgency] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');
  const [amount, setAmount] = useState<number | ''>('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Tracking section state
  const [trackingCode, setTrackingCode] = useState('REQ-2026-8941');
  const [trackedRequest, setTrackedRequest] = useState<FundRequest | null>(
    requests.find(r => r.id === 'REQ-2026-8941') || requests[0] || null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !amount || !purpose) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newId = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReq: FundRequest = {
        id: newId,
        applicantName: applicantName.trim(),
        org: applicantOrg.trim() || 'Community Partner',
        category,
        urgency,
        amount: Number(amount),
        purpose: purpose.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'Under Review',
        remarks: 'Application logged. Initial document audit in progress with our regional volunteer team.'
      };

      onSubmitRequest(newReq);
      setSubmittedId(newId);
      setTrackedRequest(newReq);
      setTrackingCode(newId);
    }, 700);
  };

  const handleTrack = () => {
    if (!trackingCode.trim()) return;
    const found = requests.find(r => r.id.toLowerCase() === trackingCode.trim().toLowerCase());
    setTrackedRequest(found || null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
          Beneficiary Assistance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Apply for Non-Profit Aid &amp; Grants
        </h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Submit your verified assistance request for healthcare, education, nutrition, or emergency relief funding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Grant Application Form */}
        <div className="lg:col-span-7 bg-slate-850 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <FilePen className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-white text-lg">Aid Grant Application Form</h3>
          </div>

          {submittedId && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl space-y-2 text-xs sm:text-sm text-emerald-200">
              <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Application Registered Successfully!
              </div>
              <p>Your unique tracking tracking number is: <strong className="font-mono text-white text-base bg-emerald-950 px-2 py-0.5 rounded">{submittedId}</strong></p>
              <p>You can track the live review status in the panel on the right.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Applicant / Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Sister Maria Teresa"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Organization / Village / Clinic
                </label>
                <input
                  type="text"
                  value={applicantOrg}
                  onChange={(e) => setApplicantOrg(e.target.value)}
                  placeholder="e.g. St. Jude Learning Center"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Request Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Healthcare">Emergency Medical / Surgery / Medicine</option>
                  <option value="Education">School Supplies / Tuition / Digital Labs</option>
                  <option value="Food & Nutrition">Community Kitchen / Ration Supply</option>
                  <option value="Disaster Relief">Disaster Relief / Emergency Shelter</option>
                  <option value="Clean Water">Clean Drinking Water Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Urgency Level *
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Normal">Normal (Review in 5-7 days)</option>
                  <option value="Urgent">Urgent (Review within 48 hours)</option>
                  <option value="Emergency">Critical Emergency (24h Review)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Estimated Funds Requested (₹ INR) *
              </label>
              <input
                type="number"
                min="500"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="e.g. 25000"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Purpose &amp; Ground Impact Description *
              </label>
              <textarea
                rows={4}
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe the medical condition or relief project, number of direct beneficiaries, and exact fund breakdown..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 text-teal-400" />
                Supporting Documents (Hospital Estimate, Bills, ID Proof)
              </label>
              <input
                type="file"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-700 cursor-pointer text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Transmitting Application...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Aid Request &amp; Generate Tracking ID</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live Application Tracker */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-850 p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                Track Application Status
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your unique reference tracking code to check real-time audit remarks and disbursals.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="e.g. REQ-2026-8941"
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
              />
              <button
                onClick={handleTrack}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors"
              >
                Track
              </button>
            </div>

            {trackedRequest ? (
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <div className="font-mono font-bold text-teal-400 text-sm">{trackedRequest.id}</div>
                    <div className="font-medium text-white text-xs">{trackedRequest.applicantName}</div>
                    <div className="text-[11px] text-slate-400">{trackedRequest.org}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    trackedRequest.status === 'Disbursed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : trackedRequest.status === 'Field Audited'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {trackedRequest.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Category: </span>
                    <span className="text-white font-medium">{trackedRequest.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Amount: </span>
                    <span className="text-teal-300 font-bold font-mono">₹{trackedRequest.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg text-xs space-y-1">
                  <div className="text-slate-400 font-semibold">Audit Remarks:</div>
                  <p className="text-slate-300 italic">{trackedRequest.remarks || 'Under standard review.'}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                No application found matching that code. Try demo code <strong className="text-teal-400">REQ-2026-8941</strong>.
              </div>
            )}
          </div>

          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Direct Vendor Settlement
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              To prevent any potential fund leakage, approved grants are paid directly to verified service providers (e.g. clinics, textbook distributors, hospital billing departments) with public photographic field audit records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
