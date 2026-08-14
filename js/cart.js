// ─── cart.js ─────────────────────────────────────────────────────────────

const DELIVERY_FEE = 2.00;

auth.onAuthStateChanged(user => {
  const link = document.getElementById('nav-user-link');
  if (link) {
    link.textContent = user ? 'My Orders' : 'Sign In';
    link.href = user ? 'tracking.html' : 'login.html';
  }
  renderCart();
});

function renderCart() {
  const cart = getCart();
  const content = document.getElementById('cart-content');

  if (!cart.length) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started.</p>
        <a href="products.html" class="btn btn-primary" style="margin-top:1.2rem">Browse Products</a>
      </div>`;
    return;
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  content.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items-wrap">
        <div class="cart-items-header">
          <h3>Items (${cart.reduce((s,i) => s + i.quantity, 0)})</h3>
          <button class="clear-cart-btn" onclick="clearAllCart()">Remove all</button>
        </div>
        ${cart.map(item => `
          <div class="cart-item" id="item-${item.id}">
            <img src="${item.image_url || 'https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=600'}"
                 alt="${item.name}"
                 onerror="this.src='https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=600'">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <span class="cat-tag">${item.category}</span>
              <p class="item-price">${formatUSD(item.price)} each</p>
            </div>
            <div class="cart-item-controls">
              <span class="item-subtotal">${formatUSD(item.price * item.quantity)}</span>
              <div class="qty-controls">
                <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
              </div>
              <button class="remove-btn" onclick="removeItem('${item.id}')">✕ Remove</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="order-summary">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal</span><span>${formatUSD(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>Delivery Fee</span><span>${formatUSD(DELIVERY_FEE)}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span><span class="val">${formatUSD(total)}</span>
        </div>
        <div class="summary-notes">
          <p>📦 Delivery within 2 hours</p>
          <p>📍 Harare &amp; Bulawayo only</p>
        </div>
        <a href="checkout.html" class="btn btn-primary btn-block btn-lg">Proceed to Checkout →</a>
        <a href="products.html" class="btn btn-outline btn-block" style="margin-top:.8rem">← Continue Shopping</a>
        <p style="text-align:center;font-size:.75rem;color:var(--neutral-400);margin-top:1rem">
          ⚠️ Drink responsibly. 18+ only.
        </p>
      </div>
    </div>`;
}

function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    return removeItem(productId);
  }
  saveCart(cart);
  renderCart();
}

function removeItem(productId) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
  showToast('Item removed from cart');
  renderCart();
}

function clearAllCart() {
  if (!confirm('Remove all items from your cart?')) return;
  saveCart([]);
  renderCart();
}
