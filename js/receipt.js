// ============================================
// ใบเสร็จ + QR พร้อมเพย์ (ขนาดกระดาษ 80mm)
// ============================================

function showReceipt(order) {
  const box = document.getElementById('receipt-content');
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const itemsHtml = order.items
    .map(
      (i) => `
      <div class="receipt-item">
        <span>${escapeHtml(i.name)} x${i.qty}</span>
        <span>${(i.price * i.qty).toFixed(2)}</span>
      </div>
    `
    )
    .join('');

  box.innerHTML = `
    <div class="receipt-header">
      <h2>${escapeHtml(currentSettings.shop_name)}</h2>
      <p>เลขที่ #${String(order.order_no).padStart(4, '0')}</p>
      <p>${dateStr} ${timeStr} น.</p>
    </div>
    <div class="receipt-divider"></div>
    <div class="receipt-items">${itemsHtml}</div>
    <div class="receipt-divider"></div>
    <div class="receipt-total">
      <span>รวมทั้งสิ้น</span>
      <span>${Number(order.total).toFixed(2)} บาท</span>
    </div>
    <p class="receipt-payment">ชำระโดย: ${order.payment_method === 'qr' ? 'QR พร้อมเพย์' : 'เงินสด'}</p>
    ${order.payment_method === 'qr' ? `<div class="receipt-qr" id="receipt-qr"></div>` : ''}
    <p class="receipt-thanks">ขอบคุณที่ใช้บริการครับ/ค่ะ</p>
  `;

  if (order.payment_method === 'qr' && currentSettings.promptpay_id) {
    const payload = generatePromptPayPayload(currentSettings.promptpay_id, order.total);
    new QRCode(document.getElementById('receipt-qr'), {
      text: payload,
      width: 160,
      height: 160,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  document.getElementById('receipt-modal').classList.add('open');
}

function closeReceiptModal() {
  document.getElementById('receipt-modal').classList.remove('open');
}

function printReceipt() {
  window.print();
}
