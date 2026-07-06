// Vercel Serverless Function
// Endpoint: POST /api/notify
// ส่งข้อความแจ้งเตือนออเดอร์ใหม่เข้า Telegram
// ต้องตั้งค่า Environment Variables ใน Vercel: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shopName, orderNo, items, total, paymentMethod, orderSource, tableNo, customerName } = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID ใน Vercel' });
    }

    const itemLines = (items || [])
      .map((i) => `• ${i.name} x${i.qty} = ${(i.price * i.qty).toFixed(2)} บาท`)
      .join('\n');

    const isCustomerOrder = orderSource === 'customer';
    const headerLine = isCustomerOrder
      ? `🔔 ลูกค้าสั่งเข้ามาใหม่ - ${shopName || 'ร้านลูกชิ้น'}`
      : `🛒 ออเดอร์ใหม่ - ${shopName || 'ร้านลูกชิ้น'}`;
    const tableLine = isCustomerOrder ? `โต๊ะ: ${tableNo || '-'}  ชื่อผู้สั่ง: ${customerName || '-'}\n` : '';
    const paymentLine = isCustomerOrder
      ? `ชำระโดย: ${paymentMethod === 'qr' ? 'โอน QR พร้อมเพย์' : 'จ่ายหน้าร้าน (เงินสด)'}`
      : `ชำระโดย: ${paymentMethod === 'qr' ? 'QR พร้อมเพย์' : 'เงินสด'}`;

    const text =
      `${headerLine}\n` +
      `เลขที่: #${String(orderNo).padStart(4, '0')}\n` +
      tableLine +
      `${itemLines}\n` +
      `รวม: ${Number(total).toFixed(2)} บาท\n` +
      paymentLine;

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return res.status(502).json({ error: 'ส่ง Telegram ไม่สำเร็จ', detail: tgData });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
