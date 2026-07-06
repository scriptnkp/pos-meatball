// ============================================
// เริ่มต้นแอป + สลับหน้า (POS / Dashboard / Settings)
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  bindNav();
  bindCartUI();
  bindCheckoutUI();
  bindReceiptUI();
  bindSettingsUI();
  bindDashboardUI();

  try {
    currentSettings = await api.getSettings();
    document.getElementById('shop-name-header').textContent = currentSettings.shop_name;
  } catch (err) {
    console.error('โหลดการตั้งค่าไม่สำเร็จ — ตรวจสอบว่าใส่ SUPABASE_URL/ANON_KEY ใน js/config.js แล้วหรือยัง', err);
    document.getElementById('shop-name-header').textContent = 'ร้านลูกชิ้น (ยังไม่ได้เชื่อมต่อฐานข้อมูล)';
  }

  showView('pos');
  renderCart();
  loadOrderQueue();
  startOrderQueuePolling();
});

function bindNav() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });
}

function showView(view) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));

  if (view === 'pos') loadPosView();
  if (view === 'orders') loadOrderQueue();
  if (view === 'dashboard') loadDashboard();
  if (view === 'settings') loadSettingsView();
}

function bindCartUI() {
  document.getElementById('cart-fab').addEventListener('click', () => toggleCartDrawer(true));
  document.getElementById('close-cart-btn').addEventListener('click', () => toggleCartDrawer(false));
  document.getElementById('open-checkout-btn').addEventListener('click', openCheckoutModal);
}

function bindCheckoutUI() {
  document.getElementById('close-checkout-btn').addEventListener('click', closeCheckoutModal);
  document.getElementById('confirm-checkout-btn').addEventListener('click', confirmCheckout);
}

function bindReceiptUI() {
  document.getElementById('close-receipt-btn').addEventListener('click', closeReceiptModal);
  document.getElementById('print-receipt-btn').addEventListener('click', printReceipt);
}

function bindSettingsUI() {
  document.getElementById('settings-pin-submit').addEventListener('click', checkSettingsPin);
  document.getElementById('settings-pin-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkSettingsPin();
  });
  document.getElementById('save-shop-settings-btn').addEventListener('click', saveShopSettings);
  document.getElementById('add-menu-item-btn').addEventListener('click', addNewMenuItem);
}

function bindDashboardUI() {
  document.querySelectorAll('.range-btn').forEach((btn) => {
    btn.addEventListener('click', () => setDashboardRange(btn.dataset.range));
  });
}
