import React from 'react';
import { Donation } from '../types';
import { Printer, X, CheckCircle, ShieldCheck, Download, Activity } from 'lucide-react';

interface ReceiptModalProps {
  donation: Donation | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackDonation?: (donationId: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
  donation, 
  isOpen, 
  onClose,
  onTrackDonation
}) => {
  if (!isOpen || !donation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>Official 80G Donation Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Certificate */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0">
          {/* Certificate Header */}
          <div className="border-b-2 border-teal-600 pb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-black border border-slate-300 flex items-center justify-center p-0.5 overflow-hidden">
                <img src="/assets/ngo-logo.svg" alt="NGO Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">FUND BRIDGE NGO</h2>
                <p className="text-xs text-slate-500 font-medium">Non-Profit Financial Management &amp; Aid Foundation</p>
                <p className="text-[11px] text-teal-700 font-semibold">Section 80G Exemption: 80G-DEL-2021-AA90 | NGO Reg: 2018-941</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Tax-Exempt Receipt
              </div>
              <div className="text-xs text-slate-500 mt-1">Receipt No: <strong className="text-slate-800">{donation.receiptNumber}</strong></div>
              <div className="text-xs text-slate-500">Date: <strong className="text-slate-800">{donation.date}</strong></div>
            </div>
          </div>

          {/* Acknowledgement Text */}
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="mb-2">
              Received with gratitude from <strong className="text-slate-900">{donation.isAnonymous ? 'Anonymous Philanthropist' : donation.donorName}</strong> ({donation.donorEmail}) a voluntary charitable contribution towards our life-saving programs.
            </p>
            <p className="text-slate-600 text-xs">
              This contribution qualifies for 50% / 100% tax exemption under Section 80G of the Non-Profit Tax Regulation Act.
            </p>
          </div>

          {/* Details Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Program / Cause</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium text-slate-900">{donation.cause}</td>
                  <td className="p-3 text-slate-600">{donation.method}</td>
                  <td className="p-3 text-right font-bold text-teal-700 text-base">
                    ₹{donation.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature & Seal */}
          <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <div className="font-semibold text-slate-800">Fund Bridge Audit Desk</div>
              <div className="text-slate-500">100% Direct Disbursement Guarantee</div>
              <div className="text-[11px] text-slate-400 mt-1">National NGO Tower, Financial District</div>
            </div>
            <div className="text-center">
              <div className="font-serif italic font-bold text-teal-800 text-base">Dr. K. Radhakrishnan</div>
              <div className="h-px w-32 bg-slate-400 mx-auto my-1"></div>
              <div className="text-[11px] text-slate-500">Authorized Financial Signatory</div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div>
            {onTrackDonation && (
              <button
                onClick={() => {
                  onClose();
                  onTrackDonation(donation.id);
                }}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Trace which emergency aid programs your contribution was allotted to"
              >
                <Activity className="w-4 h-4 text-teal-200" />
                <span>Trace Fund Allotment →</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
