// ─── Shared Utilities ─────────────────────────────────────────────────────

const API_BASE = '/api';

// Toast notifications
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Cart utilities
function getCart() {
  return JSON.parse(localStorage.getItem('sipsmart_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('sipsmart_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart(cart);
  showToast(`${product.name} added to cart`, 'success');
}

// Format currency
function formatUSD(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

// Auth guard — call on protected pages
function requireAuth(redirectTo = 'login.html') {
  auth.onAuthStateChange = auth.onAuthStateChanged;
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = redirectTo;
    }
  });
}

// Render navbar cart badge on load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Close mobile nav on link click
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => navLinks && navLinks.classList.remove('open'));
  });
});
function handleLogout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  }).catch(err => {
    console.error('Logout failed:', err);
  });
}