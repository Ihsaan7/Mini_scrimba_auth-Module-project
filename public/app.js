/**
 * Frontend Application for Auth & Cart Module
 * Seamlessly interfaces with Express + SQLite Backend
 */

// State
let currentUser = null;
let currentCart = { cartCount: 0, cartTotal: 0, items: [] };

// Curated Catalog for testing & adding items
const CATALOG_ITEMS = [
  { id: 'cat-1', name: 'Mechanical Keyboard', price: 89.99, tag: 'Hardware' },
  { id: 'cat-2', name: 'Merino Wool Desk Mat', price: 34.00, tag: 'Accessories' },
  { id: 'cat-3', name: 'Rollerball Brass Pen', price: 24.50, tag: 'Stationery' },
  { id: 'cat-4', name: 'Walnut Monitor Riser', price: 68.00, tag: 'Furniture' },
  { id: 'cat-5', name: 'Braided USB-C Cable', price: 16.00, tag: 'Cable' }
];

// DOM Elements
const elements = {
  // Views
  authView: document.getElementById('auth-view'),
  dashboardView: document.getElementById('dashboard-view'),

  // Header
  sessionStatusText: document.getElementById('session-status-text'),
  sessionStatusBadge: document.getElementById('session-status-badge'),
  logoutBtn: document.getElementById('logout-btn'),

  // Auth Tabs & Forms
  tabLogin: document.getElementById('tab-login'),
  tabRegister: document.getElementById('tab-register'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  authAlert: document.getElementById('auth-alert'),
  quickFillBtn: document.getElementById('quick-fill-btn'),

  // Login Inputs
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginSubmitBtn: document.getElementById('login-submit-btn'),

  // Register Inputs
  regUsername: document.getElementById('reg-username'),
  regEmail: document.getElementById('reg-email'),
  regPassword: document.getElementById('reg-password'),
  registerSubmitBtn: document.getElementById('register-submit-btn'),

  // Dashboard / User Banner
  currentUsername: document.getElementById('current-username'),
  currentUserEmail: document.getElementById('current-user-email'),
  userAvatarText: document.getElementById('user-avatar-text'),
  footnoteUserId: document.getElementById('footnote-user-id'),

  // Catalog
  catalogItemsList: document.getElementById('catalog-items-list'),
  toggleCustomAddBtn: document.getElementById('toggle-custom-add-btn'),
  customItemForm: document.getElementById('custom-item-form'),
  customName: document.getElementById('custom-name'),
  customPrice: document.getElementById('custom-price'),
  customQty: document.getElementById('custom-qty'),

  // Cart
  cartCountBadge: document.getElementById('cart-count-badge'),
  refreshCartBtn: document.getElementById('refresh-cart-btn'),
  cartEmptyState: document.getElementById('cart-empty-state'),
  cartTable: document.getElementById('cart-table'),
  cartItemsRows: document.getElementById('cart-items-rows'),
  summaryItemsCount: document.getElementById('summary-items-count'),
  summaryTotalPrice: document.getElementById('summary-total-price'),
  checkoutSimBtn: document.getElementById('checkout-sim-btn'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success', duration = 3200) {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  toast.setAttribute('role', 'status');

  const icon = type === 'error' ? '✕' : '✓';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// ==========================================================================
// AUTHENTICATION LOGIC
// ==========================================================================
async function checkAuthSession() {
  try {
    const res = await fetch('/api/v1/users/profile', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        onUserAuthenticated(data.data);
        return;
      }
    }
    onUserLoggedOut();
  } catch (err) {
    console.warn('Session check failed:', err);
    onUserLoggedOut();
  }
}

function onUserAuthenticated(user) {
  currentUser = user;
  
  // Update header
  elements.sessionStatusText.textContent = `@${user.username}`;
  elements.logoutBtn.classList.remove('hidden');

  // Update greeting
  elements.currentUsername.textContent = user.username;
  elements.currentUserEmail.textContent = user.email;
  elements.userAvatarText.textContent = (user.username || 'U').charAt(0).toUpperCase();
  if (elements.footnoteUserId) {
    elements.footnoteUserId.textContent = `#${user.id}`;
  }

  // Switch views
  elements.authView.classList.add('hidden');
  elements.dashboardView.classList.remove('hidden');

  // Load cart data
  fetchCart();
}

function onUserLoggedOut() {
  currentUser = null;
  currentCart = { cartCount: 0, cartTotal: 0, items: [] };

  // Header
  elements.sessionStatusText.textContent = 'Not logged in';
  elements.logoutBtn.classList.add('hidden');

  // Switch views
  elements.dashboardView.classList.add('hidden');
  elements.authView.classList.remove('hidden');
}

// Tab Switching
function setActiveTab(tab) {
  clearAlert();
  if (tab === 'login') {
    elements.tabLogin.classList.add('active');
    elements.tabRegister.classList.remove('active');
    elements.loginForm.classList.remove('hidden');
    elements.registerForm.classList.add('hidden');
  } else {
    elements.tabRegister.classList.add('active');
    elements.tabLogin.classList.remove('active');
    elements.registerForm.classList.remove('hidden');
    elements.loginForm.classList.add('hidden');
  }
}

function showAlert(message, type = 'error') {
  elements.authAlert.className = `alert-box alert-${type}`;
  elements.authAlert.textContent = message;
  elements.authAlert.classList.remove('hidden');
}

function clearAlert() {
  elements.authAlert.textContent = '';
  elements.authAlert.classList.add('hidden');
}

function setBtnLoading(btn, isLoading, defaultText) {
  const textSpan = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');
  btn.disabled = isLoading;
  if (isLoading) {
    if (textSpan) textSpan.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
  } else {
    if (textSpan) {
      textSpan.textContent = defaultText;
      textSpan.classList.remove('hidden');
    }
    if (spinner) spinner.classList.add('hidden');
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  clearAlert();

  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;

  if (!email || !password) {
    showAlert('Please provide both email and password.');
    return;
  }

  setBtnLoading(elements.loginSubmitBtn, true);

  try {
    const res = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showAlert(data.message || 'Login failed. Please check credentials.');
      return;
    }

    showToast(`Welcome back, ${data.data.username}!`, 'success');
    onUserAuthenticated({
      id: data.data.userId,
      username: data.data.username,
      email: data.data.email
    });
  } catch (err) {
    showAlert('Network error communicating with server.');
  } finally {
    setBtnLoading(elements.loginSubmitBtn, false, 'Sign In');
  }
}

// Handle Register
async function handleRegister(e) {
  e.preventDefault();
  clearAlert();

  const username = elements.regUsername.value.trim();
  const email = elements.regEmail.value.trim();
  const password = elements.regPassword.value;

  if (!username || !email || !password) {
    showAlert('All fields (Username, Email, Password) are required.');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    return;
  }

  setBtnLoading(elements.registerSubmitBtn, true);

  try {
    const res = await fetch('/api/v1/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showAlert(data.message || 'Registration failed.');
      return;
    }

    showToast('Account created! Signing you in...', 'success');

    // Auto-login newly registered user
    const loginRes = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.success) {
      onUserAuthenticated({
        id: loginData.data.userId,
        username: loginData.data.username,
        email: loginData.data.email
      });
    } else {
      setActiveTab('login');
      elements.loginEmail.value = email;
      showAlert('Account registered! Please sign in with your credentials.', 'success');
    }
  } catch (err) {
    showAlert('Network error communicating with server.');
  } finally {
    setBtnLoading(elements.registerSubmitBtn, false, 'Create Account');
  }
}

// Handle Logout
async function handleLogout() {
  try {
    const res = await fetch('/api/v1/users/logout', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });
    if (res.ok) {
      showToast('Logged out successfully.', 'success');
    }
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    onUserLoggedOut();
  }
}

// ==========================================================================
// CATALOG & CART LOGIC
// ==========================================================================
function renderCatalog() {
  elements.catalogItemsList.innerHTML = '';

  CATALOG_ITEMS.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'catalog-item-row';
    row.id = `catalog-row-${item.id}`;

    row.innerHTML = `
      <div class="catalog-item-info">
        <span class="catalog-item-name">${escapeHtml(item.name)}</span>
        <span class="catalog-item-price font-mono">${formatCurrency(item.price)}</span>
      </div>
      <div class="catalog-item-actions">
        <input 
          type="number" 
          id="qty-${item.id}" 
          class="qty-input font-mono" 
          value="1" 
          min="1" 
          max="99" 
          aria-label="Quantity for ${escapeHtml(item.name)}"
        >
        <button 
          id="btn-add-${item.id}" 
          type="button" 
          class="btn btn-secondary btn-sm"
        >
          Add to Cart
        </button>
      </div>
    `;

    const addBtn = row.querySelector(`#btn-add-${item.id}`);
    const qtyInput = row.querySelector(`#qty-${item.id}`);

    addBtn.addEventListener('click', () => {
      const quantity = parseInt(qtyInput.value, 10) || 1;
      addItemToCart(item.name, item.price, quantity, addBtn);
    });

    elements.catalogItemsList.appendChild(row);
  });
}

// Add Item via API: POST /api/v1/carts/add
async function addItemToCart(product_name, price, quantity, triggerBtn) {
  if (!currentUser) {
    showToast('Please log in first to add items.', 'error');
    return;
  }

  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.textContent = 'Adding...';
  }

  try {
    const res = await fetch('/api/v1/carts/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ product_name, price, quantity })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || 'Could not add item to cart', 'error');
      return;
    }

    showToast(`Added ${quantity}× ${product_name} to cart`, 'success');
    await fetchCart();

    // Trigger bump animation on cart badge
    elements.cartCountBadge.classList.add('bump');
    setTimeout(() => elements.cartCountBadge.classList.remove('bump'), 250);
  } catch (err) {
    showToast('Network error adding to cart', 'error');
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.textContent = 'Add to Cart';
    }
  }
}

// Fetch Cart via API: GET /api/v1/carts
async function fetchCart() {
  if (!currentUser) return;

  try {
    const res = await fetch('/api/v1/carts', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 401) {
        onUserLoggedOut();
      }
      return;
    }

    const data = await res.json();
    if (data.success && data.data) {
      currentCart = data.data;
      renderCart();
    }
  } catch (err) {
    console.error('Fetch cart failed:', err);
  }
}

function renderCart() {
  const { cartCount, cartTotal, items } = currentCart;

  // Header badge & footer counters
  elements.cartCountBadge.textContent = `${cartCount} ${cartCount === 1 ? 'item' : 'items'}`;
  elements.summaryItemsCount.textContent = cartCount;
  elements.summaryTotalPrice.textContent = formatCurrency(cartTotal);

  // Table vs Empty State
  if (!items || items.length === 0) {
    elements.cartEmptyState.classList.remove('hidden');
    elements.cartTable.classList.add('hidden');
    elements.cartItemsRows.innerHTML = '';
    return;
  }

  elements.cartEmptyState.classList.add('hidden');
  elements.cartTable.classList.remove('hidden');
  elements.cartItemsRows.innerHTML = '';

  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.id = `cart-row-${item.id || index}`;

    const subtotal = item.quantity * item.price;

    row.innerHTML = `
      <span class="col-item" title="${escapeHtml(item.product_name)}">${escapeHtml(item.product_name)}</span>
      <span class="col-qty font-mono">${item.quantity}</span>
      <span class="col-price font-mono">${formatCurrency(item.price)}</span>
      <span class="col-total font-mono">${formatCurrency(subtotal)}</span>
    `;

    elements.cartItemsRows.appendChild(row);
  });
}

// ==========================================================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================================================
function initEvents() {
  // Tab Switching
  elements.tabLogin.addEventListener('click', () => setActiveTab('login'));
  elements.tabRegister.addEventListener('click', () => setActiveTab('register'));

  // Form Submissions
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.registerForm.addEventListener('submit', handleRegister);
  elements.logoutBtn.addEventListener('click', handleLogout);

  // Quick fill test user
  elements.quickFillBtn.addEventListener('click', () => {
    elements.loginEmail.value = 'alex@example.com';
    elements.loginPassword.value = 'password123';
    elements.regUsername.value = 'alex';
    elements.regEmail.value = 'alex@example.com';
    elements.regPassword.value = 'password123';
    showToast('Prefilled test credentials (alex@example.com)', 'success', 2000);
  });

  // Custom Item Collapsible & Add
  elements.toggleCustomAddBtn.addEventListener('click', () => {
    const isHidden = elements.customItemForm.classList.contains('hidden');
    if (isHidden) {
      elements.customItemForm.classList.remove('hidden');
      elements.toggleCustomAddBtn.querySelector('.toggle-icon').textContent = '−';
    } else {
      elements.customItemForm.classList.add('hidden');
      elements.toggleCustomAddBtn.querySelector('.toggle-icon').textContent = '+';
    }
  });

  elements.customItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = elements.customName.value.trim();
    const price = parseFloat(elements.customPrice.value);
    const qty = parseInt(elements.customQty.value, 10) || 1;

    if (!name || isNaN(price) || price <= 0 || qty < 1) {
      showToast('Please enter valid product details', 'error');
      return;
    }

    const submitBtn = document.getElementById('custom-add-submit-btn');
    await addItemToCart(name, price, qty, submitBtn);

    elements.customName.value = '';
    elements.customPrice.value = '';
    elements.customQty.value = '1';
  });

  // Refresh cart
  elements.refreshCartBtn.addEventListener('click', async () => {
    elements.refreshCartBtn.style.transform = 'rotate(180deg)';
    await fetchCart();
    setTimeout(() => {
      elements.refreshCartBtn.style.transform = 'rotate(0deg)';
    }, 300);
    showToast('Cart refreshed', 'success', 1500);
  });

  // Checkout simulation
  elements.checkoutSimBtn.addEventListener('click', () => {
    if (currentCart.cartCount === 0) {
      showToast('Add items before checking out', 'error');
      return;
    }
    showToast(`Order confirmed for ${formatCurrency(currentCart.cartTotal)}! (Session data stored in SQLite)`, 'success', 4000);
  });
}

// Initial Boot
function init() {
  renderCatalog();
  initEvents();
  checkAuthSession();
}

document.addEventListener('DOMContentLoaded', init);
