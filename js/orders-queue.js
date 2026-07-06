// ============================================
// คิวออเดอร์: ออเดอร์ที่ลูกค้าสั่งเองผ่าน QR แล้วรอแม่ค้าทำ/นำส่ง
// ============================================

let orderQueuePollTimer = null;

async function loadOrderQueue() {
  const list = document.getElementById('order-queue-list');
  try {
    const orders = await api.getPendingOrders();
    renderOrderQueue(orders);
    document.getElementById('order-queue-badge').textContent = orders.length;
  } catch (err) {
    list.innerHTML = `<p class="error">โหลดคิวออเดอร์ไม่สำเร็จ: ${err.message}</p>`;
  }
}

function renderOrderQueue(orders) {
  const list = document.getElementById('order-queue-list');
  if (!orders.length) {
    list.innerHTML = '<p class="muted">ยังไม่มีออเดอร์รอทำ 🎉</p>';
    return;
  }

  list.innerHTML = orders
    .map((order) => {
      const itemLines = order.items
        .map((i) => `<div class="queue-item-line">${escapeHtml(i.name)} x${i.qty}</div>`)
        .join('');
      const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000));

      return `
        <div class="queue-card" data-id="${order.id}">
          <div class="queue-card-header">
            <span class="queue-table">โต๊ะ ${escapeHtml(order.table_no || '-')}</span>
            <span class="queue-time">${minutesAgo} นาทีที่แล้ว</span>
          </div>
          <p class="queue-customer">👤 ${escapeHtml(order.customer_name || 'ไม่ระบุชื่อ')}</p>
          <div class="queue-items">${itemLines}</div>
          <div class="queue-total">รวม ${Number(order.total).toFixed(2)} ฿</div>
          <button class="queue-confirm-btn">✅ ยืนยันนำส่ง</button>
        </div>
      `;
    })
    .join('');

  list.querySelectorAll('.queue-card').forEach((card) => {
    const id = card.dataset.id;
    card.querySelector('.queue-confirm-btn').addEventListener('click', async () => {
      const btn = card.querySelector('.queue-confirm-btn');
      btn.disabled = true;
      btn.textContent = 'กำลังบันทึก...';
      try {
        await api.markOrderServed(id);
        loadOrderQueue();
      } catch (err) {
        alert('อัปเดตไม่สำเร็จ: ' + err.message);
        btn.disabled = false;
        btn.textContent = '✅ ยืนยันนำส่ง';
      }
    });
  });
}

function startOrderQueuePolling() {
  stopOrderQueuePolling();
  orderQueuePollTimer = setInterval(loadOrderQueue, 8000);
}

function stopOrderQueuePolling() {
  if (orderQueuePollTimer) clearInterval(orderQueuePollTimer);
  orderQueuePollTimer = null;
}
