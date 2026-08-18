// ─── admin.js ─────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  placed:            'Order Placed',
  payment_confirmed: 'Payment Confirmed',
  preparing:         'Preparing',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
};

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('signout-btn').addEventListener('click', () => {
    auth.signOut().then(() => window.location.href = 'login.html');
  });
  loadAll();
});

async function loadAll() {
  await Promise.all([loadProducts(), loadOrders(), loadVerifications()]);
}

// ─── ID Verifications ──────────────────────────────────────────────────────

async function loadVerifications() {
  const wrap = document.getElementById('verifications-list');
  wrap.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><p>Loading…</p></div>`;
  try {
    const res = await fetch(`${API_BASE}/users?status=pending`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const badge = document.getElementById('verif-badge');
    if (!json.data.length) {
      badge.style.display = 'none';
      wrap.innerHTML = `<div class="empty-state"><div class="icon">✅</div><h3>No pending verifications</h3><p>All caught up.</p></div>`;
      return;
    }
    badge.style.display = 'inline-block';
    badge.textContent = json.data.length;

    wrap.innerHTML = json.data.map(u => `
      <div class="admin-order-row" style="align-items:center">
        <div>
          <img src="${u.id_doc_url}" alt="ID document" style="width:90px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer" onclick="window.open('${u.id_doc_url}', '_blank')">
        </div>
        <div>
          <div class="aor-email"><strong>${u.full_name || 'Unknown'}</strong></div>
          <div class="aor-items">${u.email || ''} · ${u.phone || ''} · DOB: ${u.dob || '—'}</div>
        </div>
        <div style="display:flex;gap:.5rem">
          <button class="btn btn-primary btn-sm" onclick="setVerificationStatus('${u.uid}', 'approved')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="setVerificationStatus('${u.uid}', 'rejected')">Reject</button>
        </div>
      </div>`).join('');
  } catch (err) {
    wrap.innerHTML = `<p style="padding:1.5rem;color:var(--error)">Error: ${err.message}</p>`;
  }
}

async function setVerificationStatus(uid, status) {
  if (!confirm(`Mark this user as ${status}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/users/${uid}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    showToast(`User ${status}`, status === 'approved' ? 'success' : 'info');
    loadVerifications();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

async function loadProducts() {
  const wrap = document.getElementById('products-table');
  wrap.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><p>Loading…</p></div>`;

  try {
    const res = await fetch(`${API_BASE}/products`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    document.getElementById('st-products').textContent = json.data.length;
    renderProductsTable(json.data);
  } catch (err) {
    wrap.innerHTML = `<p style="padding:1.5rem;color:var(--error)">Error: ${err.message}</p>`;
  }
}

function renderProductsTable(products) {
  const wrap = document.getElementById('products-table');
  if (!products.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon">📦</div><h3>No products yet</h3><p>Add your first product above.</p></div>`;
    return;
  }
  wrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td>
              <img class="product-thumb"
                   src="${p.image_url || 'https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=200'}"
                   alt="${p.name}"
                   onerror="this.src='https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=200'">
            </td>
            <td><strong>${p.name}</strong><br><span style="font-size:.75rem;color:var(--neutral-400)">${p.description || ''}</span></td>
            <td><span class="cat-pill">${p.category}</span></td>
            <td><strong>${formatUSD(p.price)}</strong></td>
            <td>${p.stock}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}', '${p.name.replace(/'/g,'\\\'').replace(/"/g,'&quot;')}')">
                Delete
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function toggleAddForm() {
  const form = document.getElementById('add-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'block') form.scrollIntoView({ behavior: 'smooth' });
}

async function addProduct() {
  const name  = document.getElementById('p-name').value.trim();
  const cat   = document.getElementById('p-cat').value;
  const price = parseFloat(document.getElementById('p-price').value);
  const image = document.getElementById('p-image').value.trim();
  const stock = parseInt(document.getElementById('p-stock').value) || 0;
  const desc  = document.getElementById('p-desc').value.trim();
  const alertBox = document.getElementById('add-alert');

  if (!name || isNaN(price) || price <= 0) {
    alertBox.innerHTML = `<div class="alert alert-error">Name and a valid price are required.</div>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category: cat, price, image_url: image, stock, description: desc })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    alertBox.innerHTML = `<div class="alert alert-success">Product added successfully!</div>`;
    ['p-name','p-price','p-image','p-stock','p-desc'].forEach(id => document.getElementById(id).value = '');
    setTimeout(() => alertBox.innerHTML = '', 3000);
    loadProducts();
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    showToast('Product deleted', 'info');
    loadProducts();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

async function loadOrders() {
  const wrap = document.getElementById('orders-list');
  wrap.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><p>Loading orders…</p></div>`;

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    const orders = json.data;
    const revenue = orders.reduce((s,o) => s + Number(o.total), 0);
    const pending = orders.filter(o => o.status !== 'delivered').length;

    document.getElementById('st-orders').textContent  = orders.length;
    document.getElementById('st-revenue').textContent = formatUSD(revenue);
    document.getElementById('st-pending').textContent = pending;

    renderOrders(orders);
  } catch (err) {
    wrap.innerHTML = `<p style="color:var(--error);padding:1.5rem">Error: ${err.message}</p>`;
  }
}

function renderOrders(orders) {
  const wrap = document.getElementById('orders-list');
  if (!orders.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>No orders yet</h3></div>`;
    return;
  }

  wrap.innerHTML = orders.map(order => {
    const date = new Date(order.created_at).toLocaleDateString('en-ZW', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const itemCount = (order.items || []).reduce((s,i) => s + i.quantity, 0);
    return `
      <div class="admin-order-row">
        <div>
          <div class="aor-id">#${order.id.slice(0,8).toUpperCase()}</div>
          <div class="aor-date">${date}</div>
        </div>
        <div>
          <div class="aor-email">${order.user_email}</div>
          <div class="aor-items">${itemCount} item${itemCount !== 1 ? 's' : ''} · ${order.payment_method === 'ecocash' ? 'EcoCash' : 'InnBucks'} · ${(order.delivery_address || {}).city || '—'}</div>
        </div>
        <div class="aor-total">
          ${formatUSD(order.total)}
          <small>${formatUSD(order.delivery_fee)} delivery</small>
        </div>
        <div>
          <select class="status-select" onchange="updateOrderStatus('${order.id}', this.value)">
            ${Object.entries(STATUS_LABELS).map(([k,v]) => `
              <option value="${k}" ${k === order.status ? 'selected' : ''}>${v}</option>
            `).join('')}
          </select>
        </div>
      </div>`;
  }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    showToast(`Status updated to: ${STATUS_LABELS[newStatus]}`, 'success');
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    loadOrders();
  }
}