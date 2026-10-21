import React, { useState } from 'react';
import { 
  QrCode, LogOut, Menu, X, Home, Users, 
  FileSpreadsheet, Mail, ShieldCheck, User as UserIcon,
  Activity 
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenDonateModal: () => void;
  isLoggedIn: boolean;
  currentUser?: User;
  onLogout?: () => void;
  onGoToDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isLoggedIn,
  currentUser,
  onLogout,
  onGoToDashboard
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDonor = isLoggedIn && currentUser?.role !== 'Administrator';
  const isAdmin = isLoggedIn && currentUser?.role === 'Administrator';

  // Navigation Links: Home, About Us, Fund Tracker, Contact Us, Request Aid, QR Code
  const navLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'about', label: 'About Us', icon: Users },
    { id: 'tracker', label: 'Fund Tracker', icon: Activity },
    { id: 'contact', label: 'Contact Us', icon: Mail },
    { id: 'request', label: 'Request Aid', icon: FileSpreadsheet },
    { id: 'donate', label: 'QR Code', icon: QrCode }
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          
          {/* 1. Brand Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer flex-shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
              <img src="/assets/ngo-logo.svg" alt="Fund Bridge Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base lg:text-lg tracking-wider text-slate-900 flex items-center gap-1.5">
                FUND BRIDGE
              </span>
              <span className="text-[10px] sm:text-xs text-teal-600 font-semibold tracking-wider block uppercase -mt-0.5">
                {isDonor ? 'Donor Portal' : isAdmin ? 'Admin Management' : 'NGO Fund Management'}
              </span>
            </div>
          </button>

          {/* 2. Desktop & Tablet Navigation (NO horizontal slideshow/scroll, clean responsive flex) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-slate-100/90 p-1 lg:p-1.5 rounded-xl border border-slate-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id || (link.id === 'donate' && currentView === 'qrcode');
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs font-bold ring-1 ring-teal-500/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isActive ? 'text-white' : 'text-teal-600'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. Right Action Zone (Laptop & Tablet) */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToDashboard}
                  className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs lg:text-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-2.5 lg:px-3 py-1.5 lg:py-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 lg:gap-2">
                <div className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 bg-teal-50 border border-teal-200/80 rounded-xl text-teal-800 text-xs lg:text-sm font-semibold shadow-xs">
                  <UserIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-teal-600 flex-shrink-0" />
                  <span className="truncate max-w-[130px]" title={currentUser?.name || currentUser?.email}>
                    Donor: {currentUser?.name?.split(' ')[0] || 'You'}
                  </span>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-2.5 lg:px-3 py-1.5 lg:py-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Sign out of Donor Portal"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. Mobile Header Actions (Hamburger Toggle + Donor badge) */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-teal-50 border border-teal-200/80 rounded-lg text-teal-800 text-xs font-semibold">
              <UserIcon className="w-3 h-3 text-teal-600" />
              <span className="truncate max-w-[80px]">
                {currentUser?.name?.split(' ')[0] || 'Donor'}
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
            </button>
          </div>

        </div>

        {/* 5. Mobile Dropdown Drawer (Smooth, clean full-width vertical links, replacing horizontal slideshow) */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-slate-200 bg-white space-y-1.5 animate-fadeIn">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id || (link.id === 'donate' && currentView === 'qrcode');
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-600'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => {
                  onGoToDashboard();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 text-slate-950 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 mt-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};
