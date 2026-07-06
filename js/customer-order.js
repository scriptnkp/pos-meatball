// ============================================
// หน้าสั่งอาหารของลูกค้า (สแกน QR จากโต๊ะ)
// ============================================

let ocTableNo = '';
let ocCustomerName = '';
let ocMenuItems = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = await api.getSettings();
    document.getElementById('oc-shop-name').textContent = settings.shop_name;
  } catch (err) {
    console.error('โหลดการตั้งค่าไม่สำเร็จ', err);
  }

  document.getElementById('oc-start-btn').addEventListener('click', startOrdering);
  document.getElementById('oc-open-cart-btn').addEventListener('click', () => toggleOcCart(true));
  document.getElementById('oc-close-cart-btn').addEventListener('click', () => toggleOcCart(false));
  document.getElementById('oc-submit-order-btn').addEventListener('click', submitCustomerOrder);
  document.getElementById('oc-new-order-btn').addEventListener('click', resetOrderingFlow);
});

function ocEscapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function startOrdering() {
  const tableNo = document.getElementById('oc-table-no').value.trim();
  const customerName = document.getElementById('oc-customer-name').value.trim();

  if (!tableNo || !customerName) {
    alert('กรุณากรอกเลขโต๊ะและชื่อผู้สั่งให้ครบ');
    return;
  }

  ocTableNo = tableNo;
  ocCustomerName = customerName;

  document.getElementById('oc-info-table').textContent = tableNo;
  document.getElementById('oc-info-name').textContent = customerName;

  document.getElementById('oc-step-info').classList.add('hidden');
  document.getElementById('oc-step-menu').classList.remove('hidden');
  document.getElementById('oc-cart-bar').classList.remove('hidden');

  await loadOcMenu();
}

async function loadOcMenu() {
  const grid = document.getElementById('oc-menu-grid');
  grid.innerHTML = '<p class="muted">กำลังโหลดเมนู...</p>';
  try {
    ocMenuItems = await api.getMenuItems({ onlyActive: true });
    renderOcMenu(ocMenuItems);
  } catch (err) {
    grid.innerHTML = `<p class="error">โหลดเมนูไม่สำเร็จ: ${err.message}</p>`;
  }
}

function renderOcMenu(items) {
  const grid = document.getElementById('oc-menu-grid');
  if (!items.length) {
    grid.innerHTML = '<p class="muted">ยังไม่มีเมนูให้สั่ง</p>';
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
        <h3 class="category-title">${ocEscapeHtml(category)}</h3>
        <div class="menu-items">
          ${list
            .map(
              (item) => `
            <button class="menu-card" data-id="${item.id}">
              <span class="menu-card-name">${ocEscapeHtml(item.name)}</span>
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
      const item = ocMenuItems.find((i) => i.id === btn.dataset.id);
      cart.add(item);
      btn.classList.add('flash');
      setTimeout(() => btn.classList.remove('flash'), 200);
    });
  });
}

function onCartChange() {
  const count = cart.count();
  const total = cart.total();

  document.getElementById('oc-cart-count').textContent = count;
  document.getElementById('oc-cart-total').textContent = total.toFixed(2);
  document.getElementById('oc-drawer-total').textContent = total.toFixed(2);
  document.getElementById('oc-submit-order-btn').disabled = count === 0;

  const linesBox = document.getElementById('oc-cart-lines');
  if (!cart.lines.length) {
    linesBox.innerHTML = '<p class="muted">ยังไม่มีรายการในตะกร้า</p>';
    return;
  }

  linesBox.innerHTML = cart.lines
    .map(
      (l) => `
    <div class="cart-line" data-id="${l.id}">
      <div class="cart-line-info">
        <span class="cart-line-name">${ocEscapeHtml(l.name)}</span>
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

  linesBox.querySelectorAll('.cart-line').forEach((row) => {
    const id = row.dataset.id;
    const line = cart.lines.find((l) => l.id === id);
    row.querySelector('[data-action="inc"]').addEventListener('click', () => cart.setQty(id, line.qty + 1));
    row.querySelector('[data-action="dec"]').addEventListener('click', () => cart.setQty(id, line.qty - 1));
  });
}

function toggleOcCart(open) {
  document.getElementById('oc-cart-drawer').classList.toggle('open', open);
}

async function submitCustomerOrder() {
  if (!cart.lines.length) return;
  const btn = document.getElementById('oc-submit-order-btn');
  btn.disabled = true;
  btn.textContent = 'กำลังส่ง...';

  try {
    const items = cart.lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty }));
    const total = cart.total();

    const order = await api.createOrder({
      items,
      total,
      paymentMethod: 'cash',
      tableNo: ocTableNo,
      customerName: ocCustomerName,
      orderSource: 'customer',
      status: 'pending',
    });

    const settings = await api.getSettings();
    api.notifyTelegram({
      shopName: settings.shop_name,
      orderNo: order.order_no,
      items,
      total,
      orderSource: 'customer',
      tableNo: ocTableNo,
      customerName: ocCustomerName,
    });

    document.getElementById('oc-done-table').textContent = ocTableNo;
    document.getElementById('oc-done-name').textContent = ocCustomerName;
    document.getElementById('oc-done-total').textContent = total.toFixed(2);

    cart.clear();
    toggleOcCart(false);
    document.getElementById('oc-cart-bar').classList.add('hidden');
    document.getElementById('oc-step-menu').classList.add('hidden');
    document.getElementById('oc-step-done').classList.remove('hidden');
  } catch (err) {
    alert('ส่งออเดอร์ไม่สำเร็จ: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'ส่งออเดอร์';
  }
}

function resetOrderingFlow() {
  document.getElementById('oc-step-done').classList.add('hidden');
  document.getElementById('oc-step-menu').classList.remove('hidden');
  document.getElementById('oc-cart-bar').classList.remove('hidden');
}
