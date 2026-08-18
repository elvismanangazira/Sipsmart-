// ─── checkout.js ─────────────────────────────────────────────────────────

const DELIVERY_FEE = 2.00;
let currentUser = null;

auth.onAuthStateChanged(async user => {
  const link = document.getElementById('nav-user-link');
  if (link) {
    link.textContent = user ? user.displayName || 'My Account' : 'Sign In';
    link.href = user ? 'tracking.html' : 'login.html';
  }

  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  const ok = await requireApprovedUser(user);
  if (!ok) return;
  const cart = getCart();
  if (!cart.length) {
    document.getElementById('checkout-content').innerHTML = `
      <div class="empty-state">
        <div class="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products before checking out.</p>
        <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Browse Products</a>
      </div>`;
    return;
  }
  renderCheckout(cart, user);
});

function renderCheckout(cart, user) {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;
  const content = document.getElementById('checkout-content');

  content.innerHTML = `
    <div class="checkout-layout">
      <!-- Left: Forms -->
      <div>
        <div class="form-card">
          <h3>📍 Delivery Address</h3>
          <div class="form-group">
            <label for="street">Street Address</label>
            <input type="text" id="street" placeholder="e.g. 12 Samora Machel Ave" required>
          </div>
          <div class="form-row-2" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="form-group">
              <label for="suburb">Suburb</label>
              <input type="text" id="suburb" placeholder="e.g. Avondale" required>
            </div>
            <div class="form-group">
              <label for="city">City</label>
              <select id="city">
                <option value="Harare">Harare</option>
                <option value="Bulawayo">Bulawayo</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="delivery-notes">Delivery Instructions (optional)</label>
            <textarea id="delivery-notes" placeholder="e.g. Blue gate, ring twice…"></textarea>
          </div>
        </div>

        <div class="form-card">
          <h3>💳 Payment Method</h3>
          <div class="payment-options">
            <label class="payment-option selected" id="opt-ecocash" onclick="selectPayment('ecocash')">
              <input type="radio" name="payment" value="ecocash" checked>
              <span class="payment-icon">📱</span>
              <span class="payment-name">EcoCash</span>
              <span class="payment-desc">Pay with your EcoCash wallet</span>
            </label>
            <label class="payment-option" id="opt-innbucks" onclick="selectPayment('innbucks')">
              <input type="radio" name="payment" value="innbucks">
              <span class="payment-icon">🏦</span>
              <span class="payment-name">InnBucks</span>
              <span class="payment-desc">Pay with InnBucks mobile money</span>
            </label>
          </div>
          <div id="payment-instructions" style="background:var(--green-50);border-radius:var(--radius-md);padding:.8rem 1rem;margin-top:.8rem;font-size:.85rem">
  <p id="ecocash-number">💰 Send payment to EcoCash: <strong>078 884 0432
  </strong> (SipSmart)</p>
  <p id="innbucks-number" style="display:none">💰 Send payment to InnBucks: <strong>078 884 0432</strong> (SipSmart)</p>
</div>
          <div class="form-group">
            <label for="pay-phone">Mobile Number (for payment)</label>
            <input type="tel" id="pay-phone" placeholder="+263 77 123 4567"
                   value="${user.phoneNumber || ''}" required>
            <span class="form-hint" id="payment-hint">You will receive a payment prompt on this number.</span>
          </div>
        </div>

        <div id="alert-co"></div>

        <button class="btn btn-primary btn-block btn-lg" id="place-order-btn" onclick="placeOrder()">
          🛒 Place Order — ${formatUSD(total)}
        </button>
        <p style="text-align:center;font-size:.78rem;color:var(--neutral-400);margin-top:.7rem">
          By placing your order you confirm you are 18+ and agree to our terms.
        </p>
      </div>

      <!-- Right: Summary -->
      <div class="checkout-summary">
        <h3>Order Summary</h3>
        ${cart.map(item => `
          <div class="co-item">
            <img src="${item.image_url || 'https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=200'}"
                 alt="${item.name}"
                 onerror="this.src='https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=200'">
            <div class="co-item-info">
              <p>${item.name}</p>
              <span>Qty: ${item.quantity}</span>
            </div>
            <span class="co-item-price">${formatUSD(item.price * item.quantity)}</span>
          </div>
        `).join('')}
        <div class="co-totals">
          <div class="co-row"><span>Subtotal</span><span>${formatUSD(subtotal)}</span></div>
          <div class="co-row"><span>Delivery</span><span>${formatUSD(DELIVERY_FEE)}</span></div>
          <div class="co-row grand"><span>Total</span><span class="val">${formatUSD(total)}</span></div>
        </div>
        <div class="summary-notes" style="background:var(--green-50);border-radius:var(--radius-md);padding:.8rem 1rem;font-size:.8rem;color:var(--green-700);margin-top:1rem">
          <p>📦 Estimated delivery: within 2 hours</p>
          <p>📍 Delivery available in Harare &amp; Bulawayo</p>
        </div>
      </div>
    </div>`;
}

function selectPayment(method) {
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  document.getElementById(`opt-${method}`).classList.add('selected');
  document.querySelector(`input[value="${method}"]`).checked = true;
  const hint = document.getElementById('payment-hint');
  if (hint) {
    hint.textContent = method === 'ecocash'
      ? 'You will receive an EcoCash payment prompt on this number.'
      : 'You will receive an InnBucks payment prompt on this number.';
  }
  document.getElementById('ecocash-number').style.display = method === 'ecocash' ? 'block' : 'none';
  document.getElementById('innbucks-number').style.display = method === 'innbucks' ? 'block' : 'none';
}


function showCoAlert(msg, type = 'error') {
  const box = document.getElementById('alert-co');
  if (box) {
    box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => box.innerHTML = '', 5000);
  }
}

async function placeOrder() {
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  const street = document.getElementById('street').value.trim();
  const suburb = document.getElementById('suburb').value.trim();
  const city   = document.getElementById('city').value;
  const payPhone = document.getElementById('pay-phone').value.trim();
  const payMethod = document.querySelector('input[name="payment"]:checked').value;

  if (!street || !suburb) return showCoAlert('Please enter your full delivery address.');
  if (!payPhone) return showCoAlert('Please enter your mobile number for payment.');

  const cart = getCart();
  if (!cart.length) return showCoAlert('Your cart is empty.');

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const btn = document.getElementById('place-order-btn');
  btn.textContent = 'Placing order…';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.uid,
        user_email: currentUser.email,
        items: cart.map(i => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image_url: i.image_url
        })),
        subtotal,
        delivery_fee: DELIVERY_FEE,
        total,
        delivery_address: { street, suburb, city },
        payment_method: payMethod,
        payment_phone: payPhone
      })
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    // Clear cart
    saveCart([]);
    // Store order id for tracking
    localStorage.setItem('sipsmart_last_order', json.data.id);

    showOrderSuccess(json.data);
  } catch (err) {
    showCoAlert(`Failed to place order: ${err.message}`);
  } finally {
    if (btn) {
      btn.textContent = `🛒 Place Order`;
      btn.disabled = false;
    }
  }
}

function showOrderSuccess(order) {
  document.getElementById('checkout-content').innerHTML = `
    <div class="order-success">
      <div class="success-icon">🎉</div>
      <h2>Order Placed!</h2>
      <p>Thank you for your order. We'll start preparing it right away.</p>
      <div class="order-id-chip">Order ID: ${order.id.slice(0, 8).toUpperCase()}</div>
      <p style="font-size:.85rem;color:var(--neutral-400);margin-bottom:1.5rem">
        Please complete payment via <strong>${order.payment_method === 'ecocash' ? 'EcoCash' : 'InnBucks'}</strong> 0788840432, then we'll confirm and begin processing your order.
      </p>
      <div style="display:flex;flex-direction:column;gap:.8rem">
        <a href="tracking.html?id=${order.id}" class="btn btn-primary">📦 Track My Order</a>
        <a href="products.html" class="btn btn-outline">Continue Shopping</a>
      </div>
    </div>`;
}
