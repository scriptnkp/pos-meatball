// ============================================
// ฟังก์ชันเรียกข้อมูลจาก Supabase + แจ้งเตือน Telegram
// ============================================

const api = {
  async getSettings() {
    const { data, error } = await supabaseClient.from('settings').select('*').eq('id', 1).single();
    if (error) throw error;
    return data;
  },

  async updateSettings(fields) {
    const { error } = await supabaseClient.from('settings').update(fields).eq('id', 1);
    if (error) throw error;
  },

  async getMenuItems({ onlyActive = true } = {}) {
    let query = supabaseClient.from('menu_items').select('*').order('sort_order', { ascending: true });
    if (onlyActive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async addMenuItem(item) {
    const { error } = await supabaseClient.from('menu_items').insert(item);
    if (error) throw error;
  },

  async updateMenuItem(id, fields) {
    const { error } = await supabaseClient.from('menu_items').update(fields).eq('id', id);
    if (error) throw error;
  },

  async deleteMenuItem(id) {
    const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
    if (error) throw error;
  },

  async createOrder({ items, total, paymentMethod, tableNo = null, customerName = null, orderSource = 'counter', status = 'served' }) {
    const { data, error } = await supabaseClient
      .from('orders')
      .insert({
        items,
        total,
        payment_method: paymentMethod,
        table_no: tableNo,
        customer_name: customerName,
        order_source: orderSource,
        status,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getOrders({ from, to, status } = {}) {
    let query = supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getPendingOrders() {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async markOrderServed(id) {
    const { error } = await supabaseClient.from('orders').update({ status: 'served' }).eq('id', id);
    if (error) throw error;
  },

  async notifyTelegram(payload) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // การแจ้งเตือนล้มเหลวไม่ควรทำให้ขายของไม่ได้ แค่บันทึก log
      console.warn('Telegram notify failed:', err);
    }
  },
};
