import { supabase } from '../lib/supabaseClient';
import { productFromRow, productToRow, stockFromRows } from '../lib/catalog';
import { OPEN_STATUSES } from '../lib/orderStatus';
import { unwrap, toAppError } from './errors';
import {
  tenantFromRow, tenantToRow, orderFromRow, invoiceFromRow, dailyCloseFromRow, stockEventFromRow,
  customerFromRow, staffFromRow, tableFromRow, sequenceFromRow, sequenceToRow
} from './mappers';

let channelSeq = 0;
function subscribe(name, tables, tenantId, handler) {
  const filter = `tenant_id=eq.${tenantId}`;
  let channel = supabase.channel(`${name}:${tenantId}:${++channelSeq}`);
  for (const table of tables) {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter }, handler);
  }
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export const supabaseApi = {
  mode: 'supabase',

  // ------------------------------------------------------------------ Carta (público)
  async getTenantBySlug(slug) {
    const row = unwrap(await supabase.from('tenants').select('*').eq('slug', slug).maybeSingle());
    return row ? tenantFromRow(row) : null;
  },

  async getMenu(tenantId) {
    const [cats, prods, stock] = await Promise.all([
      supabase.from('categories').select('*').eq('tenant_id', tenantId).order('sort_order'),
      supabase.from('products').select('*').eq('tenant_id', tenantId).order('sort_order'),
      supabase.from('ingredients_stock').select('*').eq('tenant_id', tenantId).eq('is_sold_out', true)
    ]);
    const categories = unwrap(cats).map((c) => ({ id: c.id, name: c.name, sortOrder: c.sort_order }));
    const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    return {
      categories,
      products: unwrap(prods).map((r) => productFromRow(r, names[r.category_id])),
      ingredientsStock: stockFromRows(unwrap(stock))
    };
  },

  subscribeMenu(tenantId, onChange) {
    return subscribe('menu', ['products', 'categories', 'ingredients_stock'], tenantId, onChange);
  },

  async resolveTable(slug, token) {
    const rows = unwrap(await supabase.rpc('resolve_table', { p_slug: slug, p_token: token }));
    const row = rows?.[0];
    return row ? { id: row.table_id, label: row.label } : null;
  },

  async createOrder({ slug, tableToken, items, includeTip }) {
    return unwrap(
      await supabase.rpc('create_order', {
        p_slug: slug,
        p_table_token: tableToken,
        p_items: items,
        p_include_tip: includeTip
      })
    );
  },

  // ------------------------------------------------------------------ Sesión del personal
  async listStaffForLogin(slug) {
    const rows = unwrap(await supabase.rpc('list_staff_for_login', { p_slug: slug }));
    return rows.map((s) => ({ id: s.id, displayName: s.display_name, role: s.role }));
  },

  async loginStaff({ slug, staffId, pin }) {
    const { data, error } = await supabase.functions.invoke('staff-login', { body: { slug, staffId, pin } });
    if (error) {
      let message = 'No se pudo iniciar sesión';
      try {
        const body = await error.context?.json();
        if (body?.error) message = body.error;
      } catch {
        // respuesta sin JSON
      }
      throw new Error(message);
    }
    unwrap(
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })
    );
    return data.staff;
  },

  async logoutStaff() {
    await supabase.auth.signOut();
  },

  async getCurrentStaff() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    const { data: me, error } = await supabase.rpc('whoami');
    if (error) return null;
    return me;
  },

  onAuthChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(callback, 0);
    });
    return () => data.subscription.unsubscribe();
  },

  // ------------------------------------------------------------------ Cocina
  async listOpenOrders(tenantId) {
    const rows = unwrap(
      await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('tenant_id', tenantId)
        .in('status', OPEN_STATUSES)
        .order('created_at', { ascending: true })
        .limit(200)
    );
    return rows.map(orderFromRow);
  },

  subscribeOrders(tenantId, { onInsert, onChange }) {
    return subscribe('orders', ['orders'], tenantId, (payload) => {
      if (payload.eventType === 'INSERT') onInsert?.(payload.new);
      else onChange?.(payload.new);
    });
  },

  async updateOrderStatus(orderId, status) {
    const rows = unwrap(await supabase.from('orders').update({ status }).eq('id', orderId).select('id'));
    if (!rows.length) throw new Error('No tienes permiso para actualizar este pedido');
  },

  async setIngredientStock({ name, soldOut, note }) {
    return unwrap(
      await supabase.rpc('set_ingredient_stock', { p_name: name, p_sold_out: soldOut, p_note: note || null })
    );
  },

  async listStockEvents(tenantId) {
    const rows = unwrap(
      await supabase
        .from('stock_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(300)
    );
    return rows.map(stockEventFromRow);
  },

  // ------------------------------------------------------------------ Caja
  async listCustomers(tenantId) {
    const rows = unwrap(await supabase.from('customers').select('*').eq('tenant_id', tenantId).order('name'));
    return rows.map(customerFromRow);
  },

  async createCustomer(tenantId, c) {
    const row = unwrap(
      await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: c.name.trim(),
          doc_type: c.docType,
          doc_number: c.docNumber.trim(),
          email: c.email || null,
          phone: c.phone || null
        })
        .select()
        .single()
    );
    return customerFromRow(row);
  },

  async issueInvoice({ orderIds, kind, customerId, paymentMethod }) {
    const row = unwrap(
      await supabase.rpc('issue_invoice', {
        p_order_ids: orderIds,
        p_kind: kind,
        p_customer_id: customerId || null,
        p_payment_method: paymentMethod
      })
    );
    return invoiceFromRow(row);
  },

  async listOpenInvoices(tenantId) {
    const rows = unwrap(
      await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('daily_close_id', null)
        .order('created_at', { ascending: false })
    );
    return rows.map(invoiceFromRow);
  },

  async closeRegister({ countedCash }) {
    return dailyCloseFromRow(unwrap(await supabase.rpc('close_cash_register', { p_counted_cash: countedCash })));
  },

  // Los comprobantes no se publican por realtime: la caja recarga tras cada acción.
  subscribeBilling() {
    return () => {};
  },

  async listDailyCloses(tenantId) {
    const rows = unwrap(
      await supabase
        .from('daily_closes')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(30)
    );
    return rows.map(dailyCloseFromRow);
  },

  // ------------------------------------------------------------------ Administración
  async updateTenant(tenantId, tenant) {
    unwrap(await supabase.from('tenants').update(tenantToRow(tenant)).eq('id', tenantId));
  },

  async saveProduct(tenantId, product) {
    const row = productToRow(product, tenantId);
    const query = product.id
      ? supabase.from('products').update(row).eq('id', product.id)
      : supabase.from('products').insert(row);
    const saved = unwrap(await query.select().single());
    return productFromRow(saved, product.category);
  },

  async setProductAvailable(productId, available) {
    unwrap(await supabase.from('products').update({ available }).eq('id', productId));
  },

  async deleteProduct(productId) {
    unwrap(await supabase.from('products').delete().eq('id', productId));
  },

  async listTables(tenantId) {
    const rows = unwrap(
      await supabase.from('restaurant_tables').select('*').eq('tenant_id', tenantId).order('sort_order')
    );
    return rows.map(tableFromRow);
  },

  async createTables(tenantId, labels) {
    const existing = unwrap(await supabase.from('restaurant_tables').select('sort_order').eq('tenant_id', tenantId));
    const start = existing.reduce((m, r) => Math.max(m, r.sort_order), 0);
    unwrap(
      await supabase
        .from('restaurant_tables')
        .insert(labels.map((label, i) => ({ tenant_id: tenantId, label, sort_order: start + i + 1 })))
    );
  },

  async setTableActive(tableId, isActive) {
    unwrap(await supabase.from('restaurant_tables').update({ is_active: isActive }).eq('id', tableId));
  },

  async regenerateTableToken(tableId) {
    return unwrap(await supabase.rpc('regenerate_table_token', { p_table_id: tableId }));
  },

  async listStaff(tenantId) {
    const rows = unwrap(
      await supabase
        .from('staff_members')
        .select('id, display_name, role, is_active, locked_until, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at')
    );
    return rows.map(staffFromRow);
  },

  async createStaff({ displayName, role, pin }) {
    return unwrap(await supabase.rpc('admin_create_staff', { p_display_name: displayName, p_role: role, p_pin: pin }));
  },

  async updateStaff({ staffId, pin = null, isActive = null, role = null }) {
    unwrap(
      await supabase.rpc('admin_update_staff', {
        p_staff_id: staffId,
        p_pin: pin,
        p_is_active: isActive,
        p_role: role
      })
    );
  },

  async getBillingSettings(tenantId) {
    const [settings, seqs] = await Promise.all([
      supabase.from('billing_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('invoice_sequences').select('*').eq('tenant_id', tenantId)
    ]);
    const s = unwrap(settings);
    return {
      provider: s?.provider || 'simulado',
      environment: s?.environment || 'habilitacion',
      sequences: unwrap(seqs).map(sequenceFromRow)
    };
  },

  async saveBillingSettings(tenantId, { provider, environment, sequences }) {
    unwrap(await supabase.from('billing_settings').update({ provider, environment }).eq('tenant_id', tenantId));
    for (const seq of sequences) {
      unwrap(
        await supabase
          .from('invoice_sequences')
          .upsert(sequenceToRow(seq, tenantId), { onConflict: 'tenant_id,kind' })
      );
    }
  }
};

export { toAppError };
