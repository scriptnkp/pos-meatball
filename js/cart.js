// ============================================
// จัดการตะกร้าสินค้า (state อยู่ในความจำ ไม่ persist เพราะไม่ต้องสต๊อก)
// ============================================

const cart = {
  lines: [], // [{ id, name, price, qty }]

  add(item) {
    const existing = this.lines.find((l) => l.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.lines.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    }
    this._onChange();
  },

  setQty(id, qty) {
    const line = this.lines.find((l) => l.id === id);
    if (!line) return;
    if (qty <= 0) {
      this.lines = this.lines.filter((l) => l.id !== id);
    } else {
      line.qty = qty;
    }
    this._onChange();
  },

  remove(id) {
    this.lines = this.lines.filter((l) => l.id !== id);
    this._onChange();
  },

  clear() {
    this.lines = [];
    this._onChange();
  },

  total() {
    return this.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  },

  count() {
    return this.lines.reduce((sum, l) => sum + l.qty, 0);
  },

  _onChange() {
    if (typeof onCartChange === 'function') onCartChange();
  },
};
