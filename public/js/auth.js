/**
 * =============================================================================
 * FUND BRIDGE: Authentication & Session Controller
 * Connects frontend auth, OTP flow, and RBAC to backend APIs
 * =============================================================================
 */

const FB_AUTH = (function() {
  let currentUser = null;

  function init() {
    try {
      const savedUser = localStorage.getItem('fb_current_user');
      const token = localStorage.getItem('fb_jwt_token');
      if (savedUser && token) {
        currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      currentUser = null;
    }
  }

  init();

  return {
    getCurrentUser() {
      return currentUser;
    },

    isAuthenticated() {
      return !!(currentUser && localStorage.getItem('fb_jwt_token'));
    },

    hasRole(role) {
      return currentUser && currentUser.role === role;
    },

    isAdmin() {
      return this.hasRole('Administrator');
    },

    isDonor() {
      return this.hasRole('Donor Member');
    },

    isVolunteer() {
      return this.hasRole('Volunteer Staff');
    },

    isBeneficiary() {
      return this.hasRole('Beneficiary Partner');
    },

    async login(email, password) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      currentUser = data.user;
      localStorage.setItem('fb_jwt_token', data.token);
      localStorage.setItem('fb_current_user', JSON.stringify(data.user));

      return data;
    },

    async register(userData) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      currentUser = data.user;
      localStorage.setItem('fb_jwt_token', data.token);
      localStorage.setItem('fb_current_user', JSON.stringify(data.user));

      return data;
    },

    async forgotPassword(email) {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP.');
      }

      return data;
    },

    async verifyOtp(email, otp) {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired OTP code.');
      }

      return data;
    },

    async resetPassword(email, resetToken, newPassword) {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      return data;
    },

    async changePassword(currentPassword, newPassword) {
      const token = localStorage.getItem('fb_jwt_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password.');
      }

      return data;
    },

    async logout() {
      const token = localStorage.getItem('fb_jwt_token');
      try {
        if (token) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      } catch (e) {
        // ignore
      }

      currentUser = null;
      localStorage.removeItem('fb_jwt_token');
      localStorage.removeItem('fb_current_user');
      window.location.reload();
    },

    setCurrentUser(user) {
      currentUser = user;
      localStorage.setItem('fb_current_user', JSON.stringify(user));
    }
  };
})();

window.FB_AUTH = FB_AUTH;
