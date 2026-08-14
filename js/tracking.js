// ─── tracking.js ─────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: 'placed',            label: 'Order\nPlaced',       icon: '📋' },
  { key: 'payment_confirmed', label: 'Payment\nConfirmed',  icon: '✅' },
  { key: 'preparing',         label: 'Preparing\nOrder',    icon: '🍶' },
  { key: 'out_for_delivery',  label: 'Out for\nDelivery',   icon: '🛵' },
  { key: 'delivered',         label: 'Delivered',           icon: '🎉' },
];

const STATUS_LABELS = {
  placed:            'Order Placed',
  payment_confirmed: 'Payment Confirmed',
  preparing:         'Preparing',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
};

auth.onAuthStateChanged(user => {
  const link = document.getElementById('nav-user-link');
  if (link) {
    link.textContent = user ? (user.displayName || 'My Account') : 'Sign In';
    link.href = user ? '#' : 'login.html';
    if (user) {
      link.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Sign out?')) auth.signOut().then(() => window.location.href = 'login.html');
      });
    }
  }

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  loadOrders(user.uid);
});

async function loadOrders(userId) {
  const content = document.getElementById('tracking-content');
  content.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><p>Loading your orders…</p></div>`;

  // Check URL for specific order id
  const params = new URLSearchParams(window.location.search);
  const focusId = params.get('id') || localStorage.getItem('sipsmart_last_order');

  try {
    const res = await fetch(`${API_BASE}/orders/user/${userId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const orders = json.data;
    if (!orders.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="icon">📦</div>
          <h3>No orders yet</h3>
          <p>Start shopping to place your first order.</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Browse Products</a>
        </div>`;
      return;
    }

    content.innerHTML = `
      <div class="orders-page-header">
        <h2>My Orders</h2>
        <span class="orders-count">${orders.length} order${orders.length !== 1 ? 's' : ''}</span>
      </div>
      ${orders.map(order => renderOrderCard(order, order.id === focusId)).join('')}`;

    // Scroll to focused order
    if (focusId) {
      const el = document.getElementById(`order-${focusId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Could not load orders</h3>
        <p>Make sure the server is running. ${err.message}</p>
        <button class="btn btn-secondary" style="margin-top:1rem" onclick="location.reload()">Retry</button>
      </div>`;
  }
}

function renderOrderCard(order, highlight) {
  const stepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
  const progressPct = stepIndex >= 0 ? (stepIndex / (STATUS_STEPS.length - 1)) * 100 : 0;
  const addr = order.delivery_address || {};
  const date = new Date(order.created_at).toLocaleDateString('en-ZW', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `
    <div class="order-card${highlight ? ' highlighted' : ''}" id="order-${order.id}">
      <div class="order-card-header">
        <div>
          <div class="order-id">Order #${order.id.slice(0,8).toUpperCase()}</div>
          <div class="order-date">${date}</div>
        </div>
        <span class="status-badge status-${order.status}">${STATUS_LABELS[order.status] || order.status}</span>
      </div>

      <div class="progress-track">
        <div class="progress-steps">
          <div class="progress-line" style="width:calc(${progressPct}% - 16px)"></div>
          ${STATUS_STEPS.map((step, i) => {
            const cls = i < stepIndex ? 'done' : i === stepIndex ? 'active' : '';
            return `
              <div class="prog-step ${cls}">
                <div class="prog-icon">${i < stepIndex ? '✓' : step.icon}</div>
                <span class="prog-label">${step.label.replace('\n', '<br>')}</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="order-body">
        <div class="order-items-summary">
          ${(order.items || []).map(item => `
            <div class="oi-row">
              <img src="${item.image_url || 'https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=200'}"
                   alt="${item.name}"
                   onerror="this.src='https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=200'">
              <span class="name">${item.name}</span>
              <span class="qty">×${item.quantity}</span>
              <span class="price">${formatUSD(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>

        <div class="order-meta">
          <div class="meta-row">
            <span class="meta-label">Total Paid</span>
            <span class="meta-val">${formatUSD(order.total)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Payment</span>
            <span class="meta-val">${order.payment_method === 'ecocash' ? '📱 EcoCash' : '🏦 InnBucks'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Deliver To</span>
            <span class="meta-val">${addr.street || '—'}, ${addr.suburb || ''}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">City</span>
            <span class="meta-val">${addr.city || '—'}</span>
          </div>
        </div>
      </div>
    </div>`;
}
