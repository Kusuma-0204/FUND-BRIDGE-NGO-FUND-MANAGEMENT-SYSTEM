/**
 * =============================================================================
 * FUND BRIDGE: API Data Layer
 * Connects frontend directly to Node.js / Express REST API endpoints
 * =============================================================================
 */

const FB_DATA = (function() {
  const BASE_URL = '/api';

  function getAuthHeader() {
    const token = localStorage.getItem('fb_jwt_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async function request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  return {
    // Dashboard Stats
    async getDashboardStats() {
      return await request('/dashboard/stats');
    },

    // Donations
    async getDonations(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await request(`/donations${query ? '?' + query : ''}`);
    },

    async getDonationById(id) {
      return await request(`/donations/${id}`);
    },

    async recordDonation(payload) {
      return await request('/donations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async updateDonation(id, payload) {
      return await request(`/donations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    // Expenses
    async getExpenses(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await request(`/expenses${query ? '?' + query : ''}`);
    },

    async createExpense(payload) {
      return await request('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async updateExpense(id, payload) {
      return await request(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    async deleteExpense(id) {
      return await request(`/expenses/${id}`, {
        method: 'DELETE'
      });
    },

    // Aid Requests
    async getRequests(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await request(`/requests${query ? '?' + query : ''}`);
    },

    async trackRequest(trackingCode) {
      return await request(`/requests/track/${encodeURIComponent(trackingCode)}`);
    },

    async createRequest(payload) {
      return await request('/requests', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async updateRequest(id, payload) {
      return await request(`/requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    // Contact Inquiries
    async sendMessage(payload) {
      return await request('/messages', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async getMessages() {
      return await request('/messages');
    },

    // User Profile
    async getProfile() {
      return await request('/users/profile');
    },

    async updateProfile(payload) {
      return await request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    // Notifications
    async getNotifications() {
      return await request('/notifications');
    },

    async markNotificationRead(id) {
      return await request(`/notifications/${id}/read`, {
        method: 'PUT'
      });
    },

    // Audit Logs
    async getAuditLogs() {
      return await request('/audit-logs');
    },

    // Settings
    async getSettings() {
      return await request('/settings');
    },

    async updateSettings(payload) {
      return await request('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    async resetDemoData() {
      return await request('/settings/reset-demo-data', {
        method: 'POST'
      });
    }
  };
})();

// Attach to window for global script access
window.FB_DATA = FB_DATA;
