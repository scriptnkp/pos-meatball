// ============================================
// หน้าตั้งค่า: ล็อกด้วยรหัส, แก้ชื่อร้าน/พร้อมเพย์/รหัส, จัดการเมนู
// ============================================

let currentSettings = null;
let settingsUnlocked = false;

async function loadSettingsView() {
  currentSettings = await api.getSettings();
  settingsUnlocked = false;
  document.getElementById('settings-pin-gate').classList.remove('hidden');
  document.getElementById('settings-content').classList.add('hidden');
  document.getElementById('settings-pin-input').value = '';
}

function checkSettingsPin() {
  const input = document.getElementById('settings-pin-input').value.trim();
  if (input === currentSettings.pin_code) {
    settingsUnlocked = true;
    document.getElementById('settings-pin-gate').classList.add('hidden');
    document.getElementById('settings-content').classList.remove('hidden');
    fillSettingsForm();
    loadMenuManager();
    renderOrderPageQR();
  } else {
    document.getElementById('settings-pin-error').textContent = 'รหัสไม่ถูกต้อง';
  }
}

function renderOrderPageQR() {
  const url = `${window.location.origin}/order.html`;
  document.getElementById('order-page-url').textContent = url;
  const qrBox = document.getElementById('order-page-qr');
  qrBox.innerHTML = '';
  new QRCode(qrBox, { text: url, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
}

function fillSettingsForm() {
  document.getElementById('setting-shop-name').value = currentSettings.shop_name || '';
  document.getElementById('setting-promptpay-id').value = currentSettings.promptpay_id || '';
  document.getElementById('setting-pin-code').value = currentSettings.pin_code || '';
}

async function saveShopSettings() {
  const shop_name = document.getElementById('setting-shop-name').value.trim();
  const promptpay_id = document.getElementById('setting-promptpay-id').value.trim();
  const pin_code = document.getElementById('setting-pin-code').value.trim();

  if (!shop_name || !pin_code) {
    alert('กรุณากรอกชื่อร้านและรหัสผ่านให้ครบ');
    return;
  }

  try {
    await api.updateSettings({ shop_name, promptpay_id, pin_code });
    currentSettings = await api.getSettings();
    document.getElementById('shop-name-header').textContent = currentSettings.shop_name;
    alert('บันทึกการตั้งค่าแล้ว');
  } catch (err) {
    alert('บันทึกไม่สำเร็จ: ' + err.message);
  }
}

async function loadMenuManager() {
  const list = document.getElementById('menu-manager-list');
  list.innerHTML = '<p class="muted">กำลังโหลด...</p>';
  try {
    const items = await api.getMenuItems({ onlyActive: false });
    renderMenuManager(items);
  } catch (err) {
    list.innerHTML = `<p class="error">โหลดเมนูไม่สำเร็จ: ${err.message}</p>`;
  }
}

function renderMenuManager(items) {
  const list = document.getElementById('menu-manager-list');
  if (!items.length) {
    list.innerHTML = '<p class="muted">ยังไม่มีเมนู</p>';
    return;
  }
  list.innerHTML = items
    .map(
      (item) => `
    <div class="menu-manager-row" data-id="${item.id}">
      <input class="mm-name" value="${escapeHtml(item.name)}" />
      <input class="mm-category" value="${escapeHtml(item.category)}" />
      <input class="mm-price" type="number" step="0.01" value="${item.price}" />
      <label class="mm-active">
        <input type="checkbox" class="mm-active-cb" ${item.is_active ? 'checked' : ''} /> ขาย
      </label>
      <button class="mm-save">บันทึก</button>
      <button class="mm-delete">ลบ</button>
    </div>
  `
    )
    .join('');

  list.querySelectorAll('.menu-manager-row').forEach((row) => {
    const id = row.dataset.id;
    row.querySelector('.mm-save').addEventListener('click', async () => {
      try {
        await api.updateMenuItem(id, {
          name: row.querySelector('.mm-name').value.trim(),
          category: row.querySelector('.mm-category').value.trim() || 'ทั่วไป',
          price: Number(row.querySelector('.mm-price').value),
          is_active: row.querySelector('.mm-active-cb').checked,
        });
        loadMenuManager();
      } catch (err) {
        alert('บันทึกไม่สำเร็จ: ' + err.message);
      }
    });
    row.querySelector('.mm-delete').addEventListener('click', async () => {
      if (!confirm('ลบเมนูนี้?')) return;
      try {
        await api.deleteMenuItem(id);
        loadMenuManager();
      } catch (err) {
        alert('ลบไม่สำเร็จ: ' + err.message);
      }
    });
  });
}

async function addNewMenuItem() {
  const name = document.getElementById('new-menu-name').value.trim();
  const category = document.getElementById('new-menu-category').value.trim() || 'ทั่วไป';
  const price = Number(document.getElementById('new-menu-price').value);

  if (!name || !price) {
    alert('กรุณากรอกชื่อเมนูและราคา');
    return;
  }

  try {
    await api.addMenuItem({ name, category, price, is_active: true, sort_order: 999 });
    document.getElementById('new-menu-name').value = '';
    document.getElementById('new-menu-category').value = '';
    document.getElementById('new-menu-price').value = '';
    loadMenuManager();
  } catch (err) {
    alert('เพิ่มเมนูไม่สำเร็จ: ' + err.message);
  }
}
