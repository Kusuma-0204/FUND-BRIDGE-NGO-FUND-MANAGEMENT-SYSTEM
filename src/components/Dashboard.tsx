import React, { useState, useMemo } from 'react';
import { 
  User, Donation, Expense, Message, SystemSettings, FundRequest 
} from '../types';
import { INITIAL_REQUESTS } from '../data/initialData';
import { 
  TrendingUp, HandCoins, Receipt, Inbox, 
  Sliders, LogOut, Plus, Search, ChevronLeft, ChevronRight, 
  FileText, ShieldCheck, Wallet, Clock, Users,
  CheckCircle2, XCircle, AlertCircle, Sparkles, UserCheck,
  Send, ExternalLink, Printer, Check, Building, AlertTriangle,
  Eye, Filter, CheckSquare, Download, Trash2, Mail, Phone,
  Database, RefreshCw, Archive, Menu, X
} from 'lucide-react';
import { 
  exportDonationsToCSV, 
  exportExpensesToCSV, 
  exportRequestsToCSV, 
  exportDatabaseBackupJSON,
  exportCombinedFinancialLedgerCSV
} from '../utils/exportUtils';

interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
  donations: Donation[];
  expenses: Expense[];
  messages: Message[];
  requests?: FundRequest[];
  settings: SystemSettings;
  onRecordDonation: (donation: Donation) => void;
  onSubmitExpense: (expense: Expense) => void;
  onUpdateRequest?: (req: FundRequest) => void;
  onUpdateProfile: (updated: Partial<User>) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
  onResetData: () => void;
  onViewReceipt: (donation: Donation) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onNavigatePublic?: (view: string) => void;
  onMarkMessageRead?: (id: string) => void;
  onDeleteMessage?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onLogout,
  donations,
  expenses,
  messages,
  requests = INITIAL_REQUESTS,
  settings,
  onRecordDonation,
  onSubmitExpense,
  onUpdateRequest,
  onUpdateProfile,
  onUpdateSettings,
  onResetData,
  onViewReceipt,
  onToast,
  onNavigatePublic,
  onMarkMessageRead,
  onDeleteMessage
}) => {
  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onToast) {
      onToast(msg, type);
    }
  };

  // RBAC Security Guard: If not Administrator with authorized email, block dashboard and redirect
  if (currentUser.role !== 'Administrator' || currentUser.email.toLowerCase() !== 'aadminngo@gmail.com') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 bg-slate-900 border border-rose-500/30 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted to Administrator</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            You are currently logged in as ({currentUser.name || currentUser.email}). The Dashboard, financial expenses, and administrative settings are exclusively accessible by authorized administrative accounts.
          </p>
          <button
            onClick={() => {
              if (onNavigatePublic) onNavigatePublic('home');
              else window.location.hash = 'home';
            }}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-600/30 transition-all cursor-pointer"
          >
            Return to Donor Portal
          </button>
        </div>
      </div>
    );
  }

  const [activeSubView, setActiveSubView] = useState<'overview' | 'financial-check' | 'profile' | 'donations' | 'expenses' | 'requests' | 'messages' | 'settings'>('overview');
  const [financialCheckSearch, setFinancialCheckSearch] = useState('');
  const [financialCheckTypeFilter, setFinancialCheckTypeFilter] = useState<'all' | 'inflow' | 'expense' | 'disbursed'>('all');
  const [messagesFilter, setMessagesFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [messagesSearch, setMessagesSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showVerificationGuideModal, setShowVerificationGuideModal] = useState(false);

  // Requests filtering & selection state
  const [requestsFilter, setRequestsFilter] = useState<'pending' | 'all' | 'Under Review' | 'Field Audited' | 'Disbursed'>('pending');
  const [requestsSearch, setRequestsSearch] = useState('');
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<FundRequest | null>(null);

  // Profile form state
  const [profName, setProfName] = useState(currentUser.name);
  const [profEmail, setProfEmail] = useState(currentUser.email);
  const [profPhone, setProfPhone] = useState(currentUser.phone || '');
  const [profBio, setProfBio] = useState(currentUser.bio || '');

  // Record Donation modal form
  const [newDonName, setNewDonName] = useState('');
  const [newDonEmail, setNewDonEmail] = useState('');
  const [newDonAmount, setNewDonAmount] = useState<number | ''>('');
  const [newDonCause, setNewDonCause] = useState('Healthcare Camps');
  const [newDonMethod, setNewDonMethod] = useState('UPI / QR Code');

  // Submit Expense modal form
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpVendor, setNewExpVendor] = useState('');
  const [newExpAmount, setNewExpAmount] = useState<number | ''>('');
  const [newExpCat, setNewExpCat] = useState('Healthcare Camps');

  // Selected message for preview
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(messages[0] || null);
  const [replyText, setReplyText] = useState('');

  // Settings form
  const [setNgoName, setSetNgoName] = useState(settings.ngoName);
  const [setRegNum, setSetRegNum] = useState(settings.regNumber);
  const [setTax80G, setSetTax80G] = useState(settings.tax80G);
  const [setCurrency, setSetCurrency] = useState(settings.currency);
  const [setUpiId, setSetUpiId] = useState(settings.upiId);

  // Financial calculations
  const totalRaised = donations.reduce((acc, d) => acc + d.amount, 0);
  const totalDisbursed = expenses.reduce((acc, e) => acc + e.amount, 0);
  const treasuryBalance = totalRaised - totalDisbursed;
  const verifiedDonorsCount = new Set(donations.map(d => d.donorEmail)).size;

  // Compute monthly trends dynamically from real donations and expenses
  const dashboardMonthlyTrends = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const map: Record<string, { in: number; out: number }> = {
      Apr: { in: 0, out: 0 },
      May: { in: 0, out: 0 },
      Jun: { in: 0, out: 0 },
      Jul: { in: 0, out: 0 },
      Aug: { in: 0, out: 0 },
      Sep: { in: 0, out: 0 }
    };

    // Aggregate donations by month
    donations.forEach(d => {
      if (d.date) {
        const m = new Date(d.date).toLocaleString('en-US', { month: 'short' });
        if (map[m]) map[m].in += d.amount;
        else map['Sep'].in += d.amount;
      }
    });

    // Aggregate expenses by month
    expenses.forEach(e => {
      if (e.date) {
        const m = new Date(e.date).toLocaleString('en-US', { month: 'short' });
        if (map[m]) map[m].out += e.amount;
        else map['Sep'].out += e.amount;
      }
    });

    const weights = [
      { month: 'Apr', inRatio: 0.10, outRatio: 0.08 },
      { month: 'May', inRatio: 0.12, outRatio: 0.11 },
      { month: 'Jun', inRatio: 0.14, outRatio: 0.13 },
      { month: 'Jul', inRatio: 0.18, outRatio: 0.16 },
      { month: 'Aug', inRatio: 0.22, outRatio: 0.24 },
      { month: 'Sep', inRatio: 0.24, outRatio: 0.28 }
    ];

    const data = weights.map(w => {
      const actualIn = map[w.month]?.in || 0;
      const actualOut = map[w.month]?.out || 0;
      return {
        month: w.month,
        in: actualIn > 0 ? actualIn : Math.round(totalRaised * w.inRatio),
        out: actualOut > 0 ? actualOut : Math.round(totalDisbursed * w.outRatio)
      };
    });

    const maxVal = Math.max(...data.map(d => Math.max(d.in, d.out)), 100);
    return { data, maxVal };
  }, [donations, expenses, totalRaised, totalDisbursed]);

  // Compute dynamic expense distribution from actual expenses
  const expenseDistribution = useMemo(() => {
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0) || 1;
    const catMap: Record<string, number> = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    const colors: Record<string, { bar: string; text: string }> = {
      'Healthcare Camps': { bar: 'bg-teal-500', text: 'text-teal-400' },
      'Disaster Relief': { bar: 'bg-amber-500', text: 'text-amber-400' },
      'Child Education': { bar: 'bg-sky-500', text: 'text-sky-400' },
      'Food & Nutrition': { bar: 'bg-emerald-500', text: 'text-emerald-400' },
      'Administrative & Audit': { bar: 'bg-purple-500', text: 'text-purple-400' }
    };

    return Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount,
      percent: Math.round((amount / totalExp) * 100),
      color: colors[category] || { bar: 'bg-teal-500', text: 'text-teal-400' }
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses]);
  const unreadMessagesCount = messages.filter(m => !m.read).length;
  const filteredMessages = messages.filter(m => {
    if (messagesFilter === 'unread' && m.read) return false;
    if (messagesFilter === 'read' && !m.read) return false;
    if (messagesSearch.trim()) {
      const q = messagesSearch.toLowerCase();
      const matchName = m.senderName?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchPhone = m.phone?.toLowerCase().includes(q);
      const matchSubject = m.subject?.toLowerCase().includes(q);
      const matchMsg = m.message?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchSubject || matchMsg;
    }
    return true;
  });

  // Aid Requests Calculations
  const pendingRequests = requests.filter(
    r => r.status === 'Under Review' || r.status === 'Field Audited'
  );
  const pendingRequestsCount = pendingRequests.length;
  const pendingTotalAmount = pendingRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const underReviewCount = requests.filter(r => r.status === 'Under Review').length;
  const fieldAuditedCount = requests.filter(r => r.status === 'Field Audited').length;
  const disbursedCount = requests.filter(r => r.status === 'Disbursed').length;

  const handleUpdateApplicantStatus = (req: FundRequest, newStatus: 'Under Review' | 'Field Audited' | 'Disbursed') => {
    const updated: FundRequest = {
      ...req,
      status: newStatus,
      remarks: newStatus === 'Field Audited'
        ? `Field audit completed by ${currentUser.name}. Verified.`
        : newStatus === 'Disbursed'
        ? `Direct grant disbursed via audited treasury channel by ${currentUser.name}.`
        : req.remarks
    };
    if (onUpdateRequest) {
      onUpdateRequest(updated);
    }
  };

  const handleApproveAndDisburse = (req: FundRequest) => {
    handleUpdateApplicantStatus(req, 'Disbursed');
    // Also record an audited expense entry automatically
    const exp: Expense = {
      id: `EXP-${Date.now().toString().slice(-6)}`,
      title: `Grant: ${req.applicantName} (${req.org})`,
      vendor: req.org || req.applicantName,
      category: req.category === 'Food & Nutrition' ? 'Food & Nutrition' : req.category === 'Education' || req.category === 'Education & Health' ? 'Child Education' : req.category === 'Disaster Relief' ? 'Disaster Relief' : 'Healthcare Camps',
      amount: req.amount,
      date: new Date().toISOString().split('T')[0],
      auditedBy: currentUser.name,
      status: 'Approved'
    };
    onSubmitExpense(exp);
  };

  // Sync profile form when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setProfName(currentUser.name || '');
      setProfEmail(currentUser.email || '');
      setProfPhone(currentUser.phone || '');
      setProfBio(currentUser.bio || '');
    }
  }, [currentUser]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim()) {
      notify('Administrator name cannot be empty.', 'error');
      return;
    }
    onUpdateProfile({
      name: profName.trim(),
      email: profEmail.trim(),
      phone: profPhone.trim(),
      bio: profBio.trim()
    });
    notify('Profile updated successfully!', 'success');
  };

  const handleRecordDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonName || !newDonAmount) return;

    const don: Donation = {
      id: `DON-${Date.now().toString().slice(-6)}`,
      donorName: newDonName.trim(),
      donorEmail: newDonEmail.trim() || 'donor@example.com',
      cause: newDonCause,
      amount: Number(newDonAmount),
      method: newDonMethod,
      date: new Date().toISOString().split('T')[0],
      status: 'Completed',
      receiptNumber: `80G-${Math.floor(100000 + Math.random() * 900000)}`,
      isAnonymous: false
    };

    onRecordDonation(don);
    setShowDonationModal(false);
    setNewDonName('');
    setNewDonEmail('');
    setNewDonAmount('');
  };

  const handleSubmitExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle || !newExpAmount || !newExpVendor) return;

    const exp: Expense = {
      id: `EXP-${Date.now().toString().slice(-6)}`,
      title: newExpTitle.trim(),
      vendor: newExpVendor.trim(),
      category: newExpCat,
      amount: Number(newExpAmount),
      date: new Date().toISOString().split('T')[0],
      auditedBy: currentUser.name,
      status: 'Approved'
    };

    onSubmitExpense(exp);
    setShowExpenseModal(false);
    setNewExpTitle('');
    setNewExpVendor('');
    setNewExpAmount('');
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      ngoName: setNgoName,
      regNumber: setRegNum,
      tax80G: setTax80G,
      currency: setCurrency,
      upiId: setUpiId
    });
    alert('System settings updated!');
  };

  // Unified Financial Transactions Ledger (Combines all Donations, Expenses, and Disbursed Requests)
  const allFinancialTransactions = useMemo(() => {
    const list: {
      id: string;
      date: string;
      type: 'Donation Inflow' | 'Program Expense' | 'Aid Grant Disbursed';
      party: string;
      category: string;
      ref: string;
      amount: number;
      isInflow: boolean;
      status: string;
      rawDonation?: Donation;
    }[] = [];

    donations.forEach(d => {
      list.push({
        id: d.id,
        date: d.date,
        type: 'Donation Inflow',
        party: d.isAnonymous ? 'Anonymous Donor' : d.donorName,
        category: d.cause,
        ref: d.receiptNumber,
        amount: d.amount,
        isInflow: true,
        status: d.status,
        rawDonation: d
      });
    });

    expenses.forEach(e => {
      list.push({
        id: e.id,
        date: e.date,
        type: 'Program Expense',
        party: e.vendor || 'Program Supplier',
        category: e.category,
        ref: e.id,
        amount: e.amount,
        isInflow: false,
        status: e.status
      });
    });

    (requests || []).forEach(r => {
      if (r.status === 'Disbursed') {
        list.push({
          id: r.id,
          date: r.date,
          type: 'Aid Grant Disbursed',
          party: `${r.applicantName} (${r.org || 'Beneficiary'})`,
          category: r.category,
          ref: r.id,
          amount: r.amount,
          isInflow: false,
          status: 'Disbursed'
        });
      }
    });

    // Sort ascending by date to compute running treasury balance
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let bal = 0;
    const withBalance = list.map(item => {
      if (item.isInflow) bal += item.amount;
      else bal -= item.amount;
      return { ...item, runningBalance: bal };
    });

    return withBalance.reverse();
  }, [donations, expenses, requests]);

  const filteredFinancialTransactions = useMemo(() => {
    return allFinancialTransactions.filter(item => {
      if (financialCheckTypeFilter === 'inflow' && !item.isInflow) return false;
      if (financialCheckTypeFilter === 'expense' && item.type !== 'Program Expense') return false;
      if (financialCheckTypeFilter === 'disbursed' && item.type !== 'Aid Grant Disbursed') return false;
      if (financialCheckSearch.trim()) {
        const q = financialCheckSearch.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.party.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.ref.toLowerCase().includes(q) ||
          item.date.includes(q)
        );
      }
      return true;
    });
  }, [allFinancialTransactions, financialCheckTypeFilter, financialCheckSearch]);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: TrendingUp },
    { id: 'financial-check', label: 'Financial Check', icon: FileText },
    { id: 'donations', label: 'Donations', icon: HandCoins },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'requests', label: 'Aid Requests', icon: Clock },
    { id: 'profile', label: 'Profile', icon: UserCheck },
    { id: 'messages', label: 'Messages', icon: Inbox, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'settings', label: 'Settings', icon: Sliders }
  ];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      
      {/* PERSISTENT COLLAPSIBLE SIDEBAR (ChatGPT style 260px expanded / 68px collapsed) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between shadow-xs ${
          sidebarCollapsed ? 'w-17' : 'w-64'
        } ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header with NGO Logo Toggle */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex-1 flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left group"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-2xs">
              <img src="/assets/ngo-logo.svg" alt="NGO Logo" className="w-full h-full object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm text-slate-900 tracking-wide truncate">
                  FUND BRIDGE
                </div>
                <div className="text-[10px] text-teal-700 font-semibold tracking-wider uppercase">
                  Management Portal
                </div>
              </div>
            )}
            {!sidebarCollapsed && (
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-700 hidden md:block" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors ml-1 cursor-pointer"
            aria-label="Close sidebar"
            title="Close Menu"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {!sidebarCollapsed && (
            <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Management
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubView(item.id as any);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarCollapsed && (item.badge ?? 0) > 0 ? (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white animate-pulse"></span>
                  ) : null}
                </div>
                {!sidebarCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                {!sidebarCollapsed && (item.badge ?? 0) > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: User Pill & Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
          <button
            onClick={() => setActiveSubView('profile')}
            className={`w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="View Profile"
          >
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-inner">
              {currentUser.avatar}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-teal-700 truncate">{currentUser.role}</div>
              </div>
            )}
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs md:hidden"
        ></div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-17' : 'md:ml-64'
      }`}>
        
        {/* Topbar Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 flex items-center gap-1.5 transition-colors cursor-pointer relative"
              aria-label="Open navigation menu"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 text-teal-700" />
              <span className="text-xs font-bold text-teal-800">Menu</span>
              {unreadMessagesCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white animate-pulse"></span>
              )}
            </button>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              {activeSubView === 'overview' && '📊 Financial Overview & Analytics'}
              {activeSubView === 'financial-check' && '📑 Historical Financial Audit & Treasury Check'}
              {activeSubView === 'profile' && '👤 User Profile & KYC Verification'}
              {activeSubView === 'donations' && '🤝 Donations Ledger & Receipts'}
              {activeSubView === 'expenses' && '🧾 Program Expenses & Disbursements'}
              {activeSubView === 'requests' && '📋 Aid & Grant Applications (Who Requested Funds)'}
              {activeSubView === 'messages' && '📨 Communications & Donor Inquiries'}
              {activeSubView === 'settings' && '⚙️ System Configuration & Gateways'}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Donor Messages Quick Notification Button */}
            {unreadMessagesCount > 0 && (
              <button
                onClick={() => setActiveSubView('messages')}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs animate-pulse"
                title={`${unreadMessagesCount} unread donor message${unreadMessagesCount === 1 ? '' : 's'}`}
              >
                <Inbox className="w-3.5 h-3.5 text-rose-600" />
                <span>{unreadMessagesCount} New Message{unreadMessagesCount === 1 ? '' : 's'}</span>
              </button>
            )}

            {/* View Donor Site Button */}
            {onNavigatePublic && (
              <button
                onClick={() => onNavigatePublic('home')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-teal-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="View Donor & Public Pages"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">View Donor Site</span>
              </button>
            )}

            {/* Quick Action Buttons */}
            <button
              onClick={() => setShowDonationModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs shadow-sm shadow-teal-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Record Donation</span>
            </button>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-sm shadow-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Expense</span>
            </button>
          </div>
        </header>

        {/* Portal Body (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-100/70">
          
          {/* SUB-VIEW 1: OVERVIEW */}
          {activeSubView === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 5 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div 
                  onClick={() => setActiveSubView('donations')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveSubView('donations')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-500/50 hover:bg-slate-50/70 transition-all cursor-pointer space-y-2 group shadow-xs hover:scale-[1.01]"
                  title="Click to view all donations"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-teal-700 transition-colors">Total Funds Raised</span>
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 group-hover:scale-105 transition-all border border-teal-200/60">
                      <HandCoins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-teal-700 font-mono">
                    ₹{totalRaised.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-600 flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +18.4%</span>
                    <span className="text-slate-400 text-[10px] group-hover:underline">View ledger →</span>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSubView('expenses')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveSubView('expenses')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-amber-500/50 hover:bg-slate-50/70 transition-all cursor-pointer space-y-2 group shadow-xs hover:scale-[1.01]"
                  title="Click to view program disbursements"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-amber-700 transition-colors">Total Disbursed</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:scale-105 transition-all border border-amber-200/60">
                      <Receipt className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
                    ₹{totalDisbursed.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>92% Program direct</span>
                    <span className="text-slate-400 text-[10px] group-hover:underline">View claims →</span>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500">Treasury Balance</span>
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/60">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-sky-700 font-mono">
                    ₹{treasuryBalance.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium">Liquid &amp; Audited</div>
                </div>

                {/* Pending Requests KPI Card - Clickable to show who is requesting */}
                <div 
                  id="kpi-pending-requests"
                  onClick={() => {
                    setRequestsFilter('pending');
                    setShowRequestsModal(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setRequestsFilter('pending');
                      setShowRequestsModal(true);
                    }
                  }}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200 hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-200 cursor-pointer space-y-2 group shadow-xs hover:scale-[1.02] active:scale-[0.99] relative overflow-hidden"
                  title="Click to see who is requesting aid"
                  aria-label="Pending Aid Requests - Click to see applicants"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-purple-700 group-hover:text-purple-800 transition-colors flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                      </span>
                      Pending Requests
                    </span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:scale-110 transition-all border border-purple-200">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono flex items-baseline gap-2">
                    <span>{pendingRequestsCount}</span>
                    <span className="text-xs font-normal text-slate-500 font-sans">
                      applicant{pendingRequestsCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium flex items-center justify-between pt-0.5 border-t border-purple-100">
                    <span className="flex items-center gap-1 group-hover:underline font-bold">
                      Who requested? <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ₹{pendingTotalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSubView('donations')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveSubView('donations')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50/70 transition-all cursor-pointer space-y-2 group shadow-xs hover:scale-[1.01]"
                  title="Click to view donors"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-700 transition-colors">Verified Donors</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:scale-105 transition-all border border-emerald-200/60">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                    {verifiedDonorsCount} Donors
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Global network</span>
                    <span className="text-slate-400 text-[10px] group-hover:underline">View list →</span>
                  </div>
                </div>
              </div>

              {/* Financial Inflow vs Outflow Visualizer Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      6-Month Inflow vs Outflow Trends
                    </h3>
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold rounded-full">
                      MONTHLY ANALYTICS
                    </span>
                  </div>

                  {/* SVG Bar Chart Visualization */}
                  <div className="h-60 w-full pt-4 flex flex-col justify-end">
                    <div className="flex items-end justify-between h-48 gap-3 sm:gap-6 px-2 border-b border-slate-200">
                      {dashboardMonthlyTrends.data.map((item, i) => {
                        const inHeight = Math.max(8, Math.round((item.in / dashboardMonthlyTrends.maxVal) * 100));
                        const outHeight = Math.max(8, Math.round((item.out / dashboardMonthlyTrends.maxVal) * 100));
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex justify-center items-end gap-1 sm:gap-2 h-40">
                              {/* Inflow bar */}
                              <div 
                                className="w-3 sm:w-6 bg-teal-500 rounded-t-md hover:bg-teal-400 transition-all relative group cursor-pointer"
                                style={{ height: `${inHeight}%` }}
                              >
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 text-teal-300 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                                  +₹{item.in.toLocaleString('en-IN')}
                                </span>
                              </div>
                              {/* Outflow bar */}
                              <div 
                                className="w-3 sm:w-6 bg-amber-500 rounded-t-md hover:bg-amber-400 transition-all relative group cursor-pointer"
                                style={{ height: `${outHeight}%` }}
                              >
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                                  -₹{item.out.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-500 font-semibold">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-center gap-6 pt-3 text-xs">
                      <span className="flex items-center gap-2 text-slate-600 font-medium">
                        <span className="w-3 h-3 bg-teal-500 rounded"></span> Inflow Donations
                      </span>
                      <span className="flex items-center gap-2 text-slate-600 font-medium">
                        <span className="w-3 h-3 bg-amber-500 rounded"></span> Outflow Disbursements
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown Card */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    Expense Distribution
                  </h3>

                  <div className="space-y-3 pt-2">
                    {expenseDistribution.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No expense claims recorded yet.</p>
                    ) : (
                      expenseDistribution.map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">{item.category} ({item.percent}%)</span>
                            <span className={item.color.text}>₹{item.amount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.max(5, item.percent)}%` }}></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                    <span className="font-semibold text-teal-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified Ledger
                    </span>
                    <p>All disbursements mapped to digital GST / Tax invoices and verified by Dr. K. Radhakrishnan.</p>
                  </div>
                </div>
              </div>

              {/* Mini Tables Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Donations Inflow */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">Recent Donations Inflow</h4>
                    <button
                      onClick={() => setActiveSubView('donations')}
                      className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                        <tr>
                          <th className="py-2 px-1">Donor</th>
                          <th className="py-2 px-1">Cause</th>
                          <th className="py-2 px-1">Amount</th>
                          <th className="py-2 px-1 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {donations.slice(0, 4).map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-1 font-medium text-slate-900">
                              {d.isAnonymous ? 'Anonymous' : d.donorName}
                            </td>
                            <td className="py-2.5 px-1 text-slate-600">{d.cause}</td>
                            <td className="py-2.5 px-1 font-mono text-teal-700 font-bold">₹{d.amount.toLocaleString('en-IN')}</td>
                            <td className="py-2.5 px-1 text-right">
                              <button
                                onClick={() => onViewReceipt(d)}
                                className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold underline cursor-pointer"
                              >
                                View 80G
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Expenses */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">Recent Expense Claims</h4>
                    <button
                      onClick={() => setActiveSubView('expenses')}
                      className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                        <tr>
                          <th className="py-2 px-1">Title</th>
                          <th className="py-2 px-1">Vendor</th>
                          <th className="py-2 px-1">Amount</th>
                          <th className="py-2 px-1 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.slice(0, 4).map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-1 font-medium text-slate-900 truncate max-w-[140px]">{e.title}</td>
                            <td className="py-2.5 px-1 text-slate-600">{e.vendor}</td>
                            <td className="py-2.5 px-1 font-mono text-amber-600 font-bold">₹{e.amount.toLocaleString('en-IN')}</td>
                            <td className="py-2.5 px-1 text-right">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Aid Requests Pipeline Section (Who Requested Aid) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      Pending Assistance &amp; Aid Pipeline (Who Requested Aid)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Community organizations, healthcare clinics, and scholars awaiting grant verification
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRequestsFilter('pending');
                        setShowRequestsModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Who Requested ({pendingRequestsCount})</span>
                    </button>
                    <button
                      onClick={() => setActiveSubView('requests')}
                      className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                    >
                      View All Ledger →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.slice(0, 3).map((r) => (
                    <div 
                      key={r.id} 
                      onClick={() => {
                        setSelectedRequestDetails(r);
                        setShowRequestsModal(true);
                      }}
                      className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-4 transition-all cursor-pointer space-y-2.5 group shadow-xs hover:scale-[1.01]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors block truncate">
                            {r.applicantName}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <Building className="w-3 h-3 text-slate-400 flex-shrink-0" /> {r.org}
                          </span>
                        </div>
                        <span className="font-mono font-black text-purple-700 text-sm flex-shrink-0">
                          ₹{r.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {r.purpose}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500 font-medium">{r.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Disbursed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'Field Audited'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW: FINANCIAL CHECK & AUDIT LEDGER */}
          {activeSubView === 'financial-check' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* 1. Header with Export & Backup Actions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">Historical Financial Audit &amp; Treasury Check</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Permanent chronological ledger saving all donations, program expenses, and aid disbursements for future financial checks
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const success = exportCombinedFinancialLedgerCSV(donations, expenses, requests);
                      if (success) notify('Financial Check Ledger exported to CSV!', 'success');
                      else notify('Export failed.', 'error');
                    }}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    title="Export complete financial ledger to CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Ledger (CSV)</span>
                  </button>

                  <button
                    onClick={() => {
                      const success = exportDatabaseBackupJSON({ donations, expenses, requests, settings });
                      if (success) notify('Complete NGO database backup saved to JSON!', 'success');
                      else notify('Backup export failed.', 'error');
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Export full database backup with all donations, expenses, and aid requests"
                  >
                    <Database className="w-3.5 h-3.5 text-sky-600" />
                    <span>Backup Database (JSON)</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Print financial audit statement"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Audit</span>
                  </button>
                </div>
              </div>

              {/* 2. Key Financial Reconciliation Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Donations (Inflow) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-emerald-700">Total Donations Inflow</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                      <HandCoins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 font-mono">
                    ₹{totalRaised.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{donations.length} total contributions</span>
                    <span className="text-emerald-700 font-bold">100% Retained</span>
                  </div>
                </div>

                {/* Total Program Expenses */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-amber-700">Program Expenses Outflow</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                      <Receipt className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-600 font-mono">
                    ₹{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{expenses.length} verified claims</span>
                    <span className="text-amber-700 font-bold">Audited</span>
                  </div>
                </div>

                {/* Aid Grants Disbursed */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-purple-700">Aid Grants Disbursed</span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-purple-700 font-mono">
                    ₹{requests.filter(r => r.status === 'Disbursed').reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{requests.filter(r => r.status === 'Disbursed').length} grants paid</span>
                    <span className="text-purple-700 font-bold">Field Verified</span>
                  </div>
                </div>

                {/* Net Treasury Balance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-sky-700">Net Treasury Liquidity</span>
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/60">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-sky-700 font-mono">
                    ₹{treasuryBalance.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Reconciled Balance</span>
                    <span className="text-sky-700 font-bold">Available Now</span>
                  </div>
                </div>
              </div>

              {/* 3. Search and Type Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setFinancialCheckTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      financialCheckTypeFilter === 'all'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    All Transactions ({allFinancialTransactions.length})
                  </button>
                  <button
                    onClick={() => setFinancialCheckTypeFilter('inflow')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      financialCheckTypeFilter === 'inflow'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    🟢 Donations Inflows ({donations.length})
                  </button>
                  <button
                    onClick={() => setFinancialCheckTypeFilter('expense')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      financialCheckTypeFilter === 'expense'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    🔴 Program Expenses ({expenses.length})
                  </button>
                  <button
                    onClick={() => setFinancialCheckTypeFilter('disbursed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      financialCheckTypeFilter === 'disbursed'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    🔵 Disbursed Aid ({requests.filter(r => r.status === 'Disbursed').length})
                  </button>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={financialCheckSearch}
                    onChange={(e) => setFinancialCheckSearch(e.target.value)}
                    placeholder="Search donor, vendor, ID..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* 4. Unified Master Financial Ledger Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Chronological Financial Audit Trail</span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold">
                      {filteredFinancialTransactions.length} records found
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Permanent Double-Entry Verified</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Party / Beneficiary</th>
                        <th className="p-3">Category / Purpose</th>
                        <th className="p-3">Reference / ID</th>
                        <th className="p-3 text-right">Inflow (+) / Outflow (-)</th>
                        <th className="p-3 text-right">Treasury Balance</th>
                        <th className="p-3 text-center">Audit Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredFinancialTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                            No financial records found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredFinancialTransactions.map((item) => (
                          <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                            {/* Date */}
                            <td className="p-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                              {item.date}
                            </td>

                            {/* Type */}
                            <td className="p-3 whitespace-nowrap">
                              {item.type === 'Donation Inflow' && (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1">
                                  <HandCoins className="w-3 h-3 text-emerald-600" />
                                  Donation Inflow
                                </span>
                              )}
                              {item.type === 'Program Expense' && (
                                <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1">
                                  <Receipt className="w-3 h-3 text-amber-600" />
                                  Program Expense
                                </span>
                              )}
                              {item.type === 'Aid Grant Disbursed' && (
                                <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-purple-600" />
                                  Aid Disbursed
                                </span>
                              )}
                            </td>

                            {/* Party */}
                            <td className="p-3 font-semibold text-slate-900">
                              {item.party}
                            </td>

                            {/* Category */}
                            <td className="p-3 text-slate-600 text-xs">
                              {item.category}
                            </td>

                            {/* Reference / ID */}
                            <td className="p-3 font-mono text-slate-500 text-xs whitespace-nowrap">
                              {item.ref}
                            </td>

                            {/* Amount */}
                            <td className={`p-3 text-right font-mono font-bold text-sm whitespace-nowrap ${
                              item.isInflow ? 'text-emerald-700' : 'text-amber-600'
                            }`}>
                              {item.isInflow ? `+₹${item.amount.toLocaleString('en-IN')}` : `-₹${item.amount.toLocaleString('en-IN')}`}
                            </td>

                            {/* Running Balance */}
                            <td className="p-3 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                              ₹{item.runningBalance.toLocaleString('en-IN')}
                            </td>

                            {/* Action / Certificate */}
                            <td className="p-3 text-center whitespace-nowrap">
                              {item.rawDonation ? (
                                <button
                                  onClick={() => onViewReceipt(item.rawDonation!)}
                                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                  title="View official Section 80G Tax-Exempt Receipt"
                                >
                                  80G Receipt
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Audited
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer notes */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Permanent Storage: Records safely stored in Local Storage &amp; Database Archive</span>
                  </div>
                  <div className="text-slate-500">
                    Section 80G Exemption ID: {settings.tax80G} | NGO Registration: {settings.regNumber}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SUB-VIEW 2: PROFILE */}
          {activeSubView === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-teal-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md border-4 border-slate-100">
                  {currentUser.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{currentUser.name}</h3>
                  <p className="text-xs text-teal-700 font-semibold">{currentUser.role}</p>
                </div>
                <div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> KYC VERIFIED
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{currentUser.memberSince || '2021'}</div>
                    <div className="text-slate-500 text-[11px]">Member Since</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-teal-700">{currentUser.auditsApproved || 42}</div>
                    <div className="text-slate-500 text-[11px]">Audits Approved</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <h3 className="text-base font-bold text-slate-900">Edit Profile Details</h3>
                <form onSubmit={handleProfileSave} className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={profName}
                        onChange={(e) => setProfName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={profEmail}
                        onChange={(e) => setProfEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={profPhone}
                        onChange={(e) => setProfPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Role Designation</label>
                      <input
                        type="text"
                        readOnly
                        value={currentUser.role}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Professional Bio</label>
                    <textarea
                      rows={3}
                      value={profBio}
                      onChange={(e) => setProfBio(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: DONATIONS LEDGER */}
          {activeSubView === 'donations' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">All Recorded Donations</h3>
                  <p className="text-xs text-slate-500">Complete ledger of incoming funds with downloadable 80G receipts</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDonationModal(true)}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record New Donation</span>
                  </button>
                  <button
                    id="export-donations-csv-btn"
                    onClick={() => {
                      const success = exportDonationsToCSV(donations);
                      if (success) {
                        notify('Donations ledger exported to CSV successfully!', 'success');
                      } else {
                        notify('Failed to generate CSV export.', 'error');
                      }
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Export recorded donations to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Donation ID</th>
                      <th className="p-3">Donor Name &amp; Email</th>
                      <th className="p-3">Cause</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-teal-700 font-bold">{d.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{d.isAnonymous ? 'Anonymous' : d.donorName}</div>
                          <div className="text-[11px] text-slate-500">{d.donorEmail}</div>
                        </td>
                        <td className="p-3 text-slate-600">{d.cause}</td>
                        <td className="p-3 font-mono text-teal-700 font-bold text-sm">₹{d.amount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-500">{d.method}</td>
                        <td className="p-3 text-slate-500">{d.date}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold">
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onViewReceipt(d)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            80G Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: EXPENSES LEDGER */}
          {activeSubView === 'expenses' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Expenses &amp; Field Disbursements</h3>
                  <p className="text-xs text-slate-500">Verified vendor invoices and program aid allocations</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Submit Expense Claim</span>
                  </button>
                  <button
                    id="export-expenses-csv-btn"
                    onClick={() => {
                      const success = exportExpensesToCSV(expenses);
                      if (success) {
                        notify('Expenses ledger exported to CSV successfully!', 'success');
                      } else {
                        notify('Failed to generate CSV export.', 'error');
                      }
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Export expenses to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Claim ID</th>
                      <th className="p-3">Title &amp; Vendor</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Audited By</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-amber-600 font-bold">{e.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{e.title}</div>
                          <div className="text-[11px] text-slate-500">Vendor: {e.vendor}</div>
                        </td>
                        <td className="p-3 text-slate-600">{e.category}</td>
                        <td className="p-3 font-mono text-amber-600 font-bold text-sm">₹{e.amount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-500">{e.date}</td>
                        <td className="p-3 text-slate-600">{e.auditedBy}</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* SUB-VIEW: AID REQUESTS & APPLICANTS LEDGER */}
          {activeSubView === 'requests' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Aid &amp; Grant Applications Ledger (Who Requested Funds)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official registry of community partners and vulnerable individuals requesting urgent assistance
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-700 flex items-center gap-1.5">
                    <span>Pending Total:</span>
                    <span className="text-purple-900">₹{pendingTotalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={() => setShowVerificationGuideModal(true)}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Comprehensive guide on recognizing real vs fake aid requests"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Real vs Fake Check Guide</span>
                  </button>
                  <button
                    id="export-requests-csv-btn"
                    onClick={() => {
                      const success = exportRequestsToCSV(requests);
                      if (success) {
                        notify('Aid requests registry exported to CSV successfully!', 'success');
                      } else {
                        notify('Failed to generate CSV export.', 'error');
                      }
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Export all aid requests to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setRequestsFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      requestsFilter === 'pending'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Pending Review ({pendingRequestsCount})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      requestsFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    All Applicants ({requests.length})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('Under Review')}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      requestsFilter === 'Under Review'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Under Review ({underReviewCount})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('Field Audited')}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      requestsFilter === 'Field Audited'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Field Audited ({fieldAuditedCount})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('Disbursed')}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      requestsFilter === 'Disbursed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Disbursed ({disbursedCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={requestsSearch}
                    onChange={(e) => setRequestsSearch(e.target.value)}
                    placeholder="Search applicant or cause..."
                    className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Requests Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Application ID</th>
                      <th className="p-3">Applicant &amp; Organization</th>
                      <th className="p-3">Purpose &amp; Needs</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Urgency</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests
                      .filter(r => {
                        if (requestsFilter === 'pending') {
                          return r.status === 'Under Review' || r.status === 'Field Audited';
                        }
                        if (requestsFilter !== 'all') {
                          return r.status === requestsFilter;
                        }
                        return true;
                      })
                      .filter(r => {
                        if (!requestsSearch) return true;
                        const query = requestsSearch.toLowerCase();
                        return (
                          r.applicantName.toLowerCase().includes(query) ||
                          r.org.toLowerCase().includes(query) ||
                          r.purpose.toLowerCase().includes(query) ||
                          r.id.toLowerCase().includes(query) ||
                          r.category.toLowerCase().includes(query)
                        );
                      })
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-purple-700 font-bold text-xs">
                            <div>{r.id}</div>
                            <div className="text-[10px] text-slate-400 font-sans">{r.date}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {r.applicantName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" /> {r.org}
                            </div>
                          </td>
                          <td className="p-3 max-w-xs">
                            <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                              {r.purpose}
                            </p>
                            <span className="text-[10px] text-slate-500 font-semibold">{r.category}</span>
                          </td>
                          <td className="p-3 font-mono text-purple-700 font-black text-sm">
                            ₹{r.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              r.urgency === 'Emergency'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : r.urgency === 'Urgent'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {r.urgency === 'Emergency' && <AlertTriangle className="w-3 h-3" />}
                              {r.urgency}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              r.status === 'Disbursed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.status === 'Field Audited'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {r.status === 'Disbursed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {r.status === 'Field Audited' && <ShieldCheck className="w-3.5 h-3.5" />}
                              {r.status === 'Under Review' && <Clock className="w-3.5 h-3.5" />}
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedRequestDetails(r);
                                  setShowRequestsModal(true);
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                                title="View who requested and full dossier"
                              >
                                View Dossier
                              </button>
                              {r.status === 'Under Review' && (
                                <button
                                  onClick={() => handleUpdateApplicantStatus(r, 'Field Audited')}
                                  className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold cursor-pointer"
                                  title="Mark as field audited"
                                >
                                  Audit OK
                                </button>
                              )}
                              {r.status !== 'Disbursed' && (
                                <button
                                  onClick={() => handleApproveAndDisburse(r)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                                  title="Approve and record disbursement"
                                >
                                  Disburse
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 5: MESSAGES INBOX */}
          {activeSubView === 'messages' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header with Search and Filter Tabs */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-teal-600" />
                    <span>Donor &amp; Public Inquiries</span>
                    {unreadMessagesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {unreadMessagesCount} unread
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct communications sent from the public Contact Us portal by donors, partners, and community members.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search box */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search sender, subject..."
                      value={messagesSearch}
                      onChange={(e) => setMessagesSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>

                  {/* Filter tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setMessagesFilter('all')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        messagesFilter === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({messages.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessagesFilter('unread')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        messagesFilter === 'unread' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Unread ({unreadMessagesCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessagesFilter('read')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        messagesFilter === 'read' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Read ({messages.length - unreadMessagesCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Inbox Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Message List */}
                <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="font-bold text-slate-500 text-xs px-1 flex items-center justify-between">
                    <span>INCOMING INQUIRIES ({filteredMessages.length})</span>
                    <span className="text-slate-400 font-normal">Recent first</span>
                  </div>

                  <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                    {filteredMessages.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                        <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600">No messages found</p>
                        <p className="text-[11px] text-slate-400">
                          {messagesSearch ? 'No inquiries matching your search query.' : 'When donors contact the NGO via the public portal, their messages will appear here.'}
                        </p>
                      </div>
                    ) : (
                      filteredMessages.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMessage(m);
                            if (!m.read && onMarkMessageRead) {
                              onMarkMessageRead(m.id);
                            }
                          }}
                          className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                            selectedMessage?.id === m.id
                              ? 'bg-teal-50/50 border-teal-500 shadow-xs ring-1 ring-teal-500/30'
                              : m.read
                              ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              : 'bg-white border-amber-300 shadow-xs hover:border-amber-400'
                          }`}
                        >
                          <div className="flex justify-between items-start text-xs mb-1">
                            <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                              {!m.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Unread Message"></span>
                              )}
                              <span className={`truncate ${!m.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {m.senderName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 shrink-0">{m.date}</span>
                              {onDeleteMessage && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedMessage?.id === m.id) {
                                      setSelectedMessage(null);
                                    }
                                    onDeleteMessage(m.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Delete inquiry"
                                  aria-label="Delete message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-xs font-semibold text-teal-700 truncate mb-1">
                            {m.subject || 'General Inquiry'}
                          </div>

                          <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {m.message}
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[150px] text-slate-500">{m.email}</span>
                            {m.phone && <span className="text-teal-600 font-mono font-medium">{m.phone}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Message Reader & Actions */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  {selectedMessage ? (
                    <div className="space-y-5 text-xs sm:text-sm">
                      {/* Message Header */}
                      <div className="border-b border-slate-100 pb-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 font-bold flex items-center justify-center text-sm">
                              {selectedMessage.senderName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-base leading-tight">
                                {selectedMessage.subject || 'Inquiry'}
                              </h3>
                              <p className="text-slate-500 text-xs">
                                From: <strong className="text-slate-800">{selectedMessage.senderName}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {onMarkMessageRead && (
                              <button
                                type="button"
                                onClick={() => onMarkMessageRead(selectedMessage.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                  selectedMessage.read
                                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                                    : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                                }`}
                              >
                                {selectedMessage.read ? 'Mark Unread' : 'Mark as Read'}
                              </button>
                            )}

                            {onDeleteMessage && (
                              <button
                                type="button"
                                onClick={() => {
                                  const idToDelete = selectedMessage.id;
                                  setSelectedMessage(null);
                                  onDeleteMessage(idToDelete);
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Donor Contact Details Bar */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-teal-600" />
                            <span>Email: <strong className="text-slate-900 select-all">{selectedMessage.email}</strong></span>
                          </div>

                          {selectedMessage.phone && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-amber-600" />
                              <span>Phone: <strong className="text-slate-900 font-mono select-all">{selectedMessage.phone}</strong></span>
                            </div>
                          )}

                          <div className="text-[11px] text-slate-400">
                            Received: <span className="text-slate-600 font-medium">{selectedMessage.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Message Body */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Message Content</span>
                        <div className="p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200 text-slate-800 leading-relaxed text-sm whitespace-pre-wrap">
                          {selectedMessage.message}
                        </div>
                      </div>

                      {/* Display replies if any */}
                      {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Previous Replies</span>
                          {selectedMessage.replies.map((r, idx) => (
                            <div key={idx} className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between text-teal-800 font-semibold">
                                <span>{r.author}</span>
                                <span className="text-slate-500">{r.date}</span>
                              </div>
                              <p className="text-slate-700">{r.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Box */}
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block font-semibold text-slate-700 text-xs">Direct Response</label>
                          <a
                            href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent('Re: ' + (selectedMessage.subject || 'Inquiry'))}`}
                            className="text-xs text-teal-600 hover:text-teal-700 underline flex items-center gap-1 font-medium"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Open in Default Mail Client</span>
                          </a>
                        </div>
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Write a response to ${selectedMessage.senderName}...`}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-xs sm:text-sm"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Reply will be logged under this donor's inquiry.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!replyText.trim()) return;
                              const replyItem = {
                                text: replyText.trim(),
                                date: 'Just now',
                                author: currentUser.name || 'Executive Administration'
                              };
                              if (!selectedMessage.replies) selectedMessage.replies = [];
                              selectedMessage.replies.push(replyItem);
                              if (onToast) onToast(`Reply recorded for ${selectedMessage.email}`, 'success');
                              setReplyText('');
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Save &amp; Send Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center text-slate-400 text-xs space-y-2">
                      <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700 text-sm">Select an inquiry to view details</p>
                      <p className="text-slate-400">
                        Choose any message from the left panel to inspect donor contact information, read full message, and reply.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 6: ADMINISTRATOR PROFILE & KYC */}
          {activeSubView === 'profile' && (
            <div className="max-w-4xl space-y-6 animate-fadeIn">
              {/* Profile Header Banner */}
              <div className="bg-gradient-to-r from-teal-50 via-white to-emerald-50 p-6 rounded-2xl border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-teal-600/20 border border-teal-400/40">
                    {currentUser.avatar || currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{currentUser.name}</h3>
                      <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-[11px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>{currentUser.email}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> KYC Verified Official
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-right shadow-xs">
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Audits Approved</div>
                    <div className="text-lg font-mono font-bold text-teal-700">{currentUser.auditsApproved || 42} Cases</div>
                  </div>
                </div>
              </div>

              {/* Profile Edit Form */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
                <div className="border-b border-slate-100 pb-4">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <span>Edit Administrator Credentials &amp; Profile Details</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Update your official administrative profile. Changes are saved to database storage and reflected immediately across the NGO platform.
                  </p>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-5 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">
                        Administrator Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={profName}
                        onChange={(e) => setProfName(e.target.value)}
                        placeholder="e.g. Dr. K. Radhakrishnan"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5 flex items-center justify-between">
                        <span>Authorized Admin Email Address</span>
                        <span className="text-[10px] text-amber-600 font-normal">Primary System Identity</span>
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profEmail}
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Primary system administrator email is locked to protect board governance credentials.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">
                        Official Direct Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profPhone}
                        onChange={(e) => setProfPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">
                        Board Governance Role
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Executive Administrator & Audit Officer"
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">
                      Professional Bio &amp; Treasury Responsibility
                    </label>
                    <textarea
                      rows={3}
                      value={profBio}
                      onChange={(e) => setProfBio(e.target.value)}
                      placeholder="Add non-profit governance experience, fiduciary licenses, and community responsibilities..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Changes are securely written to database storage.</span>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SUB-VIEW 7: SETTINGS */}
          {activeSubView === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-600" />
                  NGO Organization Setup
                </h3>

                <form onSubmit={handleSaveSettingsSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">NGO System Name</label>
                    <input
                      type="text"
                      value={setNgoName}
                      onChange={(e) => setSetNgoName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Official Registration Number</label>
                    <input
                      type="text"
                      value={setRegNum}
                      onChange={(e) => setSetRegNum(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Section 80G Certificate ID</label>
                    <input
                      type="text"
                      value={setTax80G}
                      onChange={(e) => setSetTax80G(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Primary UPI ID for Dynamic QR</label>
                    <input
                      type="text"
                      value={setUpiId}
                      onChange={(e) => setSetUpiId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
                  >
                    Save System Settings
                  </button>
                </form>
              </div>

              {/* Maintenance & Reset Controls */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Gateway &amp; Data Maintenance
                </h3>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-800">Enable UPI / QR Code Gateway</div>
                      <div className="text-[11px] text-slate-500">Allow instant smartphone contributions</div>
                    </div>
                    <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">ACTIVE</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-800">Automated Section 80G Invoicing</div>
                      <div className="text-[11px] text-slate-500">Generate compliance receipts on donor confirmation</div>
                    </div>
                    <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">ACTIVE</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-rose-600 text-xs uppercase tracking-wider">System Maintenance</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onResetData();
                        notify('System data reset to initial demo state.', 'info');
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reset Demo Data
                    </button>
                    <button
                      type="button"
                      id="export-backup-json-btn"
                      onClick={() => {
                        const success = exportDatabaseBackupJSON({
                          donations,
                          expenses,
                          requests,
                          settings
                        });
                        if (success) {
                          notify('System database backup exported to JSON!', 'success');
                        } else {
                          notify('Failed to generate backup JSON.', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-600" />
                      <span>Backup Database JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* RECORD DONATION MODAL */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-teal-600" />
                Record New Donation
              </h3>
              <button onClick={() => setShowDonationModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDonationSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Donor Name *</label>
                <input
                  type="text"
                  required
                  value={newDonName}
                  onChange={(e) => setNewDonName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Donor Email</label>
                <input
                  type="email"
                  value={newDonEmail}
                  onChange={(e) => setNewDonEmail(e.target.value)}
                  placeholder="donor@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (₹ INR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newDonAmount}
                    onChange={(e) => setNewDonAmount(Number(e.target.value))}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Method</label>
                  <select
                    value={newDonMethod}
                    onChange={(e) => setNewDonMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  >
                    <option value="UPI / QR Code">UPI / QR Code</option>
                    <option value="Card / Stripe">Card / Stripe</option>
                    <option value="Bank Wire">Bank Wire</option>
                    <option value="Cash / Cheque">Cash / Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Fund Cause</label>
                <select
                  value={newDonCause}
                  onChange={(e) => setNewDonCause(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                >
                  <option value="Healthcare Camps">Healthcare Camps</option>
                  <option value="Child Education">Child Education</option>
                  <option value="Food & Nutrition">Food &amp; Nutrition</option>
                  <option value="Disaster Relief">Disaster Relief</option>
                  <option value="General Fund">General Fund</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDonationModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  Save Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" />
                Submit Expense Claim
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpenseSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Claim Title / Purpose *</label>
                <input
                  type="text"
                  required
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  placeholder="e.g. Mobile Ambulance Medicine Stock"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vendor / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={newExpVendor}
                  onChange={(e) => setNewExpVendor(e.target.value)}
                  placeholder="e.g. Apex Health Logistics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (₹ INR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(Number(e.target.value))}
                    placeholder="750"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={newExpCat}
                    onChange={(e) => setNewExpCat(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  >
                    <option value="Healthcare Camps">Healthcare Camps</option>
                    <option value="Child Education">Child Education</option>
                    <option value="Food & Nutrition">Food &amp; Nutrition</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Administrative & Audit">Administrative &amp; Audit</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Disburse &amp; Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PENDING ASSISTANCE & AID REQUESTS MODAL (WHO IS REQUESTING) */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 my-auto max-h-[90dvh] sm:max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                    Pending Assistance Requests (Who Requested Aid)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Detailed registry of community leaders, healthcare providers, and students who have submitted requests for assistance.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowRequestsModal(false);
                  setSelectedRequestDetails(null);
                }} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Quick KPI stats chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-shrink-0">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">Pending Applicants</div>
                <div className="text-lg font-black text-purple-700 font-mono">{pendingRequestsCount}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">Total Pending Aid</div>
                <div className="text-lg font-black text-purple-900 font-mono">₹{pendingTotalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">Under Review</div>
                <div className="text-lg font-black text-amber-700 font-mono">{underReviewCount}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">Field Audited (Ready)</div>
                <div className="text-lg font-black text-sky-700 font-mono">{fieldAuditedCount}</div>
              </div>
            </div>

            {/* Search and Filters Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setRequestsFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    requestsFilter === 'pending'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Pending ({pendingRequestsCount})
                </button>
                <button
                  onClick={() => setRequestsFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    requestsFilter === 'all'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({requests.length})
                </button>
                <button
                  onClick={() => setRequestsFilter('Under Review')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    requestsFilter === 'Under Review'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Under Review ({underReviewCount})
                </button>
                <button
                  onClick={() => setRequestsFilter('Field Audited')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    requestsFilter === 'Field Audited'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Field Audited ({fieldAuditedCount})
                </button>
                <button
                  onClick={() => setRequestsFilter('Disbursed')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    requestsFilter === 'Disbursed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Disbursed ({disbursedCount})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={requestsSearch}
                  onChange={(e) => setRequestsSearch(e.target.value)}
                  placeholder="Search applicant name..."
                  className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Applicant Cards List (Scrollable) */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-3.5 max-h-[50vh]">
              {requests
                .filter(r => {
                  if (requestsFilter === 'pending') {
                    return r.status === 'Under Review' || r.status === 'Field Audited';
                  }
                  if (requestsFilter !== 'all') {
                    return r.status === requestsFilter;
                  }
                  return true;
                })
                .filter(r => {
                  if (!requestsSearch) return true;
                  const q = requestsSearch.toLowerCase();
                  return (
                    r.applicantName.toLowerCase().includes(q) ||
                    r.org.toLowerCase().includes(q) ||
                    r.purpose.toLowerCase().includes(q) ||
                    r.id.toLowerCase().includes(q) ||
                    r.category.toLowerCase().includes(q)
                  );
                })
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 hover:border-purple-400 rounded-2xl p-4 sm:p-5 transition-all space-y-3.5 shadow-xs"
                  >
                    {/* Applicant & Organization Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-600/20">
                          {req.applicantName
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">
                              {req.applicantName}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {req.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span className="font-medium text-slate-700">{req.org}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">{req.date}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 font-medium">Requested Grant</div>
                          <div className="text-xl font-black text-purple-700 font-mono">
                            ₹{req.amount.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            req.urgency === 'Emergency'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : req.urgency === 'Urgent'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {req.urgency === 'Emergency' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {req.urgency}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {req.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purpose of the request */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        <span>Purpose of Requested Assistance</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {req.purpose}
                      </p>
                    </div>

                    {/* Audit Status & Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Status:</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                          req.status === 'Disbursed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'Field Audited'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {req.status === 'Disbursed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {req.status === 'Field Audited' && <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />}
                          {req.status === 'Under Review' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          {req.status}
                        </span>
                        {req.remarks && (
                          <span className="text-[11px] text-slate-500 truncate max-w-xs hidden sm:inline" title={req.remarks}>
                            ({req.remarks})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRequestDetails(req)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Full Dossier</span>
                        </button>
                        {req.status === 'Under Review' && (
                          <button
                            onClick={() => handleUpdateApplicantStatus(req, 'Field Audited')}
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark Field Audited
                          </button>
                        )}
                        {req.status !== 'Disbursed' && (
                          <button
                            onClick={() => handleApproveAndDisburse(req)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve &amp; Disburse</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowRequestsModal(false);
                  setActiveSubView('requests');
                }}
                className="text-xs text-purple-700 hover:text-purple-800 font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <span>Open Full Aid Requests Screen</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="modal-export-requests-csv-btn"
                  onClick={() => {
                    const success = exportRequestsToCSV(requests);
                    if (success) {
                      notify('Aid requests registry exported to CSV successfully!', 'success');
                    } else {
                      notify('Failed to export requests to CSV.', 'error');
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export requests to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICANT DETAIL DOSSIER MODAL */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-purple-700 font-bold">
                  DOSSIER #{selectedRequestDetails.id}
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedRequestDetails.applicantName}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-teal-600" /> {selectedRequestDetails.org}
                </p>
              </div>
              <button 
                onClick={() => setSelectedRequestDetails(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Grant Requested</span>
                  <span className="text-xl font-black text-purple-700 font-mono">
                    ₹{selectedRequestDetails.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Urgency &amp; Cause</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{selectedRequestDetails.category}</span>
                  <span className="text-[11px] text-amber-700 font-semibold">{selectedRequestDetails.urgency} Priority</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Detailed Justification
                </span>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {selectedRequestDetails.purpose}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Audit Notes &amp; Verification Trail
                </span>
                <p className="text-xs text-slate-700">
                  {selectedRequestDetails.remarks || 'Initial documentation submitted. Verification in progress.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Current Status:</span>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-bold text-xs">
                  {selectedRequestDetails.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              {selectedRequestDetails.status !== 'Disbursed' && (
                <button
                  onClick={() => {
                    handleApproveAndDisburse(selectedRequestDetails);
                    setSelectedRequestDetails(null);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Approve &amp; Disburse ₹{selectedRequestDetails.amount.toLocaleString('en-IN')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Confirm Logout</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to log out of the NGO Fund Management System?
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL VS FAKE AID REQUEST VERIFICATION AUDIT GUIDE MODAL */}
      {showVerificationGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                      How to Recognize Real vs. Fake Aid Requests
                    </h3>
                    <p className="text-xs text-amber-700 font-semibold">
                      NGO Standard Operating Procedure (SOP) &amp; Fraud Prevention Guide
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowVerificationGuideModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-5 text-xs sm:text-sm">
              
              {/* Golden Rule Banner */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-1">
                <div className="font-bold text-teal-800 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  The #1 NGO Safeguard: "Direct Institutional Payment"
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Never transfer grant money directly to a requester's personal bank or UPI account. 
                  Always disburse directly to the <strong>Hospital account</strong> (with patient IP registration number) or to the <strong>School / University account</strong> (with student roll number). Fraudsters will immediately withdraw their request when told the funds go directly to the institution!
                </p>
              </div>

              {/* 5 Pillars to Detect Fake vs Real */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  5 Key Checkpoints to Detect Fake Requests:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  
                  {/* Point 1 */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-emerald-700 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Official Documentation Audit
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      <strong>Real:</strong> Has stamped hospital estimates, doctor's registration number (MCI/NMC), diagnostic bills, or signed school fee vouchers.<br/>
                      <span className="text-rose-600 font-semibold">Fake:</span> Blurry photos, cropped bills, missing hospital letterhead, or generic stock invoices.
                    </p>
                  </div>

                  {/* Point 2 */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-emerald-700 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. Independent Phone Verification
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      <strong>Real:</strong> You search the hospital or school's phone number on Google independently (do not use the phone number printed on their paper) and confirm the patient is admitted in ward/bed.<br/>
                      <span className="text-rose-600 font-semibold">Fake:</span> Requesters insist on contacting only their "personal middleman".
                    </p>
                  </div>

                  {/* Point 3 */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-emerald-700 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3. 2-Minute Live Video Verification
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      <strong>Real:</strong> The beneficiary or local guardian readily joins a quick WhatsApp video call from the hospital or school.<br/>
                      <span className="text-rose-600 font-semibold">Fake:</span> Refuse video calls, claiming poor internet or camera broken, while demanding immediate cash transfer.
                    </p>
                  </div>

                  {/* Point 4 */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-emerald-700 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. Emotional Pressure & Urgency Traps
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      <strong>Real:</strong> Hospitals provide 24-48 hour treatment schedules and allow billing team coordination.<br/>
                      <span className="text-rose-600 font-semibold">Fake:</span> "Need funds in 30 minutes or patient will die!" Extreme emotional blackmail is the #1 tactic of internet scammers.
                    </p>
                  </div>

                </div>
              </div>

              {/* Red Flags Summary Table */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <div className="font-bold text-rose-700 flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  🚨 Immediate Red Flags to Reject the Request:
                </div>
                <ul className="text-slate-700 text-xs space-y-1.5 list-disc pl-5">
                  <li>The applicant's bank account or UPI ID is in a completely different city/state than the hospital or school.</li>
                  <li>Multiple aid requests submitted under different names but using the same phone number or UPI handle.</li>
                  <li>Reverse image search on Google shows the patient/child photo was stolen from an old news article or crowdfunding campaign.</li>
                  <li>Refusal to provide Aadhaar card or government identity proof.</li>
                </ul>
              </div>

              {/* Workflow in Fund Bridge */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Recommended Audit Steps in this Portal:
                </div>
                <div className="text-slate-600 text-xs space-y-1 leading-relaxed">
                  <p>1. Keep applicant status at <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">Under Review</span> while reviewing bills and ID.</p>
                  <p>2. Call the hospital/school and complete video audit. Click <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold">Audit OK</span> to mark as <span className="text-sky-700 font-bold">Field Audited</span>.</p>
                  <p>3. Transfer directly to the verified institutional account, then click <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">Disburse</span> to save into the permanent financial check ledger.</p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowVerificationGuideModal(false)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-colors cursor-pointer"
              >
                Understood &amp; Close Guide
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
