/* ============================================
   VendorBridge — Utility Functions
   ============================================ */

const Utils = {
  /**
   * Format number as Indian currency
   */
  currency(amount) {
    if (amount == null) return '—';
    return '₹' + amount.toLocaleString('en-IN');
  },

  /**
   * Format large number with abbreviation
   */
  shortCurrency(amount) {
    if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + ' Cr';
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + ' L';
    if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K';
    return '₹' + amount;
  },

  /**
   * Format date string nicely
   */
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  /**
   * Relative time string
   */
  timeAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    if (hrs < 24) return hrs + 'h ago';
    if (days < 7) return days + 'd ago';
    return Utils.formatDate(dateStr);
  },

  /**
   * Generate an ID with prefix
   */
  generateId(prefix) {
    const year = new Date().getFullYear();
    const num = String(Math.floor(Math.random() * 900) + 100);
    return `${prefix}-${year}-${num}`;
  },

  /**
   * Show toast notification
   */
  toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const icons = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="material-icons-round toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">
        <span class="material-icons-round">close</span>
      </button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Create and show a modal
   */
  showModal(title, bodyHtml, footerHtml) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="Utils.closeModal()">
            <span class="material-icons-round">close</span>
          </button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Utils.closeModal();
    });
    document.body.appendChild(overlay);
  },

  closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
  },

  /**
   * Add activity log entry
   */
  addActivity(type, icon, user, action, target) {
    const now = new Date();
    const timeStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');

    AppData.activityLog.unshift({
      id: Date.now(),
      type, icon, user, action, target, time: timeStr
    });
  },

  /**
   * Simple vendor name from ID
   */
  getVendorName(vendorId) {
    const v = AppData.vendors.find(v => v.id === vendorId);
    return v ? v.name : vendorId;
  },

  /**
   * Star rating HTML
   */
  starsHtml(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < full; i++) html += '<span class="material-icons-round" style="font-size:14px;color:#f59e0b">star</span>';
    if (half) html += '<span class="material-icons-round" style="font-size:14px;color:#f59e0b">star_half</span>';
    const empty = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < empty; i++) html += '<span class="material-icons-round" style="font-size:14px;color:var(--text-tertiary)">star_border</span>';
    return html;
  },

  /**
   * Debounce helper
   */
  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};
