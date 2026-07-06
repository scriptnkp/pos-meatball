// ============================================
// ตัวสร้างข้อมูล QR พร้อมเพย์ (มาตรฐาน Thai QR Payment / EMVCo)
// รับเบอร์โทรศัพท์ หรือเลขบัตรประชาชน + จำนวนเงิน (ไม่ระบุจำนวนเงินได้)
// ============================================

function ppTLV(id, value) {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

function ppSanitizeTarget(raw) {
  const digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.length >= 13) {
    // เลขบัตรประชาชน / เลขนิติบุคคล (13 หลัก)
    return { type: '02', value: digits.slice(0, 13) };
  }
  // เบอร์โทรศัพท์ -> แปลงเป็นรูปแบบ 0066XXXXXXXXX
  let d = digits;
  if (d.startsWith('0')) d = d.slice(1);
  return { type: '01', value: '0066' + d.slice(-9) };
}

function ppCRC16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * สร้าง payload string สำหรับ QR พร้อมเพย์
 * @param {string} target เบอร์โทรศัพท์ หรือเลขบัตรประชาชน
 * @param {number|null} amount จำนวนเงิน (ใส่ null ถ้าให้ลูกค้ากรอกเอง)
 */
function generatePromptPayPayload(target, amount) {
  const { type, value } = ppSanitizeTarget(target);
  const merchantInfo = ppTLV('00', 'A000000677010111') + ppTLV(type, value);

  let payload =
    ppTLV('00', '01') +
    ppTLV('01', amount ? '12' : '11') +
    ppTLV('29', merchantInfo) +
    ppTLV('53', '764');

  if (amount) {
    payload += ppTLV('54', Number(amount).toFixed(2));
  }
  payload += ppTLV('58', 'TH');
  payload += '6304';

  return payload + ppCRC16(payload);
}
