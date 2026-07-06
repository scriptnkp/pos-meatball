// ============================================
// หน้า Dashboard: สรุปยอดขาย/รายได้
// ============================================

let dashboardRange = 'today';

function rangeToDates(range) {
  const now = new Date();
  const start = new Date(now);
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === 'month') {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }
  return { from: start.toISOString(), to: now.toISOString() };
}

async function loadDashboard() {
  const { from, to } = rangeToDates(dashboardRange);
  const summaryEl = document.getElementById('dashboard-summary');
  summaryEl.innerHTML = '<p class="muted">กำลังโหลดข้อมูล...</p>';

  try {
    const orders = await api.getOrders({ from, to, status: 'served' });
    renderSummaryCards(orders);
    renderTopItems(orders);
    renderRevenueChart(orders);
  } catch (err) {
    summaryEl.innerHTML = `<p class="error">โหลดข้อมูลไม่สำเร็จ: ${err.message}</p>`;
  }
}

function renderSummaryCards(orders) {
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = orders.length;
  const avg = totalOrders ? totalRevenue / totalOrders : 0;

  document.getElementById('dashboard-summary').innerHTML = `
    <div class="stat-card">
      <span class="stat-label">รายได้รวม</span>
      <span class="stat-value">${totalRevenue.toFixed(2)} ฿</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">จำนวนออเดอร์</span>
      <span class="stat-value">${totalOrders}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">เฉลี่ย/ออเดอร์</span>
      <span class="stat-value">${avg.toFixed(2)} ฿</span>
    </div>
  `;
}

function renderTopItems(orders) {
  const counts = {};
  for (const order of orders) {
    for (const item of order.items) {
      if (!counts[item.name]) counts[item.name] = { qty: 0, revenue: 0 };
      counts[item.name].qty += item.qty;
      counts[item.name].revenue += item.price * item.qty;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

  const el = document.getElementById('dashboard-top-items');
  if (!sorted.length) {
    el.innerHTML = '<p class="muted">ยังไม่มีข้อมูลในช่วงนี้</p>';
    return;
  }
  el.innerHTML = sorted
    .map(
      ([name, stat], idx) => `
      <div class="top-item-row">
        <span class="top-item-rank">${idx + 1}</span>
        <span class="top-item-name">${escapeHtml(name)}</span>
        <span class="top-item-qty">${stat.qty} ชิ้น</span>
        <span class="top-item-revenue">${stat.revenue.toFixed(2)} ฿</span>
      </div>
    `
    )
    .join('');
}

function renderRevenueChart(orders) {
  const canvas = document.getElementById('revenue-chart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const byDay = {};
  for (const order of orders) {
    const day = new Date(order.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
    byDay[day] = (byDay[day] || 0) + Number(order.total);
  }
  const days = Object.keys(byDay);
  if (!days.length) return;

  const max = Math.max(...Object.values(byDay));
  const barWidth = canvas.width / days.length;
  const chartHeight = canvas.height - 30;

  days.forEach((day, i) => {
    const value = byDay[day];
    const barHeight = max > 0 ? (value / max) * chartHeight : 0;
    const x = i * barWidth + barWidth * 0.2;
    const w = barWidth * 0.6;
    const y = chartHeight - barHeight;

    ctx.fillStyle = '#D84315';
    ctx.fillRect(x, y, w, barHeight);

    ctx.fillStyle = '#3E2723';
    ctx.font = '11px "Noto Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(day, x + w / 2, chartHeight + 16);
  });
}

function setDashboardRange(range) {
  dashboardRange = range;
  document.querySelectorAll('.range-btn').forEach((b) => b.classList.toggle('active', b.dataset.range === range));
  loadDashboard();
}
