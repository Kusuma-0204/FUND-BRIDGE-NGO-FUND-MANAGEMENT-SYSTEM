import React from 'react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs sm:text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shadow-xs">
                <img src="/assets/ngo-logo.svg?v=light" alt="Fund Bridge Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-slate-900 text-base tracking-wider">FUND BRIDGE</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              A transparent non-profit platform ensuring 100% accountability in fund raising, audited disbursements, and real-time community impact tracking.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('home')} className="hover:text-teal-600 transition-colors cursor-pointer">Home</button></li>
              <li><button onClick={() => onNavigate('tracker')} className="hover:text-teal-700 text-teal-600 font-semibold transition-colors cursor-pointer">⚡ Emergency Fund Tracker</button></li>
              <li><button onClick={() => onNavigate('about')} className="hover:text-teal-600 transition-colors cursor-pointer">About Us</button></li>
              <li><button onClick={() => onNavigate('request')} className="hover:text-teal-600 transition-colors cursor-pointer">Request Funds</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-teal-600 transition-colors cursor-pointer">Contact Us</button></li>
            </ul>
          </div>

          {/* Portal Access */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Portal Access</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('login')} className="hover:text-teal-600 transition-colors cursor-pointer">User Login &amp; Portal</button></li>
              <li><button onClick={() => onNavigate('login')} className="hover:text-teal-600 transition-colors cursor-pointer">Donor Portal</button></li>
              <li><button onClick={() => onNavigate('login')} className="hover:text-teal-600 transition-colors cursor-pointer">Volunteer Desk</button></li>
              <li><button onClick={() => onNavigate('request')} className="hover:text-teal-600 transition-colors cursor-pointer">Track Application</button></li>
            </ul>
          </div>

          {/* Transparency */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Transparency &amp; Legal</h4>
            <p className="text-xs text-slate-500 mb-2">
              Registered 501(c)(3) &amp; Section 80G Non-Profit Organization.
            </p>
            <p className="text-xs text-slate-500">
              24/7 Helpline: <strong className="text-slate-800">+1 (800) 456-7890</strong>
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4 text-[11px] text-slate-500">
          <div>&copy; 2026 FUND BRIDGE. All rights reserved.</div>
          <div>
            <span>Designed with 100% Financial Transparency &amp; Public Accountability.</span>
            <span className="mx-2">&bull;</span>
            <a href="#admin" className="hover:text-slate-800 transition-colors">Staff Access</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
