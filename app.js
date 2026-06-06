/* ============================================
   VendorBridge — App Controller
   ============================================ */

const App = {
  currentPage: 'dashboard',
  currentPageModule: null,

  pages: {
    'dashboard': DashboardPage,
    'vendors': VendorsPage,
    'rfq': RFQPage,
    'quotation': QuotationPage,
    'approval': ApprovalPage,
    'purchase-order': PurchaseOrderPage,
    'invoice': InvoicePage,
    'activity': ActivityPage,
  },

  rolePermissions: {
    admin: ['dashboard', 'vendors', 'rfq', 'quotation', 'approval', 'purchase-order', 'invoice', 'activity'],
    procurement: ['dashboard', 'vendors', 'rfq', 'quotation', 'activity'], // SCM
    manager: ['dashboard', 'vendors', 'rfq', 'quotation', 'approval', 'purchase-order', 'activity'],
    vendor: ['dashboard', 'purchase-order', 'invoice', 'activity']
  },

  updateSidebarNavigation() {
    const role = AppData.currentUser?.role;
    if (!role) return;

    const permittedPages = App.rolePermissions[role] || [];

    // Hide/show nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      const page = item.dataset.page;
      if (permittedPages.includes(page)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    // Hide/show section labels
    const sections = [
      {
        label: document.getElementById('label-main'),
        items: ['dashboard', 'vendors']
      },
      {
        label: document.getElementById('label-procurement'),
        items: ['rfq', 'quotation', 'approval']
      },
      {
        label: document.getElementById('label-orders'),
        items: ['purchase-order', 'invoice']
      },
      {
        label: document.getElementById('label-system'),
        items: ['activity']
      }
    ];

    sections.forEach(sec => {
      const hasPermitted = sec.items.some(page => permittedPages.includes(page));
      if (sec.label) {
        sec.label.style.display = hasPermitted ? 'block' : 'none';
      }
    });
  },

  init() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      App.handleLogin();
    });

    // Sidebar navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        App.navigate(item.dataset.page);
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
      });
    });

    // Sidebar toggle (mobile)
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      App.handleLogout();
    });

    // Close sidebar on overlay click (mobile)
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('sidebar-toggle');
      if (window.innerWidth <= 1024 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    // Remember me populate
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedRole = localStorage.getItem('rememberedRole');
    if (rememberedEmail && rememberedRole) {
      document.getElementById('login-email').value = rememberedEmail;
      document.getElementById('login-role').value = rememberedRole;
      document.getElementById('login-remember').checked = true;
    }

    // Forgot password listener
    const forgotLink = document.getElementById('login-forgot');
    if (forgotLink) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        App.handleForgotPassword();
      });
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        const icon = themeToggle.querySelector('.material-icons-round');
        if (icon) {
          icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (App.currentPage === 'dashboard') {
          DashboardPage.afterRender();
        }
      });
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      if (themeToggle) {
        const icon = themeToggle.querySelector('.material-icons-round');
        if (icon) icon.textContent = 'light_mode';
      }
    }

    // Global Search listeners
    const searchInput = document.getElementById('global-search');
    const searchDropdown = document.getElementById('search-results-dropdown');
    if (searchInput && searchDropdown) {
      searchInput.addEventListener('input', (e) => {
        App.handleGlobalSearch(e.target.value);
      });
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.add('hidden');
        }
      });
    }

    // Notification dropdown toggle
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
        App.renderNotifications();
      });
      document.addEventListener('click', (e) => {
        if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
          notifDropdown.classList.add('hidden');
        }
      });
    }

    // Load signed up users
    App.signedUpUsers = JSON.parse(localStorage.getItem('signedUpUsers') || '{}');

    // Tab switching between Login and Signup
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (tabLogin && tabSignup && loginForm && signupForm) {
      tabLogin.addEventListener('click', (e) => {
        e.preventDefault();
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
      });

      tabSignup.addEventListener('click', (e) => {
        e.preventDefault();
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
      });
    }

    // Dynamic role fields listener for Vendor Registration
    const signupRole = document.getElementById('signup-role');
    const signupNameGroup = document.getElementById('signup-name-group');
    const signupVendorFields = document.getElementById('signup-vendor-fields');
    const vendorInputs = [
      'signup-vendor-name',
      'signup-owner-name',
      'signup-company-name',
      'signup-company-address',
      'signup-firm-type',
      'signup-gst',
      'signup-pan'
    ];

    if (signupRole && signupNameGroup && signupVendorFields) {
      signupRole.addEventListener('change', () => {
        if (signupRole.value === 'vendor') {
          signupVendorFields.classList.remove('hidden');
          signupNameGroup.classList.add('hidden');
          document.getElementById('signup-name').required = false;

          // Set vendor fields as required
          vendorInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.required = true;
          });
        } else {
          signupVendorFields.classList.add('hidden');
          signupNameGroup.classList.remove('hidden');
          document.getElementById('signup-name').required = true;

          // Remove required from vendor fields
          vendorInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.required = false;
          });
        }
      });
    }

    // Signup form listener
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        App.handleSignup();
      });
    }
  },

  handleForgotPassword() {
    const email = prompt("Enter your registered email address to receive reset instructions:");
    if (email === null) return;
    const trimmedEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      Utils.toast('Please enter a valid email address', 'error');
      return;
    }
    Utils.toast(`Password reset instructions have been sent to ${trimmedEmail}`, 'success');
  },

  handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;
    const remember = document.getElementById('login-remember').checked;

    if (!email || !password || !role) {
      Utils.toast('Please fill in all fields', 'error');
      return;
    }

    // Strict Gmail ID structure check
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      Utils.toast('Invalid format! Must be a valid @gmail.com address', 'error');
      return;
    }

    // Password strength check (length >= 6, containing at least one letter and one digit)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      Utils.toast('Password must be at least 6 characters, containing a letter and a digit', 'error');
      return;
    }

    // Pre-registered database credentials verification
    const registeredUsers = {
      'admin@gmail.com': { password: 'Admin@123', role: 'admin', name: 'Admin User' },
      'officer@gmail.com': { password: 'Officer@123', role: 'procurement', name: 'SCM Manager' },
      'manager@gmail.com': { password: 'Manager@123', role: 'manager', name: 'Manager' },
      'vendor@gmail.com': { password: 'Vendor@123', role: 'vendor', name: 'Vendor' },
      ...App.signedUpUsers
    };

    let user = registeredUsers[email];
    if (user) {
      if (user.password !== password) {
        Utils.toast('Incorrect password for this pre-registered account', 'error');
        return;
      }
      if (user.role !== role) {
        Utils.toast(`Role mismatch! This account is registered as ${user.role.toUpperCase()}`, 'error');
        return;
      }
    } else {
      // Create user profile on-the-fly for custom Gmail addresses
      const calculatedName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      user = { password: password, role: role, name: calculatedName };
    }

    // Save or clear Remember Me
    if (remember) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedRole', role);
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedRole');
    }

    const roleLabels = {
      admin: 'Administrator',
      procurement: 'SCM Manager',
      manager: 'Manager',
      vendor: 'Vendor'
    };

    let vendorId = null;
    if (role === 'vendor') {
      const emailLower = email.toLowerCase();
      if (emailLower.includes('apex')) {
        vendorId = 'V-001';
      } else if (emailLower.includes('techvista') || emailLower.includes('dns')) {
        vendorId = 'V-002';
      } else if (emailLower.includes('greenfield')) {
        vendorId = 'V-003';
      } else if (emailLower.includes('steelcraft')) {
        vendorId = 'V-004';
      } else if (emailLower.includes('bharat')) {
        vendorId = 'V-005';
      } else if (emailLower.includes('quantum')) {
        vendorId = 'V-006';
      } else if (emailLower.includes('pacific')) {
        vendorId = 'V-007';
      } else {
        vendorId = 'V-001'; // Default
      }
    }

    AppData.currentUser = { email, role, name: user.name, roleLabel: roleLabels[role], vendorId: vendorId };

    // Update sidebar user info
    document.getElementById('user-avatar').textContent = user.name[0].toUpperCase();
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role-label').textContent = roleLabels[role];

    // Update sidebar layout based on permissions
    App.updateSidebarNavigation();

    // Animate login out
    const loginScreen = document.getElementById('login-screen');
    loginScreen.classList.add('leaving');

    setTimeout(() => {
      loginScreen.classList.add('hidden');
      document.getElementById('app-shell').classList.remove('hidden');
      App.navigate('dashboard');
      Utils.toast(`Welcome back, ${user.name}!`, 'success');
    }, 500);
  },

  handleSignup() {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const role = document.getElementById('signup-role').value;

    let name = '';
    let vendorData = null;

    if (role === 'vendor') {
      const vendorName = document.getElementById('signup-vendor-name').value.trim();
      const ownerName = document.getElementById('signup-owner-name').value.trim();
      const companyName = document.getElementById('signup-company-name').value.trim();
      const companyAddress = document.getElementById('signup-company-address').value.trim();
      const firmType = document.getElementById('signup-firm-type').value;
      const gst = document.getElementById('signup-gst').value.trim();
      const pan = document.getElementById('signup-pan').value.trim();

      if (!vendorName || !ownerName || !companyName || !companyAddress || !firmType || !gst || !pan || !email || !password || !confirmPassword) {
        Utils.toast('Please fill in all mandatory vendor fields', 'error');
        return;
      }
      name = vendorName;
      vendorData = {
        vendorName,
        ownerName,
        companyName,
        companyAddress,
        firmType,
        gst,
        pan
      };
    } else {
      name = document.getElementById('signup-name').value.trim();
      if (!name || !email || !password || !confirmPassword || !role) {
        Utils.toast('Please fill in all fields', 'error');
        return;
      }
    }

    // Strict Gmail ID structure check
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      Utils.toast('Invalid format! Must be a valid @gmail.com address', 'error');
      return;
    }

    // Password strength check (length >= 6, containing at least one letter and one digit)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      Utils.toast('Password must be at least 6 characters, containing a letter and a digit', 'error');
      return;
    }

    if (password !== confirmPassword) {
      Utils.toast('Passwords do not match', 'error');
      return;
    }

    // Check if user already exists in pre-registered or signed up users
    const registeredUsers = {
      'admin@gmail.com': true,
      'officer@gmail.com': true,
      'manager@gmail.com': true,
      'vendor@gmail.com': true,
      ...App.signedUpUsers
    };

    if (registeredUsers[email]) {
      Utils.toast('An account with this email already exists', 'error');
      return;
    }

    // Register user
    App.signedUpUsers[email] = { password, role, name, ...vendorData };
    localStorage.setItem('signedUpUsers', JSON.stringify(App.signedUpUsers));

    Utils.toast('Account created successfully! Please sign in.', 'success');

    // Reset signup form
    document.getElementById('signup-form').reset();
    document.getElementById('signup-vendor-fields').classList.add('hidden');
    document.getElementById('signup-name-group').classList.remove('hidden');

    // Switch to Sign In tab and auto-fill
    document.getElementById('tab-login').click();
    document.getElementById('login-email').value = email;
    document.getElementById('login-role').value = role;
    document.getElementById('login-password').focus();
  },

  handleLogout() {
    AppData.currentUser = null;
    const appShell = document.getElementById('app-shell');
    appShell.classList.add('hidden');

    const loginScreen = document.getElementById('login-screen');
    loginScreen.classList.remove('hidden', 'leaving');

    // Reset form
    document.getElementById('login-form').reset();
    Utils.toast('Signed out successfully', 'info');
  },

  navigate(page) {
    if (!App.pages[page]) return;

    // Check permission
    const role = AppData.currentUser?.role;
    const permittedPages = App.rolePermissions[role] || [];
    if (role && !permittedPages.includes(page)) {
      Utils.toast('Access Denied: You do not have permission to view this page.', 'error');
      return;
    }

    // Cleanup previous page
    if (App.currentPageModule && App.currentPageModule.cleanup) {
      App.currentPageModule.cleanup();
    }

    App.currentPage = page;
    App.currentPageModule = App.pages[page];

    // Update active nav
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Render page
    const content = document.getElementById('page-content');
    content.style.animation = 'none';
    content.offsetHeight; // Force reflow
    content.style.animation = 'fadeIn 0.3s ease';
    content.innerHTML = App.currentPageModule.render();

    // After render hook
    if (App.currentPageModule.afterRender) {
      App.currentPageModule.afterRender();
    }

    // Scroll to top
    content.scrollTop = 0;
  },

  handleGlobalSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      return;
    }

    const results = {
      vendors: AppData.vendors.filter(v => v.name.toLowerCase().includes(q) || v.contact.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)),
      rfqs: AppData.rfqs.filter(r => r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)),
      orders: AppData.purchaseOrders.filter(p => p.id.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q)),
      invoices: AppData.invoices.filter(i => i.id.toLowerCase().includes(q) || i.vendor.toLowerCase().includes(q))
    };

    const totalResults = results.vendors.length + results.rfqs.length + results.orders.length + results.invoices.length;

    if (totalResults === 0) {
      dropdown.innerHTML = `<div class="search-no-results">No matches found for "${query}"</div>`;
      dropdown.classList.remove('hidden');
      return;
    }

    let html = '';

    if (results.vendors.length > 0) {
      html += `<div class="search-category-title">Vendors</div>`;
      results.vendors.forEach(v => {
        html += `<div class="search-result-item" onclick="App.navigateToSearchItem('vendors', '${v.id}')">
          <span class="material-icons-round search-item-icon">store</span>
          <div class="search-item-info">
            <span class="search-item-name">${v.name}</span>
            <span class="search-item-meta">${v.category} · ${v.id}</span>
          </div>
        </div>`;
      });
    }

    if (results.rfqs.length > 0) {
      html += `<div class="search-category-title">RFQs</div>`;
      results.rfqs.forEach(r => {
        html += `<div class="search-result-item" onclick="App.navigateToSearchItem('rfq', '${r.id}')">
          <span class="material-icons-round search-item-icon">request_quote</span>
          <div class="search-item-info">
            <span class="search-item-name">${r.title}</span>
            <span class="search-item-meta">${r.id} · Status: ${r.status.toUpperCase()}</span>
          </div>
        </div>`;
      });
    }

    if (results.orders.length > 0) {
      html += `<div class="search-category-title">Purchase Orders</div>`;
      results.orders.forEach(p => {
        html += `<div class="search-result-item" onclick="App.navigateToSearchItem('purchase-order', '${p.id}')">
          <span class="material-icons-round search-item-icon">receipt_long</span>
          <div class="search-item-info">
            <span class="search-item-name">${p.id}</span>
            <span class="search-item-meta">${p.vendor} · ₹${(p.total / 100000).toFixed(1)} Lakhs</span>
          </div>
        </div>`;
      });
    }

    if (results.invoices.length > 0) {
      html += `<div class="search-category-title">Invoices</div>`;
      results.invoices.forEach(i => {
        html += `<div class="search-result-item" onclick="App.navigateToSearchItem('invoice', '${i.id}')">
          <span class="material-icons-round search-item-icon">description</span>
          <div class="search-item-info">
            <span class="search-item-name">${i.id}</span>
            <span class="search-item-meta">${i.vendor} · Status: ${i.status.toUpperCase()}</span>
          </div>
        </div>`;
      });
    }

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
  },

  navigateToSearchItem(page, id) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    const searchInput = document.getElementById('global-search');
    if (searchInput) searchInput.value = '';

    App.navigate(page);

    setTimeout(() => {
      const searchField = document.querySelector(`.page-section[data-page="${page}"] input[type="text"], #vendor-search, #rfq-search, #po-search, #invoice-search`);
      if (searchField) {
        searchField.value = id;
        searchField.dispatchEvent(new Event('input'));
        Utils.toast(`Located ${id}`, 'info');
      }
    }, 100);
  },

  renderNotifications() {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;

    const mockNotifications = [
      { id: 1, text: "New quotation submitted by TechVista Components", time: "5m ago", icon: "compare_arrows" },
      { id: 2, text: "Purchase Order PO-2026-002 approved by Manager", time: "45m ago", icon: "check_circle" },
      { id: 3, text: "Invoice INV-2026-001 matches PO budget", time: "1h ago", icon: "description" },
      { id: 4, text: "RFQ Q3 Steel Bar Procurement deadline is approaching", time: "2h ago", icon: "warning" },
      { id: 5, text: "New vendor registered: Pacific Tools (V-007)", time: "1d ago", icon: "store" }
    ];

    const badge = document.querySelector('#notif-btn .topbar-badge');
    const count = badge ? parseInt(badge.textContent) || 0 : 0;

    if (count === 0) {
      dropdown.innerHTML = `
        <div class="notif-header">
          <h3>Notifications</h3>
        </div>
        <div class="notif-empty">No new notifications</div>
      `;
      return;
    }

    let html = `
      <div class="notif-header">
        <h3>Notifications</h3>
        <button class="notif-clear-btn" onclick="App.clearNotifications()">Clear All</button>
      </div>
      <div class="notif-list">
    `;

    mockNotifications.slice(0, count).forEach(n => {
      html += `
        <div class="notif-item">
          <span class="material-icons-round notif-icon">${n.icon}</span>
          <div class="notif-content">
            <p class="notif-text">${n.text}</p>
            <span class="notif-time">${n.time}</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    dropdown.innerHTML = html;
  },

  clearNotifications() {
    const badge = document.querySelector('#notif-btn .topbar-badge');
    if (badge) {
      badge.remove();
    }
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
    Utils.toast("Notifications cleared", "info");
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
