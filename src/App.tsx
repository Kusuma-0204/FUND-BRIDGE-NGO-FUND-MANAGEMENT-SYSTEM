import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, Donation, Expense, Message, FundRequest, SystemSettings 
} from './types';
import { 
  INITIAL_USERS, INITIAL_DONATIONS, INITIAL_EXPENSES, 
  INITIAL_MESSAGES, INITIAL_REQUESTS, INITIAL_SETTINGS 
} from './data/initialData';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { AboutView } from './components/AboutView';
import { DonateView } from './components/DonateView';
import { RequestView } from './components/RequestView';
import { ContactView } from './components/ContactView';
import { AuthView } from './components/AuthView';
import { Dashboard } from './components/Dashboard';
import { FundTrackerView } from './components/FundTrackerView';
import { ReceiptModal } from './components/ReceiptModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';

import { Mail, ShieldCheck, CheckCircle2, AlertCircle, Info, KeyRound, Bell } from 'lucide-react';

// Helper to ensure authentic South Indian names and emails across the app
function mapToSouthIndianName(name: string, email: string) {
  const lowerName = (name || '').toLowerCase().trim();
  const lowerEmail = (email || '').toLowerCase().trim();

  if (lowerName === 'aarav sharma' || lowerName === 'aarav patel' || lowerEmail.includes('donor.aarav') || lowerName.includes('aarav')) {
    return { name: 'K. Venkatesh', email: 'venkatesh.k@gmail.com' };
  }
  if (lowerName.includes('miriam') || lowerEmail.includes('miriam')) {
    return { name: 'S. Meenakshi Sundaram', email: 'meenakshi.sundaram@gmail.com' };
  }
  if (lowerName.includes('marcus') || lowerEmail.includes('oceanic') || lowerEmail.includes('marcus')) {
    return { name: 'Ch. Sai Praneeth', email: 'saipraneeth.ch@gmail.com' };
  }
  if (lowerName.includes('priya') || lowerEmail.includes('priya')) {
    return { name: 'P. Vani Kumari', email: 'vanikumari.p@gmail.com' };
  }
  if (lowerName.includes('global') || lowerEmail.includes('ghtrust') || lowerEmail.includes('globaltrust')) {
    return { name: 'T. S. Venkataraman (CSR Trust)', email: 'venkataraman.ts@tcs-csr.org' };
  }
  if (lowerName.includes('elena') || lowerEmail.includes('elena')) {
    return { name: 'Kavitha Lakshmi', email: 'kavitha.lakshmi@gmail.com' };
  }
  if (lowerName.includes('sarah jenkins') || lowerEmail.includes('sarah')) {
    return { name: 'Dr. K. Radhakrishnan', email: 'aadminngo@gmail.com' };
  }
  if (lowerName.includes('mary teresa') || lowerName.includes('sister')) {
    return { name: 'Dr. P. Ramesh Babu Clinic', email: 'rameshbabu.clinic@sanjivani.org' };
  }
  if (lowerName.includes('michael chang') || lowerEmail.includes('chang')) {
    return { name: 'G. Vijay Raghavan', email: 'vijayraghavan.g@gmail.com' };
  }
  return { name: name || 'K. Venkatesh', email: email || 'venkatesh.k@gmail.com' };
}

export default function App() {
  // Navigation & Auth - On start, only display NGO logo and portals (Donor Portal, Admin Portal, New Register)
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'donate' | 'request' | 'contact' | 'login' | 'dashboard' | 'tracker'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trackerSearchQuery, setTrackerSearchQuery] = useState('');
  
  // Data State with LocalStorage Persistence
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fb_users');
    let list: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    let foundAdmin = false;
    list = list.map(u => {
      const { name, email } = mapToSouthIndianName(u.name, u.email);
      if (u.id === 'user-admin' || u.email.toLowerCase() === 'admin@ngofunds.org' || u.email.toLowerCase() === 'aadminngo@gmail.com') {
        foundAdmin = true;
        return {
          ...u,
          id: 'user-admin',
          email: 'aadminngo@gmail.com',
          role: 'Administrator' as const
        };
      }
      if (u.role === 'Administrator') {
        return { ...u, role: 'Donor Member' as const };
      }
      return { ...u, name: u.role === 'Donor Member' && (u.name.includes('Aarav') || u.name.includes('Elena')) ? name : u.name, email: u.role === 'Donor Member' && (u.name.includes('Aarav') || u.name.includes('Elena')) ? email : u.email };
    });
    if (!foundAdmin) {
      list.unshift(INITIAL_USERS[0]);
    }
    return list;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedUser = localStorage.getItem('fb_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) return parsed;
      }
    } catch {}
    return INITIAL_USERS[0];
  });

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('fb_current_user', JSON.stringify(currentUser));
      } catch {}
    }
  }, [currentUser]);

  const [donations, setDonations] = useState<Donation[]>(() => {
    try {
      const saved = localStorage.getItem('fb_donations');
      const baseList = saved ? JSON.parse(saved) : INITIAL_DONATIONS;
      return baseList.map((d: Donation) => {
        const { name, email } = mapToSouthIndianName(d.donorName, d.donorEmail);
        return { ...d, donorName: d.isAnonymous ? 'Anonymous' : name, donorEmail: email };
      });
    } catch {
      return INITIAL_DONATIONS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('fb_expenses');
      const baseList = saved ? JSON.parse(saved) : INITIAL_EXPENSES;
      return baseList.map((e: Expense) => {
        let audited = e.auditedBy;
        if (audited.includes('Sarah Jenkins')) audited = 'Dr. K. Radhakrishnan';
        if (audited.includes('Elena')) audited = 'Kavitha Lakshmi';
        return { ...e, auditedBy: audited };
      });
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('fb_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [requests, setRequests] = useState<FundRequest[]>(() => {
    try {
      const saved = localStorage.getItem('fb_requests');
      const baseList = saved ? JSON.parse(saved) : INITIAL_REQUESTS;
      return baseList.map((r: FundRequest) => {
        let appName = r.applicantName;
        if (appName.includes('Maria Gonzalez')) appName = 'S. Bhuvaneshwari';
        if (appName.includes('Alok Kumar')) appName = 'C. Ravichandran';
        if (appName.includes('Sister')) appName = 'M. Saraswathi Ammal';
        if (appName.includes('Ramesh Chandra')) appName = 'Dr. P. Ramesh Babu';
        if (appName.includes('Rajesh Kothari')) appName = 'Principal K. Ramamurthy';
        return { ...r, applicantName: appName };
      });
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('fb_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.upiId === 'ngofunds@sbi') parsed.upiId = '9391514815@pthdfc';
      return parsed;
    }
    return INITIAL_SETTINGS;
  });

  // Modals & Popups
  const [receiptDonation, setReceiptDonation] = useState<Donation | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [donatePresetCategory, setDonatePresetCategory] = useState<string | undefined>();

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Forgot Password & Reset Workflow States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordPrefillEmail, setForgotPasswordPrefillEmail] = useState('');

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Persist State
  useEffect(() => {
    localStorage.setItem('fb_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('fb_donations', JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem('fb_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('fb_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('fb_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('fb_settings', JSON.stringify(settings));
  }, [settings]);

  // Fetch live records from backend APIs (All donations, expenses, requests, settings)
  const loadLiveBackendData = useCallback(async () => {
    try {
      const token = localStorage.getItem('fb_jwt_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Load ALL Donations from database (permanent persistence across logouts & sessions)
      const donsRes = await fetch('/api/donations?scope=all', { headers });
      if (donsRes.ok) {
        const donsData = await donsRes.json();
        if (donsData.success && Array.isArray(donsData.data) && donsData.data.length > 0) {
          const backendDons: Donation[] = donsData.data.map((d: any) => {
            const { name, email } = mapToSouthIndianName(d.donor_name, d.donor_email);
            return {
              id: d.id,
              donorName: d.is_anonymous ? 'Anonymous' : name,
              donorEmail: email,
              cause: d.category,
              amount: Number(d.amount),
              method: d.payment_method,
              date: d.donation_date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              status: d.status || 'Completed',
              receiptNumber: d.payment_reference?.startsWith('80G-') ? d.payment_reference : `80G-${d.id.replace('DON-', '')}`,
              isAnonymous: Boolean(d.is_anonymous)
            };
          });

          setDonations(prev => {
            // Merge by ID so any local donation is preserved and backend records are loaded
            const backendMap = new Map(backendDons.map(b => [b.id, b]));
            const merged = [...backendDons];
            for (const localDon of prev) {
              if (!backendMap.has(localDon.id)) {
                merged.push(localDon);
              }
            }
            // Sort descending by date/creation
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            try {
              localStorage.setItem('fb_donations', JSON.stringify(merged));
            } catch (err) {
              console.warn('localStorage write failed:', err);
            }
            return merged;
          });
        }
      }

      // 2. Expenses & Dashboard Stats
      const dashRes = await fetch('/api/dashboard/stats');
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData.success && dashData.data.recentExpenses?.length) {
          const liveExps: Expense[] = dashData.data.recentExpenses.map((e: any) => ({
            id: e.id,
            title: e.title,
            vendor: e.vendor,
            category: e.category,
            amount: e.amount,
            date: e.expense_date || e.created_at?.split('T')[0],
            auditedBy: e.audited_by,
            status: e.status === 'Verified & Paid' ? 'Approved' : 'Pending'
          }));
          setExpenses(prev => {
            const expMap = new Map(liveExps.map(e => [e.id, e]));
            const mergedExps = [...liveExps];
            for (const localExp of prev) {
              if (!expMap.has(localExp.id)) {
                mergedExps.push(localExp);
              }
            }
            try {
              localStorage.setItem('fb_expenses', JSON.stringify(mergedExps));
            } catch {}
            return mergedExps;
          });
        }
      }

      // 3. Settings
      const setRes = await fetch('/api/settings');
      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData.success && setData.data) {
          setSettings({
            ngoName: setData.data.ngo_name,
            regNumber: setData.data.reg_number,
            tax80G: setData.data.tax_80g,
            currency: setData.data.currency,
            upiId: setData.data.upi_id,
            upiGatewayEnabled: true,
            cardGatewayEnabled: true,
            autoInvoicing: true
          });
        }
      }

      // 4. Aid & Grant Requests
      const reqRes = await fetch('/api/requests', { headers });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (reqData.success && Array.isArray(reqData.data) && reqData.data.length > 0) {
          const mappedReqs: FundRequest[] = reqData.data.map((r: any) => ({
            id: r.id || r.tracking_code,
            applicantName: r.applicant_name,
            org: r.organization || 'Community Partner',
            category: r.category || 'Healthcare',
            urgency: (r.urgency === 'Emergency' || r.urgency === 'Urgent' ? r.urgency : 'Normal'),
            amount: Number(r.amount) || 0,
            purpose: r.purpose || '',
            date: r.created_at ? r.created_at.split('T')[0] : '2026-09-15',
            status: (r.status === 'Approved & Disbursed' || r.status === 'Disbursed'
              ? 'Disbursed'
              : r.status === 'Field Verified' || r.status === 'Field Audited'
              ? 'Field Audited'
              : 'Under Review'),
            remarks: r.audit_remarks || r.remarks || ''
          }));

          setRequests(prev => {
            const reqMap = new Map(mappedReqs.map(r => [r.id, r]));
            const mergedReqs = [...mappedReqs];
            for (const localReq of prev) {
              if (!reqMap.has(localReq.id)) {
                mergedReqs.push(localReq);
              }
            }
            try {
              localStorage.setItem('fb_requests', JSON.stringify(mergedReqs));
            } catch {}
            return mergedReqs;
          });
        }
      }
    } catch (e) {
      console.warn('Initial backend sync fallback to local cache:', e);
    }
  }, []);

  useEffect(() => {
    loadLiveBackendData();
  }, [loadLiveBackendData]);

  // Check URL Hash for deep links like #reset-password
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('#reset-password')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        if (email && token) {
          setResetEmail(decodeURIComponent(email));
          setResetToken(token);
          setIsResetPasswordOpen(true);
        }
      } else if (hash.includes('#forgot-password')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const email = urlParams.get('email');
        setForgotPasswordPrefillEmail(email ? decodeURIComponent(email) : '');
        setIsForgotPasswordOpen(true);
      } else if (hash.startsWith('#')) {
        const cleanHash = hash.replace('#', '').split('?')[0];
        if (['home', 'about', 'donate', 'request', 'contact', 'login', 'dashboard', 'qrcode', 'admin', 'tracker'].includes(cleanHash)) {
          if (cleanHash === 'dashboard' || cleanHash === 'admin') {
            if (!isLoggedIn) {
              setCurrentView('login');
            } else if (currentUser?.role !== 'Administrator' || currentUser?.email.toLowerCase() !== 'aadminngo@gmail.com') {
              setCurrentView('home');
              window.location.hash = 'home';
              showToast('Access restricted: Only authorized administrative personnel can access the Admin Portal.', 'error');
            } else {
              setCurrentView('dashboard');
            }
          } else if (cleanHash === 'qrcode') {
            setCurrentView('donate');
          } else {
            setCurrentView(cleanHash as any);
          }
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [isLoggedIn, currentUser?.role]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Handler: Open Forgot Password Modal
  const handleOpenForgotPassword = (prefillEmail: string = '') => {
    setForgotPasswordPrefillEmail(prefillEmail);
    setIsForgotPasswordOpen(true);
  };

  // Handler: Send 6-Digit OTP to User Email
  const handleSendResetLink = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          `6-digit OTP sent to ${email}! Please check your email inbox (and Spam folder).`,
          'success'
        );
        return data;
      } else {
        showToast(data.message || `Could not send OTP to ${email}.`, 'error');
        return data;
      }
    } catch {
      showToast('Connection error. Please try again.', 'error');
      return {
        success: false,
        message: 'Could not connect to authentication server.'
      };
    }
  };

  // Handler: Opened after user verifies their 6-digit OTP on the website
  const handleOpenResetPasswordScreen = (email: string, token: string) => {
    setResetEmail(email);
    setResetToken(token);
    setIsResetPasswordOpen(true);
    showToast(`OTP verified for ${email}! Please enter your new password.`, 'success');
  };

  // Handler: Password Reset Completion (Updates password, authenticates, and directs to appropriate portal)
  const handlePasswordResetSuccess = (email: string, newPass: string) => {
    // 1. Update user password in users list
    let targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    let nextUsers: User[] = [];
    if (targetUser) {
      nextUsers = users.map(u => 
        u.email.toLowerCase() === email.toLowerCase() 
          ? { ...u, password: newPass } 
          : u
      );
      setUsers(nextUsers);
      targetUser = { ...targetUser, password: newPass };
    } else {
      // Create user if they reset a new email
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0].replace(/[._-]/g, ' '),
        email: email,
        role: 'Donor Member',
        avatar: email.substring(0, 2).toUpperCase(),
        kycVerified: true,
        memberSince: '2026',
        auditsApproved: 0,
        password: newPass
      };
      nextUsers = [...users, newUser];
      setUsers(nextUsers);
      targetUser = newUser;
    }

    localStorage.setItem('fb_users', JSON.stringify(nextUsers));
    localStorage.setItem('fb_last_login_email', email);

    // 2. Set authenticated session
    setCurrentUser(targetUser);
    setIsLoggedIn(true);
    setIsResetPasswordOpen(false);

    // 3. Separate routing: Admin goes to Dashboard, Donor goes to Home (Donor Portal)
    if (targetUser.role === 'Administrator' && targetUser.email.toLowerCase() === 'aadminngo@gmail.com') {
      setCurrentView('dashboard');
      window.location.hash = 'dashboard';
      showToast(`Welcome back, ${targetUser.name}! Your password was successfully updated.`, 'success');
    } else {
      setCurrentView('home');
      window.location.hash = 'home';
      showToast(`Welcome back, ${targetUser.name}! Your password was updated. Logged into Donor Portal.`, 'success');
    }
  };

  // Standard Login (Separated: Admin to Dashboard, Donor to Home)
  const handleLogin = (user: User) => {
    // Strict admin role verification: only aadminngo@gmail.com can be Administrator
    let activeUser = user;
    if (user.role === 'Administrator' && user.email.toLowerCase() !== 'aadminngo@gmail.com') {
      activeUser = { ...user, role: 'Donor Member' };
      showToast('Access restricted: Administrator privileges are restricted to authorized personnel.', 'error');
    }
    setCurrentUser(activeUser);
    setIsLoggedIn(true);
    if (activeUser.role === 'Administrator' && activeUser.email.toLowerCase() === 'aadminngo@gmail.com') {
      setCurrentView('dashboard');
      window.location.hash = 'dashboard';
      showToast(`Welcome to Admin Management Portal, ${activeUser.name}!`, 'success');
    } else {
      setCurrentView('home');
      window.location.hash = 'home';
      showToast(`Welcome to Donor Portal, ${activeUser.name}!`, 'success');
    }
    // Re-sync with backend database so all persistent donations are loaded
    setTimeout(() => {
      loadLiveBackendData();
    }, 150);
  };

  // Standard Register (Default role: Donor Member -> Home)
  const handleRegister = (newUser: User) => {
    // New registrants cannot be Administrator
    const safeUser: User = newUser.role === 'Administrator' ? { ...newUser, role: 'Donor Member' } : newUser;
    setUsers(prev => [...prev, safeUser]);
    setCurrentUser(safeUser);
    setIsLoggedIn(true);
    setCurrentView('home');
    window.location.hash = 'home';
    showToast(`Registration complete! Welcome to Donor Portal, ${safeUser.name}.`, 'success');
    setTimeout(() => {
      loadLiveBackendData();
    }, 150);
  };

  // Logout (Data persists: user can safely check in admin portal anytime in future)
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('fb_jwt_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch {}
    // Remove authentication session ONLY - all donation records and ledger data remain intact!
    localStorage.removeItem('fb_jwt_token');
    setIsLoggedIn(false);
    setCurrentView('home');
    window.location.hash = 'home';
    showToast('Logged out of Fund Bridge System. All donation data safely stored.', 'info');
  };

  // Record Donation (Saved to state, localStorage, and database storage)
  const handleRecordDonation = async (newDon: Donation) => {
    setDonations(prev => {
      const updated = [newDon, ...prev.filter(d => d.id !== newDon.id)];
      try {
        localStorage.setItem('fb_donations', JSON.stringify(updated));
      } catch (err) {
        console.warn('localStorage error:', err);
      }
      return updated;
    });

    setReceiptDonation(newDon);
    setIsReceiptOpen(true);
    showToast(`Donation of $${newDon.amount} recorded! 80G Receipt generated.`, 'success');

    try {
      const token = localStorage.getItem('fb_jwt_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/donations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: newDon.id,
          donor_name: newDon.donorName,
          donor_email: newDon.donorEmail,
          amount: newDon.amount,
          category: newDon.cause,
          payment_method: newDon.method,
          payment_reference: newDon.receiptNumber,
          donation_date: newDon.date,
          is_anonymous: newDon.isAnonymous ? 1 : 0
        })
      });

      // Synchronize latest records from database
      loadLiveBackendData();
    } catch (e) {
      console.warn('Backend sync failed for donation:', e);
    }
  };

  // Submit Expense
  const handleSubmitExpense = async (newExp: Expense) => {
    setExpenses(prev => [newExp, ...prev]);
    showToast(`Expense claim "${newExp.title}" of $${newExp.amount} submitted & approved!`, 'success');

    try {
      const token = localStorage.getItem('fb_jwt_token');
      await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: newExp.title,
          category: newExp.category,
          amount: newExp.amount,
          vendor: newExp.vendor
        })
      });
    } catch (e) {
      console.warn('Backend sync failed for expense:', e);
    }
  };

  // Submit Grant Request
  const handleSubmitRequest = async (newReq: FundRequest) => {
    setRequests(prev => [newReq, ...prev]);
    showToast(`Aid request ${newReq.id} submitted for verified audit!`, 'success');

    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_name: newReq.applicantName,
          organization: newReq.org,
          category: newReq.category,
          urgency: newReq.urgency,
          amount: newReq.amount,
          purpose: newReq.purpose
        })
      });
    } catch (e) {
      console.warn('Backend sync failed for request:', e);
    }
  };

  // Send Message
  const handleSendMessage = async (msg: { name: string; email: string; subject: string; message: string }) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderName: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      date: 'Just now',
      read: false
    };
    setMessages(prev => [newMsg, ...prev]);
    showToast('Your inquiry has been sent to our leadership board.', 'success');

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
    } catch (e) {
      console.warn('Backend sync failed for message:', e);
    }
  };

  // Reset demo data
  const handleResetData = async () => {
    try {
      await fetch('/api/settings/reset-demo-data', { method: 'POST' });
    } catch {}
    setUsers(INITIAL_USERS);
    setDonations(INITIAL_DONATIONS);
    setExpenses(INITIAL_EXPENSES);
    setMessages(INITIAL_MESSAGES);
    setRequests(INITIAL_REQUESTS);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
    showToast('Demo data reset to factory initial state.', 'info');
  };

  const totalRaisedAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalDisbursedAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white relative">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slideDown flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-teal-500/50 text-white shadow-2xl text-xs sm:text-sm font-medium">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-teal-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. FRONT SCREEN (BEFORE LOGIN): Show portal buttons on front only before login */}
      {!isLoggedIn ? (
        <div className="min-h-screen flex flex-col bg-slate-900">
          <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                {/* NGO Logo & Title */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-black border border-slate-800 p-0.5 flex items-center justify-center shadow-md overflow-hidden">
                    <img src="/assets/ngo-logo.svg" alt="Fund Bridge Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base sm:text-xl tracking-wider text-white flex items-center gap-1.5">
                      FUND BRIDGE
                    </span>
                    <span className="text-[10px] sm:text-xs text-teal-400 font-semibold tracking-widest block uppercase -mt-0.5">
                      NGO Management System
                    </span>
                  </div>
                </div>

                {/* Show on Front Only Before Login: Donor Portal, Admin Portal, New Register */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      window.location.hash = 'donor';
                      setCurrentView('login');
                    }}
                    className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all cursor-pointer"
                  >
                    🤝 Donor Portal
                  </button>
                  <button
                    onClick={() => {
                      window.location.hash = 'admin';
                      setCurrentView('login');
                    }}
                    className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Admin Portal</span>
                  </button>
                  <button
                    onClick={() => {
                      window.location.hash = 'register';
                      setCurrentView('login');
                    }}
                    className="hidden xs:inline-flex px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                  >
                    ✨ New Register
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center py-6 sm:py-12">
            <AuthView
              users={users}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onOpenForgotPassword={handleOpenForgotPassword}
              onSendResetLink={handleSendResetLink}
            />
          </main>

          <Footer onNavigate={() => {}} />
        </div>
      ) : currentView === 'dashboard' && currentUser.role === 'Administrator' && currentUser.email.toLowerCase() === 'aadminngo@gmail.com' ? (
        /* Authenticated Administrator Dashboard View */
        <Dashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          donations={donations}
          expenses={expenses}
          messages={messages}
          requests={requests}
          settings={settings}
          onRecordDonation={handleRecordDonation}
          onSubmitExpense={handleSubmitExpense}
          onUpdateRequest={(updatedReq) => {
            setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
            showToast(`Application ${updatedReq.id} marked as ${updatedReq.status}!`, 'success');
          }}
          onUpdateProfile={async (updated) => {
            const up = { ...currentUser, ...updated };
            if (updated.name) {
              const parts = updated.name.trim().split(' ').filter(Boolean);
              up.avatar = (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].substring(0, 2)).toUpperCase();
            }
            setCurrentUser(up);
            const updatedUsers = users.map(u => (u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()) ? up : u);
            setUsers(updatedUsers);
            try {
              localStorage.setItem('fb_current_user', JSON.stringify(up));
              localStorage.setItem('fb_users', JSON.stringify(updatedUsers));
            } catch {}

            showToast('Administrator profile updated successfully!', 'success');

            try {
              const token = localStorage.getItem('fb_jwt_token');
              const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                  full_name: up.name,
                  phone: up.phone,
                  bio: up.bio
                })
              });
              const data = await res.json();
              if (data?.user) {
                const refreshed = { ...up, ...data.user };
                setCurrentUser(refreshed);
                localStorage.setItem('fb_current_user', JSON.stringify(refreshed));
              }
            } catch (err) {
              console.warn('Backend profile update sync failed:', err);
            }
          }}
          onUpdateSettings={(newSet) => setSettings(newSet)}
          onResetData={handleResetData}
          onViewReceipt={(d) => {
            setReceiptDonation(d);
            setIsReceiptOpen(true);
          }}
          onToast={showToast}
          onNavigatePublic={(v) => {
            setCurrentView(v as any);
            window.location.hash = v;
          }}
        />
      ) : (
        /* 2. AUTHENTICATED DONOR PORTAL: Donor Portal (No Donor Portal/Admin Portal buttons here!) */
        <div className="min-h-screen flex flex-col bg-slate-900">
          <Navbar
            currentView={currentView}
            onNavigate={(v) => {
              if (v === 'dashboard') {
                if (currentUser?.role !== 'Administrator' || currentUser?.email.toLowerCase() !== 'aadminngo@gmail.com') {
                  setCurrentView('home');
                  window.location.hash = 'home';
                  showToast('Access restricted: Only authorized administrative personnel can access the Admin Portal.', 'error');
                } else {
                  setCurrentView('dashboard');
                  window.location.hash = 'dashboard';
                }
                return;
              }
              if (v === 'qrcode') {
                setCurrentView('donate');
                window.location.hash = 'donate';
              } else {
                setCurrentView(v as any);
                window.location.hash = v;
              }
            }}
            onOpenDonateModal={() => {
              setDonatePresetCategory(undefined);
              setCurrentView('donate');
              window.location.hash = 'donate';
            }}
            isLoggedIn={true}
            currentUser={currentUser}
            onLogout={handleLogout}
            onGoToDashboard={() => {
              if (currentUser?.role === 'Administrator' && currentUser?.email.toLowerCase() === 'aadminngo@gmail.com') {
                setCurrentView('dashboard');
                window.location.hash = 'dashboard';
              } else {
                setCurrentView('home');
                window.location.hash = 'home';
                showToast('Access restricted: Only authorized administrative personnel can access the Admin Portal.', 'error');
              }
            }}
          />

          <main className="flex-1">
            {currentView === 'home' && (
              <HomeView
                onNavigate={(v) => {
                  if (v === 'dashboard' && (currentUser?.role !== 'Administrator' || currentUser?.email.toLowerCase() !== 'aadminngo@gmail.com')) {
                    showToast('Access restricted: Administrator portal is accessible to authorized personnel only.', 'error');
                    return;
                  }
                  setCurrentView(v as any);
                  window.location.hash = v;
                }}
                onOpenDonate={(cat) => {
                  setDonatePresetCategory(cat);
                  setCurrentView('donate');
                  window.location.hash = 'donate';
                }}
                onRecordDonation={handleRecordDonation}
                totalRaised={totalRaisedAmount}
                totalDisbursed={totalDisbursedAmount}
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                userRole={currentUser?.role}
                donations={donations}
                expenses={expenses}
              />
            )}

            {currentView === 'about' && (
              <AboutView
                onNavigate={(v) => {
                  setCurrentView(v as any);
                  window.location.hash = v;
                }}
              />
            )}

            {currentView === 'contact' && (
              <ContactView
                onSendMessage={handleSendMessage}
              />
            )}

            {currentView === 'request' && (
              <RequestView
                requests={requests}
                onSubmitRequest={handleSubmitRequest}
              />
            )}

            {currentView === 'donate' && (
              <DonateView
                defaultCategory={donatePresetCategory}
                onDonationComplete={(don) => {
                  handleRecordDonation(don);
                }}
              />
            )}

            {currentView === 'tracker' && (
              <FundTrackerView
                donations={donations}
                requests={requests}
                expenses={expenses}
                onNavigate={(v) => {
                  setCurrentView(v as any);
                  window.location.hash = v;
                }}
                onOpenDonate={(cat, amt) => {
                  setDonatePresetCategory(cat);
                  setCurrentView('donate');
                  window.location.hash = 'donate';
                }}
                onViewReceipt={(don) => {
                  setReceiptDonation(don);
                  setIsReceiptOpen(true);
                }}
                initialSearchQuery={trackerSearchQuery}
              />
            )}
          </main>

          <Footer
            onNavigate={(v) => {
              setCurrentView(v as any);
              window.location.hash = v;
            }}
          />
        </div>
      )}

      {/* 1. Official 80G Donation Receipt Modal */}
      <ReceiptModal
        donation={receiptDonation}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onTrackDonation={(id) => {
          setTrackerSearchQuery(id);
          setCurrentView('tracker');
          window.location.hash = 'tracker';
        }}
      />

      {/* 2. Forgot Password Request Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        defaultEmail={forgotPasswordPrefillEmail}
        onSendResetLink={handleSendResetLink}
        onOpenResetPassword={handleOpenResetPasswordScreen}
      />

      {/* 3. Reset Password Modal (Opened when user clicks the reset link in their email) */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        email={resetEmail}
        token={resetToken}
        onPasswordResetSuccess={handlePasswordResetSuccess}
      />

    </div>
  );
}
