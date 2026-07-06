// ============================================
// ขั้นตอนชำระเงิน
// ============================================

function openCheckoutModal() {
  if (!cart.lines.length) return;
  document.getElementById('checkout-total').textContent = cart.total().toFixed(2);
  document.getElementById('checkout-modal').classList.add('open');
  document.querySelectorAll('input[name="payment-method"]')[0].checked = true;
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal').classList.remove('open');
}

async function confirmCheckout() {
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const confirmBtn = document.getElementById('confirm-checkout-btn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'กำลังบันทึก...';

  try {
    const items = cart.lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty }));
    const total = cart.total();

    const order = await api.createOrder({ items, total, paymentMethod, orderSource: 'counter', status: 'served' });

    api.notifyTelegram({
      shopName: currentSettings.shop_name,
      orderNo: order.order_no,
      items,
      total,
      paymentMethod,
      orderSource: 'counter',
    });

    closeCheckoutModal();
    cart.clear();
    toggleCartDrawer(false);
    showReceipt(order);
  } catch (err) {
    alert('บันทึกออเดอร์ไม่สำเร็จ: ' + err.message);
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'ยืนยันรับเงิน';
  }
}
