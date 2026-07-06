// ============================================
// หน้า POS: แสดงเมนู + ตะกร้า
// ============================================

let allMenuItems = [];

async function loadPosView() {
  const grid = document.getElementById('menu-grid');
  grid.innerHTML = '<p class="muted">กำลังโหลดเมนู...</p>';
  try {
    allMenuItems = await api.getMenuItems({ onlyActive: true });
    renderMenuGrid(allMenuItems);
  } catch (err) {
    grid.innerHTML = `<p class="error">โหลดเมนูไม่สำเร็จ: ${err.message}</p>`;
  }
}

function renderMenuGrid(items) {
  const grid = document.getElementById('menu-grid');
  if (!items.length) {
    grid.innerHTML = '<p class="muted">ยังไม่มีเมนู — ไปเพิ่มได้ที่หน้าตั้งค่า</p>';
    return;
  }

  const byCategory = {};
  for (const item of items) {
    (byCategory[item.category] = byCategory[item.category] || []).push(item);
  }

  grid.innerHTML = Object.entries(byCategory)
    .map(
      ([category, list]) => `
      <div class="menu-category">
        <h3 class="category-title">${escapeHtml(category)}</h3>
        <div class="menu-items">
          ${list
            .map(
              (item) => `
            <button class="menu-card" data-id="${item.id}">
              <span class="menu-card-name">${escapeHtml(item.name)}</span>
              <span class="menu-card-price">${Number(item.price).toFixed(0)} ฿</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `
    )
    .join('');

  grid.querySelectorAll('.menu-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = allMenuItems.find((i) => i.id === btn.dataset.id);
      cart.add(item);
      btn.classList.add('flash');
      setTimeout(() => btn.classList.remove('flash'), 200);
    });
  });
}

function onCartChange() {
  renderCart();
}

function renderCart() {
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');
  const cartLines = document.getElementById('cart-lines');
  const checkoutBtn = document.getElementById('open-checkout-btn');

  cartCount.textContent = cart.count();
  cartTotal.textContent = cart.total().toFixed(2);
  checkoutBtn.disabled = cart.lines.length === 0;

  if (!cart.lines.length) {
    cartLines.innerHTML = '<p class="muted">ยังไม่มีรายการในตะกร้า</p>';
    return;
  }

  cartLines.innerHTML = cart.lines
    .map(
      (l) => `
    <div class="cart-line" data-id="${l.id}">
      <div class="cart-line-info">
        <span class="cart-line-name">${escapeHtml(l.name)}</span>
        <span class="cart-line-price">${(l.price * l.qty).toFixed(2)} ฿</span>
      </div>
      <div class="cart-line-qty">
        <button class="qty-btn" data-action="dec">−</button>
        <span>${l.qty}</span>
        <button class="qty-btn" data-action="inc">+</button>
      </div>
    </div>
  `
    )
    .join('');

  cartLines.querySelectorAll('.cart-line').forEach((row) => {
    const id = row.dataset.id;
    const line = cart.lines.find((l) => l.id === id);
    row.querySelector('[data-action="inc"]').addEventListener('click', () => cart.setQty(id, line.qty + 1));
    row.querySelector('[data-action="dec"]').addEventListener('click', () => cart.setQty(id, line.qty - 1));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toggleCartDrawer(open) {
  document.getElementById('cart-drawer').classList.toggle('open', open);
}
