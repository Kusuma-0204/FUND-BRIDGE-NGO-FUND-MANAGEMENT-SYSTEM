/**
 * =============================================================================
 * FUND BRIDGE: Core Frontend Controller
 * Connects all existing UI forms, tables, modals, and charts to real backend APIs
 * =============================================================================
 */

(function() {
  // Global State
  let currentActiveView = 'home';
  let currentPortalTab = 'dashboard';
  let cachedStats = null;
  let resetState = {
    email: '',
    resetToken: ''
  };

  // Toast Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'bi-info-circle-fill';
    if (type === 'success') icon = 'bi-check-circle-fill';
    if (type === 'error') icon = 'bi-exclamation-triangle-fill';

    toast.innerHTML = `
      <i class="bi ${icon}"></i>
      <span style="flex:1;">${escapeHtml(message)}</span>
      <button style="background:none; border:none; color:#94a3b8; cursor:pointer;" onclick="this.parentElement.remove()">
        <i class="bi bi-x"></i>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------------------------------------------------------------------------
  // View Navigation Switcher
  // ---------------------------------------------------------------------------
  function switchView(viewName) {
    currentActiveView = viewName;

    // Toggle public view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active-view');
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active-view');
    }

    // Update active state on nav links
    document.querySelectorAll('.nav-item a').forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('data-view') === viewName) {
        a.classList.add('active');
      }
    });

    // If switching to portal view, check authentication
    const portalWrapper = document.getElementById('portalWrapper');
    const publicNavbar = document.querySelector('.public-navbar');
    const publicFooter = document.querySelector('.public-footer');

    if (viewName === 'portal') {
      if (!FB_AUTH.isAuthenticated()) {
        showToast('Please sign in to access the NGO Portal.', 'info');
        switchView('login');
        return;
      }
      if (portalWrapper) portalWrapper.style.display = 'flex';
      if (publicNavbar) publicNavbar.style.display = 'none';
      if (publicFooter) publicFooter.style.display = 'none';
      initPortalView();
    } else {
      if (portalWrapper) portalWrapper.style.display = 'none';
      if (publicNavbar) publicNavbar.style.display = 'block';
      if (publicFooter) publicFooter.style.display = 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------------------
  // Portal Tab Switcher
  // ---------------------------------------------------------------------------
  function switchPortalTab(tabName) {
    currentPortalTab = tabName;

    // Update sidebar nav items
    document.querySelectorAll('.sidebar-nav-item a').forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('data-target') === tabName) {
        a.classList.add('active');
      }
    });

    // Update tab panels
    document.querySelectorAll('.portal-tab-panel').forEach(p => {
      p.classList.remove('active-panel');
    });

    const targetPanel = document.getElementById(`tab-${tabName}`);
    if (targetPanel) {
      targetPanel.classList.add('active-panel');
    }

    // Update topbar title
    const topbarTitle = document.getElementById('portalTopbarTitle');
    if (topbarTitle) {
      const titles = {
        dashboard: 'Live Audit & Treasury Dashboard',
        profile: 'User Profile & Identity Verification',
        donations: 'Donations Ledger & 80G Receipts',
        expenses: 'Expense Audit & Disbursement Registry',
        messages: 'Public Inquiries & Helpdesk',
        portalContact: 'Official Communications',
        settings: 'System Configuration & Policy Settings'
      };
      topbarTitle.textContent = titles[tabName] || 'Portal Management';
    }

    // Load data specific to this tab
    if (tabName === 'dashboard') loadDashboardData();
    if (tabName === 'donations') loadFullDonations();
    if (tabName === 'expenses') loadFullExpenses();
    if (tabName === 'messages') loadMessages();
    if (tabName === 'profile') loadUserProfile();
    if (tabName === 'settings') loadSettings();
  }

  // ---------------------------------------------------------------------------
  // Dashboard & Metrics Loading
  // ---------------------------------------------------------------------------
  async function loadDashboardData() {
    try {
      const res = await FB_DATA.getDashboardStats();
      if (!res.success) return;

      const d = res.data;
      cachedStats = d;

      // Update KPIs
      const kpiTotalRaised = document.getElementById('kpiTotalRaised');
      const kpiTotalExpenses = document.getElementById('kpiTotalExpenses');
      const kpiTreasuryBalance = document.getElementById('kpiTreasuryBalance');
      const kpiPendingRequests = document.getElementById('kpiPendingRequests');
      const kpiTotalDonors = document.getElementById('kpiTotalDonors');

      if (kpiTotalRaised) kpiTotalRaised.textContent = `$${d.totalRaised.toLocaleString()}`;
      if (kpiTotalExpenses) kpiTotalExpenses.textContent = `$${d.totalExpenses.toLocaleString()}`;
      if (kpiTreasuryBalance) kpiTreasuryBalance.textContent = `$${d.treasuryBalance.toLocaleString()}`;
      if (kpiPendingRequests) kpiPendingRequests.textContent = d.pendingRequests.toString();
      if (kpiTotalDonors) kpiTotalDonors.textContent = d.verifiedDonorsCount.toString();

      // Render Charts
      if (window.FB_CHARTS) {
        FB_CHARTS.renderIncomeExpenseChart('incomeExpenseChartCanvas', d.monthlyData);
        FB_CHARTS.renderCategoryDonutChart('categoryDonutChartCanvas', d.categoryBreakdown);
      }

      // Render Recent Donations Table
      const donTable = document.getElementById('dashRecentDonationsTable');
      if (donTable && d.recentDonations) {
        donTable.innerHTML = d.recentDonations.map(don => `
          <tr>
            <td><strong>${escapeHtml(don.id)}</strong></td>
            <td>${escapeHtml(don.donor_name)}</td>
            <td><span class="badge badge-primary">${escapeHtml(don.category)}</span></td>
            <td><strong>$${don.amount.toLocaleString()}</strong></td>
            <td><span class="badge badge-success">${escapeHtml(don.status)}</span></td>
            <td>${don.donation_date || don.created_at?.split('T')[0]}</td>
          </tr>
        `).join('');
      }

      // Render Recent Expenses Table
      const expTable = document.getElementById('dashRecentExpensesTable');
      if (expTable && d.recentExpenses) {
        expTable.innerHTML = d.recentExpenses.map(exp => `
          <tr>
            <td><strong>${escapeHtml(exp.id)}</strong></td>
            <td>${escapeHtml(exp.title)}</td>
            <td><span class="badge badge-warning">${escapeHtml(exp.category)}</span></td>
            <td><strong>$${exp.amount.toLocaleString()}</strong></td>
            <td><span class="badge ${exp.status === 'Verified & Paid' ? 'badge-success' : 'badge-warning'}">${escapeHtml(exp.status)}</span></td>
            <td>${exp.expense_date || exp.created_at?.split('T')[0]}</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Full Donations Table
  // ---------------------------------------------------------------------------
  async function loadFullDonations() {
    const tbody = document.getElementById('fullDonationsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Loading verified donations ledger...</td></tr>';

    try {
      const res = await FB_DATA.getDonations();
      if (!res.success || !res.data.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color:#94a3b8;">No donations recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = res.data.map(don => `
        <tr>
          <td><strong>${escapeHtml(don.id)}</strong></td>
          <td>
            <div>${escapeHtml(don.donor_name)}</div>
            <small style="color:#64748b;">${escapeHtml(don.donor_email)}</small>
          </td>
          <td><span class="badge badge-primary">${escapeHtml(don.category)}</span></td>
          <td><strong style="color:#2dd4bf;">$${don.amount.toLocaleString()}</strong></td>
          <td>${escapeHtml(don.payment_method)}</td>
          <td><span class="badge badge-success">80G Issued</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="viewReceipt('${don.id}')">
              <i class="bi bi-receipt"></i> 80G Receipt
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding: 2rem;">Error loading donations: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // ---------------------------------------------------------------------------
  // Full Expenses Table
  // ---------------------------------------------------------------------------
  async function loadFullExpenses() {
    const tbody = document.getElementById('fullExpensesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Loading expense claims ledger...</td></tr>';

    try {
      const res = await FB_DATA.getExpenses();
      if (!res.success || !res.data.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color:#94a3b8;">No expense records logged.</td></tr>';
        return;
      }

      const isAdmin = FB_AUTH.isAdmin();
      const isVolunteer = FB_AUTH.isVolunteer();

      tbody.innerHTML = res.data.map(exp => `
        <tr>
          <td><strong>${escapeHtml(exp.id)}</strong></td>
          <td>${escapeHtml(exp.title)}</td>
          <td><span class="badge badge-warning">${escapeHtml(exp.category)}</span></td>
          <td><strong>$${exp.amount.toLocaleString()}</strong></td>
          <td>${escapeHtml(exp.vendor)}</td>
          <td>
            <span class="badge ${exp.status === 'Verified & Paid' ? 'badge-success' : (exp.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">
              ${escapeHtml(exp.status)}
            </span>
          </td>
          <td>
            ${(isAdmin || isVolunteer) && exp.status !== 'Verified & Paid' ? `
              <button class="btn btn-primary btn-sm" onclick="verifyExpense('${exp.id}', 'Verified & Paid')">
                <i class="bi bi-check-circle"></i> Verify & Pay
              </button>
            ` : `<span style="font-size:0.75rem; color:#64748b;">${escapeHtml(exp.audited_by || 'Audited')}</span>`}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding: 2rem;">Error loading expenses: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // ---------------------------------------------------------------------------
  // Messages Helpdesk
  // ---------------------------------------------------------------------------
  async function loadMessages() {
    const list = document.getElementById('messagesListItems');
    if (!list) return;

    list.innerHTML = '<p style="text-align:center; color:#94a3b8; padding: 2rem;">Loading messages...</p>';

    try {
      const res = await FB_DATA.getMessages();
      if (!res.success || !res.data.length) {
        list.innerHTML = '<p style="text-align:center; color:#94a3b8; padding: 2rem;">No inquiries received yet.</p>';
        return;
      }

      list.innerHTML = res.data.map(msg => `
        <div class="card-box" style="margin-bottom: 0.75rem; cursor: pointer; border-left: 3px solid ${msg.is_read ? '#334155' : '#0d9488'};" onclick="viewMessageDetail('${msg.id}')">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.25rem;">
            <h4 style="font-size:0.95rem; margin:0;">${escapeHtml(msg.subject)}</h4>
            <span style="font-size:0.75rem; color:#64748b;">${msg.created_at?.split('T')[0]}</span>
          </div>
          <p style="font-size:0.82rem; color:#94a3b8; margin: 0 0 0.5rem 0;">From: <strong>${escapeHtml(msg.sender_name)}</strong> (${escapeHtml(msg.sender_email)})</p>
          <p style="font-size:0.85rem; color:#cbd5e1; margin:0;">${escapeHtml(msg.message)}</p>
        </div>
      `).join('');
    } catch (err) {
      list.innerHTML = `<p style="color:#ef4444; padding: 1rem;">${escapeHtml(err.message)}</p>`;
    }
  }

  // ---------------------------------------------------------------------------
  // User Profile
  // ---------------------------------------------------------------------------
  async function loadUserProfile() {
    try {
      const res = await FB_DATA.getProfile();
      if (!res.success) return;

      const u = res.data;
      const nameInput = document.getElementById('profName');
      const emailInput = document.getElementById('profEmail');
      const phoneInput = document.getElementById('profPhone');
      const roleInput = document.getElementById('profRole');
      const bioInput = document.getElementById('profBio');

      if (nameInput) nameInput.value = u.full_name || '';
      if (emailInput) emailInput.value = u.email || '';
      if (phoneInput) phoneInput.value = u.phone || '';
      if (roleInput) roleInput.value = u.role || '';
      if (bioInput) bioInput.value = u.bio || '';
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // System Settings
  // ---------------------------------------------------------------------------
  async function loadSettings() {
    try {
      const res = await FB_DATA.getSettings();
      if (!res.success) return;

      const s = res.data;
      const ngoName = document.getElementById('setNgoName');
      const regNum = document.getElementById('setRegNumber');
      const tax80g = document.getElementById('setTax80G');
      const currency = document.getElementById('setCurrency');
      const upiId = document.getElementById('setUpiId');

      if (ngoName) ngoName.value = s.ngo_name || '';
      if (regNum) regNum.value = s.reg_number || '';
      if (tax80g) tax80g.value = s.tax_80g || '';
      if (currency) currency.value = s.currency || '$';
      if (upiId) upiId.value = s.upi_id || '';
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Init Portal View & User Header
  // ---------------------------------------------------------------------------
  function initPortalView() {
    const user = FB_AUTH.getCurrentUser();
    if (!user) return;

    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarRole = document.getElementById('sidebarUserRole');

    if (sidebarAvatar) sidebarAvatar.textContent = user.avatar || user.full_name?.substring(0, 2).toUpperCase() || 'FB';
    if (sidebarName) sidebarName.textContent = user.full_name || 'Member';
    if (sidebarRole) sidebarRole.textContent = user.role || 'Member';

    // Hide admin-only tabs if not admin
    const settingsTab = document.querySelector('.sidebar-nav-item a[data-target="settings"]');
    if (settingsTab) {
      settingsTab.parentElement.style.display = FB_AUTH.isAdmin() ? 'block' : 'none';
    }

    switchPortalTab('dashboard');
  }

  // ---------------------------------------------------------------------------
  // Global Event Attachments (DOM Loaded)
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation clicks
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = el.getAttribute('data-view');
        if (targetView) switchView(targetView);
      });
    });

    // 2. Portal sidebar clicks
    document.querySelectorAll('[data-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = el.getAttribute('data-target');
        if (targetTab) switchPortalTab(targetTab);
      });
    });

    // 3. Sidebar toggle button
    const toggleBtn = document.getElementById('sidebarLogoToggleBtn');
    const sidebar = document.getElementById('portalSidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // 4. Notification toggle
    const notifBtn = document.getElementById('topNotifBtn');
    const notifMenu = document.getElementById('notifDropdownMenu');
    if (notifBtn && notifMenu) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifMenu.style.display = notifMenu.style.display === 'block' ? 'none' : 'block';
      });
      document.addEventListener('click', () => {
        notifMenu.style.display = 'none';
      });
    }

    // 5. Public Donation Presets
    document.querySelectorAll('.amount-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const customInput = document.getElementById('customDonationAmount');
        if (customInput) {
          customInput.value = btn.getAttribute('data-amount');
        }
      });
    });

    // 6. Public Donation Form Submission
    const publicDonForm = document.getElementById('publicDonationForm');
    if (publicDonForm) {
      publicDonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('donorFullName')?.value;
        const email = document.getElementById('donorEmail')?.value;
        const amount = document.getElementById('customDonationAmount')?.value;
        const category = document.getElementById('donationCategorySelect')?.value;

        try {
          const res = await FB_DATA.recordDonation({
            donor_name: name,
            donor_email: email,
            amount: parseFloat(amount),
            category,
            payment_method: 'UPI / QR Code',
            tax_exemption_80g: 1
          });

          showToast('Donation processed successfully! 80G receipt issued.', 'success');
          publicDonForm.reset();

          // Open receipt modal
          const receiptModal = document.getElementById('donationReceiptModal');
          if (receiptModal && res.data) {
            document.getElementById('receiptTxnId').textContent = res.data.id;
            document.getElementById('receiptDonorName').textContent = res.data.donor_name;
            document.getElementById('receiptAmount').textContent = `$${res.data.amount.toLocaleString()}`;
            document.getElementById('receiptCategory').textContent = res.data.category;
            document.getElementById('receiptDate').textContent = res.data.donation_date;
            receiptModal.classList.add('active');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 7. Aid Request Form Submission
    const aidForm = document.getElementById('fundRequestForm');
    if (aidForm) {
      aidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const applicantName = document.getElementById('applicantName')?.value;
        const organization = document.getElementById('applicantOrg')?.value;
        const category = document.getElementById('requestCategory')?.value;
        const urgency = document.getElementById('requestUrgency')?.value;
        const amount = document.getElementById('requestAmount')?.value;
        const purpose = document.getElementById('requestPurpose')?.value;

        try {
          const res = await FB_DATA.createRequest({
            applicant_name: applicantName,
            organization,
            category,
            urgency,
            amount: parseFloat(amount),
            purpose
          });

          showToast('Grant application submitted! Tracking reference generated.', 'success');
          aidForm.reset();

          // Open tracking modal
          const successModal = document.getElementById('requestSuccessModal');
          if (successModal) {
            document.getElementById('displayTrackingCode').textContent = res.tracking_code;
            successModal.classList.add('active');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 8. Track Aid Request
    const trackBtn = document.getElementById('trackRequestBtn');
    if (trackBtn) {
      trackBtn.addEventListener('click', async () => {
        const codeInput = document.getElementById('trackingInputCode');
        const code = codeInput?.value?.trim();
        if (!code) {
          showToast('Please enter your tracking reference (e.g. REQ-2026-8941).', 'info');
          return;
        }

        try {
          const res = await FB_DATA.trackRequest(code);
          const display = document.getElementById('trackingResultDisplay');
          if (display && res.data) {
            display.style.display = 'block';
            display.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                <h4 style="margin:0; font-size:1rem; color:#ffffff;">${escapeHtml(res.data.tracking_code)}</h4>
                <span class="badge ${res.data.status === 'Approved & Disbursed' ? 'badge-success' : 'badge-warning'}">${escapeHtml(res.data.status)}</span>
              </div>
              <p style="font-size:0.85rem; color:#94a3b8; margin: 0 0 0.25rem 0;">Applicant: <strong>${escapeHtml(res.data.applicant_name)}</strong></p>
              <p style="font-size:0.85rem; color:#94a3b8; margin: 0 0 0.5rem 0;">Category: ${escapeHtml(res.data.category)} | Requested: $${res.data.amount.toLocaleString()}</p>
              <div style="background:#1e293b; padding: 0.75rem; border-radius: 8px; font-size:0.82rem; color:#cbd5e1;">
                <strong>Audit Note:</strong> ${escapeHtml(res.data.audit_remarks)}
              </div>
            `;
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 9. Public Contact Form
    const contactForm = document.getElementById('publicContactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('contactName')?.value;
        const email = document.getElementById('contactEmail')?.value;
        const subject = document.getElementById('contactSubject')?.value;
        const message = document.getElementById('contactMessage')?.value;

        try {
          const res = await FB_DATA.sendMessage({ name, email, subject, message });
          showToast(res.message, 'success');
          contactForm.reset();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 10. Login Form Submission
    const loginForm = document.getElementById('authLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        try {
          await FB_AUTH.login(email, password);
          showToast('Welcome back! Signed in successfully.', 'success');
          switchView('portal');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 11. Register Form Submission
    const regForm = document.getElementById('authRegisterForm');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('regFullName')?.value;
        const email = document.getElementById('regEmail')?.value;
        const phone = document.getElementById('regPhone')?.value;
        const role = document.getElementById('regRole')?.value;
        const password = document.getElementById('regPassword')?.value;

        try {
          await FB_AUTH.register({ full_name: fullName, email, phone, role, password });
          showToast('Account created successfully! Welcome to Fund Bridge.', 'success');
          switchView('portal');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 12. Quick Demo Login Pills
    document.querySelectorAll('.demo-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const email = pill.getAttribute('data-email');
        const pass = pill.getAttribute('data-pass');
        const emailInput = document.getElementById('loginEmail');
        const passInput = document.getElementById('loginPassword');
        if (emailInput && passInput) {
          emailInput.value = email;
          passInput.value = pass;
        }
      });
    });

    // 13. Forgot Password Flow
    // Step 1: Request OTP
    const fpEmailForm = document.getElementById('fpEmailForm');
    if (fpEmailForm) {
      fpEmailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('fpEmailInput');
        const email = emailInput?.value?.trim();
        if (!email) return;

        try {
          showToast('Sending secure verification code to your email...', 'info');
          const res = await FB_AUTH.forgotPassword(email);
          resetState.email = email;

          showToast(res.message, 'success');

          // Switch to OTP step
          document.getElementById('fpStepEmail').style.display = 'none';
          document.getElementById('fpStepOtp').style.display = 'block';
          document.getElementById('fpSentEmailDisplay').textContent = email;

          // Inform user that link was dispatched to their email
          const etherealLink = document.getElementById('fpEtherealLink');
          if (etherealLink) {
            etherealLink.style.display = 'none';
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // OTP Input auto-focus helper
    const otpBoxes = document.querySelectorAll('.fp-otp-box');
    otpBoxes.forEach((box, idx) => {
      box.addEventListener('input', () => {
        if (box.value.length === 1 && idx < otpBoxes.length - 1) {
          otpBoxes[idx + 1].focus();
        }
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          otpBoxes[idx - 1].focus();
        }
      });
    });

    // Step 2: Verify OTP
    const fpOtpForm = document.getElementById('fpOtpForm');
    if (fpOtpForm) {
      fpOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let otpCode = '';
        otpBoxes.forEach(b => { otpCode += b.value; });

        if (otpCode.length !== 6) {
          showToast('Please enter all 6 verification digits.', 'error');
          return;
        }

        try {
          const res = await FB_AUTH.verifyOtp(resetState.email, otpCode);
          resetState.resetToken = res.resetToken;

          showToast('OTP verified! Enter your new password.', 'success');
          document.getElementById('fpStepOtp').style.display = 'none';
          document.getElementById('fpStepReset').style.display = 'block';
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Step 3: Reset Password
    const fpResetForm = document.getElementById('fpResetForm');
    if (fpResetForm) {
      fpResetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('fpNewPassword')?.value;
        const confirmPass = document.getElementById('fpConfirmPassword')?.value;

        if (newPass !== confirmPass) {
          showToast('Passwords do not match.', 'error');
          return;
        }

        if (newPass.length < 8) {
          showToast('Password must be at least 8 characters long.', 'error');
          return;
        }

        try {
          const res = await FB_AUTH.resetPassword(resetState.email, resetState.resetToken, newPass);
          showToast(res.message, 'success');

          // Close modal and return to login
          closeAllModals();
          switchView('login');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 14. User Profile Form Submission
    const profForm = document.getElementById('userProfileForm');
    if (profForm) {
      profForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('profName')?.value;
        const phone = document.getElementById('profPhone')?.value;
        const bio = document.getElementById('profBio')?.value;

        try {
          const res = await FB_DATA.updateProfile({ full_name: name, phone, bio });
          showToast(res.message, 'success');
          loadUserProfile();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 15. System Settings Form Submission
    const settingsForm = document.getElementById('systemSettingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ngoName = document.getElementById('setNgoName')?.value;
        const regNum = document.getElementById('setRegNumber')?.value;
        const tax80g = document.getElementById('setTax80G')?.value;
        const currency = document.getElementById('setCurrency')?.value;
        const upiId = document.getElementById('setUpiId')?.value;

        try {
          const res = await FB_DATA.updateSettings({
            ngo_name: ngoName,
            reg_number: regNum,
            tax_80g: tax80g,
            currency,
            upi_id: upiId
          });
          showToast(res.message, 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 16. Reset System Data Demo button
    const resetDataBtn = document.getElementById('resetSystemDataBtn');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all test data back to default baseline?')) {
          try {
            const res = await FB_DATA.resetDemoData();
            showToast(res.message, 'success');
            loadDashboardData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    }

    // 17. Modal close triggers
    document.querySelectorAll('.modal-close-btn, [data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeAllModals();
      });
    });

    // 18. Logout triggers
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('logoutConfirmModal');
        if (modal) modal.classList.add('active');
        else FB_AUTH.logout();
      });
    });

    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener('click', () => {
        FB_AUTH.logout();
      });
    }

    // Check if user is already logged in
    if (FB_AUTH.isAuthenticated()) {
      const authLinks = document.querySelectorAll('.nav-auth-link');
      authLinks.forEach(l => {
        l.textContent = 'Go to Portal';
        l.setAttribute('data-view', 'portal');
      });
    }

    // Open Forgot Password modal trigger
    const openFpBtn = document.getElementById('openForgotPasswordBtn');
    if (openFpBtn) {
      openFpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
          document.getElementById('fpStepEmail').style.display = 'block';
          document.getElementById('fpStepOtp').style.display = 'none';
          document.getElementById('fpStepReset').style.display = 'none';
          modal.classList.add('active');
        }
      });
    }
  });

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  // Global helper functions
  window.switchView = switchView;
  window.switchPortalTab = switchPortalTab;
  window.showToast = showToast;
  window.closeAllModals = closeAllModals;

  window.viewReceipt = async function(id) {
    try {
      const res = await FB_DATA.getDonationById(id);
      if (res.success && res.data) {
        const don = res.data;
        document.getElementById('receiptTxnId').textContent = don.id;
        document.getElementById('receiptDonorName').textContent = don.donor_name;
        document.getElementById('receiptAmount').textContent = `$${don.amount.toLocaleString()}`;
        document.getElementById('receiptCategory').textContent = don.category;
        document.getElementById('receiptDate').textContent = don.donation_date || don.created_at?.split('T')[0];
        const modal = document.getElementById('donationReceiptModal');
        if (modal) modal.classList.add('active');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.verifyExpense = async function(id, status) {
    try {
      const res = await FB_DATA.updateExpense(id, { status });
      showToast(res.message, 'success');
      loadFullExpenses();
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
})();
