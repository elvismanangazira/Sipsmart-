// ─── products.js ─────────────────────────────────────────────────────────

let allProducts = [];
let activeCategory = 'All';
let searchQuery = '';

// Read category from URL query param
(function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat) activeCategory = cat;
})();

// Update nav user link
auth.onAuthStateChanged(user => {
  const link = document.getElementById('nav-user-link');
  if (link) {
    if (user) {
      link.textContent = 'My Orders';
      link.href = 'tracking.html';
    } else {
      link.textContent = 'Sign In';
      link.href = 'login.html';
    }
  }

  const logoutLink = document.getElementById('nav-logout-link');
  if (logoutLink) {
    logoutLink.style.display = user ? 'inline-block' : 'none';
  }
});


async function fetchProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><p>Loading products…</p></div>`;

  try {
    const params = new URLSearchParams();
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (searchQuery) params.set('search', searchQuery);

    const res = await fetch(`${API_BASE}/products?${params}`);
    const json = await res.json();

    if (!json.success) throw new Error(json.error);
    allProducts = json.data;
    renderProducts(allProducts);
  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">⚠️</div>
        <h3>Could not load products</h3>
        <p>Make sure the server is running. ${err.message}</p>
        <button class="btn btn-secondary" style="margin-top:1rem" onclick="fetchProducts()">Retry</button>
      </div>`;
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  const info = document.getElementById('results-info');

  info.textContent = products.length
    ? `Showing ${products.length} product${products.length !== 1 ? 's' : ''}${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}`
    : '';

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">🔍</div>
        <h3>No products found</h3>
        <p>Try a different category or search term.</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.04}s">
      <div class="img-wrap">
        <img src="${p.image_url || 'https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=600'}"
             alt="${p.name}" loading="lazy"
             onerror="this.src='https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=600'">
        <span class="badge">${p.category}</span>
      </div>
      <div class="body">
        <h3>${p.name}</h3>
        <p class="desc">${p.description || ''}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.4rem;">
          <span class="price">${formatUSD(p.price)}</span>
          <span class="stock-label ${p.stock <= 5 ? (p.stock === 0 ? 'out' : 'low') : ''}">
            ${p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock'}
          </span>
        </div>
        <button
          class="btn btn-primary btn-sm add-btn"
          ${p.stock === 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}
          onclick="handleAddToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          ${p.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  `).join('');
}

function handleAddToCart(product) {
  const user = auth.currentUser;
  if (!user) {
    showToast('Please sign in to add items to cart', 'error');
    setTimeout(() => window.location.href = 'login.html', 1200);
    return;
  }
  addToCart(product);
}

// Category filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    activeCategory = this.dataset.cat;
    fetchProducts();
  });
});

// Set active filter button from URL param
document.querySelectorAll('.filter-btn').forEach(btn => {
  if (btn.dataset.cat === activeCategory) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
});

// Search with debounce
let searchTimer;
document.getElementById('search-input').addEventListener('input', function() {
  clearTimeout(searchTimer);
  searchQuery = this.value.trim();
  searchTimer = setTimeout(fetchProducts, 350);
});

// Initial load
document.addEventListener('DOMContentLoaded', fetchProducts);
