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
  };

  const handlePortalClick = (tab: 'donor' | 'admin' | 'register') => {
    window.location.hash = tab;
    onNavigate('login');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between min-h-[4rem] sm:min-h-[4.5rem] py-2 gap-2 sm:gap-4">
          
          {/* 1. Brand Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer flex-shrink-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black border border-slate-800 p-0.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
              <img src="/assets/ngo-logo.svg" alt="Fund Bridge Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-lg tracking-wider text-white flex items-center gap-1.5">
                FUND BRIDGE
              </span>
              <span className="text-[10px] sm:text-xs text-teal-400 font-semibold tracking-wider block uppercase -mt-0.5">
                {isDonor ? 'Donor Portal' : isAdmin ? 'Admin Management' : 'NGO Fund Management'}
              </span>
            </div>
          </button>

          {/* 2. Primary Navigation Links - ALWAYS VISIBLE IN HEADER (Home, About Us, Contact Us, Request Aid, QR Code) */}
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-850/90 p-1 sm:p-1.5 rounded-xl border border-slate-700/80 overflow-x-auto max-w-full order-3 md:order-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id || (link.id === 'donate' && currentView === 'qrcode');
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 font-bold ring-1 ring-teal-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. Right Action Zone */}
          <div className="flex items-center gap-2 flex-shrink-0 order-2 md:order-3">
            {isAdmin ? (
              /* If Logged in as ADMIN: Admin Dashboard and Logout */
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToDashboard}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                )}
              </div>
            ) : (
              /* If in DONOR PORTAL: Donor: You / Name and Logout ONLY */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-300 text-xs sm:text-sm font-semibold">
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 flex-shrink-0" />
                  <span className="truncate max-w-[120px]" title={currentUser?.name || currentUser?.email}>
                    Donor: {currentUser?.name?.split(' ')[0] || 'You'}
                  </span>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Sign out of Donor Portal"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
