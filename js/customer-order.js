// ============================================
// หน้าสั่งอาหารของลูกค้า (สแกน QR จากโต๊ะ)
// ============================================

let ocTableNo = '';
let ocCustomerName = '';
let ocMenuItems = [];
let ocSettings = null;
let ocPendingPaymentMethod = null; // เลือกวิธีจ่ายก่อน submit

document.addEventListener('DOMContentLoaded', async () => {
  try {
    ocSettings = await api.getSettings();
    document.getElementById('oc-shop-name').textContent = ocSettings.shop_name;
  } catch (err) {
    console.error('โหลดการตั้งค่าไม่สำเร็จ', err);
  }

  document.getElementById('oc-start-btn').addEventListener('click', startOrdering);
  document.getElementById('oc-open-cart-btn').addEventListener('click', () => toggleOcCart(true));
  document.getElementById('oc-close-cart-btn').addEventListener('click', () => toggleOcCart(false));

  // ปุ่ม "ส่งออเดอร์" → เปิด modal เลือกวิธีจ่าย
  document.getElementById('oc-submit-order-btn').addEventListener('click', openPaymentModal);

  // ปุ่มในโมดัลชำระเงิน
  document.getElementById('oc-pay-qr').addEventListener('click', () => choosePayment('qr'));
  document.getElementById('oc-pay-cash').addEventListener('click', () => choosePayment('cash'));

  document.getElementById('oc-new-order-btn').addEventListener('click', resetOrderingFlow);
});

function ocEscapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- ขั้น 1: กรอกโต๊ะ + ชื่อ ----
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

// ---- ขั้น 2: เมนู ----
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
    .map(([category, list]) => `
      <div class="menu-category">
        <h3 class="category-title">${ocEscapeHtml(category)}</h3>
        <div class="menu-items">
          ${list.map((item) => `
            <button class="menu-card" data-id="${item.id}">
              <span class="menu-card-name">${ocEscapeHtml(item.name)}</span>
              <span class="menu-card-price">${Number(item.price).toFixed(0)} ฿</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

  grid.querySelectorAll('.menu-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = ocMenuItems.find((i) => i.id === btn.dataset.id);
      cart.add(item);
      btn.classList.add('flash');
      setTimeout(() => btn.classList.remove('flash'), 200);
    });
  });
}

// ---- ตะกร้า ----
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
  linesBox.innerHTML = cart.lines.map((l) => `
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
  `).join('');

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

// ---- Modal เลือกวิธีชำระเงิน ----
function openPaymentModal() {
  if (!cart.lines.length) return;
  document.getElementById('oc-pay-amount').textContent = cart.total().toFixed(2);
  document.getElementById('oc-payment-modal').classList.add('open');
}

async function choosePayment(method) {
  ocPendingPaymentMethod = method;
  document.getElementById('oc-payment-modal').classList.remove('open');
  await submitCustomerOrder(method);
}

// ---- ขั้น 3: ส่งออเดอร์ ----
async function submitCustomerOrder(paymentMethod) {
  const btn = document.getElementById('oc-submit-order-btn');
  btn.disabled = true;
  btn.textContent = 'กำลังส่ง...';

  try {
    const items = cart.lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty }));
    const total = cart.total();

    const order = await api.createOrder({
      items,
      total,
      paymentMethod,
      tableNo: ocTableNo,
      customerName: ocCustomerName,
      orderSource: 'customer',
      status: 'pending',
    });

    const settings = ocSettings || await api.getSettings();
    api.notifyTelegram({
      shopName: settings.shop_name,
      orderNo: order.order_no,
      items,
      total,
      orderSource: 'customer',
      tableNo: ocTableNo,
      customerName: ocCustomerName,
      paymentMethod,
    });

    // ขึ้นหน้า "สั่งแล้ว"
    document.getElementById('oc-done-table').textContent = ocTableNo;
    document.getElementById('oc-done-name').textContent = ocCustomerName;
    document.getElementById('oc-done-total').textContent = total.toFixed(2);

    const payLabel = document.getElementById('oc-done-payment-label');
    const qrBox = document.getElementById('oc-done-qr');

    if (paymentMethod === 'qr' && settings.promptpay_id) {
      payLabel.textContent = '📲 กรุณาสแกน QR พร้อมเพย์เพื่อชำระเงิน';
      payLabel.className = 'oc-done-payment-label pay-qr';
      qrBox.innerHTML = '';
      qrBox.classList.remove('hidden');
      const payload = generatePromptPayPayload(settings.promptpay_id, total);
      new QRCode(qrBox, { text: payload, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
    } else if (paymentMethod === 'qr' && !settings.promptpay_id) {
      // ตั้งค่าพร้อมเพย์ยังไม่ได้ใส่ใน Settings → fallback เงินสด
      payLabel.textContent = '💵 ชำระเงินสดที่หน้าร้าน';
      payLabel.className = 'oc-done-payment-label pay-cash';
      qrBox.classList.add('hidden');
    } else {
      payLabel.textContent = '💵 ชำระเงินสดที่หน้าร้าน';
      payLabel.className = 'oc-done-payment-label pay-cash';
      qrBox.classList.add('hidden');
    }

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
  document.getElementById('oc-done-qr').classList.add('hidden');
  document.getElementById('oc-step-menu').classList.remove('hidden');
  document.getElementById('oc-cart-bar').classList.remove('hidden');
}
